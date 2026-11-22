import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Space,
  Popconfirm,
  Empty,
  Typography,
} from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageShell } from '../components/PageShell';
import { StatusTag } from '../components/StatusTag';
import { userService, User } from '../api/services';
import { ROLE_MAP } from '../constants/labels';
import { MESSAGES } from '../constants/messages';
import { notify } from '../lib/notify';
import { formatDateTime } from '../utils/format';

const { Search } = Input;
const { Text } = Typography;

export const Users: React.FC = () => {
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [roleForm] = Form.useForm();

  const fetchUsers = async (p = page, l = limit, q = searchQuery) => {
    setLoading(true);
    try {
      const res = await userService.getUsers({
        page: p,
        limit: l,
        q: q ? q.trim() : undefined,
      });
      setData(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, limit, searchQuery);
  }, [page, limit]);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    setPage(1);
    fetchUsers(1, limit, val);
  };

  // 1. Create User
  const handleCreateUser = async (values: any) => {
    try {
      await userService.createUser(values);
      notify.success(MESSAGES.USER_CREATE_SUCCESS);
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchUsers();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  // 2. Edit Profile
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    editForm.setFieldsValue({
      fullName: user.fullName,
      phone: user.phone || '',
      studentCode: user.studentCode || '',
      className: user.className || '',
    });
    setEditModalOpen(true);
  };

  const handleEditUser = async (values: any) => {
    if (!selectedUser) return;
    try {
      await userService.updateUser(selectedUser._id, values);
      notify.success(MESSAGES.USER_UPDATE_SUCCESS);
      setEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  // 3. Change Role
  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    roleForm.setFieldsValue({ role: user.role });
    setRoleModalOpen(true);
  };

  const handleRoleChange = async (values: any) => {
    if (!selectedUser) return;
    try {
      await userService.updateRole(selectedUser._id, values.role);
      notify.success(MESSAGES.USER_ROLE_UPDATE_SUCCESS);
      setRoleModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  // 4. Deactivate
  const handleDeactivate = async (id: string) => {
    try {
      await userService.deactivateUser(id);
      notify.success(MESSAGES.USER_DEACTIVATE_SUCCESS);
      fetchUsers();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  // 5. Delete
  const handleDelete = async (id: string) => {
    try {
      await userService.deleteUser(id);
      notify.success(MESSAGES.USER_DELETE_SUCCESS);
      fetchUsers();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Mã học sinh',
      dataIndex: 'studentCode',
      key: 'studentCode',
      render: (code?: string) => code || '-',
    },
    {
      title: 'Lớp',
      dataIndex: 'className',
      key: 'className',
      render: (cls?: string) => cls || '-',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <StatusTag type="role" value={role} />,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => <StatusTag type="account" value={isActive} />,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dt: string) => formatDateTime(dt),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          >
            Sửa
          </Button>
          <Button
            type="text"
            icon={<SafetyCertificateOutlined />}
            size="small"
            onClick={() => openRoleModal(record)}
          >
            Đổi vai trò
          </Button>
          {record.isActive && (
            <Popconfirm
              title={MESSAGES.CONFIRM_USER_DEACTIVATE_TITLE}
              description={MESSAGES.CONFIRM_USER_DEACTIVATE_CONTENT}
              onConfirm={() => handleDeactivate(record._id)}
              okText={MESSAGES.CONFIRM_OK_TEXT}
              cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<StopOutlined />} size="small">
                Vô hiệu hoá
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title={MESSAGES.CONFIRM_USER_DELETE_TITLE}
            description={MESSAGES.CONFIRM_USER_DELETE_CONTENT}
            onConfirm={() => handleDelete(record._id)}
            okText={MESSAGES.CONFIRM_DANGER_OK_TEXT}
            cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small">
              Xoá
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageShell
      title="Quản lý người dùng"
      description="Quản lý danh sách tài khoản học sinh, giáo viên, thủ thư, nhân viên và phân quyền hệ thống"
      extraAction={
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => {
            createForm.resetFields();
            setCreateModalOpen(true);
          }}
        >
          Tạo người dùng
        </Button>
      }
      filterContent={
        <Space direction="horizontal" style={{ width: '100%' }}>
          <Search
            placeholder="Tìm theo họ tên, email hoặc mã học sinh..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            style={{ maxWidth: 360 }}
          />
        </Space>
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
        locale={{
          emptyText: (
            <Empty
              description={searchQuery ? MESSAGES.EMPTY_FILTER_RESULT : MESSAGES.EMPTY_USERS}
            />
          ),
        }}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (t) => `Tổng ${t} bản ghi`,
          onChange: (p, l) => {
            setPage(p);
            setLimit(l);
          },
        }}
      />

      {/* Modal 1: Create User */}
      <Modal
        title="Tạo người dùng mới"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        okText="Tạo mới"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateUser}>
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input placeholder="Ví dụ: Nguyễn Văn An" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="Ví dụ: an.nguyen@smartpass.edu" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu ban đầu" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Vai trò"
            initialValue="student"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select
              options={Object.entries(ROLE_MAP).map(([key, val]) => ({
                value: key,
                label: val.label,
              }))}
            />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input placeholder="Ví dụ: 0912345678" />
          </Form.Item>
          <Form.Item name="studentCode" label="Mã học sinh">
            <Input placeholder="Ví dụ: STU001" />
          </Form.Item>
          <Form.Item name="className" label="Lớp">
            <Input placeholder="Ví dụ: 10A1" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal 2: Edit User Profile */}
      <Modal
        title="Chỉnh sửa thông tin người dùng"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => editForm.submit()}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditUser}>
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="studentCode" label="Mã học sinh">
            <Input />
          </Form.Item>
          <Form.Item name="className" label="Lớp">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal 3: Change User Role */}
      <Modal
        title="Thay đổi vai trò người dùng"
        open={roleModalOpen}
        onCancel={() => setRoleModalOpen(false)}
        onOk={() => roleForm.submit()}
        okText="Cập nhật vai trò"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={roleForm} layout="vertical" onFinish={handleRoleChange}>
          <Form.Item
            name="role"
            label="Vai trò mới"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select
              options={Object.entries(ROLE_MAP).map(([key, val]) => ({
                value: key,
                label: val.label,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

