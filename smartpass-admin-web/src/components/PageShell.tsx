import React from 'react';
import { Card, Typography, Row, Col, Space } from 'antd';

const { Title, Paragraph } = Typography;

interface PageShellProps {
  title: string;
  description?: string;
  extraAction?: React.ReactNode;
  filterContent?: React.ReactNode;
  children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({
  title,
  description,
  extraAction,
  filterContent,
  children,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Page Header Row */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 4 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1F2937' }}>
            {title}
          </Title>
          {description && (
            <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: 13 }}>
              {description}
            </Paragraph>
          )}
        </Col>
        {extraAction && (
          <Col>
            <Space>{extraAction}</Space>
          </Col>
        )}
      </Row>

      {/* Filter Card (if filters present) */}
      {filterContent && (
        <Card size="small" style={{ borderRadius: 8, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}>
          {filterContent}
        </Card>
      )}

      {/* Content Card */}
      <Card style={{ borderRadius: 8, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}>
        {children}
      </Card>
    </div>
  );
};

