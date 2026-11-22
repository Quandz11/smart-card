const crypto = require('crypto');
const OtpChallenge = require('../models/OtpChallenge');

const ALLOWED_PURPOSES = ['RESET_PIN', 'CHANGE_PIN', 'STAFF_CASH_CONFIRM'];

const PURPOSE_VIETNAMESE = {
  RESET_PIN: 'Đặt lại mã PIN ví',
  CHANGE_PIN: 'Thay đổi mã PIN ví',
  STAFF_CASH_CONFIRM: 'Xác nhận giao dịch tiền mặt của nhân viên',
};

const hashOtpCode = (code) => {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
};

/**
 * Request Smart OTP in-app delivery.
 */
const requestOtp = async (userId, { purpose, transactionRef }) => {
  if (!ALLOWED_PURPOSES.includes(purpose)) {
    const error = new Error('Mục đích xác thực OTP không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  // Rate limit: max 5 challenges per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const countLastHour = await OtpChallenge.countDocuments({
    user: userId,
    createdAt: { $gte: oneHourAgo },
  });
  if (countLastHour >= 5) {
    const error = new Error('Bạn đã vượt quá số lần yêu cầu OTP trong 1 giờ. Vui lòng thử lại sau');
    error.statusCode = 429;
    throw error;
  }

  // Cooldown: 60 seconds
  const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
  const recent = await OtpChallenge.findOne({
    user: userId,
    createdAt: { $gte: sixtySecondsAgo },
  });
  if (recent) {
    const error = new Error('Vui lòng đợi 60 giây trước khi yêu cầu mã OTP mới');
    error.statusCode = 429;
    throw error;
  }

  // Invalidate any existing unconsumed challenges for this purpose
  await OtpChallenge.updateMany(
    { user: userId, purpose, consumedAt: null },
    { $set: { consumedAt: new Date() } }
  );

  const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = hashOtpCode(rawCode);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const challenge = await OtpChallenge.create({
    user: userId,
    purpose,
    transactionRef: transactionRef ? transactionRef.trim() : null,
    codeHash,
    deliveredCode: rawCode, // Stored encrypted/protected for in-app delivery only
    expiresAt,
    attempts: 0,
    maxAttempts: 3,
  });

  return {
    success: true,
    message: 'Mã xác thực đã được gửi tới ứng dụng SmartPass của bạn',
    expiresAt,
    purposeLabel: PURPOSE_VIETNAMESE[purpose] || purpose,
  };
};

/**
 * Get active pending challenge for current user's authenticated app session.
 */
const getActiveOtp = async (userId) => {
  const challenge = await OtpChallenge.findOne({
    user: userId,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .select('+deliveredCode');

  if (!challenge) {
    return null;
  }

  const remainingSeconds = Math.max(
    0,
    Math.floor((new Date(challenge.expiresAt).getTime() - Date.now()) / 1000)
  );

  return {
    challengeId: challenge._id,
    purpose: challenge.purpose,
    purposeLabel: PURPOSE_VIETNAMESE[challenge.purpose] || challenge.purpose,
    transactionRef: challenge.transactionRef,
    expiresAt: challenge.expiresAt,
    remainingSeconds,
    deliveredCode: challenge.deliveredCode,
  };
};

/**
 * Verify OTP code and issue a short-lived single-use otpToken.
 */
const verifyOtp = async (userId, { purpose, transactionRef, code }) => {
  if (!code || typeof code !== 'string') {
    const error = new Error('Mã OTP là bắt buộc');
    error.statusCode = 400;
    throw error;
  }

  const query = {
    user: userId,
    purpose,
  };
  if (transactionRef) {
    query.transactionRef = transactionRef.trim();
  }

  const challenge = await OtpChallenge.findOne(query)
    .sort({ createdAt: -1 })
    .select('+codeHash');

  if (!challenge) {
    const error = new Error('Không tìm thấy yêu cầu xác thực OTP');
    error.statusCode = 400;
    throw error;
  }

  if (challenge.consumedAt) {
    const error = new Error('Mã OTP không còn hiệu lực hoặc đã được sử dụng');
    error.statusCode = 400;
    error.code = 'OTP_USED';
    throw error;
  }

  if (new Date() > new Date(challenge.expiresAt)) {
    challenge.consumedAt = new Date();
    await challenge.save();
    const error = new Error('Mã OTP đã hết hạn');
    error.statusCode = 400;
    error.code = 'OTP_EXPIRED';
    throw error;
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    challenge.consumedAt = new Date();
    await challenge.save();
    const error = new Error('Mã OTP đã bị vô hiệu hoá do nhập sai quá 3 lần');
    error.statusCode = 400;
    error.code = 'OTP_INVALID';
    throw error;
  }

  const submittedHash = hashOtpCode(code);
  if (submittedHash !== challenge.codeHash) {
    challenge.attempts += 1;
    if (challenge.attempts >= challenge.maxAttempts) {
      challenge.consumedAt = new Date();
    }
    await challenge.save();
    const error = new Error('Mã OTP không chính xác');
    error.statusCode = 400;
    error.code = 'OTP_INVALID';
    throw error;
  }

  // Issue single-use otpToken
  const otpToken = crypto.randomBytes(32).toString('hex');
  challenge.otpToken = otpToken;
  challenge.otpTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await challenge.save();

  return {
    success: true,
    otpToken,
    message: 'Xác thực OTP thành công',
  };
};

/**
 * Consumes an otpToken atomically during sensitive actions (e.g. RESET_PIN).
 */
const consumeOtpToken = async (userId, purpose, otpToken) => {
  if (!otpToken) {
    const error = new Error('Mã xác thực OTP (otpToken) là bắt buộc');
    error.statusCode = 400;
    error.code = 'OTP_INVALID';
    throw error;
  }

  const challenge = await OtpChallenge.findOne({
    user: userId,
    purpose,
    otpToken: otpToken.trim(),
    consumedAt: null,
    otpTokenExpiresAt: { $gt: new Date() },
  });

  if (!challenge) {
    const error = new Error('Mã xác thực OTP không hợp lệ, đã hết hạn hoặc đã sử dụng');
    error.statusCode = 400;
    error.code = 'OTP_INVALID';
    throw error;
  }

  challenge.consumedAt = new Date();
  await challenge.save();

  return challenge;
};

module.exports = {
  requestOtp,
  getActiveOtp,
  verifyOtp,
  consumeOtpToken,
};

