const express = require('express');
const eventController = require('../controllers/eventController');
const qrController = require('../controllers/qrController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin'), eventController.createEvent);
router.get('/', eventController.getUpcomingEvents);
router.get('/my', authorize('student'), eventController.getMyEvents);
router.post('/:id/register', authorize('student'), eventController.registerForEvent);
router.post('/:id/checkin', authorize('student'), eventController.checkInToEvent);
router.post('/:id/checkin-qr', authorize('admin'), qrController.generateEventCheckin);

module.exports = router;

