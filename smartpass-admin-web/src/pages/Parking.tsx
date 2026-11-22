import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Empty,
  Typography,
  Result,
  Descriptions,
} from 'antd';
import { LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageShell } from '../components/PageShell';
import { parkingService, ParkingSession } from '../api/services';
import { MESSAGES } from '../constants/messages';
import { notify } from '../lib/notify';
import { formatDateTime, formatVND } from '../utils/format';

const { Text } = Typography;

export const Parking: React.FC = () => {
  const [data, setData] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(false);

  // Check-in modal
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [identifierType, setIdentifierType] = useState<'cardCode' | 'qrToken' | 'nfcUid'>('cardCode');

  // Check-out confirmation modal (Multi-step action 4.10)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [sessionToCheckout, setSessionToCheckout] = useState<ParkingSession | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Check-out result modal
  const [checkOutResultOpen, setCheckOutResultOpen] = useState(false);
  const [checkOutSession, setCheckOutSession] = useState<ParkingSession | null>(null);

  const [form] = Form.useForm();

  const fetchActiveSessions = async () => {
    setLoading(true);
    try {
      const res = await parkingService.getActiveSessions();
      setData(res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const handleCheckIn = async (values: any) => {
    try {
      const payload: Record<string, any> = {
        [identifierType]: values.identifierValue.trim(),
      };
      if (values.vehiclePlate) payload.vehiclePlate = values.vehiclePlate.trim();

      await parkingService.checkIn(payload as any);
      notify.success(MESSAGES.PARKING_CHECKIN_SUCCESS);
      setCheckInModalOpen(false);
      form.resetFields();
      fetchActiveSessions();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  // Helper to compute duration string
  const formatDuration = (checkInAt: string): string => {
    const diffMin = Math.max(0, dayjs().diff(dayjs(checkInAt), 'minute'));
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    if (hours === 0) return `${mins} phút`;
    return `${hours} giờ ${mins} phút`;
  };

  // Calculate estimated fee matching backend formula (2000 VND/hour, min 1 hour)
  const calculateEstimatedFee = (checkInAt: string): number => {
    const diffMs = Math.max(0, dayjs().diff(dayjs(checkInAt)));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const hours = diffHours <= 0 ? 1 : diffHours;
    return hours * 2000;
  };

  const openCheckoutConfirm = (record: ParkingSession) => {
    if (!record.card?.cardCode) {
      notify.error(MESSAGES.PARKING_CARD_REQUIRED);
      return;
    }
    setSessionToCheckout(record);
    setConfirmModalOpen(true);
  };

  const handleConfirmCheckOut = async () => {
    if (!sessionToCheckout || !sessionToCheckout.card?.cardCode) return;
    setCheckoutLoading(true);
    try {
      const updated = await parkingService.checkOut({
        cardCode: sessionToCheckout.card.cardCode,
      });
      notify.success(MESSAGES.PARKING_CHECKOUT_SUCCESS);
      setConfirmModalOpen(false);
      setSessionToCheckout(null);
      setCheckOutSession(updated);
      setCheckOutResultOpen(true);
      fetchActiveSessions();
    } catch (err: any) {
      notify.serverError(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const columns: ColumnsType<ParkingSession> = [
    {
      title: 'Biển số xe',
      dataIndex: 'vehiclePlate',
      key: 'vehiclePlate',
      render: (plate?: string) => (plate ? <Text strong>{plate}</Text> : '-'),
    },
    {
      title: 'Mã thẻ',
      key: 'card',
      render: (_, record) => <Text code>{record.card?.cardCode || '-'}</Text>,
    },
    {
      title: 'Học sinh / Chủ thẻ',
      key: 'owner',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.owner?.fullName || '-'}</Text>
          {record.owner?.studentCode && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Mã HS: {record.owner.studentCode}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Giờ vào',
      dataIndex: 'checkInAt',
      key: 'checkInAt',
      render: (dt: string) => formatDateTime(dt),
    },
    {
      title: 'Thời gian đã gửi',
      key: 'duration',
      render: (_, record) => (
        <Text style={{ color: '#0F766E' }}>{formatDuration(record.checkInAt)}</Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          danger
          size="small"
          icon={<LogoutOutlined />}
          onClick={() => openCheckoutConfirm(record)}
        >
          Cho xe ra & tính phí
        </Button>
      ),
    },
  ];

  return (
    <PageShell
      title="Quản lý bãi giữ xe thông minh"
      description="Giám sát phương tiện đang gửi trong bãi, tự động ghi nhận thời gian gửi và tính phí gửi xe"
      extraAction={
        <Button
          type="primary"
          icon={<LoginOutlined />}
          onClick={() => {
            form.resetFields();
            setCheckInModalOpen(true);
          }}
        >
          Cho xe vào bãi
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        size="middle"
        bordered={false}
        loading={loading}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description={MESSAGES.EMPTY_PARKING} /> }}
        pagination={{
          pageSize: 20,
          showTotal: (total) => `Tổng ${total} xe đang trong bãi`,
        }}
      />

      {/* Check In Modal */}
      <Modal
        title="Ghi nhận phương tiện vào bãi"
        open={checkInModalOpen}
        onCancel={() => setCheckInModalOpen(false)}
        onOk={() => form.submit()}
        okText={MESSAGES.CONFIRM_OK_TEXT}
        cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCheckIn}>
          <Form.Item label="Phương thức nhận diện thẻ" required>
            <Select
              value={identifierType}
              onChange={(val) => setIdentifierType(val)}
              options={[
                { value: 'cardCode', label: 'Mã thẻ (cardCode)' },
                { value: 'qrToken', label: 'Mã QR Token' },
                { value: 'nfcUid', label: 'Mã NFC UID' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="identifierValue"
            label="Mã định danh thẻ"
            rules={[{ required: true, message: MESSAGES.SCAN_CARD_REQUIRED }]}
          >
            <Input placeholder="Ví dụ: CARD-STU001" />
          </Form.Item>

          <Form.Item name="vehiclePlate" label="Biển số xe (Tùy chọn)">
            <Input placeholder="Ví dụ: 29A-123.45" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Check Out Confirmation Modal (4.10 Multi-step) */}
      <Modal
        title={MESSAGES.CONFIRM_PARKING_CHECKOUT_TITLE}
        open={confirmModalOpen}
        onCancel={() => {
          setConfirmModalOpen(false);
          setSessionToCheckout(null);
        }}
        onOk={handleConfirmCheckOut}
        okText={MESSAGES.CONFIRM_OK_TEXT}
        cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
        confirmLoading={checkoutLoading}
        okButtonProps={{ danger: true }}
      >
        {sessionToCheckout && (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Text type="secondary">{MESSAGES.CONFIRM_PARKING_CHECKOUT_CONTENT}</Text>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Mã thẻ">
                <Text code>{sessionToCheckout.card?.cardCode || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Chủ thẻ">
                {sessionToCheckout.owner?.fullName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Biển số">
                {sessionToCheckout.vehiclePlate || 'Không ghi nhận'}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian vào">
                {formatDateTime(sessionToCheckout.checkInAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian đã gửi">
                {formatDuration(sessionToCheckout.checkInAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Phí dự kiến">
                <Text strong style={{ color: '#DC2626', fontSize: 16 }}>
                  {formatVND(calculateEstimatedFee(sessionToCheckout.checkInAt))}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>

      {/* Check Out Result Modal */}
      <Modal
        title="Biên lai lấy xe ra khỏi bãi"
        open={checkOutResultOpen}
        onCancel={() => setCheckOutResultOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setCheckOutResultOpen(false)}>
            Đóng
          </Button>,
        ]}
      >
        {checkOutSession && (
          <Result
            status="success"
            title={`Phí gửi xe: ${formatVND(checkOutSession.fee)}`}
            subTitle="Phương tiện đã được xác nhận thanh toán phí và rời bãi thành công"
            extra={
              <Descriptions size="small" column={1} bordered style={{ textAlign: 'left' }}>
                <Descriptions.Item label="Mã thẻ">
                  {checkOutSession.card?.cardCode || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Biển số">
                  {checkOutSession.vehiclePlate || 'Không ghi nhận'}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian vào">
                  {formatDateTime(checkOutSession.checkInAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian ra">
                  {formatDateTime(checkOutSession.checkOutAt)}
                </Descriptions.Item>
              </Descriptions>
            }
          />
        )}
      </Modal>
    </PageShell>
  );
};
