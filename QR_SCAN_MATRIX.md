# SmartPass Physical Phone QR Scan Test Matrix

**Device Under Test:**
- **Model:** ASUS ROG Phone 3 (`ASUS_I003DD`)
- **OS Version:** Android 12 (Kernel 4.19, Build `SKQ1.210821.001`)
- **ADB Serial:** `L7AIKN05D915MVN`
- **App Version:** SmartPass Android Debug (`com.smartpass.app`)
- **Backend Host:** Node.js v20.x + Express, MongoDB Atlas (`ac-b7oyfoz-shard-00`)
- **Port Forwarding:** `adb reverse tcp:3000 tcp:3000` (LAN IP fallback: `http://192.168.155.96:3000`)
- **Date Tested:** November 12, 2026

---

## 1. Test Summary

| Total Scenarios | Passed | Failed | Blocked | Pass Rate |
|:---------------:|:------:|:------:|:-------:|:---------:|
| **16**          | **16** | **0**  | **0**   | **100%**  |

---

## 2. Test Execution Details

### T01: CANTEEN_POINT (Static Counter QR)
- **Sample Code:** `canteen_point-canteen-pos-01.png`
- **Human Code:** `CANTEEN-cpos01` (`SP1://CANTEEN_POINT/cpos-01?s=...`)
- **Target Entity:** Quầy Căn Tin Số 1 (Nhà Căn Tin A)
- **Expected Behavior:** App opens scanner -> detects canonical `SP1://` -> resolves via `POST /api/qr/resolve` -> receives `nextAction: 'wallet_pay'` -> opens payment bottom sheet -> user inputs amount (e.g. 25.000 ₫) -> clicks "Thanh toán" -> backend processes `POST /api/wallet/pay` with UUID idempotency key -> wallet balance decreases, 1 `AccessLog` recorded.
- **Observed Behavior:** Bottom sheet appeared with teal header "Thanh toán căn tin: Quầy Căn Tin Số 1". Balance update reflected immediately (500.000 ₫ -> 475.000 ₫).
- **Result:** **PASS**

### T02: PAYMENT_REQUEST (Staff-Generated Dynamic Canteen QR)
- **Sample Code:** Generated via Staff Canteen UI (`POST /api/wallet/payment-request`)
- **Human Code:** Dynamic `CANTEEN-xxxxxx` (TTL 2 minutes)
- **Target Entity:** Fixed amount payment request (35.000 ₫)
- **Expected Behavior:** Student scans code -> resolve identifies `nextAction: 'wallet_pay'` with fixed `amount: 35000` -> confirmation dialog displays exact amount (no editing needed) -> confirm deducts balance once. Second scan fails with "Yêu cầu thanh toán không tồn tại hoặc đã được sử dụng".
- **Observed Behavior:** Promptly opened payment sheet pre-filled with 35.000 ₫. Successful payment; re-scanning the expired/consumed nonce returned HTTP 400 error as designed.
- **Result:** **PASS**

### T03: BOOK (Library Static Book Tag)
- **Sample Code:** `book-bk-001.png`
- **Human Code:** `BOOK-076791` (`SP1://BOOK/bk-001?s=...`)
- **Target Entity:** Sách `BK-001` (*Lập trình Android nâng cao*)
- **Expected Behavior:** Resolves to `nextAction: 'library_borrow'` -> shows Book Borrow sheet displaying title, code, author -> user confirms -> `POST /api/library/borrow` creates `LibraryLoan` -> active loans count increments (respects max 3 active loans limit).
- **Observed Behavior:** Book info rendered accurately: "Lập trình Android nâng cao (BK-001)". Borrow succeeded. Attempting 4th borrow returns 400 with maximum limit notice.
- **Result:** **PASS**

### T04: PARKING_IN (Gate Check-In)
- **Sample Code:** `parking_in-parking-gate-in-01.png`
- **Human Code:** `PARKING-gin01`
- **Target Entity:** Cổng Bãi Xe Vào 1 (Bãi xe khu A)
- **Expected Behavior:** Resolves to `nextAction: 'parking_toggle'` (direction: `in`) -> user confirms check-in (optional license plate input) -> `POST /api/parking/check-in` creates session with `status: 'in'`.
- **Observed Behavior:** Check-in completed in 180ms. Active parking card badge updated in UI. Scanning `PARKING_IN` again while still checked-in returned HTTP 409 "Card already has an active parking session".
- **Result:** **PASS**

### T05: PARKING_OUT (Gate Check-Out & Fee Calculation)
- **Sample Code:** `parking_out-parking-gate-out-01.png`
- **Human Code:** `PARKING-gout01`
- **Target Entity:** Cổng Bãi Xe Ra 1
- **Expected Behavior:** Resolves to `nextAction: 'parking_toggle'` (direction: `out`) -> confirms check-out -> calculates fee = `ceil(hours parked) * 2000 VND` -> session marked `status: 'out'`.
- **Observed Behavior:** Fee calculated as 2.000 ₫. Parking session closed successfully and logged in `AccessLog`.
- **Result:** **PASS**

### T06: ATTENDANCE_SESSION (Dynamic 15-Minute Lecture QR)
- **Sample Code:** Generated from Lecturer Attendance screen (`POST /api/attendance/sessions/:id/qr`)
- **Human Code:** `ATTEND-xxxxxx` (expiry = now + 900s)
- **Target Entity:** Lớp học SE101 - Ca sáng (Phòng A101)
- **Expected Behavior:** Enrolled student scans within 15 min -> resolves `nextAction: 'attendance_check'` -> checks in via `POST /api/attendance/check` -> attendance record saved. If scanned by a student from a different class (e.g. AI201), backend responds 403 "Bạn không thuộc lớp học này".
- **Observed Behavior:** Enrolled student checked in with green snackbar notification. Unenrolled student account received 403 with error dialog. Expired token (>15 min) returned 400 "Mã QR đã hết hạn, vui lòng quét mã mới".
- **Result:** **PASS**

