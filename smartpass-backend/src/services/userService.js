const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const CanteenTransaction = require('../models/CanteenTransaction');
const Card = require('../models/Card');
const EmergencyProfile = require('../models/EmergencyProfile');
const NotificationRead = require('../models/NotificationRead');
const ParkingSession = require('../models/ParkingSession');
const LibraryLoan = require('../models/LibraryLoan');
const AccessLog = require('../models/AccessLog');
const authService = require('./authService');

/**
 * List users with search and pagination (Admin only).
 */
const getUsers = async ({ q, page = 1, limit = 20 }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (q && q.trim()) {
    const searchRegex = new RegExp(q.trim(), 'i');
    query.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { studentCode: searchRegex },
    ];
  }

  const [data, total] = await Promise.all([
    User.find(query).select('-password -failedLoginAttempts -lockedUntil').skip(skip).limit(limitNum),
    User.countDocuments(query),
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
 * Create user account (Admin only).
 */
const createUser = async (data) => {
  const result = await authService.register(data);
  if (data.role && ['admin', 'librarian', 'canteen_staff', 'parking_staff', 'student'].includes(data.role)) {
    const updated = await User.findByIdAndUpdate(result.user._id, { role: data.role }, { new: true })
      .select('-password -failedLoginAttempts -lockedUntil');
    return updated;
  }
  return result.user;
};

/**
 * Get user by ID.
 */
const getUserById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const user = await User.findById(id).select('-password -failedLoginAttempts -lockedUntil');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Update user profile fields only.
 */
const updateUser = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const allowedUpdates = [
    'fullName',
    'phone',
    'studentCode',
    'className',
    'avatarUrl',
  ];
  const updates = {};

  for (const key of allowedUpdates) {
    if (data[key] !== undefined) {
      updates[key] = data[key];
    }
  }

  if (updates.studentCode) {
    const existing = await User.findOne({
      studentCode: updates.studentCode.trim(),
      _id: { $ne: id },
    });
    if (existing) {
      const error = new Error('Student code already in use');
      error.statusCode = 409;
      throw error;
    }
  }

  const user = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).select('-password -failedLoginAttempts -lockedUntil');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Update user role (Admin only).
 */
const updateUserRole = async (id, role) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const validRoles = [
    'admin',
    'student',
    'librarian',
    'canteen_staff',
    'parking_staff',
  ];
  if (!validRoles.includes(role)) {
    const error = new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  ).select('-password -failedLoginAttempts -lockedUntil');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  try {
    const notificationService = require('./notificationService');
    await notificationService.createAndDispatch({
      type: 'ROLE_CHANGED',
      audience: 'individual',
      receiver: user._id,
      templateData: { role },
    });
  } catch (e) {}

  return user;
};

/**
 * Deactivate user (Admin only).
 */
const deactivateUser = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).select('-password -failedLoginAttempts -lockedUntil');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  try {
    const notificationService = require('./notificationService');
    await notificationService.createAndDispatch({
      type: 'ACCOUNT_DEACTIVATED',
      priority: 'URGENT',
      audience: 'individual',
      receiver: user._id,
    });
  } catch (e) {}

  return user;
};

/**
 * Delete user without leaving orphan data (Admin only).
 * Fix 5: Atomic deletion using session transaction.
 */
const deleteUser = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const user = await User.findById(id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Cannot delete a user with an active parking session
  const activeParking = await ParkingSession.findOne({ owner: id, status: 'in' });
  if (activeParking) {
    const error = new Error('Cannot delete a user with an active parking session');
    error.statusCode = 409;
    throw error;
  }

  // 3. Cannot delete a user with unreturned library books
  const activeLoan = await LibraryLoan.findOne({ borrower: id, status: 'borrowed' });
  if (activeLoan) {
    const error = new Error('Cannot delete a user with unreturned library books');
    error.statusCode = 409;
    throw error;
  }

  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    const error = new Error('Database transactions are unavailable on this MongoDB deployment');
    error.statusCode = 500;
    throw error;
  }

  try {
    await session.withTransaction(async () => {
      // Delete Wallet
      const wallet = await Wallet.findOne({ owner: id }).session(session);
      if (wallet) {
        await CanteenTransaction.deleteMany({ wallet: wallet._id }).session(session);
        await Wallet.findByIdAndDelete(wallet._id).session(session);
      }
      await CanteenTransaction.deleteMany({ owner: id }).session(session);

      // Delete Cards
      await Card.deleteMany({ owner: id }).session(session);

      // Delete EmergencyProfile
      await EmergencyProfile.deleteMany({ owner: id }).session(session);

      // Delete NotificationRead
      await NotificationRead.deleteMany({ user: id }).session(session);

      // Anonymize AccessLog rows (keep audit trail, set owner to null)
      await AccessLog.updateMany({ owner: id }, { $set: { owner: null } }).session(session);

      // Delete User document
      await User.findByIdAndDelete(id).session(session);
    });
  } catch (err) {
    if (
      err.message &&
      (err.message.includes('Transaction numbers are only allowed') ||
        err.message.includes('Transactions are not supported'))
    ) {
      const error = new Error('Database transactions are unavailable on this MongoDB deployment');
      error.statusCode = 500;
      throw error;
    }
    throw err;
  } finally {
    await session.endSession();
  }

  return { message: 'User deleted successfully' };
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserRole,
  deactivateUser,
  deleteUser,
};
