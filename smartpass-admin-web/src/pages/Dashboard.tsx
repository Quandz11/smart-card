import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Typography, Space, Empty, Spin } from 'antd';
import {
  TeamOutlined,
  IdcardOutlined,
  LockOutlined,
  CarOutlined,
  BookOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import { PageShell } from '../components/PageShell';
import {
  userService,
  cardService,
  parkingService,
  libraryService,
  logService,
  AccessLog,
} from '../api/services';
import { ACCESS_LOG_ACTION_MAP } from '../constants/labels';
import { MESSAGES } from '../constants/messages';
import { formatDateTime } from '../utils/format';

const { Text } = Typography;

interface StatCardData {
  value: number | string;
  error?: boolean;
}

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalUsers: StatCardData;
    totalCards: StatCardData;
    lockedCards: StatCardData;
    activeParking: StatCardData;
    borrowedBooks: StatCardData;
    totalLogs: StatCardData;
  }>({
    totalUsers: { value: '-' },
    totalCards: { value: '-' },
    lockedCards: { value: '-' },
    activeParking: { value: '-' },
    borrowedBooks: { value: '-' },
    totalLogs: { value: '-' },
  });

  const [recentLogs, setRecentLogs] = useState<AccessLog[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        usersRes,
        cardsRes,
        lockedCardsRes,
        parkingRes,
        libraryRes,
        logsRes,
        recentLogsRes,
      ] = await Promise.allSettled([
        userService.getUsers({ limit: 1 }),
        cardService.getCards({ limit: 1 }),
        cardService.getCards({ limit: 1, status: 'locked' }),
        parkingService.getActiveSessions(),
        libraryService.getAllLoans({ limit: 1, status: 'borrowed' }),
        logService.getLogs({ limit: 1 }),
        logService.getLogs({ limit: 10 }),
      ]);

      setStats({
        totalUsers:
          usersRes.status === 'fulfilled'
            ? { value: usersRes.value.total }
            : { value: '-', error: true },
        totalCards:
          cardsRes.status === 'fulfilled'
            ? { value: cardsRes.value.total }
            : { value: '-', error: true },
        lockedCards:
          lockedCardsRes.status === 'fulfilled'
            ? { value: lockedCardsRes.value.total }
            : { value: '-', error: true },
        activeParking:
          parkingRes.status === 'fulfilled'
            ? { value: parkingRes.value.length }
            : { value: '-', error: true },
        borrowedBooks:
          libraryRes.status === 'fulfilled'
            ? { value: libraryRes.value.total }
            : { value: '-', error: true },
        totalLogs:
          logsRes.status === 'fulfilled'
            ? { value: logsRes.value.total }
            : { value: '-', error: true },
      });

      if (recentLogsRes.status === 'fulfilled') {
        setRecentLogs(recentLogsRes.value.items || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <PageShell
      title="Tổng quan hệ thống"
      description="Dữ liệu thời gian thực được tổng hợp trực tiếp từ các dịch vụ API của SmartPass"
    >
      <Spin spinning={loading}>
        {/* Statistics Row */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} style={{ background: '#F8FAFC' }}>
              <Statistic
                title="Tổng người dùng"
                value={stats.totalUsers.value}
                prefix={<TeamOutlined style={{ color: '#0F766E' }} />}
              />
              {stats.totalUsers.error && (
                <Text type="danger" style={{ fontSize: 12 }}>Lỗi tải dữ liệu</Text>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} style={{ background: '#F8FAFC' }}>
              <Statistic
                title="Tổng thẻ đã phát hành"
                value={stats.totalCards.value}
                prefix={<IdcardOutlined style={{ color: '#2563EB' }} />}
              />
              {stats.totalCards.error && (
                <Text type="danger" style={{ fontSize: 12 }}>Lỗi tải dữ liệu</Text>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} style={{ background: '#F8FAFC' }}>
              <Statistic
                title="Thẻ đang bị khóa"
                value={stats.lockedCards.value}
                valueStyle={{ color: '#DC2626' }}
                prefix={<LockOutlined style={{ color: '#DC2626' }} />}
              />
              {stats.lockedCards.error && (
                <Text type="danger" style={{ fontSize: 12 }}>Lỗi tải dữ liệu</Text>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} style={{ background: '#F8FAFC' }}>
              <Statistic
                title="Xe đang gửi trong bãi"
                value={stats.activeParking.value}
                prefix={<CarOutlined style={{ color: '#059669' }} />}
              />
              {stats.activeParking.error && (
                <Text type="danger" style={{ fontSize: 12 }}>Lỗi tải dữ liệu</Text>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} style={{ background: '#F8FAFC' }}>
              <Statistic
                title="Sách thư viện đang mượn"
                value={stats.borrowedBooks.value}
                prefix={<BookOutlined style={{ color: '#D97706' }} />}
              />
              {stats.borrowedBooks.error && (
                <Text type="danger" style={{ fontSize: 12 }}>Lỗi tải dữ liệu</Text>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card bordered={false} style={{ background: '#F8FAFC' }}>
              <Statistic
                title="Tổng lượt nhật ký ghi nhận"
                value={stats.totalLogs.value}
                prefix={<FileSearchOutlined style={{ color: '#7C3AED' }} />}
              />
              {stats.totalLogs.error && (
                <Text type="danger" style={{ fontSize: 12 }}>Lỗi tải dữ liệu</Text>
              )}
            </Card>
          </Col>
        </Row>

        {/* Recent Activity List */}
        <div style={{ marginTop: 24 }}>
          <Text strong style={{ fontSize: 16 }}>
            Hoạt động gần nhất
          </Text>
          <div style={{ marginTop: 12 }}>
            {recentLogs.length === 0 ? (
              <Empty description={MESSAGES.EMPTY_LOGS} />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={recentLogs}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>
                            {ACCESS_LOG_ACTION_MAP[item.action] || item.action}
                          </Text>
                          {item.location && <Text type="secondary">({item.location})</Text>}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={2}>
                          {item.detail && <Text>{item.detail}</Text>}
                          <Space size={16}>
                            {item.owner && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Người thực hiện: {item.owner.fullName}
                              </Text>
                            )}
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Thời gian: {formatDateTime(item.createdAt)}
                            </Text>
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </div>
      </Spin>
    </PageShell>
  );
};

