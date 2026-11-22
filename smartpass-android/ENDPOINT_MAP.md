# SmartPass Android — Bản đồ API (ENDPOINT_MAP)

Bản đồ liên kết toàn bộ màn hình của ứng dụng SmartPass Android với REST API backend thực tế (Node.js/Express trên cổng 3000).
Nguyên tắc: **Chỉ sử dụng endpoint có thật. Không tự bịa endpoint, không mock data.**

---

## 1. Màn hình Sinh viên / Học sinh (Student Screens)

| Mã | Màn hình | Phương thức & Đường dẫn | Quyền (Role) | Dữ liệu trả về sử dụng | Ghi chú trạng thái |
|---|---|---|---|---|---|
| **S1** | **Trang chủ (Home)** | `GET /api/auth/me` | `student` | `fullName`, `studentCode`, `className`, `role`, `avatarUrl`, `card` | Thông tin người dùng & thẻ liên kết |
| | | `GET /api/wallet/me` | `student` | `balance`, `currency` | Số dư ví thực tế |
| | | `GET /api/schedules/my` | `student` | `[ { subject, room, startTime, endTime, dayOfWeek } ]` | Lịch học trong ngày (filter client theo thứ) |
| | | `GET /api/notifications/my` | `student` | `[ { _id, isRead } ]` | Đếm thông báo chưa đọc cho badge chuông |
| **S2** | **Thẻ của tôi (My Card)** | `GET /api/auth/me` | `student` | `card: { _id, cardCode, status, expiresAt, qrToken }` | Hiển thị thẻ điện tử & QR token |
| | | `PATCH /api/cards/:id/lost` | `student` | `card: { status: "lost" }` | Báo mất thẻ |
| | | *MISSING ENDPOINT: `PATCH /api/cards/me/lock`* | - | - | Backend chỉ có khóa/mở khóa cho `admin`. Thẻ của học sinh chỉ hiển thị trạng thái và nút Báo mất (`lost`). |
| **S3** | **Điểm danh của tôi (Attendance)**| `GET /api/attendance/my` | `student` | `[ { classSession, subject, status, markedAt } ]` | Lịch sử điểm danh cá nhân |
| **S4** | **Thư viện (Library)** | `GET /api/library/my-loans` | `student` | `[ { bookTitle, bookCode, borrowedAt, dueAt, returnedAt, status } ]` | Danh sách mượn sách & cảnh báo quá hạn |
| | | *MISSING ENDPOINT: `GET /api/library/books`* | - | - | Backend không có endpoint danh mục/tra cứu sách. Màn hình chỉ hiển thị sách đã mượn theo đúng hợp đồng. |
| **S5** | **Ví & Căn tin (Wallet)** | `GET /api/wallet/me` | `student` | `balance`, `currency` | Số dư ví |
| | | `GET /api/wallet/transactions` | `student` | `[ { type, amount, balanceAfter, note, createdAt } ]` | Lịch sử giao dịch ví |
| | | *MISSING ENDPOINT: `POST /api/wallet/student-topup`* | - | - | Không có cổng thanh toán nạp tiền online. Học sinh nạp tiền trực tiếp qua nhân viên căn tin/quản trị viên. |
| **S6** | **Gửi xe của tôi (Parking)** | `GET /api/parking/my` | `student` | `[ { vehiclePlate, checkInAt, checkOutAt, fee, status } ]` | Phiên đang gửi (status: "in") và lịch sử |
| **S7** | **Mượn phòng (Room Booking)** | `GET /api/rooms/availability` | `student` | `[ { startTime, endTime, purpose } ]` | Tra cứu slot bận theo phòng & ngày |
| | | `POST /api/room-bookings` | `student` | `_id`, `room`, `date`, `startTime`, `endTime`, `status` | Đăng ký mượn phòng (HTTP 409 nếu trùng) |
| | | `GET /api/room-bookings/my` | `student` | `[ { _id, room, date, startTime, endTime, status, purpose } ]`| Lịch sử mượn phòng cá nhân |
| | | `PATCH /api/room-bookings/:id/cancel` | `student`| `_id`, `status: "cancelled"` | Hủy yêu cầu mượn phòng |
| **S8** | **Sự kiện (Events)** | `GET /api/events` | `student` | `[ { _id, title, description, location, startAt, endAt, capacity, registeredCount } ]` | Danh sách sự kiện sắp diễn ra |
| | | `GET /api/events/my` | `student` | `[ { _id, title, ... } ]` | Danh sách sự kiện tôi đã đăng ký |
| | | `POST /api/events/:id/register` | `student` | `{ success: true }` | Đăng ký tham gia sự kiện |
| **S9** | **Thời khóa biểu (Timetable)** | `GET /api/schedules/my` | `student` | `[ { className, subject, teacher, room, dayOfWeek, startTime, endTime, semester } ]` | Toàn bộ thời khóa biểu theo thứ |
| **S10**| **Thông báo (Notifications)** | `GET /api/notifications/my` | `student` | `[ { _id, title, body, audience, isRead, createdAt } ]` | Danh sách thông báo học đường |
| | | `PATCH /api/notifications/:id/read` | `student`| `{ success: true }` | Đánh dấu thông báo đã đọc |
| **S11**| **Cá nhân & Cài đặt (Profile)** | `GET /api/auth/me` | `student` | `fullName`, `email`, `studentCode`, `className`, `phone`, `role` | Thông tin hồ sơ cá nhân |
| | | `PATCH /api/auth/change-password` | `student` | `{ success: true }` | Đổi mật khẩu |
| | | `GET /` | Công khai | `{ success: true, message: "SmartPass API is running" }` | Kiểm tra trạng thái kết nối mạng |
| **S12**| **Thẻ khẩn cấp (Emergency Card)**| `GET /api/emergency/me` | `student` | `fullName`, `emergencyContactName`, `emergencyContactPhone`, `allergies`, `bloodType`, `insuranceInfo`, `visibleFields`, `isEnabled`, `qrToken` | Hồ sơ y tế khẩn cấp cá nhân |
| | | `PUT /api/emergency/me` | `student` | Hồ sơ cập nhật | Lưu cấu hình quyền riêng tư visibleFields |
| | | `POST /api/emergency/me/rotate-qr` | `student`| `{ qrToken }` | Đổi mã QR Token khẩn cấp mới |

