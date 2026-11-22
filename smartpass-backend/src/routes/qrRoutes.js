const express = require('express');
const qrController = require('../controllers/qrController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Front-door QR resolver (students, staff, admin)
router.post('/resolve', qrController.resolveQr);

// Gate access confirmation (students/staff confirming a gate scan)
router.post('/gate/confirm', qrController.confirmGatePass);

// Admin QR registry endpoints
router.get('/', authorize('admin'), qrController.getQrCodes);
router.post('/', authorize('admin'), qrController.createQrCode);
router.patch('/:publicId/revoke', authorize('admin'), qrController.revokeQrCode);
router.post('/:publicId/regenerate', authorize('admin'), qrController.regenerateQrCode);

module.exports = router;

