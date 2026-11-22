# SmartPass Proguard Rules

# Preserve Gson data models
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.smartpass.app.data.model.** { *; }

# Retrofit 2
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions
-keepattributes *Annotation*

# OkHttp 3 / 4
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# ML Kit Barcode
-keep class com.google.mlkit.vision.** { *; }

# CameraX
-keep class androidx.camera.** { *; }

# DataStore & Crypto
-keep class androidx.datastore.** { *; }
-keep class androidx.security.crypto.** { *; }

# Android KeyStore
-keepclassmembers class * {
    native <methods>;
}

