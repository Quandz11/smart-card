const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const qrController = require('../controllers/qrController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Sessions & Dynamic QR
// Students cannot open a session (403)
router.post(
  '/sessions',
  authorize('admin', 'librarian', 'canteen_staff', 'parking_staff'),
  attendanceController.openSession
);
router.post(
  '/sessions/:classSession/qr',
  authorize('admin', 'librarian', 'canteen_staff', 'parking_staff'),
  qrController.generateAttendanceQr
);
router.post('/sessions/:id/close', attendanceController.closeSession);
router.get('/sessions/:id/roster', attendanceController.getSessionRoster);
router.get('/sessions/:id/export-csv', attendanceController.exportSessionCsv);

// Check-in (All authenticated)
router.post('/check', attendanceController.checkAttendance);

// Correction (Audit logged)
router.patch('/records/:id', attendanceController.correctRecord);

// Student History
router.get('/my', authorize('student'), attendanceController.getMyAttendance);

// Reports
router.get('/reports/class/:classId', attendanceController.getClassReport);
router.get('/reports/class/:classId/export-csv', attendanceController.exportClassReportCsv);

module.exports = router;
