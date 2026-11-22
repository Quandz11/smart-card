package com.smartpass.app.ui.screens.staff_library

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.*
import com.smartpass.app.data.repository.LibraryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class StaffLibraryUiState(
    val selectedTab: Int = 0, // 0: Cho mượn, 1: Nhận trả, 2: Đang mượn hệ thống
    val isSubmitting: Boolean = false,
    val activeLoans: List<LibraryLoan> = emptyList(),
    val returnResult: LibraryReturnResponse? = null,
    val successMessage: String? = null,
    val error: String? = null
)

class StaffLibraryViewModel(private val repository: LibraryRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(StaffLibraryUiState())
    val uiState: StateFlow<StaffLibraryUiState> = _uiState

    init {
        loadActiveLoans()
    }

    fun selectTab(tab: Int) {
        _uiState.value = _uiState.value.copy(selectedTab = tab, error = null, successMessage = null, returnResult = null)
        if (tab == 2) loadActiveLoans()
    }

    fun loadActiveLoans() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            val result = repository.getAllLoans("BORROWED")
            result.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isSubmitting = false, activeLoans = it) },
                onFailure = { _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message) }
            )
        }
    }

    fun borrowBook(cardOrToken: String, bookCode: String, bookTitle: String, dueDays: Int?) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null, successMessage = null)
            val request = LibraryBorrowRequest(
                cardCode = if (cardOrToken.length <= 16) cardOrToken else null,
                qrToken = if (cardOrToken.length > 16) cardOrToken else null,
                bookCode = bookCode,
                bookTitle = bookTitle,
                dueDays = dueDays
            )
            val result = repository.borrowBook(request)
            result.fold(
                onSuccess = { loan ->
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        successMessage = "Cho mượn thành công sách: ${loan.bookTitle} (Mã: ${loan.bookCode})"
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message ?: "Mượn sách thất bại")
                }
            )
        }
    }

    fun returnBook(bookCode: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null, successMessage = null, returnResult = null)
            val request = LibraryReturnRequest(bookCode = bookCode)
            val result = repository.returnBook(request)
            result.fold(
                onSuccess = { res ->
                    val fineText = if (res.fine != null && res.fine > 0) " (Quá hạn ${res.overdueDays} ngày, phạt: ${res.fine} ₫)" else ""
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        returnResult = res,
                        successMessage = "Trả sách thành công: ${res.loan.bookTitle}$fineText"
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message ?: "Trả sách thất bại")
                }
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(error = null, successMessage = null)
    }
}

