import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Select,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  Empty,
  Typography,
} from 'antd';
import { BookOutlined, CheckOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageShell } from '../components/PageShell';
import { StatusTag } from '../components/StatusTag';
import { libraryService, LibraryLoan } from '../api/services';
import { MESSAGES } from '../constants/messages';
import { notify } from '../lib/notify';
import { formatDate, getOverdueDays } from '../utils/format';

const { Text } = Typography;

export const Library: React.FC = () => {
  const [data, setData] = useState<LibraryLoan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Borrow modal
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchLoans = async (p = page, l = limit, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await libraryService.getAllLoans({
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
    fetchLoans(page, limit, statusFilter);
  }, [page, limit, statusFilter]);

  const handleBorrow = async (values: any) => {
    try {
      await libraryService.borrowBook({
        cardCode: values.cardCode.trim(),
        bookCode: values.bookCode.trim(),
        bookTitle: values.bookTitle.trim(),
      });
      notify.success(MESSAGES.LIBRARY_BORROW_SUCCESS);
      setBorrowModalOpen(false);
      form.resetFields();
      fetchLoans();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const handleReturn = async (loanId: string) => {
    try {
      const res = await libraryService.returnBook({ loanId });
      notify.success(MESSAGES.LIBRARY_RETURN_SUCCESS);
      if (res && res.overdue) {
        notify.warning('Sách đã quá hạn mượn theo quy định!');
      }
      fetchLoans();
    } catch (err: any) {
      notify.serverError(err);
    }
  };

  const columns: ColumnsType<LibraryLoan> = [
    {
      title: 'Người mượn',
      key: 'borrower',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.borrower?.fullName || '-'}</Text>
          {record.borrower?.studentCode && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Mã HS: {record.borrower.studentCode}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Mã sách',
      dataIndex: 'bookCode',
      key: 'bookCode',
      render: (code: string) => <Text code>{code}</Text>,
    },
    {
      title: 'Tên sách',
      dataIndex: 'bookTitle',
      key: 'bookTitle',
      render: (title: string) => <Text strong>{title}</Text>,
    },
    {
      title: 'Ngày mượn',
      dataIndex: 'borrowedAt',
      key: 'borrowedAt',
      render: (dt: string) => formatDate(dt),
    },
    {
      title: 'Hạn trả',
      key: 'dueAt',
      render: (_, record) => {
        const isPast = dayjs().isAfter(dayjs(record.dueAt));
        const overdueDays = getOverdueDays(record.dueAt);
        const isOverdue = record.status === 'borrowed' && isPast;

        return (
          <Space direction="vertical" size={0}>
            <Text style={{ color: isOverdue ? '#DC2626' : undefined }}>
              {formatDate(record.dueAt)}
            </Text>
            {isOverdue && (
              <Text type="danger" style={{ fontSize: 11, fontWeight: 600 }}>
                Quá hạn {overdueDays} ngày
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Ngày trả',
      dataIndex: 'returnedAt',
      key: 'returnedAt',
      render: (dt?: string) => (dt ? formatDate(dt) : '-'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => <StatusTag type="library" value={st} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        if (record.status === 'borrowed') {
          return (
            <Popconfirm
              title={MESSAGES.CONFIRM_LIBRARY_RETURN_TITLE}
              description={MESSAGES.CONFIRM_LIBRARY_RETURN_CONTENT}
              onConfirm={() => handleReturn(record._id)}
              okText={MESSAGES.CONFIRM_OK_TEXT}
              cancelText={MESSAGES.CONFIRM_CANCEL_TEXT}
            >
              <Button type="primary" size="small" icon={<CheckOutlined />}>
                Trả sách
              </Button>
            </Popconfirm>
          );
        }
        return <Text type="secondary">Đã hoàn tất</Text>;
      },
    },
  ];

  return (
    <PageShell
      title="Quản lý mượn trả thư viện"
      description="Quản lý danh mục lưu thông sách, hạn trả, cảnh báo quá hạn và quy tắc giới hạn tối đa 3 cuốn/thẻ"
      extraAction={
        <Button
          type="primary"
          icon={<BookOutlined />}
          onClick={() => {
            form.resetFields();
            setBorrowModalOpen(true);
          }}
        >
          Mượn sách
        </Button>
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
              { value: 'borrowed', label: 'Đang mượn' },
              { value: 'returned', label: 'Đã trả' },
              { value: 'overdue', label: 'Quá hạn' },
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
              description={
                statusFilter ? MESSAGES.EMPTY_FILTER_RESULT : MESSAGES.EMPTY_LIBRARY
              }
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

      {/* Borrow Book Modal */}
      <Modal
        title="Đăng ký mượn sách thư viện"
        open={borrowModalOpen}
        onCancel={() => setBorrowModalOpen(false)}
        onOk={() => form.submit()}
        okText="Xác nhận mượn"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleBorrow}>
          <Form.Item
            name="cardCode"
            label="Mã thẻ học sinh"
            rules={[{ required: true, message: 'Vui lòng nhập mã thẻ' }]}
          >
            <Input placeholder="Ví dụ: CARD-STU001" />
          </Form.Item>

          <Form.Item
            name="bookCode"
            label="Mã sách"
            rules={[{ required: true, message: 'Vui lòng nhập mã sách' }]}
          >
            <Input placeholder="Ví dụ: BK-001" />
          </Form.Item>

          <Form.Item
            name="bookTitle"
            label="Tên sách"
            rules={[{ required: true, message: 'Vui lòng nhập tên sách' }]}
          >
            <Input placeholder="Ví dụ: Lập trình Node.js & Thiết kế API" />
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

