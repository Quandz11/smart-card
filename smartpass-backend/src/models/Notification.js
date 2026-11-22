const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: 'SYSTEM_ANNOUNCEMENT',
      index: true,
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
      index: true,
    },
    audience: {
      type: String,
      enum: ['all', 'class', 'individual'],
      required: true,
      index: true,
    },
    className: {
      type: String,
      trim: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    relatedType: {
      type: String,
      default: null,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    actionRoute: {
      type: String,
      default: null,
    },
    dedupeKey: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SCHEDULED', 'DISPATCHED', 'CANCELLED', 'FAILED'],
      default: 'DISPATCHED',
      index: true,
    },
    scheduledAt: {
      type: Date,
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
