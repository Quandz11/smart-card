const crypto = require('crypto');
const TopupOrder = require('../models/TopupOrder');
const Wallet = require('../models/Wallet');
const CanteenTransaction = require('../models/CanteenTransaction');
const AccessLog = require('../models/AccessLog');

const isConfigured = () => {
  return Boolean(
    process.env.VNPAY_TMN_CODE &&
      process.env.VNPAY_HASH_SECRET &&
      process.env.VNPAY_URL &&
      process.env.VNPAY_RETURN_URL &&
      process.env.VNPAY_IPN_URL
  );
};

const formatVnpDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}${m}${d}${h}${mi}${s}`;
};

const sortObject = (obj) => {
  const sorted = {};
  const str = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (let key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
};

const computeSignature = (params, secret) => {
  const sortedParams = sortObject(params);
  const signData = Object.keys(sortedParams)
    .map((k) => `${k}=${sortedParams[k]}`)
    .join('&');
  const hmac = crypto.createHmac('sha512', secret);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
};

const verifySignature = (query, secret) => {
  if (!query || !query.vnp_SecureHash) {
    return false;
  }
  const secureHash = query.vnp_SecureHash;
  const clone = { ...query };
  delete clone.vnp_SecureHash;
  delete clone.vnp_SecureHashType;

  const expectedHash = computeSignature(clone, secret);
  return expectedHash.toLowerCase() === String(secureHash).toLowerCase();
};

/**
 * Create a new pending topup order and return signed VNPay payment URL.
 */
const createTopupOrder = async (userId, { amount }, clientIp) => {
  if (!isConfigured()) {
    const error = new Error('Cổng thanh toán VNPay chưa được cấu hình');
    error.statusCode = 503;
    throw error;
  }

  const numAmount = parseInt(amount, 10);
  if (!numAmount || isNaN(numAmount) || numAmount < 10000 || numAmount > 5000000) {
    const error = new Error('Số tiền nạp phải từ 10.000 ₫ đến 5.000.000 ₫');
    error.statusCode = 400;
    throw error;
  }

  const wallet = await Wallet.findOne({ owner: userId });
  if (!wallet) {
    const error = new Error('Wallet not found');
    error.statusCode = 404;
    throw error;
  }

  const txnRef = `VNP${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

  const order = await TopupOrder.create({
    student: userId,
    wallet: wallet._id,
    amount: numAmount,
    txnRef,
    status: 'PENDING',
  });

  const ipAddr = clientIp ? clientIp.replace('::ffff:', '') : '127.0.0.1';
  const createDate = formatVnpDate(new Date());

  const vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: `Nap tien vi SmartPass ${txnRef}`,
    vnp_OrderType: 'topup',
    vnp_Amount: numAmount * 100,
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  const secureHash = computeSignature(vnpParams, process.env.VNPAY_HASH_SECRET);
  vnpParams.vnp_SecureHash = secureHash;

  const sortedParams = sortObject(vnpParams);
  const queryString = Object.keys(sortedParams)
    .map((k) => `${k}=${sortedParams[k]}`)
    .join('&');

  const paymentUrl = `${process.env.VNPAY_URL}?${queryString}`;

  return {
    paymentUrl,
    order: {
      txnRef: order.txnRef,
      amount: order.amount,
      status: order.status,
      createdAt: order.createdAt,
    },
  };
};

/**
 * Handle browser return URL (GET /api/wallet/vnpay/return).
 * Verifies signature and reports display state. NEVER credits wallet!
 */
const verifyReturnUrl = (query) => {
  if (!isConfigured()) {
    const error = new Error('Cổng thanh toán VNPay chưa được cấu hình');
    error.statusCode = 503;
    throw error;
  }

  const isValid = verifySignature(query, process.env.VNPAY_HASH_SECRET);
  const responseCode = query.vnp_ResponseCode || '99';
  const isSuccess = isValid && responseCode === '00';

  return {
    isValid,
    isSuccess,
    txnRef: query.vnp_TxnRef,
    amount: query.vnp_Amount ? parseInt(query.vnp_Amount, 10) / 100 : 0,
    responseCode,
    message: isSuccess
      ? 'Giao dịch VNPay thành công'
      : 'Giao dịch VNPay không thành công hoặc bị huỷ',
  };
};

