const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const SchoolClass = require('../models/SchoolClass');
const ScheduleSlot = require('../models/ScheduleSlot');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

// --- SEMESTERS ---
const createSemester = async (data) => {
  if (data.isCurrent) {
    await Semester.updateMany({}, { isCurrent: false });
  }
  return Semester.create(data);
};

const getSemesters = async () => {
  return Semester.find().sort({ startDate: -1 });
};

const getCurrentSemester = async () => {
  let sem = await Semester.findOne({ isCurrent: true });
  if (!sem) {
    sem = await Semester.findOne().sort({ startDate: -1 });
  }
  return sem;
};

// --- SUBJECTS ---
const createSubject = async ({ code, name, credits }) => {
  if (!code || !name) {
    const error = new Error('Mã môn học và tên môn học là bắt buộc');
    error.statusCode = 400;
    throw error;
  }
  const cleanCode = code.trim().toUpperCase();
  const existing = await Subject.findOne({ code: cleanCode });
  if (existing) {
    const error = new Error('Mã môn học đã tồn tại');
    error.statusCode = 409;
    throw error;
  }
  return Subject.create({
    code: cleanCode,
    name: name.trim(),
    credits: credits ? Number(credits) : null,
  });
};

const getSubjects = async () => {
  return Subject.find().sort({ code: 1 });
};

// --- CLASSES & ENROLLMENTS ---
const createClass = async ({ name, homeroomTeacher }) => {
  if (!name) {
    const error = new Error('Tên lớp học là bắt buộc');
    error.statusCode = 400;
    throw error;
  }
  const cleanName = name.trim();
  const existing = await SchoolClass.findOne({ name: cleanName });
  if (existing) {
    const error = new Error('Lớp học đã tồn tại');
    error.statusCode = 409;
    throw error;
  }
  return SchoolClass.create({
    name: cleanName,
    homeroomTeacher: homeroomTeacher || null,
  });
};

const getClasses = async () => {
  return SchoolClass.find().populate('homeroomTeacher', 'fullName email').sort({ name: 1 });
};

const assignStudentsToClass = async ({ schoolClassId, studentIds, studentId, semesterId }) => {
  let targetSemesterId = semesterId;
  if (!targetSemesterId) {
    const current = await getCurrentSemester();
    if (!current) {
      const error = new Error('Không tìm thấy học kỳ hiện tại');
      error.statusCode = 400;
      throw error;
    }
    targetSemesterId = current._id;
  }

  const ids = Array.isArray(studentIds) ? studentIds : (studentId ? [studentId] : (studentIds ? [studentIds] : []));
  if (ids.length === 0) {
    const error = new Error('Danh sách học sinh không được để trống');
    error.statusCode = 400;
    throw error;
  }

  const results = [];
  for (const sId of ids) {
    const enrollment = await Enrollment.findOneAndUpdate(
      { student: sId, semester: targetSemesterId },
      { schoolClass: schoolClassId },
      { upsert: true, new: true }
    );
    results.push(enrollment);
  }
  return results;
};

const getClassStudents = async (schoolClassId, semesterId) => {
  let targetSemesterId = semesterId;
  if (!targetSemesterId) {
    const current = await getCurrentSemester();
    if (current) targetSemesterId = current._id;
  }
  const query = { schoolClass: schoolClassId };
  if (targetSemesterId) {
    query.semester = targetSemesterId;
  }

  const enrollments = await Enrollment.find(query)
    .populate('student', 'fullName email studentCode phone role')
    .sort({ createdAt: -1 });

  return enrollments.map((e) => ({
    enrollmentId: e._id,
    student: e.student,
    enrolledAt: e.createdAt,
  }));
};

const removeStudentFromClass = async (schoolClassId, studentId, semesterId) => {
  let targetSemesterId = semesterId;
  if (!targetSemesterId) {
    const current = await getCurrentSemester();
    if (current) targetSemesterId = current._id;
  }
  const query = { schoolClass: schoolClassId, student: studentId };
  if (targetSemesterId) query.semester = targetSemesterId;
  return Enrollment.findOneAndDelete(query);
};

