const RoomBooking = require('../models/RoomBooking');

/**
 * Check if two time strings "HH:mm" overlap.
 * Overlap exists if startA < endB && endA > startB.
 */
const timesOverlap = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

/**
 * Normalize a date to start of day for comparison.
 */
const getDateRange = (dateStr) => {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Get room availability (approved bookings for room and date).
 */
const getAvailability = async ({ date, room }) => {
  if (!date || !room) {
    const error = new Error('Both date and room query parameters are required');
    error.statusCode = 400;
    throw error;
  }

  const { start, end } = getDateRange(date);

  const bookings = await RoomBooking.find({
    room: room.trim(),
    date: { $gte: start, $lte: end },
    status: 'approved',
  }).select('startTime endTime purpose');

  return bookings;
};

/**
 * Create a new room booking request.
 * INV-08: Same room + same date + overlapping time + status="approved" -> 409.
 */
const createBooking = async ({ room, date, startTime, endTime, purpose }, bookedBy) => {
  if (!room || !date || !startTime || !endTime) {
    const error = new Error('room, date, startTime, and endTime are required');
    error.statusCode = 400;
    throw error;
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    const error = new Error('Time format must be HH:mm (24-hour format)');
    error.statusCode = 400;
    throw error;
  }

  if (startTime >= endTime) {
    const error = new Error('endTime must be later than startTime');
    error.statusCode = 400;
    throw error;
  }

  const { start, end } = getDateRange(date);

  // Check for conflicting approved bookings (INV-08)
  const existingApproved = await RoomBooking.find({
    room: room.trim(),
    date: { $gte: start, $lte: end },
    status: 'approved',
  });

  const conflict = existingApproved.some((b) =>
    timesOverlap(startTime, endTime, b.startTime, b.endTime)
  );

  if (conflict) {
    const error = new Error('Room is already booked for this time slot');
    error.statusCode = 409;
    throw error;
  }

  const booking = await RoomBooking.create({
    room: room.trim(),
    bookedBy,
    date: new Date(date),
    startTime,
    endTime,
    purpose: purpose ? purpose.trim() : undefined,
    status: 'pending',
  });

  try {
    const notificationService = require('./notificationService');
    const User = require('../models/User');
    const booker = await User.findById(bookedBy);
    await notificationService.createAndDispatch({
      type: 'ROOM_BOOKING_PENDING',
      audience: 'role',
      role: 'admin',
      actor: bookedBy,
      relatedType: 'RoomBooking',
      relatedId: booking._id,
      templateData: {
        studentName: booker ? booker.fullName : 'Học sinh',
        roomName: booking.room,
        start: `${booking.date.toISOString().slice(0, 10)} ${booking.startTime}`,
        end: booking.endTime,
      },
    });
  } catch (e) {}

  return booking;
};

/**
 * Approve a pending room booking (Admin only).
 * Re-checks INV-08 conflict before approving.
 */
const approveBooking = async (id) => {
  const booking = await RoomBooking.findById(id);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.status !== 'pending') {
    const error = new Error('Only a pending booking can be approved');
    error.statusCode = 400;
    throw error;
  }

  const { start, end } = getDateRange(booking.date);

  const conflicts = await RoomBooking.find({
    _id: { $ne: booking._id },
    room: booking.room,
    date: { $gte: start, $lte: end },
    status: 'approved',
  });

  const hasConflict = conflicts.some((b) =>
    timesOverlap(booking.startTime, booking.endTime, b.startTime, b.endTime)
  );

  if (hasConflict) {
    const error = new Error('Room is already booked for this time slot');
    error.statusCode = 409;
    throw error;
  }

  booking.status = 'approved';
  await booking.save();

  try {
    const notificationService = require('./notificationService');
    const dateStr = booking.date instanceof Date ? booking.date.toISOString().slice(0, 10) : String(booking.date);
    await notificationService.createAndDispatch({
      type: 'ROOM_BOOKING_APPROVED',
      audience: 'individual',
      receiver: booking.bookedBy,
      relatedType: 'RoomBooking',
      relatedId: booking._id,
      templateData: {
        roomName: booking.room,
        start: `${dateStr} ${booking.startTime}`,
        end: booking.endTime,
      },
    });
  } catch (e) {}

  return booking;
};

/**
 * Reject a pending room booking (Admin only).
 */
const rejectBooking = async (id) => {
  const booking = await RoomBooking.findById(id);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.status !== 'pending') {
    const error = new Error('Only a pending booking can be rejected');
    error.statusCode = 400;
    throw error;
  }

  booking.status = 'rejected';
  await booking.save();

  try {
    const notificationService = require('./notificationService');
    const dateStr = booking.date instanceof Date ? booking.date.toISOString().slice(0, 10) : String(booking.date);
    await notificationService.createAndDispatch({
      type: 'ROOM_BOOKING_REJECTED',
      audience: 'individual',
      receiver: booking.bookedBy,
      relatedType: 'RoomBooking',
      relatedId: booking._id,
      templateData: {
        roomName: booking.room,
        start: `${dateStr} ${booking.startTime}`,
        end: booking.endTime,
      },
    });
  } catch (e) {}

  return booking;
};

/**
 * Get current user's room bookings.
 */
const getMyBookings = async (userId) => {
  return RoomBooking.find({ bookedBy: userId }).sort({ date: -1, startTime: -1 });
};

/**
 * Cancel a room booking (Owner only).
 */
const cancelBooking = async (id, userId, role) => {
  const booking = await RoomBooking.findById(id);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (role !== 'admin' && booking.bookedBy.toString() !== userId.toString()) {
    const error = new Error('You do not have permission for this action');
    error.statusCode = 403;
    throw error;
  }

  booking.status = 'cancelled';
  await booking.save();

  try {
    const notificationService = require('./notificationService');
    const dateStr = booking.date instanceof Date ? booking.date.toISOString().slice(0, 10) : String(booking.date);
    await notificationService.createAndDispatch({
      type: 'ROOM_BOOKING_CANCELLED',
      audience: 'individual',
      receiver: booking.bookedBy,
      relatedType: 'RoomBooking',
      relatedId: booking._id,
      templateData: {
        roomName: booking.room,
        start: `${dateStr} ${booking.startTime}`,
        end: booking.endTime,
      },
    });
  } catch (e) {}

  return booking;
};

module.exports = {
  getAvailability,
  createBooking,
  approveBooking,
  rejectBooking,
  getMyBookings,
  cancelBooking,
};
