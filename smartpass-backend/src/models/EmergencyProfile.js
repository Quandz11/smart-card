const mongoose = require('mongoose');

const emergencyProfileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    emergencyContactName: {
      type: String,
      trim: true,
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
    },
    allergies: {
      type: String,
      trim: true,
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
      default: null,
    },
    insuranceInfo: {
      type: String,
      trim: true,
    },
    visibleFields: {
      type: [String],
      default: ['fullName', 'emergencyContactName', 'emergencyContactPhone'],
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EmergencyProfile', emergencyProfileSchema);

