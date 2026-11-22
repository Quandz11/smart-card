import React, { useEffect, useState } from 'react';
import { Result, Button, Card, Descriptions, Spin, Typography } from 'antd';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { walletService } from '../api/services';
import { formatVND } from '../utils/format';

const { Text } = Typography;

export const VnpayReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);

  const txnRef = searchParams.get('vnp_TxnRef') || '';
  const responseCode = searchParams.get('vnp_ResponseCode') || '';
  const amount = searchParams.get('vnp_Amount') ? Number(searchParams.get('vnp_Amount')) / 100 : 0;
  const bankCode = searchParams.get('vnp_BankCode') || '';

  const isSuccess = responseCode === '00';

  useEffect(() => {
    if (txnRef) {
      walletService
        .getVnpayOrder(txnRef)
        .then((res) => {
          setOrderData(res.order);
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [txnRef]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Đang kiểm tra kết quả giao dịch VNPay..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 16px' }}>
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <Result
          status={isSuccess ? 'success' : 'error'}
          title={isSuccess ? 'Nạp tiền ví SmartPass thành công!' : 'Thanh toán VNPay không thành công'}
          subTitle={
            isSuccess
              ? 'Giao dịch qua cổng VNPay Sandbox đã hoàn tất và số dư ví đã được cập nhật.'
              : `Mã lỗi phản hồi từ cổng VNPay: ${responseCode || 'N/A'}. Số dư ví không thay đổi.`
          }
          extra={[
            <Button type="primary" key="wallet" onClick={() => navigate('/wallet')}>
              Quay lại Ví & Căn tin
            </Button>,
          ]}
        >
          <Descriptions title="Chi tiết giao dịch" bordered size="small" column={1}>
            <Descriptions.Item label="Mã tham chiếu (TxnRef)">
              <Text copyable strong>{txnRef || 'N/A'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              <Text strong style={{ color: isSuccess ? '#0F766E' : '#DC2626' }}>
                {formatVND(orderData?.amount || amount)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ngân hàng thanh toán">
              {orderData?.vnpayBankCode || bankCode || 'NCB'}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái hệ thống">
              {orderData?.status === 'SUCCESS' ? 'ĐÃ NẠP THÀNH CÔNG' : orderData?.status || (isSuccess ? 'SUCCESS' : 'FAILED')}
            </Descriptions.Item>
          </Descriptions>
        </Result>
      </Card>
    </div>
  );
};

