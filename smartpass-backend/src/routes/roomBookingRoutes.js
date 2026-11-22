const express = require('express');
const roomBookingController = require('../controllers/roomBookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', roomBookingController.createBooking);
router.get('/my', roomBookingController.getMyBookings);
router.patch('/:id/approve', authorize('admin'), roomBookingController.approveBooking);
router.patch('/:id/reject', authorize('admin'), roomBookingController.rejectBooking);
router.patch('/:id/cancel', roomBookingController.cancelBooking);

module.exports = router;
