const eventService = require('../services/eventService');

const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body);
    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

const getUpcomingEvents = async (req, res, next) => {
  try {
    const events = await eventService.getUpcomingEvents();
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const registerForEvent = async (req, res, next) => {
  try {
    const registration = await eventService.registerForEvent(
      req.params.id,
      req.user._id
    );
    res.status(201).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

const getMyEvents = async (req, res, next) => {
  try {
    const events = await eventService.getMyEvents(req.user._id);
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const checkInToEvent = async (req, res, next) => {
  try {
    const result = await eventService.checkInToEvent(
      req.params.id,
      req.user,
      req.body
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getUpcomingEvents,
  registerForEvent,
  getMyEvents,
  checkInToEvent,
};

