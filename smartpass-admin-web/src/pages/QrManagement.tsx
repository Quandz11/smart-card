import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Select,
  Input,
  Space,
  Modal,
  Form,
  QRCode,
  Typography,
  Empty,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  PrinterOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  StopOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageShell } from '../components/PageShell';
import { StatusTag } from '../components/StatusTag';
import { qrService, eventService, libraryService, QrCodeItem, EventItem } from '../api/services';
import { QR_TYPE_MAP } from '../constants/labels';
import { notify } from '../lib/notify';
import { formatDateTime } from '../utils/format';

const { Text } = Typography;

export const QrManagement: React.FC = () => {
  const [data, setData] = useState<QrCodeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState('');

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedQr, setSelectedQr] = useState<QrCodeItem | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();
  const selectedType = Form.useWatch('type', createForm);

  // Dynamic server-fed entity options for Create Form
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [booksList, setBooksList] = useState<{ bookCode: string; bookTitle: string }[]>([]);

  // Print sheet modal
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res: any = await qrService.getQrCodes({
        page,
        limit,
        type: typeFilter,
        isActive: statusFilter !== undefined ? statusFilter === 'true' : undefined,
        search: searchText.trim() || undefined,
      });

      if (res && res.data) {
        setData(res.data);
        setTotal(res.pagination?.total || 0);
      } else if (Array.isArray(res)) {
        setData(res);
        setTotal(res.length);
      }
    } catch (err: any) {
      notify.serverError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, typeFilter, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  // Pre-load entities for Create Form
  useEffect(() => {
    if (createModalOpen) {
      eventService.getEvents()
        .then((res: any) => setEventsList(Array.isArray(res) ? res : res?.data || []))
        .catch(() => {});
      libraryService.getAllLoans({ page: 1, limit: 100 })
        .then((res: any) => {
          const loans = res?.data || [];
          const distinctBooks = new Map<string, string>();
          // Fallback rich seed books
          const fallbackBooks = [
            { bookCode: 'BK-001', bookTitle: 'Clean Code: A Handbook of Agile Software Craftsmanship' },
            { bookCode: 'BK-002', bookTitle: 'Design Patterns: Elements of Reusable Object-Oriented Software' },
            { bookCode: 'BK-003', bookTitle: 'Introduction to Algorithms (CLRS 4th Edition)' },
            { bookCode: 'BK-004', bookTitle: 'Computer Networks: A Systems Approach' },
            { bookCode: 'BK-005', bookTitle: 'Modern Operating Systems (Andrew S. Tanenbaum)' },
            { bookCode: 'BK-006', bookTitle: 'Artificial Intelligence: A Modern Approach' },
            { bookCode: 'BK-007', bookTitle: 'Database System Concepts (Silberschatz)' },
            { bookCode: 'BK-008', bookTitle: 'Cracking the Coding Interview' },
            { bookCode: 'BK-009', bookTitle: 'Designing Data-Intensive Applications (Martin Kleppmann)' },
            { bookCode: 'BK-010', bookTitle: 'The Pragmatic Programmer: Your Journey To Mastery' },
          ];
          fallbackBooks.forEach((b) => distinctBooks.set(b.bookCode, b.bookTitle));
          loans.forEach((l: any) => {
            if (l.bookCode && l.bookTitle) distinctBooks.set(l.bookCode, l.bookTitle);
          });
          setBooksList(Array.from(distinctBooks.entries()).map(([bookCode, bookTitle]) => ({ bookCode, bookTitle })));
        })
        .catch(() => {});
    }
  }, [createModalOpen]);

  const handleCreateSubmit = async (values: any) => {
    try {
      setCreateLoading(true);
      let refKind = 'location';
      if (values.type === 'BOOK') refKind = 'book';
      else if (values.type === 'ROOM') refKind = 'room';
      else if (values.type === 'EVENT') refKind = 'event';
      else if (values.type === 'CANTEEN_POINT') refKind = 'counter';
      else if (values.type === 'PARKING_IN' || values.type === 'PARKING_OUT' || values.type === 'GATE_IN' || values.type === 'GATE_OUT') refKind = 'gate';

      await qrService.createQrCode({
        type: values.type,
        refKind,
        refId: values.refId,
        label: values.label,
        location: values.location,
      });

      notify.success('Tạo mã QR mới thành công');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchData();
    } catch (err: any) {
      notify.serverError(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRevoke = (record: QrCodeItem) => {
    Modal.confirm({
      title: 'Xác nhận thu hồi mã QR',
      content: (
        <div>
          <p>
            Bạn có chắc chắn muốn thu hồi mã <strong>{record.label}</strong> ({record.publicId}) không?
          </p>
          <p style={{ color: '#DC2626', fontSize: 13 }}>
            Lưu ý: Mã QR vật lý đã in sẽ lập tức bị vô hiệu hoá và người dùng không thể quét được nữa.
          </p>
        </div>
      ),
      okText: 'Thu hồi',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await qrService.revokeQrCode(record.publicId);
          notify.success('Đã thu hồi mã QR thành công');
          fetchData();
        } catch (err: any) {
          notify.serverError(err);
        }
      },
    });
  };

  const handleRegenerate = (record: QrCodeItem) => {
    Modal.confirm({
      title: 'Xác nhận cấp lại mã QR mới',
      content: (
        <div>
          <p>
            Bạn có chắc chắn muốn cấp lại mã cho <strong>{record.label}</strong> không?
          </p>
          <p style={{ color: '#D97706', fontSize: 13 }}>
            Cảnh báo: Mã QR cũ đã in sẽ lập tức bị hủy bỏ và vô hiệu hóa. Bạn sẽ cần in lại mã QR mới này để dán vào vị trí thực tế.
          </p>
        </div>
      ),
      okText: 'Cấp lại mã',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const newDoc = await qrService.regenerateQrCode(record.publicId);
          notify.success('Cấp lại mã QR thành công');
          fetchData();
          if (newDoc) {
            setSelectedQr(newDoc);
            setViewModalOpen(true);
          }
        } catch (err: any) {
          notify.serverError(err);
        }
      },
    });
  };

  const downloadQrPng = (qrItem: QrCodeItem) => {
    const canvas = document.getElementById(`qr-canvas-${qrItem.publicId}`)?.querySelector('canvas');
    if (!canvas) {
      notify.warning('Không tìm thấy hình ảnh mã QR');
      return;
    }
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `qr-${qrItem.type.toLowerCase()}-${qrItem.publicId.slice(-6)}.png`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notify.success('Đã tải xuống ảnh mã QR');
  };

  const getHumanCode = (item: QrCodeItem) => {
    return `${item.type}-${item.publicId.slice(-6).toUpperCase()}`;
  };

  const columns: ColumnsType<QrCodeItem> = [
    {
      title: 'Loại mã',
      dataIndex: 'type',
      key: 'type',
      width: 160,
      render: (type) => <StatusTag type="qr_type" value={type} />,
    },
    {
      title: 'Nhãn hiển thị',
      dataIndex: 'label',
      key: 'label',
      render: (text, r) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ fontSize: 11, color: '#0F766E', fontFamily: 'monospace' }}>
            {getHumanCode(r)}
          </div>
        </div>
      ),
    },
    {
      title: 'Thực thể liên kết',
      dataIndex: 'refId',
      key: 'refId',
      width: 170,
      render: (refId, r) => (
        <span style={{ fontSize: 12 }}>
          <Text type="secondary">[{r.refKind}]</Text> {refId}
        </span>
      ),
    },
    {
      title: 'Vị trí dán',
      dataIndex: 'location',
      key: 'location',
      render: (loc) => loc || <Text type="secondary">—</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (active) => <StatusTag type="qr_status" value={active} />,
    },
    {
      title: 'Lượt quét',
      dataIndex: 'scanCount',
      key: 'scanCount',
      width: 100,
      align: 'right',
      render: (count) => <strong>{count ?? 0}</strong>,
    },
    {
      title: 'Quét lần cuối',
      dataIndex: 'lastScannedAt',
      key: 'lastScannedAt',
      width: 150,
      render: (val) => (val ? formatDateTime(val) : <Text type="secondary">Chưa quét</Text>),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (val) => formatDateTime(val),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem & In mã">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedQr(record);
                setViewModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Cấp lại mã mới">
            <Button
              type="text"
              icon={<ReloadOutlined style={{ color: '#D97706' }} />}
              onClick={() => handleRegenerate(record)}
            />
          </Tooltip>
          {record.isActive && (
            <Tooltip title="Thu hồi mã">
              <Button
                type="text"
                danger
                icon={<StopOutlined />}
                onClick={() => handleRevoke(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const filterContent = (
    <Row gutter={[16, 16]} align="middle">
      <Col xs={24} sm={10} md={8}>
        <Input
          placeholder="Tìm theo nhãn mã QR..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          prefix={<SearchOutlined />}
          allowClear
        />
      </Col>
      <Col xs={12} sm={7} md={6}>
        <Select
          placeholder="Lọc theo loại mã"
          style={{ width: '100%' }}
          allowClear
          value={typeFilter}
          onChange={(val) => {
            setTypeFilter(val);
            setPage(1);
          }}
          options={Object.entries(QR_TYPE_MAP).map(([key, meta]) => ({
            value: key,
            label: meta.label,
          }))}
        />
      </Col>
      <Col xs={12} sm={7} md={5}>
        <Select
          placeholder="Trạng thái"
          style={{ width: '100%' }}
          allowClear
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          options={[
            { value: 'true', label: 'Đang dùng' },
            { value: 'false', label: 'Đã thu hồi' },
          ]}
        />
      </Col>
      <Col xs={24} sm={24} md={5} style={{ textAlign: 'right' }}>
        <Button onClick={handleSearch} icon={<SearchOutlined />}>
          Tìm kiếm
        </Button>
      </Col>
    </Row>
  );

  return (
    <PageShell
      title="Quản lý Mã QR Dịch vụ"
      description="Quản lý sổ đăng ký mã QR trung tâm, cấp phát mã tĩnh cho các địa điểm và theo dõi lượt quét trên hệ thống."
      filterContent={filterContent}
      extraAction={
        <Space>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => setPrintModalOpen(true)}
          >
            In bộ mẫu
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ backgroundColor: '#0F766E' }}
            onClick={() => {
              createForm.resetFields();
              setCreateModalOpen(true);
            }}
          >
            Tạo mã mới
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (t) => `Tổng cộng ${t} mã QR`,
          onChange: (p, l) => {
            setPage(p);
            setLimit(l);
          },
        }}
        locale={{
          emptyText: (
            <Empty
              description="Chưa có mã QR nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                style={{ backgroundColor: '#0F766E' }}
                onClick={() => {
                  createForm.resetFields();
                  setCreateModalOpen(true);
                }}
              >
                Tạo mã đầu tiên
              </Button>
            </Empty>
          ),
        }}
      />

      {/* View QR Code Modal */}
      {selectedQr && (
        <Modal
          title={`Chi tiết Mã QR: ${selectedQr.label}`}
          open={viewModalOpen}
          onCancel={() => setViewModalOpen(false)}
          footer={[
            <Button
              key="download"
              icon={<DownloadOutlined />}
              onClick={() => downloadQrPng(selectedQr)}
            >
              Tải PNG
            </Button>,
            <Button
              key="print"
              type="primary"
              icon={<PrinterOutlined />}
              style={{ backgroundColor: '#0F766E' }}
              onClick={() => {
                const win = window.open('', '_blank');
                if (win) {
                  win.document.write(`
                    <html>
                    <head><title>Print QR - ${selectedQr.label}</title></head>
                    <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
                      <h2>${selectedQr.label}</h2>
                      <div style="padding:16px;border:2px dashed #999;">
                        ${document.getElementById(`qr-canvas-${selectedQr.publicId}`)?.innerHTML || ''}
                      </div>
                      <h3 style="font-family:monospace;margin-top:12px;">${getHumanCode(selectedQr)}</h3>
                      <p>${selectedQr.location || ''}</p>
                      <script>window.onload = function() { window.print(); window.close(); }</script>
                    </body>
                    </html>
                  `);
                  win.document.close();
                }
              }}
            >
              In mã này
            </Button>,
          ]}
        >
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div id={`qr-canvas-${selectedQr.publicId}`} style={{ display: 'inline-block', padding: 12, background: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <QRCode
                value={selectedQr.canonicalPayload || `SP1://${selectedQr.type}/${selectedQr.publicId}`}
                size={220}
                errorLevel="Q"
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ background: '#E6FFFA', padding: '8px 16px', borderRadius: 6, display: 'inline-block', border: '1px solid #99F6E4' }}>
                <span style={{ fontSize: 11, color: '#0F766E', display: 'block' }}>MÃ NHẬP TAY (HUMAN CODE):</span>
                <strong style={{ fontSize: 16, fontFamily: 'monospace', color: '#0D9488' }}>
                  {getHumanCode(selectedQr)}
                </strong>
              </div>
            </div>

            <div style={{ marginTop: 16, textAlign: 'left', background: '#F9FAFB', padding: 12, borderRadius: 6, fontSize: 12 }}>
              <p style={{ margin: '4px 0' }}><strong>Loại dịch vụ:</strong> <StatusTag type="qr_type" value={selectedQr.type} /></p>
              <p style={{ margin: '4px 0' }}><strong>Thực thể liên kết:</strong> [{selectedQr.refKind}] {selectedQr.refId}</p>
              <p style={{ margin: '4px 0' }}><strong>Vị trí:</strong> {selectedQr.location || '—'}</p>
              <p style={{ margin: '4px 0' }}><strong>Trạng thái:</strong> <StatusTag type="qr_status" value={selectedQr.isActive} /></p>
              <p style={{ margin: '4px 0', wordBreak: 'break-all' }}>
                <strong>Chuỗi Canonical:</strong> <Text code copyable>{selectedQr.canonicalPayload}</Text>
              </p>
              <p style={{ margin: '4px 0', wordBreak: 'break-all' }}>
                <strong>Chuỗi Bare:</strong> <Text code copyable>{selectedQr.barePayload}</Text>
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Create QR Modal */}
      <Modal
        title="Tạo mã QR Dịch vụ mới"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        confirmLoading={createLoading}
        onOk={() => createForm.submit()}
        okText="Tạo mã"
        cancelText="Hủy"
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
          initialValues={{ type: 'CANTEEN_POINT' }}
        >
          <Form.Item
            name="type"
            label="Loại dịch vụ QR"
            rules={[{ required: true, message: 'Vui lòng chọn loại dịch vụ' }]}
          >
            <Select
              options={[
                { value: 'CANTEEN_POINT', label: 'Điểm Căng tin (CANTEEN_POINT)' },
                { value: 'BOOK', label: 'Sách thư viện (BOOK)' },
                { value: 'PARKING_IN', label: 'Cổng vào bãi xe (PARKING_IN)' },
                { value: 'PARKING_OUT', label: 'Cổng ra bãi xe (PARKING_OUT)' },
                { value: 'ROOM', label: 'Phòng học (ROOM)' },
                { value: 'EVENT', label: 'Poster Sự kiện (EVENT)' },
                { value: 'GATE_IN', label: 'Vào cổng trường (GATE_IN)' },
                { value: 'GATE_OUT', label: 'Ra cổng trường (GATE_OUT)' },
              ]}
              onChange={() => {
                createForm.setFieldsValue({ refId: undefined, label: undefined });
              }}
            />
          </Form.Item>

          {/* Server-fed Entity Select */}
          {selectedType === 'BOOK' && (
            <Form.Item
              name="refId"
              label="Chọn cuốn sách từ Thư viện"
              rules={[{ required: true, message: 'Vui lòng chọn cuốn sách' }]}
            >
              <Select
                showSearch
                placeholder="Chọn cuốn sách..."
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={booksList.map((b) => ({
                  value: b.bookCode,
                  label: `${b.bookTitle} (${b.bookCode})`,
                }))}
                onChange={(val) => {
                  const b = booksList.find((x) => x.bookCode === val);
                  if (b) createForm.setFieldsValue({ label: b.bookTitle });
                }}
              />
            </Form.Item>
          )}

          {selectedType === 'ROOM' && (
            <Form.Item
              name="refId"
              label="Chọn phòng học"
              rules={[{ required: true, message: 'Vui lòng chọn phòng học' }]}
            >
              <Select
                placeholder="Chọn phòng học..."
                options={[
                  'Phòng học nhóm A101',
                  'Phòng học nhóm A102',
                  'Phòng Lab Tin học B201',
                  'Phòng Lab Tin học B202',
                  'Hội trường Thư viện C301',
                  'Phòng Nghiên cứu D101',
                  'Lab 102',
                  'Lab 201',
                  'Lab 302',
                  'Phòng 402',
                  'Phòng 405',
                  'Phòng 501',
                ].map((r) => ({ value: r, label: r }))}
                onChange={(val) => createForm.setFieldsValue({ label: val })}
              />
            </Form.Item>
          )}

          {selectedType === 'EVENT' && (
            <Form.Item
              name="refId"
              label="Chọn sự kiện sắp tới"
              rules={[{ required: true, message: 'Vui lòng chọn sự kiện' }]}
            >
              <Select
                placeholder="Chọn sự kiện..."
                options={eventsList.map((ev) => ({
                  value: ev._id,
                  label: `${ev.title} (${ev.location || 'Hội trường'})`,
                }))}
                onChange={(val) => {
                  const ev = eventsList.find((x) => x._id === val);
                  if (ev) createForm.setFieldsValue({ label: ev.title, location: ev.location });
                }}
              />
            </Form.Item>
          )}

          {(selectedType === 'CANTEEN_POINT' ||
            selectedType === 'PARKING_IN' ||
            selectedType === 'PARKING_OUT' ||
            selectedType === 'GATE_IN' ||
            selectedType === 'GATE_OUT') && (
            <Form.Item
              name="refId"
              label="Mã định danh vị trí / quầy"
              rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập mã định danh' }]}
            >
              <Select
                options={
                  selectedType === 'CANTEEN_POINT'
                    ? [
                        { value: 'CANTEEN-POS-01', label: 'CANTEEN-POS-01 (Quầy Căng tin Số 1)' },
                        { value: 'CANTEEN-POS-02', label: 'CANTEEN-POS-02 (Quầy Căng tin Số 2)' },
                        { value: 'CANTEEN-POS-CAFE', label: 'CANTEEN-POS-CAFE (Quầy Cà phê & Đồ uống)' },
                      ]
                    : selectedType === 'PARKING_IN'
                    ? [
                        { value: 'GATE-PARK-IN-01', label: 'GATE-PARK-IN-01 (Cổng giữ xe vào 01)' },
                        { value: 'GATE-PARK-IN-02', label: 'GATE-PARK-IN-02 (Cổng giữ xe vào 02)' },
                      ]
                    : selectedType === 'PARKING_OUT'
                    ? [
                        { value: 'GATE-PARK-OUT-01', label: 'GATE-PARK-OUT-01 (Cổng giữ xe ra 01)' },
                        { value: 'GATE-PARK-OUT-02', label: 'GATE-PARK-OUT-02 (Cổng giữ xe ra 02)' },
                      ]
                    : selectedType === 'GATE_IN'
                    ? [
                        { value: 'CAMPUS-GATE-IN-01', label: 'CAMPUS-GATE-IN-01 (Turnstile Cổng chính - Vào)' },
                        { value: 'CAMPUS-GATE-IN-02', label: 'CAMPUS-GATE-IN-02 (Cổng phụ Ký túc xá - Vào)' },
                      ]
                    : [
                        { value: 'CAMPUS-GATE-OUT-01', label: 'CAMPUS-GATE-OUT-01 (Turnstile Cổng chính - Ra)' },
                        { value: 'CAMPUS-GATE-OUT-02', label: 'CAMPUS-GATE-OUT-02 (Cổng phụ Ký túc xá - Ra)' },
                      ]
                }
                onChange={(val, opt: any) => {
                  createForm.setFieldsValue({ label: opt?.label?.split('(')[1]?.replace(')', '') || val });
                }}
              />
            </Form.Item>
          )}

          <Form.Item
            name="label"
            label="Nhãn hiển thị (Tên mã QR)"
            rules={[{ required: true, message: 'Vui lòng nhập nhãn hiển thị' }]}
          >
            <Input placeholder="Ví dụ: Quầy Căng tin Số 1, Sách Clean Code..." />
          </Form.Item>

          <Form.Item name="location" label="Vị trí đặt mã vật lý">
            <Input placeholder="Ví dụ: Tầng 1 Nhà Căng tin, Kệ sách Tầng 2..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Print Sheet Modal */}
      <Modal
        title="In bộ mã QR Dịch vụ (Khổ A4)"
        open={printModalOpen}
        onCancel={() => setPrintModalOpen(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPrintModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            style={{ backgroundColor: '#0F766E' }}
            onClick={() => {
              const printContent = document.getElementById('printable-sheets-container')?.innerHTML;
              const win = window.open('', '_blank');
              if (win) {
                win.document.write(`
                  <html>
                  <head>
                    <title>Bộ mã QR Dịch vụ SmartPass</title>
                    <style>
                      @page { size: A4; margin: 10mm; }
                      body { font-family: sans-serif; margin: 0; }
                      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
                      .card { border: 1.5px dashed #888; border-radius: 8px; padding: 12px; text-align: center; }
                      .human { font-family: monospace; font-size: 14px; font-weight: bold; color: #0f766e; }
                    </style>
                  </head>
                  <body>
                    <div class="grid">
                      ${printContent || ''}
                    </div>
                    <script>window.onload = function() { window.print(); window.close(); }</script>
                  </body>
                  </html>
                `);
                win.document.close();
              }
            }}
          >
            In ngay (A4 100%)
          </Button>,
        ]}
      >
        <p style={{ color: '#4B5563', fontSize: 13 }}>
          Bộ mã dưới đây hiển thị các mã QR đang hoạt động ({data.filter((d) => d.isActive).length} mã). Mỗi trang A4 sẽ chứa 4 mã được định dạng chuẩn với kích thước quét từ 50 mm trở lên kèm mã nhập tay.
        </p>
        <div
          id="printable-sheets-container"
          style={{
            maxHeight: '60vh',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            padding: 8,
          }}
        >
          {data
            .filter((d) => d.isActive)
            .map((item) => (
              <div
                key={item._id}
                style={{
                  border: '1.5px dashed #D1D5DB',
                  borderRadius: 8,
                  padding: 12,
                  textAlign: 'center',
                  background: '#F9FAFB',
                }}
              >
                <StatusTag type="qr_type" value={item.type} />
                <div style={{ fontWeight: 600, fontSize: 13, margin: '6px 0', minHeight: 36 }}>
                  {item.label}
                </div>
                <div style={{ display: 'inline-block', background: 'white', padding: 8, borderRadius: 6, border: '1px solid #E5E7EB' }}>
                  <QRCode
                    value={item.canonicalPayload || `SP1://${item.type}/${item.publicId}`}
                    size={130}
                    errorLevel="Q"
                  />
                </div>
                <div style={{ marginTop: 6, background: '#E6FFFA', padding: '4px 8px', borderRadius: 4 }}>
                  <span style={{ fontSize: 9, color: '#0F766E', display: 'block' }}>MÃ NHẬP TAY:</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: 13, color: '#0D9488' }}>
                    {getHumanCode(item)}
                  </strong>
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                  {item.location || item.refId}
                </div>
              </div>
            ))}
        </div>
      </Modal>
    </PageShell>
  );
};
