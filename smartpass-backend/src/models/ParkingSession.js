const mongoose = require('mongoose');

const parkingSessionSchema = new mongoose.Schema(
  {
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehiclePlate: {
      type: String,
      trim: true,
    },
    checkInAt: {
      type: Date,
      default: Date.now,
    },
    checkOutAt: {
      type: Date,
      default: null,
    },
    fee: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in', 'out'],
      default: 'in',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ParkingSession', parkingSessionSchema);

