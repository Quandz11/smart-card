const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'CANTEEN_POINT',
        'BOOK',
        'PARKING_IN',
        'PARKING_OUT',
        'ATTENDANCE_SESSION',
        'ROOM',
        'EVENT',
        'GATE_IN',
        'GATE_OUT',
        'PAYMENT_REQUEST',
        'EVENT_CHECKIN',
      ],
      required: true,
    },
    refKind: {
      type: String,
      enum: ['book', 'room', 'event', 'location', 'session', 'counter', 'gate', 'payment_request'],
      required: true,
    },
    refId: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    scanCount: {
      type: Number,
      default: 0,
    },
    lastScannedAt: {
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

module.exports = mongoose.model('QrCode', qrCodeSchema);

