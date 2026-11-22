const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema(
  {
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: [
        'entry',
        'exit',
        'attendance',
        'library_borrow',
        'library_return',
        'canteen_pay',
        'canteen_topup',
        'parking_in',
        'parking_out',
        'room_booking',
        'event_register',
        'emergency_view',
        'attendance_correction',
      ],
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    detail: {
      type: String,
      trim: true,
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

module.exports = mongoose.model('AccessLog', accessLogSchema);

