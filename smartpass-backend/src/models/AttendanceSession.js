const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
    scheduleSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScheduleSlot',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    openedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    qrExpiresAt: {
      type: Date,
      required: true,
    },
    lateAfterMinutes: {
      type: Number,
      default: 15,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSessionSchema.index({ scheduleSlot: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);

