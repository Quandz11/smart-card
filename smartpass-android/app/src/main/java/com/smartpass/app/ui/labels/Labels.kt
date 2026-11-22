package com.smartpass.app.ui.labels

import androidx.compose.ui.graphics.Color
import com.smartpass.app.ui.theme.*

object Labels {

    fun getRoleLabel(role: String?): String {
        return when (role?.lowercase()) {
            "admin" -> "Quản trị viên"
            "student" -> "Sinh viên"
            "librarian" -> "Thủ thư"
            "canteen_staff" -> "Nhân viên căng tin"
            "parking_staff" -> "Nhân viên bãi xe"
            else -> role ?: "Không rõ"
        }
    }

    fun getCardStatusLabel(status: String?): String {
        return when (status?.lowercase()) {
            "active" -> "Hoạt động"
            "locked" -> "Bị khóa"
            "lost" -> "Báo mất"
            "expired" -> "Hết hạn"
            else -> status ?: "Không rõ"
        }
    }

    fun getCardStatusColor(status: String?): Pair<Color, Color> {
        // Returns Pair(TextColor, ContainerColor)
        return when (status?.lowercase()) {
            "active" -> Pair(SuccessGreen, SuccessContainerLight)
            "locked" -> Pair(WarningAmber, WarningContainerLight)
            "lost" -> Pair(ErrorRed, ErrorContainerLight)
            "expired" -> Pair(TextSecondaryLight, SurfaceVariantLight)
            else -> Pair(TextSecondaryLight, SurfaceVariantLight)
        }
    }

    fun getAttendanceStatusLabel(status: String?): String {
        return when (status?.lowercase()) {
            "present" -> "Có mặt"
            "late" -> "Đi muộn"
            "absent" -> "Vắng mặt"
            "excused" -> "Có phép"
            else -> status ?: "Không rõ"
        }
    }

    fun getAttendanceStatusColor(status: String?): Pair<Color, Color> {
        return when (status?.lowercase()) {
            "present" -> Pair(SuccessGreen, SuccessContainerLight)
            "late" -> Pair(WarningAmber, WarningContainerLight)
            "absent" -> Pair(ErrorRed, ErrorContainerLight)
            "excused" -> Pair(BrandTealPrimary, BrandTealContainerLight)
            else -> Pair(TextSecondaryLight, SurfaceVariantLight)
        }
    }

    fun getLibraryStatusLabel(status: String?): String {
        return when (status?.lowercase()) {
            "borrowed" -> "Đang mượn"
            "returned" -> "Đã trả"
            "overdue" -> "Quá hạn"
            else -> status ?: "Không rõ"
        }
    }

    fun getLibraryStatusColor(status: String?): Pair<Color, Color> {
        return when (status?.lowercase()) {
            "borrowed" -> Pair(BrandSkySecondary, BrandSkyContainerLight)
            "returned" -> Pair(SuccessGreen, SuccessContainerLight)
            "overdue" -> Pair(ErrorRed, ErrorContainerLight)
            else -> Pair(TextSecondaryLight, SurfaceVariantLight)
        }
    }

    fun getParkingStatusLabel(status: String?): String {
        return when (status?.lowercase()) {
            "parked", "active" -> "Đang gửi"
            "completed" -> "Đã lấy xe"
            else -> status ?: "Không rõ"
        }
    }

    fun getParkingStatusColor(status: String?): Pair<Color, Color> {
        return when (status?.lowercase()) {
            "parked", "active" -> Pair(BrandTealPrimary, BrandTealContainerLight)
            "completed" -> Pair(TextSecondaryLight, SurfaceVariantLight)
            else -> Pair(TextSecondaryLight, SurfaceVariantLight)
        }
    }

    fun getRoomBookingStatusLabel(status: String?): String {
        return when (status?.lowercase()) {
            "pending" -> "Chờ duyệt"
            "approved" -> "Đã duyệt"
            "rejected" -> "Từ chối"
            "cancelled" -> "Đã hủy"
            else -> status ?: "Không rõ"
        }
    }

    fun getRoomBookingStatusColor(status: String?): Pair<Color, Color> {
        return when (status?.lowercase()) {
            "pending" -> Pair(WarningAmber, WarningContainerLight)
            "approved" -> Pair(SuccessGreen, SuccessContainerLight)
            "rejected" -> Pair(ErrorRed, ErrorContainerLight)
            "cancelled" -> Pair(TextSecondaryLight, SurfaceVariantLight)
            else -> Pair(TextSecondaryLight, SurfaceVariantLight)
        }
    }

    fun getTransactionTypeLabel(type: String?): String {
        return when (type?.lowercase()) {
            "topup" -> "Nạp tiền"
            "payment" -> "Thanh toán"
            else -> type ?: "Giao dịch"
        }
    }

    object Empty {
        const val ATTENDANCE = "Chưa có lượt điểm danh nào"
        const val LIBRARY = "Bạn chưa mượn cuốn sách nào"
        const val WALLET = "Chưa có giao dịch nào"
        const val PARKING = "Chưa có lượt gửi xe nào"
        const val ROOM_BOOKINGS = "Bạn chưa có lịch đặt phòng nào"
        const val EVENTS = "Không có sự kiện sắp tới"
        const val NOTIFICATIONS = "Không có thông báo mới"
        const val SCHEDULE = "Không có lịch học hôm nay"
        const val STAFF_ACTIVE_PARKING = "Hiện không có phương tiện nào trong bãi"
        const val STAFF_LIBRARY_LOANS = "Không có sách nào đang mượn"
    }
}

