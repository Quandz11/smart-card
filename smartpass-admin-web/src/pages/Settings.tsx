import React, { useState } from 'react';
import { Card, Button, Typography, Space, Descriptions, Result, Alert } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { PageShell } from '../components/PageShell';
import { rootService } from '../api/services';
import { http as apiClient } from '../lib/http';
import { useAuth } from '../context/AuthContext';
import { StatusTag } from '../components/StatusTag';
import { formatDateTime } from '../utils/format';

const { Text } = Typography;

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);

  const apiBaseUrl = apiClient.defaults.baseURL || '-';

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await rootService.checkHealth();
      setTestResult({
        success: true,
        message: res.message || 'Kết nối thành công tới SmartPass API',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Không thể kết nối tới máy chủ backend',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <PageShell
      title="Kết nối API & Thông tin hệ thống"
      description="Kiểm tra trạng thái kết nối mạng giữa Admin Web UI và Node.js REST API Backend"
    >
      <Space direction="vertical" style={{ width: '100%' }} size={20}>
        {/* API Endpoint Configuration Card */}
        <Card title="Cấu hình máy chủ API Backend" size="small">
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="API Base URL (VITE_API_BASE_URL)">
              <Text code copyable style={{ fontSize: 14 }}>
                {apiBaseUrl}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Thao tác kiểm tra">
              <Button
                type="primary"
                icon={<ApiOutlined />}
                loading={testing}
                onClick={handleTestConnection}
              >
                Kiểm tra kết nối tới Backend (GET /)
              </Button>
            </Descriptions.Item>
          </Descriptions>

          {testResult && (
            <div style={{ marginTop: 16 }}>
              {testResult.success ? (
                <Result
                  status="success"
                  title="Kết nối API hoạt động bình thường"
                  subTitle={
                    <Space direction="vertical" size={2}>
                      <Text>{testResult.message}</Text>
                      {testResult.timestamp && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Thời gian phản hồi: {formatDateTime(testResult.timestamp)}
                        </Text>
                      )}
                    </Space>
                  }
                />
              ) : (
                <Result
                  status="error"
                  title="Lỗi kết nối tới máy chủ"
                  subTitle={<Text type="danger">{testResult.message}</Text>}
                  extra={
                    <Alert
                      message="Hướng dẫn khắc phục"
                      description="Vui lòng kiểm tra lại backend đã được khởi động chưa bằng lệnh: cd smartpass-backend && npm start"
                      type="warning"
                      showIcon
                      style={{ textAlign: 'left', maxWidth: 480, margin: '0 auto' }}
                    />
                  }
                />
              )}
            </div>
          )}
        </Card>

        {/* Current Admin Profile Card */}
        <Card title="Thông tin phiên làm việc quản trị viên (GET /api/auth/me)" size="small">
          {user ? (
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle">
              <Descriptions.Item label="Họ và tên">{user.fullName}</Descriptions.Item>
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                <StatusTag type="role" value={user.role} />
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái tài khoản">
                <StatusTag type="account" value={user.isActive} />
              </Descriptions.Item>
              <Descriptions.Item label="Mã người dùng (ObjectId)">
                <Text code copyable>{user._id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo tài khoản">
                {formatDateTime(user.createdAt)}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Text type="secondary">Chưa tải được thông tin phiên làm việc</Text>
          )}
        </Card>
      </Space>
    </PageShell>
  );
};
