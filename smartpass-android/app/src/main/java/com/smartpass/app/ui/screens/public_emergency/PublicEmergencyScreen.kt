package com.smartpass.app.ui.screens.public_emergency

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Call
import androidx.compose.material.icons.outlined.Emergency
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartpass.app.ui.components.EmptyView
import com.smartpass.app.ui.components.ErrorView
import com.smartpass.app.ui.components.LoadingView
import com.smartpass.app.ui.theme.*

@Composable
fun PublicEmergencyScreen(
    viewModel: PublicEmergencyViewModel
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp, vertical = 24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Red Emergency Banner
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = ErrorRed,
            modifier = Modifier.padding(bottom = 20.dp)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Outlined.Emergency,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "HỒ SƠ Y TẾ KHẨN CẤP",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    letterSpacing = 1.sp
                )
            }
        }

        when (state) {
            is PublicEmergencyUiState.Loading -> {
                LoadingView(message = "Đang tra cứu dữ liệu thẻ y tế khẩn cấp...")
            }
            is PublicEmergencyUiState.Error -> {
                ErrorView(
                    message = (state as PublicEmergencyUiState.Error).message
                )
            }
            is PublicEmergencyUiState.Success -> {
                val fields = (state as PublicEmergencyUiState.Success).fields

                if (fields.isEmpty()) {
                    EmptyView(
                        message = "Chủ thẻ chưa chia sẻ thông tin y tế công khai hoặc hồ sơ khẩn cấp đang tắt."
                    )
                } else {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surface,
                        shadowElevation = 0.5.dp
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                text = "Thông tin y tế được phép hiển thị",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(14.dp))

                            // Strict: Render ONLY fields present in the API response map
                            fields.forEach { (key, value) ->
                                if (value != null && value.toString().isNotBlank()) {
                                    val label = when (key) {
                                        "fullName" -> "Họ và tên chủ thẻ"
                                        "emergencyContactName" -> "Người liên hệ khẩn cấp"
                                        "emergencyContactPhone" -> "Số điện thoại liên hệ"
                                        "allergies" -> "Tiền sử dị ứng / Cảnh báo"
                                        "bloodType" -> "Nhóm máu"
                                        "insuranceInfo" -> "Mã thẻ BHYT / Bảo hiểm"
                                        else -> key
                                    }
                                    DetailFieldRow(label = label, value = value.toString())
                                    HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp))
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    val contactPhone = fields["emergencyContactPhone"]?.toString() ?: ""

                    // Action 1: Call Emergency Contact
                    if (contactPhone.isNotBlank()) {
                        Button(
                            onClick = {
                                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$contactPhone"))
                            context.startActivity(intent)
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BrandSkySecondary)
                        ) {
                            Icon(Icons.Outlined.Call, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Gọi người thân ($contactPhone)")
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    // Action 2: Call Ambulance 115
                    Button(
                        onClick = {
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:115"))
                            context.startActivity(intent)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = ErrorRed)
                    ) {
                        Icon(Icons.Outlined.Emergency, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Gọi Cấp Cứu Y Tế (115)")
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Action 3: Share Location
                    OutlinedButton(
                        onClick = {
                            shareLocation(context, contactPhone)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(Icons.Outlined.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Chia sẻ vị trí hiện tại")
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailFieldRow(label: String, value: String) {
    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold),
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

private fun shareLocation(context: Context, contactPhone: String) {
    val phonePart = if (contactPhone.isNotBlank()) " SĐT người thân: $contactPhone." else ""
    val shareIntent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(
            Intent.EXTRA_TEXT,
            "CẢNH BÁO KHẨN CẤP: Tôi đang hỗ trợ chủ thẻ SmartPass gặp sự cố y tế.$phonePart Vị trí hiện tại: https://maps.google.com/?q=10.7769,106.7009"
        )
    }
    context.startActivity(Intent.createChooser(shareIntent, "Gửi vị trí qua..."))
}
