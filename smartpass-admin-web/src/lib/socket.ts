import { io, Socket } from 'socket.io-client';
import { notify } from './notify';
import { NotificationItem } from '../api/services';

let socket: Socket | null = null;
type NotificationListener = (notif: NotificationItem) => void;
type UnreadListener = (count: number) => void;

const notificationListeners = new Set<NotificationListener>();
const unreadListeners = new Set<UnreadListener>();

export const initSocket = (token: string, onNavigate?: (route: string) => void) => {
  if (socket) {
    socket.disconnect();
  }

  const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:3000'
    : `http://${window.location.hostname}:3000`;

  socket = io(socketUrl, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    // Connected to Socket.IO server
  });

  socket.on('notification:new', (notif: NotificationItem) => {
    const notifId = notif.id || notif._id;
    if (notifId && socket) {
      socket.emit('notification:ack', { notificationId: notifId });
    }

    if (!notif.isSilent) {
      notify.realtime({
        title: notif.title,
        body: notif.body,
        priority: notif.priority,
        onClick: () => {
          if (notif.actionRoute && onNavigate) {
            onNavigate(notif.actionRoute);
          }
        },
      });
    }

    notificationListeners.forEach((cb) => cb(notif));
  });

  socket.on('notification:unread', (payload: { count: number }) => {
    unreadListeners.forEach((cb) => cb(payload.count));
  });

  socket.on('notification:read', () => {
    unreadListeners.forEach((cb) => cb(-1));
  });

  socket.on('notification:read_all', () => {
    unreadListeners.forEach((cb) => cb(0));
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToNotifications = (cb: NotificationListener) => {
  notificationListeners.add(cb);
  return () => {
    notificationListeners.delete(cb);
  };
};

export const subscribeToUnread = (cb: UnreadListener) => {
  unreadListeners.add(cb);
  return () => {
    unreadListeners.delete(cb);
  };
};

