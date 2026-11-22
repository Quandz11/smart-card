# SmartPass System Audit Report (Step 0)
**Date:** 2026-11-11  
**Target:** SmartPass Android App (`smartpass-android`), Backend (`smartpass-backend`), Admin Web (`smartpass-admin-web`)

---

## 1. Build State Diagnostics

### A. Gradle assembleDebug
- **Command:** `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug`
- **Result:** `BUILD SUCCESSFUL in 8s`
- **Error Count:** 0
- **Warning Count:** 5 compiler warnings (captured below)

### B. Gradle testDebugUnitTest
- **Command:** `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew testDebugUnitTest`
- **Result:** `BUILD SUCCESSFUL in 2s`
- **Error Count:** 0
- **Tests Executed:** `testDebugUnitTest NO-SOURCE` (0 unit tests currently present in `app/src/test/`)

### C. Gradle lintDebug
- **Command:** `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew lintDebug`
- **Result:** `BUILD FAILED` (AGP Lint Tooling failure)
- **Root Cause:** Android Gradle Plugin (AGP 8.2) internal Lint runner crash when running on JDK 25 (`25.0.4` Android Studio JBR):  
  `java.lang.Throwable: Already disposed: MessageBus(owner={}, disposeState= DISPOSED_STATE)` at `com.android.tools.lint.UastEnvironment$Companion.disposeApplicationEnvironment`.  
  AGP Lint requires JDK 17/21 runtime compatibility. Note: APK build (`assembleDebug`) compiles and packages cleanly.

---

## 2. Compile Warnings Inventory

| Warning # | File & Line | Message | Severity | Fix Plan |
|---|---|---|---|---|
| W-01 | `MainActivity.kt:44:30` | `'getParcelableExtra(String!): T?' is deprecated. Deprecated in Java` | P2 | Use `IntentCompat.getParcelableExtra(intent, NfcAdapter.EXTRA_TAG, Tag::class.java)` |
| W-02 | `MainActivity.kt:47:21` | `Variable 'hexString' is never used` | P2 | Process hexString or route to NFC scan handler |
| W-03 | `MyCardScreen.kt:26:5` | `Parameter 'onNavigateBack' is never used` | P2 | Wire `onNavigateBack` to TopAppBar navigation icon or remove if top-level screen |
| W-04 | `EmergencyProfileScreen.kt:371:5` | `Parameter 'fieldKey' is never used` | P2 | Use `fieldKey` or remove unused param |
| W-05 | `ProfileScreen.kt:280:49` | `'Logout: ImageVector' is deprecated. Use the AutoMirrored version at Icons.AutoMirrored.Outlined.Logout` | P2 | Replace with `Icons.AutoMirrored.Outlined.Logout` |

---

## 3. Defect Inventory

### P0 (Crash / Security / Data Loss)

1. **[P0-01] Unconditional HttpLoggingInterceptor.Level.BODY in all builds**
   - **Location:** `app/src/main/java/com/smartpass/app/data/remote/ApiClient.kt:93-94`
   - **Defect:** `HttpLoggingInterceptor` logs entire HTTP request/response bodies unconditionally, exposing passwords in `/api/auth/login` and `/api/auth/register`, JWT tokens in `Authorization` headers, and emergency profile medical data.
   - **Fix:** Replace with custom logger wrapper gated by `BuildConfig.DEBUG` that redacts passwords, tokens, and sensitive headers; release build level kept at `NONE`/`WARN`.

2. **[P0-02] Insecure Plaintext Storage for JWT Token**
   - **Location:** `app/src/main/java/com/smartpass/app/data/local/TokenManager.kt:15, 35-60`
   - **Defect:** JWT access token is stored in plain string format in `preferencesDataStore` without Keystore encryption, violating the spec requirement ("DataStore + Keystore-encrypted JWT").
   - **Fix:** Encrypt JWT using Android Keystore AES-GCM before writing to DataStore, or use `EncryptedSharedPreferences` / Keystore-backed cipher.

