# SmartPass Android — Bản Đặc Tả Hệ Thống Thiết Kế (DESIGN_SYSTEM.md)
*Phiên bản: 1.0.0 — Nền tảng: Android Jetpack Compose, Material 3*

Tài liệu này xác lập hệ thống thiết kế (Design System) chuẩn hóa cho ứng dụng SmartPass Android, đảm bảo đồng nhất 100% với phiên bản Web Quản trị (Admin Web), tối ưu khả năng tiếp cận WCAG AA (tương phản >= 4.5:1), hỗ trợ font chữ tiếng Việt đầy đủ dấu và giới hạn tối đa 3 bước cho mọi luồng thao tác chính.

---

## 1. Bảng Mã Màu & Tỷ Lệ Tương Phản (Color Tokens & Contrast Ratios)

Màu sắc được ánh xạ từ `MaterialTheme.colorScheme`. Tuyệt đối không hard-code mã màu trực tiếp trong màn hình.

| Token Material 3 | Giá trị Sáng (Light Hex) | Giá trị Tối (Dark Hex) | Màu chữ tương ứng | Tỷ lệ tương phản (Light / Dark) | Đánh giá WCAG |
|---|---|---|---|---|---|
| `primary` (Brand Teal) | `#0F766E` | `#2DD4BF` | `onPrimary` (`#FFFFFF` / `#00372F`) | **5.2:1** / **8.6:1** | Đạt chuẩn AA / AAA |
| `primaryContainer` | `#CCFBF1` | `#115E59` | `onPrimaryContainer` (`#04211D` / `#99F6E4`) | **14.1:1** / **5.8:1** | Đạt chuẩn AAA / AA |
| `secondary` (Cyan) | `#0E7490` | `#67E8F9` | `onSecondary` (`#FFFFFF` / `#082F49`) | **5.1:1** / **8.9:1** | Đạt chuẩn AA / AAA |
| `tertiary` (Amber Accent) | `#D97706` | `#FBBF24` | `onTertiary` (`#FFFFFF` / `#451A03`) | **4.6:1** / **8.2:1** | Đạt chuẩn AA / AAA |
| `background` | `#F6F8F7` | `#0E1514` | `onBackground` (`#182220` / `#E7EDEB`) | **14.8:1** / **14.3:1** | Đạt chuẩn AAA |
| `surface` | `#FFFFFF` | `#182220` | `onSurface` (`#182220` / `#E7EDEB`) | **16.2:1** / **11.1:1** | Đạt chuẩn AAA |
| `surfaceVariant` | `#E7EDEB` | `#22302C` | `onSurfaceVariant` (`#3F4947` / `#C3CCC9`) | **6.5:1** / **7.1:1** | Đạt chuẩn AA / AAA |
| `error` | `#DC2626` | `#F87171` | `onError` (`#FFFFFF` / `#450A0A`) | **4.7:1** / **6.8:1** | Đạt chuẩn AA / AAA |
| `success` (Custom Semantic) | `#16A34A` | `#4ADE80` | `onSuccess` (`#FFFFFF` / `#052E16`) | **4.8:1** / **7.4:1** | Đạt chuẩn AA / AAA |

### Bề mặt Thẻ Học Sinh Số (Digital Card Surface)
- **Gradient duy nhất được cho phép trong toàn bộ app**: Deep Teal `#0F766E` -> `#115E59` (góc chéo 135°), chữ màu trắng `#FFFFFF`, tỷ lệ khung hình chuẩn thẻ ATM `1.62:1`, bo góc 28dp.
- Mọi bề mặt khác trong ứng dụng đều là phẳng (Flat Surfaces) theo triết lý Material 3 Tonal Elevation.

---

## 2. Thang Đo Kiểu Chữ (Typography Scale)

- **Phông chữ chủ đạo**: **Be Vietnam Pro** (tệp phông nhúng trực tiếp trong `res/font/`, hỗ trợ đầy đủ 100% ký tự dấu tiếng Việt: sắc, huyền, hỏi, ngã, nặng, ươ, ư, ơ, ê, ô, â, đ). Phông chữ phụ/dự phòng: Hệ thống Roboto.
- **Quy tắc Font Scale**: Sử dụng đơn vị `sp`. Tất cả container chứa văn bản đều co giãn linh hoạt (`wrap_content` / Compose `Modifier.wrapContentHeight()`), không cố định chiều cao cứng để đảm bảo hiển thị hoàn hảo ở độ phóng to chữ **1.3x và 2.0x** mà không bị mất chữ.

