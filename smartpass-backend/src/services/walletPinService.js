const bcrypt = require('bcryptjs');
const User = require('../models/User');

const TRIVIAL_PINS = new Set([
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999',
  '123456',
  '654321',
]);

const validatePinFormat = (pin, confirmPin) => {
  if (!pin || typeof pin !== 'string' || !/^\d{6}$/.test(pin.trim())) {
    const error = new Error('Mã PIN phải gồm đúng 6 chữ số');
    error.statusCode = 400;
    throw error;
  }
  const cleanPin = pin.trim();
  if (confirmPin !== undefined && cleanPin !== String(confirmPin).trim()) {
    const error = new Error('Xác nhận mã PIN không khớp');
    error.statusCode = 400;
    throw error;
  }
  if (TRIVIAL_PINS.has(cleanPin)) {
    const error = new Error('Mã PIN quá đơn giản, vui lòng chọn mã PIN khác');
    error.statusCode = 400;
    throw error;
  }
  return cleanPin;
};

/**
 * Setup PIN on first login (mandatory).
 * Setup is allowed ONLY when no PIN exists yet.
 */
const setupPin = async (userId, { pin, confirmPin }) => {
  const cleanPin = validatePinFormat(pin, confirmPin);

  const user = await User.findById(userId).select('+pinHash');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.pinHash) {
    const error = new Error('Mã PIN đã được thiết lập, vui lòng sử dụng chức năng đổi PIN');
    error.statusCode = 400;
    throw error;
  }

  const pinHash = await bcrypt.hash(cleanPin, 10);
  user.pinHash = pinHash;
  user.pinSetAt = new Date();
  user.pinFailedAttempts = 0;
  user.pinLockedUntil = null;
  await user.save();

  try {
    const notificationService = require('./notificationService');
    await notificationService.createAndDispatch({
      type: 'PIN_SET',
      audience: 'individual',
      receiver: user._id,
    });
  } catch (notifErr) {
    console.error('[Notification] Error in PIN_SET:', notifErr.message);
  }

  return { message: 'Thiết lập mã PIN thành công' };
};

/**
 * Asserts PIN is set, not locked, and matches.
 * Wrong PIN increments pinFailedAttempts (5 -> 15 min lock).
 * Correct PIN resets pinFailedAttempts to 0.
 */
const assertAndVerifyPin = async (userOrId, pin) => {
  let user;
  if (userOrId && typeof userOrId === 'object' && userOrId._id) {
    user = await User.findById(userOrId._id).select('+pinHash');
  } else {
    user = await User.findById(userOrId).select('+pinHash');
  }

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.pinHash) {
    const error = new Error('Vui lòng thiết lập mã PIN ví trước khi sử dụng');
    error.statusCode = 403;
    error.code = 'PIN_NOT_SET';
    throw error;
  }

  // Check lockout
  if (user.pinLockedUntil && new Date() < new Date(user.pinLockedUntil)) {
    const error = new Error('Mã PIN đã bị khoá tạm thời. Vui lòng thử lại sau');
    error.statusCode = 423;
    error.code = 'PIN_LOCKED';
    throw error;
  }

  const cleanPin = pin ? String(pin).trim() : '';
  const isMatch = cleanPin ? await bcrypt.compare(cleanPin, user.pinHash) : false;

  if (!isMatch) {
    user.pinFailedAttempts = (user.pinFailedAttempts || 0) + 1;
    if (user.pinFailedAttempts >= 5) {
      user.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      try {
        const notificationService = require('./notificationService');
        await notificationService.createAndDispatch({
          type: 'PIN_LOCKED',
          audience: 'individual',
          receiver: user._id,
        });
      } catch (notifErr) {
        console.error('[Notification] Error in PIN_LOCKED:', notifErr.message);
      }
    }
    await user.save();

    if (user.pinFailedAttempts >= 5) {
      const error = new Error('Mã PIN đã bị khoá tạm thời. Vui lòng thử lại sau');
      error.statusCode = 423;
      error.code = 'PIN_LOCKED';
      throw error;
    }

    const error = new Error('Mã PIN không đúng');
    error.statusCode = 401;
    error.code = 'PIN_INVALID';
    throw error;
  }

  // Correct PIN resets counter
  user.pinFailedAttempts = 0;
  user.pinLockedUntil = null;
  await user.save();

  return user;
};

/**
 * Change PIN with oldPin.
 */
const changePin = async (userId, { oldPin, newPin, confirmPin }) => {
  await assertAndVerifyPin(userId, oldPin);
  const cleanNewPin = validatePinFormat(newPin, confirmPin);

  const user = await User.findById(userId).select('+pinHash');
  user.pinHash = await bcrypt.hash(cleanNewPin, 10);
  user.pinSetAt = new Date();
  user.pinFailedAttempts = 0;
  user.pinLockedUntil = null;
  await user.save();

  try {
    const notificationService = require('./notificationService');
    await notificationService.createAndDispatch({
      type: 'PIN_CHANGED',
      audience: 'individual',
      receiver: user._id,
    });
  } catch (notifErr) {
    console.error('[Notification] Error in PIN_CHANGED:', notifErr.message);
  }

  return { message: 'Đổi mã PIN thành công' };
};

/**
 * Reset PIN with Smart OTP.
 */
const resetPin = async (userId, { otpToken, newPin, confirmPin }) => {
  const cleanNewPin = validatePinFormat(newPin, confirmPin);

  const otpService = require('./otpService');
  await otpService.consumeOtpToken(userId, 'RESET_PIN', otpToken);

  const user = await User.findById(userId).select('+pinHash');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.pinHash = await bcrypt.hash(cleanNewPin, 10);
  user.pinSetAt = new Date();
  user.pinFailedAttempts = 0;
  user.pinLockedUntil = null;
  await user.save();

  return { message: 'Đặt lại mã PIN thành công' };
};

module.exports = {
  setupPin,
  assertAndVerifyPin,
  changePin,
  resetPin,
  validatePinFormat,
};

