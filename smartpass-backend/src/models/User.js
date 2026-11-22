const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'student', 'librarian', 'canteen_staff', 'parking_staff'],
      default: 'student',
    },
    phone: {
      type: String,
      trim: true,
    },
    studentCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    className: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    pinHash: {
      type: String,
      select: false,
      default: null,
    },
    pinSetAt: {
      type: Date,
      default: null,
    },
    pinFailedAttempts: {
      type: Number,
      default: 0,
    },
    pinLockedUntil: {
      type: Date,
      default: null,
    },
    devices: [
      {
        deviceId: {
          type: String,
          required: true,
        },
        platform: {
          type: String,
          enum: ['android', 'ios', 'web'],
          default: 'android',
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        lastActiveAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);

