import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  DatePicker,
  Input,
  Select,
  Modal,
  Form,
  Space,
  Typography,
  Tabs,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  QRCode,
  Popconfirm,
} from 'antd';
import {
  CheckSquareOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageShell } from '../components/PageShell';
import {
  attendanceService,
  scheduleService,
  AttendanceRecord,
  AttendanceSession,
  ScheduleSlot,
  SchoolClass,
} from '../api/services';
import { notify } from '../lib/notify';
import { formatDateTime } from '../utils/format';

const { Text, Title } = Typography;

export const Attendance: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sessions');

  // Slots & Classes
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  // Session state
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<dayjs.Dayjs>(dayjs());
  const [activeSessionData, setActiveSessionData] = useState<{
    session: AttendanceSession;
    slot: ScheduleSlot;
    stats: { totalEnrolled: number; present: number; late: number; absent: number; notRecorded: number };
    roster: Array<any>;
  } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Correction modal
  const [correctModalOpen, setCorrectModalOpen] = useState(false);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<any>(null);
  const [correctForm] = Form.useForm();

  // Class Report state
  const [selectedClassReportId, setSelectedClassReportId] = useState<string>('');
  const [classReportData, setClassReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // History list state
  const [historyData, setHistoryData] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    scheduleService.getScheduleSlots().then((res) => setSlots(res || []));
    scheduleService.getClasses().then((res) => {
      setClasses(res || []);
      if (res && res.length > 0) setSelectedClassReportId(res[0]._id);
    });
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await attendanceService.getAttendanceList();
      setHistoryData(res || []);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenSession = async () => {
    if (!selectedSlotId) {
      notify.error('Vui lòng chọn tiết học');
      return;
    }
    setSessionLoading(true);
    try {
      const dateStr = sessionDate.format('YYYY-MM-DD');
      const session = await attendanceService.openSession({
        slotId: selectedSlotId,
        date: dateStr,
      });
      notify.success('Mở phiên điểm danh thành công');
      // Load roster
      const rosterRes = await attendanceService.getSessionRoster(session._id);
      setActiveSessionData(rosterRes);
    } catch (err: any) {
      notify.serverError(err);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleRefreshRoster = async () => {
    if (!activeSessionData?.session?._id) return;
    setSessionLoading(true);
    try {
      const rosterRes = await attendanceService.getSessionRoster(activeSessionData.session._id);
      setActiveSessionData(rosterRes);
    } catch (err: any) {
      notify.serverError(err);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSessionData?.session?._id) return;
    try {
      const res = await attendanceService.closeSession(activeSessionData.session._id);
      notify.success(`Đã đóng phiên điểm danh. Tự động ghi vắng ${res.absenteesCount} học sinh chưa điểm danh.`);
      handleRefreshRoster();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handleSaveCorrection = async (values: any) => {
    if (!selectedRecordForCorrection?.recordId) return;
    try {
      await attendanceService.correctRecord(selectedRecordForCorrection.recordId, {
        status: values.status,
        note: values.note.trim(),
      });
      notify.success('Hiệu chỉnh điểm danh thành công');
      setCorrectModalOpen(false);
      correctForm.resetFields();
      handleRefreshRoster();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const fetchClassReport = async (classId: string) => {
    if (!classId) return;
    setReportLoading(true);
    try {
      const res = await attendanceService.getClassReport(classId);
      setClassReportData(res);
    } catch (err: any) {
      notify.serverError(err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassReportId) {
      fetchClassReport(selectedClassReportId);
    }
  }, [selectedClassReportId]);

  return (
    <PageShell
      title="Quản lý Điểm danh"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'sessions',
            label: (
              <span>
                <CheckSquareOutlined /> Phiên điểm danh theo tiết
              </span>
            ),
            children: (
              <div>
                <Card style={{ marginBottom: 20 }}>
                  <Space wrap size={16}>
                    <div>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                        Tiết học trong thời khóa biểu:
                      </Text>
                      <Select
                        placeholder="Chọn tiết học..."
                        style={{ width: 340 }}
                        value={selectedSlotId || undefined}
                        onChange={(val) => setSelectedSlotId(val)}
                        options={slots.map((s) => {
                          const clsName = typeof s.classId === 'object' ? s.classId?.name : s.classId;
                          const subName = typeof s.subjectId === 'object' ? s.subjectId?.name : s.subjectId;
                          return {
                            value: s._id,
                            label: `Thứ ${s.dayOfWeek} (${s.startTime}-${s.endTime}) - ${clsName} - ${subName} (${s.room})`,
                          };
                        })}
                      />
                    </div>
                    <div>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                        Ngày điểm danh:
                      </Text>
                      <DatePicker
                        value={sessionDate}
                        onChange={(d) => d && setSessionDate(d)}
                        format="DD/MM/YYYY"
                      />
                    </div>
                    <div style={{ paddingTop: 22 }}>
                      <Button
                        type="primary"
                        icon={<CheckSquareOutlined />}
                        loading={sessionLoading}
                        onClick={handleOpenSession}
                      >
                        Mở phiên điểm danh
                      </Button>
                    </div>
                  </Space>
                </Card>

                {activeSessionData && (
                  <div>
                    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                      <Col xs={24} md={6}>
                        <Card style={{ textAlign: 'center' }}>
                          <Text strong>Mã QR Điểm danh phiên</Text>
                          <div style={{ margin: '12px auto' }}>
                            <QRCode
                              value={activeSessionData.session.qrPayload || activeSessionData.session._id}
                              size={150}
                            />
                          </div>
                          <Tag color={activeSessionData.session.status === 'OPEN' ? 'green' : 'default'}>
                            {activeSessionData.session.status === 'OPEN' ? 'ĐANG MỞ ĐIỂM DANH' : 'ĐÃ ĐÓNG PHIÊN'}
                          </Tag>
                        </Card>
                      </Col>
                      <Col xs={24} md={18}>
                        <Card>
                          <Row gutter={16}>
                            <Col span={6}>
                              <Statistic title="Sĩ số lớp" value={activeSessionData.stats.totalEnrolled} />
                            </Col>
                            <Col span={6}>
                              <Statistic
                                title="Có mặt (Đúng giờ)"
                                value={activeSessionData.stats.present}
                                valueStyle={{ color: '#0F766E' }}
                              />
                            </Col>
                            <Col span={6}>
                              <Statistic
                                title="Đi muộn"
                                value={activeSessionData.stats.late}
                                valueStyle={{ color: '#D97706' }}
                              />
                            </Col>
                            <Col span={6}>
                              <Statistic
                                title="Vắng mặt"
                                value={activeSessionData.stats.absent}
                                valueStyle={{ color: '#DC2626' }}
                              />
                            </Col>
                          </Row>

                          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                            <Button icon={<ReloadOutlined />} onClick={handleRefreshRoster} loading={sessionLoading}>
                              Làm mới danh sách
                            </Button>
                            {activeSessionData.session.status === 'OPEN' && (
                              <Popconfirm
                                title="Xác nhận đóng phiên điểm danh?"
                                description="Các học sinh chưa quét thẻ sẽ tự động được đánh dấu Vắng (ABSENT)."
                                onConfirm={handleCloseSession}
                                okText="Đóng phiên"
                                cancelText="Hủy"
                              >
                                <Button danger icon={<CloseCircleOutlined />}>
                                  Đóng phiên điểm danh
                                </Button>
                              </Popconfirm>
                            )}
                            <Button
                              icon={<FileExcelOutlined />}
                              href={`/api/attendance/sessions/${activeSessionData.session._id}/export-csv`}
                              target="_blank"
                            >
                              Xuất file CSV phiên
                            </Button>
                          </div>
                        </Card>
                      </Col>
                    </Row>

                    <Card title="Danh sách học sinh & Trạng thái điểm danh">
                      <Table
                        dataSource={activeSessionData.roster}
                        rowKey={(r) => r.student._id}
                        pagination={false}
                        columns={[
                          {
                            title: 'Mã HS',
                            dataIndex: ['student', 'studentCode'],
                            key: 'studentCode',
                            render: (c) => <Text code>{c || '-'}</Text>,
                          },
                          {
                            title: 'Họ và tên',
                            dataIndex: ['student', 'fullName'],
                            key: 'fullName',
                            render: (n) => <Text strong>{n}</Text>,
                          },
                          {
                            title: 'Trạng thái',
                            dataIndex: 'status',
                            key: 'status',
                            render: (st: string) => {
                              if (st === 'PRESENT') return <Tag color="success">CÓ MẶT</Tag>;
                              if (st === 'LATE') return <Tag color="warning">ĐI MUỘN</Tag>;
                              if (st === 'ABSENT') return <Tag color="error">VẮNG MẶT</Tag>;
                              return <Tag color="default">CHƯA ĐIỂM DANH</Tag>;
                            },
                          },
                          {
                            title: 'Thời gian ghi nhận',
                            dataIndex: 'recordedAt',
                            key: 'recordedAt',
                            render: (dt: string) => (dt ? formatDateTime(dt) : '-'),
                          },
                          {
                            title: 'Phương thức',
                            dataIndex: 'method',
                            key: 'method',
                            render: (m: string) => (m ? <Tag>{m}</Tag> : '-'),
                          },
                          {
                            title: 'Ghi chú',
                            dataIndex: 'correctionNote',
                            key: 'correctionNote',
                            render: (note: string) => <Text type="secondary">{note || '-'}</Text>,
                          },
                          {
                            title: 'Thao tác',
                            key: 'action',
                            render: (_, record) =>
                              record.recordId ? (
                                <Button
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => {
                                    setSelectedRecordForCorrection(record);
                                    correctForm.setFieldsValue({
                                      status: record.status,
                                      note: record.correctionNote || '',
                                    });
                                    setCorrectModalOpen(true);
                                  }}
                                >
                                  Hiệu chỉnh
                                </Button>
                              ) : null,
                          },
                        ]}
                      />
                    </Card>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'reports',
            label: (
              <span>
                <FileExcelOutlined /> Báo cáo chuyên cần theo lớp
              </span>
            ),
            children: (
              <div>
                <Space style={{ marginBottom: 16 }}>
                  <Select
                    placeholder="Chọn lớp học"
                    style={{ width: 240 }}
                    value={selectedClassReportId || undefined}
                    onChange={(val) => setSelectedClassReportId(val)}
                    options={classes.map((c) => ({ value: c._id, label: c.name }))}
                  />
                  <Button onClick={() => fetchClassReport(selectedClassReportId)} loading={reportLoading}>
                    Xem báo cáo
                  </Button>
                  {selectedClassReportId && (
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      href={`/api/attendance/reports/class/${selectedClassReportId}/export-csv`}
                      target="_blank"
                    >
                      Tải CSV Báo cáo
                    </Button>
                  )}
                </Space>

                {classReportData && (
                  <Card>
                    <Title level={5} style={{ marginBottom: 16 }}>
                      Tổng số buổi học đã diễn ra: {classReportData.totalSessions} buổi
                    </Title>
                    <Table
                      dataSource={classReportData.studentStats || []}
                      rowKey={(r: any) => r.student?._id || r.student}
                      columns={[
                        { title: 'Mã HS', dataIndex: ['student', 'studentCode'], key: 'code', render: (c) => <Text code>{c || '-'}</Text> },
                        { title: 'Họ và tên', dataIndex: ['student', 'fullName'], key: 'name', render: (n) => <Text strong>{n}</Text> },
                        { title: 'Có mặt', dataIndex: 'present', key: 'present', render: (v) => <Tag color="success">{v}</Tag> },
                        { title: 'Đi muộn', dataIndex: 'late', key: 'late', render: (v) => <Tag color="warning">{v}</Tag> },
                        { title: 'Vắng', dataIndex: 'absent', key: 'absent', render: (v) => <Tag color="error">{v}</Tag> },
                        {
                          title: 'Tỷ lệ chuyên cần',
                          dataIndex: 'rate',
                          key: 'rate',
                          render: (rate: string) => <Text strong style={{ color: '#0F766E' }}>{rate}</Text>,
                        },
                      ]}
                    />
                  </Card>
                )}
              </div>
            ),
          },
          {
            key: 'history',
            label: (
              <span>
                <ReloadOutlined /> Lịch sử điểm danh toàn trường
              </span>
            ),
            children: (
              <Table
                dataSource={historyData}
                rowKey="_id"
                loading={historyLoading}
                columns={[
                  { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', render: (dt) => formatDateTime(dt) },
                  { title: 'Học sinh', dataIndex: ['student', 'fullName'], key: 'student', render: (n) => <Text strong>{n || '-'}</Text> },
                  { title: 'Mã thẻ', dataIndex: ['card', 'cardCode'], key: 'card', render: (c) => <Text code>{c || '-'}</Text> },
                  { title: 'Môn / Buổi học', dataIndex: 'subject', key: 'subject', render: (s, r) => s || r.classSession || '-' },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    key: 'status',
                    render: (st: string) => (st === 'present' || st === 'PRESENT' ? <Tag color="success">Đúng giờ</Tag> : <Tag color="warning">Đi muộn</Tag>),
                  },
                ]}
              />
            ),
          },
        ]}
      />

      {/* Correct Record Modal */}
      <Modal
        title={`Hiệu chỉnh điểm danh: ${selectedRecordForCorrection?.student?.fullName || ''}`}
        open={correctModalOpen}
        onCancel={() => setCorrectModalOpen(false)}
        onOk={() => correctForm.submit()}
        okText="Lưu hiệu chỉnh"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={correctForm} layout="vertical" onFinish={handleSaveCorrection}>
          <Form.Item name="status" label="Trạng thái điểm danh" rules={[{ required: true, message: 'Chọn trạng thái' }]}>
            <Select
              options={[
                { value: 'PRESENT', label: 'CÓ MẶT (Đúng giờ)' },
                { value: 'LATE', label: 'ĐI MUỘN' },
                { value: 'ABSENT', label: 'VẮNG MẶT' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="note"
            label="Lý do / Ghi chú hiệu chỉnh (Bắt buộc để lưu audit log)"
            rules={[{ required: true, message: 'Vui lòng nhập lý do hiệu chỉnh' }]}
          >
            <Input.TextArea rows={3} placeholder="Ví dụ: Học sinh có phép từ phụ huynh" />
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};
