const express = require('express');
const logController = require('../controllers/logController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', logController.getLogs);

module.exports = router;

