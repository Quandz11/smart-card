# SmartPass QR System v1 Specification

Tài liệu đặc tả toàn diện định dạng mã QR, cơ chế ký HMAC-SHA256, sổ đăng ký tập trung, phân luồng điều hướng nghiệp vụ, quy tắc chống quét trùng cổng trường và đánh giá tách token thẻ.

---

## 1. ĐỊNH DẠNG PAYLOAD CHUẨN (V1 FORMAT SPEC)

Hệ thống SmartPass áp dụng một định dạng payload duy nhất cho tất cả các mã QR dịch vụ mới, ký số bằng thuật toán HMAC-SHA256 nhằm ngăn chặn giả mạo và quét mã tuỳ tiện.

### 1.1. Chuỗi chuẩn (Canonical String - Mã hoá trên hình ảnh QR)
```text
SP1://<TYPE>/<publicId>?e=<expiryEpochSeconds>&s=<sig>
```
- **Tiền tố định danh (Scheme + Version):** Cố định là `SP1://`. Mọi mã QR quét bằng camera không bắt đầu bằng `SP1://` hoặc định dạng Bare `SP1.` (ngoại trừ mã thẻ sinh viên kế thừa và mã khẩn cấp) sẽ bị từ chối ngay trên ứng dụng di động: *"Mã QR không phải của SmartPass"*.
- **`<TYPE>`:** Một trong 8 loại mã dịch vụ chuẩn (viết HOA):
  `CANTEEN_POINT`, `BOOK`, `PARKING_IN`, `PARKING_OUT`, `ATTENDANCE_SESSION`, `ROOM`, `EVENT`, `GATE_IN`, `GATE_OUT` (và mã động `PAYMENT_REQUEST`, `EVENT_CHECKIN`).
- **`<publicId>`:** Chuỗi ngẫu nhiên tối thiểu 16 ký tự hexa/alphanumeric (tạo bằng `crypto.randomBytes(10).toString('hex')`). Tuyệt đối không sử dụng MongoDB ObjectId của User, không chứa email, mã sinh viên hay thông tin cá nhân.
- **`e=<expiryEpochSeconds>`:** Thời điểm hết hạn tính bằng epoch giây (bắt buộc đối với mã động; không xuất hiện đối với mã tĩnh in ấn vật lý để tránh tình trạng mã in bị vô hiệu hoá âm thầm).
- **`s=<sig>`:** Chữ ký HMAC-SHA256 được tính trên toàn bộ chuỗi chuẩn trước tham số `&s=` hoặc `?s=`:
  $$\text{sig} = \text{base64url}(\text{HMAC-SHA256}(\text{canonicalWithoutSig}, \text{QR\_SIGNING\_SECRET}))[0..22]$$
  Chữ ký có độ dài chính xác 22 ký tự base64url. Backend xác thực chữ ký bằng hàm so sánh an toàn thời gian `crypto.timingSafeEqual` khi gọi `POST /api/qr/resolve`.

### 1.2. Định dạng rút gọn (Bare Query Form)
Dành cho máy in nhãn đơn giản hoặc nhập thủ công bị cắt ký tự gạch chéo:
```text
SP1.<TYPE>.<publicId>.<expiryOr0>.<sig>
```
Ví dụ: `SP1.BOOK.9c7a01d674b88931b99a.0.D4Xo2t7i9_1a3b8c9d0e1f`

### 1.3. Mã nhập tay ngắn (Human Code)
In bên dưới hình ảnh QR trên tài liệu in ấn A4 để sinh viên có thể gõ tay khi camera điện thoại bị mờ hoặc hư hỏng:
```text
<TYPE>-<6_KY_TU_CUOI_CUA_PUBLIC_ID>
```
Ví dụ: `BOOK-X7K2P9`, `ROOM-A10101`, `GATE_IN-1B99A`.
Hệ thống chấp nhận mã này qua cùng một endpoint `POST /api/qr/resolve` thông qua tìm kiếm hậu tố trong cơ sở dữ liệu.

