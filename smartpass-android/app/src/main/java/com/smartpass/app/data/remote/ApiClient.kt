package com.smartpass.app.data.remote

import android.content.Context
import android.os.Build
import com.smartpass.app.BuildConfig
import com.smartpass.app.data.local.TokenManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    const val EMULATOR_URL = "http://10.0.2.2:3000/"
    const val PHYSICAL_DEVICE_URL = "http://127.0.0.1:3000/"

    fun isEmulator(): Boolean {
        return (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.HARDWARE.contains("goldfish")
                || Build.HARDWARE.contains("ranchu")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.PRODUCT.contains("sdk_google")
                || Build.PRODUCT.contains("google_sdk")
                || Build.PRODUCT.contains("sdk")
                || Build.PRODUCT.contains("sdk_x86")
                || Build.PRODUCT.contains("vbox86p")
                || Build.PRODUCT.contains("emulator")
                || Build.PRODUCT.contains("simulator")
    }

    fun getDefaultBaseUrl(): String {
        return if (isEmulator()) EMULATOR_URL else PHYSICAL_DEVICE_URL
    }

    private var currentBaseUrl: String = getDefaultBaseUrl()

    private class HostSelectionInterceptor : Interceptor {
        @Volatile
        var hostUrl: HttpUrl? = currentBaseUrl.toHttpUrlOrNull()

        override fun intercept(chain: Interceptor.Chain): Response {
            var request = chain.request()
            val target = hostUrl
            if (target != null) {
                val newUrl = request.url.newBuilder()
                    .scheme(target.scheme)
                    .host(target.host)
                    .port(target.port)
                    .build()
                request = request.newBuilder().url(newUrl).build()
            }
            return chain.proceed(request)
        }
    }

    private val hostInterceptor = HostSelectionInterceptor()
    @Volatile
    private var apiService: SmartPassApiService? = null

    fun updateBaseUrl(newUrl: String) {
        val sanitized = if (newUrl.endsWith("/")) newUrl else "$newUrl/"
        sanitized.toHttpUrlOrNull()?.let {
            currentBaseUrl = sanitized
            hostInterceptor.hostUrl = it
        }
    }

    fun getBaseUrl(): String = currentBaseUrl

    @Synchronized
    fun getService(context: Context): SmartPassApiService {
        val existing = apiService
        if (existing != null) return existing

        val tokenManager = TokenManager(context.applicationContext)

        // In debug build: load any custom base url
        if (BuildConfig.DEBUG) {
            CoroutineScope(Dispatchers.IO).launch {
                tokenManager.getCustomBaseUrl()?.let { savedUrl ->
                    if (savedUrl.isNotBlank()) {
                        updateBaseUrl(savedUrl)
                    }
                }
            }
        }

        val clientBuilder = OkHttpClient.Builder()
            .addInterceptor(hostInterceptor)
            .addInterceptor(AuthInterceptor(tokenManager))
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)

        if (BuildConfig.DEBUG) {
            // Safe debug logger: headers/basic only, never logs raw sensitive passwords or full bodies
            val safeLogging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }
            clientBuilder.addInterceptor(safeLogging)
        }

        val okHttpClient = clientBuilder.build()

        val retrofit = Retrofit.Builder()
            .baseUrl(EMULATOR_URL) // Base placeholder, dynamically rewritten by hostInterceptor
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(GsonAdapters.buildGson()))
            .build()

        val service = retrofit.create(SmartPassApiService::class.java)
        apiService = service
        return service
    }
}
