const mongoose = require('mongoose');

const otpChallengeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['RESET_PIN', 'CHANGE_PIN', 'STAFF_CASH_CONFIRM'],
      required: true,
    },
    transactionRef: {
      type: String,
      default: null,
      trim: true,
    },
    codeHash: {
      type: String,
      required: true,
      select: false,
    },
    // The in-app deliverable code displayed only in the authenticated Smart OTP screen
    deliveredCode: {
      type: String,
      default: null,
      select: false,
    },
    otpToken: {
      type: String,
      default: null,
      index: true,
    },
    otpTokenExpiresAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

otpChallengeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('OtpChallenge', otpChallengeSchema);