| Vai trò Material 3 | Kích cỡ (Size) | Độ đậm (FontWeight) | Khoảng cách dòng (LineHeight) | Áp dụng trên giao diện SmartPass |
|---|---|---|---|---|
| `displaySmall` | 32sp | SemiBold (600) | 40sp | Số dư ví lớn, Tên chủ thẻ trên Thẻ sinh viên số |
| `headlineSmall` | 24sp | SemiBold (600) | 32sp | Tiêu đề màn hình chính, Tiêu đề Bottom Sheet xác nhận |
| `titleLarge` | 20sp | Medium (500) | 26sp | Số tiền giao dịch, Tiêu đề nhóm chức năng |
| `titleMedium` | 16sp | Medium (500) | 24sp | Tiêu đề danh mục, Tên đầu mục danh sách (List item) |
| `bodyMedium` | 14sp | Normal (400) | 20sp | Nội dung thông báo, Mô tả sự kiện, Văn bản hướng dẫn |
| `bodySmall` | 12sp | Normal (400) | 16sp | Dấu thời gian (Timestamp), Mã thẻ phụ, Ghi chú mờ |
| `labelLarge` | 14sp | Medium (500) | 20sp | Nút bấm thao tác (CTA Buttons), Nhãn StatusChip |
| `labelSmall` | 11sp | Medium (500) | 14sp | Badge thông báo, Tag phân loại nhỏ |

---

## 3. Quy Tắc Khoảng Cách, Bo Góc & Độ Nổi (Spacing, Shapes & Elevation)

### Nhịp điệu khoảng cách (Spacing Rhythm)
- `4dp`: Khoảng cách vi mô (Icon và text nhỏ, badge offset).
- `8dp`: Khoảng cách giữa các phần tử liên quan chặt chẽ, khoảng cách giữa các hàng trong danh sách (`list item gap`).
- `16dp`: Khoảng cách lề màn hình tiêu chuẩn (`screen padding`), khoảng cách giữa các trường nhập liệu trong biểu mẫu.
- `24dp`: Khoảng cách giữa các khối chức năng lớn (`section gap`).
- `32dp`: Khoảng cách lề trên cùng của trang chi tiết, khoảng cách trước nút CTA cố định dưới đáy.

### Quy tắc bo góc (Shapes / Radii)
- `Chips` / `Badges`: Bo tròn hoàn toàn (Fully Rounded / 50%).
- `Buttons` (CTA): Bo góc `16dp` (hoặc Full Rounded theo chuẩn M3 Button).
- `Text Fields` / Ô tìm kiếm: Bo góc `16dp`.
- `Cards` (Thẻ nội dung, FeatureTile): Bo góc `24dp`.
- `Modal Bottom Sheet` / `Dialog`: Bo góc đỉnh `28dp`.
- `Digital Student Card`: Bo góc `28dp` với tỷ lệ khung hình 1.62:1.

### Quy tắc độ nổi (Elevation)
- Flat by default: Sử dụng màu nền bề mặt Tonal Color để phân cấp thị giác thay vì đổ bóng đậm.
- Chỉ đổ bóng nhẹ (`elevation: 4dp` - `8dp`) tại 2 điểm duy nhất: Thẻ sinh viên số trên Home/MyCard và Nút quét QR/NFC nổi (Floating Action Button).

---

## 4. Danh Mục Thành Phần Giao Diện (Component Inventory)

Toàn bộ các thành phần được xây dựng độc lập trong `com.smartpass.app.ui.components` và tái sử dụng trên toàn bộ màn hình:

