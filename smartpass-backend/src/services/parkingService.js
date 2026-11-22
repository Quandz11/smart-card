const ParkingSession = require('../models/ParkingSession');
const Card = require('../models/Card');
const User = require('../models/User');
const cardService = require('./cardService');
const logService = require('./logService');
const { withIdempotency } = require('../utils/idempotency');

/**
 * Check-in vehicle to parking using card or student app scan.
 * INV-05: One card has AT MOST one ParkingSession with status="in".
 */
const checkIn = async (body, userOrId) => {
  const { cardCode, qrToken, nfcUid, vehiclePlate, qrType, idempotencyKey } = body || {};

  // Check type mismatch
  if (qrType && qrType !== 'PARKING_IN') {
    const error = new Error('Mã QR không dùng cho chức năng này');
    error.statusCode = 400;
    throw error;
  }

  let user = null;
  if (userOrId && typeof userOrId === 'object' && userOrId._id) {
    user = userOrId;
  } else if (userOrId) {
    user = await User.findById(userOrId);
  }
  const createdBy = user ? user._id : userOrId;

  const executeCheckIn = async () => {
    // Resolve card and run INV-02
    let card;
    if (user && user.role === 'student' && !cardCode && !qrToken && !nfcUid) {
      card = await Card.findOne({ owner: user._id, status: 'active' });
      if (!card) {
        const error = new Error('Thẻ sinh viên không khả dụng');
        error.statusCode = 403;
        throw error;
      }
      await cardService.assertCardUsable(card);
    } else {
      card = await cardService.resolveCard({ cardCode, qrToken, nfcUid });
    }

    // INV-05: Check open session
    const activeSession = await ParkingSession.findOne({
      card: card._id,
      status: 'in',
    });

    if (activeSession) {
      const error = new Error('Card already has an active parking session');
      error.statusCode = 409;
      throw error;
    }

    const session = await ParkingSession.create({
      card: card._id,
      owner: card.owner,
      vehiclePlate: vehiclePlate ? vehiclePlate.trim() : undefined,
      checkInAt: new Date(),
      status: 'in',
    });

    // INV-04: Write AccessLog
    await logService.recordLog({
      card: card._id,
      owner: card.owner,
      action: 'parking_in',
      location: 'Parking Gate',
      detail: `Check-in vehicle${vehiclePlate ? ` (${vehiclePlate})` : ''}`,
      createdBy,
    });

    try {
      const notificationService = require('./notificationService');
      const { formatDate } = require('../constants/notificationCatalog');
      await notificationService.createAndDispatch({
        type: 'PARKING_CHECKIN',
        audience: 'individual',
        receiver: card.owner,
        actor: createdBy,
        relatedType: 'ParkingSession',
        relatedId: session._id,
        templateData: {
          plate: vehiclePlate || card.cardCode,
          time: formatDate(session.checkInAt),
        },
      });
    } catch (e) {}

    return session;
  };

  if (idempotencyKey) {
    return withIdempotency(idempotencyKey, executeCheckIn);
  }
  return executeCheckIn();
};

/**
 * Check-out vehicle and calculate fee.
 * Fee = ceil(hours parked) x 2000 VND (minimum 1 hour = 2000 VND).
 */
const checkOut = async (body, userOrId) => {
  const { cardCode, qrToken, nfcUid, qrType, idempotencyKey } = body || {};

  // Check type mismatch
  if (qrType && qrType !== 'PARKING_OUT') {
    const error = new Error('Mã QR không dùng cho chức năng này');
    error.statusCode = 400;
    throw error;
  }

  let user = null;
  if (userOrId && typeof userOrId === 'object' && userOrId._id) {
    user = userOrId;
  } else if (userOrId) {
    user = await User.findById(userOrId);
  }
  const createdBy = user ? user._id : userOrId;

  const executeCheckOut = async () => {
    // Resolve card and run INV-02
    let card;
    if (user && user.role === 'student' && !cardCode && !qrToken && !nfcUid) {
      card = await Card.findOne({ owner: user._id, status: 'active' });
      if (!card) {
        const error = new Error('Thẻ sinh viên không khả dụng');
        error.statusCode = 403;
        throw error;
      }
      await cardService.assertCardUsable(card);
    } else {
      card = await cardService.resolveCard({ cardCode, qrToken, nfcUid });
    }

    const session = await ParkingSession.findOne({
      card: card._id,
      status: 'in',
    });

    if (!session) {
      const error = new Error('No active parking session found for this card');
      error.statusCode = 404;
      throw error;
    }

    const checkOutAt = new Date();
    const diffMs = checkOutAt.getTime() - new Date(session.checkInAt).getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const hours = diffHours <= 0 ? 1 : diffHours;
    const fee = hours * 2000;

    session.checkOutAt = checkOutAt;
    session.fee = fee;
    session.status = 'out';
    await session.save();

    // INV-04: Write AccessLog
    await logService.recordLog({
      card: card._id,
      owner: card.owner,
      action: 'parking_out',
      location: 'Parking Gate',
      detail: `Check-out: ${hours}h parked, fee ${fee} VND`,
      createdBy,
    });

    try {
      const notificationService = require('./notificationService');
      const { formatCurrency } = require('../constants/notificationCatalog');
      await notificationService.createAndDispatch({
        type: 'PARKING_CHECKOUT',
        audience: 'individual',
        receiver: card.owner,
        actor: createdBy,
        relatedType: 'ParkingSession',
        relatedId: session._id,
        templateData: {
          plate: session.vehiclePlate || card.cardCode,
          fee: formatCurrency(fee),
        },
      });
    } catch (e) {}

    return session;
  };

  if (idempotencyKey) {
    return withIdempotency(idempotencyKey, executeCheckOut);
  }
  return executeCheckOut();
};

/**
 * Get current student's parking sessions.
 */
const getMySessions = async (userId) => {
  const sessions = await ParkingSession.find({ owner: userId })
    .sort({ checkInAt: -1 })
    .populate('card', 'cardCode');
  return sessions;
};

/**
 * Get active parking sessions (status="in").
 */
const getActiveSessions = async () => {
  const sessions = await ParkingSession.find({ status: 'in' })
    .sort({ checkInAt: -1 })
    .populate('card', 'cardCode')
    .populate('owner', 'fullName email studentCode');
  return sessions;
};

module.exports = {
  checkIn,
  checkOut,
  getMySessions,
  getActiveSessions,
};

