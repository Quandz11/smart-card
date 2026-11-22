require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');

// Derive test DB URI ending in _test from MONGO_URI, or use MONGO_URI_TEST
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
process.env.JWT_EXPIRE = '7d';

const { app } = require('../src/server');
const User = require('../src/models/User');
const Card = require('../src/models/Card');
const Wallet = require('../src/models/Wallet');
const CanteenTransaction = require('../src/models/CanteenTransaction');
const AccessLog = require('../src/models/AccessLog');
const EmergencyProfile = require('../src/models/EmergencyProfile');
const RoomBooking = require('../src/models/RoomBooking');
const ParkingSession = require('../src/models/ParkingSession');
const LibraryLoan = require('../src/models/LibraryLoan');

jest.setTimeout(30000);

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  } else if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => mongoose.connection.once('open', resolve));
  }
  // Clear any existing test collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    await mongoose.disconnect();
  } catch (err) {
    // ignore
  }
});

describe('SmartPass Acceptance & Invariants Test Suite', () => {
  let adminToken;
  let studentToken;
  let studentId;
  let studentEmail = 'student.test@smartpass.edu';
  let studentPassword = 'Password@123';
  let studentCardId;
  let studentCardCode = 'CARD-STU-TEST-01';
  let studentQrToken;

  test('1. POST /api/auth/register returns 201 and the response contains no password field anywhere', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Student Test User',
        email: studentEmail,
        password: studentPassword,
        phone: '0901234567',
        studentCode: 'STU_TEST_01',
        className: 'SE101',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
    // Invariant: password never in JSON response
    expect(JSON.stringify(res.body)).not.toContain('"password"');
    expect(JSON.stringify(res.body)).not.toContain('Password@123');

    studentId = res.body.data.user._id;

    // Create an Admin user for subsequent admin endpoints
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Admin Test User',
        email: 'admin.test@smartpass.edu',
        password: 'AdminPassword@123',
        role: 'admin',
      });
    expect(adminRes.status).toBe(201);
    // Public register always assigns role student; promote to admin in DB for test fixture
    await User.updateOne({ email: 'admin.test@smartpass.edu' }, { role: 'admin' });
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.test@smartpass.edu',
        password: 'AdminPassword@123',
      });
    adminToken = adminLoginRes.body.data.token;
  });

  test('2. POST /api/auth/login with correct credentials returns 200 and a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: studentEmail,
        password: studentPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(studentEmail);
    expect(res.body.data.user.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('"password"');
    studentToken = res.body.data.token;
  });

  test('3. Login with a non-existent email AND login with a wrong password AND login to a locked account all return 401 with the exact same message "Invalid email or password"', async () => {
    // 3a. Non-existent email
    const nonExistentRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nobody.does.not.exist@smartpass.edu',
        password: 'AnyPassword@123',
      });
    expect(nonExistentRes.status).toBe(401);
    expect(nonExistentRes.body.success).toBe(false);
    expect(nonExistentRes.body.message).toBe('Invalid email or password');

    // 3b. Wrong password
    const wrongPassRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: studentEmail,
        password: 'WrongPassword@999',
      });
    expect(wrongPassRes.status).toBe(401);
    expect(wrongPassRes.body.success).toBe(false);
    expect(wrongPassRes.body.message).toBe('Invalid email or password');

    // Trigger account lock (4 more failures = 5 failures total)
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: studentEmail, password: 'WrongPassword@999' });
    }

    // Verify internally that account is locked in the database
    const dbUserAfter5 = await User.findById(studentId);
    expect(dbUserAfter5.failedLoginAttempts).toBe(5);
    expect(dbUserAfter5.lockedUntil).not.toBeNull();

    // 3c. Locked account (attempting with correct password during lock)
    const lockedRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: studentEmail,
        password: studentPassword,
      });
    expect(lockedRes.status).toBe(401);
    expect(lockedRes.body.success).toBe(false);
    expect(lockedRes.body.message).toBe('Invalid email or password'); // Must NOT reveal account is locked
    expect(JSON.stringify(lockedRes.body)).not.toContain('lockedUntil');
    expect(JSON.stringify(lockedRes.body)).not.toContain('failedLoginAttempts');

    // Reset lock directly in DB so subsequent tests can use student account
    await User.findByIdAndUpdate(studentId, { failedLoginAttempts: 0, lockedUntil: null });
  });

  test('4. POST /api/cards as admin with a non-existent owner id returns 404 and creates no card', async () => {
    const fakeOwnerId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cardCode: 'CARD-SHOULD-NOT-EXIST',
        owner: fakeOwnerId,
        expiresAt: '2028-12-31T23:59:59.000Z',
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Owner not found');

    // Verify card was not created
    const cardInDb = await Card.findOne({ cardCode: 'CARD-SHOULD-NOT-EXIST' });
    expect(cardInDb).toBeNull();

    // Now create a valid card for our student
    const validCardRes = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cardCode: studentCardCode,
        owner: studentId,
        expiresAt: '2028-12-31T23:59:59.000Z',
        nfcUid: 'NFC-STU-01',
      });
    expect(validCardRes.status).toBe(201);
    studentCardId = validCardRes.body.data._id;
    studentQrToken = validCardRes.body.data.qrToken;
  });

  test('5. A locked card is rejected (403) by POST /api/attendance/check, POST /api/library/borrow, POST /api/wallet/pay, and POST /api/parking/check-in', async () => {
    // Lock the card
    const lockRes = await request(app)
      .patch(`/api/cards/${studentCardId}/lock`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(lockRes.status).toBe(200);
    expect(lockRes.body.data.status).toBe('locked');

    // 5a. Attendance check rejected
    const attRes = await request(app)
      .post('/api/attendance/check')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cardCode: studentCardCode,
        classSession: 'SESSION-LOCK-TEST',
      });
    expect(attRes.status).toBe(403);
    expect(attRes.body.success).toBe(false);

    // 5b. Library borrow rejected
    const libRes = await request(app)
      .post('/api/library/borrow')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cardCode: studentCardCode,
        bookCode: 'BOOK-LOCK-01',
        bookTitle: 'Testing With Locked Card',
      });
    expect(libRes.status).toBe(403);
    expect(libRes.body.success).toBe(false);

    // 5c. Wallet pay rejected
    const payRes = await request(app)
      .post('/api/wallet/pay')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cardCode: studentCardCode,
        amount: 5000,
      });
    expect(payRes.status).toBe(403);
    expect(payRes.body.success).toBe(false);

    // 5d. Parking check-in rejected
    const parkRes = await request(app)
      .post('/api/parking/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cardCode: studentCardCode,
        vehiclePlate: '29A-999.99',
      });
    expect(parkRes.status).toBe(403);
    expect(parkRes.body.success).toBe(false);

    // Unlock card for subsequent tests
    const unlockRes = await request(app)
      .patch(`/api/cards/${studentCardId}/unlock`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(unlockRes.status).toBe(200);
    expect(unlockRes.body.data.status).toBe('active');
  });

  test('6. POST /api/wallet/pay with an amount greater than the balance returns 400, and afterwards the wallet balance, the CanteenTransaction count, and the AccessLog count are all unchanged', async () => {
    // Setup PIN for admin and student
    await request(app)
      .post('/api/wallet/pin/setup')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pin: '987654', confirmPin: '987654' });

    await request(app)
      .post('/api/wallet/pin/setup')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ pin: '987654', confirmPin: '987654' });

    // Top-up wallet with 10,000 VND
    await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: studentId,
        amount: 10000,
        note: 'Baseline balance',
        pin: '987654',
      });

    const initialWallet = await Wallet.findOne({ owner: studentId });
    const initialBalance = initialWallet.balance;
    const initialTxCount = await CanteenTransaction.countDocuments();
    const initialLogCount = await AccessLog.countDocuments();

    // Attempt to pay 50,000 VND (greater than 10,000 VND balance)
    const overpayRes = await request(app)
      .post('/api/wallet/pay')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cardCode: studentCardCode,
        amount: 50000,
        pin: '987654',
      });

    expect(overpayRes.status).toBe(400);
    expect(overpayRes.body.success).toBe(false);
    expect(overpayRes.body.message).toContain('Insufficient');

    // Verify state unchanged
    const afterWallet = await Wallet.findOne({ owner: studentId });
    expect(afterWallet.balance).toBe(initialBalance);

    const afterTxCount = await CanteenTransaction.countDocuments();
    expect(afterTxCount).toBe(initialTxCount);

    const afterLogCount = await AccessLog.countDocuments();
    expect(afterLogCount).toBe(initialLogCount);
  });

  test('7. GET /api/emergency/public/:qrToken returns ONLY the fields in visibleFields. Non-visible fields are truly absent from JSON', async () => {
    // Configure Emergency Profile with only fullName and emergencyContactPhone
    await request(app)
      .put('/api/emergency/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        fullName: 'Student Test User',
        emergencyContactName: 'Test Father',
        emergencyContactPhone: '0988776655',
        allergies: 'Penicillin, Shellfish',
        bloodType: 'B+',
        insuranceInfo: 'BHYT-123456789',
        visibleFields: ['fullName', 'emergencyContactPhone'],
        isEnabled: true,
      });

    // Public scan with qrToken (no authentication)
    const pubRes = await request(app).get(`/api/emergency/public/${studentQrToken}`);

    expect(pubRes.status).toBe(200);
    expect(pubRes.body.success).toBe(true);
    expect(pubRes.body.data.fullName).toBe('Student Test User');
    expect(pubRes.body.data.emergencyContactPhone).toBe('0988776655');

    // Strict invariant: absent fields MUST NOT be present in JSON (not null, not undefined)
    expect(pubRes.body.data).not.toHaveProperty('allergies');
    expect(pubRes.body.data).not.toHaveProperty('bloodType');
    expect(pubRes.body.data).not.toHaveProperty('insuranceInfo');
    expect(pubRes.body.data).not.toHaveProperty('emergencyContactName');
    expect(pubRes.body.data).not.toHaveProperty('email');
    expect(pubRes.body.data).not.toHaveProperty('password');
    expect(pubRes.body.data).not.toHaveProperty('studentCode');

    // Exactly 2 keys returned
    expect(Object.keys(pubRes.body.data).sort()).toEqual(['emergencyContactPhone', 'fullName'].sort());
  });

  test('8. Room booking conflict returns 409, and approve/reject endpoints work without body status', async () => {
    // 8a. Create first room booking
    const b1Res = await request(app)
      .post('/api/room-bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        room: 'Lab-404',
        date: '2026-11-25',
        startTime: '10:00',
        endTime: '12:00',
        purpose: 'AI Robotics Workshop',
      });
    expect(b1Res.status).toBe(201);
    const b1Id = b1Res.body.data._id;

    // 8b. Admin approves first booking without body status (Fix 6)
    const approveRes = await request(app)
      .patch(`/api/room-bookings/${b1Id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('approved');

    // Re-approving non-pending booking returns 400
    const reApproveRes = await request(app)
      .patch(`/api/room-bookings/${b1Id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(reApproveRes.status).toBe(400);
    expect(reApproveRes.body.message).toBe('Only a pending booking can be approved');

    // 8c. Overlapping booking for same room and date returns 409
    const conflictRes = await request(app)
      .post('/api/room-bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        room: 'Lab-404',
        date: '2026-11-25',
        startTime: '11:00',
        endTime: '13:00',
        purpose: 'Overlapping Session',
      });
    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.message).toBe('Room is already booked for this time slot');

    // 8d. Test reject endpoint without body status (Fix 6)
    const b2Res = await request(app)
      .post('/api/room-bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        room: 'Lab-404',
        date: '2026-11-25',
        startTime: '14:00',
        endTime: '16:00',
        purpose: 'Afternoon Session',
      });
    expect(b2Res.status).toBe(201);
    const b2Id = b2Res.body.data._id;

    const rejectRes = await request(app)
      .patch(`/api/room-bookings/${b2Id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe('rejected');
  });

  test('9. A student calling an admin-only endpoint returns 403; calling it with no token returns 401', async () => {
    // Student token calling admin endpoint -> 403
    const forbiddenRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.success).toBe(false);
    expect(forbiddenRes.body.message).toBe('You do not have permission for this action');

    // No token calling admin endpoint -> 401
    const unauthRes = await request(app).get('/api/users');
    expect(unauthRes.status).toBe(401);
    expect(unauthRes.body.success).toBe(false);
    expect(unauthRes.body.message).toContain('token');
  });

  test('10. Fix 5: DELETE /api/users/:id deletes user and associated records in transaction without leaving orphans', async () => {
    // Create a temporary user with wallet, card, emergency profile, and an access log
    const tempUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Cleanup Target User',
        email: 'cleanup.target@smartpass.edu',
        password: 'Password@123',
      });
    expect(tempUserRes.status).toBe(201);
    const tempUserId = tempUserRes.body.data.user._id;

    // Create a card for temp user
    const tempCardRes = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cardCode: 'CARD-CLEANUP-01',
        owner: tempUserId,
        expiresAt: '2028-12-31T23:59:59.000Z',
      });
    expect(tempCardRes.status).toBe(201);

    // Record an access log for temp user
    await AccessLog.create({
      card: tempCardRes.body.data._id,
      owner: tempUserId,
      action: 'attendance',
      location: 'Main Gate',
      detail: 'Test Log For Cleanup',
    });

    // Delete user via admin API
    const deleteRes = await request(app)
      .delete(`/api/users/${tempUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.message).toBe('User deleted successfully');

    // Verify all associated records are deleted
    const deletedUser = await User.findById(tempUserId);
    expect(deletedUser).toBeNull();

    const deletedWallet = await Wallet.findOne({ owner: tempUserId });
    expect(deletedWallet).toBeNull();

    const deletedCards = await Card.find({ owner: tempUserId });
    expect(deletedCards.length).toBe(0);

    const deletedEmergency = await EmergencyProfile.findOne({ owner: tempUserId });
    expect(deletedEmergency).toBeNull();

    // Verify AccessLog is preserved but anonymized (owner = null)
    const logs = await AccessLog.find({ detail: 'Test Log For Cleanup' });
    expect(logs.length).toBe(1);
    expect(logs[0].owner).toBeNull();
  });
});
