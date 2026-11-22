const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },
    classSession: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    checkedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['present', 'late'],
      default: 'present',
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ student: 1, classSession: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