### 1.4. Tính tương thích ngược (Legacy Payloads)
Bộ phân tích cú pháp (Parser) trên Backend và Android app ưu tiên kiểm tra các mã kế thừa trước:
1. **URL Khẩn cấp:** `https://.../emergency/public/:token` $\rightarrow$ Mở màn hình y tế khẩn cấp công khai.
2. **Hex Token 64 ký tự:** Token hex của thẻ $\rightarrow$ Mở màn hình y tế khẩn cấp.
3. **Mã thẻ sinh viên:** `STU001` .. $\rightarrow$ Chế độ quét thẻ của nhân viên (`POST /api/cards/verify`).

---

## 2. BẢNG DANH MỤC CÁC LOẠI MÃ QR (TYPE TABLE)

| Loại mã (`TYPE`) | Tĩnh / Động | Vị trí đặt / hiển thị | Mục đích quét của Sinh viên | Thao tác tiếp theo (`nextAction`) |
| :--- | :--- | :--- | :--- | :--- |
| **`CANTEEN_POINT`** | Tĩnh | Quầy căng tin trường | Mở màn hình tự nhập số tiền thanh toán từ ví | `wallet_pay` |
| **`PAYMENT_REQUEST`** | Động (hạn 2 phút) | Màn hình POS nhân viên căng tin | Hiển thị số tiền nhân viên đã nhập để xác nhận trừ ví | `wallet_pay` |
| **`BOOK`** | Tĩnh | Bìa sau / gáy sách thư viện | Mở xác nhận mượn cuốn sách đó (tối đa 3 cuốn) | `library_borrow` |
| **`PARKING_IN`** | Tĩnh | Cổng vào bãi giữ xe | Mở xác nhận check-in gửi xe (chọn biển số xe) | `parking_toggle` |
| **`PARKING_OUT`** | Tĩnh | Cổng ra bãi giữ xe | Xem thời gian đỗ, tính phí 2.000 ₫/h và xác nhận ra | `parking_toggle` |
| **`ATTENDANCE_SESSION`**| Động (hạn 15 phút)| Màn hình/máy chiếu giảng viên | Điểm danh buổi học chống gian lận | `attendance_check` |
| **`ROOM`** | Tĩnh | Biển tên trước cửa phòng học | Xem thông tin phòng, lịch đặt hôm nay và đặt phòng | `room_detail` |
| **`EVENT`** | Tĩnh | Poster sự kiện | Xem chi tiết sự kiện và nhấn đăng ký tham gia | `event_detail` |
| **`EVENT_CHECKIN`** | Động (hạn đến hết sk) | Màn hình ban tổ chức tại cửa sự kiện | Ghi nhận sinh viên đã có mặt tại sự kiện | `event_detail` |
| **`GATE_IN`** | Tĩnh | Trụ kiểm soát lối vào cổng trường | Ghi nhận sinh viên vào khuôn viên trường | `gate_toggle` |
| **`GATE_OUT`** | Tĩnh | Trụ kiểm soát lối ra cổng trường | Ghi nhận sinh viên rời khỏi khuôn viên trường | `gate_toggle` |

---

## 3. LUỒNG NGHIỆP VỤ CHI TIẾT (PER-TYPE FLOW)

### Nguyên tắc bất biến
1. **Quét mã chỉ để đọc thông tin:** `POST /api/qr/resolve` tuyệt đối không thực hiện giao dịch tài chính, không đổi trạng thái mượn sách, không ghi log `AccessLog`.
2. **Xác nhận gửi kèm Idempotency Key:** Khi sinh viên nhấn nút xác nhận trên Bottom Sheet, ứng dụng gửi kèm `idempotencyKey: UUID` (hiệu lực lưu trữ 24 giờ). Các yêu cầu gửi lặp lại (do mạng chập chờn hoặc double-tap) trả về mã HTTP 200 và kết quả ban đầu mà không tạo bản ghi trùng.
3. **Kiểm tra thẻ sinh viên:** Mọi thao tác ghi nhận nghiệp vụ đều kích hoạt `assertCardUsable` trên chính chiếc thẻ đang kích hoạt của sinh viên đó. Thẻ bị khoá/mất/hết hạn lập tức bị chặn với mã 403.

