const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const ScheduleSlot = require('../models/ScheduleSlot');
const Enrollment = require('../models/Enrollment');
const Card = require('../models/Card');
const User = require('../models/User');
const ClassSchedule = require('../models/ClassSchedule');
const cardService = require('./cardService');
const logService = require('./logService');
const qrService = require('./qrService');
const { withIdempotency } = require('../utils/idempotency');

/**
 * Open an attendance session for today's slot.
 * D3: Teacher/staff (or admin) opens a session for today's slot:
 * POST /api/attendance/sessions { scheduleSlotId, date }
 * Returns AttendanceSession + dynamic signed QR (15-min expiry).
 * One session per slot per date (unique index) — opening twice returns existing session.
 */
const openAttendanceSession = async ({ scheduleSlotId, date }, openerUser) => {
  if (!scheduleSlotId) {
    const error = new Error('scheduleSlotId là bắt buộc');
    error.statusCode = 400;
    throw error;
  }

  const slot = await ScheduleSlot.findById(scheduleSlotId)
    .populate('subject', 'code name')
    .populate('schoolClass', 'name');
  if (!slot) {
    const error = new Error('Không tìm thấy khung giờ lịch học');
    error.statusCode = 404;
    throw error;
  }

  // Normalize date to UTC midnight
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setUTCHours(0, 0, 0, 0);

  // Check if session already exists
  const existingSession = await AttendanceSession.findOne({
    scheduleSlot: slot._id,
    date: targetDate,
  });

  const nowEpoch = Math.floor(Date.now() / 1000);
  const expiryEpoch = nowEpoch + 15 * 60; // 15 minutes

  if (existingSession) {
    if (existingSession.status === 'CLOSED') {
      const error = new Error('Phiên điểm danh cho tiết học này đã kết thúc');
      error.statusCode = 409;
      throw error;
    }

    // Refresh dynamic QR code for active session
    existingSession.qrExpiresAt = new Date(expiryEpoch * 1000);
    await existingSession.save();

    const sessionPublicId = `ATT-${existingSession._id.toString().slice(-8)}`;
    const qrPayload = qrService.buildCanonicalPayload('ATTENDANCE_SESSION', sessionPublicId, expiryEpoch);

    qrService.attendanceSessionStore.set(sessionPublicId, {
      sessionId: existingSession._id.toString(),
      expiryEpoch,
      slotId: slot._id.toString(),
      schoolClass: String(slot.schoolClass._id || slot.schoolClass),
    });

    return {
      session: existingSession,
      qrPayload,
      qrExpiresAt: existingSession.qrExpiresAt,
      isExisting: true,
    };
  }

  const session = await AttendanceSession.create({
    scheduleSlot: slot._id,
    date: targetDate,
    openedBy: openerUser._id,
    status: 'OPEN',
    qrExpiresAt: new Date(expiryEpoch * 1000),
    lateAfterMinutes: 15,
  });

  const sessionPublicId = `ATT-${session._id.toString().slice(-8)}`;
  const qrPayload = qrService.buildCanonicalPayload('ATTENDANCE_SESSION', sessionPublicId, expiryEpoch);

  qrService.attendanceSessionStore.set(sessionPublicId, {
    sessionId: session._id.toString(),
    expiryEpoch,
    slotId: slot._id.toString(),
    schoolClass: String(slot.schoolClass._id || slot.schoolClass),
  });

  try {
    const notificationService = require('./notificationService');
    const SchoolClass = require('../models/SchoolClass');
    const Subject = require('../models/Subject');
    const sc = await SchoolClass.findById(slot.schoolClass._id || slot.schoolClass);
    const sj = await Subject.findById(slot.subject._id || slot.subject);
    if (sc) {
      await notificationService.createAndDispatch({
        type: 'ATTENDANCE_SESSION_OPENED',
        audience: 'class',
        className: sc.name,
        relatedType: 'AttendanceSession',
        relatedId: session._id,
        templateData: {
          subject: sj ? sj.name : 'Buổi học',
        },
      });
    }
  } catch (e) {}

  return {
    session,
    qrPayload,
    qrExpiresAt: session.qrExpiresAt,
    isExisting: false,
  };
};

