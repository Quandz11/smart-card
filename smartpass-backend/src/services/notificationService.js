const Notification = require('../models/Notification');
const NotificationRead = require('../models/NotificationRead');
const NotificationPreference = require('../models/NotificationPreference');
const NotificationDispatchLog = require('../models/NotificationDispatchLog');
const User = require('../models/User');
const {
  CATALOG,
  CATEGORIES,
  getCatalogEntry,
  renderTemplate,
  formatCurrency,
  formatDate,
} = require('../constants/notificationCatalog');
const {
  emitToUser,
  emitToRole,
  emitToClass,
  emitToAll,
} = require('../socket');

/**
 * Check if quiet hours apply for a user preference right now.
 */
const isQuietHoursActive = (quietHours) => {
  if (!quietHours || !quietHours.enabled) return false;
  try {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [fromH, fromM] = (quietHours.from || '22:00').split(':').map(Number);
    const [toH, toM] = (quietHours.to || '07:00').split(':').map(Number);
    const startMins = fromH * 60 + (fromM || 0);
    const endMins = toH * 60 + (toM || 0);

    if (startMins <= endMins) {
      return currentMins >= startMins && currentMins < endMins;
    } else {
      // Overnight window (e.g. 22:00 -> 07:00)
      return currentMins >= startMins || currentMins < endMins;
    }
  } catch (e) {
    return false;
  }
};

/**
 * Calculate silent flag for a specific user based on preferences and priority.
 */
const checkUserSilence = async (userId, category, priority) => {
  if (category === CATEGORIES.SECURITY || priority === 'URGENT') {
    return false; // Security and Urgent are never silenced
  }

  const pref = await NotificationPreference.findOne({ user: userId });
  if (pref) {
    if (pref.categories && pref.categories[category] === false) {
      return true; // Category switched off -> silent
    }
    if (isQuietHoursActive(pref.quietHours)) {
      if (priority === 'NORMAL') {
        return true; // Quiet hours silences Normal items
      }
    }
  }
  return false;
};

/**
 * Format a unified 2.2 payload shape from a notification and read row.
 */
const formatPayload = (notif, readRecord = null, isSilent = false) => {
  const entry = getCatalogEntry(notif.type);
  const isRead = readRecord ? Boolean(readRecord.readAt) : false;
  const readAt = readRecord && readRecord.readAt ? readRecord.readAt.toISOString() : null;

  return {
    id: notif._id.toString(),
    type: notif.type || 'SYSTEM_ANNOUNCEMENT',
    priority: notif.priority || entry.priority || 'NORMAL',
    category: entry.category || CATEGORIES.SYSTEM,
    title: notif.title,
    body: notif.body,
    actorId: notif.actor ? notif.actor.toString() : null,
    relatedType: notif.relatedType || null,
    relatedId: notif.relatedId ? notif.relatedId.toString() : null,
    actionRoute: notif.actionRoute || entry.actionRoute || '/notifications',
    audience: notif.audience,
    className: notif.className || null,
    receiver: notif.receiver ? notif.receiver.toString() : null,
    isRead,
    readAt,
    createdAt: notif.createdAt ? notif.createdAt.toISOString() : new Date().toISOString(),
    expiresAt: notif.expiresAt ? notif.expiresAt.toISOString() : null,
    isSilent: Boolean(isSilent),
  };
};

/**
 * Section 1.3: One creation path for ALL notifications across the system.
 */
const createAndDispatch = async (input) => {
  const {
    type = 'SYSTEM_ANNOUNCEMENT',
    title: rawTitle,
    body: rawBody,
    templateData = {},
    priority: customPriority,
    audience: rawAudience,
    className,
    receiver,
    role,
    actor,
    relatedType,
    relatedId,
    actionRoute: customActionRoute,
    dedupeKey,
    scheduledAt,
    expiresAt,
    createdBy,
  } = input || {};

  const entry = getCatalogEntry(type);
  const audience = rawAudience || entry.defaultAudience || (receiver ? 'individual' : (className ? 'class' : 'all'));
  const priority = customPriority || entry.priority || 'NORMAL';
  const actionRoute = customActionRoute || entry.actionRoute || '/notifications';

  // Render title and body
  const title = (rawTitle && rawTitle.trim()) || entry.title;
  let body = rawBody;
  if (!body) {
    body = renderTemplate(entry.body, templateData);
  }

  // If scheduled in the future:
  const isScheduled = scheduledAt && new Date(scheduledAt).getTime() > Date.now();
  const initialStatus = isScheduled ? 'SCHEDULED' : 'DISPATCHED';

  const notification = await Notification.create({
    title: title.trim(),
    body: body.trim(),
    type,
    priority,
    audience,
    className: className ? className.trim() : undefined,
    receiver: receiver || undefined,
    actor: actor || null,
    relatedType: relatedType || null,
    relatedId: relatedId || null,
    actionRoute,
    dedupeKey: dedupeKey || null,
    status: initialStatus,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    createdBy: createdBy || null,
  });

  // If scheduled, wait for the scheduler to dispatch it later
  if (isScheduled) {
    return notification;
  }

  // Immediate dispatch: resolve recipient snapshot
  await dispatchNotification(notification, { role });

  return notification;
};

