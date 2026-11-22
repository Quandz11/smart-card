const crypto = require('crypto');
const EmergencyProfile = require('../models/EmergencyProfile');
const Card = require('../models/Card');
const User = require('../models/User');
const logService = require('./logService');

const ALLOWED_VISIBLE_FIELDS = [
  'fullName',
  'emergencyContactName',
  'emergencyContactPhone',
  'allergies',
  'bloodType',
  'insuranceInfo',
];

/**
 * Get or create emergency profile for current user.
 */
const getMyEmergencyProfile = async (userId) => {
  let profile = await EmergencyProfile.findOne({ owner: userId });

  if (!profile) {
    const user = await User.findById(userId);
    profile = await EmergencyProfile.create({
      owner: userId,
      fullName: user ? user.fullName : '',
      visibleFields: ['fullName', 'emergencyContactName', 'emergencyContactPhone'],
      isEnabled: false,
    });
  }

  return profile;
};

/**
 * Create or update emergency profile for current user.
 */
const updateMyEmergencyProfile = async (userId, data) => {
  let profile = await EmergencyProfile.findOne({ owner: userId });
  if (!profile) {
    profile = new EmergencyProfile({ owner: userId });
  }

  const allowedUpdates = [
    'fullName',
    'emergencyContactName',
    'emergencyContactPhone',
    'allergies',
    'bloodType',
    'insuranceInfo',
    'isEnabled',
  ];

  for (const field of allowedUpdates) {
    if (data[field] !== undefined) {
      profile[field] = data[field];
    }
  }

  if (data.visibleFields !== undefined) {
    if (!Array.isArray(data.visibleFields)) {
      const error = new Error('visibleFields must be an array');
      error.statusCode = 400;
      throw error;
    }

    const invalidField = data.visibleFields.find(
      (f) => !ALLOWED_VISIBLE_FIELDS.includes(f)
    );
    if (invalidField) {
      const error = new Error(
        `Invalid field in visibleFields: ${invalidField}. Allowed fields: ${ALLOWED_VISIBLE_FIELDS.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }

    profile.visibleFields = data.visibleFields;
  }

  await profile.save();
  return profile;
};

/**
 * Rotate card's qrToken.
 * Old qrToken stops working immediately.
 */
const rotateQrToken = async (userId) => {
  const card = await Card.findOne({ owner: userId });
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  const newQrToken = crypto.randomBytes(32).toString('hex');
  card.qrToken = newQrToken;
  await card.save();

  return { qrToken: newQrToken };
};

/**
 * Public emergency QR access.
 * Strict rules R1 to R6.
 */
const getPublicEmergencyInfo = async (qrToken) => {
  const notFoundError = () => {
    const error = new Error('Emergency information not found');
    error.statusCode = 404;
    return error;
  };

  if (!qrToken) {
    throw notFoundError();
  }

  // R3: Unknown qrToken -> 404
  const card = await Card.findOne({ qrToken: qrToken.trim() });
  if (!card) {
    throw notFoundError();
  }

  // R4: Card status in locked, lost, or expired -> 404
  if (card.status !== 'active') {
    throw notFoundError();
  }

  // Card expired by date
  if (new Date() > new Date(card.expiresAt)) {
    card.status = 'expired';
    await card.save();
    throw notFoundError();
  }

  // Find EmergencyProfile
  const profile = await EmergencyProfile.findOne({ owner: card.owner });
  if (!profile) {
    throw notFoundError();
  }

  // R2: isEnabled is false -> 404
  if (!profile.isEnabled) {
    throw notFoundError();
  }

  // R1: Response contains ONLY fields listed in visibleFields.
  // A field NOT in visibleFields MUST be ABSENT from the JSON.
  const data = {};
  for (const field of profile.visibleFields) {
    if (ALLOWED_VISIBLE_FIELDS.includes(field)) {
      data[field] = profile[field] !== undefined && profile[field] !== null ? profile[field] : '';
    }
  }

  // R6: On success, write AccessLog
  await logService.recordLog({
    card: card._id,
    owner: card.owner,
    action: 'emergency_view',
    location: 'Public QR Scan',
    detail: 'Emergency profile viewed via public QR',
    createdBy: null,
  });

  try {
    const notificationService = require('./notificationService');
    const { formatDate } = require('../constants/notificationCatalog');
    await notificationService.createAndDispatch({
      type: 'EMERGENCY_VIEWED',
      priority: 'HIGH',
      audience: 'individual',
      receiver: card.owner,
      relatedType: 'Card',
      relatedId: card._id,
      templateData: {
        time: formatDate(new Date()),
      },
    });
  } catch (e) {}

  return data;
};

module.exports = {
  getMyEmergencyProfile,
  updateMyEmergencyProfile,
  rotateQrToken,
  getPublicEmergencyInfo,
};
