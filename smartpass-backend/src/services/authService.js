const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const generateToken = require('../utils/generateToken');

/**
 * Register a new user and auto-create an empty wallet.
 */
const register = async ({
  fullName,
  email,
  password,
  phone,
  studentCode,
  className,
  role,
}) => {
  if (!fullName) {
    const error = new Error('Full name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!email) {
    const error = new Error('Email is required');
    error.statusCode = 400;
    throw error;
  }

  if (!password) {
    const error = new Error('Password is required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('Email already in use');
    error.statusCode = 409;
    throw error;
  }

  if (studentCode) {
    const existingCode = await User.findOne({ studentCode: studentCode.trim() });
    if (existingCode) {
      const error = new Error('Student code already in use');
      error.statusCode = 409;
      throw error;
    }
  }

  // INV-01: Hash password with bcryptjs, salt rounds = 10
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone ? phone.trim() : undefined,
    studentCode: studentCode ? studentCode.trim() : undefined,
    className: className ? className.trim() : undefined,
    role: 'student', // Public registration ALWAYS creates role student (prevents privilege escalation)
  });

  // Auto-create empty wallet for user
  await Wallet.create({
    owner: user._id,
    balance: 0,
  });

  const token = generateToken(user._id, user.role);

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.failedLoginAttempts;
  delete userObj.lockedUntil;

  return {
    user: userObj,
    token,
  };
};

/**
 * Login user with rate limiting on failed attempts.
 * INV-09 & INV-10: Exact message "Invalid email or password" across ALL failure cases.
 */
const login = async ({ email, password, deviceId, platform }) => {
  if (!email || !password) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password +pinHash');

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Deactivated user check (Fix 3: generic message)
  if (!user.isActive) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Check if account is locked (Fix 3: generic message, lock enforced internally)
  if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();

    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Reset failed attempts on successful login
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;

  // Register device if provided (Block B3)
  if (deviceId) {
    if (!user.devices) user.devices = [];
    const existingDev = user.devices.find((d) => d.deviceId === deviceId);
    if (existingDev) {
      existingDev.lastActiveAt = new Date();
    } else {
      user.devices.push({
        deviceId: deviceId.trim(),
        platform: platform || 'android',
        registeredAt: new Date(),
        lastActiveAt: new Date(),
      });

      try {
        const notificationService = require('./notificationService');
        const { formatDate } = require('../constants/notificationCatalog');
        notificationService.createAndDispatch({
          type: 'LOGIN_NEW_DEVICE',
          audience: 'individual',
          receiver: user._id,
          templateData: {
            time: formatDate(new Date()),
          },
        }).catch(() => {});
      } catch (e) {}
    }
  }

  await user.save();

  const mustSetPin = !user.pinHash;

  const token = generateToken(user._id, user.role);
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.pinHash;
  delete userObj.failedLoginAttempts;
  delete userObj.lockedUntil;
  delete userObj.pinFailedAttempts;
  delete userObj.pinLockedUntil;

  return {
    user: userObj,
    token,
    mustSetPin,
  };
};

/**
 * Get profile of current authenticated user.
 */
const getMe = async (userId) => {
  const user = await User.findById(userId).select('-password -failedLoginAttempts -lockedUntil');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Change password for authenticated user.
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    const error = new Error('Both currentPassword and newPassword are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId).select('+password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const error = new Error('Invalid current password');
    error.statusCode = 401;
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  try {
    const notificationService = require('./notificationService');
    await notificationService.createAndDispatch({
      type: 'PASSWORD_CHANGED',
      audience: 'individual',
      receiver: user._id,
    });
  } catch (e) {}

  return { message: 'Password changed successfully' };
};

module.exports = {
  register,
  login,
  getMe,
  changePassword,
};