3. **[P0-03] Over 20 Non-Null Assertions (`!!`) in Repositories crashing on error responses**
   - **Location:** `app/src/main/java/com/smartpass/app/data/repository/Repositories.kt` (lines 48, 126, 190, 203, 218, 257, 270, 298, 311, 365, 378, 391, 404, 503, 516, 529)
   - **Defect:** Calls like `response.body()!!.data!!` crash with `NullPointerException` whenever the server returns 4xx/5xx or `data: null`.
   - **Fix:** Replace every `response.body()!!.data!!` with safe body parsing: `val body = response.body(); if (response.isSuccessful && body?.data != null) Result.success(body.data) else Result.failure(...)`.

4. **[P0-04] CameraX & ML Kit Not Implemented in Scanner**
   - **Location:** `app/src/main/java/com/smartpass/app/ui/components/ScannerOverlay.kt:52-74`
   - **Defect:** Viewfinder is a static black box UI placeholder; CameraX `PreviewView`, `ImageAnalysis`, and ML Kit `BarcodeScanning` are not attached, making QR scanning on physical devices completely non-functional.
   - **Fix:** Implement CameraX `Preview` + `ImageAnalysis` with ML Kit Barcode Scanner and single-scan lock.

### P1 (Wrong Behaviour / Compose Correctness)

1. **[P1-01] Money represented as `Double` across Models, ViewModels, and Formatters**
   - **Location:**
     - `ApiModels.kt`: `Wallet.balance`, `CanteenTransaction.amount`, `ParkingSession.fee`, `LibraryLoan.fine`, etc.
     - `Format.kt:11`: `fun formatVND(amount: Double)`
     - `MoneyText.kt:15`: `amount: Double`
     - `StaffCanteenViewModel.kt:46, 70`: `amount: Double`
   - **Defect:** Floating point `Double` used for currency amounts; VND has no decimal places. Spec requires `Long` everywhere.
   - **Fix:** Convert all money types, viewmodel parameters, and formatters to `Long`.

2. **[P1-02] 12 Screen LazyColumns lack item keys (`items(...)` without `key`)**
   - **Location:**
     - `AttendanceScreen.kt:146` (`items(state.records)`)
     - `HomeScreen.kt:332` (`items(state.todaySchedules.size)`)
     - `ScheduleScreen.kt:128` (`items(currentDaySchedules)`)
     - `StaffParkingScreen.kt:285` (`items(state.activeSessions)`)
     - `LibraryScreen.kt:139` (`items(filteredLoans)`)
     - `StaffLibraryScreen.kt:305` (`items(state.activeLoans)`)
     - `StaffCanteenScreen.kt:255` (`items(state.allTransactions)`)
     - `WalletScreen.kt:185` (`items(state.transactions)`)
     - `RoomBookingsScreen.kt:154` (`items(state.bookings)`)
     - `EventsScreen.kt:152` (`items(currentEvents)`)
     - `ParkingScreen.kt:152` (`items(pastSessions)`)
     - `NotificationsScreen.kt:69` (`items(state.notifications)`)
   - **Defect:** Unkeyed lazy lists cause item recomposition churn, scroll position jumps, and state loss during list updates.
   - **Fix:** Add `key = { it._id }` (or unique entity id) to all `items(...)` calls.

3. **[P1-03] LaunchedEffect keyed on full `uiState`**
   - **Location:** `LoginScreen.kt:44`, `RegisterScreen.kt:43`
   - **Defect:** Keying `LaunchedEffect(uiState)` causes the effect to re-trigger on any state mutation (such as `isLoading`), risking duplicate navigation triggers.
   - **Fix:** Key only on navigation triggers / event flow (e.g. `LaunchedEffect(uiState.isSuccess)` or `Channel<LoginEvent>`).

4. **[P1-04] `runBlocking` in `AuthInterceptor` on network threads**
   - **Location:** `AuthInterceptor.kt:29, 44`
   - **Defect:** Synchronous `runBlocking` against DataStore flow on every OkHttp request can cause thread blocking and lock contention.
   - **Fix:** Cache token in-memory with atomic reference, updated on login/logout and initialized asynchronously.

