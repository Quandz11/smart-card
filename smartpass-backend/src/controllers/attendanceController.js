const attendanceService = require('../services/attendanceService');

const openSession = async (req, res, next) => {
  try {
    const result = await attendanceService.openAttendanceSession(req.body, req.user);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const checkAttendance = async (req, res, next) => {
  try {
    const attendance = await attendanceService.checkAttendance(
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

const closeSession = async (req, res, next) => {
  try {
    const session = await attendanceService.closeAttendanceSession(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const correctRecord = async (req, res, next) => {
  try {
    const record = await attendanceService.correctAttendanceRecord(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const data = await attendanceService.getMyAttendance(req.user._id);
    const returnObject = req.query.v === '2' || req.headers['x-api-version'] === '2';
    res.status(200).json({
      success: true,
      data: returnObject ? data : data.records,
      records: data.records,
      stats: data.stats,
    });
  } catch (error) {
    next(error);
  }
};

const getSessionRoster = async (req, res, next) => {
  try {
    const roster = await attendanceService.getSessionRoster(req.params.id);
    res.status(200).json({
      success: true,
      data: roster,
    });
  } catch (error) {
    next(error);
  }
};

const exportSessionCsv = async (req, res, next) => {
  try {
    const csv = await attendanceService.exportSessionCsv(req.params.id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-session-${req.params.id}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

const getClassReport = async (req, res, next) => {
  try {
    const report = await attendanceService.getClassReport(req.params.classId);
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

const exportClassReportCsv = async (req, res, next) => {
  try {
    const csv = await attendanceService.exportClassReportCsv(req.params.classId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="class-report-${req.params.classId}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  openSession,
  checkAttendance,
  closeSession,
  correctRecord,
  getMyAttendance,
  getSessionRoster,
  exportSessionCsv,
  getClassReport,
  exportClassReportCsv,
};
