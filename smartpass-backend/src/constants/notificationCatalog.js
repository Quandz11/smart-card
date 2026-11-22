/**
 * Notification Catalog & Template Registry
 * Single wording source server-side for all notification types.
 * Money format: "150.000 ₫"
 * Date format: "DD/MM/YYYY HH:mm"
 */

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 ₫';
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  return `${day}/${month}/${year} ${hours}:${mins}`;
};

const CATEGORIES = {
  WALLET: 'WALLET',
  CARD: 'CARD',
  LIBRARY: 'LIBRARY',
  PARKING: 'PARKING',
  ROOM: 'ROOM',
  EVENT: 'EVENT',
  SCHEDULE_ATTENDANCE: 'SCHEDULE_ATTENDANCE',
  SECURITY: 'SECURITY',
  SYSTEM: 'SYSTEM',
};

const CATALOG = {
  // WALLET, PIN AND VNPAY
  WALLET_TOPUP_STAFF: {
    category: CATEGORIES.WALLET,
    priority: 'NORMAL',
    title: 'Nạp tiền thành công',
    body: 'Ví của bạn vừa được nạp {amount} tại quầy. Số dư mới: {balance}.',
    actionRoute: '/wallet',
  },
  WALLET_TOPUP_VNPAY: {
    category: CATEGORIES.WALLET,
    priority: 'NORMAL',
    title: 'Nạp tiền VNPay thành công',
    body: 'Giao dịch nạp {amount} qua VNPay đã hoàn tất. Số dư mới: {balance}.',
    actionRoute: '/wallet',
  },
  WALLET_PAYMENT: {
    category: CATEGORIES.WALLET,
    priority: 'NORMAL',
    title: 'Thanh toán thành công',
    body: 'Bạn vừa thanh toán {amount} tại {place}. Số dư còn lại: {balance}.',
    actionRoute: '/wallet',
  },
  PIN_SET: {
    category: CATEGORIES.WALLET,
    priority: 'NORMAL',
    title: 'Đã thiết lập mã PIN ví',
    body: 'Mã PIN ví của bạn đã được thiết lập.',
    actionRoute: '/profile',
  },
  PIN_CHANGED: {
    category: CATEGORIES.WALLET,
    priority: 'HIGH',
    title: 'Mã PIN ví đã được thay đổi',
    body: 'Mã PIN ví của bạn vừa được thay đổi. Nếu không phải bạn thực hiện, hãy liên hệ nhà trường ngay.',
    actionRoute: '/profile',
  },
  PIN_LOCKED: {
    category: CATEGORIES.WALLET,
    priority: 'HIGH',
    title: 'Mã PIN ví tạm thời bị khoá',
    body: 'Mã PIN ví bị khoá 15 phút do nhập sai nhiều lần.',
    actionRoute: '/profile',
  },

  // CARD
  CARD_ISSUED: {
    category: CATEGORIES.CARD,
    priority: 'NORMAL',
    title: 'Thẻ đã được phát hành',
    body: 'Thẻ SmartPass {cardCode} của bạn đã được kích hoạt.',
    actionRoute: '/cards',
  },
  CARD_LOCKED: {
    category: CATEGORIES.CARD,
    priority: 'URGENT',
    title: 'Thẻ của bạn đã bị khoá',
    body: 'Thẻ {cardCode} đã bị khoá. Liên hệ nhà trường để được hỗ trợ.',
    actionRoute: '/cards',
  },
  CARD_UNLOCKED: {
    category: CATEGORIES.CARD,
    priority: 'NORMAL',
    title: 'Thẻ đã được mở khoá',
    body: 'Thẻ {cardCode} của bạn đã hoạt động trở lại.',
    actionRoute: '/cards',
  },
  CARD_LOST: {
    category: CATEGORIES.CARD,
    priority: 'URGENT',
    title: 'Thẻ đã được báo mất',
    body: 'Thẻ {cardCode} đã được đánh dấu mất và không thể sử dụng.',
    actionRoute: '/cards',
  },
  CARD_EXPIRING: {
    category: CATEGORIES.CARD,
    priority: 'HIGH',
    title: 'Thẻ sắp hết hạn',
    body: 'Thẻ {cardCode} sẽ hết hạn vào {date}. Vui lòng gia hạn sớm.',
    actionRoute: '/cards',
  },
  CARD_EXPIRED: {
    category: CATEGORIES.CARD,
    priority: 'HIGH',
    title: 'Thẻ đã hết hạn',
    body: 'Thẻ {cardCode} đã hết hạn vào {date}.',
    actionRoute: '/cards',
  },

  // LIBRARY
  BOOK_BORROWED: {
    category: CATEGORIES.LIBRARY,
    priority: 'NORMAL',
    title: 'Mượn sách thành công',
    body: 'Bạn đã mượn sách {bookTitle}. Hạn trả: {dueDate}.',
    actionRoute: '/library',
  },
  BOOK_RETURNED: {
    category: CATEGORIES.LIBRARY,
    priority: 'NORMAL',
    title: 'Trả sách thành công',
    body: 'Bạn đã trả sách {bookTitle}.',
    actionRoute: '/library',
  },
  BOOK_DUE_SOON: {
    category: CATEGORIES.LIBRARY,
    priority: 'NORMAL',
    title: 'Sách sắp đến hạn trả',
    body: 'Sách {bookTitle} đến hạn trả vào {dueDate}.',
    actionRoute: '/library',
  },
  BOOK_OVERDUE: {
    category: CATEGORIES.LIBRARY,
    priority: 'HIGH',
    title: 'Sách đã quá hạn',
    body: 'Sách {bookTitle} đã quá hạn {days} ngày. Vui lòng trả sớm.',
    actionRoute: '/library',
  },
  BOOK_OVERDUE_STAFF: {
    category: CATEGORIES.LIBRARY,
    priority: 'HIGH',
    title: 'Sách quá hạn',
    body: 'Học sinh {studentName} quá hạn trả sách {bookTitle} {days} ngày.',
    actionRoute: '/library',
    defaultAudience: 'role',
    defaultRole: 'librarian',
  },

  // PARKING
  PARKING_CHECKIN: {
    category: CATEGORIES.PARKING,
    priority: 'NORMAL',
    title: 'Xe đã vào bãi',
    body: 'Xe {plate} đã vào bãi lúc {time}.',
    actionRoute: '/parking',
  },
  PARKING_CHECKOUT: {
    category: CATEGORIES.PARKING,
    priority: 'NORMAL',
    title: 'Xe đã ra bãi',
    body: 'Xe {plate} đã ra bãi. Phí gửi xe: {fee}.',
    actionRoute: '/parking',
  },

  // ROOM BOOKING
  ROOM_BOOKING_PENDING: {
    category: CATEGORIES.ROOM,
    priority: 'NORMAL',
    title: 'Đặt phòng chờ duyệt',
    body: '{studentName} đặt phòng {roomName} từ {start} đến {end}.',
    actionRoute: '/room-bookings',
    defaultAudience: 'role',
    defaultRole: 'admin',
  },
  ROOM_BOOKING_APPROVED: {
    category: CATEGORIES.ROOM,
    priority: 'NORMAL',
    title: 'Đặt phòng đã được duyệt',
    body: 'Phòng {roomName} từ {start} đến {end} đã được duyệt.',
    actionRoute: '/room-bookings',
  },
  ROOM_BOOKING_REJECTED: {
    category: CATEGORIES.ROOM,
    priority: 'NORMAL',
    title: 'Đặt phòng bị từ chối',
    body: 'Yêu cầu đặt phòng {roomName} từ {start} đến {end} đã bị từ chối.',
    actionRoute: '/room-bookings',
  },
  ROOM_BOOKING_CANCELLED: {
    category: CATEGORIES.ROOM,
    priority: 'NORMAL',
    title: 'Đặt phòng đã bị huỷ',
    body: 'Đặt phòng {roomName} từ {start} đến {end} đã bị huỷ.',
    actionRoute: '/room-bookings',
  },

  // EVENTS
  EVENT_ANNOUNCED: {
    category: CATEGORIES.EVENT,
    priority: 'NORMAL',
    title: 'Sự kiện mới',
    body: '{eventName} — {start}. Đăng ký trong ứng dụng.',
    actionRoute: '/events',
  },
  EVENT_REGISTERED: {
    category: CATEGORIES.EVENT,
    priority: 'NORMAL',
    title: 'Đăng ký sự kiện thành công',
    body: 'Bạn đã đăng ký {eventName}.',
    actionRoute: '/events',
  },
  EVENT_CANCELLED: {
    category: CATEGORIES.EVENT,
    priority: 'HIGH',
    title: 'Sự kiện đã bị huỷ',
    body: 'Sự kiện {eventName} đã bị huỷ.',
    actionRoute: '/events',
  },
  EVENT_REMINDER: {
    category: CATEGORIES.EVENT,
    priority: 'NORMAL',
    title: 'Sắp diễn ra sự kiện',
    body: '{eventName} bắt đầu lúc {start}.',
    actionRoute: '/events',
  },

  // TIMETABLE AND ATTENDANCE
  SCHEDULE_CHANGED: {
    category: CATEGORIES.SCHEDULE_ATTENDANCE,
    priority: 'NORMAL',
    title: 'Lịch học thay đổi',
    body: 'Môn {subject} ngày {date} đã thay đổi: {detail}.',
    actionRoute: '/schedule',
  },
  ATTENDANCE_SESSION_OPENED: {
    category: CATEGORIES.SCHEDULE_ATTENDANCE,
    priority: 'NORMAL',
    title: 'Buổi điểm danh đã mở',
    body: 'Buổi học {subject} đã mở điểm danh. Mã QR có hiệu lực 15 phút.',
    actionRoute: '/attendance',
  },
  ATTENDANCE_CHECKED_IN: {
    category: CATEGORIES.SCHEDULE_ATTENDANCE,
    priority: 'NORMAL',
    title: 'Điểm danh thành công',
    body: 'Bạn đã điểm danh buổi {subject} lúc {time} — trạng thái: {status}.',
    actionRoute: '/attendance',
  },
  ATTENDANCE_MARKED: {
    category: CATEGORIES.SCHEDULE_ATTENDANCE,
    priority: 'NORMAL',
    title: 'Kết quả điểm danh',
    body: 'Buổi {subject} ngày {date}: {status}.',
    actionRoute: '/attendance',
  },
  ATTENDANCE_CORRECTED: {
    category: CATEGORIES.SCHEDULE_ATTENDANCE,
    priority: 'HIGH',
    title: 'Điểm danh đã được sửa',
    body: 'Trạng thái buổi {subject} ngày {date} đã đổi thành {status}. Lý do: {reason}.',
    actionRoute: '/attendance',
  },

  // SECURITY AND ACCOUNT
  PASSWORD_CHANGED: {
    category: CATEGORIES.SECURITY,
    priority: 'HIGH',
    title: 'Mật khẩu đã được thay đổi',
    body: 'Mật khẩu tài khoản của bạn vừa được thay đổi. Nếu không phải bạn, hãy liên hệ nhà trường ngay.',
    actionRoute: '/profile',
  },
  LOGIN_NEW_DEVICE: {
    category: CATEGORIES.SECURITY,
    priority: 'HIGH',
    title: 'Đăng nhập từ thiết bị mới',
    body: 'Tài khoản của bạn vừa đăng nhập trên một thiết bị mới lúc {time}.',
    actionRoute: '/profile',
  },
  ROLE_CHANGED: {
    category: CATEGORIES.SECURITY,
    priority: 'HIGH',
    title: 'Quyền tài khoản đã thay đổi',
    body: 'Vai trò của bạn đã được đổi thành {role}.',
    actionRoute: '/profile',
  },
  ACCOUNT_DEACTIVATED: {
    category: CATEGORIES.SECURITY,
    priority: 'URGENT',
    title: 'Tài khoản đã bị vô hiệu hoá',
    body: 'Tài khoản của bạn đã bị vô hiệu hoá. Liên hệ nhà trường để biết thêm chi tiết.',
    actionRoute: '/profile',
  },
  EMERGENCY_VIEWED: {
    category: CATEGORIES.SECURITY,
    priority: 'HIGH',
    title: 'Thẻ khẩn cấp vừa được xem',
    body: 'Thông tin khẩn cấp của bạn vừa được mở từ mã QR lúc {time}.',
    actionRoute: '/emergency',
  },

  // SYSTEM AND ADMIN ANNOUNCEMENTS
  SYSTEM_ANNOUNCEMENT: {
    category: CATEGORIES.SYSTEM,
    priority: 'NORMAL',
    title: 'Thông báo từ nhà trường',
    body: '{body}',
    actionRoute: '/notifications',
  },
  SYSTEM_MAINTENANCE: {
    category: CATEGORIES.SYSTEM,
    priority: 'HIGH',
    title: 'Bảo trì hệ thống',
    body: 'Hệ thống sẽ bảo trì từ {start} đến {end}. Một số tính năng có thể gián đoạn.',
    actionRoute: '/notifications',
  },
};

/**
 * Render title and body with placeholder substitution.
 */
const renderTemplate = (template, data = {}) => {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (data[key] !== undefined && data[key] !== null) {
      return String(data[key]);
    }
    return match;
  });
};

const getCatalogEntry = (type) => {
  return CATALOG[type] || CATALOG.SYSTEM_ANNOUNCEMENT;
};

module.exports = {
  CATEGORIES,
  CATALOG,
  formatCurrency,
  formatDate,
  renderTemplate,
  getCatalogEntry,
};