/**
 * Check-in attendance. Supports:
 * 1) Block D AttendanceSession flow (via sessionId)
 * 2) Legacy flow (via classSession)
 */
const checkAttendance = async (body, userOrId) => {
  const {
    sessionId,
    cardCode,
    qrToken,
    nfcUid,
    studentId,
    status: manualStatus,
    note,
    method,
    classSession,
    subject,
    qrType,
    idempotencyKey,
  } = body || {};

  // Check type mismatch
  if (qrType && qrType !== 'ATTENDANCE_SESSION') {
    const error = new Error('Mã QR không dùng cho chức năng này');
    error.statusCode = 400;
    throw error;
  }

  let user = null;
  if (userOrId && typeof userOrId === 'object' && userOrId._id) {
    user = userOrId;
  } else if (userOrId) {
    user = await User.findById(userOrId);
  }
  const createdBy = user ? user._id : userOrId;

  const executeAttendance = async () => {
    // ----------------------------------------------------
    // CASE 1: Block D Flow using AttendanceSession & AttendanceRecord
    // ----------------------------------------------------
    if (sessionId) {
      const session = await AttendanceSession.findById(sessionId).populate('scheduleSlot');
      if (!session) {
        const error = new Error('Phiên điểm danh không tồn tại');
        error.statusCode = 404;
        throw error;
      }

      if (session.status === 'CLOSED') {
        const error = new Error('Phiên điểm danh đã đóng');
        error.statusCode = 400;
        throw error;
      }

      const slot = await ScheduleSlot.findById(session.scheduleSlot._id || session.scheduleSlot);
      if (!slot) {
        const error = new Error('Không tìm thấy thông tin tiết học của phiên điểm danh');
        error.statusCode = 404;
        throw error;
      }

      // Determine target student and method
      let targetStudentId;
      let checkMethod;

      if (studentId) {
        // Staff manual mark from roster
        targetStudentId = studentId;
        checkMethod = method || 'MANUAL';
      } else if (cardCode || qrToken || nfcUid) {
        // Staff scans student card
        const card = await cardService.resolveCard({ cardCode, qrToken, nfcUid });
        await cardService.assertCardUsable(card);
        targetStudentId = card.owner;
        checkMethod = 'CARD_SCAN';
      } else if (user && user.role === 'student') {
        // Student self check-in via QR scan
        const card = await Card.findOne({ owner: user._id, status: 'active' });
        if (!card) {
          const error = new Error('Thẻ sinh viên không khả dụng');
          error.statusCode = 403;
          throw error;
        }
        await cardService.assertCardUsable(card);
        targetStudentId = user._id;
        checkMethod = 'QR';
      } else {
        const error = new Error('Thông tin sinh viên hoặc thẻ không hợp lệ');
        error.statusCode = 400;
        throw error;
      }

      // Verify class enrollment: student must belong to this class
      const enrolled = await Enrollment.findOne({
        student: targetStudentId,
        schoolClass: slot.schoolClass,
        semester: slot.semester,
      });

      if (!enrolled) {
        // Fallback: check User.className if matching schoolClass name
        const studentUser = await User.findById(targetStudentId);
        const SchoolClass = require('../models/SchoolClass');
        const sClass = await SchoolClass.findById(slot.schoolClass);
        if (!studentUser || !studentUser.className || !sClass || studentUser.className !== sClass.name) {
          const error = new Error('Bạn không thuộc lớp học này');
          error.statusCode = 403;
          throw error;
        }
      }

      // Idempotency: second check-in returns the same record without duplicate error
      const existingRecord = await AttendanceRecord.findOne({
        session: session._id,
        student: targetStudentId,
      });
      if (existingRecord) {
        return existingRecord;
      }

      // Calculate status: PRESENT vs LATE
      let recordStatus;
      if (checkMethod === 'MANUAL' && manualStatus) {
        recordStatus = manualStatus;
      } else {
        const now = new Date();
        const [slotH, slotM] = (slot.startTime || '08:00').split(':').map(Number);
        const slotStart = new Date(session.date);
        slotStart.setHours(slotH, slotM, 0, 0);

        const lateThreshold = new Date(slotStart.getTime() + (session.lateAfterMinutes || 15) * 60 * 1000);
        recordStatus = now > lateThreshold ? 'LATE' : 'PRESENT';
      }

      const record = await AttendanceRecord.create({
        session: session._id,
        student: targetStudentId,
        status: recordStatus,
        checkedInAt: new Date(),
        method: checkMethod,
        markedBy: createdBy,
        note: note ? note.trim() : undefined,
      });

      // Audit log
      await logService.recordLog({
        owner: targetStudentId,
        action: 'attendance',
        location: slot.room || 'Classroom',
        detail: `Điểm danh ${recordStatus} cho môn học (Phương thức: ${checkMethod})`,
        createdBy,
      });

      try {
        const notificationService = require('./notificationService');
        const { formatDate } = require('../constants/notificationCatalog');
        await notificationService.createAndDispatch({
          type: 'ATTENDANCE_CHECKED_IN',
          audience: 'individual',
          receiver: targetStudentId,
          relatedType: 'AttendanceSession',
          relatedId: session._id,
          templateData: {
            subject: slot.subject?.name || 'Buổi học',
            time: formatDate(record.checkedInAt),
            status: recordStatus === 'PRESENT' ? 'Đúng giờ' : 'Đi muộn',
          },
        });
      } catch (e) {}

      return record;
    }

    // ----------------------------------------------------
    // CASE 2: Legacy Attendance check (backward compatibility)
    // ----------------------------------------------------
    if (!classSession) {
      const error = new Error('sessionId hoặc classSession là bắt buộc');
      error.statusCode = 400;
      throw error;
    }

    let card;
    if (user && user.role === 'student' && !cardCode && !qrToken && !nfcUid) {
      card = await Card.findOne({ owner: user._id, status: 'active' });
      if (!card) {
        const error = new Error('Thẻ sinh viên không khả dụng');
        error.statusCode = 403;
        throw error;
      }
      await cardService.assertCardUsable(card);
    } else {
      card = await cardService.resolveCard({ cardCode, qrToken, nfcUid });
    }

    if (user && user.role === 'student' && user.className) {
      const schedule = await ClassSchedule.findOne({
        $or: [{ className: classSession }, { subject: classSession }],
      });
      if (schedule && schedule.className && schedule.className !== user.className) {
        const error = new Error('Bạn không thuộc lớp học này');
        error.statusCode = 403;
        throw error;
      }
    }

    const existing = await Attendance.findOne({
      student: card.owner,
      classSession: classSession.trim(),
    });

    if (existing) {
      const error = new Error('Attendance already recorded for this session');
      error.statusCode = 409;
      throw error;
    }

    const attendance = await Attendance.create({
      student: card.owner,
      card: card._id,
      classSession: classSession.trim(),
      subject: subject ? subject.trim() : undefined,
      status: 'present',
      checkedAt: new Date(),
    });

    await logService.recordLog({
      card: card._id,
      owner: card.owner,
      action: 'attendance',
      location: classSession,
      detail: `Attendance check: ${subject || classSession}`,
      createdBy,
    });

    return attendance;
  };

  if (idempotencyKey) {
    return withIdempotency(idempotencyKey, executeAttendance);
  }
  return executeAttendance();
};

