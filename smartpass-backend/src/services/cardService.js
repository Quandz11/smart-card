const crypto = require('crypto');
const mongoose = require('mongoose');
const Card = require('../models/Card');
const User = require('../models/User');
const assertCardUsable = require('../utils/assertCardUsable');
const logService = require('./logService');

/**
 * Create a new card for a user with cryptographically secure qrToken.
 */
const createCard = async ({ cardCode, owner, expiresAt, nfcUid }) => {
  if (!owner || !mongoose.Types.ObjectId.isValid(owner)) {
    const error = new Error('owner is required and must be a valid user id');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(owner);
  if (!user) {
    const error = new Error('Owner not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Cannot issue a card to a deactivated user');
    error.statusCode = 400;
    throw error;
  }

  if (!cardCode || !expiresAt) {
    const error = new Error('cardCode, owner, and expiresAt are required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await Card.findOne({ cardCode: cardCode.trim() });
  if (existing) {
    const error = new Error('Card code already exists');
    error.statusCode = 409;
    throw error;
  }

  if (nfcUid) {
    const existingNfc = await Card.findOne({ nfcUid: nfcUid.trim() });
    if (existingNfc) {
      const error = new Error('NFC UID already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  const qrToken = crypto.randomBytes(32).toString('hex');

  const card = await Card.create({
    cardCode: cardCode.trim(),
    owner,
    expiresAt: new Date(expiresAt),
    nfcUid: nfcUid ? nfcUid.trim() : undefined,
    qrToken,
    status: 'active',
    issuedAt: new Date(),
  });

  return card;
};

/**
 * List cards with pagination and optional status filter.
 */
const getCards = async ({ page = 1, limit = 20, status }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.status = status;

  const [data, total] = await Promise.all([
    Card.find(query)
      .populate('owner', 'fullName email studentCode className')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }),
    Card.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
    },
  };
};

/**
 * Get card by ID (Admin or card owner).
 */
const getCardById = async (id, requestingUser) => {
  const card = await Card.findById(id).populate(
    'owner',
    'fullName email studentCode className'
  );

  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    requestingUser.role !== 'admin' &&
    card.owner._id.toString() !== requestingUser._id.toString()
  ) {
    const error = new Error('You do not have permission for this action');
    error.statusCode = 403;
    throw error;
  }

  return card;
};

/**
 * Issue card (status=active, issuedAt=now).
 */
const issueCard = async (id) => {
  const card = await Card.findById(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  card.status = 'active';
  card.issuedAt = new Date();
  await card.save();

  try {
    const notificationService = require('./notificationService');
    await notificationService.createAndDispatch({
      type: 'CARD_ISSUED',
      audience: 'individual',
      receiver: card.owner,
      relatedType: 'Card',
      relatedId: card._id,
      templateData: { cardCode: card.cardCode },
    });
  } catch (e) {}

  return card;
};

/**
 * Lock card.
 */
const lockCard = async (id) => {
  const card = await Card.findById(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  card.status = 'locked';
  await card.save();

  try {
    const notificationService = require('./notificationService');
    await notificationService.createAndDispatch({
      type: 'CARD_LOCKED',
      audience: 'individual',
      receiver: card.owner,
      relatedType: 'Card',
      relatedId: card._id,
      templateData: { cardCode: card.cardCode },
    });
  } catch (e) {}

  return card;
};

/**
 * Unlock card.
 */
const unlockCard = async (id) => {
  const card = await Card.findById(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  card.status = 'active';
  await card.save();

  try {
    const notificationService = require('./notificationService');
    await notificationService.createAndDispatch({
      type: 'CARD_UNLOCKED',
      audience: 'individual',
      receiver: card.owner,
      relatedType: 'Card',
      relatedId: card._id,
      templateData: { cardCode: card.cardCode },
    });
  } catch (e) {}

  return card;
};

/**
 * Renew card (add months to expiresAt).
 */
const renewCard = async (id, months) => {
  const monthsNum = parseInt(months, 10);
  if (!monthsNum || monthsNum <= 0) {
    const error = new Error('Valid number of months is required');
    error.statusCode = 400;
    throw error;
  }

  const card = await Card.findById(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  const currentExpiry = new Date(card.expiresAt);
  currentExpiry.setMonth(currentExpiry.getMonth() + monthsNum);
  card.expiresAt = currentExpiry;

  if (card.status === 'expired') {
    card.status = 'active';
  }

  await card.save();
  return card;
};

/**
 * Mark card as lost (Admin or owner).
 */
const markCardLost = async (id, requestingUser) => {
  const card = await Card.findById(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    requestingUser.role !== 'admin' &&
    card.owner.toString() !== requestingUser._id.toString()
  ) {
    const error = new Error('You do not have permission for this action');
    error.statusCode = 403;
    throw error;
  }

  card.status = 'lost';
  await card.save();

  try {
    const notificationService = require('./notificationService');
    await notificationService.createAndDispatch({
      type: 'CARD_LOST',
      audience: 'individual',
      receiver: card.owner,
      relatedType: 'Card',
      relatedId: card._id,
      templateData: { cardCode: card.cardCode },
    });
  } catch (e) {}

  return card;
};

/**
 * Delete card (Admin only).
 */
const deleteCard = async (id) => {
  const card = await Card.findByIdAndDelete(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }
  return { message: 'Card deleted successfully' };
};

/**
 * Helper to resolve a card by cardCode, nfcUid, or qrToken.
 */
const resolveCard = async (identifier) => {
  const { cardCode, nfcUid, qrToken } = identifier;
  const provided = [cardCode, nfcUid, qrToken].filter(Boolean);

  if (provided.length !== 1) {
    const error = new Error('Exactly one identifier (cardCode, nfcUid, or qrToken) must be provided');
    error.statusCode = 400;
    throw error;
  }

  const query = {};
  if (cardCode) query.cardCode = cardCode.trim();
  if (nfcUid) query.nfcUid = nfcUid.trim();
  if (qrToken) query.qrToken = qrToken.trim();

  const card = await Card.findOne(query);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  // INV-02: Run assertCardUsable
  await assertCardUsable(card);
  return card;
};

/**
 * Verify card identifier and return owner info.
 */
const verifyCard = async (identifier) => {
  const card = await resolveCard(identifier);
  await card.populate('owner', 'fullName studentCode className');

  return {
    card: {
      id: card._id,
      cardCode: card.cardCode,
      status: card.status,
      expiresAt: card.expiresAt,
    },
    owner: {
      fullName: card.owner ? card.owner.fullName : null,
      studentCode: card.owner ? card.owner.studentCode : null,
      className: card.owner ? card.owner.className : null,
    },
  };
};

/**
 * Get card access history (Admin or card owner).
 */
const getCardHistory = async (id, requestingUser, page, limit) => {
  const card = await Card.findById(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    requestingUser.role !== 'admin' &&
    card.owner.toString() !== requestingUser._id.toString()
  ) {
    const error = new Error('You do not have permission for this action');
    error.statusCode = 403;
    throw error;
  }

  return logService.getCardHistory(id, page, limit);
};

module.exports = {
  createCard,
  getCards,
  getCardById,
  issueCard,
  lockCard,
  unlockCard,
  renewCard,
  markCardLost,
  deleteCard,
  resolveCard,
  verifyCard,
  getCardHistory,
  assertCardUsable,
};
