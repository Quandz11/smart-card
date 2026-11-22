const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    categories: {
      WALLET: { type: Boolean, default: true },
      CARD: { type: Boolean, default: true },
      LIBRARY: { type: Boolean, default: true },
      PARKING: { type: Boolean, default: true },
      ROOM: { type: Boolean, default: true },
      EVENT: { type: Boolean, default: true },
      SCHEDULE_ATTENDANCE: { type: Boolean, default: true },
      SYSTEM: { type: Boolean, default: true },
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      from: { type: String, default: '22:00' },
      to: { type: String, default: '07:00' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  'NotificationPreference',
  notificationPreferenceSchema
);