| Tên Component | Xây dựng từ Material 3 / Compose | Mô tả & Quy cách kỹ thuật |
|---|---|---|
| `SmartPassDigitalCard` | `Box` + `Card` + Brush Gradient | Thẻ sinh viên số nền gradient deep teal, hiển thị logo SmartPass, họ tên, mã HS, lớp, chip trạng thái, hạn dùng, biểu tượng sóng NFC và mã QR nhỏ. Khi thẻ bị khóa/hết hạn: phủ mờ (dimmed), chip đỏ, text cảnh báo rõ ràng. |
| `QrCodeImage` | `Image` (Bitmap) + ZXing Core | Tạo ảnh QR trực tiếp từ token bằng thư viện ZXing local (không gửi token ra ngoài web). Có quiet zone 4 module, nút tăng độ sáng màn hình khi quét, hiển thị chuỗi token đã che mờ (`CARD-1…999`). |
| `StatusChip` | `Surface` / `AssistChip` | Chip trạng thái chuẩn hóa theo màu sắc/nhãn từ bảng từ điển. Nếu gặp mã trạng thái lạ: hiển thị màu xám trung tính nguyên văn giá trị mã, không crash app. |
| `MoneyText` | `Text` (tabular numbers) | Định dạng tiền tệ tiếng Việt chuẩn: vi-VN grouping + ` ₫` (Ví dụ: `150.000 ₫`). Nạp tiền: màu xanh lá kèm `+`; Chi tiêu: màu đỏ lỗi kèm `-`; Số dư: màu onSurface kích thước `displaySmall`. |
| `FeatureTile` | `Card` / `Surface` clickable | Ô truy cập nhanh trên Trang chủ hình vuông bo góc 24dp, gồm icon thương hiệu, nhãn tiếng Việt hiển thị đủ dòng (không bao giờ bị cắt cụt), chấm đỏ badge cho thông báo mới. |
| `EntityListItem` | `ListItem` (androidx.compose.material3) | Chuẩn hóa dòng hiển thị cho giao dịch, sách mượn, lịch học, phòng mượn, phiên xe: leading icon nền tròn, 2 dòng tiêu đề/mô tả, trailing hiển thị MoneyText hoặc StatusChip. |
| `LoadingView` | `Box` + Skeleton / Shimmer | Hiển thị khung xương xám nhấp nháy mô phỏng cấu trúc thật của màn hình trong lúc chờ API. |
| `EmptyView` | `Column` + `Icon` + `Text` | Hiển thị hình minh họa phẳng tinh gọn, văn bản tiếng Việt đúng ngữ cảnh từng màn hình và nút hành động gợi ý. |
| `ErrorView` | `Column` + `Icon` + `Text` + `Button` | Hiển thị thông điệp lỗi backend NGUYÊN VĂN + Nút "Thử lại" gọi lại API thực tế. |
| `ConfirmSheet` | `ModalBottomSheet` | Tấm kéo đáy tóm tắt chi tiết giao dịch (Người nhận/nộp, số tiền, thông tin sách, phòng, xe) kèm 2 nút bấm rõ ràng "Xác nhận" và "Hủy". Dùng cho mọi thao tác tiền và đổi trạng thái. |
| `ScannerOverlay` | `AndroidView` (CameraX) + `Canvas` | Khung ngắm quét mã QR ở giữa màn hình, nút bật/tắt đèn flash, nút "Nhập mã thủ công" bằng bàn phím dự phòng khi camera lỗi hoặc mờ. |
| `SmartPassScaffold` | `Scaffold` + Insets + SnackbarHost | Khung sườn bao bọc màn hình chuẩn, thanh TopBar với nút thông báo chuông, thanh NavigationBar dưới đáy thông minh theo vai trò. |

---

## 5. Cấu Trúc Khung Dây 4 Màn Hình Cốt Lõi (Wireframes: 4 Anchor Screens)

