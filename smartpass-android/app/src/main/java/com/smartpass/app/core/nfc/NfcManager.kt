package com.smartpass.app.core.nfc

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow

object NfcManager {
    private val _scannedUid = MutableSharedFlow<String>(extraBufferCapacity = 1)
    val scannedUid: SharedFlow<String> = _scannedUid

    fun onTagScanned(uid: String) {
        _scannedUid.tryEmit(uid)
    }
}

