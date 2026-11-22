package com.smartpass.app.ui.labels

import org.junit.Assert.assertEquals
import org.junit.Test

class LabelsTest {

    @Test
    fun `getRoleLabel maps all backend roles to proper Vietnamese`() {
        assertEquals("Quản trị viên", Labels.getRoleLabel("admin"))
        assertEquals("Sinh viên", Labels.getRoleLabel("student"))
        assertEquals("Thủ thư", Labels.getRoleLabel("librarian"))
        assertEquals("Nhân viên căng tin", Labels.getRoleLabel("canteen_staff"))
        assertEquals("Nhân viên bãi xe", Labels.getRoleLabel("parking_staff"))
        assertEquals("custom_role", Labels.getRoleLabel("custom_role"))
        assertEquals("Không rõ", Labels.getRoleLabel(null))
    }

    @Test
    fun `getCardStatusLabel maps statuses correctly`() {
        assertEquals("Hoạt động", Labels.getCardStatusLabel("active"))
        assertEquals("Bị khóa", Labels.getCardStatusLabel("locked"))
        assertEquals("Báo mất", Labels.getCardStatusLabel("lost"))
        assertEquals("Hết hạn", Labels.getCardStatusLabel("expired"))
        assertEquals("Không rõ", Labels.getCardStatusLabel(null))
    }

    @Test
    fun `getAttendanceStatusLabel maps statuses correctly`() {
        assertEquals("Có mặt", Labels.getAttendanceStatusLabel("present"))
        assertEquals("Đi muộn", Labels.getAttendanceStatusLabel("late"))
        assertEquals("Vắng mặt", Labels.getAttendanceStatusLabel("absent"))
        assertEquals("Có phép", Labels.getAttendanceStatusLabel("excused"))
    }

    @Test
    fun `getLibraryStatusLabel maps statuses correctly`() {
        assertEquals("Đang mượn", Labels.getLibraryStatusLabel("borrowed"))
        assertEquals("Đã trả", Labels.getLibraryStatusLabel("returned"))
        assertEquals("Quá hạn", Labels.getLibraryStatusLabel("overdue"))
    }

    @Test
    fun `getRoomBookingStatusLabel maps statuses correctly`() {
        assertEquals("Chờ duyệt", Labels.getRoomBookingStatusLabel("pending"))
        assertEquals("Đã duyệt", Labels.getRoomBookingStatusLabel("approved"))
        assertEquals("Từ chối", Labels.getRoomBookingStatusLabel("rejected"))
        assertEquals("Đã hủy", Labels.getRoomBookingStatusLabel("cancelled"))
    }

    @Test
    fun `getTransactionTypeLabel maps transaction types correctly`() {
        assertEquals("Nạp tiền", Labels.getTransactionTypeLabel("topup"))
        assertEquals("Thanh toán", Labels.getTransactionTypeLabel("payment"))
    }
}
