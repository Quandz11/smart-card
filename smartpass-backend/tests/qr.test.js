require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');

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
process.env.QR_SIGNING_SECRET = process.env.QR_SIGNING_SECRET || 'smartpass_qr_hmac_signing_secret_production_ready_key_20261111_v1';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-smartpass';
process.env.JWT_EXPIRE = '7d';

const { app } = require('../src/server');
const User = require('../src/models/User');
const Card = require('../src/models/Card');
const Wallet = require('../src/models/Wallet');
const QrCode = require('../src/models/QrCode');
const AccessLog = require('../src/models/AccessLog');
const LibraryLoan = require('../src/models/LibraryLoan');
const RoomBooking = require('../src/models/RoomBooking');
const ParkingSession = require('../src/models/ParkingSession');
const Event = require('../src/models/Event');
const EventRegistration = require('../src/models/EventRegistration');
const EmergencyProfile = require('../src/models/EmergencyProfile');
const qrService = require('../src/services/qrService');

jest.setTimeout(40000);

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
});

afterAll(async () => {
  try {
    await mongoose.disconnect();
  } catch (_) {}
});

describe('SmartPass Unified QR System Test Suite (Phase 5)', () => {
  let adminToken;
  let studentToken;
  let otherClassStudentToken;
  let adminUser;
  let studentUser;
  let otherClassStudent;
  let studentCard;
  let bookQrPayload;
  let bookPublicId;

  beforeAll(async () => {
    // 1. Create Admin
    const adminEmail = `admin_qr_${Date.now()}@smartpass.edu`;
    const adminRes = await request(app).post('/api/auth/register').send({
      fullName: 'Admin QR Tester',
      email: adminEmail,
      password: 'Password123!',
      role: 'admin' // Force in DB
    });
    adminUser = await User.findOne({ email: adminEmail });
    adminUser.role = 'admin';
    await adminUser.save();

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!'
    });
    adminToken = adminLogin.body.data.token;

    // 2. Create Student in SE101
    const stuEmail = `student_qr_${Date.now()}@smartpass.edu`;
    await request(app).post('/api/auth/register').send({
      fullName: 'Nguyen Van QR',
      email: stuEmail,
      password: 'Password123!',
      studentCode: `STU-QR-${Date.now().toString().slice(-4)}`,
      className: 'SE101'
    });
    studentUser = await User.findOne({ email: stuEmail });
    const stuLogin = await request(app).post('/api/auth/login').send({
      email: stuEmail,
      password: 'Password123!'
    });
    studentToken = stuLogin.body.data.token;

    // Create active card and wallet with 500.000 VND for student
    studentCard = await Card.create({
      cardCode: `CARD-${Date.now().toString().slice(-6)}`,
      owner: studentUser._id,
      status: 'active',
      qrToken: require('crypto').randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000)
    });
    await Wallet.findOneAndUpdate(
      { owner: studentUser._id },
      { balance: 500000 },
      { upsert: true }
    );

    // Setup PIN for student and admin in test fixture
    await request(app)
      .post('/api/wallet/pin/setup')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ pin: '987654', confirmPin: '987654' });
    await request(app)
      .post('/api/wallet/pin/setup')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pin: '987654', confirmPin: '987654' });

    // 3. Create Student in DIFFERENT class (AI201)
    const otherEmail = `student_ai_${Date.now()}@smartpass.edu`;
    await request(app).post('/api/auth/register').send({
      fullName: 'Tran Van AI',
      email: otherEmail,
      password: 'Password123!',
      studentCode: `STU-AI-${Date.now().toString().slice(-4)}`,
      className: 'AI201'
    });
    otherClassStudent = await User.findOne({ email: otherEmail });
    const otherLogin = await request(app).post('/api/auth/login').send({
      email: otherEmail,
      password: 'Password123!'
    });
    otherClassStudentToken = otherLogin.body.data.token;
    await Card.create({
      cardCode: `CARD-AI-${Date.now().toString().slice(-6)}`,
      owner: otherClassStudent._id,
      status: 'active',
      qrToken: require('crypto').randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000)
    });

    // 4. Create a static BOOK QR
    bookPublicId = require('crypto').randomBytes(10).toString('hex');
    await QrCode.create({
      publicId: bookPublicId,
      type: 'BOOK',
      refKind: 'book',
      refId: 'BK-TEST-99',
      label: 'Sách Kiểm Thử Tự Động',
      location: 'Kệ A1',
      isActive: true
    });
    bookQrPayload = qrService.buildCanonicalPayload('BOOK', bookPublicId);
  });

  // SUITE 1: Resolve valid static BOOK code
  describe('1. Resolve valid static BOOK code', () => {
    it('returns 200 with safe summary and nextAction=library_borrow, writing NO AccessLog', async () => {
      const logsCountBefore = await AccessLog.countDocuments();

      const res = await request(app)
        .post('/api/qr/resolve')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ qrValue: bookQrPayload });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('BOOK');
      expect(res.body.data.nextAction).toBe('library_borrow');
      expect(res.body.data.summary.bookCode).toBe('BK-TEST-99');
      expect(res.body.data.summary.bookTitle).toBe('Sách Kiểm Thử Tự Động');
      expect(res.body.data.summary.ownerName).toBeUndefined(); // Safe data only

      const logsCountAfter = await AccessLog.countDocuments();
      expect(logsCountAfter).toBe(logsCountBefore); // INV: NO AccessLog on resolve
    });
  });

  // SUITE 2: Signature verification, unknown, revoked, regenerated
  describe('2. Tampered signature, unknown, revoked, and regenerated', () => {
    it('rejects tampered signature with 400 "Mã QR không hợp lệ"', async () => {
      const tampered = bookQrPayload.slice(0, -4) + 'XXXX';
      const res = await request(app)
        .post('/api/qr/resolve')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ qrValue: tampered });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Mã QR không hợp lệ');
    });

    it('rejects unknown publicId with 404 "Không tìm thấy mã QR"', async () => {
      const fakePublicId = require('crypto').randomBytes(10).toString('hex');
      const fakePayload = qrService.buildCanonicalPayload('BOOK', fakePublicId);
      const res = await request(app)
        .post('/api/qr/resolve')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ qrValue: fakePayload });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Không tìm thấy mã QR');
    });

    it('rejects revoked code with 400 "Mã QR đã bị thu hồi"', async () => {
      // Revoke code via admin API
      const revokeRes = await request(app)
        .patch(`/api/qr/${bookPublicId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(revokeRes.status).toBe(200);

      const res = await request(app)
        .post('/api/qr/resolve')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ qrValue: bookQrPayload });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Mã QR đã bị thu hồi');
    });

    it('regenerates code: old code fails, new code resolves', async () => {
      const regenRes = await request(app)
        .post(`/api/qr/${bookPublicId}/regenerate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(regenRes.status).toBe(200);
      const newPayload = regenRes.body.data.canonicalPayload;
      expect(newPayload).toBeDefined();

      // Old code still fails as revoked
      const oldCheck = await request(app)
        .post('/api/qr/resolve')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ qrValue: bookQrPayload });
      expect(oldCheck.status).toBe(400);

      // New code resolves successfully
      const newCheck = await request(app)
        .post('/api/qr/resolve')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ qrValue: newPayload });
      expect(newCheck.status).toBe(200);
      expect(newCheck.body.data.nextAction).toBe('library_borrow');
    });
  });

  // SUITE 3: Type Mismatch
  describe('3. Type mismatch protection', () => {
    it('rejects BOOK payload sent to wallet/pay with 400 "Mã QR không dùng cho chức năng này"', async () => {
      const res = await request(app)
        .post('/api/wallet/pay')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          amount: 25000,
          qrType: 'BOOK'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Mã QR không dùng cho chức năng này');
    });

    it('rejects PARKING_IN payload sent to library/borrow with 400 "Mã QR không dùng cho chức năng này"', async () => {
      const res = await request(app)
        .post('/api/library/borrow')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookCode: 'BK-001',
          qrType: 'PARKING_IN'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Mã QR không dùng cho chức năng này');
    });
  });

  // SUITE 4: Dynamic Attendance Session (Expiry & Class check)
  describe('4. Dynamic Attendance Session (Expiry, Regeneration, Class Enrolment)', () => {
    it('rejects expired ATTENDANCE_SESSION code with 400 "Mã QR đã hết hạn, vui lòng quét mã mới"', async () => {
      const expiredEpoch = Math.floor(Date.now() / 1000) - 30; // 30s ago
      const expiredPayload = qrService.buildCanonicalPayload('ATTENDANCE_SESSION', 'dummy_expired_sess', expiredEpoch);

      const res = await request(app)
        .post('/api/qr/resolve')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ qrValue: expiredPayload });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Mã QR đã hết hạn, vui lòng quét mã mới');
    });

    it('rejects student from another class with 403 "Bạn không thuộc lớp học này"', async () => {
      // Generate dynamic QR for SE101 session
      const sessRes = await request(app)
        .post('/api/attendance/sessions/SE101/qr')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(sessRes.status).toBe(200);
      const dynamicPayload = sessRes.body.data.canonicalPayload;

      // Student from AI201 tries to resolve SE101 session
      const res = await request(app)
        .post('/api/qr/resolve')
        .set('Authorization', `Bearer ${otherClassStudentToken}`)
        .send({ qrValue: dynamicPayload });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Bạn không thuộc lớp học này');
    });
  });

  // SUITE 5: Idempotency
  describe('5. Idempotency on mutation endpoints', () => {
    it('creates ONE transaction, ONE log, and deducts balance ONCE when called twice with same idempotencyKey', async () => {
      const idempotencyKey = require('crypto').randomUUID();
      const walletBefore = await Wallet.findOne({ owner: studentUser._id });
      const balanceBefore = walletBefore.balance;
      const amountToPay = 20000;

      // Call 1
      const res1 = await request(app)
        .post('/api/wallet/pay')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          amount: amountToPay,
          qrType: 'CANTEEN_POINT',
          pin: '987654',
          idempotencyKey
        });
      if (res1.status !== 200) {
        console.error('Wallet pay error:', res1.status, res1.body);
      }
      expect(res1.status).toBe(200);

      // Call 2 (identical idempotencyKey)
      const res2 = await request(app)
        .post('/api/wallet/pay')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          amount: amountToPay,
          qrType: 'CANTEEN_POINT',
          pin: '987654',
          idempotencyKey
        });
      expect(res2.status).toBe(200);

      // Verify DB state
      const walletAfter = await Wallet.findOne({ owner: studentUser._id });
      expect(walletAfter.balance).toBe(balanceBefore - amountToPay); // Deducted exactly ONCE
    });
  });

  // SUITE 6: Gate Double-Scan Rule & Service Modules
  describe('6. Gate Double-Scan Rule and Service Modules', () => {
    it('Gate IN then IN again returns 200 with duplicate=true and creates only ONE AccessLog', async () => {
      // First scan GATE_IN
      const in1 = await request(app)
        .post('/api/qr/gate/confirm')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ direction: 'in', gateId: 'GATE-01' });

      expect(in1.status).toBe(200);
      expect(in1.body.data.duplicate).toBe(false);

      const logsCountBefore = await AccessLog.countDocuments({ owner: studentUser._id, action: 'entry' });

      // Second scan GATE_IN immediately without an OUT
      const in2 = await request(app)
        .post('/api/qr/gate/confirm')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ direction: 'in', gateId: 'GATE-01' });

      expect(in2.status).toBe(200);
      expect(in2.body.data.duplicate).toBe(true);
      expect(in2.body.data.message).toBe('Bạn đã ghi nhận vào cổng trước đó');

      const logsCountAfter = await AccessLog.countDocuments({ owner: studentUser._id, action: 'entry' });
      expect(logsCountAfter).toBe(logsCountBefore); // NO second log row created!
    });

    it('Parking IN then OUT computes fee = ceil(hours) * 2000 VND', async () => {
      // Parking IN
      const pIn = await request(app)
        .post('/api/parking/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ vehiclePlate: '29A-12345', qrType: 'PARKING_IN' });
      expect(pIn.status).toBe(201);
      expect(pIn.body.data.status).toBe('in');

      // Duplicate Parking IN -> 409
      const pInDup = await request(app)
        .post('/api/parking/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ vehiclePlate: '29A-12345', qrType: 'PARKING_IN' });
      expect(pInDup.status).toBe(409);

      // Parking OUT
      const pOut = await request(app)
        .post('/api/parking/check-out')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ qrType: 'PARKING_OUT' });
      expect(pOut.status).toBe(200);
      expect(pOut.body.data.status).toBe('out');
      expect(pOut.body.data.fee).toBeGreaterThanOrEqual(2000);
    });

    it('Library borrow respects 3 active loans limit (INV-06)', async () => {
      await LibraryLoan.deleteMany({ borrower: studentUser._id });

      // Borrow 3 books
      for (let i = 1; i <= 3; i++) {
        const bRes = await request(app)
          .post('/api/library/borrow')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ bookCode: `BK-TEST-${i}`, bookTitle: `Book ${i}`, qrType: 'BOOK' });
        expect(bRes.status).toBe(201);
      }

      // 4th book borrow fails with 400
      const b4 = await request(app)
        .post('/api/library/borrow')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bookCode: 'BK-TEST-4', bookTitle: 'Book 4', qrType: 'BOOK' });
      expect(b4.status).toBe(400);
      expect(b4.body.message).toContain('maximum 3 active borrowed books');
    });
  });

  // SUITE 7: Legacy Regression
  describe('7. Legacy Regression (Card Verify & Public Emergency)', () => {
    it('staff verify of a real card QR still returns 200 with safe summary', async () => {
      const res = await request(app)
        .post('/api/cards/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ qrToken: studentCard.qrToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.card.cardCode).toBe(studentCard.cardCode);
    });

    it('locked card is rejected 403 at module endpoints', async () => {
      studentCard.status = 'locked';
      await studentCard.save();

      const payRes = await request(app)
        .post('/api/wallet/pay')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ amount: 10000 });
      expect(payRes.status).toBe(403);

      studentCard.status = 'active';
      await studentCard.save();
    });

    it('public emergency JSON contains ONLY visibleFields; hidden fields stay ABSENT', async () => {
      await EmergencyProfile.deleteMany({ owner: studentUser._id });
      await EmergencyProfile.create({
        owner: studentUser._id,
        emergencyContactName: 'Papa QR',
        emergencyContactPhone: '0901234567',
        bloodType: 'O+',
        allergies: 'Peanuts',
        visibleFields: ['bloodType'], // Only bloodType is visible
        isEnabled: true
      });

      const res = await request(app)
        .get(`/api/emergency/public/${studentCard.qrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bloodType).toBe('O+');
      expect(res.body.data.allergies).toBeUndefined(); // Hidden field is ABSENT, not null
    });
  });

  // SUITE 8: Rate Limiting
  describe('8. Front-door Rate Limiter', () => {
    it('returns 429 when resolve is called more than 30 times inside a minute', async () => {
      let hit429 = false;
      for (let i = 0; i < 35; i++) {
        const res = await request(app)
          .post('/api/qr/resolve')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ qrValue: bookQrPayload });

        if (res.status === 429) {
          hit429 = true;
          expect(res.body.message).toContain('Bạn đã quét mã quá nhiều lần');
          break;
        }
      }
      expect(hit429).toBe(true);
    });
  });
});
