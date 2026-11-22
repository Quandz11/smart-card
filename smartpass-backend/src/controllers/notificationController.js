const notificationService = require('../services/notificationService');

const createNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.createNotification(
      req.body,
      req.user._id
    );
    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

const getMyNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getMyNotifications(
      req.user,
      req.query
    );
    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await notificationService.getUnreadCount(req.user._id);
    res.status(200).json({
      success: true,
      unreadCount,
      count: unreadCount,
      data: { count: unreadCount, unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(
      req.params.id,
      req.user._id
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    res.status(200).json({
      success: true,
      data: result,
      updated: result.updated,
    });
  } catch (error) {
    next(error);
  }
};

const archiveNotification = async (req, res, next) => {
  try {
    const result = await notificationService.archiveNotification(
      req.params.id,
      req.user._id
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPreferences = async (req, res, next) => {
  try {
    const pref = await notificationService.getPreferences(req.user._id);
    res.status(200).json({
      success: true,
      data: pref,
    });
  } catch (error) {
    next(error);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const pref = await notificationService.updatePreferences(
      req.user._id,
      req.body
    );
    res.status(200).json({
      success: true,
      data: pref,
    });
  } catch (error) {
    next(error);
  }
};

const getSentHistory = async (req, res, next) => {
  try {
    const result = await notificationService.getSentHistory(req.query);
    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const cancelScheduled = async (req, res, next) => {
  try {
    const result = await notificationService.cancelScheduled(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  getPreferences,
  updatePreferences,
  getSentHistory,
  cancelScheduled,
};
