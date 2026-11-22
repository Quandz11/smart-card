const express = require('express');
const parkingController = require('../controllers/parkingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post(
  '/check-in',
  authorize('admin', 'parking_staff', 'student'),
  parkingController.checkIn
);
router.post(
  '/check-out',
  authorize('admin', 'parking_staff', 'student'),
  parkingController.checkOut
);
router.get('/my', authorize('student'), parkingController.getMySessions);
router.get(
  '/active',
  authorize('admin', 'parking_staff'),
  parkingController.getActiveSessions
);

module.exports = router;

