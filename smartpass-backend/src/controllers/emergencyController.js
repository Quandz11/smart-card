const emergencyService = require('../services/emergencyService');

const getMyEmergencyProfile = async (req, res, next) => {
  try {
    const profile = await emergencyService.getMyEmergencyProfile(req.user._id);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const updateMyEmergencyProfile = async (req, res, next) => {
  try {
    const profile = await emergencyService.updateMyEmergencyProfile(
      req.user._id,
      req.body
    );
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const rotateQrToken = async (req, res, next) => {
  try {
    const result = await emergencyService.rotateQrToken(req.user._id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPublicEmergencyInfo = async (req, res, next) => {
  try {
    const data = await emergencyService.getPublicEmergencyInfo(
      req.params.qrToken
    );
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyEmergencyProfile,
  updateMyEmergencyProfile,
  rotateQrToken,
  getPublicEmergencyInfo,
};

