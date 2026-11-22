const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Card = require('../models/Card');
const logService = require('./logService');
const { withIdempotency } = require('../utils/idempotency');

/**
 * Create a new event (Admin only).
 */
const createEvent = async ({
  title,
  description,
  location,
  startAt,
  endAt,
  capacity,
}) => {
  if (!title || !startAt || !endAt || capacity === undefined) {
    const error = new Error('title, startAt, endAt, and capacity are required');
    error.statusCode = 400;
    throw error;
  }

  const capacityNum = parseInt(capacity, 10);
  if (isNaN(capacityNum) || capacityNum <= 0) {
    const error = new Error('Capacity must be a positive integer greater than 0');
    error.statusCode = 400;
    throw error;
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);
  if (startDate >= endDate) {
    const error = new Error('endAt must be later than startAt');
    error.statusCode = 400;
    throw error;
  }

  const event = await Event.create({
    title: title.trim(),
    description: description ? description.trim() : undefined,
    location: location ? location.trim() : undefined,
    startAt: startDate,
    endAt: endDate,
    capacity: capacityNum,
    registeredCount: 0,
  });

  try {
    const notificationService = require('./notificationService');
    const { formatDate } = require('../constants/notificationCatalog');
    await notificationService.createAndDispatch({
      type: 'EVENT_ANNOUNCED',
      audience: 'all',
      relatedType: 'Event',
      relatedId: event._id,
      templateData: {
        eventName: event.title,
        start: formatDate(event.startAt),
      },
    });
  } catch (e) {}

  return event;
};

/**
 * Get upcoming events, sorted by startAt ascending.
 */
const getUpcomingEvents = async () => {
  const events = await Event.find().sort({ startAt: 1 });
  return events;
};

/**
 * Register student for an event atomically.
 * INV-07: registeredCount increments only if registeredCount < capacity AND (event, student) is new.
 * Full event -> 400. Duplicate registration -> 409.
 */
const registerForEvent = async (eventId, studentId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    throw error;
  }

  // Check duplicate registration
  const existingRegistration = await EventRegistration.findOne({
    event: eventId,
    student: studentId,
  });

  if (existingRegistration) {
    const error = new Error('Already registered for this event');
    error.statusCode = 409;
    throw error;
  }

  // Atomic update: only increment if registeredCount < capacity
  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventId,
      $expr: { $lt: ['$registeredCount', '$capacity'] },
    },
    {
      $inc: { registeredCount: 1 },
    },
    {
      new: true,
    }
  );

  if (!updatedEvent) {
    const error = new Error('Event is full');
    error.statusCode = 400;
    throw error;
  }

  let registration;
  try {
    registration = await EventRegistration.create({
      event: eventId,
      student: studentId,
      registeredAt: new Date(),
    });
  } catch (err) {
    // Rollback atomic counter increment if duplicate insert race occurs
    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });
    if (err.code === 11000) {
      const error = new Error('Already registered for this event');
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }

  // Find user's card for AccessLog
  const card = await Card.findOne({ owner: studentId, status: 'active' });

  // INV-04: Write AccessLog
  await logService.recordLog({
    card: card ? card._id : null,
    owner: studentId,
    action: 'event_register',
    location: event.location || 'Event Hall',
    detail: `Registered for event "${event.title}"`,
    createdBy: studentId,
  });

  try {
    const notificationService = require('./notificationService');
    await notificationService.createAndDispatch({
      type: 'EVENT_REGISTERED',
      audience: 'individual',
      receiver: studentId,
      relatedType: 'Event',
      relatedId: event._id,
      templateData: {
        eventName: event.title,
      },
    });
  } catch (e) {}

  return registration;
};

/**
 * Get events registered by current student.
 */
const getMyEvents = async (studentId) => {
  const registrations = await EventRegistration.find({ student: studentId })
    .populate('event')
    .sort({ registeredAt: -1 });

  return registrations.map((r) => r.event).filter(Boolean);
};

/**
 * Check-in to event using QR scan.
 * Marks arrivedAt timestamp on EventRegistration. Auto-registers if not yet registered.
 */
const checkInToEvent = async (eventId, user, body = {}) => {
  const { qrType, idempotencyKey } = body;
  if (qrType && !['EVENT', 'EVENT_CHECKIN'].includes(qrType)) {
    const error = new Error('Mã QR không dùng cho chức năng này');
    error.statusCode = 400;
    throw error;
  }

  const studentId = user._id;

  const executeCheckin = async () => {
    let registration = await EventRegistration.findOne({
      event: eventId,
      student: studentId,
    });

    if (!registration) {
      // Auto-register if not yet registered and seats available
      registration = await registerForEvent(eventId, studentId);
    }

    registration.arrivedAt = new Date();
    await registration.save();

    return registration;
  };

  if (idempotencyKey) {
    return withIdempotency(idempotencyKey, executeCheckin);
  }
  return executeCheckin();
};

module.exports = {
  createEvent,
  getUpcomingEvents,
  registerForEvent,
  getMyEvents,
  checkInToEvent,
};

