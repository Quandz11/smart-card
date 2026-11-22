const express = require('express');
const canteenController = require('../controllers/canteenController');
const qrController = require('../controllers/qrController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public VNPay return and IPN hooks (no auth required)
router.get('/vnpay/return', canteenController.vnpayReturn);
router.get('/vnpay/ipn', canteenController.vnpayIpn);

// All routes below require authentication
router.use(protect);

// PIN Management
router.post('/pin/setup', canteenController.setupPin);
router.post('/pin/change', canteenController.changePin);
router.post('/pin/reset', canteenController.resetPin);

// VNPay self-topup (student only)
router.post('/vnpay/create', authorize('student'), canteenController.createVnpayOrder);
router.get('/vnpay/orders/:txnRef', canteenController.getVnpayOrder);

// Wallet Operations
router.get('/me', authorize('student'), canteenController.getMyWallet);
router.post('/topup', authorize('admin', 'canteen_staff'), canteenController.topUpWallet);
router.post('/pay', authorize('admin', 'canteen_staff', 'student'), canteenController.payFromWallet);
router.post('/payment-request', authorize('admin', 'canteen_staff'), qrController.generatePaymentRequest);
router.get('/transactions', authorize('student'), canteenController.getMyTransactions);
router.get('/transactions/all', authorize('admin'), canteenController.getAllTransactions);

module.exports = router;