/**
 * Process server-to-server IPN notification (GET /api/wallet/vnpay/ipn).
 * Atomic wallet crediting on success. Idempotent across multiple deliveries.
 */
const processIpn = async (query) => {
  if (!isConfigured()) {
    return { RspCode: '99', Message: 'VNPay not configured' };
  }

  const isValid = verifySignature(query, process.env.VNPAY_HASH_SECRET);
  if (!isValid) {
    return { RspCode: '97', Message: 'Invalid Checksum' };
  }

  if (query.vnp_TmnCode !== process.env.VNPAY_TMN_CODE) {
    return { RspCode: '97', Message: 'Invalid Checksum' };
  }

  const txnRef = query.vnp_TxnRef;
  const order = await TopupOrder.findOne({ txnRef });
  if (!order) {
    return { RspCode: '01', Message: 'Order not found' };
  }

  const rawAmount = parseInt(query.vnp_Amount, 10);
  if (isNaN(rawAmount) || rawAmount !== order.amount * 100) {
    return { RspCode: '04', Message: 'Invalid amount' };
  }

  // Idempotency: order already paid/confirmed
  if (order.status === 'PAID') {
    return { RspCode: '02', Message: 'Order already confirmed' };
  }
  if (order.status !== 'PENDING') {
    return { RspCode: '02', Message: 'Order already processed' };
  }

  if (query.vnp_ResponseCode === '00') {
    order.status = 'PAID';
    order.vnpTransactionNo = query.vnp_TransactionNo || null;
    order.vnpResponseCode = query.vnp_ResponseCode;
    order.paidAt = new Date();
    await order.save();

    const wallet = await Wallet.findById(order.wallet);
    wallet.balance += order.amount;
    const balanceAfter = wallet.balance;
    await wallet.save();

    await CanteenTransaction.create({
      wallet: wallet._id,
      owner: order.student,
      type: 'topup',
      amount: order.amount,
      balanceAfter,
      note: `Nạp tiền VNPay (${txnRef})`,
      createdBy: order.student,
    });

    await AccessLog.create({
      owner: order.student,
      action: 'canteen_topup',
      location: 'VNPay Sandbox',
      detail: `Nạp tiền trực tuyến VNPay: ${order.amount} VND`,
      createdBy: order.student,
    });

    try {
      const notificationService = require('./notificationService');
      const { formatCurrency } = require('../constants/notificationCatalog');
      await notificationService.createAndDispatch({
        type: 'WALLET_TOPUP_VNPAY',
        audience: 'individual',
        receiver: order.student,
        relatedType: 'TopupOrder',
        relatedId: order._id,
        templateData: {
          amount: formatCurrency(order.amount),
          balance: formatCurrency(balanceAfter),
        },
      });
    } catch (notifErr) {
      console.error('[Notification] Error in vnpay processIpn:', notifErr.message);
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  // Failed transaction
  order.status = 'FAILED';
  order.vnpResponseCode = query.vnp_ResponseCode;
  await order.save();
  return { RspCode: '00', Message: 'Confirm Success' };
};

/**
 * Get order status by txnRef for student polling.
 */
const getOrder = async (userId, userRole, txnRef) => {
  const order = await TopupOrder.findOne({ txnRef: String(txnRef).trim() });
  if (!order) {
    const error = new Error('Không tìm thấy đơn nạp tiền');
    error.statusCode = 404;
    throw error;
  }

  if (userRole !== 'admin' && String(order.student) !== String(userId)) {
    const error = new Error('Bạn không có quyền truy cập đơn nạp tiền này');
    error.statusCode = 403;
    throw error;
  }

  return order;
};

module.exports = {
  isConfigured,
  createTopupOrder,
  verifyReturnUrl,
  processIpn,
  getOrder,
  computeSignature,
  verifySignature,
  sortObject,
};

