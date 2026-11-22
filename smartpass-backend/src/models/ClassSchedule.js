const mongoose = require('mongoose');

const classScheduleSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    teacher: {
      type: String,
      trim: true,
    },
    room: {
      type: String,
      trim: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 2,
      max: 8,
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
    semester: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ClassSchedule', classScheduleSchema);

