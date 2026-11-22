package com.smartpass.app.data.repository

import com.smartpass.app.data.local.TokenManager
import com.smartpass.app.data.model.*
import com.smartpass.app.data.remote.ApiErrorParser
import com.smartpass.app.data.remote.SmartPassApiService
import retrofit2.Response

private fun <T> Response<ApiResponse<T>>.toResult(defaultError: String): Result<T> {
    if (isSuccessful) {
        val body = body()
        if (body?.success == true && body.data != null) {
            return Result.success(body.data)
        }
    }
    return Result.failure(Exception(ApiErrorParser.parseError(this, defaultError)))
}

private fun <T> Response<ApiResponse<List<T>>>.toListResult(defaultError: String): Result<List<T>> {
    if (isSuccessful) {
        val body = body()
        if (body?.success == true) {
            return Result.success(body.data ?: emptyList())
        }
    }
    return Result.failure(Exception(ApiErrorParser.parseError(this, defaultError)))
}

class AuthRepository(
    private val api: SmartPassApiService,
    private val tokenManager: TokenManager
) {
    suspend fun login(request: LoginRequest): Result<AuthResponse> {
        return try {
            val response = api.login(request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                val data = response.body()?.data
                if (data != null) {
                    tokenManager.saveAuthData(data.token, data.user.role, data.user.fullName)
                    Result.success(data)
                } else {
                    Result.failure(Exception("Dữ liệu phản hồi không hợp lệ"))
                }
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Đăng nhập thất bại")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(request: RegisterRequest): Result<AuthResponse> {
        return try {
            val response = api.register(request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                val data = response.body()?.data
                if (data != null) {
                    tokenManager.saveAuthData(data.token, data.user.role, data.user.fullName)
                    Result.success(data)
                } else {
                    Result.failure(Exception("Dữ liệu phản hồi không hợp lệ"))
                }
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Đăng ký thất bại")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMe(): Result<User> {
        return try {
            api.getMe().toResult("Không thể tải thông tin cá nhân")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun changePassword(oldPassword: String, newPassword: String): Result<String> {
        return try {
            val response = api.changePassword(mapOf("oldPassword" to oldPassword, "newPassword" to newPassword))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.message ?: "Đổi mật khẩu thành công")
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Đổi mật khẩu thất bại")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        tokenManager.clearAuthData()
    }

    suspend fun isLoggedIn(): Boolean {
        return !tokenManager.getToken().isNullOrEmpty()
    }
}

class CardRepository(private val api: SmartPassApiService) {
    suspend fun verifyCard(request: VerifyCardRequest): Result<CardVerifyResponse> {
        return try {
            api.verifyCard(request).toResult("Xác thực thẻ thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markCardLost(cardId: String): Result<Card> {
        return try {
            api.markCardLost(cardId).toResult("Báo mất thẻ thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCardById(cardId: String): Result<Card> {
        return try {
            api.getCardById(cardId).toResult("Không tìm thấy thẻ")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class AttendanceRepository(private val api: SmartPassApiService) {
    suspend fun getMyAttendance(): Result<AttendanceHistoryResponse> {
        return try {
            val response = api.getMyAttendance()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data ?: AttendanceHistoryResponse())
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Không thể tải dữ liệu điểm danh")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun checkAttendance(request: AttendanceCheckRequest): Result<AttendanceCheckResponse> {
        return try {
            val response = api.checkAttendance(request)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data ?: AttendanceCheckResponse())
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Điểm danh thất bại")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAttendanceList(): Result<List<Attendance>> {
        return try {
            api.getAttendanceList().toListResult("Không thể tải danh sách điểm danh")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun openSession(slotId: String, date: String): Result<AttendanceSessionDto> {
        return try {
            api.openAttendanceSession(AttendanceSessionOpenRequest(slotId, date)).toResult("Mở phiên điểm danh thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun closeSession(id: String): Result<Map<String, Any>> {
        return try {
            val response = api.closeAttendanceSession(id)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Đóng phiên thất bại")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class LibraryRepository(private val api: SmartPassApiService) {
    suspend fun getMyLoans(status: String? = null): Result<List<LibraryLoan>> {
        return try {
            api.getMyLoans(status).toListResult("Không thể tải danh sách mượn sách")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAllLoans(status: String? = null): Result<List<LibraryLoan>> {
        return try {
            api.getAllLoans(status).toListResult("Không thể tải danh sách mượn sách")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun borrowBook(request: LibraryBorrowRequest): Result<LibraryLoan> {
        return try {
            api.borrowBook(request).toResult("Mượn sách thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun returnBook(request: LibraryReturnRequest): Result<LibraryReturnResponse> {
        return try {
            api.returnBook(request).toResult("Trả sách thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class WalletRepository(private val api: SmartPassApiService) {
    suspend fun getMyWallet(): Result<Wallet> {
        return try {
            api.getMyWallet().toResult("Không thể tải số dư ví")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyTransactions(): Result<List<CanteenTransaction>> {
        return try {
            api.getMyTransactions().toListResult("Không thể tải lịch sử giao dịch")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAllTransactions(): Result<List<CanteenTransaction>> {
        return try {
            api.getAllTransactions().toListResult("Không thể tải lịch sử giao dịch hệ thống")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun pay(request: WalletPayRequest): Result<CanteenTransaction> {
        return try {
            api.payFromWallet(request).toResult("Thanh toán thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun topUp(request: WalletTopUpRequest): Result<CanteenTransaction> {
        return try {
            api.topUpWallet(request).toResult("Nạp tiền thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun setupPin(pin: String, confirmPin: String): Result<PinActionResponse> {
        return try {
            api.setupPin(SetupPinRequest(pin, confirmPin)).toResult("Thiết lập mã PIN thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun changePin(currentPin: String, newPin: String, confirmPin: String): Result<PinActionResponse> {
        return try {
            api.changePin(ChangePinRequest(currentPin, newPin, confirmPin)).toResult("Đổi mã PIN thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resetPin(otpToken: String, newPin: String, confirmPin: String): Result<PinActionResponse> {
        return try {
            api.resetPin(ResetPinRequest(otpToken, newPin, confirmPin)).toResult("Đặt lại mã PIN thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createVnpayOrder(amount: Long): Result<VnpayCreateResponse> {
        return try {
            val response = api.createVnpayOrder(VnpayCreateRequest(amount))
            if (response.isSuccessful && response.body()?.success == true && response.body()?.paymentUrl != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.body()?.message ?: "Tạo đơn nạp VNPay thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getVnpayOrder(txnRef: String): Result<TopupOrderDto> {
        return try {
            val response = api.getVnpayOrder(txnRef)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.order != null) {
                Result.success(response.body()!!.order!!)
            } else {
                Result.failure(Exception("Không tìm thấy thông tin đơn nạp"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class ParkingRepository(private val api: SmartPassApiService) {
    suspend fun getMySessions(): Result<List<ParkingSession>> {
        return try {
            api.getMyParkingSessions().toListResult("Không thể tải lịch sử gửi xe")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun checkIn(request: ParkingCheckInRequest): Result<ParkingSession> {
        return try {
            api.parkingCheckIn(request).toResult("Check-in gửi xe thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun checkOut(request: ParkingCheckOutRequest): Result<ParkingSession> {
        return try {
            api.parkingCheckOut(request).toResult("Check-out gửi xe thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getActiveSessions(): Result<List<ParkingSession>> {
        return try {
            api.getActiveParkingSessions().toListResult("Không thể tải danh sách xe đang gửi")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class RoomBookingRepository(private val api: SmartPassApiService) {
    suspend fun getMyBookings(): Result<List<RoomBooking>> {
        return try {
            api.getMyRoomBookings().toListResult("Không thể tải lịch đặt phòng")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getRoomAvailability(date: String, room: String): Result<List<RoomBooking>> {
        return try {
            api.getRoomAvailability(date, room).toListResult("Không thể kiểm tra phòng trống")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createBooking(request: RoomBookingCreateRequest): Result<RoomBooking> {
        return try {
            api.createRoomBooking(request).toResult("Đặt phòng thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun cancelBooking(id: String): Result<RoomBooking> {
        return try {
            api.cancelRoomBooking(id).toResult("Hủy đặt phòng thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun approveBooking(id: String): Result<RoomBooking> {
        return try {
            api.approveRoomBooking(id).toResult("Duyệt đặt phòng thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun rejectBooking(id: String): Result<RoomBooking> {
        return try {
            api.rejectRoomBooking(id).toResult("Từ chối đặt phòng thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class EventRepository(private val api: SmartPassApiService) {
    suspend fun getUpcomingEvents(): Result<List<Event>> {
        return try {
            api.getUpcomingEvents().toListResult("Không thể tải danh sách sự kiện")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun registerForEvent(id: String): Result<Unit> {
        return try {
            val response = api.registerForEvent(id)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Đăng ký sự kiện thất bại")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyEvents(): Result<List<Event>> {
        return try {
            api.getMyEvents().toListResult("Không thể tải sự kiện đã đăng ký")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class ScheduleRepository(private val api: SmartPassApiService) {
    suspend fun getMySchedule(): Result<List<ClassSchedule>> {
        return try {
            val response = api.getMySchedule()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data?.slots ?: emptyList())
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Không thể tải thời khóa biểu")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyWeeklySchedule(week: Int? = null): Result<MyScheduleResponse> {
        return try {
            api.getMyWeeklySchedule(week).toResult("Không thể tải thời khóa biểu tuần")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyTodaySchedule(): Result<List<ScheduleSlotDto>> {
        return try {
            api.getMyTodaySchedule().toListResult("Không thể tải lịch học hôm nay")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class OtpRepository(private val api: SmartPassApiService) {
    suspend fun requestOtp(purpose: String, deviceId: String? = null): Result<OtpRequestResponse> {
        return try {
            val response = api.requestOtp(OtpRequestPayload(purpose, deviceId))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.body()?.message ?: "Yêu cầu mã OTP thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getActiveOtp(purpose: String? = null): Result<OtpChallengeDto?> {
        return try {
            val response = api.getActiveOtp(purpose)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.challenge)
            } else {
                Result.failure(Exception("Không thể lấy yêu cầu OTP"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyOtp(purpose: String, code: String, deviceId: String? = null): Result<OtpVerifyResponse> {
        return try {
            val response = api.verifyOtp(OtpVerifyPayload(purpose, code, deviceId))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.body()?.message ?: "Xác thực mã OTP thất bại"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class NotificationRepository(private val api: SmartPassApiService) {
    suspend fun getMyNotifications(
        category: String? = null,
        page: Int? = null,
        limit: Int? = null
    ): Result<List<Notification>> {
        return try {
            api.getMyNotifications(category, page, limit).toListResult("Không thể tải thông báo")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getUnreadCount(): Result<Int> {
        return try {
            val response = api.getUnreadCount()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data?.count ?: 0)
            } else {
                Result.success(0)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markAsRead(id: String): Result<Unit> {
        return try {
            val response = api.markNotificationAsRead(id)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Không thể đánh dấu đã đọc")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markAllAsRead(): Result<Unit> {
        return try {
            val response = api.markAllNotificationsAsRead()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Không thể đánh dấu tất cả đã đọc")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun archiveNotification(id: String): Result<Unit> {
        return try {
            val response = api.archiveNotification(id)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Không thể lưu trữ thông báo")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPreferences(): Result<NotificationPreferences> {
        return try {
            val response = api.getNotificationPreferences()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data ?: NotificationPreferences())
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Không thể tải cài đặt thông báo")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updatePreferences(preferences: NotificationPreferences): Result<NotificationPreferences> {
        return try {
            val response = api.updateNotificationPreferences(preferences)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data ?: preferences)
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Không thể lưu cài đặt thông báo")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class EmergencyRepository(private val api: SmartPassApiService) {
    suspend fun getMyProfile(): Result<EmergencyProfile> {
        return try {
            api.getMyEmergencyProfile().toResult("Không thể tải thông tin khẩn cấp")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateMyProfile(request: EmergencyProfileUpdateRequest): Result<EmergencyProfile> {
        return try {
            api.updateMyEmergencyProfile(request).toResult("Cập nhật hồ sơ khẩn cấp thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun rotateQr(): Result<String> {
        return try {
            val response = api.rotateQrToken()
            val token = response.body()?.data?.qrToken
            if (response.isSuccessful && response.body()?.success == true && !token.isNullOrBlank()) {
                Result.success(token)
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Làm mới mã QR thất bại")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPublicEmergencyInfo(qrToken: String): Result<Map<String, Any?>> {
        return try {
            val response = api.getPublicEmergencyInfo(qrToken)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data ?: emptyMap())
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Không tìm thấy hồ sơ khẩn cấp")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class QrRepository(private val api: SmartPassApiService) {
    suspend fun resolveQr(qrValue: String): Result<QrResolveResult> {
        return try {
            api.resolveQr(QrResolveRequest(qrValue)).toResult("Mã QR không hợp lệ")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun confirmGatePass(request: GatePassConfirmRequest): Result<GatePassResult> {
        return try {
            api.confirmGatePass(request).toResult("Xác nhận cổng thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun generateAttendanceQr(classSession: String): Result<DynamicQrResponse> {
        return try {
            api.generateAttendanceQr(classSession).toResult("Tạo mã điểm danh thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun generatePaymentRequest(amount: Long, counter: String? = null): Result<DynamicQrResponse> {
        return try {
            api.generatePaymentRequest(PaymentRequestQrRequest(amount, counter)).toResult("Tạo yêu cầu thanh toán thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun generateEventCheckinQr(eventId: String): Result<DynamicQrResponse> {
        return try {
            api.generateEventCheckinQr(eventId).toResult("Tạo mã check-in sự kiện thất bại")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun checkInToEvent(eventId: String, idempotencyKey: String? = null): Result<Any> {
        return try {
            val response = api.checkInToEvent(eventId, EventCheckinRequest(idempotencyKey = idempotencyKey))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data ?: true)
            } else {
                Result.failure(Exception(ApiErrorParser.parseError(response, "Check-in sự kiện thất bại")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
