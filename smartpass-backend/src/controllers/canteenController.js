const canteenService = require('../services/canteenService');
const walletPinService = require('../services/walletPinService');
const vnpayService = require('../services/vnpayService');

const getMyWallet = async (req, res, next) => {
  try {
    const wallet = await canteenService.getMyWallet(req.user._id);
    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

const topUpWallet = async (req, res, next) => {
  try {
    const result = await canteenService.topUpWallet(req.body, req.user);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const payFromWallet = async (req, res, next) => {
  try {
    const result = await canteenService.payFromWallet(req.body, req.user);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyTransactions = async (req, res, next) => {
  try {
    const transactions = await canteenService.getMyTransactions(req.user._id);
    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

const getAllTransactions = async (req, res, next) => {
  try {
    const result = await canteenService.getAllTransactions({
      page: req.query.page,
      limit: req.query.limit,
    });
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// PIN Controllers
const setupPin = async (req, res, next) => {
  try {
    const result = await walletPinService.setupPin(req.user._id, req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const changePin = async (req, res, next) => {
  try {
    const result = await walletPinService.changePin(req.user._id, req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const resetPin = async (req, res, next) => {
  try {
    const result = await walletPinService.resetPin(req.user._id, req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// VNPay Controllers
const createVnpayOrder = async (req, res, next) => {
  try {
    const result = await vnpayService.createTopupOrder(req.user._id, req.body, req.ip);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const vnpayReturn = (req, res, next) => {
  try {
    const result = vnpayService.verifyReturnUrl(req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const vnpayIpn = async (req, res) => {
  try {
    const result = await vnpayService.processIpn(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

const getVnpayOrder = async (req, res, next) => {
  try {
    const order = await vnpayService.getOrder(req.user._id, req.user.role, req.params.txnRef);
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyWallet,
  topUpWallet,
  payFromWallet,
  getMyTransactions,
  getAllTransactions,
  setupPin,
  changePin,
  resetPin,
  createVnpayOrder,
  vnpayReturn,
  vnpayIpn,
  getVnpayOrder,
};
