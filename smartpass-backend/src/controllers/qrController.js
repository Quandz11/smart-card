const qrService = require('../services/qrService');

const resolveQr = async (req, res, next) => {
  try {
    const { qrValue } = req.body;
    if (!qrValue) {
      return res.status(400).json({ success: false, message: 'qrValue is required' });
    }
    const result = await qrService.resolveQr(qrValue, req.user);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getQrCodes = async (req, res, next) => {
  try {
    const result = await qrService.getQrCodes(req.query);
    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

const createQrCode = async (req, res, next) => {
  try {
    const result = await qrService.createQrCode(req.body, req.user);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const revokeQrCode = async (req, res, next) => {
  try {
    const result = await qrService.revokeQrCode(req.params.publicId);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const regenerateQrCode = async (req, res, next) => {
  try {
    const result = await qrService.regenerateQrCode(req.params.publicId, req.user);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const confirmGatePass = async (req, res, next) => {
  try {
    const result = await qrService.confirmGatePass(req.body, req.user);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const generateAttendanceQr = async (req, res, next) => {
  try {
    const result = await qrService.generateAttendanceSessionQr(req.params.classSession, req.user);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const generatePaymentRequest = async (req, res, next) => {
  try {
    const result = await qrService.generatePaymentRequestQr(req.body, req.user);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const generateEventCheckin = async (req, res, next) => {
  try {
    const result = await qrService.generateEventCheckinQr(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  resolveQr,
  getQrCodes,
  createQrCode,
  revokeQrCode,
  regenerateQrCode,
  confirmGatePass,
  generateAttendanceQr,
  generatePaymentRequest,
  generateEventCheckin
};

