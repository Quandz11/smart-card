const mongoose = require('mongoose');

const topupOrderSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 10000,
      max: 5000000,
    },
    txnRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    vnpTransactionNo: {
      type: String,
      default: null,
    },
    vnpResponseCode: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TopupOrder', topupOrderSchema);

