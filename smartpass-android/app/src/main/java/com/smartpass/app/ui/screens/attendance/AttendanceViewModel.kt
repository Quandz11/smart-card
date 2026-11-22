package com.smartpass.app.ui.screens.attendance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.Attendance
import com.smartpass.app.data.model.AttendanceStats
import com.smartpass.app.data.repository.AttendanceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class AttendanceUiState(
    val isLoading: Boolean = false,
    val records: List<Attendance> = emptyList(),
    val stats: AttendanceStats? = null,
    val error: String? = null
)

class AttendanceViewModel(private val repository: AttendanceRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(AttendanceUiState(isLoading = true))
    val uiState: StateFlow<AttendanceUiState> = _uiState

    init {
        loadAttendance()
    }

    fun loadAttendance() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = repository.getMyAttendance()
            result.fold(
                onSuccess = { history ->
                    _uiState.value = AttendanceUiState(
                        isLoading = false,
                        records = history.records,
                        stats = history.stats
                    )
                },
                onFailure = { _uiState.value = AttendanceUiState(isLoading = false, error = it.message) }
            )
        }
    }
}