### T07: ROOM (Classroom / Facility Information)
- **Sample Code:** `room-a101.png`
- **Human Code:** `ROOM-A10101`
- **Target Entity:** Phòng học A101 (Tòa nhà A)
- **Expected Behavior:** Resolves to `nextAction: 'room_detail'` -> displays room detail sheet containing current occupancy status, scheduled lectures, and upcoming bookings. No mutation / AccessLog written.
- **Observed Behavior:** Bottom sheet rendered schedule timeline for A101 with real database classes. No AccessLog written during resolution.
- **Result:** **PASS**

### T08: EVENT (Poster Registration QR)
- **Sample Code:** `event-ev-tech-2026.png`
- **Human Code:** `EVENT-tech01`
- **Target Entity:** Workshop Công Nghệ 2026 (Hội trường C)
- **Expected Behavior:** Resolves to `nextAction: 'event_detail'` -> shows event banner, date, venue, seats remaining -> user confirms registration -> `POST /api/events/:id/register` registers user.
- **Observed Behavior:** Registration succeeded; duplicate registration attempt prevented with "Bạn đã đăng ký tham gia sự kiện này".
- **Result:** **PASS**

### T09: EVENT_CHECKIN (Dynamic Entry Pass at Venue Gate)
- **Sample Code:** Generated by Event Coordinator (`POST /api/events/:id/checkin-qr`)
- **Human Code:** `EVENT-entry1`
- **Target Entity:** Cổng điểm danh Workshop Công Nghệ 2026
- **Expected Behavior:** Registered student scans at entrance -> records attendance for event. Unregistered attendee prompted to register first.
- **Observed Behavior:** Checked in attendee; event participation confirmed.
- **Result:** **PASS**

### T10: GATE_IN (Campus Entrance Gate & Double-Scan Rule)
- **Sample Code:** `gate_in-campus-gate-in-01.png`
- **Human Code:** `GATE-gin001`
- **Target Entity:** Cổng Chính Vào (Cổng Đông)
- **Expected Behavior:** First scan: resolves `nextAction: 'gate_toggle'` -> confirm creates `action: 'entry'` in `AccessLog`. Second scan immediately afterwards: backend checks user's latest AccessLog and identifies duplicate entry -> returns 200 with `{ duplicate: true, message: 'Bạn đã ghi nhận vào cổng trước đó' }` -> NO new AccessLog created.
- **Observed Behavior:** First scan created log. Second scan showed warning toast "Bạn đã ghi nhận vào cổng trước đó" and zero extra database rows were written.
- **Result:** **PASS**

### T11: GATE_OUT (Campus Exit Gate)
- **Sample Code:** `gate_out-campus-gate-out-01.png`
- **Human Code:** `GATE-gout01`
- **Target Entity:** Cổng Chính Ra
- **Expected Behavior:** Resolves `nextAction: 'gate_toggle'` (direction: `out`) -> logs exit in `AccessLog`.
- **Observed Behavior:** Gate exit recorded with timestamp. Consecutive exit without an entry triggers duplicate warning.
- **Result:** **PASS**

### T12: Human Code Manual Entry
- **Input:** `BOOK-076791` (typed in manual input textfield)
- **Expected Behavior:** Parser parses `QrPayload.HumanCode("BOOK", "076791")` -> resolve API fetches book entity -> routes to library borrow confirmation sheet.
- **Observed Behavior:** Modal instantly resolved book `BK-001` and displayed book borrow confirmation sheet.
- **Result:** **PASS**

### T13: Legacy Physical Card QR
- **Sample Code:** Raw 64-char hex `qrToken` (student ID card)
- **Expected Behavior:** Staff verifies card via `POST /api/cards/verify` -> returns card status, student name, and studentCode.
- **Observed Behavior:** Staff card scanner recognized raw hex token without regression and displayed card owner info.
- **Result:** **PASS**

### T14: Public Emergency Health QR
- **Sample Code:** `https://smartpass.edu.vn/emergency/<token>`
- **Expected Behavior:** Opening emergency URL or API endpoint returns ONLY fields configured in `visibleFields`. Hidden fields (`allergies`, `bloodType`, etc. when unchecked) stay completely absent from JSON payload.
- **Observed Behavior:** Public emergency endpoint delivered sanitized JSON containing only explicitly exposed contact info.
- **Result:** **PASS**

### T15: Tampered Signature Rejection
- **Input:** `SP1://BOOK/bk-001?s=invalid_tampered_hmac_signature`
- **Expected Behavior:** Backend rejects HMAC signature mismatch -> HTTP 400 "Mã QR không hợp lệ". App displays error dialog.
- **Observed Behavior:** Handled gracefully with red alert banner in app. No database state changed.
- **Result:** **PASS**

### T16: Revoked & Regenerated QR Code
- **Action:** Admin revokes QR code in Admin Web (`/qr`) -> student scans -> rejected 400 "Mã QR đã bị thu hồi". Admin clicks "Tạo lại mã QR" -> new payload generated -> student scans new code -> succeeds.
- **Observed Behavior:** Revoked code showed revocation message; regenerated code worked immediately.
- **Result:** **PASS**

