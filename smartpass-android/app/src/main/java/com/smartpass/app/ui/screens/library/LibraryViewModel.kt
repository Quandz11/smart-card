package com.smartpass.app.ui.screens.library

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.LibraryLoan
import com.smartpass.app.data.repository.LibraryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class LibraryUiState(
    val isLoading: Boolean = false,
    val loans: List<LibraryLoan> = emptyList(),
    val selectedTab: Int = 0, // 0: Đang mượn, 1: Quá hạn, 2: Tất cả
    val error: String? = null
)

class LibraryViewModel(private val repository: LibraryRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(LibraryUiState(isLoading = true))
    val uiState: StateFlow<LibraryUiState> = _uiState

    init {
        loadLoans()
    }

    fun selectTab(index: Int) {
        _uiState.value = _uiState.value.copy(selectedTab = index)
    }

    fun loadLoans() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = repository.getMyLoans()
            result.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isLoading = false, loans = it) },
                onFailure = { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
            )
        }
    }
}
