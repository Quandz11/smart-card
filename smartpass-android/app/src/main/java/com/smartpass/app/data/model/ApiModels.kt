package com.smartpass.app.data.model

data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null,
    val pagination: Pagination? = null
)

data class Pagination(
    val page: Int,
    val limit: Int,
    val total: Int
)

data class AuthResponse(
    val user: User,
    val token: String,
    val mustSetPin: Boolean? = null
)

data class User(
    val _id: String,
    val fullName: String,
    val email: String,
    val role: String,
    val phone: String? = null,
    val studentCode: String? = null,
    val className: String? = null,
    val avatarUrl: String? = null,
    val isActive: Boolean = true
)

data class Card(
    val _id: String,
    val cardCode: String,
    val owner: Any? = null,
    val status: String,
    val expiresAt: String,
    val nfcUid: String? = null,
    val qrToken: String
)

data class CardVerifyResponse(
    val card: CardMeta,
    val owner: OwnerMeta?
)

data class CardMeta(
    val id: String? = null,
    val cardCode: String,
    val status: String,
    val expiresAt: String
)

data class OwnerMeta(
    val fullName: String?,
    val studentCode: String?,
    val className: String?
)

data class Attendance(
    val _id: String,
    val classSession: String = "",
    val subject: String? = null,
    val checkedAt: String = "",
    val checkedInAt: String? = null,
    val status: String = "PRESENT",
    val session: Any? = null,
    val method: String? = null,
    val note: String? = null
)

data class AttendanceStats(
    val total: Int = 0,
    val present: Int = 0,
    val absent: Int = 0,
    val excused: Int = 0,
    val overallRate: Int = 100
)

data class AttendanceHistoryResponse(
    val records: List<Attendance> = emptyList(),
    val stats: AttendanceStats? = null
)

data class LibraryLoan(
    val _id: String,
    val bookCode: String,
    val bookTitle: String,
    val borrowedAt: String,
    val dueAt: String,
    val returnedAt: String? = null,
    val status: String
)

data class Wallet(
    val balance: Long
)

data class CanteenTransaction(
    val _id: String,
    val type: String,
    val amount: Long,
    val balanceAfter: Long,
    val note: String? = null,
    val createdAt: String
)

data class ParkingSession(
    val _id: String,
    val vehiclePlate: String? = null,
    val checkInAt: String,
    val checkOutAt: String? = null,
    val fee: Long = 0L,
    val status: String
)

data class RoomBooking(
    val _id: String,
    val room: String,
    val date: String,
    val startTime: String,
    val endTime: String,
    val purpose: String? = null,
    val status: String
)

data class Event(
    val _id: String,
    val title: String,
    val description: String? = null,
    val location: String? = null,
    val startAt: String,
    val endAt: String,
    val capacity: Int,
    val registeredCount: Int
)

data class ClassSchedule(
    val _id: String = "",
    val className: String = "",
    val subject: String = "",
    val teacher: String? = null,
    val room: String? = null,
    val dayOfWeek: Int = 2,
    val startTime: String = "",
    val endTime: String = "",
    val semester: String? = null
)

data class ScheduleResponse(
    val slots: List<ClassSchedule> = emptyList(),
    val weekNumber: Int? = null,
    val message: String? = null
)

data class Notification(
    val _id: String = "",
    val id: String = "",
    val type: String? = null,
    val priority: String = "NORMAL",
    val category: String = "SYSTEM",
    val title: String = "",
    val body: String = "",
    val audience: String = "all",
    val className: String? = null,
    val actionRoute: String? = null,
    val isRead: Boolean = false,
    val readAt: String? = null,
    val createdAt: String = "",
    val isSilent: Boolean = false
)

data class QuietHours(
    val enabled: Boolean = false,
    val from: String = "22:00",
    val to: String = "07:00"
)

data class NotificationPreferences(
    val categories: Map<String, Boolean> = emptyMap(),
    val quietHours: QuietHours = QuietHours()
)

data class UnreadCountResponse(
    val count: Int = 0
)

data class EmergencyProfile(
    val _id: String? = null,
    val owner: String? = null,
    val fullName: String? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null,
    val allergies: String? = null,
    val bloodType: String? = null,
    val insuranceInfo: String? = null,
    val visibleFields: List<String> = emptyList(),
    val isEnabled: Boolean = false
)

data class RotateQrResponse(
    val qrToken: String
)

// Request payloads
data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val fullName: String,
    val email: String,
    val password: String,
    val phone: String? = null,
    val studentCode: String? = null,
    val className: String? = null
)

data class VerifyCardRequest(
    val cardCode: String? = null,
    val nfcUid: String? = null,
    val qrToken: String? = null
)

data class RoomBookingCreateRequest(
    val room: String,
    val date: String,
    val startTime: String,
    val endTime: String,
    val purpose: String? = null
)

data class EmergencyProfileUpdateRequest(
    val fullName: String? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null,
    val allergies: String? = null,
    val bloodType: String? = null,
    val insuranceInfo: String? = null,
    val visibleFields: List<String>? = null,
    val isEnabled: Boolean? = null
)

data class AttendanceCheckRequest(
    val cardCode: String? = null,
    val nfcUid: String? = null,
    val qrToken: String? = null,
    val classSession: String,
    val subject: String? = null,
    val qrType: String? = null,
    val idempotencyKey: String? = null
)

data class AttendanceCheckResponse(
    val attendance: Attendance? = null,
    val card: CardMeta? = null,
    val owner: OwnerMeta? = null
)

data class LibraryBorrowRequest(
    val cardCode: String? = null,
    val nfcUid: String? = null,
    val qrToken: String? = null,
    val bookCode: String,
    val bookTitle: String,
    val dueDays: Int? = null,
    val qrType: String? = null,
    val idempotencyKey: String? = null
)

