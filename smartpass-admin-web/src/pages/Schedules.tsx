import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  TimePicker,
  Modal,
  Form,
  Space,
  Popconfirm,
  Empty,
  Typography,
  Tabs,
  Tag,
  DatePicker,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
  BookOutlined,
  TeamOutlined,
  ScheduleOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageShell } from '../components/PageShell';
import {
  scheduleService,
  userService,
  ScheduleSlot,
  Semester,
  Subject,
  SchoolClass,
  User,
} from '../api/services';
import { DAY_OF_WEEK_MAP } from '../constants/labels';
import { notify } from '../lib/notify';

const { Text } = Typography;

export const Schedules: React.FC = () => {
  const [activeTab, setActiveTab] = useState('slots');

  // Slots state
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Metadata
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);

  // Modals
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedClassForEnroll, setSelectedClassForEnroll] = useState<SchoolClass | null>(null);

  const [slotForm] = Form.useForm();
  const [semesterForm] = Form.useForm();
  const [subjectForm] = Form.useForm();
  const [classForm] = Form.useForm();
  const [enrollForm] = Form.useForm();

  const fetchMetadata = async () => {
    try {
      const [sems, subs, cls, usrRes] = await Promise.all([
        scheduleService.getSemesters(),
        scheduleService.getSubjects(),
        scheduleService.getClasses(),
        userService.getUsers({ limit: 100 }),
      ]);
      setSemesters(sems || []);
      setSubjects(subs || []);
      setClasses(cls || []);

      const currentSem = (sems || []).find((s) => s.isCurrent) || sems?.[0];
      if (currentSem && !selectedSemesterId) {
        setSelectedSemesterId(currentSem._id);
      }

      const allUsers = usrRes.items || [];
      setTeachers(allUsers.filter((u) => u.role === 'admin' || u.role === 'librarian'));
      setStudents(allUsers.filter((u) => u.role === 'student'));
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const fetchSlots = async () => {
    setSlotsLoading(true);
    try {
      const res = await scheduleService.getScheduleSlots({
        semesterId: selectedSemesterId || undefined,
        classId: selectedClassId || undefined,
      });
      // Sort by dayOfWeek ascending, then startTime
      const sorted = (res || []).sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
      });
      setSlots(sorted);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [selectedSemesterId, selectedClassId]);

  // Slot handlers
  const handleCreateSlot = async (values: any) => {
    try {
      await scheduleService.createScheduleSlot({
        semesterId: values.semesterId,
        classId: values.classId,
        subjectId: values.subjectId,
        teacherId: values.teacherId || undefined,
        room: values.room.trim(),
        dayOfWeek: values.dayOfWeek,
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        weeks: values.weeks ? values.weeks.split(',').map((w: string) => parseInt(w.trim())).filter((n: number) => !isNaN(n)) : undefined,
      });
      notify.success('Thêm tiết học vào thời khóa biểu thành công');
      setSlotModalOpen(false);
      slotForm.resetFields();
      fetchSlots();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      await scheduleService.deleteScheduleSlot(id);
      notify.success('Đã xóa tiết học');
      fetchSlots();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  // Semester handler
  const handleCreateSemester = async (values: any) => {
    try {
      await scheduleService.createSemester({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        startDate: values.dates[0].format('YYYY-MM-DD'),
        endDate: values.dates[1].format('YYYY-MM-DD'),
        weeksCount: values.weeksCount || 15,
        isCurrent: Boolean(values.isCurrent),
      });
      notify.success('Tạo học kỳ thành công');
      setSemesterModalOpen(false);
      semesterForm.resetFields();
      fetchMetadata();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  // Subject handler
  const handleCreateSubject = async (values: any) => {
    try {
      await scheduleService.createSubject({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        credits: values.credits || 3,
        department: values.department ? values.department.trim() : undefined,
      });
      notify.success('Tạo môn học thành công');
      setSubjectModalOpen(false);
      subjectForm.resetFields();
      fetchMetadata();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  // Class handler
  const handleCreateClass = async (values: any) => {
    try {
      await scheduleService.createClass({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        academicYear: values.academicYear ? values.academicYear.trim() : '2026-2027',
        homeroomTeacher: values.homeroomTeacher || undefined,
      });
      notify.success('Tạo lớp học thành công');
      setClassModalOpen(false);
      classForm.resetFields();
      fetchMetadata();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  // Enroll student handler
  const handleEnrollStudent = async (values: any) => {
    if (!selectedClassForEnroll) return;
    try {
      await scheduleService.enrollStudent(selectedClassForEnroll._id, values.studentId);
      notify.success('Đã ghi danh học sinh vào lớp');
      setEnrollModalOpen(false);
      enrollForm.resetFields();
      fetchMetadata();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const slotColumns: ColumnsType<ScheduleSlot> = [
    {
      title: 'Thứ',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      render: (day: number) => (
        <Tag color="cyan" style={{ fontWeight: 600 }}>
          {DAY_OF_WEEK_MAP[day] || `Thứ ${day}`}
        </Tag>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, r) => (
        <Text strong>
          {r.startTime} - {r.endTime}
        </Text>
      ),
    },
    {
      title: 'Lớp học',
      key: 'class',
      render: (_, r) => {
        const cls = typeof r.classId === 'object' ? r.classId : classes.find((c) => c._id === r.classId);
        return <Text strong>{cls?.name || '-'}</Text>;
      },
    },
    {
      title: 'Môn học',
      key: 'subject',
      render: (_, r) => {
        const sub = typeof r.subjectId === 'object' ? r.subjectId : subjects.find((s) => s._id === r.subjectId);
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{sub?.name || '-'}</Text>
            {sub?.code && <Text type="secondary" style={{ fontSize: 12 }}>{sub.code}</Text>}
          </Space>
        );
      },
    },
    {
      title: 'Phòng học',
      dataIndex: 'room',
      key: 'room',
      render: (rm: string) => <Tag color="blue">{rm}</Tag>,
    },
    {
      title: 'Giảng viên',
      key: 'teacher',
      render: (_, r) => {
        const t = typeof r.teacherId === 'object' ? r.teacherId : teachers.find((u) => u._id === r.teacherId);
        return <Text>{t?.fullName || '-'}</Text>;
      },
    },
    {
      title: 'Tuần học',
      dataIndex: 'weeks',
      key: 'weeks',
      render: (wks: number[]) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {wks && wks.length > 0 ? `Tuần ${wks.join(', ')}` : 'Tất cả tuần'}
        </Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="Xác nhận xóa tiết học này?"
          description="Lưu ý: Không thể hoàn tác."
          onConfirm={() => handleDeleteSlot(record._id)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <PageShell
      title="Quản lý Thời khóa biểu & Lớp học"
      extraAction={
        activeTab === 'slots' ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              slotForm.setFieldsValue({
                semesterId: selectedSemesterId,
                classId: selectedClassId,
                weeks: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15',
              });
              setSlotModalOpen(true);
            }}
          >
            Thêm tiết học
          </Button>
        ) : activeTab === 'semesters' ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setSemesterModalOpen(true)}>
            Thêm học kỳ
          </Button>
        ) : activeTab === 'subjects' ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setSubjectModalOpen(true)}>
            Thêm môn học
          </Button>
        ) : (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setClassModalOpen(true)}>
            Thêm lớp học
          </Button>
        )
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'slots',
            label: (
              <span>
                <ScheduleOutlined /> Thời khóa biểu
              </span>
            ),
            children: (
              <div>
                <Space style={{ marginBottom: 16 }} wrap>
                  <Select
                    placeholder="Chọn học kỳ"
                    style={{ width: 220 }}
                    value={selectedSemesterId || undefined}
                    onChange={(val) => setSelectedSemesterId(val)}
                    options={semesters.map((s) => ({
                      value: s._id,
                      label: `${s.name}${s.isCurrent ? ' (Hiện tại)' : ''}`,
                    }))}
                  />
                  <Select
                    placeholder="Lọc theo lớp học"
                    allowClear
                    style={{ width: 200 }}
                    value={selectedClassId || undefined}
                    onChange={(val) => setSelectedClassId(val || '')}
                    options={classes.map((c) => ({
                      value: c._id,
                      label: c.name,
                    }))}
                  />
                  <Button onClick={fetchSlots}>Làm mới</Button>
                </Space>

                <Table
                  columns={slotColumns}
                  dataSource={slots}
                  rowKey="_id"
                  loading={slotsLoading}
                  pagination={{ pageSize: 15 }}
                  locale={{ emptyText: <Empty description="Chưa có tiết học nào trong học kỳ này" /> }}
                />
              </div>
            ),
          },
          {
            key: 'semesters',
            label: (
              <span>
                <CalendarOutlined /> Học kỳ
              </span>
            ),
            children: (
              <Table
                dataSource={semesters}
                rowKey="_id"
                columns={[
                  { title: 'Mã học kỳ', dataIndex: 'code', key: 'code', render: (c: string) => <Tag color="geekblue">{c}</Tag> },
                  { title: 'Tên học kỳ', dataIndex: 'name', key: 'name', render: (n: string) => <Text strong>{n}</Text> },
                  {
                    title: 'Thời gian',
                    key: 'dates',
                    render: (_, r) => (
                      <Text>
                        {dayjs(r.startDate).format('DD/MM/YYYY')} - {dayjs(r.endDate).format('DD/MM/YYYY')}
                      </Text>
                    ),
                  },
                  { title: 'Số tuần', dataIndex: 'weeksCount', key: 'weeksCount' },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'isCurrent',
                    key: 'isCurrent',
                    render: (cur: boolean) => (cur ? <Tag color="success">Đang diễn ra</Tag> : <Tag>Đã đóng</Tag>),
                  },
                ]}
              />
            ),
          },
          {
            key: 'subjects',
            label: (
              <span>
                <BookOutlined /> Môn học
              </span>
            ),
            children: (
              <Table
                dataSource={subjects}
                rowKey="_id"
                columns={[
                  { title: 'Mã môn', dataIndex: 'code', key: 'code', render: (c: string) => <Tag color="purple">{c}</Tag> },
                  { title: 'Tên môn học', dataIndex: 'name', key: 'name', render: (n: string) => <Text strong>{n}</Text> },
                  { title: 'Số tín chỉ', dataIndex: 'credits', key: 'credits' },
                  { title: 'Khoa / Bộ môn', dataIndex: 'department', key: 'department', render: (d: string) => d || '-' },
                ]}
              />
            ),
          },
          {
            key: 'classes',
            label: (
              <span>
                <TeamOutlined /> Lớp học & Ghi danh
              </span>
            ),
            children: (
              <Table
                dataSource={classes}
                rowKey="_id"
                columns={[
                  { title: 'Mã lớp', dataIndex: 'code', key: 'code', render: (c: string) => <Tag color="green">{c}</Tag> },
                  { title: 'Tên lớp', dataIndex: 'name', key: 'name', render: (n: string) => <Text strong>{n}</Text> },
                  { title: 'Niên khóa', dataIndex: 'academicYear', key: 'academicYear' },
                  {
                    title: 'Thao tác',
                    key: 'action',
                    render: (_, r) => (
                      <Button
                        size="small"
                        icon={<UserAddOutlined />}
                        onClick={() => {
                          setSelectedClassForEnroll(r);
                          setEnrollModalOpen(true);
                        }}
                      >
                        Ghi danh học sinh
                      </Button>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />

      {/* Add Slot Modal */}
      <Modal
        title="Thêm tiết học vào thời khóa biểu"
        open={slotModalOpen}
        onCancel={() => setSlotModalOpen(false)}
        onOk={() => slotForm.submit()}
        okText="Lưu tiết học"
        cancelText="Hủy"
        destroyOnHidden
        width={560}
      >
        <Form form={slotForm} layout="vertical" onFinish={handleCreateSlot}>
          <Form.Item name="semesterId" label="Học kỳ" rules={[{ required: true, message: 'Vui lòng chọn học kỳ' }]}>
            <Select
              placeholder="Chọn học kỳ"
              options={semesters.map((s) => ({ value: s._id, label: s.name }))}
            />
          </Form.Item>
          <Form.Item name="classId" label="Lớp học" rules={[{ required: true, message: 'Vui lòng chọn lớp học' }]}>
            <Select
              placeholder="Chọn lớp học"
              options={classes.map((c) => ({ value: c._id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="subjectId" label="Môn học" rules={[{ required: true, message: 'Vui lòng chọn môn học' }]}>
            <Select
              placeholder="Chọn môn học"
              options={subjects.map((s) => ({ value: s._id, label: `${s.code} - ${s.name}` }))}
            />
          </Form.Item>
          <Form.Item name="teacherId" label="Giảng viên">
            <Select
              allowClear
              placeholder="Chọn giảng viên phụ trách"
              options={teachers.map((t) => ({ value: t._id, label: t.fullName }))}
            />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="dayOfWeek" label="Thứ" rules={[{ required: true, message: 'Chọn thứ' }]}>
              <Select
                style={{ width: 140 }}
                options={[
                  { value: 2, label: 'Thứ 2' },
                  { value: 3, label: 'Thứ 3' },
                  { value: 4, label: 'Thứ 4' },
                  { value: 5, label: 'Thứ 5' },
                  { value: 6, label: 'Thứ 6' },
                  { value: 7, label: 'Thứ 7' },
                  { value: 8, label: 'Chủ nhật' },
                ]}
              />
            </Form.Item>
            <Form.Item name="startTime" label="Giờ bắt đầu" rules={[{ required: true, message: 'Chọn giờ bắt đầu' }]}>
              <TimePicker format="HH:mm" minuteStep={5} />
            </Form.Item>
            <Form.Item name="endTime" label="Giờ kết thúc" rules={[{ required: true, message: 'Chọn giờ kết thúc' }]}>
              <TimePicker format="HH:mm" minuteStep={5} />
            </Form.Item>
          </Space>
          <Form.Item name="room" label="Phòng học" rules={[{ required: true, message: 'Nhập phòng học' }]}>
            <Input placeholder="Ví dụ: A2-301" />
          </Form.Item>
          <Form.Item
            name="weeks"
            label="Các tuần học áp dụng (phân cách bằng dấu phẩy)"
            rules={[{ required: true, message: 'Nhập các tuần' }]}
          >
            <Input placeholder="Ví dụ: 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Semester Modal */}
      <Modal
        title="Thêm học kỳ mới"
        open={semesterModalOpen}
        onCancel={() => setSemesterModalOpen(false)}
        onOk={() => semesterForm.submit()}
        okText="Tạo học kỳ"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={semesterForm} layout="vertical" onFinish={handleCreateSemester}>
          <Form.Item name="code" label="Mã học kỳ" rules={[{ required: true, message: 'Nhập mã học kỳ (VD: 2026_HK1)' }]}>
            <Input placeholder="2026_HK1" />
          </Form.Item>
          <Form.Item name="name" label="Tên học kỳ" rules={[{ required: true, message: 'Nhập tên học kỳ' }]}>
            <Input placeholder="Học kỳ 1 (2026-2027)" />
          </Form.Item>
          <Form.Item name="dates" label="Thời gian bắt đầu - kết thúc" rules={[{ required: true, message: 'Chọn thời gian' }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="weeksCount" label="Số tuần" initialValue={15}>
            <InputNumber min={1} max={30} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isCurrent" label="Học kỳ hiện tại" initialValue={true}>
            <Select
              options={[
                { value: true, label: 'Đang diễn ra (Active)' },
                { value: false, label: 'Chưa / Đã qua' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Subject Modal */}
      <Modal
        title="Thêm môn học mới"
        open={subjectModalOpen}
        onCancel={() => setSubjectModalOpen(false)}
        onOk={() => subjectForm.submit()}
        okText="Tạo môn học"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={subjectForm} layout="vertical" onFinish={handleCreateSubject}>
          <Form.Item name="code" label="Mã môn học" rules={[{ required: true, message: 'Nhập mã môn học (VD: CS101)' }]}>
            <Input placeholder="CS101" />
          </Form.Item>
          <Form.Item name="name" label="Tên môn học" rules={[{ required: true, message: 'Nhập tên môn học' }]}>
            <Input placeholder="Lập trình mạng" />
          </Form.Item>
          <Form.Item name="credits" label="Số tín chỉ" initialValue={3}>
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="department" label="Khoa phụ trách">
            <Input placeholder="Công nghệ thông tin" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Class Modal */}
      <Modal
        title="Thêm lớp học mới"
        open={classModalOpen}
        onCancel={() => setClassModalOpen(false)}
        onOk={() => classForm.submit()}
        okText="Tạo lớp học"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={classForm} layout="vertical" onFinish={handleCreateClass}>
          <Form.Item name="code" label="Mã lớp" rules={[{ required: true, message: 'Nhập mã lớp (VD: 12A1)' }]}>
            <Input placeholder="12A1" />
          </Form.Item>
          <Form.Item name="name" label="Tên lớp" rules={[{ required: true, message: 'Nhập tên lớp' }]}>
            <Input placeholder="Lớp 12A1 - Ban A" />
          </Form.Item>
          <Form.Item name="academicYear" label="Niên khóa" initialValue="2026-2027">
            <Input placeholder="2026-2027" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Enroll Student Modal */}
      <Modal
        title={`Ghi danh học sinh vào lớp ${selectedClassForEnroll?.name || ''}`}
        open={enrollModalOpen}
        onCancel={() => setEnrollModalOpen(false)}
        onOk={() => enrollForm.submit()}
        okText="Ghi danh"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={enrollForm} layout="vertical" onFinish={handleEnrollStudent}>
          <Form.Item name="studentId" label="Học sinh" rules={[{ required: true, message: 'Chọn học sinh' }]}>
            <Select
              showSearch
              placeholder="Chọn học sinh để ghi danh"
              options={students.map((st) => ({
                value: st._id,
                label: `${st.fullName} (${st.email}${st.studentCode ? ' - ' + st.studentCode : ''})`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};
