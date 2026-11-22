require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const crypto = require('crypto');

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
process.env.QR_SIGNING_SECRET = process.env.QR_SIGNING_SECRET || 'smartpass_qr_hmac_signing_secret_production_ready_key_20261111_v1';
process.env.VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || 'COCOSAM1';
process.env.VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || 'RAOEXHYVSDDIIENYWSLDIIENYWXAZQOP';
process.env.VNPAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
process.env.VNPAY_RETURN_URL = 'http://localhost:5173/wallet/vnpay-return';
process.env.VNPAY_IPN_URL = 'http://localhost:3000/api/wallet/vnpay/ipn';

const { app } = require('../src/server');
const User = require('../src/models/User');
const Card = require('../src/models/Card');
const Wallet = require('../src/models/Wallet');
const CanteenTransaction = require('../src/models/CanteenTransaction');
const AccessLog = require('../src/models/AccessLog');
const TopupOrder = require('../src/models/TopupOrder');
const OtpChallenge = require('../src/models/OtpChallenge');
const Semester = require('../src/models/Semester');
const Subject = require('../src/models/Subject');
const SchoolClass = require('../src/models/SchoolClass');
const ScheduleSlot = require('../src/models/ScheduleSlot');
const Enrollment = require('../src/models/Enrollment');
const AttendanceSession = require('../src/models/AttendanceSession');
const AttendanceRecord = require('../src/models/AttendanceRecord');
const vnpayService = require('../src/services/vnpayService');

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