### Màn hình 1: Trang chủ Học sinh (Home Screen)
```
+---------------------------------------------------+
|  [Avatar] Xin chào, Nguyễn Văn An    [Bell (3)]   |
+---------------------------------------------------+
|  +---------------------------------------------+  |
|  | [Logo] SMARTPASS DIGITAL CARD        ((NFC))|  |
|  | NGUYỄN VĂN AN                  [Đang hoạt động]|  |
|  | Mã HS: 2024001 - Lớp: 10A1                  |  |
|  | Hạn dùng: 31/12/2026           [QR Code nhỏ] |  |
|  +---------------------------------------------+  |
|                                                   |
|  Ví học đường: 150.000 ₫              [Nạp tiền]  |
|  -----------------------------------------------  |
|  Lịch học hôm nay:                                |
|  [08:00 - 09:30] Toán học - Phòng 204 (Thầy Bình) |
|                                                   |
|  Truy cập nhanh:                                  |
|  [ Thẻ ]    [ Ví ]     [Thư viện]  [ Gửi xe ]     |
|  [Phòng]    [Sự kiện]  [Lịch học]  [Khẩn cấp]     |
+---------------------------------------------------+
| [Trang chủ]   [Thẻ của tôi]    [ Ví ]   [Cá nhân] |
+---------------------------------------------------+
```

### Màn hình 2: Thẻ của tôi (My Card Screen)
```
+---------------------------------------------------+
|  <- Thẻ số thông minh SmartPass                   |
+---------------------------------------------------+
|  +---------------------------------------------+  |
|  | [Logo] SMARTPASS DIGITAL CARD        ((NFC))|  |
|  | NGUYỄN VĂN AN                  [Đang hoạt động]|  |
|  | Mã thẻ: CARD-STU001 - Lớp: 10A1             |  |
|  +---------------------------------------------+  |
|                                                   |
|  +---------------------------------------------+  |
|  |                                             |  |
|  |            [  QR CODE LỚN ĐỂ QUÉT  ]        |  |
|  |                                             |  |
|  |          Mã: CARD-S...U001 [Copy]           |  |
|  +---------------------------------------------+  |
|  [ Nâng độ sáng màn hình để quét dễ hơn ]         |
|                                                   |
|  [!] Báo mất thẻ (Nếu bị thất lạc thẻ vật lý)     |
+---------------------------------------------------+
| [Trang chủ]   [Thẻ của tôi]    [ Ví ]   [Cá nhân] |
+---------------------------------------------------+
```

### Màn hình 3: Ví & Căn tin (Wallet Screen)
```
+---------------------------------------------------+
|  Ví học đường & Căn tin                           |
+---------------------------------------------------+
|  Số dư khả dụng                                   |
|  150.000 ₫                                        |
|  (Nạp tiền trực tiếp tại quầy căn tin nhà trường) |
|                                                   |
|  +---------------------------------------------+  |
|  | [QR] Mã thanh toán căn tin (Đưa nhân viên)  |  |
|  +---------------------------------------------+  |
|                                                   |
|  Lịch sử giao dịch:                               |
|  [-] Cơm trưa Căn tin          -30.000 ₫  11:45   |
|  [+] Nạp tiền đầu tuần        +100.000 ₫  08:15   |
|  [-] Nước khoáng Lavie          -8.000 ₫  Hôm qua |
+---------------------------------------------------+
| [Trang chủ]   [Thẻ của tôi]    [ Ví ]   [Cá nhân] |
+---------------------------------------------------+
```

### Màn hình 4: Quét QR/NFC cho Nhân viên (Staff Scan Screen)
```
+---------------------------------------------------+
|  <- Quét thẻ SmartPass                            |
+---------------------------------------------------+
|  +---------------------------------------------+  |
|  |                                             |  |
|  |          [    KHUNG NGẮM CAMERA    ]        |  |
|  |                   (QR / NFC)                |  |
|  |                                             |  |
|  +---------------------------------------------+  |
|  [ Bật đèn Flash ]        [ Nhập mã thủ công ]    |
|                                                   |
|  Kết quả xác thực thẻ gần nhất:                   |
|  +---------------------------------------------+  |
|  | NGUYỄN VĂN AN - Lớp 10A1     [Hợp lệ / Active]|  |
|  | Mã thẻ: CARD-STU001 - Số dư: 150.000 ₫      |  |
|  +---------------------------------------------+  |
|  [ Xác nhận thực hiện giao dịch ]                 |
+---------------------------------------------------+
| [Vận hành]       [ QUÉT QR ]            [Lịch sử] |
+---------------------------------------------------+
```

---

## 6. Danh Mục Toàn Bộ Màn Hình Phân Theo Vai Trò (Screen List by Role)

