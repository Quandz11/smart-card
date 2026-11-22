import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  DatePicker,
  TimePicker,
  Input,
  Modal,
  Form,
  Space,
  Empty,
  Typography,
  Alert,
  Popconfirm,
  List,
  Card as AntCard,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageShell } from '../components/PageShell';
import { StatusTag } from '../components/StatusTag';
import { roomBookingService, RoomBooking } from '../api/services';
import { MESSAGES } from '../constants/messages';
import { notify } from '../lib/notify';
import { formatDate } from '../utils/format';

const { Text } = Typography;

export const RoomBookings: React.FC = () => {
  const [myBookings, setMyBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(false);

  // Availability lookup state
  const [checkDate, setCheckDate] = useState<any>(dayjs());
  const [checkRoom, setCheckRoom] = useState('');
  const [availabilitySlots, setAvailabilitySlots] = useState<
    Array<{ startTime: string; endTime: string; purpose?: string }>
  >([]);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkedPerformed, setCheckedPerformed] = useState(false);

  // New booking modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const res = await roomBookingService.getMyBookings();
      setMyBookings(res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCheckAvailability = async () => {
    if (!checkRoom.trim()) {
      notify.warning(MESSAGES.SEARCH_ROOM_REQUIRED);
      return;
    }
    if (!checkDate) {
      notify.warning(MESSAGES.SEARCH_DATE_REQUIRED);
      return;
    }

    setCheckLoading(true);
    setCheckedPerformed(true);
    try {
      const slots = await roomBookingService.getAvailability({
        date: checkDate.format('YYYY-MM-DD'),
        room: checkRoom.trim(),
      });
      setAvailabilitySlots(slots || []);
    } catch (err: any) {
      notify.serverError(err);
    } finally {
      setCheckLoading(false);
    }
  };

  const handleCreateBooking = async (values: any) => {
    if (values.endTime.isBefore(values.startTime) || values.endTime.isSame(values.startTime)) {
      notify.warning(MESSAGES.BOOKING_END_BEFORE_START);
      return;
    }
    try {
      await roomBookingService.createBooking({
        room: values.room.trim(),
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        purpose: values.purpose ? values.purpose.trim() : undefined,
      });
      notify.success(MESSAGES.BOOKING_CREATE_SUCCESS);
      setCreateModalOpen(false);
      form.resetFields();
      fetchMyBookings();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await roomBookingService.approveBooking(id);
      notify.success(MESSAGES.BOOKING_APPROVE_SUCCESS);
      fetchMyBookings();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await roomBookingService.rejectBooking(id);
      notify.success(MESSAGES.BOOKING_REJECT_SUCCESS);
      fetchMyBookings();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await roomBookingService.cancelBooking(id);
      notify.success(MESSAGES.BOOKING_CANCEL_SUCCESS);
      fetchMyBookings();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const columns: ColumnsType<RoomBooking> = [
    {
      title: 'Phòng',
      dataIndex: 'room',
      key: 'room',
      render: (r: string) => <Text strong>{r}</Text>,
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'date',
      key: 'date',
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, record) => `${record.startTime} - ${record.endTime}`,
    },
    {
      title: 'Mục đích',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (p?: string) => p || '-',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => <StatusTag type="room" value={st} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title={MESSAGES.CONFIRM_BOOKING_APPROVE_TITLE}
                description={MESSAGES.CONFIRM_BOOKING_APPROVE_CONTENT}
                onConfirm={() => handleApprove(record._id)}
                okText={MESSAGES.CONFIRM_OK_TEXT}
                cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
              >
                <Button
                  type="text"
                  size="small"
                  style={{ color: '#16A34A' }}
                  icon={<CheckCircleOutlined />}
                >
                  Duyệt
                </Button>
              </Popconfirm>
              <Popconfirm
                title={MESSAGES.CONFIRM_BOOKING_REJECT_TITLE}
                description={MESSAGES.CONFIRM_BOOKING_REJECT_CONTENT}
                onConfirm={() => handleReject(record._id)}
                okText={MESSAGES.CONFIRM_OK_TEXT}
                cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                >
                  Từ chối
                </Button>
              </Popconfirm>
              <Popconfirm
                title={MESSAGES.CONFIRM_BOOKING_CANCEL_TITLE}
                description={MESSAGES.CONFIRM_BOOKING_CANCEL_CONTENT}
                onConfirm={() => handleCancel(record._id)}
                okText={MESSAGES.CONFIRM_DANGER_OK_TEXT}
                cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
                okButtonProps={{ danger: true }}
              >
                <Button type="text" size="small" icon={<StopOutlined />}>
                  Hủy
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'approved' && (
            <Popconfirm
              title={MESSAGES.CONFIRM_BOOKING_CANCEL_TITLE}
              description={MESSAGES.CONFIRM_BOOKING_CANCEL_CONTENT}
              onConfirm={() => handleCancel(record._id)}
              okText={MESSAGES.CONFIRM_DANGER_OK_TEXT}
              cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger size="small" icon={<StopOutlined />}>
                Hủy đặt
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageShell
      title="Quản lý mượn phòng & phòng chức năng"
      description="Tra cứu tình trạng phòng trống, đăng ký sử dụng phòng và phê duyệt lịch đặt phòng"
      extraAction={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setCreateModalOpen(true);
          }}
        >
          Đặt phòng mới
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size={20}>
        {/* Missing Endpoint Alert as required by spec */}
        <Alert
          message="Lưu ý về dữ liệu phòng"
          description="Backend chưa có endpoint liệt kê toàn bộ đặt phòng cho admin — danh sách dưới đây là đặt phòng của tài khoản đang đăng nhập."
          type="info"
          showIcon
        />

        {/* Section 1: Check availability */}
        <AntCard size="small" title="Tra cứu phòng trống">
          <Space wrap size={12}>
            <Input
              placeholder="Nhập tên phòng (ví dụ: Lab 101, Phòng họp A)..."
              value={checkRoom}
              onChange={(e) => setCheckRoom(e.target.value)}
              style={{ width: 260 }}
            />
            <DatePicker
              value={checkDate}
              onChange={(d) => setCheckDate(d)}
              format="DD/MM/YYYY"
              allowClear={false}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              loading={checkLoading}
              onClick={handleCheckAvailability}
            >
              Tra cứu khung giờ đã duyệt
            </Button>
          </Space>

          {checkedPerformed && (
            <div style={{ marginTop: 16 }}>
              {availabilitySlots.length === 0 ? (
                <Alert
                  type="success"
                  message={`Phòng "${checkRoom}" chưa có lịch đặt nào được duyệt vào ngày ${checkDate?.format('DD/MM/YYYY')} (Tất cả khung giờ còn trống).`}
                  showIcon
                />
              ) : (
                <List
                  size="small"
                  header={<Text strong>Các khung giờ đã được duyệt (Đang bận):</Text>}
                  bordered
                  dataSource={availabilitySlots}
                  renderItem={(item) => (
                    <List.Item>
                      <Space>
                        <Text strong style={{ color: '#DC2626' }}>
                          {item.startTime} - {item.endTime}
                        </Text>
                        {item.purpose && <Text type="secondary">({item.purpose})</Text>}
                      </Space>
                    </List.Item>
                  )}
                />
              )}
            </div>
          )}
        </AntCard>

        {/* Section 2: My Bookings Table */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ fontSize: 16 }}>
              Danh sách đặt phòng của tôi
            </Text>
          </div>
          <Table
            columns={columns}
            dataSource={myBookings}
            rowKey="_id"
            size="middle"
            bordered={false}
            loading={loading}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: <Empty description={MESSAGES.EMPTY_BOOKINGS} /> }}
            pagination={{
              pageSize: 20,
              showTotal: (total) => `Tổng ${total} bản ghi`,
            }}
          />
        </div>
      </Space>

      {/* Create Booking Modal */}
      <Modal
        title="Đăng ký mượn phòng"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => form.submit()}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateBooking}>
          <Form.Item
            name="room"
            label="Phòng cần mượn"
            rules={[{ required: true, message: 'Vui lòng nhập tên phòng' }]}
          >
            <Input placeholder="Ví dụ: Lab 101" />
          </Form.Item>

          <Form.Item
            name="date"
            label="Ngày mượn"
            initialValue={dayjs()}
            rules={[{ required: true, message: 'Vui lòng chọn ngày mượn' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item
              name="startTime"
              label="Giờ bắt đầu"
              rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]}
            >
              <TimePicker format="HH:mm" minuteStep={15} />
            </Form.Item>

            <Form.Item
              name="endTime"
              label="Giờ kết thúc"
              rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc' }]}
            >
              <TimePicker format="HH:mm" minuteStep={15} />
            </Form.Item>
          </Space>

          <Form.Item name="purpose" label="Mục đích sử dụng">
            <Input.TextArea rows={3} placeholder="Ví dụ: Họp đồ án tốt nghiệp nhóm 5" />
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