---

## 2. Màn hình Vận hành cho Nhân viên (Staff Operation Screens)

| Mã | Màn hình | Phương thức & Đường dẫn | Quyền (Role) | Dữ liệu trả về sử dụng | Ghi chú trạng thái |
|---|---|---|---|---|---|
| **T1** | **Bảng vận hành (Staff Home)** | `GET /api/auth/me` | `staff` / `admin` | `role`, `fullName` | Phân quyền hiển thị ô chức năng phù hợp vai trò |
| | | `GET /api/parking/active` | `parking_staff` | `[ { _id, vehiclePlate, checkInAt, card } ]` | Thống kê xe đang đỗ trong bãi |
| | | `GET /api/library/loans` | `librarian` | `[ { _id, bookTitle, status } ]` | Danh sách lưu thông mượn sách gần đây |
| | | *MISSING ENDPOINT: `GET /api/wallet/transactions/canteen`* | `canteen_staff` | - | Backend chỉ có `/api/wallet/transactions/all` cho `admin`. Nhân viên căn tin xem log giao dịch qua verify thẻ. |
| **T2** | **Điểm danh học sinh (Attendance Check)** | `POST /api/cards/verify` | `staff` | `owner: { fullName, studentCode, className }, card: { status }` | Bước 1: Xác thực thẻ học sinh |
| | | `POST /api/attendance/check` | `staff` | `{ student, classSession, subject, status }` | Bước 2: Ghi nhận có mặt (409 nếu trùng) |
| **T3** | **Thao tác thư viện (Library Ops)** | `POST /api/cards/verify` | `librarian` | `owner, card` | Xác thực thẻ bạn đọc |
| | | `POST /api/library/borrow` | `librarian` | `borrowedAt, dueAt` | Mượn sách (400 nếu vượt quá 3 cuốn) |
| | | `POST /api/library/return` | `librarian` | `returnedAt, overdue` | Trả sách (cảnh báo quá hạn nếu overdue) |
| **T4** | **Thao tác căn tin (Canteen Ops)** | `POST /api/cards/verify` | `canteen_staff`| `owner, card` | Xác thực thẻ học sinh |
| | | `POST /api/wallet/pay` | `canteen_staff`| `transaction, balance` | Trừ tiền căn tin (400 nếu không đủ số dư) |
| | | `POST /api/wallet/topup` | `canteen_staff`| `wallet, balance` | Nạp tiền vào ví cho học sinh |
| **T5** | **Thao tác bãi xe (Parking Ops)** | `POST /api/cards/verify` | `parking_staff`| `owner, card` | Xác thực thẻ xe |
| | | `POST /api/parking/check-in` | `parking_staff`| `session: { checkInAt, vehiclePlate }` | Ghi nhận xe vào bãi |
| | | `POST /api/parking/check-out` | `parking_staff`| `session: { checkInAt, checkOutAt, fee }` | Ghi nhận xe ra và tính phí thực tế |
| **T6** | **Duyệt mượn phòng (Booking Approval)** | `PATCH /api/room-bookings/:id/approve` | `admin` | `status: "approved"` | Duyệt mượn phòng (INV-08: PATCH không kèm body) |
| | | `PATCH /api/room-bookings/:id/reject` | `admin` | `status: "rejected"` | Từ chối mượn phòng (INV-08: PATCH không kèm body) |
| **T7** | **Tra cứu thẻ (Card Verify Tool)** | `POST /api/cards/verify` | Mọi nhân viên | `card, owner` | Tra cứu thẻ độc lập bằng QR / NFC / Mã thẻ |

---

## 3. Màn hình Xác thực & Quét Công cộng (Auth & Public Screens)

| Màn hình | Phương thức & Đường dẫn | Quyền | Dữ liệu gửi & nhận | Ghi chú |
|---|---|---|---|---|
| **Đăng nhập (Login)** | `POST /api/auth/login` | Công khai | Gửi `{ email, password }` -> Nhận `{ token, user }` | Lưu token vào Encrypted DataStore |
| **Đăng ký (Register)** | `POST /api/auth/register` | Công khai | Gửi `{ fullName, email, password, phone, studentCode, className }` -> Nhận `{ token, user }` | **Tuyệt đối không có trường `role`** (luôn là student) |
| **Quét cứu hộ khẩn cấp (Public Emergency Scan)** | `GET /api/emergency/public/:qrToken` | Công khai (Không cần đăng nhập) | Nhận JSON chỉ chứa các trường trong `visibleFields` của chủ thẻ | HTTP 404 nếu thẻ bị khóa/mất/hết hạn hoặc `isEnabled=false`. Các trường không được tích chọn sẽ vắng mặt hoàn toàn trong JSON (không null, không rỗng). |

