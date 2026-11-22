package com.smartpass.app.ui.components

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.FlashOff
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.smartpass.app.core.qr.QrPayload
import com.smartpass.app.core.qr.QrPayloadParser
import com.smartpass.app.ui.theme.BrandTealPrimary
import com.smartpass.app.ui.theme.BrandTealPrimaryDark

@Composable
fun ScannerOverlay(
    title: String,
    instruction: String,
    manualInputLabel: String = "Nhập mã thủ công (Card Code / QR Token)",
    onScannedOrEntered: (String) -> Unit,
    modifier: Modifier = Modifier,
    isScanningEnabled: Boolean = true
) {
    val context = LocalContext.current
    var manualText by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var torchEnabled by remember { mutableStateOf(false) }

    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasCameraPermission = isGranted
        if (!isGranted) {
            Toast.makeText(context, "Ứng dụng cần quyền máy ảnh để quét mã QR", Toast.LENGTH_SHORT).show()
        }
    }

    fun handleInput(raw: String) {
        val parsed = QrPayloadParser.parse(raw)
        when (parsed) {
            is QrPayload.Token -> {
                errorMessage = null
                onScannedOrEntered(parsed.value)
            }
            is QrPayload.CardCode -> {
                errorMessage = null
                onScannedOrEntered(parsed.value)
            }
            is QrPayload.ServiceV1 -> {
                errorMessage = null
                onScannedOrEntered(parsed.rawValue)
            }
            is QrPayload.HumanCode -> {
                errorMessage = null
                onScannedOrEntered(parsed.rawValue)
            }
            is QrPayload.UnsupportedType -> {
                val msg = "Loại mã chưa hỗ trợ"
                errorMessage = msg
                Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
            }
            is QrPayload.Invalid -> {
                errorMessage = parsed.reason
                Toast.makeText(context, parsed.reason, Toast.LENGTH_SHORT).show()
            }
        }
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = instruction,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))

        // Scanner viewfinder box with banking reticle
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(280.dp)
                .clip(RoundedCornerShape(20.dp))
                .background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            if (hasCameraPermission) {
                // Live camera feed
                CameraViewfinder(
                    onBarcodeScanned = { rawCode ->
                        handleInput(rawCode)
                    },
                    torchEnabled = torchEnabled,
                    isScanningEnabled = isScanningEnabled && errorMessage == null,
                    modifier = Modifier.fillMaxSize()
                )

                // High-tech Banking Reticle with corner brackets & animated laser
                ScannerReticle(
                    boxSize = 200.dp,
                    laserColor = BrandTealPrimaryDark,
                    cornerColor = BrandTealPrimaryDark,
                    scrimColor = Color(0x66000000),
                    modifier = Modifier.fillMaxSize()
                )

                // Flashlight toggle button on the camera box
                IconButton(
                    onClick = { torchEnabled = !torchEnabled },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(12.dp)
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(if (torchEnabled) BrandTealPrimary else Color.Black.copy(alpha = 0.5f))
                ) {
                    Icon(
                        imageVector = if (torchEnabled) Icons.Default.FlashOn else Icons.Default.FlashOff,
                        contentDescription = "Bật/Tắt đèn flash",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            } else {
                // Permission request fallback card
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CameraAlt,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.8f),
                        modifier = Modifier.size(44.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Chưa cấp quyền máy ảnh",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Cần quyền camera để quét mã QR thẻ sinh viên",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.7f),
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BrandTealPrimary)
                        ) {
                            Text("Cấp quyền", fontSize = 12.sp)
                        }
                        OutlinedButton(
                            onClick = {
                                val intent = Intent(
                                    Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                                    Uri.fromParts("package", context.packageName, null)
                                )
                                context.startActivity(intent)
                            },
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.Settings, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Cài đặt", fontSize = 12.sp, color = Color.White)
                        }
                    }
                }
            }
        }

        if (errorMessage != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = errorMessage.orEmpty(),
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Manual Input Fallback
        OutlinedTextField(
            value = manualText,
            onValueChange = {
                manualText = it
                errorMessage = null
            },
            label = { Text(manualInputLabel, fontSize = 13.sp) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp)
        )
        Spacer(modifier = Modifier.height(10.dp))
        Button(
            onClick = {
                if (manualText.isNotBlank()) {
                    handleInput(manualText.trim())
                    manualText = ""
                }
            },
            enabled = manualText.isNotBlank(),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
        ) {
            Text("Xác nhận mã", fontWeight = FontWeight.SemiBold)
        }
    }
}
