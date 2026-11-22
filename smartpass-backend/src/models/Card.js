const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    cardCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['student'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['active', 'locked', 'expired', 'lost'],
      default: 'active',
    },
    issuedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    nfcUid: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    qrToken: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Card', cardSchema);

