package com.smartpass.app.ui.screens.scan

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.core.format.Format
import com.smartpass.app.core.qr.QrPayload
import com.smartpass.app.core.qr.QrPayloadParser
import com.smartpass.app.data.local.TokenManager
import com.smartpass.app.data.model.*
import com.smartpass.app.data.repository.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.UUID

sealed class ScanResultState {
    object Idle : ScanResultState()
    object Loading : ScanResultState()
    data class CardVerified(val data: CardVerifyResponse) : ScanResultState()
    data class EmergencyQrDetected(val qrToken: String) : ScanResultState()
    data class ServiceResolved(
        val result: QrResolveResult,
        val rawCode: String
    ) : ScanResultState()
    data class ActionSuccess(
        val message: String,
        val duplicate: Boolean = false
    ) : ScanResultState()
    data class Error(
        val message: String,
        val isExpired: Boolean = false
    ) : ScanResultState()
}

class ScanViewModel(
    private val cardRepository: CardRepository,
    private val qrRepository: QrRepository,
    private val walletRepository: WalletRepository,
    private val libraryRepository: LibraryRepository,
    private val parkingRepository: ParkingRepository,
    private val attendanceRepository: AttendanceRepository,
    private val eventRepository: EventRepository,
    private val tokenManager: TokenManager? = null
) : ViewModel() {

    private val _scanState = MutableStateFlow<ScanResultState>(ScanResultState.Idle)
    val scanState: StateFlow<ScanResultState> = _scanState

    private val _isConfirming = MutableStateFlow(false)
    val isConfirming: StateFlow<Boolean> = _isConfirming

    fun onQrScanned(rawContent: String) {
        val parsed = QrPayloadParser.parse(rawContent)
        when (parsed) {
            is QrPayload.Token -> {
                _scanState.value = ScanResultState.EmergencyQrDetected(parsed.value)
            }
            is QrPayload.CardCode -> {
                verifyCardIdentifier(cardCode = parsed.value)
            }
            is QrPayload.ServiceV1, is QrPayload.HumanCode -> {
                resolveServiceQr(rawContent.trim())
            }
            is QrPayload.UnsupportedType -> {
                _scanState.value = ScanResultState.Error("Loại mã chưa hỗ trợ: ${parsed.type}")
            }
            is QrPayload.Invalid -> {
                _scanState.value = ScanResultState.Error(parsed.reason)
            }
        }
    }

    fun onNfcScanned(nfcUid: String) {
        verifyCardIdentifier(nfcUid = nfcUid)
    }

    private fun resolveServiceQr(rawCode: String) {
        viewModelScope.launch {
            _scanState.value = ScanResultState.Loading
            val result = qrRepository.resolveQr(rawCode)
            result.fold(
                onSuccess = { res ->
                    _scanState.value = ScanResultState.ServiceResolved(res, rawCode)
                },
                onFailure = { err ->
                    val msg = err.message ?: "Mã QR không hợp lệ"
                    val isExp = msg.contains("hết hạn", ignoreCase = true)
                    _scanState.value = ScanResultState.Error(msg, isExpired = isExp)
                }
            )
        }
    }

    private fun verifyCardIdentifier(cardCode: String? = null, nfcUid: String? = null) {
        viewModelScope.launch {
            _scanState.value = ScanResultState.Loading
            val result = cardRepository.verifyCard(
                VerifyCardRequest(cardCode = cardCode, nfcUid = nfcUid)
            )
            result.fold(
                onSuccess = { _scanState.value = ScanResultState.CardVerified(it) },
                onFailure = { _scanState.value = ScanResultState.Error(it.message ?: "Xác thực thẻ thất bại") }
            )
        }
    }

    // 1. Canteen Pay confirmation
    fun confirmWalletPay(amount: Long, nonce: String? = null, pin: String) {
        if (_isConfirming.value) return
        viewModelScope.launch {
            _isConfirming.value = true
            val idKey = UUID.randomUUID().toString()
            val qrType = if (!nonce.isNullOrBlank()) "PAYMENT_REQUEST" else "CANTEEN_POINT"
            val req = WalletPayRequest(
                amount = amount,
                qrType = qrType,
                nonce = nonce,
                pin = pin,
                idempotencyKey = idKey
            )
            val res = walletRepository.pay(req)
            _isConfirming.value = false
            res.fold(
                onSuccess = {
                    _scanState.value = ScanResultState.ActionSuccess("Thanh toán thành công ${Format.formatVND(amount)}")
                },
                onFailure = {
                    _scanState.value = ScanResultState.Error(it.message ?: "Thanh toán thất bại")
                }
            )
        }
    }

    // 2. Book Borrow confirmation
    fun confirmLibraryBorrow(bookCode: String, bookTitle: String) {
        if (_isConfirming.value) return
        viewModelScope.launch {
            _isConfirming.value = true
            val idKey = UUID.randomUUID().toString()
            val req = LibraryBorrowRequest(
                bookCode = bookCode,
                bookTitle = bookTitle,
                qrType = "BOOK",
                idempotencyKey = idKey
            )
            val res = libraryRepository.borrowBook(req)
            _isConfirming.value = false
            res.fold(
                onSuccess = {
                    _scanState.value = ScanResultState.ActionSuccess("Mượn sách thành công: $bookTitle")
                },
                onFailure = {
                    _scanState.value = ScanResultState.Error(it.message ?: "Mượn sách thất bại")
                }
            )
        }
    }

    // 3. Parking Check-In confirmation
    fun confirmParkingIn(vehiclePlate: String? = null) {
        if (_isConfirming.value) return
        viewModelScope.launch {
            _isConfirming.value = true
            val idKey = UUID.randomUUID().toString()
            val req = ParkingCheckInRequest(
                vehiclePlate = vehiclePlate,
                qrType = "PARKING_IN",
                idempotencyKey = idKey
            )
            val res = parkingRepository.checkIn(req)
            _isConfirming.value = false
            res.fold(
                onSuccess = {
                    _scanState.value = ScanResultState.ActionSuccess("Check-in gửi xe vào bãi thành công")
                },
                onFailure = {
                    _scanState.value = ScanResultState.Error(it.message ?: "Check-in gửi xe thất bại")
                }
            )
        }
    }

    // 4. Parking Check-Out confirmation
    fun confirmParkingOut(fee: Long) {
        if (_isConfirming.value) return
        viewModelScope.launch {
            _isConfirming.value = true
            val idKey = UUID.randomUUID().toString()
            val req = ParkingCheckOutRequest(
                qrType = "PARKING_OUT",
                idempotencyKey = idKey
            )
            val res = parkingRepository.checkOut(req)
            _isConfirming.value = false
            res.fold(
                onSuccess = {
                    _scanState.value = ScanResultState.ActionSuccess("Check-out gửi xe thành công. Phí: ${Format.formatVND(fee)}")
                },
                onFailure = {
                    _scanState.value = ScanResultState.Error(it.message ?: "Check-out gửi xe thất bại")
                }
            )
        }
    }

    // 5. Attendance Check confirmation
    fun confirmAttendance(classSession: String, subject: String? = null) {
        if (_isConfirming.value) return
        viewModelScope.launch {
            _isConfirming.value = true
            val idKey = UUID.randomUUID().toString()
            val req = AttendanceCheckRequest(
                classSession = classSession,
                subject = subject,
                qrType = "ATTENDANCE_SESSION",
                idempotencyKey = idKey
            )
            val res = attendanceRepository.checkAttendance(req)
            _isConfirming.value = false
            res.fold(
                onSuccess = {
                    _scanState.value = ScanResultState.ActionSuccess("Điểm danh thành công: ${subject ?: classSession}")
                },
                onFailure = {
                    _scanState.value = ScanResultState.Error(it.message ?: "Điểm danh thất bại")
                }
            )
        }
    }

    // 6. Event Check-in confirmation
    fun confirmEventCheckin(eventId: String) {
        if (_isConfirming.value) return
        viewModelScope.launch {
            _isConfirming.value = true
            val idKey = UUID.randomUUID().toString()
            val res = qrRepository.checkInToEvent(eventId, idempotencyKey = idKey)
            _isConfirming.value = false
            res.fold(
                onSuccess = {
                    _scanState.value = ScanResultState.ActionSuccess("Ghi nhận có mặt tại sự kiện thành công!")
                },
                onFailure = {
                    _scanState.value = ScanResultState.Error(it.message ?: "Check-in sự kiện thất bại")
                }
            )
        }
    }

    // 7. Event Register confirmation
    fun confirmEventRegister(eventId: String) {
        if (_isConfirming.value) return
        viewModelScope.launch {
            _isConfirming.value = true
            val res = eventRepository.registerForEvent(eventId)
            _isConfirming.value = false
            res.fold(
                onSuccess = {
                    _scanState.value = ScanResultState.ActionSuccess("Đăng ký tham gia sự kiện thành công!")
                },
                onFailure = {
                    _scanState.value = ScanResultState.Error(it.message ?: "Đăng ký sự kiện thất bại")
                }
            )
        }
    }

    // 8. Gate Pass confirmation
    fun confirmGatePass(gateId: String?, direction: String) {
        if (_isConfirming.value) return
        viewModelScope.launch {
            _isConfirming.value = true
            val idKey = UUID.randomUUID().toString()
            val req = GatePassConfirmRequest(
                gateId = gateId,
                direction = direction,
                idempotencyKey = idKey
            )
            val res = qrRepository.confirmGatePass(req)
            _isConfirming.value = false
            res.fold(
                onSuccess = {
                    _scanState.value = ScanResultState.ActionSuccess(
                        message = it.message,
                        duplicate = it.duplicate
                    )
                },
                onFailure = {
                    _scanState.value = ScanResultState.Error(it.message ?: "Xác nhận qua cổng thất bại")
                }
            )
        }
    }

    fun reset() {
        _scanState.value = ScanResultState.Idle
        _isConfirming.value = false
    }
}
