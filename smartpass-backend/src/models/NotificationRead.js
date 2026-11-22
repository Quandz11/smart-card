const mongoose = require('mongoose');

const notificationReadSchema = new mongoose.Schema(
  {
    notification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
      index: true,
    },
    dedupeKey: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationReadSchema.index({ notification: 1, user: 1 }, { unique: true });
notificationReadSchema.index(
  { dedupeKey: 1, user: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } }
);

module.exports = mongoose.model('NotificationRead', notificationReadSchema);
