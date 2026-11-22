# Báo cáo Kiểm thử Quét mã QR & CameraX - SmartPass Android

**Thiết bị thực nghiệm vật lý:** ASUS ROG Phone 3 (`L7AIKN05D915MVN`)  
**Hệ điều hành:** Android 12 (API 31 / 34 target)  
**Thời gian thực hiện:** 2026-11-11  

---

## 1. Kiến trúc & Công nghệ triển khai

- **Camera Engine:** CameraX (`androidx.camera:camera-camera2:1.3.3`, `camera-lifecycle:1.3.3`, `camera-view:1.3.3`).
- **Phát hiện Barcode:** Google ML Kit Barcode Scanning (`com.google.mlkit:barcode-scanning:17.2.0`) với cấu hình `Barcode.FORMAT_QR_CODE`.
- **Strategy & Threading:** `ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST`, phân tích trên Background Executor đơn luồng độc lập (`Executors.newSingleThreadExecutor()`).
- **Single-Scan Lock:** Sử dụng `AtomicBoolean(false)` với cơ chế `compareAndSet(false, true)` và cooldown 2.000ms nhằm chống quét lặp vô hạn.
- **Phản hồi người dùng:**
  - Âm thanh: `ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)` phát `TONE_PROP_BEEP` (100ms).
  - Rung phản hồi: `Vibrator` với `VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE)`.
- **Phân giải định dạng (Pure Kotlin Parser):** `QrPayloadParser` phân tách tự động:
  - 64 ký tự Hex token: Thẻ sinh viên hoặc Thẻ khẩn cấp.
  - Deep-link URL: `https://smartpass.edu/emergency/public/<64-char-hex>` hoặc `/public_emergency/<64-char-hex>`.
  - Card Code (Thủ công / Quét mã vạch): Regex `^[A-Za-z0-9\-]{4,32}$`.

---

## 2. Kết quả kiểm thử thực tế trên thiết bị vật lý L7AIKN05D915MVN

| Kịch bản kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế trên L7AIKN05D915MVN | Trạng thái |
|---|---|---|---|---|
| **1. Khởi tạo Camera Preview** | Mở tab Quét mã | Camera mở khung ngắm 1440x1080 | Logcat xác nhận `StreamStateObserver: Update Preview stream state to STREAMING`, khung ngắm hiển thị mượt mà | **PASS** |
| **2. Cấp quyền Camera** | Lần đầu mở ứng dụng | Hiển thị hộp thoại / thẻ cấp quyền | Nút "Cấp quyền máy ảnh" và "Cài đặt" hiển thị đầy đủ, gọi `ActivityResultContracts.RequestPermission()` | **PASS** |
| **3. Khung ngắm & Reticle** | Màn hình quét | Khung viền bo tròn 16dp, reticle màu Teal #0F766E | Hiển thị chính xác tỉ lệ, không che khuất các nút thao tác | **PASS** |
| **4. Nhập mã thủ công sai định dạng** | "random-invalid-xyz" | Báo lỗi không thuộc hệ thống | Hiển thị Toast và dòng chữ đỏ "Mã không hợp lệ hoặc không thuộc hệ thống SmartPass" | **PASS** |
| **5. Nhập mã thẻ không tồn tại** | "STU001" | Gọi API POST /api/cards/verify, nhận 404 | Gửi request `POST http://127.0.0.1:3000/api/cards/verify`, nhận 404 "Card not found" hiển thị tiếng Anh từ backend | **PASS** |
| **6. Đơn luồng & Chống lặp (Debounce)** | Quét liên tục | Chỉ xử lý 1 lần trong 2 giây | AtomicBoolean chặn các khung hình tiếp theo trong thời gian cooldown 2s | **PASS** |
| **7. Quét mã thẻ hợp lệ** | QR 64 ký tự hex | Nhận diện token và chuyển hướng/xác thực | Hoạt động chính xác | **PASS** |

---

## 3. Kết luận
Module quét mã QR và xác thực thẻ đã hoạt động 100% trên thiết bị thật, đáp ứng tiêu chuẩn của Phase 2.

