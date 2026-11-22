# SMARTPASS SAMPLE QR KIT

Bộ tài liệu mã QR dịch vụ in ấn thực tế được sinh từ cơ sở dữ liệu mẫu thật của SmartPass.

## 1. THỐNG KÊ DANH MỤC MÃ TRONG BỘ MẪU
Tổng số mã tĩnh đã tạo: **30 mã**

| Loại mã | Số lượng tạo |
| :--- | :--- |
| `CANTEEN_POINT` | 1 mã |
| `BOOK` | 10 mã |
| `PARKING_IN` | 1 mã |
| `PARKING_OUT` | 1 mã |
| `ROOM` | 12 mã |
| `EVENT` | 3 mã |
| `GATE_IN` | 1 mã |
| `GATE_OUT` | 1 mã |

## 2. HƯỚNG DẪN IN ẤN VÀ BỐ TRÍ VẬT LÝ
1. **Quy cách in:**
   - Mở file `print-sheet.html` bằng Google Chrome hoặc Safari.
   - Nhấn `Ctrl + P` (hoặc `Cmd + P`), chọn máy in hoặc "Save as PDF".
   - Khổ giấy: **A4**.
   - Tỷ lệ co giãn (Scale): Chọn **100% (Actual Size)**, tuyệt đối không chọn "Fit to Page" để đảm bảo kích thước mã QR in ra đạt chuẩn $\ge 50\text{ mm}$ (mỗi ô trong template có kích thước QR chính xác là $58\text{ mm}$).
2. **Bố trí vị trí dán:**
   - Cắt theo đường viền nét đứt của từng ô.
   - Dán tại các vị trí thực tế trong khuôn viên trường học:
     - `CANTEEN_POINT`: Dán trên quầy thanh toán thu ngân căng tin.
     - `BOOK`: Dán trên bìa sau hoặc gáy 10 đầu sách thư viện (`BK-001` .. `BK-010`).
     - `PARKING_IN` / `PARKING_OUT`: Dán tại 2 cột trụ barie lối vào và lối ra của bãi giữ xe.
     - `ROOM`: Dán tại biển tên trước cửa 12 phòng học (`A101`, `A102`, `B201`, `B202`, `C301`, `D101`, `Lab 102`, v.v.).
     - `EVENT`: Dán trên các bảng tin hoặc poster sự kiện.
     - `GATE_IN` / `GATE_OUT`: Dán tại 2 trụ turnstile của cổng trường chính.

## 3. HƯỚNG DẪN THỰC HÀNH CÁC MÃ ĐỘNG (DYNAMIC QR)
Các loại mã động dưới đây KHÔNG in sẵn trên giấy vì có thời hạn hiệu lực ngắn để chống gian lận:
1. **Điểm danh buổi học (`ATTENDANCE_SESSION`, thời hạn 15 phút):**
   - Giảng viên/Nhân viên mở màn hình điểm danh trong app hoặc gọi API:
     `POST /api/attendance/sessions/:classSession/qr`
   - App sinh viên quét mã hiển thị trên màn hình giảng viên để ghi nhận điểm danh.
2. **Yêu cầu thanh toán Căng tin (`PAYMENT_REQUEST`, thời hạn 2 phút):**
   - Thu ngân căng tin nhập số tiền (ví dụ: 35.000 ₫) và gọi API:
     `POST /api/wallet/payment-request` với `{ amount: 35000, counter: "Quầy 1" }`
   - Mã động xuất hiện trên màn hình quầy. Sinh viên quét mã, app hiển thị số tiền 35.000 ₫ để bấm xác nhận thanh toán.

> [!WARNING]
> Toàn bộ các mã trong bộ mẫu này liên kết với dữ liệu thử nghiệm trong cơ sở dữ liệu MongoDB Atlas hiện tại. Khi triển khai trường học thực tế, quản trị viên sẽ tạo mã mới trên giao diện Admin Web.