data class LibraryReturnRequest(
    val bookCode: String
)

data class LibraryReturnResponse(
    val loan: LibraryLoan,
    val overdueDays: Int? = null,
    val fine: Long? = null
)

data class WalletPayRequest(
    val cardCode: String? = null,
    val nfcUid: String? = null,
    val qrToken: String? = null,
    val amount: Long,
    val note: String? = null,
    val qrType: String? = null,
    val nonce: String? = null,
    val pin: String? = null,
    val idempotencyKey: String? = null
)

data class WalletTopUpRequest(
    val cardCode: String? = null,
    val nfcUid: String? = null,
    val qrToken: String? = null,
    val amount: Long,
    val userId: String? = null,
    val note: String? = null,
    val pin: String? = null,
    val idempotencyKey: String? = null
)

data class ParkingCheckInRequest(
    val cardCode: String? = null,
    val nfcUid: String? = null,
    val qrToken: String? = null,
    val vehiclePlate: String? = null,
    val qrType: String? = null,
    val idempotencyKey: String? = null
)

data class ParkingCheckOutRequest(
    val cardCode: String? = null,
    val nfcUid: String? = null,
    val qrToken: String? = null,
    val qrType: String? = null,
    val idempotencyKey: String? = null
)

data class ChangePasswordRequest(
    val oldPassword: String,
    val newPassword: String
)

// QR System Models
data class QrResolveRequest(
    val qrValue: String
)

data class QrResolveResult(
    val type: String,
    val label: String,
    val summary: Map<String, Any?>,
    val nextAction: String,
    val expiresAt: Long? = null
)

data class GatePassConfirmRequest(
    val gateId: String? = null,
    val direction: String,
    val cardCode: String? = null,
    val idempotencyKey: String? = null
)

data class GatePassResult(
    val success: Boolean,
    val message: String,
    val duplicate: Boolean,
    val direction: String,
    val recordedAt: String
)

data class DynamicQrResponse(
    val type: String,
    val publicId: String,
    val expiresAt: Long,
    val canonicalPayload: String,
    val barePayload: String,
    val classSession: String? = null,
    val amount: Long? = null,
    val counter: String? = null,
    val eventId: String? = null
)

data class PaymentRequestQrRequest(
    val amount: Long,
    val counter: String? = null
)

data class EventCheckinRequest(
    val qrType: String = "EVENT_CHECKIN",
    val idempotencyKey: String? = null
)

// PIN Models
data class SetupPinRequest(
    val pin: String,
    val confirmPin: String
)

data class ChangePinRequest(
    val currentPin: String,
    val newPin: String,
    val confirmPin: String
)

data class ResetPinRequest(
    val otpToken: String,
    val newPin: String,
    val confirmPin: String
)

data class PinActionResponse(
    val pinSetAt: String? = null
)

// VNPay Models
data class VnpayCreateRequest(
    val amount: Long
)

data class VnpayCreateResponse(
    val success: Boolean,
    val message: String? = null,
    val orderId: String? = null,
    val txnRef: String? = null,
    val paymentUrl: String? = null
)

data class TopupOrderDto(
    val _id: String,
    val amount: Long,
    val txnRef: String,
    val status: String,
    val vnpayBankCode: String? = null,
    val paidAt: String? = null
)

data class VnpayOrderResponse(
    val success: Boolean,
    val order: TopupOrderDto? = null
)

// Smart OTP Models
data class OtpChallengeDto(
    val _id: String,
    val purpose: String,
    val expiresAt: String,
    val remainingSeconds: Int,
    val deliveredCode: String? = null
)

data class OtpRequestPayload(
    val purpose: String,
    val deviceId: String? = null
)

data class OtpRequestResponse(
    val success: Boolean,
    val message: String? = null,
    val challengeId: String? = null,
    val remainingSeconds: Int? = null
)

data class OtpActiveResponse(
    val success: Boolean,
    val challenge: OtpChallengeDto? = null
)

data class OtpVerifyPayload(
    val purpose: String,
    val code: String,
    val deviceId: String? = null
)

data class OtpVerifyResponse(
    val success: Boolean,
    val message: String? = null,
    val otpToken: String? = null,
    val expiresInSeconds: Int? = null
)

// Timetable & Attendance Models (Block D)
data class SemesterDto(
    val _id: String,
    val code: String,
    val name: String,
    val startDate: String,
    val endDate: String,
    val weeksCount: Int = 15,
    val isCurrent: Boolean = false
)

data class SubjectDto(
    val _id: String,
    val code: String,
    val name: String,
    val credits: Int = 3,
    val department: String? = null
)

data class SchoolClassDto(
    val _id: String,
    val code: String,
    val name: String,
    val academicYear: String? = null
)

data class ScheduleSlotDto(
    val _id: String,
    val classId: Any? = null,
    val semesterId: Any? = null,
    val subjectId: Any? = null,
    val teacherId: Any? = null,
    val room: String,
    val dayOfWeek: Int,
    val startTime: String,
    val endTime: String,
    val weeks: List<Int> = emptyList(),
    val subject: SubjectDto? = null,
    val `class`: SchoolClassDto? = null
)

data class MyScheduleResponse(
    val semester: SemesterDto? = null,
    val week: Int? = null,
    val schedule: List<ScheduleSlotDto> = emptyList(),
    val todaySlots: List<ScheduleSlotDto> = emptyList()
)

data class AttendanceSessionDto(
    val _id: String,
    val slotId: Any? = null,
    val date: String,
    val status: String,
    val openedAt: String,
    val closedAt: String? = null,
    val qrPublicId: String? = null,
    val qrPayload: String? = null
)

data class AttendanceSessionOpenRequest(
    val slotId: String,
    val date: String
)



