const scheduleService = require('../services/scheduleService');

// Semesters
const createSemester = async (req, res, next) => {
  try {
    const sem = await scheduleService.createSemester(req.body);
    res.status(201).json({ success: true, data: sem });
  } catch (error) {
    next(error);
  }
};

const getSemesters = async (req, res, next) => {
  try {
    const sems = await scheduleService.getSemesters();
    res.status(200).json({ success: true, data: sems });
  } catch (error) {
    next(error);
  }
};

const getCurrentSemester = async (req, res, next) => {
  try {
    const sem = await scheduleService.getCurrentSemester();
    res.status(200).json({ success: true, data: sem });
  } catch (error) {
    next(error);
  }
};

// Subjects
const createSubject = async (req, res, next) => {
  try {
    const sub = await scheduleService.createSubject(req.body);
    res.status(201).json({ success: true, data: sub });
  } catch (error) {
    next(error);
  }
};

const getSubjects = async (req, res, next) => {
  try {
    const subs = await scheduleService.getSubjects();
    res.status(200).json({ success: true, data: subs });
  } catch (error) {
    next(error);
  }
};

// Classes & Enrollments
const createClass = async (req, res, next) => {
  try {
    const cls = await scheduleService.createClass(req.body);
    res.status(201).json({ success: true, data: cls });
  } catch (error) {
    next(error);
  }
};

const getClasses = async (req, res, next) => {
  try {
    const classes = await scheduleService.getClasses();
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
};

const assignStudents = async (req, res, next) => {
  try {
    const schoolClassId = req.body.schoolClassId || req.body.classId;
    const studentIds = req.body.studentIds || (req.body.studentId ? [req.body.studentId] : []);
    const result = await scheduleService.assignStudentsToClass({
      schoolClassId,
      studentIds,
      semesterId: req.body.semesterId,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const enrollStudent = async (req, res, next) => {
  try {
    const schoolClassId = req.params.classId;
    const studentId = req.body.studentId || (req.body.studentIds ? req.body.studentIds[0] : null);
    const result = await scheduleService.assignStudentsToClass({
      schoolClassId,
      studentIds: studentId ? [studentId] : req.body.studentIds,
      semesterId: req.body.semesterId,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getClassStudents = async (req, res, next) => {
  try {
    const schoolClassId = req.params.classId;
    const result = await scheduleService.getClassStudents(schoolClassId, req.query.semesterId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const removeStudentFromClass = async (req, res, next) => {
  try {
    const { classId, studentId } = req.params;
    const result = await scheduleService.removeStudentFromClass(classId, studentId, req.query.semesterId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Schedule Slots
const createSlot = async (req, res, next) => {
  try {
    const slot = await scheduleService.createSlot(req.body);
    res.status(201).json({ success: true, data: slot });
  } catch (error) {
    next(error);
  }
};

const getSlots = async (req, res, next) => {
  try {
    const slots = await scheduleService.getSlots(req.query);
    res.status(200).json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

const deleteSlot = async (req, res, next) => {
  try {
    await scheduleService.deleteSlot(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xoá tiết học' });
  } catch (error) {
    next(error);
  }
};

// Student & Teacher
const getMySchedule = async (req, res, next) => {
  try {
    const result = await scheduleService.getMySchedule(req.user._id, req.query);
    res.status(200).json({ success: true, data: result, slots: result.slots });
  } catch (error) {
    next(error);
  }
};

const getMyTodaySchedule = async (req, res, next) => {
  try {
    const result = await scheduleService.getMyTodaySchedule(req.user._id);
    const slots = (result && result.slots) ? result.slots : [];
    res.status(200).json({ success: true, data: slots, slots, raw: result });
  } catch (error) {
    next(error);
  }
};

const getTeachingSchedule = async (req, res, next) => {
  try {
    const result = await scheduleService.getTeachingSchedule(req.user._id, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSemester,
  getSemesters,
  getCurrentSemester,
  createSubject,
  getSubjects,
  createClass,
  getClasses,
  assignStudents,
  enrollStudent,
  getClassStudents,
  removeStudentFromClass,
  createSlot,
  getSlots,
  deleteSlot,
  getMySchedule,
  getMyTodaySchedule,
  getTeachingSchedule,
};
