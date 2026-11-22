const express = require('express');
const otpController = require('../controllers/otpController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/request', otpController.requestOtp);
router.get('/active', otpController.getActiveOtp);
router.post('/verify', otpController.verifyOtp);

module.exports = router;

