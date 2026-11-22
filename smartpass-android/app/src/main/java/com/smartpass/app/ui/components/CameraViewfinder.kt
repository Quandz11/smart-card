package com.smartpass.app.ui.components

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.annotation.OptIn
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.delay
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

@OptIn(ExperimentalGetImage::class)
@Composable
fun CameraViewfinder(
    onBarcodeScanned: (String) -> Unit,
    modifier: Modifier = Modifier,
    torchEnabled: Boolean = false,
    isScanningEnabled: Boolean = true
) {
    val lifecycleOwner = LocalLifecycleOwner.current

    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    val isScanLocked = remember { AtomicBoolean(false) }
    val canScan = remember { AtomicBoolean(isScanningEnabled) }
    var activeCamera by remember { mutableStateOf<Camera?>(null) }

    LaunchedEffect(isScanningEnabled) {
        canScan.set(isScanningEnabled)
        if (isScanningEnabled) {
            // Debounce 800ms before unlocking to prevent immediate re-scan of the same code
            delay(800L)
            isScanLocked.set(false)
        } else {
            isScanLocked.set(true)
        }
    }

    LaunchedEffect(torchEnabled, activeCamera) {
        try {
            activeCamera?.cameraControl?.enableTorch(torchEnabled)
        } catch (_: Exception) {}
    }

    DisposableEffect(lifecycleOwner) {
        onDispose {
            try {
                activeCamera?.cameraControl?.enableTorch(false)
            } catch (_: Exception) {}
            cameraExecutor.shutdown()
        }
    }

    Box(
        modifier = modifier.background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val previewView = PreviewView(ctx).apply {
                    scaleType = PreviewView.ScaleType.FILL_CENTER
                }

                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()

                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val options = BarcodeScannerOptions.Builder()
                        .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                        .build()
                    val barcodeScanner = BarcodeScanning.getClient(options)

                    val imageAnalysis = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()

                    imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
                        // Completely drop frames when scanning is disabled or currently locked
                        if (!canScan.get() || isScanLocked.get()) {
                            imageProxy.close()
                            return@setAnalyzer
                        }

                        val mediaImage = imageProxy.image
                        if (mediaImage != null) {
                            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                            barcodeScanner.process(image)
                                .addOnSuccessListener { barcodes ->
                                    val barcode = barcodes.firstOrNull()?.rawValue
                                    if (!barcode.isNullOrBlank() && canScan.get() && isScanLocked.compareAndSet(false, true)) {
                                        // Sound feedback
                                        try {
                                            val tone = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)
                                            tone.startTone(ToneGenerator.TONE_PROP_BEEP, 100)
                                        } catch (_: Exception) {}

                                        // Haptic feedback
                                        try {
                                            @Suppress("DEPRECATION")
                                            val vibrator = ctx.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                                vibrator?.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
                                            } else {
                                                @Suppress("DEPRECATION")
                                                vibrator?.vibrate(50)
                                            }
                                        } catch (_: Exception) {}

                                        // Deliver callback to UI thread.
                                        // Scanner remains locked until caller re-enables scanning via isScanningEnabled!
                                        Handler(Looper.getMainLooper()).post {
                                            onBarcodeScanned(barcode)
                                        }
                                    }
                                }
                                .addOnCompleteListener {
                                    imageProxy.close()
                                }
                        } else {
                            imageProxy.close()
                        }
                    }

                    try {
                        cameraProvider.unbindAll()
                        val camera = cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            CameraSelector.DEFAULT_BACK_CAMERA,
                            preview,
                            imageAnalysis
                        )
                        activeCamera = camera
                        camera.cameraControl.enableTorch(torchEnabled)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }, ContextCompat.getMainExecutor(ctx))

                previewView
            }
        )
    }
}