/**
 * Dispatch recipient rows and socket emissions for a notification.
 */
const dispatchNotification = async (notification, options = {}) => {
  const { audience, className, receiver, dedupeKey } = notification;
  const role = options.role || (audience === 'role' ? notification.className : null);

  let recipientIds = [];
  if (audience === 'individual' && receiver) {
    recipientIds = [receiver.toString()];
  } else if (audience === 'class' && className) {
    recipientIds = await User.find({ className, isActive: { $ne: false } }).distinct('_id');
  } else if (audience === 'role' && role) {
    recipientIds = await User.find({ role, isActive: { $ne: false } }).distinct('_id');
  } else {
    // audience === 'all'
    recipientIds = await User.find({ isActive: { $ne: false } }).distinct('_id');
  }

  // Create recipient records in NotificationRead
  if (recipientIds.length > 0) {
    const readDocs = recipientIds.map((uId) => ({
      notification: notification._id,
      user: uId,
      dedupeKey: dedupeKey ? `${dedupeKey}:${uId}` : null,
      deliveredAt: null,
      readAt: null,
      archivedAt: null,
    }));

    try {
      await NotificationRead.insertMany(readDocs, { ordered: false });
    } catch (err) {
      // Ignore duplicate key errors (code 11000) for deduplication
      if (err.code !== 11000 && (!err.writeErrors || !err.writeErrors.every((e) => e.code === 11000))) {
        // Log non-duplicate insertion issue
      }
    }
  }

  // Mark notification status as DISPATCHED
  notification.status = 'DISPATCHED';
  await notification.save();

  // Socket Emission
  try {
    const entry = getCatalogEntry(notification.type);

    if (audience === 'individual' && receiver) {
      const uId = receiver.toString();
      const isSilent = await checkUserSilence(uId, entry.category, notification.priority);
      const payload = formatPayload(notification, null, isSilent);

      emitToUser(uId, 'notification:new', payload);
      const unreadCount = await getUnreadCount(uId);
      emitToUser(uId, 'notification:unread', { unreadCount });
    } else if (audience === 'class' && className) {
      const payload = formatPayload(notification, null, false);
      emitToClass(className, 'notification:new', payload);

      for (const uId of recipientIds) {
        const count = await getUnreadCount(uId);
        emitToUser(uId.toString(), 'notification:unread', { unreadCount: count });
      }
    } else if (audience === 'role' && role) {
      const payload = formatPayload(notification, null, false);
      emitToRole(role, 'notification:new', payload);

      for (const uId of recipientIds) {
        const count = await getUnreadCount(uId);
        emitToUser(uId.toString(), 'notification:unread', { unreadCount: count });
      }
    } else {
      // audience === 'all'
      const payload = formatPayload(notification, null, false);
      emitToAll('notification:new', payload);

      for (const uId of recipientIds) {
        const count = await getUnreadCount(uId);
        emitToUser(uId.toString(), 'notification:unread', { unreadCount: count });
      }
    }
  } catch (emitErr) {
    // Record dispatch attempt error for retry
    await NotificationDispatchLog.create({
      notification: notification._id,
      attemptCount: 1,
      lastAttemptAt: new Date(),
      nextAttemptAt: new Date(Date.now() + 60 * 1000), // 1 min backoff
      status: 'PENDING',
      error: emitErr.message,
    });
  }
};

/**
 * Legacy admin createNotification wrapper (backwards compatible).
 */
const createNotification = async (payload, createdBy) => {
  return createAndDispatch({
    ...payload,
    createdBy,
  });
};

/**
 * Get current user's inbox (server-paginated, 2.2 payload shape).
 */
