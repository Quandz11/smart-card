package com.smartpass.app.ui.screens.schedule

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.ClassSchedule
import com.smartpass.app.data.repository.ScheduleRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.Calendar

data class ScheduleUiState(
    val isLoading: Boolean = false,
    val allSchedules: List<ClassSchedule> = emptyList(),
    val selectedDayOfWeek: Int = Calendar.getInstance().get(Calendar.DAY_OF_WEEK), // 1=Sun, 2=Mon... 7=Sat
    val error: String? = null
)

class ScheduleViewModel(private val repository: ScheduleRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(ScheduleUiState(isLoading = true))
    val uiState: StateFlow<ScheduleUiState> = _uiState

    init {
        loadSchedule()
    }

    fun selectDay(dayOfWeek: Int) {
        _uiState.value = _uiState.value.copy(selectedDayOfWeek = dayOfWeek)
    }

    fun loadSchedule() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = repository.getMySchedule()
            result.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isLoading = false, allSchedules = it) },
                onFailure = { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
            )
        }
    }
}
