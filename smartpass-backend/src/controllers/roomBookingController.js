const roomBookingService = require('../services/roomBookingService');

const getAvailability = async (req, res, next) => {
  try {
    const slots = await roomBookingService.getAvailability({
      date: req.query.date,
      room: req.query.room,
    });
    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const booking = await roomBookingService.createBooking(
      req.body,
      req.user._id
    );
    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const approveBooking = async (req, res, next) => {
  try {
    const booking = await roomBookingService.approveBooking(req.params.id);
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const rejectBooking = async (req, res, next) => {
  try {
    const booking = await roomBookingService.rejectBooking(req.params.id);
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await roomBookingService.getMyBookings(req.user._id);
    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await roomBookingService.cancelBooking(
      req.params.id,
      req.user._id,
      req.user.role
    );
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailability,
  createBooking,
  approveBooking,
  rejectBooking,
  getMyBookings,
  cancelBooking,
};