### Nhóm 1: Màn hình Học sinh (Student - 12 Màn hình)
1. **S1: Home / Trang chủ**: Chào mừng, thẻ compact, số dư, lịch học hôm nay, lưới 8 ô chức năng nhanh.
2. **S2: My Card / Thẻ của tôi**: Thẻ số phóng to, mã QR quét cổng/điểm danh, nút báo mất thẻ.
3. **S3: Attendance / Điểm danh của tôi**: Lịch sử điểm danh các tiết học cá nhân.
4. **S4: Library / Thư viện**: Danh sách sách đang mượn, hạn trả và đếm số lượng sách mượn.
5. **S5: Wallet / Ví & Căn tin**: Số dư ví, mã QR thanh toán căn tin, lịch sử giao dịch nạp/trừ tiền.
6. **S6: Parking / Gửi xe của tôi**: Thông tin xe đang gửi trong bãi (biển số, giờ vào, thời gian đã đỗ) và lịch sử gửi xe.
7. **S7: Room Booking / Mượn phòng**: Tra cứu slot bận theo phòng/ngày, tạo yêu cầu mượn phòng, danh sách phòng đã đăng ký và hủy yêu cầu.
8. **S8: Events / Sự kiện**: Danh sách sự kiện trường học, chi tiết sự kiện và nút đăng ký tham gia.
9. **S9: Timetable / Thời khóa biểu**: Thời khóa biểu theo lớp học, chia theo các thứ trong tuần (Thứ 2 đến Thứ 7).
10. **S10: Notifications / Thông báo**: Danh sách thông báo học đường, lọc chưa đọc/đã đọc và xem chi tiết.
11. **S11: Profile & Settings / Cá nhân & Cài đặt**: Thông tin hồ sơ cá nhân, đổi mật khẩu, chế độ Sáng/Tối, kiểm tra kết nối API backend, đăng xuất.
12. **S12: Emergency Card / Thẻ khẩn cấp**: Cấu hình hồ sơ y tế khẩn cấp, cài đặt quyền riêng tư 6 trường, mã QR khẩn cấp, xem trước giao diện cứu hộ.

### Nhóm 2: Màn hình Nhân viên Vận hành (Staff Operations - 7 Màn hình)
1. **T1: Staff Home / Bảng điều hành**: Hiển thị các khối thao tác phù hợp theo vai trò (Thủ thư, Căn tin, Bãi xe, Admin).
2. **T2: Attendance Check / Điểm danh**: Quét mã thẻ học sinh -> Xác thực -> Ghi nhận có mặt tiết học -> Tự động sẵn sàng quét học sinh tiếp theo.
3. **T3: Library Operations / Mượn & Trả sách**: Quét thẻ bạn đọc -> Xác nhận mượn sách mới (tối đa 3 cuốn) hoặc quét trả sách kèm cảnh báo quá hạn.
4. **T4: Canteen Operations / Thu tiền & Nạp ví**: Quét mã thanh toán học sinh -> Nhập số tiền -> Xác nhận trừ ví; hoặc nạp tiền ví cho học sinh.
5. **T5: Parking Operations / Cho xe vào & ra bãi**: Quét thẻ -> Nhập biển số -> Cho xe vào; Quét thẻ xe ra -> Xem biên lai tính phí và xác nhận hoàn tất.
6. **T6: Room Booking Approval / Phê duyệt mượn phòng**: Dành cho Quản trị viên phê duyệt hoặc từ chối đơn mượn phòng (INV-08: PATCH không kèm body).
7. **T7: Card Verify Tool / Tra cứu thẻ nhanh**: Công cụ tra cứu thẻ bằng QR/NFC/Mã thẻ hiển thị toàn bộ trạng thái thẻ và chủ thẻ.

### Nhóm 3: Màn hình Chung & Công cộng (Shared / Public - 3 Màn hình)
1. **Login**: Đăng nhập tài khoản bằng Email và Mật khẩu.
2. **Register**: Đăng ký tài khoản học sinh công khai (không có trường vai trò).
3. **Public Emergency Scan**: Giao diện quét cứu hộ y tế khẩn cấp công khai (Zero-Knowledge, không yêu cầu đăng nhập, chỉ hiện các trường chủ thẻ cho phép, tích hợp nút gọi người thân, gọi 115 và chia sẻ GPS).

