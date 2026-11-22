const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NotificationRead = require('../models/NotificationRead');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization;

      if (token && token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
      }

      if (!token) {
        const err = new Error('Authentication error: No token provided');
        err.data = { code: 'UNAUTHORIZED' };
        return next(err);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select(
        '_id role className isActive'
      );

      if (!user || user.isActive === false) {
        const err = new Error('Authentication error: User not active or not found');
        err.data = { code: 'UNAUTHORIZED' };
        return next(err);
      }

      socket.user = {
        _id: user._id.toString(),
        role: user.role,
        className: user.className || null,
      };

      next();
    } catch (err) {
      const authErr = new Error('Authentication error: Invalid or expired token');
      authErr.data = { code: 'INVALID_TOKEN' };
      next(authErr);
    }
  });

  io.on('connection', async (socket) => {
    const { _id: userId, role, className } = socket.user;

    // Join authorized rooms derived strictly from user record
    socket.join(`user:${userId}`);
    if (role) {
      socket.join(`role:${role}`);
    }
    if (className) {
      socket.join(`class:${className}`);
    }

    // Reject/ignore any client request to join another room
    socket.onAny((event, ...args) => {
      if (event === 'join' || event === 'joinRoom') {
        // Ignored
      }
    });

    // Client delivery ack: client replies "notification:ack" { id }
    socket.on('notification:ack', async (data) => {
      try {
        const notifId = data?.id;
        if (notifId) {
          await NotificationRead.updateOne(
            { notification: notifId, user: userId },
            { $set: { deliveredAt: new Date() } }
          );
        }
      } catch (e) {
        // Silent catch ack error
      }
    });

    // Offline / Reconnect recovery (Section 3.4):
    // Re-emit any rows with deliveredAt = null and readAt = null for this user
    try {
      const notificationService = require('../services/notificationService');
      const pendingUndelivered = await notificationService.getUndeliveredUnread(userId);
      for (const item of pendingUndelivered) {
        socket.emit('notification:new', item);
      }

      // Also send current unread count to this socket
      const unreadCount = await notificationService.getUnreadCount(userId);
      socket.emit('notification:unread', { unreadCount });
    } catch (e) {
      // Ignore recovery errors
    }
  });

  return io;
};

const getIo = () => io;

const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

const emitToRole = (role, event, data) => {
  if (!io) return;
  io.to(`role:${role}`).emit(event, data);
};

const emitToClass = (className, event, data) => {
  if (!io) return;
  io.to(`class:${className}`).emit(event, data);
};

const emitToAll = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

module.exports = {
  initSocket,
  getIo,
  emitToUser,
  emitToRole,
  emitToClass,
  emitToAll,
};

