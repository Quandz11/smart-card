import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Checkbox,
  Switch,
  Button,
  Space,
  Typography,
  Popconfirm,
  Descriptions,
  Spin,
  Alert,
} from 'antd';
import {
  SafetyCertificateOutlined,
  ReloadOutlined,
  SaveOutlined,
  QrcodeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { PageShell } from '../components/PageShell';
import { emergencyService, EmergencyProfile } from '../api/services';
import { MESSAGES } from '../constants/messages';
import { notify } from '../lib/notify';
import { maskQrToken } from '../utils/format';

const { Text, Paragraph, Title } = Typography;

const ALLOWED_VISIBLE_FIELDS = [
  { label: 'Họ và tên', value: 'fullName' },
  { label: 'Tên người liên hệ khẩn cấp', value: 'emergencyContactName' },
  { label: 'SĐT người liên hệ khẩn cấp', value: 'emergencyContactPhone' },
  { label: 'Dị ứng y tế', value: 'allergies' },
  { label: 'Nhóm máu', value: 'bloodType' },
  { label: 'Thông tin bảo hiểm', value: 'insuranceInfo' },
];

export const Emergency: React.FC = () => {
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Public QR Check State (4.9 Inline Alert)
  const [checkQrToken, setCheckQrToken] = useState('');
  const [checkingQr, setCheckingQr] = useState(false);
  const [checkResult, setCheckResult] = useState<Record<string, any> | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await emergencyService.getMyProfile();
      setProfile(data);
      form.setFieldsValue({
        fullName: data.fullName || '',
        emergencyContactName: data.emergencyContactName || '',
        emergencyContactPhone: data.emergencyContactPhone || '',
        allergies: data.allergies || '',
        bloodType: data.bloodType || null,
        insuranceInfo: data.insuranceInfo || '',
        visibleFields: data.visibleFields || [],
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
      });
    } catch (err: any) {
      notify.serverError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (values: any) => {
    setSaving(true);
    try {
      const updated = await emergencyService.updateMyProfile({
        fullName: values.fullName ? values.fullName.trim() : undefined,
        emergencyContactName: values.emergencyContactName
          ? values.emergencyContactName.trim()
          : undefined,
        emergencyContactPhone: values.emergencyContactPhone
          ? values.emergencyContactPhone.trim()
          : undefined,
        allergies: values.allergies ? values.allergies.trim() : undefined,
        bloodType: values.bloodType || undefined,
        insuranceInfo: values.insuranceInfo ? values.insuranceInfo.trim() : undefined,
        visibleFields: values.visibleFields || [],
        isEnabled: values.isEnabled,
      });
      setProfile(updated);
      notify.success(MESSAGES.EMERGENCY_UPDATE_SUCCESS);
    } catch (err: any) {
      notify.serverError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRotateQr = async () => {
    try {
      const res = await emergencyService.rotateQrToken();
      notify.success(MESSAGES.EMERGENCY_QR_ROTATE_SUCCESS);
      if (profile) {
        setProfile({ ...profile, qrToken: res.qrToken });
      }
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handleCheckPublicQr = async (tokenToTest?: string) => {
    const token = (tokenToTest || checkQrToken).trim();
    if (!token) {
      notify.warning(MESSAGES.CARD_CHECK_INPUT_REQUIRED);
      return;
    }
    setCheckingQr(true);
    setCheckResult(null);
    setCheckError(null);
    try {
      const res = await emergencyService.getPublicProfile(token);
      setCheckResult(res);
    } catch (err: any) {
      setCheckError(err.message || MESSAGES.GENERIC_ERROR);
    } finally {
      setCheckingQr(false);
    }
  };

  return (
    <PageShell
      title="Thẻ khẩn cấp & Bảo mật y tế"
      description="Chính sách bảo mật quyền riêng tư y tế và cấu hình hồ sơ thông tin khẩn cấp cá nhân"
    >
      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        {/* Explanatory Card in Vietnamese */}
        <Card
          bordered={false}
          style={{
            background: '#F0FDFA',
            borderLeft: '4px solid #0F766E',
          }}
        >
          <Space direction="vertical" size={6}>
            <Title level={5} style={{ color: '#0F766E', margin: 0 }}>
              <SafetyCertificateOutlined /> Cơ chế bảo mật quyền riêng tư của Thẻ khẩn cấp
            </Title>
            <Paragraph style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
              Hệ thống SmartPass áp dụng cơ chế <strong>Zero-Knowledge Medical Privacy</strong>.
              Quản trị viên <strong>không có quyền</strong> xem danh sách hồ sơ y tế hoặc thông
              tin liên hệ khẩn cấp của học sinh trong trang quản trị này.
            </Paragraph>
            <Paragraph style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
              • Khi có sự cố, người ứng cứu quét mã QR công khai trên thẻ, hệ thống chỉ hiển thị
              duy nhất những trường dữ liệu được chủ thẻ chủ động tích chọn trong{' '}
              <code>visibleFields</code>.<br />
              • Các trường dữ liệu y tế không được chia sẻ sẽ hoàn toàn biến mất khỏi gói tin JSON
              (không để giá trị rỗng hay null).<br />
              • Nếu thẻ bị khoá, báo mất, hết hạn hoặc tính năng khẩn cấp bị tắt (
              <code>isEnabled=false</code>), hệ thống sẽ từ chối truy cập (HTTP 404).
            </Paragraph>
          </Space>
        </Card>

        {/* My Emergency Profile Section */}
        <Spin spinning={loading}>
          <Card title="Hồ sơ khẩn cấp của tôi (Tài khoản đang đăng nhập)">
            <Form form={form} layout="vertical" onFinish={handleSaveProfile}>
              <Form.Item name="isEnabled" label="Kích hoạt chia sẻ khẩn cấp khi quét QR" valuePropName="checked">
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>

              <Form.Item name="fullName" label="Họ và tên hiển thị">
                <Input placeholder="Họ và tên" />
              </Form.Item>

              <Form.Item name="emergencyContactName" label="Họ tên người liên hệ khẩn cấp">
                <Input placeholder="Ví dụ: Bố / Mẹ / Người giám hộ" />
              </Form.Item>

              <Form.Item name="emergencyContactPhone" label="Số điện thoại người liên hệ">
                <Input placeholder="Ví dụ: 0988776655" />
              </Form.Item>

              <Form.Item name="allergies" label="Tiền sử dị ứng y tế">
                <Input placeholder="Ví dụ: Dị ứng Penicillin, Aspirin..." />
              </Form.Item>

              <Form.Item name="bloodType" label="Nhóm máu">
                <Select
                  allowClear
                  placeholder="Chọn nhóm máu"
                  options={[
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="insuranceInfo" label="Thông tin thẻ BHYT / Bảo hiểm">
                <Input placeholder="Ví dụ: BHYT-123456789" />
              </Form.Item>

              <Form.Item
                name="visibleFields"
                label="Các trường công khai hiển thị cho người cứu hộ (visibleFields)"
                tooltip="Chỉ các trường được chọn ở đây mới xuất hiện khi người khác quét mã QR khẩn cấp"
              >
                <Checkbox.Group options={ALLOWED_VISIBLE_FIELDS} />
              </Form.Item>

              <Space size={16} style={{ marginTop: 12 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                  Lưu cấu hình hồ sơ
                </Button>

                <Popconfirm
                  title={MESSAGES.CONFIRM_QR_ROTATE_TITLE}
                  description={MESSAGES.CONFIRM_QR_ROTATE_CONTENT}
                  onConfirm={handleRotateQr}
                  okText={MESSAGES.CONFIRM_OK_TEXT}
                  cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<ReloadOutlined />}>
                    Đổi mã QR Token mới
                  </Button>
                </Popconfirm>
              </Space>
            </Form>

            {profile?.qrToken && (
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Mã QR Token hiện tại">
                    <Space>
                      <Text code>{maskQrToken(profile.qrToken)}</Text>
                      <Button
                        size="small"
                        icon={<SearchOutlined />}
                        onClick={() => {
                          setCheckQrToken(profile.qrToken || '');
                          handleCheckPublicQr(profile.qrToken);
                        }}
                      >
                        Kiểm tra thử thông tin công khai
                      </Button>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Card>
        </Spin>

        {/* Public Emergency QR Check Tool (4.9 Inline Alert verification) */}
        <Card title="Công cụ kiểm tra mã QR khẩn cấp công khai (Public QR Verifier)">
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Text type="secondary">
              Mô phỏng thao tác của nhân viên cứu hộ y tế khi quét mã QR công khai trên thẻ mà không cần đăng nhập:
            </Text>
            <Space.Compact style={{ width: '100%', maxWidth: 500 }}>
              <Input
                placeholder="Nhập mã qrToken cần kiểm tra..."
                prefix={<QrcodeOutlined />}
                value={checkQrToken}
                onChange={(e) => setCheckQrToken(e.target.value)}
                onPressEnter={() => handleCheckPublicQr()}
              />
              <Button type="primary" loading={checkingQr} onClick={() => handleCheckPublicQr()}>
                Kiểm tra QR
              </Button>
            </Space.Compact>

            {checkError && (
              <Alert
                message="Kết quả kiểm tra mã QR khẩn cấp"
                description={checkError}
                type="error"
                showIcon
              />
            )}

            {checkResult && (
              <Alert
                message="Kết quả quét mã QR khẩn cấp công khai (Zero-Knowledge Verified)"
                description={
                  <Descriptions size="small" column={1} bordered style={{ marginTop: 8 }}>
                    {Object.entries(checkResult).map(([key, value]) => (
                      <Descriptions.Item key={key} label={key}>
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                }
                type="success"
                showIcon
              />
            )}
          </Space>
        </Card>
      </Space>
    </PageShell>
  );
};
