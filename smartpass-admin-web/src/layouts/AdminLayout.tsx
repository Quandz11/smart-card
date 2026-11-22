import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Typography,
  Space,
  Dropdown,
  Modal,
  Form,
  Input,
  Breadcrumb,
  Button,
  Card,
  Alert,
  Badge,
  Popover,
  List,
} from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  IdcardOutlined,
  FileSearchOutlined,
  CheckSquareOutlined,
  BookOutlined,
  WalletOutlined,
  CarOutlined,
  HomeOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  BellOutlined,
  SafetyOutlined,
  QrcodeOutlined,
  ApiOutlined,
  UserOutlined,
  KeyOutlined,
  LogoutOutlined,
  DownOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatusTag } from '../components/StatusTag';
import { authService, walletService, otpService, OtpChallenge, notificationService, NotificationItem } from '../api/services';
import { initSocket, disconnectSocket, subscribeToNotifications, subscribeToUnread } from '../lib/socket';
import { notify } from '../lib/notify';
import { MESSAGES } from '../constants/messages';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

const ALL_MENU_ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: 'Tổng quan' },
  { key: '/users', icon: <TeamOutlined />, label: 'Người dùng' },
  { key: '/cards', icon: <IdcardOutlined />, label: 'Thẻ' },
  { key: '/logs', icon: <FileSearchOutlined />, label: 'Log ra/vào' },
  { key: '/attendance', icon: <CheckSquareOutlined />, label: 'Điểm danh' },
  { key: '/library', icon: <BookOutlined />, label: 'Thư viện' },
  { key: '/wallet', icon: <WalletOutlined />, label: 'Căn tin & ví' },
  { key: '/parking', icon: <CarOutlined />, label: 'Gửi xe' },
  { key: '/room-bookings', icon: <HomeOutlined />, label: 'Đặt phòng' },
  { key: '/events', icon: <CalendarOutlined />, label: 'Sự kiện' },
  { key: '/schedules', icon: <ScheduleOutlined />, label: 'Lịch học' },
  { key: '/notifications', icon: <BellOutlined />, label: 'Thông báo' },
  { key: '/emergency', icon: <SafetyOutlined />, label: 'Thẻ khẩn cấp' },
  { key: '/qr', icon: <QrcodeOutlined />, label: 'Mã QR' },
  { key: '/settings', icon: <ApiOutlined />, label: 'Kết nối API' },
];

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [form] = Form.useForm();

  // Smart OTP modal state
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [activeOtp, setActiveOtp] = useState<OtpChallenge | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  // PIN modal state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinForm] = Form.useForm();

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, mustSetPin, setMustSetPin, refreshUser } = useAuth();

  // Notification state
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [recentNotifs, setRecentNotifs] = useState<NotificationItem[]>([]);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadNotifCount(res.count || 0);
    } catch {
      // silent
    }
  };

  const fetchRecentNotifs = async () => {
    try {
      const res = await notificationService.getMyNotifications({ limit: 5 });
      const items = Array.isArray(res) ? res : (res?.items || []);
      setRecentNotifs(items.slice(0, 5));
    } catch {
      // silent
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('smartpass_admin_token');
    if (!token) return;

    fetchUnreadCount();
    fetchRecentNotifs();

    initSocket(token, (route) => {
      if (route) navigate(route);
    });

    const unsubNotif = subscribeToNotifications((notif) => {
      setUnreadNotifCount((prev) => prev + 1);
      setRecentNotifs((prev) => [notif, ...prev.slice(0, 4)]);
    });

    const unsubUnread = subscribeToUnread((count) => {
      if (count >= 0) {
        setUnreadNotifCount(count);
      } else {
        fetchUnreadCount();
      }
    });

    return () => {
      unsubNotif();
      unsubUnread();
      disconnectSocket();
    };
  }, [navigate]);

  // Role filtering
  const userRole = user?.role || 'admin';
  const visibleMenuItems = ALL_MENU_ITEMS.filter((item) => {
    if (userRole === 'admin') return true;
    if (userRole === 'librarian') return item.key === '/library';
    if (userRole === 'parking_staff') return item.key === '/parking';
    if (userRole === 'canteen_staff') return item.key === '/wallet';
    return false;
  });

  // Guard routing based on role
  useEffect(() => {
    if (userRole === 'librarian' && location.pathname !== '/library') {
      navigate('/library', { replace: true });
    } else if (userRole === 'parking_staff' && location.pathname !== '/parking') {
      navigate('/parking', { replace: true });
    } else if (userRole === 'canteen_staff' && location.pathname !== '/wallet') {
      navigate('/wallet', { replace: true });
    }
  }, [userRole, location.pathname, navigate]);

  const selectedKey = location.pathname;
  const currentMenuItem = ALL_MENU_ITEMS.find((item) => item.key === selectedKey);

  const fetchActiveOtp = async () => {
    setOtpLoading(true);
    try {
      const res = await otpService.getActiveOtp();
      setActiveOtp(res.challenge);
    } catch {
      setActiveOtp(null);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOpenOtpModal = () => {
    fetchActiveOtp();
    setOtpModalOpen(true);
  };

  const handleChangePassword = async (values: any) => {
    try {
      setChangePasswordLoading(true);
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      notify.success(MESSAGES.AUTH_CHANGE_PASSWORD_SUCCESS);
      setPasswordModalOpen(false);
      form.resetFields();
    } catch (err: any) {
      notify.serverError(err);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleSavePin = async (values: any) => {
    try {
      setPinLoading(true);
      if (mustSetPin || !user?.pinSetAt) {
        await walletService.setupPin({
          pin: values.newPin,
          confirmPin: values.confirmPin,
        });
        notify.success(MESSAGES.PIN_SETUP_SUCCESS);
      } else {
        await walletService.changePin({
          currentPin: values.currentPin,
          newPin: values.newPin,
          confirmPin: values.confirmPin,
        });
        notify.success(MESSAGES.PIN_CHANGE_SUCCESS);
      }
      setMustSetPin(false);
      setPinModalOpen(false);
      pinForm.resetFields();
      await refreshUser();
    } catch (err: any) {
      notify.serverError(err);
    } finally {
      setPinLoading(false);
    }
  };

  const userMenuItems = [
    {
      key: 'setup-pin',
      icon: <SafetyCertificateOutlined />,
      label: user?.pinSetAt ? 'Đổi mã PIN ví' : 'Thiết lập mã PIN ví',
      onClick: () => {
        pinForm.resetFields();
        setPinModalOpen(true);
      },
    },
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => {
        form.resetFields();
        setPasswordModalOpen(true);
      },
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => {
        logout();
        notify.success(MESSAGES.AUTH_LOGOUT_SUCCESS);
        navigate('/login');
      },
    },
  ];

  const notificationPopoverContent = (
    <div style={{ width: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong>Thông báo mới</Text>
        <Button
          type="link"
          size="small"
          onClick={() => {
            setNotifPopoverOpen(false);
            navigate('/notifications');
          }}
        >
          Xem tất cả
        </Button>
      </div>
      <List
        size="small"
        dataSource={recentNotifs}
        locale={{ emptyText: 'Không có thông báo mới' }}
        renderItem={(item) => (
          <List.Item
            style={{
              cursor: 'pointer',
              backgroundColor: item.isRead ? 'transparent' : 'rgba(15, 118, 110, 0.05)',
              padding: '8px 12px',
              borderRadius: 4,
            }}
            onClick={() => {
              setNotifPopoverOpen(false);
              if (item.actionRoute) {
                navigate(item.actionRoute);
              } else {
                navigate('/notifications');
              }
            }}
          >
            <List.Item.Meta
              title={
                <Text strong={!item.isRead} style={{ fontSize: 13 }}>
                  {item.title}
                </Text>
              }
              description={
                <Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: 280 }}>
                  {item.body}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sider Menu */}
      <Sider
        theme="dark"
        width={232}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            gap: 12,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <IdcardOutlined style={{ fontSize: 24, color: '#0F766E' }} />
          {!collapsed && (
            <Text
              style={{
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: 0.5,
              }}
            >
              SmartPass Admin
            </Text>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={visibleMenuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>

      {/* Main Layout Area */}
      <Layout>
        {/* White Header */}
        <Header
          style={{
            background: '#FFFFFF',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            height: 64,
          }}
        >
          {/* Breadcrumb Left */}
          <Breadcrumb
            items={[
              { title: 'Quản trị' },
              { title: currentMenuItem?.label || 'Tổng quan' },
            ]}
          />

          {/* Header Action Tools */}
          <Space size={16}>
            <Button
              icon={<SafetyCertificateOutlined style={{ color: '#0F766E' }} />}
              onClick={handleOpenOtpModal}
            >
              Smart OTP
            </Button>

            {/* Notification Bell */}
            <Popover
              content={notificationPopoverContent}
              trigger="click"
              open={notifPopoverOpen}
              onOpenChange={setNotifPopoverOpen}
              placement="bottomRight"
            >
              <Badge count={unreadNotifCount} size="small" offset={[-2, 4]}>
                <Button
                  shape="circle"
                  icon={<BellOutlined style={{ fontSize: 16 }} />}
                  onClick={() => fetchRecentNotifs()}
                />
              </Badge>
            </Popover>

            {/* User Menu Right */}
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <UserOutlined style={{ fontSize: 16, color: '#0F766E' }} />
                <Text strong>{user?.fullName || 'Nhân viên'}</Text>
                <StatusTag type="role" value={user?.role || 'admin'} />
                <DownOutlined style={{ fontSize: 10, color: '#9CA3AF' }} />
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content Area */}
        <Content
          style={{
            background: '#F5F7F8',
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {mustSetPin && (
            <Alert
              message="Yêu cầu thiết lập mã PIN ví"
              description="Bạn chưa thiết lập mã PIN ví 6 chữ số. Mã PIN là bắt buộc để xác nhận các giao dịch tài chính và nạp tiền."
              type="warning"
              showIcon
              action={
                <Button type="primary" onClick={() => setPinModalOpen(true)}>
                  Thiết lập ngay
                </Button>
              }
              style={{ marginBottom: 16 }}
            />
          )}
          <Outlet />
        </Content>
      </Layout>

      {/* Smart OTP Modal */}
      <Modal
        title="Smart OTP (Xác thực thiết bị)"
        open={otpModalOpen}
        onCancel={() => setOtpModalOpen(false)}
        footer={[
          <Button key="refresh" onClick={fetchActiveOtp} loading={otpLoading}>
            Làm mới
          </Button>,
          <Button key="close" type="primary" onClick={() => setOtpModalOpen(false)}>
            Đóng
          </Button>,
        ]}
      >
        {activeOtp ? (
          <Card style={{ textAlign: 'center', background: '#F0FDFA', borderColor: '#CCFBF1' }}>
            <Text type="secondary">Mục đích xác thực</Text>
            <Title level={4} style={{ color: '#0F766E', margin: '4px 0 16px' }}>
              {activeOtp.purpose === 'RESET_PIN' && 'Đặt lại mã PIN ví'}
              {activeOtp.purpose === 'CHANGE_PIN' && 'Đổi mã PIN ví'}
              {activeOtp.purpose === 'STAFF_CASH_CONFIRM' && 'Xác nhận thu tiền mặt tại quầy'}
            </Title>
            <Text type="secondary">Mã Smart OTP (Hiệu lực: {activeOtp.remainingSeconds}s)</Text>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: 8,
                color: '#0F766E',
                margin: '12px 0',
                padding: '12px',
                background: '#FFFFFF',
                borderRadius: 8,
                border: '1px dashed #0D9488',
              }}
            >
              {activeOtp.deliveredCode || '••••••'}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Mã dùng 1 lần trong 5 phút. Không chia sẻ mã này cho người khác.
            </Text>
          </Card>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <SafetyCertificateOutlined style={{ fontSize: 48, color: '#9CA3AF', marginBottom: 12 }} />
            <br />
            <Text type="secondary">Hiện không có yêu cầu Smart OTP nào đang chờ xác thực.</Text>
          </div>
        )}
      </Modal>

      {/* PIN Setup / Change Modal */}
      <Modal
        title={mustSetPin || !user?.pinSetAt ? 'Thiết lập mã PIN ví 6 số' : 'Đổi mã PIN ví'}
        open={pinModalOpen}
        onCancel={() => {
          if (!mustSetPin) setPinModalOpen(false);
        }}
        closable={!mustSetPin}
        maskClosable={!mustSetPin}
        onOk={() => pinForm.submit()}
        confirmLoading={pinLoading}
        okText="Lưu mã PIN"
        cancelText={mustSetPin ? undefined : 'Hủy'}
        destroyOnClose
      >
        <Form form={pinForm} layout="vertical" onFinish={handleSavePin}>
          {!mustSetPin && user?.pinSetAt && (
            <Form.Item
              name="currentPin"
              label="Mã PIN hiện tại"
              rules={[
                { required: true, message: 'Vui lòng nhập mã PIN hiện tại' },
                { len: 6, message: 'Mã PIN gồm chính xác 6 chữ số' },
              ]}
            >
              <Input.Password maxLength={6} placeholder="Nhập PIN cũ 6 số" />
            </Form.Item>
          )}
          <Form.Item
            name="newPin"
            label="Mã PIN mới (6 chữ số)"
            rules={[
              { required: true, message: 'Vui lòng nhập mã PIN mới' },
              { len: 6, message: 'Mã PIN gồm chính xác 6 chữ số' },
              { pattern: /^[0-9]{6}$/, message: 'Mã PIN chỉ bao gồm các chữ số' },
            ]}
          >
            <Input.Password maxLength={6} placeholder="Nhập PIN 6 số (không dùng số dễ đoán)" />
          </Form.Item>
          <Form.Item
            name="confirmPin"
            label="Xác nhận mã PIN mới"
            dependencies={['newPin']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận lại mã PIN mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPin') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mã PIN xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password maxLength={6} placeholder="Nhập lại PIN 6 số" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title="Đổi mật khẩu"
        open={passwordModalOpen}
        onCancel={() => setPasswordModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={changePasswordLoading}
        okText="Lưu mật khẩu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu hiện tại" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận lại mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};


