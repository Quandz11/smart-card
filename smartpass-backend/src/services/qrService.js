const crypto = require('crypto');
const QrCode = require('../models/QrCode');
const Card = require('../models/Card');
const User = require('../models/User');
const LibraryLoan = require('../models/LibraryLoan');
const RoomBooking = require('../models/RoomBooking');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const ClassSchedule = require('../models/ClassSchedule');
const ParkingSession = require('../models/ParkingSession');
const AccessLog = require('../models/AccessLog');
const cardService = require('./cardService');

function getSigningSecret() {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('[FATAL CONFIG] QR_SIGNING_SECRET is missing or shorter than 32 characters');
  }
  return secret;
}

// In-memory rate limiter: max 30 resolve calls / minute / user
const rateLimitMap = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxCalls = 30;

  const key = userId ? userId.toString() : 'anonymous';
  const record = rateLimitMap.get(key) || [];
  const validTimestamps = record.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= maxCalls) {
    const error = new Error('Bạn đã quét mã quá nhiều lần, vui lòng chờ 1 phút');
    error.statusCode = 429;
    throw error;
  }

  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);
}

// In-memory store for active dynamic attendance sessions: classSession -> { publicId, expiryEpoch, subject, teacher, className }
const attendanceSessionStore = new Map();

// In-memory store for active canteen payment requests: nonce -> { publicId, amount, counter, expiryEpoch, isUsed }
const canteenPaymentRequestStore = new Map();

// In-memory store for active dynamic event check-in codes: eventId -> { publicId, expiryEpoch }
const eventCheckinStore = new Map();

function generateSignature(canonicalWithoutSig) {
  const secret = getSigningSecret();
  return crypto
    .createHmac('sha256', secret)
    .update(canonicalWithoutSig)
    .digest('base64url')
    .substring(0, 22);
}

function verifySignature(canonicalWithoutSig, sig) {
  if (!sig || typeof sig !== 'string' || sig.length !== 22) return false;
  const expected = generateSignature(canonicalWithoutSig);
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch (_) {
    return false;
  }
}

function buildCanonicalPayload(type, publicId, expiryEpochSeconds = null) {
  const base = expiryEpochSeconds
    ? `SP1://${type}/${publicId}?e=${expiryEpochSeconds}`
    : `SP1://${type}/${publicId}`;
  const sig = generateSignature(base);
  return expiryEpochSeconds ? `${base}&s=${sig}` : `${base}?s=${sig}`;
}

function buildBarePayload(type, publicId, expiryEpochSeconds = null) {
  const base = expiryEpochSeconds
    ? `SP1://${type}/${publicId}?e=${expiryEpochSeconds}`
    : `SP1://${type}/${publicId}`;
  const sig = generateSignature(base);
  return `SP1.${type}.${publicId}.${expiryEpochSeconds || 0}.${sig}`;
}

