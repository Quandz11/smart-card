const AccessLog = require('../models/AccessLog');

/**
 * Record an access log row.
 * INV-04: Every successful card action writes exactly ONE AccessLog row.
 */
const recordLog = async ({ card, owner, action, location, detail, createdBy }) => {
  const log = await AccessLog.create({
    card,
    owner,
    action,
    location,
    detail,
    createdBy,
  });
  return log;
};

/**
 * Get card access history, newest first, paginated.
 */
const getCardHistory = async (cardId, page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const query = { card: cardId };
  const [data, total] = await Promise.all([
    AccessLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'fullName email')
      .populate('owner', 'fullName email studentCode'),
    AccessLog.countDocuments(query),
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
 * Get all logs with optional filters, newest first, paginated.
 */
const getLogs = async (filters, page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (filters.card) query.card = filters.card;
  if (filters.owner) query.owner = filters.owner;
  if (filters.action) query.action = filters.action;

  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }

  const [data, total] = await Promise.all([
    AccessLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('card', 'cardCode status')
      .populate('owner', 'fullName email studentCode')
      .populate('createdBy', 'fullName email'),
    AccessLog.countDocuments(query),
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

module.exports = {
  recordLog,
  getCardHistory,
  getLogs,
};

