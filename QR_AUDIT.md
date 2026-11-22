# QR System Audit (Step 0) - SmartPass System
**Date:** 2026-11-11  
**Workspace:** `/Users/anhquan/Documents/smart-card`  

---

## 1. CURRENT STATE: Existing QR Architecture

### 1.1 Card QR & Emergency QR Encoding
- **Encoding Scheme:** Currently, both student identity cards and public emergency cards share the single field `Card.qrToken`.
- **Token Generation:** Generated cryptographically via `crypto.randomBytes(32).toString('hex')` (64-character lowercase hex string).
- **Rotation:** `POST /api/emergency/me/rotate-qr` generates a new 64-character random hex token and updates `card.qrToken`.
- **Card Verification (Staff):** `POST /api/cards/verify` receives `{ qrToken }` (or `{ cardCode }` / `{ nfcUid }`) and resolves the card via `cardService.resolveCard`.
- **Emergency Verification (Public):** `GET /api/emergency/public/:qrToken` finds `Card.findOne({ qrToken })`, retrieves the linked `EmergencyProfile`, and returns strictly the fields permitted in `visibleFields`.

### 1.2 Codebase QR Touchpoints (File and Line Registry)

#### Backend (`smartpass-backend/src/`)
- `models/Card.js:39-44`: Definition of `qrToken` (String, required, unique, trim).
- `services/cardService.js:53-61`: Generation of `crypto.randomBytes(32).toString('hex')` on card creation.
- `services/cardService.js:243-268`: Helper `resolveCard({ cardCode, nfcUid, qrToken })`.
- `services/emergencyService.js:86-103`: Token rotation function `rotateQrToken`.
- `services/emergencyService.js:108-142`: Public lookup `getPublicEmergencyInfo(qrToken)`.
- `services/attendanceService.js:9, 19`: Attendance check using `qrToken`.
- `services/canteenService.js:57, 66`: Wallet pay using `qrToken`.
- `services/parkingService.js:9, 50`: Parking check-in/out using `qrToken`.
- `controllers/emergencyController.js:45`: Reading `req.params.qrToken`.
- `routes/emergencyRoutes.js:8, 13`: Endpoints `GET /public/:qrToken` and `POST /me/rotate-qr`.
- `seed/seed-rich.js:274`: Deterministic PRNG QR token generation for seed dataset.

#### Admin Web (`smartpass-admin-web/src/`)
- `api/services.ts:28, 151, 237, 266, 303, 318, 324, 429-434`: API interfaces accepting `qrToken`.
- `utils/format.ts:45-48`: Helper `maskQrToken(token)` (first 6 + "…" + last 4).
- `constants/messages.ts:32, 52, 111-112`: Vietnamese feedback messages for QR copy and rotation.
- `pages/Cards.tsx:68, 285-298, 605`: Column displaying masked `qrToken`, copy QR token action, verify by QR input.
- `pages/Emergency.tsx:47, 108, 175, 230-298`: Rotate QR token confirm dialog, masked QR token display, and public QR verifier tool.
- `pages/Wallet.tsx:40, 297`: Identifier selector with `Mã QR Token`.
- `pages/Attendance.tsx:35, 215`: Identifier selector with `Mã QR Token`.
- `pages/Parking.tsx:32, 227`: Identifier selector with `Mã QR Token`.

#### Android App (`smartpass-android/app/src/main/`)
- `data/model/ApiModels.kt:40, 158, 179, 204, 218, 237, 245, 252, 259`: Data classes containing `qrToken: String`.
- `data/remote/SmartPassApiService.kt:95, 99-100`: Retrofit definitions for `rotate-qr` and `public/{qrToken}`.
- `data/local/TokenManager.kt:22, 100-106`: Encrypted persistence of `card_qr_token`.
- `core/qr/QrPayloadParser.kt:1-28`: Pure Kotlin parser handling 64-char hex token, emergency URL, and cardCode regex.
- `ui/components/QRCodeImage.kt:27-115`: ZXing-powered QR code image generator (`BarcodeFormat.QR_CODE`).
- `ui/components/CameraViewfinder.kt:46-150`: CameraX + Google ML Kit `BarcodeScanning` engine.
- `ui/components/ScannerOverlay.kt:39-160`: Viewfinder reticle overlay, single-scan lock, permission handling, manual input.
- `ui/screens/card/MyCardScreen.kt:138-195`: Rendering student digital identity QR card using `QRCodeImage(state.qrToken)`.
- `ui/screens/scan/ScanScreen.kt:69-76`: Student scanning entry point directing to `viewModel.onQrScanned`.
- `ui/screens/public_emergency/PublicEmergencyScreen.kt:1-120`: Emergency medical profile view from scanned QR deep-link.
- `ui/screens/staff_verify/StaffCardVerifyScreen.kt:61`: Staff verification scanning.
- `ui/screens/staff_parking/StaffParkingScreen.kt:168, 254`: Staff parking check-in/out scanning.
- `ui/screens/staff_library/StaffLibraryScreen.kt:190, 274`: Staff library loan/return scanning.
- `ui/screens/staff_attendance/StaffAttendanceScreen.kt:138`: Staff classroom attendance scanning.
- `ui/screens/staff_canteen/StaffCanteenScreen.kt:225`: Staff canteen POS scanning.

