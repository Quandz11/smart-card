const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Current user inbox & actions
router.get('/my/unread-count', notificationController.getUnreadCount);
router.get('/my', notificationController.getMyNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', notificationController.updatePreferences);

// Admin-only management routes
router.get('/sent', authorize('admin'), notificationController.getSentHistory);
router.delete(
  '/scheduled/:id',
  authorize('admin'),
  notificationController.cancelScheduled
);
router.post('/', authorize('admin'), notificationController.createNotification);

// Item-specific actions
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.archiveNotification);

module.exports = router;
