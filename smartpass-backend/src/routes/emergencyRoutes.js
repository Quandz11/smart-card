const express = require('express');
const emergencyController = require('../controllers/emergencyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public emergency QR scan endpoint (NO authentication)
router.get('/public/:qrToken', emergencyController.getPublicEmergencyInfo);

// Owner-only endpoints (Authenticated)
router.get('/me', protect, emergencyController.getMyEmergencyProfile);
router.put('/me', protect, emergencyController.updateMyEmergencyProfile);
router.post('/me/rotate-qr', protect, emergencyController.rotateQrToken);

module.exports = router;