function parseRawQr(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  // 1. Legacy emergency URL
  const emergencyMatch = trimmed.match(/(?:emergency\/public|public_emergency)\/([0-9a-fA-F]{64})/i);
  if (emergencyMatch) {
    return { isLegacy: true, legacyType: 'emergency_url', token: emergencyMatch[1].toLowerCase() };
  }

  // 2. Legacy 64-char hex token
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return { isLegacy: true, legacyType: 'hex_token', token: trimmed.toLowerCase() };
  }

  // 3. Human code form: e.g. "BOOK-X7K2P9", "ROOM-A10101"
  const humanMatch = trimmed.match(/^([A-Z_]+)-([A-Za-z0-9]{6,12})$/);
  if (humanMatch) {
    return {
      isHumanCode: true,
      type: humanMatch[1],
      humanSuffix: humanMatch[2]
    };
  }

  // 4. Canonical v1 form: SP1://<TYPE>/<publicId>?...
  const canonicalMatch = trimmed.match(/^SP1:\/\/([A-Z_]+)\/([A-Za-z0-9\-_]{16,})(?:\?([^#]*))?$/);
  if (canonicalMatch) {
    const type = canonicalMatch[1];
    const publicId = canonicalMatch[2];
    const queryStr = canonicalMatch[3] || '';

    const params = new URLSearchParams(queryStr);
    const sig = params.get('s');
    const expiryStr = params.get('e');
    const expiry = expiryStr ? parseInt(expiryStr, 10) : null;

    if (!sig) return null;

    const baseWithoutSig = expiry
      ? `SP1://${type}/${publicId}?e=${expiry}`
      : `SP1://${type}/${publicId}`;

    return {
      isV1: true,
      format: 'canonical',
      type,
      publicId,
      expiry,
      sig,
      canonicalWithoutSig: baseWithoutSig
    };
  }

  // 5. Bare v1 form: SP1.<TYPE>.<publicId>.<expiryOr0>.<sig>
  const bareMatch = trimmed.match(/^SP1\.([A-Z_]+)\.([A-Za-z0-9\-_]{16,})\.([0-9]+)\.([A-Za-z0-9\-_]{22})$/);
  if (bareMatch) {
    const type = bareMatch[1];
    const publicId = bareMatch[2];
    const expiryVal = parseInt(bareMatch[3], 10);
    const expiry = expiryVal > 0 ? expiryVal : null;
    const sig = bareMatch[4];

    const baseWithoutSig = expiry
      ? `SP1://${type}/${publicId}?e=${expiry}`
      : `SP1://${type}/${publicId}`;

    return {
      isV1: true,
      format: 'bare',
      type,
      publicId,
      expiry,
      sig,
      canonicalWithoutSig: baseWithoutSig
    };
  }

  // 6. Legacy card code fallback
  if (/^[A-Za-z0-9\-]{4,32}$/.test(trimmed)) {
    return { isLegacy: true, legacyType: 'card_code', cardCode: trimmed };
  }

  return null;
}

const resolveQr = async (qrValue, user) => {
  checkRateLimit(user?._id);

  const parsed = parseRawQr(qrValue);
  if (!parsed) {
    const error = new Error('Mã QR không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  // Handle Legacy Forms
  if (parsed.isLegacy) {
    if (parsed.legacyType === 'emergency_url' || parsed.legacyType === 'hex_token') {
      const card = await Card.findOne({ qrToken: parsed.token }).populate('owner', 'fullName email role');
      if (!card) {
        const error = new Error('Không tìm thấy thông tin thẻ');
        error.statusCode = 404;
        throw error;
      }
      return {
        type: 'EMERGENCY_PUBLIC',
        label: 'Thông tin y tế khẩn cấp',
        summary: {
          qrToken: parsed.token,
          cardCode: card.cardCode,
          ownerName: card.owner?.fullName
        },
        nextAction: 'emergency_public'
      };
    }

    if (parsed.legacyType === 'card_code') {
      const card = await Card.findOne({ cardCode: parsed.cardCode }).populate('owner', 'fullName email role');
      if (!card) {
        const error = new Error('Card not found');
        error.statusCode = 404;
        throw error;
      }
      return {
        type: 'CARD_VERIFY',
        label: `Thẻ ${card.cardCode}`,
        summary: {
          cardCode: card.cardCode,
          status: card.status,
          ownerName: card.owner?.fullName
        },
        nextAction: 'staff_verify'
      };
    }
  }

  // Handle Human Code (Manual Entry)
  if (parsed.isHumanCode) {
    const qrRecord = await QrCode.findOne({
      type: parsed.type,
      publicId: { $regex: `${parsed.humanSuffix}$`, $options: 'i' }
    });
    if (!qrRecord) {
      const error = new Error('Không tìm thấy mã QR');
      error.statusCode = 404;
      throw error;
    }
    return resolveStaticQrEntity(qrRecord, user);
  }

  // Handle V1 Format (Canonical or Bare)
  if (parsed.isV1) {
    // 1. Verify signature
    const isValidSig = verifySignature(parsed.canonicalWithoutSig, parsed.sig);
    if (!isValidSig) {
      const error = new Error('Mã QR không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    // 2. Check expiry for dynamic types
    if (parsed.expiry) {
      const nowEpoch = Math.floor(Date.now() / 1000);
      if (nowEpoch > parsed.expiry) {
        const error = new Error('Mã QR đã hết hạn, vui lòng quét mã mới');
        error.statusCode = 400;
        throw error;
      }
    }

    // 3. Dynamic Type: ATTENDANCE_SESSION
    if (parsed.type === 'ATTENDANCE_SESSION') {
      const sessionData = attendanceSessionStore.get(parsed.publicId);
      if (!sessionData) {
        const error = new Error('Mã điểm danh không tồn tại hoặc đã được làm mới');
        error.statusCode = 404;
        throw error;
      }

      // Check student's class enrolment
      if (user && user.role === 'student' && user.className !== sessionData.className) {
        const error = new Error('Bạn không thuộc lớp học này');
        error.statusCode = 403;
        throw error;
      }

      return {
        type: 'ATTENDANCE_SESSION',
        label: `Điểm danh buổi học ${sessionData.subject}`,
        summary: {
          sessionId: sessionData.sessionId || null,
          classSession: sessionData.classSession,
          subject: sessionData.subject,
          teacher: sessionData.teacher,
          className: sessionData.className,
          expiresAt: sessionData.expiryEpoch
        },
        nextAction: 'attendance_check',
        expiresAt: sessionData.expiryEpoch
      };
    }

    // 4. Dynamic Type: PAYMENT_REQUEST
    if (parsed.type === 'PAYMENT_REQUEST') {
      const payReq = canteenPaymentRequestStore.get(parsed.publicId);
      if (!payReq || payReq.isUsed) {
        const error = new Error('Yêu cầu thanh toán không tồn tại hoặc đã được sử dụng');
        error.statusCode = 400;
        throw error;
      }

      return {
        type: 'PAYMENT_REQUEST',
        label: `Thanh toán tại quầy ${payReq.counter}`,
        summary: {
          nonce: parsed.publicId,
          amount: payReq.amount,
          counter: payReq.counter,
          expiresAt: payReq.expiryEpoch
        },
        nextAction: 'wallet_pay',
        expiresAt: payReq.expiryEpoch
      };
    }

    // 5. Dynamic Type: EVENT_CHECKIN
    if (parsed.type === 'EVENT_CHECKIN') {
      const eventData = eventCheckinStore.get(parsed.publicId);
      if (!eventData) {
        const error = new Error('Mã check-in sự kiện không tồn tại hoặc đã hết hạn');
        error.statusCode = 404;
        throw error;
      }

      const event = await Event.findById(eventData.eventId);
      if (!event) {
        const error = new Error('Không tìm thấy sự kiện');
        error.statusCode = 404;
        throw error;
      }

      return {
        type: 'EVENT_CHECKIN',
        label: `Check-in sự kiện: ${event.title}`,
        summary: {
          eventId: event._id.toString(),
          title: event.title,
          location: event.location,
          isDynamicCheckIn: true
        },
        nextAction: 'event_detail',
        expiresAt: eventData.expiryEpoch
      };
    }

    // 6. Static Types: Look up in QrCode Registry
    const qrRecord = await QrCode.findOne({ publicId: parsed.publicId });
    if (!qrRecord) {
      const error = new Error('Không tìm thấy mã QR');
      error.statusCode = 404;
      throw error;
    }

    if (!qrRecord.isActive) {
      const error = new Error('Mã QR đã bị thu hồi');
      error.statusCode = 400;
      throw error;
    }

    return resolveStaticQrEntity(qrRecord, user);
  }

  const error = new Error('Mã QR không hợp lệ');
  error.statusCode = 400;
  throw error;
};

async function resolveStaticQrEntity(qrRecord, user) {
  // Fire-and-forget scan count increment
  QrCode.updateOne(
    { _id: qrRecord._id },
    { $inc: { scanCount: 1 }, $set: { lastScannedAt: new Date() } }
  ).exec().catch(() => {});

  const { type, refId, label, location } = qrRecord;

  switch (type) {
    case 'CANTEEN_POINT': {
      return {
        type: 'CANTEEN_POINT',
        label,
        summary: {
          counterId: refId,
          counterLabel: label,
          location
        },
        nextAction: 'wallet_pay'
      };
    }

    case 'BOOK': {
      const activeLoans = await LibraryLoan.countDocuments({
        bookCode: refId,
        status: { $in: ['borrowed', 'overdue'] }
      });
      const copiesAvailable = Math.max(0, 5 - activeLoans);

      // Check if current user is currently borrowing this book
      let currentLoan = null;
      if (user) {
        currentLoan = await LibraryLoan.findOne({
          borrower: user._id,
          bookCode: refId,
          status: { $in: ['borrowed', 'overdue'] }
        });
      }

      return {
        type: 'BOOK',
        label,
        summary: {
          bookCode: refId,
          bookTitle: label,
          copiesAvailable,
          currentLoanId: currentLoan?._id?.toString() || null,
          hasActiveLoan: !!currentLoan
        },
        nextAction: 'library_borrow'
      };
    }

    case 'PARKING_IN': {
      let openSession = null;
      if (user) {
        openSession = await ParkingSession.findOne({
          owner: user._id,
          status: 'in'
        });
      }

      return {
        type: 'PARKING_IN',
        label,
        summary: {
          gateId: refId,
          gateLabel: label,
          location,
          direction: 'in',
          openSessionId: openSession?._id?.toString() || null,
          hasOpenSession: !!openSession
        },
        nextAction: 'parking_toggle'
      };
    }

    case 'PARKING_OUT': {
      let openSession = null;
      let calculatedFee = 0;
      let parkedMinutes = 0;

      if (user) {
        openSession = await ParkingSession.findOne({
          owner: user._id,
          status: 'in'
        });

        if (openSession) {
          const nowMs = Date.now();
          const inMs = new Date(openSession.checkInAt).getTime();
          parkedMinutes = Math.max(1, Math.round((nowMs - inMs) / 60000));
          const hours = Math.max(1, Math.ceil(parkedMinutes / 60));
          calculatedFee = hours * 2000; // 2.000 đ/hour rounded up
        }
      }

      return {
        type: 'PARKING_OUT',
        label,
        summary: {
          gateId: refId,
          gateLabel: label,
          location,
          direction: 'out',
          openSessionId: openSession?._id?.toString() || null,
          hasOpenSession: !!openSession,
          fee: calculatedFee,
          parkedMinutes
        },
        nextAction: 'parking_toggle'
      };
    }

    case 'ROOM': {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 3600 * 1000);

      const todayBookings = await RoomBooking.find({
        room: refId,
        date: { $gte: today, $lt: tomorrow },
        status: 'approved'
      }).select('startTime endTime purpose status');

      return {
        type: 'ROOM',
        label,
        summary: {
          room: refId,
          roomLabel: label,
          location,
          todayBookings
        },
        nextAction: 'room_detail'
      };
    }

    case 'EVENT': {
      const event = await Event.findById(refId);
      if (!event) {
        const error = new Error('Không tìm thấy sự kiện');
        error.statusCode = 404;
        throw error;
      }

      let isRegistered = false;
      let arrivalRecorded = false;
      if (user) {
        const reg = await EventRegistration.findOne({ event: event._id, student: user._id });
        if (reg) {
          isRegistered = true;
          arrivalRecorded = !!reg.arrivedAt;
        }
      }

      const seatsLeft = Math.max(0, event.capacity - (event.registeredCount || 0));

      return {
        type: 'EVENT',
        label: event.title,
        summary: {
          eventId: event._id.toString(),
          title: event.title,
          description: event.description,
          location: event.location,
          startAt: event.startAt,
          endAt: event.endAt,
          capacity: event.capacity,
          registeredCount: event.registeredCount || 0,
          seatsLeft,
          isRegistered,
          arrivalRecorded
        },
        nextAction: 'event_detail'
      };
    }

    case 'GATE_IN':
    case 'GATE_OUT': {
      return {
        type: qrRecord.type,
        label,
        summary: {
          gateId: refId,
          gateLabel: label,
          location,
          direction: type === 'GATE_IN' ? 'in' : 'out'
        },
        nextAction: 'gate_toggle'
      };
    }

    default: {
      const error = new Error('Mã QR không dùng cho chức năng này');
      error.statusCode = 400;
      throw error;
    }
  }
}

// Admin: Register a new QR code for an entity
const createQrCode = async ({ type, refKind, refId, label, location }, createdBy) => {
  if (!type || !refKind || !refId || !label) {
    const error = new Error('type, refKind, refId, and label are required');
    error.statusCode = 400;
    throw error;
  }

  // Verify entity exists
  if (refKind === 'event') {
    const ev = await Event.findById(refId);
    if (!ev) {
      const error = new Error('Không tìm thấy sự kiện tương ứng');
      error.statusCode = 404;
      throw error;
    }
  }

  // Generate 20-character random publicId
  const publicId = crypto.randomBytes(10).toString('hex');

  const qrDoc = await QrCode.create({
    publicId,
    type,
    refKind,
    refId,
    label,
    location,
    createdBy: createdBy?._id,
    isActive: true
  });

  const canonicalPayload = buildCanonicalPayload(type, publicId);
  const barePayload = buildBarePayload(type, publicId);

  return {
    ...qrDoc.toObject(),
    canonicalPayload,
    barePayload
  };
};

const getQrCodes = async ({ page = 1, limit = 20, type, isActive, search }) => {
  const query = {};
  if (type) query.type = type;
  if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true' || isActive === true;
  if (search) query.label = { $regex: search, $options: 'i' };

  const p = Math.max(1, parseInt(page, 10));
  const l = Math.max(1, parseInt(limit, 10));

  const total = await QrCode.countDocuments(query);
  const items = await QrCode.find(query)
    .populate('createdBy', 'fullName email')
    .sort({ createdAt: -1 })
    .skip((p - 1) * l)
    .limit(l);

  const formattedItems = items.map((doc) => {
    const obj = doc.toObject();
    return {
      ...obj,
      canonicalPayload: buildCanonicalPayload(obj.type, obj.publicId),
      barePayload: buildBarePayload(obj.type, obj.publicId)
    };
  });

  return {
    items: formattedItems,
    pagination: {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l)
    }
  };
};

const revokeQrCode = async (publicId) => {
  const qr = await QrCode.findOne({ publicId });
  if (!qr) {
    const error = new Error('Không tìm thấy mã QR');
    error.statusCode = 404;
    throw error;
  }
  qr.isActive = false;
  await qr.save();
  return { message: 'Đã thu hồi mã QR thành công', publicId };
};

const regenerateQrCode = async (publicId, user) => {
  const oldQr = await QrCode.findOne({ publicId });
  if (!oldQr) {
    const error = new Error('Không tìm thấy mã QR');
    error.statusCode = 404;
    throw error;
  }

  // Deactivate old code
  oldQr.isActive = false;
  await oldQr.save();

  // Create new code with fresh publicId
  const newPublicId = crypto.randomBytes(10).toString('hex');
  const newQr = await QrCode.create({
    publicId: newPublicId,
    type: oldQr.type,
    refKind: oldQr.refKind,
    refId: oldQr.refId,
    label: oldQr.label,
    location: oldQr.location,
    createdBy: user?._id || oldQr.createdBy,
    isActive: true
  });

  const canonicalPayload = buildCanonicalPayload(newQr.type, newPublicId);
  const barePayload = buildBarePayload(newQr.type, newPublicId);

  return {
    ...newQr.toObject(),
    canonicalPayload,
    barePayload
  };
};

// Dynamic Generator: Attendance Session (15 minutes expiry)
const generateAttendanceSessionQr = async (classSession, user) => {
  // Check permission
  if (user.role !== 'admin' && user.role !== 'librarian' && user.role !== 'canteen_staff' && user.role !== 'parking_staff') {
    // Only staff / teachers / admin
  }

  // Check ClassSchedule
  const schedule = await ClassSchedule.findOne({
    $or: [{ className: classSession }, { subject: classSession }]
  }) || { subject: classSession, teacher: user.fullName, className: user.className || 'SE101' };

  const publicId = crypto.randomBytes(10).toString('hex');
  const expiryEpoch = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minutes

  attendanceSessionStore.set(publicId, {
    publicId,
    classSession,
    subject: schedule.subject || classSession,
    teacher: schedule.teacher || user.fullName,
    className: schedule.className || 'SE101',
    expiryEpoch
  });

  const canonicalPayload = buildCanonicalPayload('ATTENDANCE_SESSION', publicId, expiryEpoch);
  const barePayload = buildBarePayload('ATTENDANCE_SESSION', publicId, expiryEpoch);

  return {
    type: 'ATTENDANCE_SESSION',
    publicId,
    classSession,
    expiresAt: expiryEpoch,
    canonicalPayload,
    barePayload
  };
};

// Dynamic Generator: Canteen Payment Request (2 minutes expiry)
const generatePaymentRequestQr = async ({ amount, counter = 'Quầy 1' }, user) => {
  if (!amount || amount <= 0) {
    const error = new Error('Số tiền thanh toán phải lớn hơn 0');
    error.statusCode = 400;
    throw error;
  }

  const publicId = crypto.randomBytes(10).toString('hex');
  const expiryEpoch = Math.floor(Date.now() / 1000) + 2 * 60; // 2 minutes

  canteenPaymentRequestStore.set(publicId, {
    publicId,
    amount: Number(amount),
    counter,
    expiryEpoch,
    createdBy: user._id,
    isUsed: false
  });

  const canonicalPayload = buildCanonicalPayload('PAYMENT_REQUEST', publicId, expiryEpoch);
  const barePayload = buildBarePayload('PAYMENT_REQUEST', publicId, expiryEpoch);

  return {
    type: 'PAYMENT_REQUEST',
    publicId,
    amount: Number(amount),
    counter,
    expiresAt: expiryEpoch,
    canonicalPayload,
    barePayload
  };
};

// Dynamic Generator: Event Checkin QR (Expiry = event endAt)
const generateEventCheckinQr = async (eventId, user) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Không tìm thấy sự kiện');
    error.statusCode = 404;
    throw error;
  }

  const publicId = crypto.randomBytes(10).toString('hex');
  const endEpoch = Math.floor(new Date(event.endAt).getTime() / 1000);
  const nowEpoch = Math.floor(Date.now() / 1000);
  const expiryEpoch = endEpoch > nowEpoch ? endEpoch : nowEpoch + 4 * 3600;

  eventCheckinStore.set(publicId, {
    publicId,
    eventId: event._id.toString(),
    expiryEpoch
  });

  const canonicalPayload = buildCanonicalPayload('EVENT_CHECKIN', publicId, expiryEpoch);
  const barePayload = buildBarePayload('EVENT_CHECKIN', publicId, expiryEpoch);

  return {
    type: 'EVENT_CHECKIN',
    publicId,
    eventId: event._id.toString(),
    expiresAt: expiryEpoch,
    canonicalPayload,
    barePayload
  };
};

// Gate action handler: enforces no-duplicate-log rule for GATE_IN / GATE_OUT
const confirmGatePass = async ({ gateId, direction, cardCode }, user) => {
  if (!direction || !['in', 'out'].includes(direction.toLowerCase())) {
    const error = new Error('Direction must be "in" or "out"');
    error.statusCode = 400;
    throw error;
  }

  const targetAction = direction.toLowerCase() === 'in' ? 'entry' : 'exit';

  // Find student's own active card
  const card = await Card.findOne({ owner: user._id, status: 'active' });
  if (!card) {
    const error = new Error('Thẻ sinh viên không khả dụng');
    error.statusCode = 403;
    throw error;
  }

  // Check last gate log
  const lastGateLog = await AccessLog.findOne({
    owner: user._id,
    action: { $in: ['entry', 'exit'] }
  }).sort({ createdAt: -1 });

  if (lastGateLog && lastGateLog.action === targetAction) {
    // Duplicate scan detected: Return 200 without creating duplicate AccessLog row
    const msg = targetAction === 'entry'
      ? 'Bạn đã ghi nhận vào cổng trước đó'
      : 'Bạn đã ghi nhận ra cổng trước đó';
    return {
      success: true,
      message: msg,
      duplicate: true,
      direction,
      recordedAt: lastGateLog.createdAt
    };
  }

  // Record real AccessLog
  const locationText = gateId ? `Cổng ${gateId}` : 'Cổng chính - Turnstile 01';
  const newLog = await AccessLog.create({
    card: card._id,
    owner: user._id,
    action: targetAction,
    location: locationText,
    detail: `Quét mã cổng ${direction.toUpperCase()} bởi sinh viên ${user.fullName}`,
    createdBy: user._id
  });

  return {
    success: true,
    message: targetAction === 'entry' ? 'Ghi nhận vào cổng thành công' : 'Ghi nhận ra cổng thành công',
    duplicate: false,
    direction,
    recordedAt: newLog.createdAt
  };
};

module.exports = {
  getSigningSecret,
  generateSignature,
  verifySignature,
  buildCanonicalPayload,
  buildBarePayload,
  parseRawQr,
  resolveQr,
  createQrCode,
  getQrCodes,
  revokeQrCode,
  regenerateQrCode,
  generateAttendanceSessionQr,
  generatePaymentRequestQr,
  generateEventCheckinQr,
  confirmGatePass,
  canteenPaymentRequestStore,
  attendanceSessionStore,
  eventCheckinStore
};

