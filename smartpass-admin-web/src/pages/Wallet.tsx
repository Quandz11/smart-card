import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Empty,
  Typography,
} from 'antd';
import { PlusCircleOutlined, CreditCardOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageShell } from '../components/PageShell';
import { StatusTag } from '../components/StatusTag';
import { walletService, userService, CanteenTransaction, User } from '../api/services';
import { CANTEEN_TX_TYPE_MAP } from '../constants/labels';
import { MESSAGES } from '../constants/messages';
import { notify } from '../lib/notify';
import { formatDateTime, formatVND } from '../utils/format';

const { Text } = Typography;

export const Wallet: React.FC = () => {
  const [data, setData] = useState<CanteenTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Searchable users list for topup
  const [usersList, setUsersList] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Modals
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payIdentifierType, setPayIdentifierType] = useState<'cardCode' | 'qrToken' | 'nfcUid'>('cardCode');

  const [topupForm] = Form.useForm();
  const [payForm] = Form.useForm();

  const fetchTransactions = async (p = page, l = limit) => {
    setLoading(true);
    try {
      const res = await walletService.getAllTransactions({ page: p, limit: l });
      setData(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(page, limit);
  }, [page, limit]);

  const searchUsers = async (q: string) => {
    setUsersLoading(true);
    try {
      const res = await userService.getUsers({ q, limit: 20 });
      setUsersList(res.items);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleTopup = async (values: any) => {
    try {
      await walletService.topUpWallet({
        userId: values.userId,
        amount: values.amount,
        pin: values.pin.trim(),
        note: values.note ? values.note.trim() : undefined,
      });
      notify.success(MESSAGES.WALLET_TOPUP_SUCCESS);
      setTopupModalOpen(false);
      topupForm.resetFields();
      fetchTransactions();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handlePay = async (values: any) => {
    try {
      const payload: Record<string, any> = {
        [payIdentifierType]: values.identifierValue.trim(),
        amount: values.amount,
        pin: values.pin.trim(),
      };

      await walletService.payFromWallet(payload as any);
      notify.success(MESSAGES.WALLET_PAY_SUCCESS);
      setPayModalOpen(false);
      payForm.resetFields();
      fetchTransactions();
    } catch (err: any) {
      notify.serverError(err);
      fetchTransactions();
    }
  };

  const columns: ColumnsType<CanteenTransaction> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dt: string) => formatDateTime(dt),
    },
    {
      title: 'Học sinh',
      key: 'user',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.user?.fullName || '-'}</Text>
          {record.user?.studentCode && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Mã HS: {record.user.studentCode}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <StatusTag type="canteen" value={type} />,
    },
    {
      title: 'Số tiền',
      key: 'amount',
      render: (_, record) => {
        const meta = CANTEEN_TX_TYPE_MAP[record.type];
        const isTopup = record.type === 'topup';
        return (
          <Text
            strong
            style={{
              color: isTopup ? '#16A34A' : '#DC2626',
            }}
          >
            {meta?.prefix || ''}
            {formatVND(record.amount)}
          </Text>
        );
      },
    },
    {
      title: 'Số dư sau giao dịch',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      render: (bal: number) => <Text>{formatVND(bal)}</Text>,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (note?: string) => note || '-',
    },
    {
      title: 'Người thực hiện',
      key: 'performedBy',
      render: (_, record) => record.performedBy?.fullName || '-',
    },
  ];

  return (
    <PageShell
      title="Quản lý căn tin & ví điện tử"
      description="Quản lý dòng tiền nạp ví, giao dịch trừ tiền mua suất ăn tại căng tin qua thẻ số không tiếp xúc"
      extraAction={
        <Space>
          <Button
            icon={<CreditCardOutlined />}
            onClick={() => {
              payForm.resetFields();
              setPayModalOpen(true);
            }}
          >
            Thanh toán bằng thẻ
          </Button>
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            onClick={() => {
              topupForm.resetFields();
              searchUsers('');
              setTopupModalOpen(true);
            }}
          >
            Nạp tiền
          </Button>
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
        locale={{ emptyText: <Empty description={MESSAGES.EMPTY_TRANSACTIONS} /> }}
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

      {/* Topup Modal */}
      <Modal
        title="Nạp tiền vào ví học sinh"
        open={topupModalOpen}
        onCancel={() => setTopupModalOpen(false)}
        onOk={() => topupForm.submit()}
        okText="Xác nhận nạp"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={topupForm} layout="vertical" onFinish={handleTopup}>
          <Form.Item
            name="userId"
            label="Học sinh / Người dùng"
            rules={[{ required: true, message: 'Vui lòng chọn người nhận tiền' }]}
          >
            <Select
              showSearch
              placeholder="Tìm theo tên, email hoặc mã HS..."
              filterOption={false}
              onSearch={searchUsers}
              loading={usersLoading}
              options={usersList.map((u) => ({
                value: u._id,
                label: `${u.fullName} (${u.email}${u.studentCode ? ' - ' + u.studentCode : ''})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Số tiền nạp (VND)"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { type: 'number', min: 10000, message: MESSAGES.TOPUP_AMOUNT_MIN },
              {
                validator: (_, val) => {
                  if (val && val % 1000 !== 0) {
                    return Promise.reject(new Error(MESSAGES.TOPUP_AMOUNT_STEP));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(val) => Number(val?.replace(/\./g, '') || 0)}
              placeholder="Ví dụ: 50.000"
            />
          </Form.Item>

          <Form.Item
            name="pin"
            label="PIN của nhân viên"
            rules={[
              { required: true, message: 'Vui lòng nhập PIN của nhân viên để xác thực' },
              { len: 6, message: 'Mã PIN gồm chính xác 6 chữ số' },
              { pattern: /^[0-9]{6}$/, message: 'Mã PIN chỉ bao gồm các chữ số' },
            ]}
            extra="Nhập mã PIN 6 số của nhân viên đang thao tác để xác thực thu tiền mặt"
          >
            <Input.Password maxLength={6} placeholder="Nhập PIN 6 số của nhân viên" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input placeholder="Ví dụ: Nạp tiền đầu tuần" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Pay Modal */}
      <Modal
        title="Thanh toán căn tin bằng thẻ"
        open={payModalOpen}
        onCancel={() => setPayModalOpen(false)}
        onOk={() => payForm.submit()}
        okText="Trừ tiền ví"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={payForm} layout="vertical" onFinish={handlePay}>
          <Form.Item label="Phương thức nhận diện thẻ" required>
            <Select
              value={payIdentifierType}
              onChange={(val) => setPayIdentifierType(val)}
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
            rules={[{ required: true, message: 'Vui lòng nhập mã thẻ' }]}
          >
            <Input placeholder="Ví dụ: CARD-STU001" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Số tiền thanh toán (VND)"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { type: 'number', min: 1000, message: 'Số tiền tối thiểu là 1.000 ₫' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(val) => Number(val?.replace(/\./g, '') || 0)}
              placeholder="Ví dụ: 30.000"
            />
          </Form.Item>

          <Form.Item
            name="pin"
            label="Mã PIN học sinh"
            rules={[
              { required: true, message: 'Vui lòng nhập mã PIN của học sinh' },
              { len: 6, message: 'Mã PIN gồm 6 chữ số' },
            ]}
            extra="Học sinh nhập mã PIN 6 số của mình để đồng ý trừ tiền ví"
          >
            <Input.Password maxLength={6} placeholder="Học sinh nhập PIN 6 số" />
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

