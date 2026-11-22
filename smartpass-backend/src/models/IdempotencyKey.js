const mongoose = require('mongoose');

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    endpoint: {
      type: String,
      required: false,
      default: 'api',
    },
    responseStatus: {
      type: Number,
      required: true,
      default: 200,
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24 hours TTL
    },
  }
);

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);
