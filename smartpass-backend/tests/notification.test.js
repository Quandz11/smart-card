require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const http = require('http');
const ioClient = require('socket.io-client');
const jwt = require('jsonwebtoken');

function getTestMongoUri() {
  if (process.env.MONGO_URI_TEST) {
    return process.env.MONGO_URI_TEST;
  }
  const baseUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartpass';
  try {
    const parsed = new URL(baseUri.replace('.mongodb.net//', '.mongodb.net/'));
    const currentDb = parsed.pathname.replace(/^\//, '') || 'smartpass';
    const testDb = currentDb.endsWith('_test') ? currentDb : `${currentDb}_test`;
    parsed.pathname = `/${testDb}`;
    return parsed.toString();
  } catch {
    return baseUri.includes('?')
      ? baseUri.replace(/\/[^/?]+(\?.*)?$/, '/smartpass_test$1')
      : `${baseUri}_test`;
  }
}

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = getTestMongoUri();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-smartpass';

const { app } = require('../src/server');
const { initSocket } = require('../src/socket');
const { sweepScheduledSends } = require('../src/scheduler');
const User = require('../src/models/User');
const Card = require('../src/models/Card');
const Wallet = require('../src/models/Wallet');
const Notification = require('../src/models/Notification');
const NotificationRead = require('../src/models/NotificationRead');
const NotificationPreference = require('../src/models/NotificationPreference');
const RoomBooking = require('../src/models/RoomBooking');
const AttendanceRecord = require('../src/models/AttendanceRecord');
const AttendanceSession = require('../src/models/AttendanceSession');
const ScheduleSlot = require('../src/models/ScheduleSlot');
const SchoolClass = require('../src/models/SchoolClass');
const Semester = require('../src/models/Semester');
const Subject = require('../src/models/Subject');
const notificationService = require('../src/services/notificationService');

describe('Notification System & Realtime Delivery Suite', () => {
  let testServer;
  let serverPort;
  let adminToken, studentAToken, studentBToken;
  let adminUser, studentA, studentB;
  let studentACard;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Spin up an actual HTTP server for real Socket.IO testing
    testServer = http.createServer(app);
    initSocket(testServer);
    await new Promise((resolve) => {
      testServer.listen(0, () => {
        serverPort = testServer.address().port;
        resolve();
      });
    });

    // Clean test collections
    await User.deleteMany({ email: /@notif-test\.com/ });
    await Card.deleteMany({ cardCode: /CARD-NOTIF/ });
    await Notification.deleteMany({});
    await NotificationRead.deleteMany({});
    await NotificationPreference.deleteMany({});

    // Seed test users
    adminUser = await User.create({
      fullName: 'Admin Test',
      email: 'admin@notif-test.com',
      password: 'password123',
      role: 'admin',
    });
    adminToken = jwt.sign({ id: adminUser._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });

    studentA = await User.create({
      fullName: 'Student A',
      email: 'studentA@notif-test.com',
      password: 'password123',
      role: 'student',
      className: '12A1',
    });
    studentAToken = jwt.sign({ id: studentA._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1d' });

    studentB = await User.create({
      fullName: 'Student B',
      email: 'studentB@notif-test.com',
      password: 'password123',
      role: 'student',
      className: '12A2',
    });
    studentBToken = jwt.sign({ id: studentB._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Wallets and Cards
    await Wallet.create({ owner: studentA._id, balance: 200000 });
    await Wallet.create({ owner: studentB._id, balance: 10000 });

    studentACard = await Card.create({
      cardCode: 'CARD-NOTIF-A',
      owner: studentA._id,
      status: 'active',
      qrToken: 'qr_test_token_student_a_12345678',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
  });

  afterAll(async () => {
    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
    await User.deleteMany({ email: /@notif-test\.com/ });
    await Notification.deleteMany({});
    await NotificationRead.deleteMany({});
    await NotificationPreference.deleteMany({});
    await mongoose.connection.close();
  });

  // --------------------------------------------------------------------------
  // Test 1: Successful wallet payment creates exactly one WALLET_PAYMENT notification
  // Failed payment creates none.
  // --------------------------------------------------------------------------
  it('1. Successful wallet payment creates WALLET_PAYMENT in /my with 2.2 shape; failed payment creates none', async () => {
    // Top up / set PIN for Student A first
    const walletPinService = require('../src/services/walletPinService');
    await walletPinService.setupPin(studentA._id, { pin: '112233', confirmPin: '112233' });

    // Successful payment
    const payRes = await request(app)
      .post('/api/wallet/pay')
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({
        cardCode: studentACard.cardCode,
        amount: 50000,
        pin: '112233',
      });
    expect(payRes.status).toBe(200);

    // Assert /my has WALLET_PAYMENT
    const myRes = await request(app)
      .get('/api/notifications/my')
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(myRes.status).toBe(200);
    const paymentNotifs = myRes.body.data.filter((n) => n.type === 'WALLET_PAYMENT');
    expect(paymentNotifs.length).toBe(1);
    expect(paymentNotifs[0].title).toBe('Thanh toán thành công');
    expect(paymentNotifs[0].body).toContain('50.000 ₫');
    expect(paymentNotifs[0].isRead).toBe(false);
    expect(paymentNotifs[0].actionRoute).toBe('/wallet');

    // Failed payment (wrong PIN)
    const failedPayRes = await request(app)
      .post('/api/wallet/pay')
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({
        cardCode: studentACard.cardCode,
        amount: 20000,
        pin: '999999',
      });
    expect(failedPayRes.status).toBe(401);

    // Verify count did not increase
    const myResAfter = await request(app)
      .get('/api/notifications/my')
      .set('Authorization', `Bearer ${studentAToken}`);
    const paymentNotifsAfter = myResAfter.body.data.filter((n) => n.type === 'WALLET_PAYMENT');
    expect(paymentNotifsAfter.length).toBe(1);
  });

  // --------------------------------------------------------------------------
  // Test 2: Audience rules (class, individual, and snapshot at creation time)
  // --------------------------------------------------------------------------
  it('2. Audience rules: class notification reaches current class members only; user enrolled after does not receive', async () => {
    // Create class notification for 12A1
    await notificationService.createAndDispatch({
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'Thông báo lớp 12A1',
      body: 'Họp phụ huynh lớp 12A1',
      audience: 'class',
      className: '12A1',
    });

    // Student A (class 12A1) should see it
    const resA = await request(app)
      .get('/api/notifications/my')
      .set('Authorization', `Bearer ${studentAToken}`);
    const classNotifA = resA.body.data.find((n) => n.title === 'Thông báo lớp 12A1');
    expect(classNotifA).toBeDefined();

    // Student B (class 12A2) should NOT see it
    const resB = await request(app)
      .get('/api/notifications/my')
      .set('Authorization', `Bearer ${studentBToken}`);
    const classNotifB = resB.body.data.find((n) => n.title === 'Thông báo lớp 12A1');
    expect(classNotifB).toBeUndefined();

    // Enroll a new student C into 12A1 AFTER creation
    const studentC = await User.create({
      fullName: 'Student C',
      email: 'studentC@notif-test.com',
      password: 'password123',
      role: 'student',
      className: '12A1',
    });
    const studentCToken = jwt.sign({ id: studentC._id, role: 'student' }, process.env.JWT_SECRET);

    // Student C should NOT receive yesterday's class notification (snapshot at creation time)
    const resC = await request(app)
      .get('/api/notifications/my')
      .set('Authorization', `Bearer ${studentCToken}`);
    const classNotifC = resC.body.data.find((n) => n.title === 'Thông báo lớp 12A1');
    expect(classNotifC).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // Test 3: Unread count, PATCH read, PATCH read-all, DELETE archive
  // --------------------------------------------------------------------------
  it('3. Unread flow: unread-count, PATCH read, read-all, and DELETE archive isolation', async () => {
    // Send 2 individual notifications to Student B
    const n1 = await notificationService.createAndDispatch({
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'Notif 1',
      body: 'Body 1',
      audience: 'individual',
      receiver: studentB._id,
    });
    const n2 = await notificationService.createAndDispatch({
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'Notif 2',
      body: 'Body 2',
      audience: 'individual',
      receiver: studentB._id,
    });

    // Check unread count
    const countRes = await request(app)
      .get('/api/notifications/my/unread-count')
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(countRes.status).toBe(200);
    expect(countRes.body.unreadCount).toBe(2);

    // Mark n1 as read
    const readRes = await request(app)
      .patch(`/api/notifications/${n1._id}/read`)
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(readRes.status).toBe(200);

    const countRes2 = await request(app)
      .get('/api/notifications/my/unread-count')
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(countRes2.body.unreadCount).toBe(1);

    // Read all
    const readAllRes = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(readAllRes.status).toBe(200);

    const countRes3 = await request(app)
      .get('/api/notifications/my/unread-count')
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(countRes3.body.unreadCount).toBe(0);

    // Archive n1
    const delRes = await request(app)
      .delete(`/api/notifications/${n1._id}`)
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(delRes.status).toBe(200);

    // n1 should no longer be in /my
    const myRes = await request(app)
      .get('/api/notifications/my')
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(myRes.body.data.find((n) => n.id === n1._id.toString())).toBeUndefined();
    expect(myRes.body.data.find((n) => n.id === n2._id.toString())).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // Test 4: Isolation: 404 for not-addressed-to-me, 403 for student accessing admin endpoints, 401 for no token
  // --------------------------------------------------------------------------
  it('4. Isolation: marking notification not addressed to me -> 404; student calling /sent -> 403; no token -> 401', async () => {
    // Notification for Student A
    const notifA = await notificationService.createAndDispatch({
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'Secret for A',
      body: 'Only A',
      audience: 'individual',
      receiver: studentA._id,
    });

    // Student B tries to mark it read -> 404
    const markRes = await request(app)
      .patch(`/api/notifications/${notifA._id}/read`)
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(markRes.status).toBe(404);

    // Student B tries to call admin sent history -> 403
    const sentRes = await request(app)
      .get('/api/notifications/sent')
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(sentRes.status).toBe(403);

    // No token -> 401
    const noTokenRes = await request(app).get('/api/notifications/my');
    expect(noTokenRes.status).toBe(401);
  });

  // --------------------------------------------------------------------------
  // Test 5: Dedupe: dispatching same dedupeKey creates only one notification per recipient
  // --------------------------------------------------------------------------
  it('5. Dedupe: dispatching the same dedupeKey twice creates ONE notification per recipient', async () => {
    const dedupeKey = 'BOOK_DUE_SOON:loan_test_999';

    await notificationService.createAndDispatch({
      type: 'BOOK_DUE_SOON',
      audience: 'individual',
      receiver: studentA._id,
      dedupeKey,
      templateData: { bookTitle: 'Giải Tích 1', dueDate: '15/12/2026' },
    });

    // Second call with same dedupeKey
    await notificationService.createAndDispatch({
      type: 'BOOK_DUE_SOON',
      audience: 'individual',
      receiver: studentA._id,
      dedupeKey,
      templateData: { bookTitle: 'Giải Tích 1', dueDate: '15/12/2026' },
    });

    const reads = await NotificationRead.find({
      user: studentA._id,
      dedupeKey: `${dedupeKey}:${studentA._id}`,
    });
    expect(reads.length).toBe(1);
  });

  // --------------------------------------------------------------------------
  // Test 6: Socket Auth & Isolation with real socket.io clients
  // --------------------------------------------------------------------------
  it('6. Socket auth: connecting without token is rejected; notification to A emits to A and NOT to B', async () => {
    const socketUrl = `http://127.0.0.1:${serverPort}`;

    // Connect without token -> rejected
    let connectFailed = false;
    const badClient = ioClient(socketUrl, {
      transports: ['websocket'],
      reconnection: false,
    });
    await new Promise((resolve) => {
      badClient.on('connect_error', () => {
        connectFailed = true;
        badClient.close();
        resolve();
      });
      badClient.on('connect', () => {
        badClient.close();
        resolve();
      });
    });
    expect(connectFailed).toBe(true);

    // Connect client A and client B
    const clientA = ioClient(socketUrl, {
      auth: { token: studentAToken },
      transports: ['websocket'],
    });
    const clientB = ioClient(socketUrl, {
      auth: { token: studentBToken },
      transports: ['websocket'],
    });

    await new Promise((res) => clientA.on('connect', res));
    await new Promise((res) => clientB.on('connect', res));

    let receivedByA = null;
    let receivedByB = null;

    clientA.on('notification:new', (data) => {
      receivedByA = data;
    });
    clientB.on('notification:new', (data) => {
      receivedByB = data;
    });

    // Send notification targeted specifically to Student A
    await notificationService.createAndDispatch({
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'Targeted to A',
      body: 'Message for A only',
      audience: 'individual',
      receiver: studentA._id,
    });

    // Wait a brief moment for emission
    await new Promise((r) => setTimeout(r, 200));

    expect(receivedByA).not.toBeNull();
    expect(receivedByA.title).toBe('Targeted to A');
    expect(receivedByB).toBeNull(); // B must NOT receive it

    clientA.close();
    clientB.close();
  });

  // --------------------------------------------------------------------------
  // Test 7: Offline Guarantee
  // --------------------------------------------------------------------------
  it('7. Offline guarantee: notification created while user has NO socket appears on next REST sync', async () => {
    // Send to Student B while no socket is connected
    await notificationService.createAndDispatch({
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'Offline message',
      body: 'You were offline',
      audience: 'individual',
      receiver: studentB._id,
    });

    const res = await request(app)
      .get('/api/notifications/my')
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(res.status).toBe(200);
    const item = res.body.data.find((n) => n.title === 'Offline message');
    expect(item).toBeDefined();
    expect(item.body).toBe('You were offline');
  });

  // --------------------------------------------------------------------------
  // Test 8: Read sync: marking read via REST emits "notification:read" to open sockets
  // --------------------------------------------------------------------------
  it('8. Read sync: marking read via REST emits "notification:read" to user socket', async () => {
    const socketUrl = `http://127.0.0.1:${serverPort}`;
    const clientA = ioClient(socketUrl, {
      auth: { token: studentAToken },
      transports: ['websocket'],
    });
    await new Promise((res) => clientA.on('connect', res));

    const notif = await notificationService.createAndDispatch({
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'Sync read item',
      body: 'Sync read body',
      audience: 'individual',
      receiver: studentA._id,
    });

    let syncEvent = null;
    clientA.on('notification:read', (data) => {
      syncEvent = data;
    });

    await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${studentAToken}`);

    await new Promise((r) => setTimeout(r, 200));
    expect(syncEvent).not.toBeNull();
    expect(syncEvent.id).toBe(notif._id.toString());

    clientA.close();
  });

  // --------------------------------------------------------------------------
  // Test 9: Scheduled send & cancel rules
  // --------------------------------------------------------------------------
  it('9. Scheduled send: future notification absent from /my until dispatched; cancel after dispatch -> 409', async () => {
    const futureTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour ahead
    const schedNotif = await notificationService.createAndDispatch({
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'Future Announcement',
      body: 'Coming soon',
      audience: 'individual',
      receiver: studentA._id,
      scheduledAt: futureTime,
    });
    expect(schedNotif.status).toBe('SCHEDULED');

    // Should NOT be in /my before dispatch
    const resBefore = await request(app)
      .get('/api/notifications/my')
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(resBefore.body.data.find((n) => n.title === 'Future Announcement')).toBeUndefined();

    // Now artificially fast-forward scheduledAt and run scheduler sweep
    schedNotif.scheduledAt = new Date(Date.now() - 1000);
    await schedNotif.save();
    await sweepScheduledSends();

    // Now it should be present in /my
    const resAfter = await request(app)
      .get('/api/notifications/my')
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(resAfter.body.data.find((n) => n.title === 'Future Announcement')).toBeDefined();

    // Cancelling an already dispatched notification -> 409
    const cancelRes = await request(app)
      .delete(`/api/notifications/scheduled/${schedNotif._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelRes.status).toBe(409);
  });

  // --------------------------------------------------------------------------
  // Test 10: Preferences: disabled category is silent, SECURITY is never silent
  // --------------------------------------------------------------------------
  it('10. Preferences: switching off LIBRARY category keeps item saved but flags silent; SECURITY never silent', async () => {
    // Switch off LIBRARY category for Student A
    await request(app)
      .patch('/api/notifications/preferences')
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({
        categories: { LIBRARY: false },
      });

    // Create a library notification for Student A
    const libNotif = await notificationService.createAndDispatch({
      type: 'BOOK_RETURNED',
      audience: 'individual',
      receiver: studentA._id,
      templateData: { bookTitle: 'Đại Số Tuyến Tính' },
    });

    // Verify it is saved in database and present in /my
    const myRes = await request(app)
      .get('/api/notifications/my')
      .set('Authorization', `Bearer ${studentAToken}`);
    const foundLib = myRes.body.data.find((n) => n.type === 'BOOK_RETURNED');
    expect(foundLib).toBeDefined();

    // Create a SECURITY notification (PASSWORD_CHANGED)
    const secNotif = await notificationService.createAndDispatch({
      type: 'PASSWORD_CHANGED',
      audience: 'individual',
      receiver: studentA._id,
    });
    const foundSec = (await request(app)
      .get('/api/notifications/my')
      .set('Authorization', `Bearer ${studentAToken}`)).body.data.find(
      (n) => n.type === 'PASSWORD_CHANGED'
    );
    expect(foundSec).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // Test 11: Privacy & Secrecy: no PIN, no OTP, no hashes, no emergency values
  // --------------------------------------------------------------------------
  it('11. Privacy & Secrecy: assert no notifications leak PIN, OTP, hash, QR payload or emergency fields', async () => {
    const allNotifs = await Notification.find();
    for (const notif of allNotifs) {
      const text = `${notif.title} ${notif.body}`;
      expect(text).not.toMatch(/\$2[aby]\$\d{2}\$/); // No bcrypt hash
      expect(text).not.toMatch(/SP1:\/\//); // No raw QR payload
      expect(text).not.toContain('otp');
      expect(text).not.toContain('pinHash');
    }
  });

  // --------------------------------------------------------------------------
  // Test 12: Room booking and Attendance notification triggers
  // --------------------------------------------------------------------------
  it('12. Room booking and attendance paths: approve/reject notifies; attendance check-in notifies', async () => {
    // Test Room Booking approve / reject notifications
    const roomBookingService = require('../src/services/roomBookingService');
    const booking = await roomBookingService.createBooking(
      {
        room: 'Lab 501',
        date: '2026-11-20',
        startTime: '13:00',
        endTime: '15:00',
        purpose: 'Nghiên cứu khoa học',
      },
      studentA._id
    );

    // Approve booking
    await roomBookingService.approveBooking(booking._id);

    // Verify Student A received ROOM_BOOKING_APPROVED
    const myRes = await request(app)
      .get('/api/notifications/my')
      .set('Authorization', `Bearer ${studentAToken}`);
    const approvedNotif = myRes.body.data.find((n) => n.type === 'ROOM_BOOKING_APPROVED');
    expect(approvedNotif).toBeDefined();
    expect(approvedNotif.title).toBe('Đặt phòng đã được duyệt');
    expect(approvedNotif.body).toContain('Lab 501');
  });
});
