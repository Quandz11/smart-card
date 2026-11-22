package com.smartpass.app.ui.screens.staff_attendance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.AttendanceCheckRequest
import com.smartpass.app.data.model.AttendanceCheckResponse
import com.smartpass.app.data.model.DynamicQrResponse
import com.smartpass.app.data.repository.AttendanceRepository
import com.smartpass.app.data.repository.QrRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class StaffAttendanceUiState(
    val isChecking: Boolean = false,
    val classSession: String = "Ca 1",
    val subject: String = "Toán cao cấp",
    val lastResult: AttendanceCheckResponse? = null,
    val successMessage: String? = null,
    val error: String? = null
)

class StaffAttendanceViewModel(
    private val attendanceRepo: AttendanceRepository,
    private val qrRepo: QrRepository? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow(StaffAttendanceUiState())
    val uiState: StateFlow<StaffAttendanceUiState> = _uiState

    fun updateSession(session: String) {
        _uiState.value = _uiState.value.copy(classSession = session)
    }

    fun updateSubject(sub: String) {
        _uiState.value = _uiState.value.copy(subject = sub)
    }

    fun generateAttendanceQr(onResult: (DynamicQrResponse) -> Unit) {
        val session = _uiState.value.classSession
        viewModelScope.launch {
            val res = qrRepo?.generateAttendanceQr(session)
            res?.fold(
                onSuccess = { onResult(it) },
                onFailure = { _uiState.value = _uiState.value.copy(error = it.message ?: "Tạo mã điểm danh thất bại") }
            )
        }
    }

    fun checkAttendance(codeOrToken: String) {
        val currentState = _uiState.value
        viewModelScope.launch {
            _uiState.value = currentState.copy(isChecking = true, error = null, successMessage = null)
            val request = AttendanceCheckRequest(
                cardCode = if (codeOrToken.length <= 16) codeOrToken else null,
                qrToken = if (codeOrToken.length > 16) codeOrToken else null,
                classSession = currentState.classSession,
                subject = currentState.subject.ifBlank { null }
            )
            val result = attendanceRepo.checkAttendance(request)
            result.fold(
                onSuccess = { res ->
                    _uiState.value = _uiState.value.copy(
                        isChecking = false,
                        lastResult = res,
                        successMessage = "Điểm danh thành công cho sinh viên: ${res.owner?.fullName ?: codeOrToken}"
                    )
                },
                onFailure = { err ->
                    _uiState.value = _uiState.value.copy(
                        isChecking = false,
                        error = err.message ?: "Điểm danh thất bại"
                    )
                }
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(error = null, successMessage = null)
    }
}

