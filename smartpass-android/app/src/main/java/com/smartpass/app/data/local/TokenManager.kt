package com.smartpass.app.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.smartpass.app.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

private val Context.dataStore by preferencesDataStore(name = "secure_smartpass_prefs")

class TokenManager(private val context: Context) {
    companion object {
        private val KEY_JWT_TOKEN = stringPreferencesKey("jwt_token")
        private val KEY_USER_ROLE = stringPreferencesKey("user_role")
        private val KEY_USER_NAME = stringPreferencesKey("user_name")
        private val KEY_CARD_QR_TOKEN = stringPreferencesKey("card_qr_token")
        private val KEY_CUSTOM_BASE_URL = stringPreferencesKey("custom_base_url")

        @Volatile
        private var memoryCachedToken: String? = null
    }

    init {
        // Pre-warm cached token from DataStore asynchronously to avoid blocking threads
        CoroutineScope(Dispatchers.IO).launch {
            val savedEncrypted = context.dataStore.data.map { it[KEY_JWT_TOKEN] }.firstOrNull()
            if (!savedEncrypted.isNullOrBlank()) {
                memoryCachedToken = CryptoManager.decrypt(savedEncrypted)
            }
        }
    }

    val baseUrlFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[KEY_CUSTOM_BASE_URL]
    }

    suspend fun getCustomBaseUrl(): String? {
        if (!BuildConfig.DEBUG) return null
        return context.dataStore.data.map { it[KEY_CUSTOM_BASE_URL] }.firstOrNull()
    }

    suspend fun saveCustomBaseUrl(url: String) {
        if (!BuildConfig.DEBUG) return
        context.dataStore.edit { preferences ->
            preferences[KEY_CUSTOM_BASE_URL] = url
        }
    }

    val tokenFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        val raw = preferences[KEY_JWT_TOKEN]
        if (!raw.isNullOrBlank()) CryptoManager.decrypt(raw) else null
    }

    val roleFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[KEY_USER_ROLE]
    }

    val userNameFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[KEY_USER_NAME]
    }

    fun getTokenSync(): String? {
        return memoryCachedToken
    }

    suspend fun getToken(): String? {
        val memory = memoryCachedToken
        if (!memory.isNullOrBlank()) return memory
        val encrypted = context.dataStore.data.map { it[KEY_JWT_TOKEN] }.firstOrNull()
        val decrypted = if (!encrypted.isNullOrBlank()) CryptoManager.decrypt(encrypted) else null
        memoryCachedToken = decrypted
        return decrypted
    }

    suspend fun getRole(): String? {
        return context.dataStore.data.map { it[KEY_USER_ROLE] }.firstOrNull()
    }

    suspend fun getUserName(): String? {
        return context.dataStore.data.map { it[KEY_USER_NAME] }.firstOrNull()
    }

    suspend fun saveAuthData(token: String, role: String, fullName: String) {
        memoryCachedToken = token
        val encryptedToken = CryptoManager.encrypt(token)
        context.dataStore.edit { preferences ->
            preferences[KEY_JWT_TOKEN] = encryptedToken
            preferences[KEY_USER_ROLE] = role
            preferences[KEY_USER_NAME] = fullName
        }
    }

    suspend fun getCardQrToken(): String? {
        return context.dataStore.data.map { it[KEY_CARD_QR_TOKEN] }.firstOrNull()
    }

    suspend fun saveCardQrToken(qrToken: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_CARD_QR_TOKEN] = qrToken
        }
    }

    suspend fun clearAuthData() {
        memoryCachedToken = null
        context.dataStore.edit { preferences ->
            preferences.remove(KEY_JWT_TOKEN)
            preferences.remove(KEY_USER_ROLE)
            preferences.remove(KEY_USER_NAME)
        }
    }
}
