package com.smartpass.app.ui.screens.emergency

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.PrivacyTip
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartpass.app.ui.components.*
import com.smartpass.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmergencyProfileScreen(
    viewModel: EmergencyProfileViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val profile = state.profile

    var fullName by remember(profile) { mutableStateOf(profile.fullName ?: "") }
    var contactName by remember(profile) { mutableStateOf(profile.emergencyContactName ?: "") }
    var contactPhone by remember(profile) { mutableStateOf(profile.emergencyContactPhone ?: "") }
    var allergies by remember(profile) { mutableStateOf(profile.allergies ?: "") }
    var bloodType by remember(profile) { mutableStateOf(profile.bloodType ?: "O+") }
    var insuranceInfo by remember(profile) { mutableStateOf(profile.insuranceInfo ?: "") }
    var isEnabled by remember(profile) { mutableStateOf(profile.isEnabled) }

    var visibleFields by remember(profile) {
        mutableStateOf(profile.visibleFields.toSet())
    }

    val bloodTypeOptions = listOf("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Thẻ Y Tế & Khẩn Cấp",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                state.isLoading -> LoadingView(message = "Đang tải hồ sơ khẩn cấp...")
                state.error != null && profile._id == null -> ErrorView(
                    message = state.error ?: "Đã xảy ra lỗi",
                    onRetry = { viewModel.loadProfile() }
                )
                else -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp)
                            .verticalScroll(rememberScrollState()),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Feedback banner
                        state.successMessage?.let { msg ->
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 14.dp),
                                shape = RoundedCornerShape(12.dp),
                                color = SuccessContainerLight
                            ) {
                                Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = SuccessGreen)
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(text = msg, style = MaterialTheme.typography.bodySmall, color = SuccessGreen)
                                }
                            }
                        }

                        state.error?.let { err ->
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 14.dp),
                                shape = RoundedCornerShape(12.dp),
                                color = ErrorContainerLight
                            ) {
                                Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Outlined.ErrorOutline, contentDescription = null, tint = ErrorRed)
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(text = err, style = MaterialTheme.typography.bodySmall, color = ErrorRed)
                                }
                            }
                        }

                        // Master Enable Toggle Card
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            color = if (isEnabled) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f) else MaterialTheme.colorScheme.surface,
                            shadowElevation = 0.5.dp
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(16.dp)
                                    .fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Kích hoạt Thẻ Khẩn Cấp Công Khai",
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = if (isEnabled) "Cho phép người khác quét QR xem thông tin y tế khi gặp sự cố" else "Đang tắt: Quét mã QR sẽ không hiện bất kỳ thông tin nào",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Switch(
                                    checked = isEnabled,
                                    onCheckedChange = { isEnabled = it }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(18.dp))

                        // Privacy explanation card
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        ) {
                            Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
                                Icon(
                                    imageVector = Icons.Outlined.PrivacyTip,
                                    contentDescription = null,
                                    tint = BrandTealPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = "Quyền riêng tư tuyệt đối: Chỉ các trường được bạn bật công tắc bên dưới mới xuất hiện khi người khác quét mã QR. Các trường tắt công tắc sẽ bị ẩn hoàn toàn khỏi phản hồi máy chủ.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(18.dp))

                        // Fields & Privacy Toggles
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surface,
                            shadowElevation = 0.5.dp
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Text(
                                    text = "Cài đặt hiển thị dữ liệu y tế",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(16.dp))

                                // Field 1: Full name
                                PrivacyFieldRow(
                                    label = "Họ và tên",
                                    fieldKey = "fullName",
                                    value = fullName,
                                    onValueChange = { fullName = it },
                                    isFieldVisible = visibleFields.contains("fullName"),
                                    onVisibilityChange = { checked ->
                                        visibleFields = if (checked) visibleFields + "fullName" else visibleFields - "fullName"
                                    }
                                )

                                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                                // Field 2: Contact name
                                PrivacyFieldRow(
                                    label = "Người liên hệ khẩn cấp",
                                    fieldKey = "emergencyContactName",
                                    value = contactName,
                                    onValueChange = { contactName = it },
                                    isFieldVisible = visibleFields.contains("emergencyContactName"),
                                    onVisibilityChange = { checked ->
                                        visibleFields = if (checked) visibleFields + "emergencyContactName" else visibleFields - "emergencyContactName"
                                    }
                                )

                                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                                // Field 3: Contact phone
                                PrivacyFieldRow(
                                    label = "Số điện thoại khẩn cấp",
                                    fieldKey = "emergencyContactPhone",
                                    value = contactPhone,
                                    onValueChange = { contactPhone = it },
                                    isFieldVisible = visibleFields.contains("emergencyContactPhone"),
                                    onVisibilityChange = { checked ->
                                        visibleFields = if (checked) visibleFields + "emergencyContactPhone" else visibleFields - "emergencyContactPhone"
                                    }
                                )

                                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                                // Field 4: Allergies
                                PrivacyFieldRow(
                                    label = "Dị ứng thuốc / thực phẩm",
                                    fieldKey = "allergies",
                                    value = allergies,
                                    onValueChange = { allergies = it },
                                    isFieldVisible = visibleFields.contains("allergies"),
                                    onVisibilityChange = { checked ->
                                        visibleFields = if (checked) visibleFields + "allergies" else visibleFields - "allergies"
                                    }
                                )

                                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                                // Field 5: Blood Type
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "Nhóm máu",
                                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold)
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            bloodTypeOptions.take(4).forEach { bt ->
                                                FilterChip(
                                                    selected = bloodType == bt,
                                                    onClick = { bloodType = bt },
                                                    label = { Text(bt, fontSize = 11.sp) }
                                                )
                                            }
                                        }
                                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            bloodTypeOptions.drop(4).forEach { bt ->
                                                FilterChip(
                                                    selected = bloodType == bt,
                                                    onClick = { bloodType = bt },
                                                    label = { Text(bt, fontSize = 11.sp) }
                                                )
                                            }
                                        }
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text(
                                            text = if (visibleFields.contains("bloodType")) "Hiện" else "Ẩn",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = if (visibleFields.contains("bloodType")) SuccessGreen else MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Switch(
                                            checked = visibleFields.contains("bloodType"),
                                            onCheckedChange = { checked ->
                                                visibleFields = if (checked) visibleFields + "bloodType" else visibleFields - "bloodType"
                                            }
                                        )
                                    }
                                }

                                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                                // Field 6: Insurance info
                                PrivacyFieldRow(
                                    label = "Thông tin BHYT / Bảo hiểm",
                                    fieldKey = "insuranceInfo",
                                    value = insuranceInfo,
                                    onValueChange = { insuranceInfo = it },
                                    isFieldVisible = visibleFields.contains("insuranceInfo"),
                                    onVisibilityChange = { checked ->
                                        visibleFields = if (checked) visibleFields + "insuranceInfo" else visibleFields - "insuranceInfo"
                                    }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        // Action Buttons: Save & Rotate QR
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            OutlinedButton(
                                onClick = { viewModel.rotateQr() },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Outlined.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Đổi mã QR")
                            }

                            Button(
                                onClick = {
                                    viewModel.saveProfile(
                                        name = fullName.trim(),
                                        contactName = contactName.trim(),
                                        contactPhone = contactPhone.trim(),
                                        allergies = allergies.trim(),
                                        bloodType = bloodType,
                                        insurance = insuranceInfo.trim(),
                                        visibleFields = visibleFields.toList(),
                                        isEnabled = isEnabled
                                    )
                                },
                                enabled = !state.isSaving,
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                if (state.isSaving) {
                                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = Color.White)
                                } else {
                                    Icon(Icons.Outlined.Save, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Lưu hồ sơ")
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(32.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun PrivacyFieldRow(
    label: String,
    @Suppress("UNUSED_PARAMETER") fieldKey: String,
    value: String,
    onValueChange: (String) -> Unit,
    isFieldVisible: Boolean,
    onVisibilityChange: (Boolean) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold)
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = if (isFieldVisible) "Hiện khi quét" else "Ẩn riêng tư",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (isFieldVisible) SuccessGreen else MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(8.dp))
                Switch(
                    checked = isFieldVisible,
                    onCheckedChange = onVisibilityChange
                )
            }
        }
        Spacer(modifier = Modifier.height(6.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(10.dp)
        )
    }
}
