package com.smartpass.app.ui.navigation

sealed class Screen(val route: String, val title: String) {
    // Auth
    object Login : Screen("login", "Đăng nhập")
    object Register : Screen("register", "Đăng ký")
    object PinSetup : Screen("pin_setup", "Thiết lập mã PIN ví")
    object SmartOtp : Screen("smart_otp", "Xác thực Smart OTP")

    // Student Screens
    object Home : Screen("home", "Trang chủ")
    object MyCard : Screen("my_card", "Thẻ của tôi")
    object Attendance : Screen("attendance", "Điểm danh")
    object Library : Screen("library", "Thư viện")
    object Wallet : Screen("wallet", "Ví căng tin")
    object Parking : Screen("parking", "Bãi gửi xe")
    object RoomBookings : Screen("room_bookings", "Đặt phòng")
    object Events : Screen("events", "Sự kiện")
    object Schedule : Screen("schedule", "Thời khóa biểu")
    object Notifications : Screen("notifications", "Thông báo")
    object Profile : Screen("profile", "Tài khoản")
    object EmergencyProfile : Screen("emergency_profile", "Thẻ khẩn cấp")
    object Scan : Screen("scan", "Quét mã")

    // Public Zero-Knowledge Scan
    object PublicEmergency : Screen("public_emergency/{qrToken}", "Thông tin khẩn cấp") {
        fun createRoute(qrToken: String) = "public_emergency/$qrToken"
    }

    // Staff Operation Screens
    object StaffHome : Screen("staff_home", "Bàn làm việc cán bộ")
    object StaffAttendance : Screen("staff_attendance", "Điểm danh ca học")
    object StaffLibrary : Screen("staff_library", "Quản lý thư viện")
    object StaffCanteen : Screen("staff_canteen", "Thu ngân căng tin")
    object StaffParking : Screen("staff_parking", "Kiểm soát bãi xe")
    object StaffRoomApproval : Screen("staff_room_approval", "Duyệt đặt phòng")
    object StaffCardVerify : Screen("staff_card_verify", "Xác thực thẻ")
}
