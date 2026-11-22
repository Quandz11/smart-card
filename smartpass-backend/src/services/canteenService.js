const Wallet = require('../models/Wallet');
const CanteenTransaction = require('../models/CanteenTransaction');
const Card = require('../models/Card');
const User = require('../models/User');
const cardService = require('./cardService');
const logService = require('./logService');
const { withIdempotency } = require('../utils/idempotency');

/**
 * Get current user's wallet balance.
 */
const getMyWallet = async (userId) => {
  let wallet = await Wallet.findOne({ owner: userId });
  if (!wallet) {
    wallet = await Wallet.create({ owner: userId, balance: 0 });
  }
  return { balance: wallet.balance };
};

/**
 * Top up user's wallet (Admin / Canteen Staff).
 * A3 & A5: ONLY the acting staff member confirms with their own PIN.
 */
const topUpWallet = async (body, actingStaff) => {
  const { userId, amount, note, pin, idempotencyKey } = body || {};
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    const error = new Error('Amount must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

  const executeTopup = async () => {
    // Verify acting staff PIN (A3, A5)
    const walletPinService = require('./walletPinService');
    const staffId = actingStaff && actingStaff._id ? actingStaff._id : actingStaff;
    if (staffId) {
      const staffUser = await User.findById(staffId).select('+pinHash');
      await walletPinService.assertAndVerifyPin(staffUser, pin);
    }

    let wallet = await Wallet.findOne({ owner: userId });
    if (!wallet) {
      wallet = await Wallet.create({ owner: userId, balance: 0 });
    }

    wallet.balance += numericAmount;
    const balanceAfter = wallet.balance;
    await wallet.save();

    const transaction = await CanteenTransaction.create({
      wallet: wallet._id,
      owner: userId,
      type: 'topup',
      amount: numericAmount,
      balanceAfter,
      note: note ? String(note).trim() : 'Wallet Top-up',
      createdBy: staffId,
    });

    try {
      const notificationService = require('./notificationService');
      const { formatCurrency } = require('../constants/notificationCatalog');
      await notificationService.createAndDispatch({
        type: 'WALLET_TOPUP_STAFF',
        audience: 'individual',
        receiver: userId,
        actor: staffId,
        relatedType: 'WalletTransaction',
        relatedId: transaction._id,
        templateData: {
          amount: formatCurrency(numericAmount),
          balance: formatCurrency(balanceAfter),
        },
      });
    } catch (notifErr) {
      console.error('[Notification] Error in topUpWallet:', notifErr.message);
    }

    return {
      wallet: { balance: wallet.balance },
      transaction,
    };
  };

  if (idempotencyKey) {
    return withIdempotency(idempotencyKey, executeTopup);
  }
  return executeTopup();
};

/**
 * Pay from wallet using card identifier or student self-payment.
 * INV-03: Insufficient balance fails with 400 and changes NOTHING (no transaction, no log).
 */
const payFromWallet = async (body, userOrId) => {
  const { cardCode, qrToken, nfcUid, amount, qrType, nonce, idempotencyKey } = body || {};
  let user = null;
  if (userOrId && typeof userOrId === 'object' && userOrId._id) {
    user = userOrId;
  } else if (userOrId) {
    user = await User.findById(userOrId);
  }
  const createdBy = user ? user._id : userOrId;

  // Check type mismatch
  if (qrType && !['CANTEEN_POINT', 'PAYMENT_REQUEST'].includes(qrType)) {
    const error = new Error('Mã QR không dùng cho chức năng này');
    error.statusCode = 400;
    throw error;
  }

  const executePayment = async () => {
    let finalAmount = Number(amount);

    if (qrType === 'PAYMENT_REQUEST' || nonce) {
      const { canteenPaymentRequestStore } = require('./qrService');
      const payReq = canteenPaymentRequestStore.get(nonce);
      if (!payReq || payReq.isUsed) {
        const error = new Error('Yêu cầu thanh toán không tồn tại hoặc đã được sử dụng');
        error.statusCode = 400;
        throw error;
      }
      const nowEpoch = Math.floor(Date.now() / 1000);
      if (payReq.expiryEpoch < nowEpoch) {
        const error = new Error('Yêu cầu thanh toán đã hết hạn');
        error.statusCode = 400;
        throw error;
      }
      finalAmount = payReq.amount;
      payReq.isUsed = true;
    }

    if (!finalAmount || finalAmount <= 0) {
      const error = new Error('Amount must be greater than 0');
      error.statusCode = 400;
      throw error;
    }

    // Resolve card and run INV-02
    let card;
    if (user && user.role === 'student' && !cardCode && !qrToken && !nfcUid) {
      card = await Card.findOne({ owner: user._id, status: 'active' });
      if (!card) {
        const error = new Error('Thẻ sinh viên không khả dụng');
        error.statusCode = 403;
        throw error;
      }
      await cardService.assertCardUsable(card);
    } else {
      card = await cardService.resolveCard({ cardCode, qrToken, nfcUid });
    }

    // A3: Verify PIN of card owner/payer
    const walletPinService = require('./walletPinService');
    const payerUser = await User.findById(card.owner).select('+pinHash');
    await walletPinService.assertAndVerifyPin(payerUser, body.pin);

    let wallet = await Wallet.findOne({ owner: card.owner });
    if (!wallet) {
      const error = new Error('Wallet not found');
      error.statusCode = 400;
      throw error;
    }

    // INV-03: Balance check
    if (wallet.balance < finalAmount) {
      const error = new Error('Insufficient wallet balance');
      error.statusCode = 400;
      throw error;
    }

    wallet.balance -= finalAmount;
    const balanceAfter = wallet.balance;
    await wallet.save();

    const transaction = await CanteenTransaction.create({
      wallet: wallet._id,
      owner: card.owner,
      type: 'pay',
      amount: finalAmount,
      balanceAfter,
      note: 'Canteen payment',
      createdBy,
    });

    // INV-04: Write AccessLog only on successful payment
    await logService.recordLog({
      card: card._id,
      owner: card.owner,
      action: 'canteen_pay',
      location: 'Canteen',
      detail: `Paid ${finalAmount} VND. Remaining balance: ${balanceAfter} VND`,
      createdBy,
    });

    try {
      const notificationService = require('./notificationService');
      const { formatCurrency } = require('../constants/notificationCatalog');
      await notificationService.createAndDispatch({
        type: 'WALLET_PAYMENT',
        audience: 'individual',
        receiver: card.owner,
        actor: createdBy,
        relatedType: 'WalletTransaction',
        relatedId: transaction._id,
        templateData: {
          amount: formatCurrency(finalAmount),
          place: 'Căn tin trường',
          balance: formatCurrency(balanceAfter),
        },
      });
    } catch (notifErr) {
      console.error('[Notification] Error in payFromWallet:', notifErr.message);
    }

    return {
      transaction,
      balance: balanceAfter,
    };
  };

  if (idempotencyKey) {
    return withIdempotency(idempotencyKey, executePayment);
  }
  return executePayment();
};

/**
 * Get current student's wallet transactions.
 */
const getMyTransactions = async (userId) => {
  const transactions = await CanteenTransaction.find({ owner: userId }).sort({
    createdAt: -1,
  });
  return transactions;
};

/**
 * Get all transactions with pagination (Admin).
 */
const getAllTransactions = async ({ page = 1, limit = 20 }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    CanteenTransaction.find()
      .populate('owner', 'fullName email studentCode')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    CanteenTransaction.countDocuments(),
  ]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
    },
  };
};

module.exports = {
  getMyWallet,
  topUpWallet,
  payFromWallet,
  getMyTransactions,
  getAllTransactions,
};