### Chi tiết luồng từng loại
1. **`CANTEEN_POINT` & `PAYMENT_REQUEST`:**
   - Khi quét `CANTEEN_POINT`: App hiển thị tên quầy và số dư ví cá nhân. Sinh viên nhập số tiền muốn trả, bấm "Xác nhận thanh toán".
   - Khi quét `PAYMENT_REQUEST`: App hiển thị số tiền do nhân viên căng tin yêu cầu. Khi xác nhận, mã động bị đánh dấu `isUsed = true` (chỉ dùng 1 lần duy nhất).
   - Backend kiểm tra số dư theo quy tắc INV-03: Nếu số dư < số tiền cần trả $\rightarrow$ Báo lỗi 400 và không thay đổi bất kỳ dữ liệu nào. Nếu thành công, trừ ví nguyên tử và ghi 1 dòng `AccessLog(action='canteen_pay')`.
2. **`BOOK`:**
   - App hiển thị tựa đề sách, mã sách và số bản sách còn lại trong thư viện.
   - Khi xác nhận mượn: Kiểm tra sinh viên có ít hơn 3 cuốn đang mượn (INV-06). Ghi nhận hạn trả 14 ngày và ghi 1 dòng `AccessLog(action='library_borrow')`.
   - Nếu sinh viên đang giữ cuốn sách này, app mở chi tiết phiếu mượn hiện hành.
3. **`PARKING_IN` & `PARKING_OUT`:**
   - `PARKING_IN`: App hiển thị biển số xe đã đăng ký. Bấm xác nhận gửi xe $\rightarrow$ Backend kiểm tra INV-05 (thẻ chưa có phiên gửi xe mở). Nếu đã có, trả về 409 Conflict.
   - `PARKING_OUT`: Backend tính toán thời gian đỗ xe thực tế và làm tròn lên theo công thức $\lceil \text{số phút} / 60 \rceil \times 2.000\text{ ₫}$. Sinh viên xem phí hiển thị do server tính trước khi nhấn xác nhận check-out.
4. **`ATTENDANCE_SESSION`:**
   - Giảng viên sinh mã động qua `POST /api/attendance/sessions/:classSession/qr`. Mã có hiệu lực đúng 15 phút.
   - Sinh viên quét mã: Server kiểm tra lớp sinh viên (`className`). Nếu sinh viên khác lớp $\rightarrow$ Trả về lỗi 403 `"Bạn không thuộc lớp học này"`.
   - Xác nhận điểm danh: Kiểm tra trùng buổi học $\rightarrow$ Trả về 409 nếu đã điểm danh trước đó. Ghi nhận `Attendance` và 1 dòng `AccessLog(action='attendance')`.
5. **`ROOM`:**
   - Trả về danh sách các ca đặt phòng được duyệt (`approved`) trong ngày hôm nay.
   - App cung cấp nút "Đặt phòng này", tự động điền sẵn tên phòng vào biểu mẫu đặt phòng học.
6. **`EVENT` & `EVENT_CHECKIN`:**
   - Poster `EVENT`: Hiển thị thông tin, thời gian bắt đầu và số chỗ còn lại (`capacity - registeredCount`). Sinh viên nhấn đăng ký tham gia (kiểm tra nguyên tử INV-07).
   - Check-in `EVENT_CHECKIN`: Khi sinh viên có mặt tại sự kiện, quét mã động của BTC để ghi nhận trường `arrivedAt: new Date()` trên bản ghi `EventRegistration`.
7. **`GATE_IN` & `GATE_OUT`:**
   - Quét cổng vào hoặc cổng ra. Ghi nhận `AccessLog(action='entry' | 'exit')`.

---

## 4. QUY TẮC CHỐNG QUÉT TRÙNG CỔNG TRƯỜNG (GATE DOUBLE-SCAN RULE)

Để xử lý các tình huống sinh viên vô tình quét thẻ 2 lần liên tiếp tại cùng một chiều cổng (ví dụ: quét vào cổng 2 lần mà chưa quét ra, hoặc chạm tay hai lần):
- **Nguyên lý kiểm tra:**
  Khi sinh viên xác nhận quét cổng qua `POST /api/qr/gate/confirm`:
  1. Hệ thống tìm bản ghi ghi nhận cổng gần nhất (`action` là `'entry'` hoặc `'exit'`) của sinh viên trong bảng `AccessLog`.
  2. Nếu bản ghi gần nhất có cùng hướng đi với hướng đang quét (ví dụ: vừa có log `'entry'` mà lại quét `GATE_IN` tiếp):
     - **Không tạo dòng nhật ký mới** trong bảng `AccessLog`.
     - Trả về HTTP 200 kèm cờ `duplicate: true` và thông điệp:
       - Chiều vào: `"Bạn đã ghi nhận vào cổng trước đó"`
       - Chiều ra: `"Bạn đã ghi nhận ra cổng trước đó"`
  3. Nếu hướng đi đối nghịch (vừa `'entry'`, giờ là `'exit'`, hoặc ngược lại):
     - Tạo đúng 1 dòng `AccessLog` mới với `action: 'entry'` hoặc `'exit'`.
     - Trả về HTTP 200 với `duplicate: false`.