const getMyNotifications = async (user, query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const statusFilter = query.status; // 'unread' | 'all'
  const categoryFilter = query.category;

  const readQuery = {
    user: user._id,
    archivedAt: null,
  };

  if (statusFilter === 'unread') {
    readQuery.readAt = null;
  }

  const [readRows, total] = await Promise.all([
    NotificationRead.find(readQuery)
      .populate({
        path: 'notification',
        populate: { path: 'createdBy', select: 'fullName email' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    NotificationRead.countDocuments(readQuery),
  ]);

  const items = [];
  for (const row of readRows) {
    if (!row.notification) continue;
    const notif = row.notification;
    const entry = getCatalogEntry(notif.type);

    if (categoryFilter && entry.category !== categoryFilter) {
      continue;
    }

    items.push(formatPayload(notif, row, false));
  }

  // Sort with URGENT unread items pinned above NORMAL
  items.sort((a, b) => {
    if (!a.isRead && a.priority === 'URGENT' && (b.isRead || b.priority !== 'URGENT')) return -1;
    if (!b.isRead && b.priority === 'URGENT' && (a.isRead || a.priority !== 'URGENT')) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Get unread count for current user.
 */
const getUnreadCount = async (userId) => {
  return NotificationRead.countDocuments({
    user: userId,
    readAt: null,
    archivedAt: null,
  });
};

/**
 * Get undelivered unread notifications for reconnect sync.
 */
const getUndeliveredUnread = async (userId) => {
  const readRows = await NotificationRead.find({
    user: userId,
    readAt: null,
    deliveredAt: null,
    archivedAt: null,
  })
    .populate('notification')
    .sort({ createdAt: -1 })
    .limit(20);

  return readRows
    .filter((r) => r.notification)
    .map((r) => formatPayload(r.notification, r, false));
};

/**
 * Mark a single notification as read for current user.
 */
const markAsRead = async (notificationId, userId) => {
  const readRecord = await NotificationRead.findOne({
    notification: notificationId,
    user: userId,
    archivedAt: null,
  });

  if (!readRecord) {
    const error = new Error('Thông báo không tồn tại hoặc không dành cho bạn');
    error.statusCode = 404;
    throw error;
  }

  const readAt = new Date();
  readRecord.readAt = readAt;
  await readRecord.save();

  // Emit to user's other open sockets
  emitToUser(userId.toString(), 'notification:read', {
    id: notificationId,
    readAt: readAt.toISOString(),
  });

  const unreadCount = await getUnreadCount(userId);
  emitToUser(userId.toString(), 'notification:unread', { unreadCount });

  return { message: 'Đã đánh dấu đã đọc', readAt };
};

/**
 * Mark all unread notifications as read for current user.
 */
const markAllAsRead = async (userId) => {
  const readAt = new Date();
  const result = await NotificationRead.updateMany(
    { user: userId, readAt: null, archivedAt: null },
    { $set: { readAt } }
  );

  emitToUser(userId.toString(), 'notification:read_all', {
    readAt: readAt.toISOString(),
  });
  emitToUser(userId.toString(), 'notification:unread', { unreadCount: 0 });

  return { updated: result.modifiedCount || 0, readAt };
};

/**
 * Archive a notification for current user.
 */
const archiveNotification = async (notificationId, userId) => {
  const readRecord = await NotificationRead.findOne({
    notification: notificationId,
    user: userId,
    archivedAt: null,
  });

  if (!readRecord) {
    const error = new Error('Thông báo không tồn tại hoặc không dành cho bạn');
    error.statusCode = 404;
    throw error;
  }

  readRecord.archivedAt = new Date();
  await readRecord.save();

  const unreadCount = await getUnreadCount(userId);
  emitToUser(userId.toString(), 'notification:unread', { unreadCount });

  return { message: 'Đã lưu trữ thông báo' };
};

/**
 * Get user's notification preferences.
 */
const getPreferences = async (userId) => {
  let pref = await NotificationPreference.findOne({ user: userId });
  if (!pref) {
    pref = await NotificationPreference.create({ user: userId });
  }
  return pref;
};

/**
 * Update user's notification preferences.
 */
const updatePreferences = async (userId, data = {}) => {
  let pref = await NotificationPreference.findOne({ user: userId });
  if (!pref) {
    pref = new NotificationPreference({ user: userId });
  }

  if (data.categories) {
    pref.categories = {
      ...pref.categories.toObject(),
      ...data.categories,
    };
  }

  if (data.quietHours) {
    pref.quietHours = {
      ...pref.quietHours.toObject(),
      ...data.quietHours,
    };
  }

  await pref.save();
  return pref;
};

/**
 * Get sent history (Admin only).
 */
const getSentHistory = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.audience) filter.audience = query.audience;
  if (query.status) filter.status = query.status;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
  ]);

  const items = await Promise.all(
    notifications.map(async (n) => {
      const [totalRecipients, readCount] = await Promise.all([
        NotificationRead.countDocuments({ notification: n._id }),
        NotificationRead.countDocuments({
          notification: n._id,
          readAt: { $ne: null },
        }),
      ]);

      const entry = getCatalogEntry(n.type);

      return {
        id: n._id.toString(),
        type: n.type,
        category: entry.category,
        priority: n.priority,
        title: n.title,
        body: n.body,
        audience: n.audience,
        className: n.className || null,
        receiver: n.receiver || null,
        status: n.status,
        scheduledAt: n.scheduledAt ? n.scheduledAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
        createdBy: n.createdBy,
        totalRecipients,
        readCount,
      };
    })
  );

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Cancel a still-scheduled notification (Admin only).
 */
const cancelScheduled = async (notificationId) => {
  const notif = await Notification.findById(notificationId);
  if (!notif) {
    const error = new Error('Không tìm thấy thông báo');
    error.statusCode = 404;
    throw error;
  }

  if (notif.status === 'DISPATCHED') {
    const error = new Error('Không thể huỷ thông báo đã được gửi');
    error.statusCode = 409;
    throw error;
  }

  notif.status = 'CANCELLED';
  await notif.save();

  return { message: 'Đã huỷ thông báo thành công' };
};

module.exports = {
  createAndDispatch,
  dispatchNotification,
  createNotification,
  getMyNotifications,
  getUnreadCount,
  getUndeliveredUnread,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  getPreferences,
  updatePreferences,
  getSentHistory,
  cancelScheduled,
  formatCurrency,
  formatDate,
};