// --- SCHEDULE SLOTS ---
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const createSlot = async (data) => {
  const schoolClass = data?.schoolClass || data?.classId || data?.schoolClassId;
  const subject = data?.subject || data?.subjectId;
  const teacher = data?.teacher || data?.teacherId || null;
  const room = data?.room;
  let semester = data?.semester || data?.semesterId;
  if (!semester) {
    const current = await getCurrentSemester();
    if (current) semester = current._id;
  }
  const dayOfWeek = data?.dayOfWeek;
  const startTime = data?.startTime;
  const endTime = data?.endTime;

  let sWeek = Number(data?.startWeek);
  let eWeek = Number(data?.endWeek);
  if (Array.isArray(data?.weeks) && data.weeks.length > 0) {
    sWeek = Math.min(...data.weeks);
    eWeek = Math.max(...data.weeks);
  }
  if (isNaN(sWeek) || sWeek < 1) sWeek = 1;
  if (isNaN(eWeek) || eWeek < sWeek) eWeek = 18;

  if (!schoolClass || !subject || !room || !semester || !dayOfWeek || !startTime || !endTime) {
    const error = new Error('Vui lòng điền đầy đủ các thông tin: Lớp học, Môn học, Phòng học, Học kỳ, Thứ, Giờ bắt đầu và Giờ kết thúc');
    error.statusCode = 400;
    throw error;
  }

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  if (endMin <= startMin) {
    const error = new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
    error.statusCode = 400;
    throw error;
  }

  const numDay = Number(dayOfWeek);
  if (isNaN(numDay) || numDay < 2 || numDay > 8) {
    const error = new Error('Thứ trong tuần không hợp lệ (2 - 8)');
    error.statusCode = 400;
    throw error;
  }

  // Overlap conflict check:
  // Slots on same dayOfWeek, overlapping weeks (startWeek <= existing.endWeek && endWeek >= existing.startWeek)
  const candidateSlots = await ScheduleSlot.find({
    semester,
    dayOfWeek: numDay,
    startWeek: { $lte: eWeek },
    endWeek: { $gte: sWeek },
  });

  for (const existing of candidateSlots) {
    const existStartMin = timeToMinutes(existing.startTime);
    const existEndMin = timeToMinutes(existing.endTime);

    // Check time overlap: start < existing.end && end > existing.start
    if (startMin < existEndMin && endMin > existStartMin) {
      if (String(existing.schoolClass) === String(schoolClass)) {
        const error = new Error('Lớp học đã có tiết trùng khung giờ này');
        error.statusCode = 409;
        throw error;
      }
      if (teacher && existing.teacher && String(existing.teacher) === String(teacher)) {
        const error = new Error('Giáo viên đã có tiết dạy trùng khung giờ này');
        error.statusCode = 409;
        throw error;
      }
      if (String(existing.room).toUpperCase() === String(room).trim().toUpperCase()) {
        const error = new Error('Phòng học đã được xếp trùng khung giờ này');
        error.statusCode = 409;
        throw error;
      }
    }
  }

  const slot = await ScheduleSlot.create({
    schoolClass,
    subject,
    teacher: teacher || null,
    room: String(room).trim(),
    semester,
    dayOfWeek: numDay,
    startTime: String(startTime).trim(),
    endTime: String(endTime).trim(),
    startWeek: sWeek,
    endWeek: eWeek,
  });

  return slot;
};

const getSlots = async (filter = {}) => {
  const query = {};
  const semester = filter.semester || filter.semesterId;
  const schoolClass = filter.schoolClass || filter.classId || filter.schoolClassId;
  const subject = filter.subject || filter.subjectId;
  const teacher = filter.teacher || filter.teacherId;
  const dayOfWeek = filter.dayOfWeek;

  if (semester && mongoose.Types.ObjectId.isValid(semester)) query.semester = semester;
  if (schoolClass && mongoose.Types.ObjectId.isValid(schoolClass)) query.schoolClass = schoolClass;
  if (subject && mongoose.Types.ObjectId.isValid(subject)) query.subject = subject;
  if (teacher && mongoose.Types.ObjectId.isValid(teacher)) query.teacher = teacher;
  if (dayOfWeek && !isNaN(Number(dayOfWeek))) query.dayOfWeek = Number(dayOfWeek);

  return ScheduleSlot.find(query)
    .populate('schoolClass', 'name')
    .populate('subject', 'code name')
    .populate('teacher', 'fullName email')
    .populate('semester', 'name')
    .sort({ dayOfWeek: 1, startTime: 1 });
};

const deleteSlot = async (slotId) => {
  const slot = await ScheduleSlot.findById(slotId).populate('schoolClass subject');
  if (slot && slot.schoolClass) {
    try {
      const notificationService = require('./notificationService');
      await notificationService.createAndDispatch({
        type: 'SCHEDULE_CHANGED',
        audience: 'class',
        className: slot.schoolClass.name,
        templateData: {
          subject: slot.subject?.name || 'Môn học',
          date: `Thứ ${slot.dayOfWeek}`,
          detail: `Tiết học (${slot.startTime} - ${slot.endTime}, phòng ${slot.room}) đã bị huỷ`,
        },
      });
    } catch (e) {}
  }
  return ScheduleSlot.findByIdAndDelete(slotId);
};

