import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Empty,
  Typography,
} from 'antd';
import { SendOutlined, CheckOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageShell } from '../components/PageShell';
import {
  notificationService,
  userService,
  NotificationItem,
  User,
} from '../api/services';
import { NOTIFICATION_AUDIENCE_MAP } from '../constants/labels';
import { MESSAGES } from '../constants/messages';
import { notify } from '../lib/notify';
import { formatDateTime } from '../utils/format';

const { Text } = Typography;

export const Notifications: React.FC = () => {
  const [data, setData] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [audienceType, setAudienceType] = useState<'all' | 'class' | 'individual'>('all');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [form] = Form.useForm();

  const fetchMyNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getMyNotifications();
      setData(res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyNotifications();
  }, []);

  const searchUsers = async (q: string) => {
    setUsersLoading(true);
    try {
      const res = await userService.getUsers({ q, limit: 20 });
      setUsersList(res.items);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await notificationService.createNotification({
        title: values.title.trim(),
        body: values.body.trim(),
        audience: values.audience,
        className: values.audience === 'class' ? values.className?.trim() : undefined,
        receiver: values.audience === 'individual' ? values.receiver : undefined,
      });
      notify.success(MESSAGES.NOTIF_SEND_SUCCESS);
      setCreateModalOpen(false);
      form.resetFields();
      setAudienceType('all');
      fetchMyNotifications();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      notify.success(MESSAGES.NOTIF_MARK_READ_SUCCESS);
      fetchMyNotifications();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const columns: ColumnsType<NotificationItem> = [
    {
      title: 'Tiêu đề thông báo',
      dataIndex: 'title',
      key: 'title',
      render: (t: string) => <Text strong>{t}</Text>,
    },
    {
      title: 'Nội dung',
      dataIndex: 'body',
      key: 'body',
    },
    {
      title: 'Phạm vi',
      dataIndex: 'audience',
      key: 'audience',
      render: (aud: string) => (
        <Tag color="cyan">{NOTIFICATION_AUDIENCE_MAP[aud] || aud}</Tag>
      ),
    },
    {
      title: 'Thời gian nhận',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dt: string) => formatDateTime(dt),
    },
    {
      title: 'Trạng thái',
      key: 'isRead',
      render: (_, record) => {
        if (record.isRead) {
          return <Tag color="default">Đã đọc</Tag>;
        }
        return <Tag color="processing">Chưa đọc</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        if (!record.isRead) {
          return (
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleMarkAsRead(record._id)}
            >
              Đánh dấu đã đọc
            </Button>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
  ];

  return (
    <PageShell
      title="Thông báo học đường"
      description="Phát sóng thông báo toàn trường, gửi thông báo theo từng lớp hoặc đích danh từng học sinh"
      extraAction={
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => {
            form.resetFields();
            setAudienceType('all');
            searchUsers('');
            setCreateModalOpen(true);
          }}
        >
          Tạo thông báo mới
        </Button>
      }
    >
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ fontSize: 16 }}>
          Thông báo tôi nhận được
        </Text>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        size="middle"
        bordered={false}
        loading={loading}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description={MESSAGES.EMPTY_NOTIFICATIONS} /> }}
        pagination={{
          pageSize: 20,
          showTotal: (total) => `Tổng ${total} thông báo`,
        }}
      />

      {/* Create Notification Modal */}
      <Modal
        title="Phát thông báo học đường"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => form.submit()}
        okText="Gửi thông báo"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề thông báo' }]}
          >
            <Input placeholder="Ví dụ: Thông báo nghỉ lễ 30/4 - 1/5" />
          </Form.Item>

          <Form.Item
            name="body"
            label="Nội dung thông báo"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập chi tiết nội dung thông báo..." />
          </Form.Item>

          <Form.Item
            name="audience"
            label="Phạm vi gửi"
            initialValue="all"
            rules={[{ required: true, message: 'Vui lòng chọn phạm vi' }]}
          >
            <Select
              onChange={(val) => setAudienceType(val)}
              options={[
                { value: 'all', label: 'Toàn trường (all)' },
                { value: 'class', label: 'Theo lớp học (class)' },
                { value: 'individual', label: 'Cá nhân cụ thể (individual)' },
              ]}
            />
          </Form.Item>

          {audienceType === 'class' && (
            <Form.Item
              name="className"
              label="Tên lớp nhận thông báo"
              rules={[{ required: true, message: 'Vui lòng nhập tên lớp' }]}
            >
              <Input placeholder="Ví dụ: SE101" />
            </Form.Item>
          )}

          {audienceType === 'individual' && (
            <Form.Item
              name="receiver"
              label="Người nhận đích danh"
              rules={[{ required: true, message: 'Vui lòng chọn người nhận' }]}
            >
              <Select
                showSearch
                placeholder="Tìm theo họ tên, email hoặc mã HS..."
                filterOption={false}
                onSearch={searchUsers}
                loading={usersLoading}
                options={usersList.map((u) => ({
                  value: u._id,
                  label: `${u.fullName} (${u.email}${u.studentCode ? ' - ' + u.studentCode : ''})`,
                }))}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </PageShell>
  );
};
