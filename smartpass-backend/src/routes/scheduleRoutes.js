const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Student timetable
router.get('/my/today', authorize('student'), scheduleController.getMyTodaySchedule);
router.get('/my', authorize('student'), scheduleController.getMySchedule);

// Teacher timetable
router.get('/teaching', scheduleController.getTeachingSchedule);

// Semesters
router.post('/semesters', authorize('admin'), scheduleController.createSemester);
router.get('/semesters/current', scheduleController.getCurrentSemester);
router.get('/semesters', scheduleController.getSemesters);

// Subjects
router.post('/subjects', authorize('admin'), scheduleController.createSubject);
router.get('/subjects', scheduleController.getSubjects);

// Classes & Enrollments
router.post('/classes/assign', authorize('admin'), scheduleController.assignStudents);
router.post('/classes/:classId/students', authorize('admin'), scheduleController.enrollStudent);
router.get('/classes/:classId/students', scheduleController.getClassStudents);
router.delete('/classes/:classId/students/:studentId', authorize('admin'), scheduleController.removeStudentFromClass);
router.post('/classes', authorize('admin'), scheduleController.createClass);
router.get('/classes', scheduleController.getClasses);

// Schedule Slots
router.post('/slots', authorize('admin'), scheduleController.createSlot);
router.get('/slots', scheduleController.getSlots);
router.delete('/slots/:id', authorize('admin'), scheduleController.deleteSlot);

module.exports = router;
