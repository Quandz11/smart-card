const otpService = require('../services/otpService');

const requestOtp = async (req, res, next) => {
  try {
    const result = await otpService.requestOtp(req.user._id, req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getActiveOtp = async (req, res, next) => {
  try {
    const result = await otpService.getActiveOtp(req.user._id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const result = await otpService.verifyOtp(req.user._id, req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestOtp,
  getActiveOtp,
  verifyOtp,
};

