const parkingService = require('../services/parkingService');

const checkIn = async (req, res, next) => {
  try {
    const session = await parkingService.checkIn(req.body, req.user);
    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const session = await parkingService.checkOut(req.body, req.user);
    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const getMySessions = async (req, res, next) => {
  try {
    const sessions = await parkingService.getMySessions(req.user._id);
    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

const getActiveSessions = async (req, res, next) => {
  try {
    const sessions = await parkingService.getActiveSessions();
    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMySessions,
  getActiveSessions,
};