---

## 2. ENTITY INVENTORY: Available Real Targets for Sample Kit

| Phân hệ / Nghiệp vụ | Model hiện hữu trong CSDL | Định danh thực thể sẵn có | Tình trạng hỗ trợ mã in tĩnh | Ghi chú & Kiến trúc cho QrCode Registry |
|---|---|---|---|---|
| **Căng tin (CANTEEN_POINT)** | `CanteenTransaction`, `Wallet` | Không có bảng riêng cho quầy thu ngân | **Cần gán mã định danh quầy** | Đăng ký quầy vật lý trong `QrCode` registry (`refKind: 'counter'`, `refId: 'CANTEEN-POS-01'`, label: "Quầy Căng tin Số 1"). |
| **Thư viện (BOOK)** | `LibraryLoan` | `bookCode` (15 mã: `BK-001` .. `BK-015`), `bookTitle` | **Sẵn sàng** | Đăng ký trực tiếp `refKind: 'book'`, `refId: bookCode`, `label: bookTitle`. |
| **Gửi xe (PARKING_IN, PARKING_OUT)** | `ParkingSession` | Không có bảng riêng cho cổng bãi xe | **Cần gán mã định danh cổng** | Đăng ký cổng vào/ra trong `QrCode` registry (`refKind: 'gate'`, `refId: 'GATE-PARK-IN-01'` & `'GATE-PARK-OUT-01'`). |
| **Điểm danh (ATTENDANCE_SESSION)** | `ClassSchedule`, `Attendance` | `classSession` (ví dụ: `SES-SE101-20261111`) | **Sẵn sàng (Mã Động)** | Giáo viên/admin tạo mã động 15 phút từ `ClassSchedule`. Không in mã tĩnh vì là mã chống gian lận. |
| **Phòng học (ROOM)** | `RoomBooking` | Tên phòng (6 phòng: `Phòng Lab Tin học B201`, v.v.) | **Sẵn sàng** | Đăng ký trực tiếp `refKind: 'room'`, `refId: room`, `label: room`. |
| **Sự kiện (EVENT)** | `Event`, `EventRegistration` | `event._id` (15 sự kiện, ví dụ: Smart Campus Hackathon) | **Sẵn sàng** | Poster in mã tĩnh `refKind: 'event'`, `refId: event._id`. Cổng check-in tạo mã động tại thời điểm sự kiện. |
| **Cổng trường (GATE_IN, GATE_OUT)** | `AccessLog` | `location` ("Cổng chính - Turnstile 01", v.v.) | **Cần gán mã cổng** | Đăng ký trong `QrCode` registry (`refKind: 'gate'`, `refId: 'CAMPUS-GATE-IN-01'`, `label: "Cổng chính - Lối vào"`). Ghi log vào `AccessLog(action='entry'|'exit')`. |

---

## 3. LIBRARY CHECK

- **Backend (`smartpass-backend`):**
  - Hiện chưa cài đặt thư viện tạo mã QR (chỉ có `crypto` để sinh chuỗi ngẫu nhiên).
  - *Giải pháp:* Cài đặt gói `qrcode` (`npm install qrcode`) để sinh ảnh PNG (1024px) và SVG đạt chuẩn Error Correction Level `Q`.
- **Admin Web (`smartpass-admin-web`):**
  - Đã có thư viện `antd` (`^5.21.0`), bao gồm component chính thức `<QRCode />` hỗ trợ render cả Canvas và SVG.
- **Android App (`smartpass-android`):**
  - Đã có `com.google.zxing:core:3.5.3` (dùng trong `QRCodeImage.kt`) để vẽ Bitmap mã QR.
  - Đã có `androidx.camera` và `com.google.mlkit:barcode-scanning:17.2.0` để quét mã QR qua camera vật lý.

---

## 4. PROMPT 7 PRE-CHECK (Kiểm tra đặc quyền)

- **Tệp kiểm tra:** `smartpass-backend/src/services/authService.js:63`
- **Logic hiện tại:**
  ```javascript
  role: (process.env.NODE_ENV === 'test' && role) ? role : 'student',
  ```
- **Xác thực:** Endpoint công khai `POST /api/auth/register` luôn ép buộc vai trò người dùng đăng ký là `'student'`. Không thể leo thang đặc quyền thành admin hoặc staff từ request body.
- **Trạng thái:** **PASS - KHÔNG CÓ BLOCKER B1**.

---

## 5. KẾT LUẬN & TRẠNG THÁI BLOCKER

- **Blocker B1:** ĐÃ GIẢI QUYẾT (role registration an toàn).
- **Blocker B2:** ĐÃ GIẢI QUYẾT (xác định rõ ràng định dạng thẻ và cấp cứu từ code).
- **Blocker B3:** ĐÃ GIẢI QUYẾT (bộ seed phong phú `seed-rich.js` đã có đầy đủ 120 sinh viên, 15 sách, 6 phòng, 15 sự kiện, 30 lịch học).

Hệ thống đủ điều kiện chuyển tiếp trực tiếp vào **Phase 1**.