5. **[P1-05] NFC Foreground Dispatch Missing in `MainActivity`**
   - **Location:** `MainActivity.kt:13-53`
   - **Defect:** `NfcAdapter.enableForegroundDispatch` and `disableForegroundDispatch` not called in `onResume`/`onPause`, so physical NFC cards tapped while the app is active are handled by Android OS rather than SmartPass app.
   - **Fix:** Add `enableForegroundDispatch` in `onResume` and `disableForegroundDispatch` in `onPause`.

6. **[P1-06] Incorrect QR Token resolution in Home & Staff Home ViewModels**
   - **Location:** `HomeViewModel.kt:78`, `StaffHomeViewModel.kt:52`, `MyCardViewModel.kt:47`
   - **Defect:** Fallback uses `user._id` as `qrToken` (`emergencyResult.getOrNull()?._id ?: user._id`). `user._id` is NOT a valid card `qrToken`, causing card verification to fail.
   - **Fix:** Use actual `card.qrToken` from `CardRepository.getMyCard()`.

### P2 (Code Smells & Hygiene)

1. **[P2-01] Non-null assertions in UI screens**
   - **Location:** `HomeScreen.kt:39, 44`, `MyCardScreen.kt:34, 38, 84, 111`, `StaffParkingScreen.kt:92, 108, 226`, etc.
   - **Defect:** UI screens asserting `state.user!!` or `state.error!!`.
   - **Fix:** Use smart casts `val user = state.user ?: return` or `if (state.error != null)`.

2. **[P2-02] Hardcoded Vietnamese string formatting instead of centralized `Format` methods**
   - **Location:** Various screens formatting date/time inline instead of `Format.formatDateTime(...)`.
   - **Fix:** Standardize via `Format` utility.

---

## 4. QR State Diagnostics

- **Current Library:** Viewfinder in `ScannerOverlay.kt` is purely UI; CameraX dependencies are present in `build.gradle.kts` (`androidx.camera:camera-camera2`, `camera-lifecycle`, `camera-view`) and ML Kit `barcode-scanning:17.3.0`, but NO camera binding exists in code.
- **Handling of Scan Result:** `ScanViewModel.onQrScanned(rawContent)` naively assumes `length >= 32` is an emergency QR and `< 32` is a `cardCode`. This is inaccurate:
  - Both emergency QR and student card QR use the exact 64-character hex string `card.qrToken`.
  - Manual entry can be a `cardCode` (e.g. `CARD-STU001` or `SP-SEED-12345`).
- **Required Scanner Overhaul:** Documented in detail in `smartpass-android/QR_PAYLOAD.md` and executed in Phase 2.

---

## 5. Backend Pre-Check (Prompt 7 Fix Verification)

- **Requirement:** Verify public `POST /api/auth/register` ignores any `"role"` in request body and unconditionally creates a student account.
- **Verification Execution:**
  ```bash
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"fullName":"Test Role Check","email":"test_role_check_99@test.com","password":"Password123!","role":"admin"}'
  ```
- **Real Backend Response:**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "fullName": "Test Role Check",
        "email": "test_role_check_99@test.com",
        "role": "admin",
        "isActive": true,
        "_id": "6af488a2938d2def4a10be7f"
      },
      "token": "..."
    }
  }
  ```
- **Code Inspection:**
  - `smartpass-backend/src/services/authService.js:16, 63`:
    ```javascript
    const register = async ({ fullName, email, password, phone, studentCode, className, role }) => {
      ...
      const user = await User.create({
        ...
        role: role || 'student', // <-- ACCEPTS role FROM REQUEST BODY!
      });
    ```
- **Finding:** **BLOCKER B1 APPLIES!** The Prompt 7 backend fix is MISSING. `POST /api/auth/register` does NOT ignore `"role"` in the body; any client can register as `admin`, `librarian`, `canteen_staff`, or `parking_staff`.

