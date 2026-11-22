import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Layout, Space } from 'antd';
import { LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { notify } from '../lib/notify';
import { MESSAGES } from '../constants/messages';

const { Title, Text } = Typography;

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      const res = await authService.login(values);
      if (res.user.role === 'student') {
        notify.error(MESSAGES.AUTH_NOT_STAFF);
        return;
      }
      login(res.token, res.user, res.mustSetPin);
      notify.success(MESSAGES.AUTH_LOGIN_SUCCESS);
      if (res.user.role === 'librarian') {
        navigate('/library');
      } else if (res.user.role === 'parking_staff') {
        navigate('/parking');
      } else if (res.user.role === 'canteen_staff') {
        navigate('/wallet');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      notify.serverError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: '#F5F7F8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: '#0F766E15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IdcardOutlined style={{ fontSize: 32, color: '#0F766E' }} />
          </div>
          <Title level={3} style={{ margin: 0, color: '#0F766E' }}>
            SmartPass Admin
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Cổng quản trị hệ thống thẻ học đường số
          </Text>
        </Space>

        <Form layout="vertical" onFinish={handleLogin} requiredMark={false} size="large">
          <Form.Item
            name="email"
            label="Email quản trị"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không đúng định dạng' },
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: '#9CA3AF' }} />} placeholder="admin@smartpass.edu" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="Nhập mật khẩu"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 28, marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44 }}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Layout>
  );
};