describe('SmartPass Blocks A-B-C-D Full Acceptance Suite', () => {
  let adminToken, adminUser;
  let studentToken, studentUser, studentCard;
  let staffToken, staffUser;
  let librarianToken, librarianUser;
  let parkingStaffToken, parkingStaffUser;
  let semester, subject, schoolClass1, schoolClass2;

  beforeAll(async () => {
    // 1. Create Admin
    const adminEmail = `admin_abcd_${Date.now()}@smartpass.edu`;
    await request(app).post('/api/auth/register').send({
      fullName: 'Admin ABCD',
      email: adminEmail,
      password: 'Password123!',
    });
    adminUser = await User.findOne({ email: adminEmail });
    adminUser.role = 'admin';
    await adminUser.save();
    const aLog = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });
    adminToken = aLog.body.data.token;

    // Set PIN for admin (987654)
    await request(app)
      .post('/api/wallet/pin/setup')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pin: '987654', confirmPin: '987654' });

    // 2. Create Canteen Staff
    const staffEmail = `canteen_abcd_${Date.now()}@smartpass.edu`;
    await request(app).post('/api/auth/register').send({
      fullName: 'Canteen Staff ABCD',
      email: staffEmail,
      password: 'Password123!',
    });
    staffUser = await User.findOne({ email: staffEmail });
    staffUser.role = 'canteen_staff';
    await staffUser.save();
    const sLog = await request(app).post('/api/auth/login').send({
      email: staffEmail,
      password: 'Password123!',
    });
    staffToken = sLog.body.data.token;
    await request(app)
      .post('/api/wallet/pin/setup')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ pin: '765432', confirmPin: '765432' });

    // 3. Create Librarian
    const libEmail = `lib_abcd_${Date.now()}@smartpass.edu`;
    await request(app).post('/api/auth/register').send({
      fullName: 'Librarian ABCD',
      email: libEmail,
      password: 'Password123!',
    });
    librarianUser = await User.findOne({ email: libEmail });
    librarianUser.role = 'librarian';
    await librarianUser.save();
    const lLog = await request(app).post('/api/auth/login').send({
      email: libEmail,
      password: 'Password123!',
    });
    librarianToken = lLog.body.data.token;

    // 4. Create Parking Staff
    const parkEmail = `park_abcd_${Date.now()}@smartpass.edu`;
    await request(app).post('/api/auth/register').send({
      fullName: 'Parking Staff ABCD',
      email: parkEmail,
      password: 'Password123!',
    });
    parkingStaffUser = await User.findOne({ email: parkEmail });
    parkingStaffUser.role = 'parking_staff';
    await parkingStaffUser.save();
    const pLog = await request(app).post('/api/auth/login').send({
      email: parkEmail,
      password: 'Password123!',
    });
    parkingStaffToken = pLog.body.data.token;
  });

  // TEST 1: First login returns mustSetPin=true; pay before PIN setup returns 403 PIN_NOT_SET; after setup, mustSetPin=false
  describe('1. First login mustSetPin and PIN_NOT_SET enforcement', () => {
    const student1Email = `stu1_pin_${Date.now()}@smartpass.edu`;

    it('returns mustSetPin=true on first login; pay before PIN setup returns 403 PIN_NOT_SET; after setup mustSetPin=false', async () => {
      // Register new student
      await request(app).post('/api/auth/register').send({
        fullName: 'Nguyen Van Pin 1',
        email: student1Email,
        password: 'Password123!',
        studentCode: `STU-P1-${Date.now().toString().slice(-4)}`,
        className: '10A1',
      });
      studentUser = await User.findOne({ email: student1Email });

      // Create card and wallet
      studentCard = await Card.create({
        cardCode: `CARD-P1-${Date.now().toString().slice(-6)}`,
        owner: studentUser._id,
        status: 'active',
        qrToken: crypto.randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      });
      await Wallet.findOneAndUpdate(
        { owner: studentUser._id },
        { balance: 500000 },
        { upsert: true }
      );

      // Login 1
      const login1 = await request(app).post('/api/auth/login').send({
        email: student1Email,
        password: 'Password123!',
      });
      expect(login1.status).toBe(200);
      expect(login1.body.data.mustSetPin).toBe(true);
      studentToken = login1.body.data.token;

      // Pay before PIN setup -> 403 PIN_NOT_SET
      const payBefore = await request(app)
        .post('/api/wallet/pay')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ amount: 20000, pin: '987654' });
      expect(payBefore.status).toBe(403);
      expect(payBefore.body.code).toBe('PIN_NOT_SET');

      // Setup PIN
      const setupRes = await request(app)
        .post('/api/wallet/pin/setup')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ pin: '987654', confirmPin: '987654' });
      expect(setupRes.status).toBe(200);

      // Login 2 -> mustSetPin is false
      const login2 = await request(app).post('/api/auth/login').send({
        email: student1Email,
        password: 'Password123!',
      });
      expect(login2.status).toBe(200);
      expect(login2.body.data.mustSetPin).toBe(false);
    });
  });

  // TEST 2: Pay with wrong PIN -> 401 PIN_INVALID; 5 wrong PINs -> PIN_LOCKED; correct PIN resets counter
  describe('2. Pay wrong PIN, PIN_LOCKED after 5 failures, counter reset', () => {
    it('wrong PIN returns 401 PIN_INVALID and balance/transaction/log unchanged; 5 wrong PINs locks; correct resets counter', async () => {
      const walletBefore = await Wallet.findOne({ owner: studentUser._id });
      const txCountBefore = await CanteenTransaction.countDocuments();
      const logCountBefore = await AccessLog.countDocuments();

      // Wrong PIN
      const wrongPay = await request(app)
        .post('/api/wallet/pay')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ amount: 10000, pin: '888888' });
      expect(wrongPay.status).toBe(401);
      expect(wrongPay.body.code).toBe('PIN_INVALID');

      // Invariant: balance, transaction count, log count unchanged
      const walletAfter = await Wallet.findOne({ owner: studentUser._id });
      expect(walletAfter.balance).toBe(walletBefore.balance);
      expect(await CanteenTransaction.countDocuments()).toBe(txCountBefore);
      expect(await AccessLog.countDocuments()).toBe(logCountBefore);

      // 3 more failures (total 4)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/wallet/pay')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ amount: 10000, pin: '888888' });
      }

      // 5th failure -> 423 PIN_LOCKED
      const fifthPay = await request(app)
        .post('/api/wallet/pay')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ amount: 10000, pin: '888888' });
      expect(fifthPay.status).toBe(423);
      expect(fifthPay.body.code).toBe('PIN_LOCKED');

      // Attempt while locked -> 423 PIN_LOCKED
      const lockedPay = await request(app)
        .post('/api/wallet/pay')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ amount: 10000, pin: '987654' });
      expect(lockedPay.status).toBe(423);

      // Unlock for subsequent tests and verify correct PIN resets counter
      await User.updateOne(
        { _id: studentUser._id },
        { pinLockedUntil: null, pinFailedAttempts: 2 }
      );
      const correctPay = await request(app)
        .post('/api/wallet/pay')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ amount: 10000, pin: '987654' });
      expect(correctPay.status).toBe(200);

      const refreshedUser = await User.findById(studentUser._id);
      expect(refreshedUser.pinFailedAttempts).toBe(0);
    });
  });

  // TEST 3: Setup rejects a 5-digit PIN, a mismatched confirm and 123456
  describe('3. PIN setup validation: 5 digits, mismatch, trivial denylist', () => {
    it('rejects 5-digit PIN, mismatched confirm, and 123456', async () => {
      // Create user without PIN
      const tempEmail = `temp_pin_${Date.now()}@smartpass.edu`;
      await request(app).post('/api/auth/register').send({
        fullName: 'Temp Pin User',
        email: tempEmail,
        password: 'Password123!',
      });
      const tLog = await request(app).post('/api/auth/login').send({
        email: tempEmail,
        password: 'Password123!',
      });
      const tempToken = tLog.body.data.token;

      // 5 digits -> 400
      const res5 = await request(app)
        .post('/api/wallet/pin/setup')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({ pin: '12345', confirmPin: '12345' });
      expect(res5.status).toBe(400);

      // Mismatched confirm -> 400
      const resMis = await request(app)
        .post('/api/wallet/pin/setup')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({ pin: '987654', confirmPin: '111111' });
      expect(resMis.status).toBe(400);

      // Denylist trivial (123456) -> 400
      const resTriv = await request(app)
        .post('/api/wallet/pin/setup')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({ pin: '123456', confirmPin: '123456' });
      expect(resTriv.status).toBe(400);
    });
  });

  // TEST 4: No OTP threshold; payment of any amount (>200,000) succeeds with PIN alone; OTP used for RESET_PIN
  describe('4. No OTP threshold for payment; OTP strictly for RESET_PIN with replay/expiry protection', () => {
    it('large payment (>200,000 VND) succeeds with PIN alone and no OTP; RESET_PIN requires valid OTP', async () => {
      // Payment of 250,000 VND with PIN alone
      const payLarge = await request(app)
        .post('/api/wallet/pay')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ amount: 250000, pin: '987654' });
      expect(payLarge.status).toBe(200);

      // Request OTP for RESET_PIN
      const otpReq = await request(app)
        .post('/api/otp/request')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ purpose: 'RESET_PIN' });
      expect(otpReq.status).toBe(200);

      // Fetch active OTP code from in-app session
      const activeOtpRes = await request(app)
        .get('/api/otp/active')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(activeOtpRes.status).toBe(200);
      const deliveredCode = activeOtpRes.body.data.deliveredCode;
      expect(deliveredCode).toBeDefined();

      // Verify OTP -> returns otpToken
      const verifyRes = await request(app)
        .post('/api/otp/verify')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ purpose: 'RESET_PIN', code: deliveredCode });
      expect(verifyRes.status).toBe(200);
      const otpToken = verifyRes.body.data.otpToken;
      expect(otpToken).toBeDefined();

      // Reset PIN using valid otpToken
      const resetRes = await request(app)
        .post('/api/wallet/pin/reset')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ otpToken, newPin: '654987', confirmPin: '654987' });
      expect(resetRes.status).toBe(200);

      // Replaying the same otpToken fails (single-use)
      const replayRes = await request(app)
        .post('/api/wallet/pin/reset')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ otpToken, newPin: '654987', confirmPin: '654987' });
      expect(replayRes.status).toBe(400);

      // Expired challenge fails with OTP_EXPIRED
      const expiredChallenge = await OtpChallenge.create({
        user: studentUser._id,
        purpose: 'RESET_PIN',
        codeHash: crypto.createHash('sha256').update('888999').digest('hex'),
        expiresAt: new Date(Date.now() - 10000), // Expired
      });
      const expVerify = await request(app)
        .post('/api/otp/verify')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ purpose: 'RESET_PIN', code: '888999' });
      expect(expVerify.status).toBe(400);
      expect(expVerify.body.code).toBe('OTP_EXPIRED');

      // Update student PIN back to 987654 for remaining tests
      await request(app)
        .post('/api/wallet/pin/change')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ oldPin: '654987', newPin: '987654', confirmPin: '987654' });
    });
  });

  // TEST 5: Staff cash topup confirms ONLY staff PIN; wrong staff PIN moves no money; idempotency
  describe('5. Staff cash topup confirms ONLY staff PIN; student PIN not requested; idempotency', () => {
    it('wrong staff PIN moves no money; correct staff PIN succeeds exactly once with same idempotencyKey', async () => {
      const topupAmount = 50000;
      const walletBefore = await Wallet.findOne({ owner: studentUser._id });
      const balanceBefore = walletBefore.balance;
      const idempotencyKey = crypto.randomUUID();

      // Wrong staff PIN -> 401 PIN_INVALID
      const wrongStaffTopup = await request(app)
        .post('/api/wallet/topup')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          userId: studentUser._id,
          amount: topupAmount,
          pin: '000000', // Wrong staff PIN
          idempotencyKey,
        });
      expect(wrongStaffTopup.status).toBe(401);
      expect(wrongStaffTopup.body.code).toBe('PIN_INVALID');

      // Balance unchanged
      const walletCheck = await Wallet.findOne({ owner: studentUser._id });
      expect(walletCheck.balance).toBe(balanceBefore);

      // Correct staff PIN (staff pin is 765432)
      const res1 = await request(app)
        .post('/api/wallet/topup')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          userId: studentUser._id,
          amount: topupAmount,
          pin: '765432',
          idempotencyKey,
        });
      expect(res1.status).toBe(200);

      // Resubmit identical idempotencyKey
      const res2 = await request(app)
        .post('/api/wallet/topup')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          userId: studentUser._id,
          amount: topupAmount,
          pin: '765432',
          idempotencyKey,
        });
      expect(res2.status).toBe(200);

      // Credited exactly ONCE
      const walletFinal = await Wallet.findOne({ owner: studentUser._id });
      expect(walletFinal.balance).toBe(balanceBefore + topupAmount);
    });
  });

  // TEST 6: Role matrix
  describe('6. Role access matrix and public registration role escalation defense', () => {
    it('enforces role authorization on every endpoint and rejects privilege escalation in register', async () => {
      // 6a. Librarian calling parking endpoint -> 403
      const libOnParking = await request(app)
        .get('/api/parking/active')
        .set('Authorization', `Bearer ${librarianToken}`);
      expect(libOnParking.status).toBe(403);

      // 6b. Parking staff calling library loans -> 403
      const parkOnLibrary = await request(app)
        .get('/api/library/loans')
        .set('Authorization', `Bearer ${parkingStaffToken}`);
      expect(parkOnLibrary.status).toBe(403);

      // 6c. Student calling admin schedule CRUD -> 403
      const stuOnSchedule = await request(app)
        .post('/api/schedule/slots')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ room: 'A101' });
      expect(stuOnSchedule.status).toBe(403);

      // 6d. No token calling protected endpoint -> 401
      const noTokenRes = await request(app).get('/api/schedule/slots');
      expect(noTokenRes.status).toBe(401);

      // 6e. Public register with role "admin" still creates role "student"
      const fakeAdminEmail = `fake_admin_${Date.now()}@smartpass.edu`;
      await request(app).post('/api/auth/register').send({
        fullName: 'Hacker Wants Admin',
        email: fakeAdminEmail,
        password: 'Password123!',
        role: 'admin', // Escalation attempt
      });
      const createdUser = await User.findOne({ email: fakeAdminEmail });
      expect(createdUser.role).toBe('student');
    });
  });

  // TEST 7: Schedule overlap (same class and same room) -> 409; GET /api/schedule/my returns only enrolled class
  describe('7. Schedule slot conflict detection (409) and student enrolled timetable', () => {
    it('rejects overlapping slots with 409 and returns only enrolled class lessons', async () => {
      await Semester.updateMany({}, { isCurrent: false });
      semester = await Semester.create({
        name: `HK1 2026-${Date.now()}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 120 * 24 * 3600 * 1000),
        isCurrent: true,
      });
      subject = await Subject.create({
        code: `SUBJ-${Date.now().toString().slice(-4)}`,
        name: 'Lap Trinh Web Nâng Cao',
        credits: 3,
      });
      schoolClass1 = await SchoolClass.create({ name: `CLASS-A-${Date.now().toString().slice(-4)}` });
      schoolClass2 = await SchoolClass.create({ name: `CLASS-B-${Date.now().toString().slice(-4)}` });

      // Enroll studentUser into schoolClass1
      await Enrollment.create({
        student: studentUser._id,
        schoolClass: schoolClass1._id,
        semester: semester._id,
      });

      // Create base slot: Thứ 2 (dayOfWeek=2), 08:00 - 10:00, Room A101, Class 1, Teacher Admin
      const slot1Res = await request(app)
        .post('/api/schedule/slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClass: schoolClass1._id,
          subject: subject._id,
          teacher: adminUser._id,
          room: 'A101',
          semester: semester._id,
          dayOfWeek: 2,
          startTime: '08:00',
          endTime: '10:00',
          startWeek: 1,
          endWeek: 15,
        });
      expect(slot1Res.status).toBe(201);

      // Overlap 1: Same class at overlapping time (09:00 - 11:00) -> 409
      const overlapClassRes = await request(app)
        .post('/api/schedule/slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClass: schoolClass1._id,
          subject: subject._id,
          teacher: staffUser._id,
          room: 'B202',
          semester: semester._id,
          dayOfWeek: 2,
          startTime: '09:00',
          endTime: '11:00',
          startWeek: 1,
          endWeek: 15,
        });
      expect(overlapClassRes.status).toBe(409);
      expect(overlapClassRes.body.message).toContain('Lớp học đã có tiết');

      // Overlap 2: Same room at overlapping time (08:30 - 09:30) with Class 2 -> 409
      const overlapRoomRes = await request(app)
        .post('/api/schedule/slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolClass: schoolClass2._id,
          subject: subject._id,
          teacher: staffUser._id,
          room: 'A101',
          semester: semester._id,
          dayOfWeek: 2,
          startTime: '08:30',
          endTime: '09:30',
          startWeek: 1,
          endWeek: 15,
        });
      expect(overlapRoomRes.status).toBe(409);
      expect(overlapRoomRes.body.message).toContain('Phòng học đã được xếp');

      // Student timetable GET /api/schedule/my?week=2
      const myScheduleRes = await request(app)
        .get('/api/schedule/my?week=2')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(myScheduleRes.status).toBe(200);
      expect(myScheduleRes.body.data.slots.length).toBe(1);
      expect(myScheduleRes.body.data.slots[0].room).toBe('A101');
    });
  });

  // TEST 8: Attendance session lifecycle, check-in status, duplicate, close absent, correction audit log
  describe('8. Attendance session lifecycle: open twice (one session), check-in, close ABSENT, correction audit log', () => {
    let slot, session, otherStudent, otherToken;

    it('manages attendance lifecycle: open once, idempotent check-in, close auto-ABSENT, and audit-logged correction', async () => {
      const sem = await Semester.findOne({ isCurrent: true });
      const sClass = schoolClass1;
      const subj = subject;

      // Ensure studentUser is enrolled in sClass for sem
      await Enrollment.findOneAndUpdate(
        { student: studentUser._id, semester: sem._id },
        { schoolClass: sClass._id },
        { upsert: true }
      );

      slot = await ScheduleSlot.create({
        schoolClass: sClass._id,
        subject: subj._id,
        teacher: adminUser._id,
        room: 'LAB-01',
        semester: sem._id,
        dayOfWeek: 3,
        startTime: '07:00',
        endTime: '09:00',
        startWeek: 1,
        endWeek: 15,
      });

      // Create other student enrolled in same class for ABSENT test
      const oEmail = `other_att_${Date.now()}@smartpass.edu`;
      await request(app).post('/api/auth/register').send({
        fullName: 'Student Absent Test',
        email: oEmail,
        password: 'Password123!',
      });
      otherStudent = await User.findOne({ email: oEmail });
      await Enrollment.create({
        student: otherStudent._id,
        schoolClass: sClass._id,
        semester: sem._id,
      });

      // 1. Open session call 1
      const open1 = await request(app)
        .post('/api/attendance/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ scheduleSlotId: slot._id, date: '2026-11-12' });
      expect(open1.status).toBe(201);
      session = open1.body.data.session;

      // Open session call 2 (same slot and date) -> returns existing session
      const open2 = await request(app)
        .post('/api/attendance/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ scheduleSlotId: slot._id, date: '2026-11-12' });
      expect(open2.status).toBe(201);
      expect(open2.body.data.isExisting).toBe(true);

      // 2. Student check-in via session flow
      const check1 = await request(app)
        .post('/api/attendance/check')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ sessionId: session._id, idempotencyKey: crypto.randomUUID() });
      expect(check1.status).toBe(200);
      expect(check1.body.data.status).toBeDefined();

      // Second check-in -> returns same record (idempotent)
      const check2 = await request(app)
        .post('/api/attendance/check')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ sessionId: session._id, idempotencyKey: crypto.randomUUID() });
      expect(check2.status).toBe(200);
      expect(check2.body.data._id).toBe(check1.body.data._id);

      // 3. Close session -> non-checked students become ABSENT
      const closeRes = await request(app)
        .post(`/api/attendance/sessions/${session._id}/close`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(closeRes.status).toBe(200);

      // Check-in after close -> 400
      const afterCloseCheck = await request(app)
        .post('/api/attendance/check')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ sessionId: session._id });
      expect(afterCloseCheck.status).toBe(400);

      // Verify otherStudent marked ABSENT
      const absentRecord = await AttendanceRecord.findOne({
        session: session._id,
        student: otherStudent._id,
      });
      expect(absentRecord).toBeDefined();
      expect(absentRecord.status).toBe('ABSENT');

      // 4. Correction without reason -> 400
      const noReasonRes = await request(app)
        .patch(`/api/attendance/records/${absentRecord._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'EXCUSED', note: '' });
      expect(noReasonRes.status).toBe(400);

      // Correction with reason -> 200 and audit-logged
      const correctRes = await request(app)
        .patch(`/api/attendance/records/${absentRecord._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'EXCUSED', note: 'Có đơn xin phép của phụ huynh' });
      expect(correctRes.status).toBe(200);
      expect(correctRes.body.data.status).toBe('EXCUSED');

      // Audit log exists
      const correctionLog = await AccessLog.findOne({
        owner: otherStudent._id,
        action: 'attendance_correction',
      });
      expect(correctionLog).toBeDefined();
      expect(correctionLog.detail).toContain('Có đơn xin phép của phụ huynh');
    });
  });

  // TEST 9: VNPay Sandbox self-topup
  describe('9. VNPay sandbox self-topup: URL generation, checksum verification, IPN idempotency', () => {
    let txnRef, amount = 100000;

    it('creates order with signed sandbox URL; rejects bad IPN; credits wallet exactly once on valid IPN', async () => {
      const walletBefore = await Wallet.findOne({ owner: studentUser._id });
      const balanceBefore = walletBefore.balance;

      // 9a. Create order -> returns signed URL and PENDING order
      const createRes = await request(app)
        .post('/api/wallet/vnpay/create')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ amount });
      expect(createRes.status).toBe(200);
      expect(createRes.body.data.paymentUrl).toContain('https://sandbox.vnpayment.vn');
      expect(createRes.body.data.order.status).toBe('PENDING');
      txnRef = createRes.body.data.order.txnRef;

      // Balance remains unchanged before payment
      const walletCheck1 = await Wallet.findOne({ owner: studentUser._id });
      expect(walletCheck1.balance).toBe(balanceBefore);

      // 9b. IPN with bad signature -> credits nothing, returns 97
      const badIpnRes = await request(app)
        .get('/api/wallet/vnpay/ipn')
        .query({
          vnp_TmnCode: process.env.VNPAY_TMN_CODE,
          vnp_Amount: String(amount * 100),
          vnp_TxnRef: txnRef,
          vnp_ResponseCode: '00',
          vnp_SecureHash: 'bad_forged_hash_value',
        });
      expect(badIpnRes.body.RspCode).toBe('97');

      // 9c. Return endpoint alone NEVER credits wallet
      const returnRes = await request(app)
        .get('/api/wallet/vnpay/return')
        .query({
          vnp_TmnCode: process.env.VNPAY_TMN_CODE,
          vnp_Amount: String(amount * 100),
          vnp_TxnRef: txnRef,
          vnp_ResponseCode: '00',
          vnp_SecureHash: 'dummy',
        });
      expect(returnRes.status).toBe(200);
      expect((await Wallet.findOne({ owner: studentUser._id })).balance).toBe(balanceBefore);

      // 9d. Valid IPN with correct HMAC signature -> credits wallet
      const validParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: process.env.VNPAY_TMN_CODE,
        vnp_Amount: String(amount * 100),
        vnp_TxnRef: txnRef,
        vnp_ResponseCode: '00',
        vnp_TransactionNo: '14598231',
      };
      validParams.vnp_SecureHash = vnpayService.computeSignature(
        validParams,
        process.env.VNPAY_HASH_SECRET
      );

      const goodIpnRes = await request(app)
        .get('/api/wallet/vnpay/ipn')
        .query(validParams);
      expect(goodIpnRes.body.RspCode).toBe('00');

      // Balance increased by exact amount
      const walletAfterPaid = await Wallet.findOne({ owner: studentUser._id });
      expect(walletAfterPaid.balance).toBe(balanceBefore + amount);

      // 9e. Delivering the same IPN again -> idempotent (returns 02 already confirmed, no double credit)
      const dupIpnRes = await request(app)
        .get('/api/wallet/vnpay/ipn')
        .query(validParams);
      expect(dupIpnRes.body.RspCode).toBe('02');

      const walletAfterDup = await Wallet.findOne({ owner: studentUser._id });
      expect(walletAfterDup.balance).toBe(balanceBefore + amount); // Still credited once!

      // 9f. Another student cannot read this student's order
      const otherEmail = `other_order_${Date.now()}@smartpass.edu`;
      await request(app).post('/api/auth/register').send({
        fullName: 'Other Student Order',
        email: otherEmail,
        password: 'Password123!',
      });
      const oLogin = await request(app).post('/api/auth/login').send({
        email: otherEmail,
        password: 'Password123!',
      });
      const otherToken = oLogin.body.data.token;

      const forbiddenOrderRes = await request(app)
        .get(`/api/wallet/vnpay/orders/${txnRef}`)
        .set('Authorization', `Bearer ${otherToken}`);
      expect(forbiddenOrderRes.status).toBe(403);
    });
  });
});
