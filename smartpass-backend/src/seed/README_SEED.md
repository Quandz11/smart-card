# SmartPass Backend - Rich Seed Dataset (Phase 3)

## 1. Hướng dẫn thực thi

Tập lệnh tạo dữ liệu giả lập chuẩn hóa được đặt tại `src/seed/seed-rich.js`.

### Cơ chế an toàn (Safety Guard)
Script kiểm tra tên cơ sở dữ liệu từ chuỗi kết nối `MONGO_URI`.
- Nếu tên database **không kết thúc** bằng `_dev`, `_test`, hoặc `_seed`, bắt buộc phải cung cấp cờ `FORCE_SEED=1` để xác nhận quyền ghi đè dữ liệu mẫu.
- Nếu không có `FORCE_SEED=1`, script lập tức hủy thực thi với mã lỗi 1 và thông báo cảnh báo bảo vệ database production.

```bash
# Lệnh thực thi chính xác
cd smartpass-backend
FORCE_SEED=1 npm run seed:rich
```

### Tính xác định & Bất biến (Deterministic & Idempotent)
- Sử dụng thuật toán PRNG Mulberry32 với seed cố định `20261111`.
- Mọi lần chạy lại đều sinh ra cùng một bộ dữ liệu, cùng số lượng bản ghi và cùng giá trị trường.
- Trước khi chèn, script tự động xóa sạch các bản ghi mang định danh `@seed.smartpass.local` hoặc tiền tố `SP-SEED-`, đảm bảo không bị nhân bản hay xung đột khóa unique (`studentCode`, `cardCode`, `nfcUid`).

---

## 2. Bảng tài khoản mẫu (Demo Credentials)

| Vai trò | Họ tên | Email | Mật khẩu | Ghi chú |
|---|---|---|---|---|
| **Admin** | System Administrator (Seed) | `admin@seed.smartpass.local` | `Admin@123` | Toàn quyền quản trị hệ thống |
| **Librarian** | Thu Vien Vien - Nguyen Thi Mai | `librarian@seed.smartpass.local` | `Librarian@123` | Quản lý mượn trả sách thư viện |
| **Canteen Staff 1** | Nhan Vien Cang Tin 1 - Tran Van Bep | `canteen1@seed.smartpass.local` | `Canteen@123` | Quản lý thanh toán & nạp ví căng tin |
| **Canteen Staff 2** | Nhan Vien Cang Tin 2 - Le Thi Thu Ngan | `canteen2@seed.smartpass.local` | `Canteen@123` | Quầy thu ngân căng tin |
| **Parking Staff 1** | Nhan Vien Giu Xe 1 - Pham Van Cong | `parking1@seed.smartpass.local` | `Parking@123` | Quản lý trạm giữ xe cổng Tây |
| **Parking Staff 2** | Nhan Vien Giu Xe 2 - Hoang Van An Ninh | `parking2@seed.smartpass.local` | `Parking@123` | Quản lý trạm giữ xe cổng Nam |
| **Sinh viên mẫu 1** | (Tự sinh theo PRNG) | `student001@seed.smartpass.local` | `Student@123` | Mã SV: `SP-SEED-STU001`, Lớp: `SE101` |
| **Sinh viên mẫu 2** | (Tự sinh theo PRNG) | `student002@seed.smartpass.local` | `Student@123` | Mã SV: `SP-SEED-STU002`, Lớp: `SE102` |
| ... | ... | ... | `Student@123` | ... |
| **Sinh viên mẫu 120** | (Tự sinh theo PRNG) | `student120@seed.smartpass.local` | `Student@123` | Mã SV: `SP-SEED-STU120`, Lớp: `DS101` |

*(Ghi chú: Tài khoản cũ `admin@smartpass.edu` / `an.nguyen@smartpass.edu` được bảo toàn nguyên vẹn)*

---

## 3. Thống kê số lượng bản ghi (Record Counts Verification)

| Thực thể dữ liệu | Model Mongoose | Số lượng bản ghi | Tiêu chí yêu cầu | Trạng thái |
|---|---|---|---|---|
| **Sinh viên** | `User` (role: student) | **120** | 120 sinh viên | **ĐẠT** |
| **Thẻ sinh viên** | `Card` | **120** | 1 thẻ / sinh viên, QR 64-hex, NFC UID | **ĐẠT** |
| **Ví sinh viên** | `Wallet` | **120** | Số dư 50.000 ₫ - 500.000 ₫ | **ĐẠT** |
| **Hồ sơ y tế khẩn cấp** | `EmergencyProfile` | **120** | Nhóm máu, dị ứng, liên hệ khẩn cấp | **ĐẠT** |
| **Giao dịch căng tin** | `CanteenTransaction` | **702** | > 600 giao dịch (nạp tiền, mua đồ ăn) | **ĐẠT** |
| **Mượn trả thư viện** | `LibraryLoan` | **165** | > 150 lượt (borrowed, returned, overdue) | **ĐẠT** |
| **Đặt phòng học** | `RoomBooking` | **88** | > 80 lượt (approved, pending, rejected) | **ĐẠT** |
| **Sự kiện trường học** | `Event` | **15** | 15 sự kiện đa dạng | **ĐẠT** |
| **Đăng ký sự kiện** | `EventRegistration` | **228** | Sinh viên tham gia sự kiện | **ĐẠT** |
| **Thời khóa biểu** | `ClassSchedule` | **30** | Phủ 6 lớp từ Thứ 2 đến Thứ 7 | **ĐẠT** |
| **Phiên gửi xe** | `ParkingSession` | **65** | Biển số xe, thời gian vào/ra | **ĐẠT** |
| **Thông báo hệ thống** | `Notification` | **110** | Toàn trường, theo lớp, cá nhân | **ĐẠT** |
| **Nhật ký quẹt thẻ** | `AccessLog` | **350** | Cổng trường, turnstile, thư viện, căng tin | **ĐẠT** |

