// Standardization mapping tables for labels and colors

export interface StatusMeta {
  label: string;
  color: string;
}

export const ROLE_MAP: Record<string, StatusMeta> = {
  admin: { label: 'Quản trị viên', color: 'red' },
  student: { label: 'Học sinh', color: 'blue' },
  librarian: { label: 'Thủ thư', color: 'purple' },
  canteen_staff: { label: 'Nhân viên căn tin', color: 'orange' },
  parking_staff: { label: 'Nhân viên bãi xe', color: 'cyan' },
};

export const CARD_STATUS_MAP: Record<string, StatusMeta> = {
  active: { label: 'Đang hoạt động', color: 'green' },
  locked: { label: 'Đã khóa', color: 'red' },
  expired: { label: 'Hết hạn', color: 'default' },
  lost: { label: 'Báo mất', color: 'volcano' },
};

export const ACCESS_LOG_ACTION_MAP: Record<string, string> = {
  entry: 'Vào cổng',
  exit: 'Ra cổng',
  attendance: 'Điểm danh',
  library_borrow: 'Mượn sách',
  library_return: 'Trả sách',
  canteen_pay: 'Thanh toán căn tin',
  parking_in: 'Gửi xe vào',
  parking_out: 'Gửi xe ra',
  room_booking: 'Đặt phòng',
  event_register: 'Đăng ký sự kiện',
  emergency_view: 'Xem thẻ khẩn cấp',
};

export const ATTENDANCE_STATUS_MAP: Record<string, StatusMeta> = {
  present: { label: 'Có mặt', color: 'green' },
  late: { label: 'Đi muộn', color: 'orange' },
};

export const LIBRARY_LOAN_STATUS_MAP: Record<string, StatusMeta> = {
  borrowed: { label: 'Đang mượn', color: 'blue' },
  returned: { label: 'Đã trả', color: 'green' },
  overdue: { label: 'Quá hạn', color: 'red' },
};

export const CANTEEN_TX_TYPE_MAP: Record<string, { label: string; color: string; prefix: string }> = {
  topup: { label: 'Nạp tiền', color: 'green', prefix: '+' },
  pay: { label: 'Thanh toán', color: 'red', prefix: '-' },
};

export const PARKING_STATUS_MAP: Record<string, StatusMeta> = {
  in: { label: 'Đang gửi', color: 'blue' },
  out: { label: 'Đã lấy xe', color: 'default' },
};

export const ROOM_BOOKING_STATUS_MAP: Record<string, StatusMeta> = {
  pending: { label: 'Chờ duyệt', color: 'gold' },
  approved: { label: 'Đã duyệt', color: 'green' },
  rejected: { label: 'Đã từ chối', color: 'red' },
  cancelled: { label: 'Đã hủy', color: 'default' },
};

export const NOTIFICATION_AUDIENCE_MAP: Record<string, string> = {
  all: 'Toàn trường',
  class: 'Theo lớp',
  individual: 'Cá nhân',
};

export const DAY_OF_WEEK_MAP: Record<number, string> = {
  2: 'Thứ 2',
  3: 'Thứ 3',
  4: 'Thứ 4',
  5: 'Thứ 5',
  6: 'Thứ 6',
  7: 'Thứ 7',
  8: 'Chủ nhật',
};

export const ACCOUNT_STATE_MAP: Record<string, StatusMeta> = {
  true: { label: 'Đang hoạt động', color: 'green' },
  false: { label: 'Đã vô hiệu hoá', color: 'default' },
};

export const QR_TYPE_MAP: Record<string, StatusMeta> = {
  CANTEEN_POINT: { label: 'Điểm Căng tin', color: 'orange' },
  PAYMENT_REQUEST: { label: 'Yêu cầu thanh toán', color: 'volcano' },
  BOOK: { label: 'Sách thư viện', color: 'purple' },
  PARKING_IN: { label: 'Vào bãi xe', color: 'cyan' },
  PARKING_OUT: { label: 'Ra bãi xe', color: 'blue' },
  ATTENDANCE_SESSION: { label: 'Điểm danh buổi học', color: 'geekblue' },
  ROOM: { label: 'Phòng học', color: 'green' },
  EVENT: { label: 'Poster Sự kiện', color: 'magenta' },
  EVENT_CHECKIN: { label: 'Check-in Sự kiện', color: 'gold' },
  GATE_IN: { label: 'Vào cổng trường', color: 'teal' },
  GATE_OUT: { label: 'Ra cổng trường', color: 'default' },
};

export const QR_STATUS_MAP: Record<string, StatusMeta> = {
  true: { label: 'Đang dùng', color: 'green' },
  false: { label: 'Đã thu hồi', color: 'default' },
};

export const EMPTY_TEXT = 'Chưa có dữ liệu';

