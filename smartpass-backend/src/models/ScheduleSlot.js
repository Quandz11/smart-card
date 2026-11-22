const mongoose = require('mongoose');

const scheduleSlotSchema = new mongoose.Schema(
  {
    schoolClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      required: true,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    room: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 2,
      max: 8,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    startWeek: {
      type: Number,
      required: true,
      default: 1,
    },
    endWeek: {
      type: Number,
      required: true,
      default: 18,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ScheduleSlot', scheduleSlotSchema);