/**
 * Close an attendance session.
 * D3: On close, every enrolled student with no record becomes ABSENT in the same transaction.
 */
const closeAttendanceSession = async (sessionId, closingUser) => {
  const session = await AttendanceSession.findById(sessionId).populate('scheduleSlot');
  if (!session) {
    const error = new Error('Không tìm thấy phiên điểm danh');
    error.statusCode = 404;
    throw error;
  }

  if (session.status === 'CLOSED') {
    return session;
  }

  const slot = await ScheduleSlot.findById(session.scheduleSlot._id || session.scheduleSlot);

  session.status = 'CLOSED';
  await session.save();

  // Find enrolled students in class
  const enrollments = await Enrollment.find({
    schoolClass: slot.schoolClass,
    semester: slot.semester,
  });

  const existingRecords = await AttendanceRecord.find({ session: session._id });
  const recordedStudentIds = new Set(existingRecords.map((r) => String(r.student)));

  for (const enr of enrollments) {
    if (!recordedStudentIds.has(String(enr.student))) {
      const absRecord = await AttendanceRecord.create({
        session: session._id,
        student: enr.student,
        status: 'ABSENT',
        checkedInAt: new Date(),
        method: 'MANUAL',
        markedBy: closingUser._id,
        note: 'Tự động đánh vắng khi đóng phiên điểm danh',
      });

      try {
        const notificationService = require('./notificationService');
        const { formatDate } = require('../constants/notificationCatalog');
        await notificationService.createAndDispatch({
          type: 'ATTENDANCE_MARKED',
          audience: 'individual',
          receiver: enr.student,
          relatedType: 'AttendanceSession',
          relatedId: session._id,
          templateData: {
            subject: slot.subject?.name || 'Buổi học',
            date: formatDate(session.date),
            status: 'Vắng',
          },
        });
      } catch (e) {}
    }
  }

  return session;
};

