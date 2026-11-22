import React, { useEffect, useState } from 'react';
import { Table, DatePicker, Select, Input, Space, Button, Empty, Typography } from 'antd';
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageShell } from '../components/PageShell';
import { logService, AccessLog } from '../api/services';
import { ACCESS_LOG_ACTION_MAP } from '../constants/labels';
import { MESSAGES } from '../constants/messages';
import { formatDateTime, truncateId } from '../utils/format';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export const Logs: React.FC = () => {
  const [data, setData] = useState<AccessLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Filters
  const [actionFilter, setActionFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [ownerFilter, setOwnerFilter] = useState('');
  const [cardFilter, setCardFilter] = useState('');

  const fetchLogs = async (p = page, l = limit) => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: p,
        limit: l,
      };

      if (actionFilter) params.action = actionFilter;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.from = dateRange[0].startOf('day').toISOString();
        params.to = dateRange[1].endOf('day').toISOString();
      }
      if (ownerFilter.trim()) params.owner = ownerFilter.trim();
      if (cardFilter.trim()) params.card = cardFilter.trim();

      const res = await logService.getLogs(params);
      setData(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, limit);
  }, [page, limit]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchLogs(1, limit);
  };

  const handleResetFilters = () => {
    setActionFilter(undefined);
    setDateRange(null);
    setOwnerFilter('');
    setCardFilter('');
    setPage(1);
    // After state resets, fetch
    setTimeout(() => {
      logService.getLogs({ page: 1, limit }).then((res) => {
        setData(res.items);
        setTotal(res.total);
      });
    }, 0);
  };

  const columns: ColumnsType<AccessLog> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dt: string) => formatDateTime(dt),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      render: (act: string) => (
        <Text strong style={{ color: '#0F766E' }}>
          {ACCESS_LOG_ACTION_MAP[act] || act}
        </Text>
      ),
    },
    {
      title: 'Học sinh / Chủ thẻ',
      key: 'owner',
      render: (_, record) => {
        if (record.owner) {
          return (
            <Space direction="vertical" size={0}>
              <Text strong>{record.owner.fullName}</Text>
              {record.owner.studentCode && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {record.owner.studentCode}
                </Text>
              )}
            </Space>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Mã thẻ',
      key: 'card',
      render: (_, record) => {
        if (record.card?.cardCode) {
          return <Text code copyable>{record.card.cardCode}</Text>;
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
      render: (loc?: string) => loc || '-',
    },
    {
      title: 'Chi tiết',
      dataIndex: 'detail',
      key: 'detail',
      render: (detail?: string) => detail || '-',
    },
    {
      title: 'Người ghi nhận',
      key: 'createdBy',
      render: (_, record) => {
        if (record.createdBy?.fullName) {
          return record.createdBy.fullName;
        }
        if (record.createdBy?._id) {
          return <Text code>{truncateId(record.createdBy._id)}</Text>;
        }
        return <Text type="secondary">Hệ thống</Text>;
      },
    },
  ];

  return (
    <PageShell
      title="Nhật ký truy cập & giao dịch"
      description="Lịch sử kiểm soát ra vào, quẹt thẻ điểm danh, mượn trả thư viện, thanh toán căn tin và gửi xe"
      filterContent={
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Space wrap size={12}>
            <Select
              allowClear
              placeholder="Chọn hành động..."
              value={actionFilter}
              onChange={(val) => setActionFilter(val)}
              style={{ width: 180 }}
              options={Object.entries(ACCESS_LOG_ACTION_MAP).map(([key, label]) => ({
                value: key,
                label,
              }))}
            />

            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as any)}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />

            <Input
              placeholder="ID chủ thẻ (ObjectId)..."
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              style={{ width: 180 }}
            />

            <Input
              placeholder="ID thẻ (ObjectId)..."
              value={cardFilter}
              onChange={(e) => setCardFilter(e.target.value)}
              style={{ width: 180 }}
            />

            <Button type="primary" icon={<FilterOutlined />} onClick={handleApplyFilters}>
              Lọc nhật ký
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
              Đặt lại
            </Button>
          </Space>
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
                actionFilter || dateRange || ownerFilter || cardFilter
                  ? MESSAGES.EMPTY_FILTER_RESULT
                  : MESSAGES.EMPTY_LOGS
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
    </PageShell>
  );
};

