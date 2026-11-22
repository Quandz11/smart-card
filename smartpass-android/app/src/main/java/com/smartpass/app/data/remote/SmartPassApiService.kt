package com.smartpass.app.data.remote

import com.smartpass.app.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface SmartPassApiService {

    // Auth
    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<ApiResponse<AuthResponse>>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthResponse>>

    @GET("api/auth/me")
    suspend fun getMe(): Response<ApiResponse<User>>

    @PATCH("api/auth/change-password")
    suspend fun changePassword(@Body body: Map<String, String>): Response<ApiResponse<Map<String, String>>>

    // Cards
    @POST("api/cards/verify")
    suspend fun verifyCard(@Body request: VerifyCardRequest): Response<ApiResponse<CardVerifyResponse>>

    @GET("api/cards/{id}")
    suspend fun getCardById(@Path("id") id: String): Response<ApiResponse<Card>>

    @PATCH("api/cards/{id}/lost")
    suspend fun markCardLost(@Path("id") id: String): Response<ApiResponse<Card>>

    // Attendance
    @GET("api/attendance/my")
    suspend fun getMyAttendance(): Response<ApiResponse<AttendanceHistoryResponse>>

    // Library
    @GET("api/library/my-loans")
    suspend fun getMyLoans(@Query("status") status: String? = null): Response<ApiResponse<List<LibraryLoan>>>

    // Wallet
    @GET("api/wallet/me")
    suspend fun getMyWallet(): Response<ApiResponse<Wallet>>

    @GET("api/wallet/transactions")
    suspend fun getMyTransactions(): Response<ApiResponse<List<CanteenTransaction>>>

    // Parking
    @GET("api/parking/my")
    suspend fun getMyParkingSessions(): Response<ApiResponse<List<ParkingSession>>>

    // Rooms
    @GET("api/rooms/availability")
    suspend fun getRoomAvailability(
        @Query("date") date: String,
        @Query("room") room: String
    ): Response<ApiResponse<List<RoomBooking>>>

    @POST("api/room-bookings")
    suspend fun createRoomBooking(@Body request: RoomBookingCreateRequest): Response<ApiResponse<RoomBooking>>

    @GET("api/room-bookings/my")
    suspend fun getMyRoomBookings(): Response<ApiResponse<List<RoomBooking>>>

    @PATCH("api/room-bookings/{id}/cancel")
    suspend fun cancelRoomBooking(@Path("id") id: String): Response<ApiResponse<RoomBooking>>

    // Events
    @GET("api/events")
    suspend fun getUpcomingEvents(): Response<ApiResponse<List<Event>>>

    @POST("api/events/{id}/register")
    suspend fun registerForEvent(@Path("id") id: String): Response<ApiResponse<Any>>

    @GET("api/events/my")
    suspend fun getMyEvents(): Response<ApiResponse<List<Event>>>

    // Schedules
    @GET("api/schedules/my")
    suspend fun getMySchedule(): Response<ApiResponse<ScheduleResponse>>

    // Notifications
    @GET("api/notifications/my")
    suspend fun getMyNotifications(
        @Query("category") category: String? = null,
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null
    ): Response<ApiResponse<List<Notification>>>

    @GET("api/notifications/my/unread-count")
    suspend fun getUnreadCount(): Response<ApiResponse<UnreadCountResponse>>

    @PATCH("api/notifications/{id}/read")
    suspend fun markNotificationAsRead(@Path("id") id: String): Response<ApiResponse<Map<String, Any?>>>

    @PATCH("api/notifications/read-all")
    suspend fun markAllNotificationsAsRead(): Response<ApiResponse<Map<String, Any?>>>

    @DELETE("api/notifications/{id}")
    suspend fun archiveNotification(@Path("id") id: String): Response<ApiResponse<Map<String, Any?>>>

    @GET("api/notifications/preferences")
    suspend fun getNotificationPreferences(): Response<ApiResponse<NotificationPreferences>>

    @PUT("api/notifications/preferences")
    suspend fun updateNotificationPreferences(@Body preferences: NotificationPreferences): Response<ApiResponse<NotificationPreferences>>

    // Emergency Profile
    @GET("api/emergency/me")
    suspend fun getMyEmergencyProfile(): Response<ApiResponse<EmergencyProfile>>

    @PUT("api/emergency/me")
    suspend fun updateMyEmergencyProfile(@Body request: EmergencyProfileUpdateRequest): Response<ApiResponse<EmergencyProfile>>

    @POST("api/emergency/me/rotate-qr")
    suspend fun rotateQrToken(): Response<ApiResponse<RotateQrResponse>>

    // Public Emergency Profile Scan (NO auth)
    @GET("api/emergency/public/{qrToken}")
    suspend fun getPublicEmergencyInfo(@Path("qrToken") qrToken: String): Response<ApiResponse<Map<String, Any?>>>

    // Staff Operations
    @POST("api/attendance/check")
    suspend fun checkAttendance(@Body request: AttendanceCheckRequest): Response<ApiResponse<AttendanceCheckResponse>>

    @GET("api/attendance")
    suspend fun getAttendanceList(): Response<ApiResponse<List<Attendance>>>

    @POST("api/library/borrow")
    suspend fun borrowBook(@Body request: LibraryBorrowRequest): Response<ApiResponse<LibraryLoan>>

    @POST("api/library/return")
    suspend fun returnBook(@Body request: LibraryReturnRequest): Response<ApiResponse<LibraryReturnResponse>>

    @GET("api/library/loans")
    suspend fun getAllLoans(@Query("status") status: String? = null): Response<ApiResponse<List<LibraryLoan>>>

    @POST("api/wallet/pay")
    suspend fun payFromWallet(@Body request: WalletPayRequest): Response<ApiResponse<CanteenTransaction>>

    @POST("api/wallet/topup")
    suspend fun topUpWallet(@Body request: WalletTopUpRequest): Response<ApiResponse<CanteenTransaction>>

    @GET("api/wallet/transactions/all")
    suspend fun getAllTransactions(): Response<ApiResponse<List<CanteenTransaction>>>

    @POST("api/parking/check-in")
    suspend fun parkingCheckIn(@Body request: ParkingCheckInRequest): Response<ApiResponse<ParkingSession>>

    @POST("api/parking/check-out")
    suspend fun parkingCheckOut(@Body request: ParkingCheckOutRequest): Response<ApiResponse<ParkingSession>>

    @GET("api/parking/active")
    suspend fun getActiveParkingSessions(): Response<ApiResponse<List<ParkingSession>>>

    @PATCH("api/room-bookings/{id}/approve")
    suspend fun approveRoomBooking(@Path("id") id: String): Response<ApiResponse<RoomBooking>>

    @PATCH("api/room-bookings/{id}/reject")
    suspend fun rejectRoomBooking(@Path("id") id: String): Response<ApiResponse<RoomBooking>>

    // Central QR Resolver
    @POST("api/qr/resolve")
    suspend fun resolveQr(@Body request: QrResolveRequest): Response<ApiResponse<QrResolveResult>>

    // Gate Access Confirmation
    @POST("api/qr/gate/confirm")
    suspend fun confirmGatePass(@Body request: GatePassConfirmRequest): Response<ApiResponse<GatePassResult>>

    // Staff Dynamic Generators
    @POST("api/attendance/sessions/{classSession}/qr")
    suspend fun generateAttendanceQr(@Path("classSession") classSession: String): Response<ApiResponse<DynamicQrResponse>>

    @POST("api/wallet/payment-request")
    suspend fun generatePaymentRequest(@Body request: PaymentRequestQrRequest): Response<ApiResponse<DynamicQrResponse>>

    @POST("api/events/{id}/checkin-qr")
    suspend fun generateEventCheckinQr(@Path("id") id: String): Response<ApiResponse<DynamicQrResponse>>

    // Student Event Check-in
    @POST("api/events/{id}/checkin")
    suspend fun checkInToEvent(
        @Path("id") id: String,
        @Body request: EventCheckinRequest
    ): Response<ApiResponse<Any>>

    // PIN Management
    @POST("api/wallet/pin/setup")
    suspend fun setupPin(@Body request: SetupPinRequest): Response<ApiResponse<PinActionResponse>>

    @POST("api/wallet/pin/change")
    suspend fun changePin(@Body request: ChangePinRequest): Response<ApiResponse<PinActionResponse>>

    @POST("api/wallet/pin/reset")
    suspend fun resetPin(@Body request: ResetPinRequest): Response<ApiResponse<PinActionResponse>>

    // VNPay Sandbox
    @POST("api/wallet/vnpay/create")
    suspend fun createVnpayOrder(@Body request: VnpayCreateRequest): Response<VnpayCreateResponse>

    @GET("api/wallet/vnpay/orders/{txnRef}")
    suspend fun getVnpayOrder(@Path("txnRef") txnRef: String): Response<VnpayOrderResponse>

    // Smart OTP
    @POST("api/otp/request")
    suspend fun requestOtp(@Body request: OtpRequestPayload): Response<OtpRequestResponse>

    @GET("api/otp/active")
    suspend fun getActiveOtp(@Query("purpose") purpose: String? = null): Response<OtpActiveResponse>

    @POST("api/otp/verify")
    suspend fun verifyOtp(@Body request: OtpVerifyPayload): Response<OtpVerifyResponse>

    // Timetable Block D
    @GET("api/schedule/my")
    suspend fun getMyWeeklySchedule(@Query("week") week: Int? = null): Response<ApiResponse<MyScheduleResponse>>

    @GET("api/schedule/my/today")
    suspend fun getMyTodaySchedule(): Response<ApiResponse<List<ScheduleSlotDto>>>

    // Attendance Block D
    @POST("api/attendance/sessions")
    suspend fun openAttendanceSession(@Body request: AttendanceSessionOpenRequest): Response<ApiResponse<AttendanceSessionDto>>

    @POST("api/attendance/sessions/{id}/close")
    suspend fun closeAttendanceSession(@Path("id") id: String): Response<ApiResponse<Map<String, Any>>>
}