/**
 * Correct an attendance record.
 * D4: PATCH /api/attendance/records/:id (admin or opener).
 * note is REQUIRED as the correction reason. Audit-logged.
 */
const correctAttendanceRecord = async (recordId, { status, note }, user) => {
  if (!note || !String(note).trim()) {
    const error = new Error('Lý do chỉnh sửa điểm danh là bắt buộc');
    error.statusCode = 400;
    throw error;
  }

  const record = await AttendanceRecord.findById(recordId).populate('session');
  if (!record) {
    const error = new Error('Không tìm thấy bản ghi điểm danh');
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== 'admin' && String(record.session.openedBy) !== String(user._id)) {
    const error = new Error('Bạn không có quyền chỉnh sửa bản ghi này');
    error.statusCode = 403;
    throw error;
  }

  const allowedStatuses = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'];
  if (!allowedStatuses.includes(status)) {
    const error = new Error('Trạng thái điểm danh không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const prevStatus = record.status;
  record.status = status;
  record.note = String(note).trim();
  record.markedBy = user._id;
  await record.save();

  // Write to audit log
  await logService.recordLog({
    owner: record.student,
    action: 'attendance_correction',
    location: 'System',
    detail: `Chỉnh sửa điểm danh từ ${prevStatus} sang ${status}. Lý do: ${note.trim()}`,
    createdBy: user._id,
  });

  try {
    const notificationService = require('./notificationService');
    const { formatDate } = require('../constants/notificationCatalog');
    await notificationService.createAndDispatch({
      type: 'ATTENDANCE_CORRECTED',
      audience: 'individual',
      receiver: record.student,
      actor: user._id,
      relatedType: 'AttendanceSession',
      relatedId: record.session?._id,
      templateData: {
        subject: record.session?.classSession || 'Buổi học',
        date: formatDate(record.session?.date || record.checkedInAt),
        status,
        reason: note.trim(),
      },
    });
  } catch (e) {}

  return record;
};

/**
 * Get attendance history for student.
 */
const getMyAttendance = async (studentId) => {
  const records = await AttendanceRecord.find({ student: studentId })
    .populate({
      path: 'session',
      populate: {
        path: 'scheduleSlot',
        populate: [
          { path: 'subject', select: 'code name' },
          { path: 'teacher', select: 'fullName' },
        ],
      },
    })
    .sort({ checkedInAt: -1 });

  const total = records.length;
  const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const overallRate = total > 0 ? Math.round((present / total) * 100) : 100;

  const formattedRecords = records.map((r) => {
    const doc = r.toObject ? r.toObject() : { ...r };
    const subjectName = doc.session?.scheduleSlot?.subject?.name;
    const subjectCode = doc.session?.scheduleSlot?.subject?.code;
    const sessionCode = doc.session?.sessionCode;
    const room = doc.session?.scheduleSlot?.room;

    return {
      ...doc,
      classSession: sessionCode || room || 'Buổi học',
      subject: subjectName ? (subjectCode ? `${subjectCode} - ${subjectName}` : subjectName) : subjectCode || 'Buổi học',
      checkedAt: doc.checkedInAt ? new Date(doc.checkedInAt).toISOString() : new Date().toISOString(),
    };
  });

  return {
    records: formattedRecords,
    stats: {
      total,
      present,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      excused: records.filter((r) => r.status === 'EXCUSED').length,
      overallRate,
    },
  };
};

/**
 * Get live roster for session.
 */
const getSessionRoster = async (sessionId) => {
  const session = await AttendanceSession.findById(sessionId)
    .populate({
      path: 'scheduleSlot',
      populate: [
        { path: 'schoolClass', select: 'name' },
        { path: 'subject', select: 'code name' },
      ],
    });

  if (!session) {
    const error = new Error('Phiên điểm danh không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const records = await AttendanceRecord.find({ session: session._id })
    .populate('student', 'fullName studentCode email className')
    .sort({ checkedInAt: 1 });

  const counts = {
    PRESENT: records.filter((r) => r.status === 'PRESENT').length,
    LATE: records.filter((r) => r.status === 'LATE').length,
    ABSENT: records.filter((r) => r.status === 'ABSENT').length,
    EXCUSED: records.filter((r) => r.status === 'EXCUSED').length,
  };

  return {
    session,
    counts,
    records,
  };
};

/**
 * Generate CSV for a session roster.
 */
const exportSessionCsv = async (sessionId) => {
  const rosterData = await getSessionRoster(sessionId);
  let csv = '\uFEFFMã SV,Họ và tên,Lớp,Trạng thái,Thời gian,Phương thức,Ghi chú\n';

  for (const r of rosterData.records) {
    const s = r.student || {};
    const time = r.checkedInAt ? new Date(r.checkedInAt).toLocaleString('vi-VN') : '';
    csv += `"${s.studentCode || ''}","${s.fullName || ''}","${s.className || ''}","${r.status}","${time}","${r.method}","${r.note || ''}"\n`;
  }

  return csv;
};

/**
 * Get class attendance report with low attendance (<80%) flag.
 */
const getClassReport = async (classId) => {
  const SchoolClass = require('../models/SchoolClass');
  const schoolClass = await SchoolClass.findById(classId);
  if (!schoolClass) {
    const error = new Error('Lớp học không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const enrollments = await Enrollment.find({ schoolClass: classId }).populate('student');
  const studentIds = enrollments.map((e) => e.student._id);

  const report = [];
  for (const student of enrollments.map((e) => e.student)) {
    const records = await AttendanceRecord.find({ student: student._id });
    const total = records.length;
    const attended = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 100;
    const isLowAttendance = rate < 80;

    report.push({
      student: {
        _id: student._id,
        fullName: student.fullName,
        studentCode: student.studentCode,
        email: student.email,
      },
      totalSessions: total,
      attended,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      attendanceRate: rate,
      isLowAttendance,
    });
  }

  return {
    schoolClass,
    report,
  };
};

/**
 * Export class attendance report as CSV.
 */
const exportClassReportCsv = async (classId) => {
  const data = await getClassReport(classId);
  let csv = '\uFEFFMã SV,Họ và tên,Email,Tổng số buổi,Số buổi tham gia,Vắng mặt,Tỷ lệ (%),Cảnh báo (<80%)\n';

  for (const item of data.report) {
    const s = item.student;
    const flag = item.isLowAttendance ? 'CẢNH BÁO' : 'Bình thường';
    csv += `"${s.studentCode || ''}","${s.fullName || ''}","${s.email || ''}",${item.totalSessions},${item.attended},${item.absent},${item.attendanceRate}%,"${flag}"\n`;
  }

  return csv;
};

module.exports = {
  openAttendanceSession,
  checkAttendance,
  closeAttendanceSession,
  correctAttendanceRecord,
  getMyAttendance,
  getSessionRoster,
  exportSessionCsv,
  getClassReport,
  exportClassReportCsv,
};
