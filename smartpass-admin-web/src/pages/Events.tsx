import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Progress,
  Tag,
  Space,
  Empty,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageShell } from '../components/PageShell';
import { eventService, EventItem } from '../api/services';
import { MESSAGES } from '../constants/messages';
import { notify } from '../lib/notify';
import { formatDateTime } from '../utils/format';

const { Text } = Typography;

export const Events: React.FC = () => {
  const [data, setData] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Create Event Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventService.getEvents();
      setData(res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (values: any) => {
    if (dayjs(values.endAt).isBefore(dayjs(values.startAt)) || dayjs(values.endAt).isSame(dayjs(values.startAt))) {
      notify.warning(MESSAGES.EVENT_END_BEFORE_START);
      return;
    }

    try {
      await eventService.createEvent({
        title: values.title.trim(),
        description: values.description ? values.description.trim() : undefined,
        location: values.location ? values.location.trim() : undefined,
        startAt: values.startAt.toISOString(),
        endAt: values.endAt.toISOString(),
        capacity: values.capacity,
      });
      notify.success(MESSAGES.EVENT_CREATE_SUCCESS);
      setCreateModalOpen(false);
      form.resetFields();
      fetchEvents();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const columns: ColumnsType<EventItem> = [
    {
      title: 'Tên sự kiện',
      dataIndex: 'title',
      key: 'title',
      render: (t: string) => <Text strong>{t}</Text>,
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
      render: (loc?: string) => loc || '-',
    },
    {
      title: 'Thời gian bắt đầu',
      dataIndex: 'startAt',
      key: 'startAt',
      render: (dt: string) => formatDateTime(dt),
    },
    {
      title: 'Thời gian kết thúc',
      dataIndex: 'endAt',
      key: 'endAt',
      render: (dt: string) => formatDateTime(dt),
    },
    {
      title: 'Số lượng đăng ký',
      key: 'occupancy',
      render: (_, record) => {
        const percent = Math.min(
          100,
          Math.round(((record.registeredCount || 0) / (record.capacity || 1)) * 100)
        );
        const isFull = (record.registeredCount || 0) >= record.capacity;

        return (
          <Space direction="vertical" style={{ width: 140 }} size={2}>
            <Progress
              percent={percent}
              size="small"
              status={isFull ? 'exception' : 'active'}
              showInfo={false}
            />
            <Space>
              <Text style={{ fontSize: 12 }}>
                {record.registeredCount || 0}/{record.capacity}
              </Text>
              {isFull && <Tag color="red">Đã đầy</Tag>}
            </Space>
          </Space>
        );
      },
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc?: string) => desc || '-',
    },
  ];

  return (
    <PageShell
      title="Quản lý sự kiện học đường"
      description="Tổ chức sự kiện hội thảo, hoạt động ngoại khóa với cơ chế giới hạn sức chứa và đăng ký trực tuyến"
      extraAction={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setCreateModalOpen(true);
          }}
        >
          Tạo sự kiện
        </Button>
      }
    >
      {/* 
        Note: The backend endpoint GET /api/events is not paginated, returns all upcoming events
        sorted by startAt ascending. Therefore, client Table pagination={false} is used here as requested.
      */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        size="middle"
        bordered={false}
        loading={loading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description={MESSAGES.EMPTY_EVENTS} /> }}
      />

      {/* Create Event Modal */}
      <Modal
        title="Tạo sự kiện mới"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => form.submit()}
        okText="Tạo sự kiện"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateEvent}>
          <Form.Item
            name="title"
            label="Tên sự kiện"
            rules={[{ required: true, message: 'Vui lòng nhập tên sự kiện' }]}
          >
            <Input placeholder="Ví dụ: Hội thảo Định hướng Nghề nghiệp Công nghệ" />
          </Form.Item>

          <Form.Item name="location" label="Địa điểm tổ chức">
            <Input placeholder="Ví dụ: Hội trường lớn A" />
          </Form.Item>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item
              name="startAt"
              label="Bắt đầu"
              initialValue={dayjs().add(1, 'day').set('hour', 9).set('minute', 0)}
              rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu' }]}
            >
              <DatePicker showTime format="DD/MM/YYYY HH:mm" />
            </Form.Item>

            <Form.Item
              name="endAt"
              label="Kết thúc"
              initialValue={dayjs().add(1, 'day').set('hour', 11).set('minute', 30)}
              rules={[{ required: true, message: 'Vui lòng chọn thời gian kết thúc' }]}
            >
              <DatePicker showTime format="DD/MM/YYYY HH:mm" />
            </Form.Item>
          </Space>

          <Form.Item
            name="capacity"
            label="Sức chứa (Số người tối đa)"
            initialValue={50}
            rules={[
              { required: true, message: 'Vui lòng nhập số người tối đa' },
              { type: 'number', min: 1, message: MESSAGES.EVENT_CAPACITY_MIN },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="description" label="Mô tả sự kiện">
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết nội dung sự kiện..." />
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

