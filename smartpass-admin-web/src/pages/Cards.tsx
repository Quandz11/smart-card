import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Select,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Space,
  Popconfirm,
  Empty,
  Typography,
  Drawer,
  Timeline,
  Alert,
  Descriptions,
  Card as AntCard,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  WarningOutlined,
  FieldTimeOutlined,
  DeleteOutlined,
  HistoryOutlined,
  ScanOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageShell } from '../components/PageShell';
import { StatusTag } from '../components/StatusTag';
import { cardService, userService, Card, AccessLog, User, VerifyCardResult } from '../api/services';
import { ACCESS_LOG_ACTION_MAP } from '../constants/labels';
import { MESSAGES } from '../constants/messages';
import { notify } from '../lib/notify';
import { formatDate, formatDateTime, maskQrToken } from '../utils/format';

const { Text } = Typography;

export const Cards: React.FC = () => {
  const [data, setData] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Users for searchable owner select in Create Card modal
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchUsersLoading, setSearchUsersLoading] = useState(false);

  // Modals / Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cardHistory, setCardHistory] = useState<AccessLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Verify Card State
  const [verifyType, setVerifyType] = useState<'cardCode' | 'nfcUid' | 'qrToken'>('cardCode');
  const [verifyValue, setVerifyValue] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyCardResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [createForm] = Form.useForm();
  const [renewForm] = Form.useForm();

  const fetchCards = async (p = page, l = limit, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await cardService.getCards({
        page: p,
        limit: l,
        status,
      });
      setData(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards(page, limit, statusFilter);
  }, [page, limit, statusFilter]);

  const searchUsers = async (q: string) => {
    setSearchUsersLoading(true);
    try {
      const res = await userService.getUsers({ q, limit: 20 });
      setUsersList(res.items);
    } finally {
      setSearchUsersLoading(false);
    }
  };

  // Actions
  const handleCreateCard = async (values: any) => {
    try {
      await cardService.createCard({
        cardCode: values.cardCode.trim(),
        owner: values.owner,
        expiresAt: values.expiresAt.toISOString(),
        nfcUid: values.nfcUid ? values.nfcUid.trim() : undefined,
      });
      notify.success(MESSAGES.CARD_ISSUE_SUCCESS);
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchCards();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handleIssue = async (id: string) => {
    try {
      await cardService.issueCard(id);
      notify.success(MESSAGES.CARD_ISSUE_SUCCESS);
      fetchCards();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handleLock = async (id: string) => {
    try {
      await cardService.lockCard(id);
      notify.success(MESSAGES.CARD_LOCK_SUCCESS);
      fetchCards();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handleUnlock = async (id: string) => {
    try {
      await cardService.unlockCard(id);
      notify.success(MESSAGES.CARD_UNLOCK_SUCCESS);
      fetchCards();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handleMarkLost = async (id: string) => {
    try {
      await cardService.markLost(id);
      notify.success(MESSAGES.CARD_MARK_LOST_SUCCESS);
      fetchCards();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const openRenewModal = (card: Card) => {
    setSelectedCard(card);
    renewForm.setFieldsValue({ months: 12 });
    setRenewModalOpen(true);
  };

  const handleRenew = async (values: any) => {
    if (!selectedCard) return;
    try {
      await cardService.renewCard(selectedCard._id, values.months);
      notify.success(MESSAGES.CARD_EXTEND_SUCCESS);
      setRenewModalOpen(false);
      fetchCards();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await cardService.deleteCard(id);
      notify.success(MESSAGES.CARD_DELETE_SUCCESS);
      fetchCards();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const openHistoryDrawer = async (card: Card) => {
    setSelectedCard(card);
    setHistoryDrawerOpen(true);
    setHistoryLoading(true);
    try {
      const logs = await cardService.getHistory(card._id);
      setCardHistory(logs || []);
    } catch (err: any) {
      notify.serverError(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyValue.trim()) {
      notify.warning(MESSAGES.CARD_CHECK_INPUT_REQUIRED);
      return;
    }
    setVerifyLoading(true);
    setVerifyResult(null);
    setVerifyError(null);
    try {
      const payload: Record<string, string> = { [verifyType]: verifyValue.trim() };
      const card = await cardService.verifyCard(payload);
      setVerifyResult(card);
    } catch (err: any) {
      setVerifyError(err.message || MESSAGES.GENERIC_ERROR);
    } finally {
      setVerifyLoading(false);
    }
  };

  const columns: ColumnsType<Card> = [
    {
      title: 'Mã thẻ',
      dataIndex: 'cardCode',
      key: 'cardCode',
      render: (code: string) => <Text copyable strong>{code}</Text>,
    },
    {
      title: 'Chủ thẻ',
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
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag type="card" value={status} />,
    },
    {
      title: 'Ngày cấp',
      dataIndex: 'issuedAt',
      key: 'issuedAt',
      render: (dt?: string) => formatDateTime(dt),
    },
    {
      title: 'Hạn dùng',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (exp: string) => {
        const isExpired = dayjs().isAfter(dayjs(exp));
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ color: isExpired ? '#DC2626' : undefined }}>
              {formatDate(exp)}
            </Text>
            {isExpired && (
              <Text type="danger" style={{ fontSize: 11, fontWeight: 600 }}>
                Đã hết hạn
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'NFC UID',
      dataIndex: 'nfcUid',
      key: 'nfcUid',
      render: (uid?: string) => (uid ? <Text code>{uid}</Text> : '-'),
    },
    {
      title: 'QR Token',
      dataIndex: 'qrToken',
      key: 'qrToken',
      render: (token: string) => (
        <Space>
          <Text code>{maskQrToken(token)}</Text>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(token);
              notify.success(MESSAGES.CARD_QR_COPIED);
            }}
          />
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" wrap>
          {record.status === 'locked' ? (
            <Popconfirm
              title={MESSAGES.CONFIRM_CARD_UNLOCK_TITLE}
              description={MESSAGES.CONFIRM_CARD_UNLOCK_CONTENT}
              onConfirm={() => handleUnlock(record._id)}
              okText={MESSAGES.CONFIRM_OK_TEXT}
              cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
            >
              <Button
                type="text"
                icon={<UnlockOutlined />}
                size="small"
              >
                Mở khóa
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title={MESSAGES.CONFIRM_CARD_LOCK_TITLE}
              description={MESSAGES.CONFIRM_CARD_LOCK_CONTENT}
              onConfirm={() => handleLock(record._id)}
              okText={MESSAGES.CONFIRM_OK_TEXT}
              cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                icon={<LockOutlined />}
                size="small"
              >
                Khóa
              </Button>
            </Popconfirm>
          )}

          {!record.issuedAt && (
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              size="small"
              onClick={() => handleIssue(record._id)}
            >
              Cấp thẻ
            </Button>
          )}

          <Button
            type="text"
            icon={<FieldTimeOutlined />}
            size="small"
            onClick={() => openRenewModal(record)}
          >
            Gia hạn
          </Button>

          <Button
            type="text"
            icon={<HistoryOutlined />}
            size="small"
            onClick={() => openHistoryDrawer(record)}
          >
            Lịch sử
          </Button>

          {record.status !== 'lost' && (
            <Popconfirm
              title={MESSAGES.CONFIRM_CARD_LOST_TITLE}
              description={MESSAGES.CONFIRM_CARD_LOST_CONTENT}
              onConfirm={() => handleMarkLost(record._id)}
              okText={MESSAGES.CONFIRM_OK_TEXT}
              cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<WarningOutlined />} size="small">
                Báo mất
              </Button>
            </Popconfirm>
          )}

          <Popconfirm
            title={MESSAGES.CONFIRM_CARD_DELETE_TITLE}
            description={MESSAGES.CONFIRM_CARD_DELETE_CONTENT}
            onConfirm={() => handleDelete(record._id)}
            okText={MESSAGES.CONFIRM_DANGER_OK_TEXT}
            cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageShell
      title="Quản lý thẻ sinh viên / học sinh"
      description="Quản lý vòng đời thẻ số, mã hóa NFC/QR, cấp phát, gia hạn và giám sát lịch sử quét thẻ"
      extraAction={
        <Space>
          <Button
            icon={<ScanOutlined />}
            onClick={() => {
              setVerifyValue('');
              setVerifyResult(null);
              setVerifyError(null);
              setVerifyModalOpen(true);
            }}
          >
            Kiểm tra thẻ
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              createForm.resetFields();
              searchUsers('');
              setCreateModalOpen(true);
            }}
          >
            Tạo thẻ
          </Button>
        </Space>
      }
      filterContent={
        <Space>
          <Text>Lọc theo trạng thái:</Text>
          <Select
            allowClear
            placeholder="Tất cả trạng thái"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            style={{ width: 180 }}
            options={[
              { value: 'active', label: 'Đang hoạt động' },
              { value: 'locked', label: 'Đã khóa' },
              { value: 'expired', label: 'Hết hạn' },
              { value: 'lost', label: 'Báo mất' },
            ]}
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
              description={statusFilter ? MESSAGES.EMPTY_FILTER_RESULT : MESSAGES.EMPTY_CARDS}
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

      {/* Modal 1: Create Card */}
      <Modal
        title="Tạo thẻ mới"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        okText="Tạo thẻ"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateCard}>
          <Form.Item
            name="cardCode"
            label="Mã thẻ"
            rules={[{ required: true, message: 'Vui lòng nhập mã thẻ (ví dụ CARD-STU003)' }]}
          >
            <Input placeholder="Ví dụ: CARD-STU003" />
          </Form.Item>

          <Form.Item
            name="owner"
            label="Chủ thẻ (Học sinh / Người dùng)"
            rules={[{ required: true, message: 'Vui lòng chọn chủ thẻ' }]}
          >
            <Select
              showSearch
              placeholder="Gõ tên, email hoặc mã HS để tìm..."
              filterOption={false}
              onSearch={searchUsers}
              loading={searchUsersLoading}
              options={usersList.map((u) => ({
                value: u._id,
                label: `${u.fullName} (${u.email}${u.studentCode ? ' - ' + u.studentCode : ''})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="expiresAt"
            label="Ngày hết hạn"
            initialValue={dayjs().add(1, 'year')}
            rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="nfcUid" label="NFC UID (Tùy chọn)">
            <Input placeholder="Ví dụ: 04A1B2C3D4" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal 2: Renew Card */}
      <Modal
        title={`Gia hạn thẻ: ${selectedCard?.cardCode || ''}`}
        open={renewModalOpen}
        onCancel={() => setRenewModalOpen(false)}
        onOk={() => renewForm.submit()}
        okText="Xác nhận gia hạn"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={renewForm} layout="vertical" onFinish={handleRenew}>
          <Form.Item
            name="months"
            label="Số tháng gia hạn thêm"
            rules={[{ required: true, message: 'Vui lòng nhập số tháng' }]}
          >
            <InputNumber min={1} max={60} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer: Card History Timeline */}
      <Drawer
        title={`Lịch sử quẹt thẻ: ${selectedCard?.cardCode || ''}`}
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        width={420}
      >
        {historyLoading ? (
          <Text>{MESSAGES.LOADING_FETCHING}</Text>
        ) : cardHistory.length === 0 ? (
          <Empty description={MESSAGES.EMPTY_LOGS} />
        ) : (
          <Timeline
            items={cardHistory.map((log) => ({
              children: (
                <Space direction="vertical" size={2}>
                  <Text strong>{ACCESS_LOG_ACTION_MAP[log.action] || log.action}</Text>
                  {log.location && <Text type="secondary">Địa điểm: {log.location}</Text>}
                  {log.detail && <Text>{log.detail}</Text>}
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDateTime(log.createdAt)}
                  </Text>
                </Space>
              ),
            }))}
          />
        )}
      </Drawer>

      {/* Modal: Verify Card Tool */}
      <Modal
        title="Công cụ kiểm tra & xác minh thẻ"
        open={verifyModalOpen}
        onCancel={() => setVerifyModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Space.Compact style={{ width: '100%' }}>
            <Select
              value={verifyType}
              onChange={(val) => setVerifyType(val)}
              style={{ width: '35%' }}
              options={[
                { value: 'cardCode', label: 'Mã thẻ' },
                { value: 'nfcUid', label: 'NFC UID' },
                { value: 'qrToken', label: 'QR Token' },
              ]}
            />
            <Input
              style={{ width: '65%' }}
              placeholder="Nhập mã định danh thẻ..."
              value={verifyValue}
              onChange={(e) => setVerifyValue(e.target.value)}
              onPressEnter={handleVerify}
            />
          </Space.Compact>

          <Button type="primary" block loading={verifyLoading} onClick={handleVerify}>
            Xác minh thẻ
          </Button>

          {verifyError && (
            <Alert
              message="Kết quả kiểm tra"
              description={verifyError}
              type="error"
              showIcon
            />
          )}

          {verifyResult && (
            <>
              <Alert
                message="Xác thực thẻ thành công"
                description="Thẻ hợp lệ và đang hoạt động trong hệ thống"
                type="success"
                showIcon
              />
              <AntCard size="small" title="Thông tin thẻ hợp lệ" style={{ background: '#F8FAFC' }}>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="Mã thẻ">
                  <Text copyable strong>{verifyResult.card.cardCode}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Chủ thẻ">
                  {verifyResult.owner?.fullName || '-'}
                  {verifyResult.owner?.studentCode && ` (Mã HS: ${verifyResult.owner.studentCode})`}
                  {verifyResult.owner?.className && ` - Lớp: ${verifyResult.owner.className}`}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <StatusTag type="card" value={verifyResult.card.status} />
                </Descriptions.Item>
                <Descriptions.Item label="Hạn dùng">
                  {formatDate(verifyResult.card.expiresAt)}
                </Descriptions.Item>
              </Descriptions>
            </AntCard>
            </>
          )}
        </Space>
      </Modal>
    </PageShell>
  );
};