---

## 5. ĐÁNH GIÁ TÁCH TOKEN TRÌNH THẺ VÀ TOKEN Y TẾ KHẨN CẤP (TOKEN SEPARATION ASSESSMENT)

> [!IMPORTANT]
> Mục này là **báo cáo đánh giá kiến trúc** theo yêu cầu nhiệm vụ. Không tự ý sửa đổi cơ sở dữ liệu khi chưa có sự đồng ý chính thức từ Chủ sở hữu hệ thống (System Owner).

### 5.1. Thực trạng hiện tại
Hiện tại, cả hai chức năng:
1. **Trình thẻ sinh viên:** Quét tại căng tin, thư viện, cổng trường bởi nhân viên (`Card.qrToken`).
2. **Mã QR y tế khẩn cấp:** In sau thẻ để người dân / y tá quét khi sinh viên gặp nạn (`/emergency/public/:token`).

Đều dùng chung một chuỗi token duy nhất là trường `Card.qrToken` (64 ký tự hex). Do đó, khi quản trị viên cấp đổi hoặc sinh lại mã QR khẩn cấp, mã trình thẻ cũng bị đổi theo và ngược lại; hoặc khi lộ mã khẩn cấp, đối tượng xấu có thể giả mạo token trình thẻ.

### 5.2. Phương án di chuyển cơ sở dữ liệu (Migration Plan)
Để tách bạch hoàn toàn quyền bảo mật:
1. **Mở rộng Schema `Card`:**
   - Thêm trường `emergencyToken`: `String, unique, sparse, indexed` (chuỗi hex ngẫu nhiên 64 ký tự).
   - Đổi tên ngữ nghĩa của `qrToken` thành `cardPresentationToken` (hoặc giữ nguyên `qrToken` làm token trình thẻ nội bộ).
2. **Kịch bản chuyển đổi dữ liệu (Migration Script):**
   ```javascript
   // Khởi tạo emergencyToken riêng biệt cho tất cả các thẻ đang hoạt động
   const cards = await Card.find({ emergencyToken: { $exists: false } });
   for (const c of cards) {
     c.emergencyToken = crypto.randomBytes(32).toString('hex');
     await c.save();
   }
   ```
3. **Cập nhật Endpoint:**
   - `GET /api/emergency/public/:token`: Tìm kiếm theo `Card.findOne({ emergencyToken: token })`.
   - `POST /api/cards/verify`: Tìm kiếm theo `Card.findOne({ qrToken: token })`.

### 5.3. Rủi ro & Điểm bị ảnh hưởng (What Breaks During Migration)
- Tất cả các thẻ vật lý cũ đã in mã QR khẩn cấp trỏ vào `qrToken` cũ sẽ không xem được hồ sơ y tế nếu endpoint khẩn cấp chỉ tìm `emergencyToken`.
- Ứng dụng di động bản cũ (chưa cập nhật mã nguồn sinh mã QR khẩn cấp) sẽ hiển thị mã token trình thẻ thay vì token khẩn cấp.

### 5.4. Cửa sổ tương thích ngược (Backward-Compatibility Window)
Để quá trình chuyển tiếp mượt mà trong ít nhất 90 ngày:
- Trong `emergencyService.getPublicEmergencyData(token)`:
  Truy vấn dự phòng: `Card.findOne({ $or: [{ emergencyToken: token }, { qrToken: token }] })`.
- Sau 90 ngày khi toàn bộ sinh viên đã được cấp phát thẻ mới hoặc cập nhật app, vô hiệu hóa điều kiện phụ `{ qrToken: token }`.

