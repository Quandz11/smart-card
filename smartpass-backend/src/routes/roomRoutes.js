const express = require('express');
const roomBookingController = require('../controllers/roomBookingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/availability', roomBookingController.getAvailability);

module.exports = router;

