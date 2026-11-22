# SmartPass Debug Feature Inventory (Step 0)
**Date:** 2026-11-11  
**Project:** `smartpass-android`

Every debug feature, developer hook, demo bypass, and insecure logging pattern identified in the codebase is cataloged below, along with its resolution path for Phase 5.

---

## Catalog of Debug Artifacts

### 1. `HttpLoggingInterceptor.Level.BODY` in ApiClient
- **Location:** `app/src/main/java/com/smartpass/app/data/remote/ApiClient.kt:93-94`
- **How Reached:** Unconditionally executed on every HTTP network request and response.
- **Risk:** Logs plain text passwords on `/api/auth/login` and `/api/auth/register`, full `Authorization: Bearer <jwt>` tokens on all API calls, and medical data from emergency profiles directly into Android logcat.
- **Phase 5 Verdict:** **DELETE / REPLACE**
  - Replace direct `Level.BODY` interceptor with a custom logging wrapper.
  - In `debug` build: Log HTTP status lines only, explicitly redacting `Authorization`, `password`, `qrToken`, and emergency profile bodies.
  - In `release` build: Level set to `NONE` or `WARN` only.

---

### 2. "Đổi máy chủ" Server Switcher Dialog in ErrorView
- **Location:** `app/src/main/java/com/smartpass/app/ui/components/StateViews.kt:101-102, 183-198`
- **How Reached:** Displayed on any screen when a network connection error occurs; shows a prominent button "Đổi máy chủ" that opens a dialog to switch between `127.0.0.1:3000`, `192.168.155.96:3000`, and `10.0.2.2:3000`.
- **Risk:** Allows end-users in production to change the backend endpoint of the app to arbitrary third-party URLs.
- **Phase 5 Verdict:** **DEBUG-BUILD-ONLY**
  - Move the server configuration dialog to `src/debug/java` (or gate with `BuildConfig.DEBUG`).
  - In `release` build, `ErrorView` shows only the "Thử lại" button; the server URL is immutable and strictly points to production backend with `cleartextTraffic="false"`.

---

### 3. Dynamic Custom Base URL in TokenManager & DataStore
- **Location:** `app/src/main/java/com/smartpass/app/data/local/TokenManager.kt:18, 21-33`
- **How Reached:** Read on app start via `ApiClient.init(context)`.
- **Risk:** Release builds should never allow dynamic base URL substitution via preferences.
- **Phase 5 Verdict:** **DEBUG-BUILD-ONLY**
  - Gate `saveCustomBaseUrl` and dynamic base URL reading behind `BuildConfig.DEBUG`.
  - In `release` build, base URL is a static compile-time constant `BuildConfig.API_BASE_URL`.

---

### 4. Direct `Log.*` Calls
- **Location:** Grepped across codebase — currently no unmanaged `android.util.Log` calls exist in UI or business logic.
- **Phase 5 Verdict:** **MAINTAIN**
  - Ensure any future logs go through a centralized `AppLogger` utility that drops all messages below `WARN` in release builds.

---

### 5. Demo / Bypass Authentication Paths
- **Location:** Checked across `LoginScreen.kt`, `NavGraph.kt`, and ViewModels.
- **Finding:** No "Skip login" buttons, no hard-coded mock credentials, and no demo account fast-login buttons exist in the app navigation or UI. Authentication strictly hits `/api/auth/login`.
- **Phase 5 Verdict:** **CLEAN** (No action needed).

---

### 6. Simulated Scan Success Paths
- **Location:** `ScannerOverlay.kt:88-102`
- **Finding:** Viewfinder currently has a manual input text box ("Nhập mã thủ công") to enter a cardCode or QR token.
- **Phase 5 Verdict:** **INTENDED MANUAL FALLBACK** (As required by spec Phase 2: keep manual cardCode text field for phones without camera; real API verification must be called).