// --- STUDENT & TEACHER TIMETABLE ---
const getMySchedule = async (studentId, { week }) => {
  const currentSemester = await getCurrentSemester();
  if (!currentSemester) {
    return { slots: [], weekNumber: week || 1, message: 'Chưa có học kỳ nào được thiết lập' };
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    semester: currentSemester._id,
  }).populate('schoolClass');

  if (!enrollment) {
    return {
      schoolClass: null,
      slots: [],
      weekNumber: week || 1,
      message: 'Sinh viên chưa được phân lớp trong học kỳ này',
    };
  }

  const weekNum = week ? Number(week) : 1;
  const query = {
    semester: currentSemester._id,
    schoolClass: enrollment.schoolClass._id,
  };
  if (weekNum) {
    query.startWeek = { $lte: weekNum };
    query.endWeek = { $gte: weekNum };
  }

  const slots = await ScheduleSlot.find(query)
    .populate('subject', 'code name')
    .populate('teacher', 'fullName email')
    .sort({ dayOfWeek: 1, startTime: 1 });

  const formattedSlots = slots.map((s) => {
    const doc = s.toObject ? s.toObject() : { ...s };
    const subjectStr = doc.subject?.name
      ? (doc.subject?.code ? `${doc.subject.code} - ${doc.subject.name}` : doc.subject.name)
      : (doc.subject?.code || '');
    const teacherStr = doc.teacher?.fullName || '';
    const classNameStr = enrollment.schoolClass?.name || enrollment.schoolClass?.code || '';
    const javaDayOfWeek = doc.dayOfWeek === 8 ? 1 : doc.dayOfWeek;

    return {
      ...doc,
      subjectName: doc.subject?.name,
      subjectCode: doc.subject?.code,
      subject: subjectStr,
      teacherName: teacherStr,
      teacher: teacherStr,
      className: classNameStr,
      dayOfWeek: javaDayOfWeek,
      vnDayOfWeek: doc.dayOfWeek,
      semester: currentSemester?.name,
    };
  });

  return {
    schoolClass: enrollment.schoolClass,
    semester: currentSemester,
    weekNumber: weekNum,
    slots: formattedSlots,
  };
};

const getMyTodaySchedule = async (studentId) => {
  const currentSemester = await getCurrentSemester();
  if (!currentSemester) {
    return { slots: [], todayDayOfWeek: null };
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    semester: currentSemester._id,
  }).populate('schoolClass');

  if (!enrollment) {
    return { schoolClass: null, slots: [] };
  }

  const jsDay = new Date().getDay(); // 0 is Sun, 1 is Mon
  const dayOfWeek = jsDay === 0 ? 8 : jsDay + 1; // 2..8

  const slots = await ScheduleSlot.find({
    semester: currentSemester._id,
    schoolClass: enrollment.schoolClass._id,
    dayOfWeek,
  })
    .populate('subject', 'code name')
    .populate('teacher', 'fullName email')
    .sort({ startTime: 1 });

  const formattedSlots = slots.map((s) => {
    const doc = s.toObject ? s.toObject() : { ...s };
    const subjectStr = doc.subject?.name
      ? (doc.subject?.code ? `${doc.subject.code} - ${doc.subject.name}` : doc.subject.name)
      : (doc.subject?.code || '');
    const teacherStr = doc.teacher?.fullName || '';
    const classNameStr = enrollment.schoolClass?.name || enrollment.schoolClass?.code || '';
    const javaDayOfWeek = doc.dayOfWeek === 8 ? 1 : doc.dayOfWeek;

    return {
      ...doc,
      subjectName: doc.subject?.name,
      subjectCode: doc.subject?.code,
      subject: subjectStr,
      teacherName: teacherStr,
      teacher: teacherStr,
      className: classNameStr,
      dayOfWeek: javaDayOfWeek,
      vnDayOfWeek: doc.dayOfWeek,
      semester: currentSemester?.name,
    };
  });

  return {
    schoolClass: enrollment.schoolClass,
    todayDayOfWeek: dayOfWeek,
    slots: formattedSlots,
  };
};

const getTeachingSchedule = async (teacherId, { week }) => {
  const currentSemester = await getCurrentSemester();
  if (!currentSemester) {
    return { slots: [], weekNumber: week || 1 };
  }

  const weekNum = week ? Number(week) : 1;
  const query = {
    semester: currentSemester._id,
    teacher: teacherId,
  };
  if (weekNum) {
    query.startWeek = { $lte: weekNum };
    query.endWeek = { $gte: weekNum };
  }

  const slots = await ScheduleSlot.find(query)
    .populate('schoolClass', 'name')
    .populate('subject', 'code name')
    .sort({ dayOfWeek: 1, startTime: 1 });

  return {
    semester: currentSemester,
    weekNumber: weekNum,
    slots,
  };
};

module.exports = {
  createSemester,
  getSemesters,
  getCurrentSemester,
  createSubject,
  getSubjects,
  createClass,
  getClasses,
  assignStudentsToClass,
  getClassStudents,
  removeStudentFromClass,
  createSlot,
  getSlots,
  deleteSlot,
  getMySchedule,
  getMyTodaySchedule,
  getTeachingSchedule,
};
