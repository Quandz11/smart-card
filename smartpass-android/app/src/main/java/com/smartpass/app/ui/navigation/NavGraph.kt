package com.smartpass.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.launch
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.smartpass.app.data.local.TokenManager
import com.smartpass.app.data.remote.ApiClient
import com.smartpass.app.data.remote.AuthInterceptor
import com.smartpass.app.data.repository.*
import com.smartpass.app.ui.screens.attendance.AttendanceScreen
import com.smartpass.app.ui.screens.attendance.AttendanceViewModel
import com.smartpass.app.ui.screens.card.MyCardScreen
import com.smartpass.app.ui.screens.card.MyCardViewModel
import com.smartpass.app.ui.screens.emergency.EmergencyProfileScreen
import com.smartpass.app.ui.screens.emergency.EmergencyProfileViewModel
import com.smartpass.app.ui.screens.events.EventsScreen
import com.smartpass.app.ui.screens.events.EventsViewModel
import com.smartpass.app.ui.screens.home.HomeScreen
import com.smartpass.app.ui.screens.home.HomeViewModel
import com.smartpass.app.ui.screens.library.LibraryScreen
import com.smartpass.app.ui.screens.library.LibraryViewModel
import com.smartpass.app.ui.screens.login.LoginScreen
import com.smartpass.app.ui.screens.login.LoginViewModel
import com.smartpass.app.ui.screens.notifications.NotificationsScreen
import com.smartpass.app.ui.screens.notifications.NotificationsViewModel
import com.smartpass.app.ui.screens.parking.ParkingScreen
import com.smartpass.app.ui.screens.parking.ParkingViewModel
import com.smartpass.app.ui.screens.pin_setup.PinSetupScreen
import com.smartpass.app.ui.screens.pin_setup.PinSetupViewModel
import com.smartpass.app.ui.screens.profile.ProfileScreen
import com.smartpass.app.ui.screens.profile.ProfileViewModel
import com.smartpass.app.ui.screens.public_emergency.PublicEmergencyScreen
import com.smartpass.app.ui.screens.public_emergency.PublicEmergencyViewModel
import com.smartpass.app.ui.screens.register.RegisterScreen
import com.smartpass.app.ui.screens.register.RegisterViewModel
import com.smartpass.app.ui.screens.rooms.RoomBookingsScreen
import com.smartpass.app.ui.screens.rooms.RoomBookingsViewModel
import com.smartpass.app.ui.screens.scan.ScanScreen
import com.smartpass.app.ui.screens.scan.ScanViewModel
import com.smartpass.app.ui.screens.schedule.ScheduleScreen
import com.smartpass.app.ui.screens.schedule.ScheduleViewModel
import com.smartpass.app.ui.screens.smart_otp.SmartOtpScreen
import com.smartpass.app.ui.screens.smart_otp.SmartOtpViewModel
import com.smartpass.app.ui.screens.staff_attendance.StaffAttendanceScreen
import com.smartpass.app.ui.screens.staff_attendance.StaffAttendanceViewModel
import com.smartpass.app.ui.screens.staff_canteen.StaffCanteenScreen
import com.smartpass.app.ui.screens.staff_canteen.StaffCanteenViewModel
import com.smartpass.app.ui.screens.staff_home.StaffHomeScreen
import com.smartpass.app.ui.screens.staff_home.StaffHomeViewModel
import com.smartpass.app.ui.screens.staff_library.StaffLibraryScreen
import com.smartpass.app.ui.screens.staff_library.StaffLibraryViewModel
import com.smartpass.app.ui.screens.staff_parking.StaffParkingScreen
import com.smartpass.app.ui.screens.staff_parking.StaffParkingViewModel
import com.smartpass.app.ui.screens.staff_rooms.StaffRoomApprovalScreen
import com.smartpass.app.ui.screens.staff_rooms.StaffRoomApprovalViewModel
import com.smartpass.app.ui.screens.staff_verify.StaffCardVerifyScreen
import com.smartpass.app.ui.screens.staff_verify.StaffCardVerifyViewModel
import com.smartpass.app.ui.screens.wallet.WalletScreen
import com.smartpass.app.ui.screens.wallet.WalletViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SmartPassNavGraph(
    navController: NavHostController = rememberNavController()
) {
    val context = LocalContext.current
    val tokenManager = remember { TokenManager(context) }
    val apiService = remember { ApiClient.getService(context) }

    // Repositories
    val authRepo = remember { AuthRepository(apiService, tokenManager) }
    val cardRepo = remember { CardRepository(apiService) }
    val attendanceRepo = remember { AttendanceRepository(apiService) }
    val libraryRepo = remember { LibraryRepository(apiService) }
    val walletRepo = remember { WalletRepository(apiService) }
    val parkingRepo = remember { ParkingRepository(apiService) }
    val roomRepo = remember { RoomBookingRepository(apiService) }
    val eventRepo = remember { EventRepository(apiService) }
    val scheduleRepo = remember { ScheduleRepository(apiService) }
    val notifRepo = remember { NotificationRepository(apiService) }
    val emergencyRepo = remember { EmergencyRepository(apiService) }
    val qrRepo = remember { QrRepository(apiService) }
    val otpRepo = remember { OtpRepository(apiService) }

    // User Role observation
    val coroutineScope = rememberCoroutineScope()
    // User Role observation
    val userRole by tokenManager.roleFlow.collectAsState(initial = null)
    val isStaff = userRole != null && userRole != "student"

    // Listen to global 401 unauthorized events to route back to Login
    LaunchedEffect(Unit) {
        AuthInterceptor.unauthorizedEvent.collect {
            navController.navigate(Screen.Login.route) {
                popUpTo(0) { inclusive = true }
            }
        }
    }

    val currentBackStack by navController.currentBackStackEntryAsState()
    val currentRoute = currentBackStack?.destination?.route
    val isAuthScreen = currentRoute == Screen.Login.route || currentRoute == Screen.Register.route
    val isPublicEmergency = currentRoute?.startsWith("public_emergency") == true
    val showBottomBar = !isAuthScreen && !isPublicEmergency

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    tonalElevation = 3.dp
                ) {
                    if (!isStaff) {
                        // Student Bottom Bar Items
                        NavigationBarItem(
                            selected = currentRoute == Screen.Home.route,
                            onClick = {
                                navController.navigate(Screen.Home.route) {
                                    popUpTo(Screen.Home.route) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(Icons.Outlined.Home, contentDescription = "Trang chủ") },
                            label = { Text("Trang chủ") }
                        )
                        NavigationBarItem(
                            selected = currentRoute == Screen.MyCard.route,
                            onClick = {
                                navController.navigate(Screen.MyCard.route) {
                                    popUpTo(Screen.Home.route) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(Icons.Outlined.CreditCard, contentDescription = "Thẻ số") },
                            label = { Text("Thẻ số") }
                        )
                        NavigationBarItem(
                            selected = currentRoute == Screen.Wallet.route,
                            onClick = {
                                navController.navigate(Screen.Wallet.route) {
                                    popUpTo(Screen.Home.route) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(Icons.Outlined.AccountBalanceWallet, contentDescription = "Ví tiền") },
                            label = { Text("Ví tiền") }
                        )
                        NavigationBarItem(
                            selected = currentRoute == Screen.Scan.route,
                            onClick = {
                                navController.navigate(Screen.Scan.route) {
                                    popUpTo(Screen.Home.route) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(Icons.Outlined.QrCodeScanner, contentDescription = "Quét mã") },
                            label = { Text("Quét mã") }
                        )
                        NavigationBarItem(
                            selected = currentRoute == Screen.Profile.route,
                            onClick = {
                                navController.navigate(Screen.Profile.route) {
                                    popUpTo(Screen.Home.route) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(Icons.Outlined.Person, contentDescription = "Cá nhân") },
                            label = { Text("Cá nhân") }
                        )
                    } else {
                        // Staff Bottom Bar Items
                        NavigationBarItem(
                            selected = currentRoute == Screen.StaffHome.route,
                            onClick = {
                                navController.navigate(Screen.StaffHome.route) {
                                    popUpTo(Screen.StaffHome.route) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(Icons.Outlined.Dashboard, contentDescription = "Bàn làm việc") },
                            label = { Text("Nghiệp vụ") }
                        )
                        NavigationBarItem(
                            selected = currentRoute == Screen.StaffCardVerify.route,
                            onClick = {
                                navController.navigate(Screen.StaffCardVerify.route) {
                                    popUpTo(Screen.StaffHome.route) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(Icons.Outlined.Badge, contentDescription = "Kiểm tra thẻ") },
                            label = { Text("Soát thẻ") }
                        )
                        NavigationBarItem(
                            selected = currentRoute == Screen.Scan.route,
                            onClick = {
                                navController.navigate(Screen.Scan.route) {
                                    popUpTo(Screen.StaffHome.route) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(Icons.Outlined.QrCodeScanner, contentDescription = "Quét mã") },
                            label = { Text("Quét QR") }
                        )
                        NavigationBarItem(
                            selected = currentRoute == Screen.Profile.route,
                            onClick = {
                                navController.navigate(Screen.Profile.route) {
                                    popUpTo(Screen.StaffHome.route) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(Icons.Outlined.Person, contentDescription = "Tài khoản") },
                            label = { Text("Tài khoản") }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Login.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            // Auth Screens
            composable(Screen.Login.route) {
                val loginVm = remember { LoginViewModel(authRepo, tokenManager) }
                LoginScreen(
                    viewModel = loginVm,
                    onLoginSuccess = { mustSetPin, role ->
                        coroutineScope.launch {
                            val target = if (mustSetPin) {
                                Screen.PinSetup.route
                            } else if (role != "student") {
                                Screen.StaffHome.route
                            } else {
                                Screen.Home.route
                            }
                            navController.navigate(target) {
                                popUpTo(Screen.Login.route) { inclusive = true }
                            }
                        }
                    },
                    onNavigateToRegister = {
                        navController.navigate(Screen.Register.route)
                    }
                )
            }

            composable(Screen.PinSetup.route) {
                val pinSetupVm = remember { PinSetupViewModel(walletRepo) }
                PinSetupScreen(
                    viewModel = pinSetupVm,
                    onPinSetSuccess = {
                        coroutineScope.launch {
                            val role = tokenManager.getRole()
                            val target = if (role != null && role != "student") Screen.StaffHome.route else Screen.Home.route
                            navController.navigate(target) {
                                popUpTo(Screen.PinSetup.route) { inclusive = true }
                            }
                        }
                    }
                )
            }

            composable(Screen.SmartOtp.route) {
                val smartOtpVm = remember { SmartOtpViewModel(otpRepo) }
                SmartOtpScreen(
                    viewModel = smartOtpVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Register.route) {
                val regVm = remember { RegisterViewModel(authRepo) }
                RegisterScreen(
                    viewModel = regVm,
                    onRegisterSuccess = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    },
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            // Student Screens
            composable(Screen.Home.route) {
                val homeVm = remember { HomeViewModel(authRepo, walletRepo, scheduleRepo, notifRepo, emergencyRepo, tokenManager) }
                HomeScreen(
                    viewModel = homeVm,
                    onNavigate = { route -> navController.navigate(route) }
                )
            }

            composable(Screen.MyCard.route) {
                val myCardVm = remember { MyCardViewModel(authRepo, cardRepo, emergencyRepo) }
                MyCardScreen(
                    viewModel = myCardVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Attendance.route) {
                val attendanceVm = remember { AttendanceViewModel(attendanceRepo) }
                AttendanceScreen(
                    viewModel = attendanceVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Library.route) {
                val libVm = remember { LibraryViewModel(libraryRepo) }
                LibraryScreen(
                    viewModel = libVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Wallet.route) {
                val walletVm = remember { WalletViewModel(walletRepo) }
                WalletScreen(
                    viewModel = walletVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Parking.route) {
                val parkingVm = remember { ParkingViewModel(parkingRepo) }
                ParkingScreen(
                    viewModel = parkingVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.RoomBookings.route) {
                val roomVm = remember { RoomBookingsViewModel(roomRepo) }
                RoomBookingsScreen(
                    viewModel = roomVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Events.route) {
                val eventVm = remember { EventsViewModel(eventRepo) }
                EventsScreen(
                    viewModel = eventVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Schedule.route) {
                val scheduleVm = remember { ScheduleViewModel(scheduleRepo) }
                ScheduleScreen(
                    viewModel = scheduleVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Notifications.route) {
                val notifVm = remember { NotificationsViewModel(notifRepo) }
                NotificationsScreen(
                    viewModel = notifVm,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigate = { route ->
                        val target = when {
                            route.contains("attendance") -> Screen.Attendance.route
                            route.contains("wallet") -> Screen.Wallet.route
                            route.contains("library") -> Screen.Library.route
                            route.contains("parking") -> Screen.Parking.route
                            route.contains("room") -> Screen.RoomBookings.route
                            route.contains("event") -> Screen.Events.route
                            route.contains("card") -> Screen.MyCard.route
                            else -> null
                        }
                        if (target != null) {
                            navController.navigate(target)
                        }
                    }
                )
            }

            composable(Screen.Profile.route) {
                val profileVm = remember { ProfileViewModel(authRepo, tokenManager) }
                ProfileScreen(
                    viewModel = profileVm,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToPinSetup = { navController.navigate(Screen.PinSetup.route) },
                    onNavigateToSmartOtp = { navController.navigate(Screen.SmartOtp.route) },
                    onLoggedOut = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            composable(Screen.EmergencyProfile.route) {
                val emergencyVm = remember { EmergencyProfileViewModel(emergencyRepo) }
                EmergencyProfileScreen(
                    viewModel = emergencyVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Scan.route) {
                val scanVm = remember {
                    ScanViewModel(
                        cardRepository = cardRepo,
                        qrRepository = qrRepo,
                        walletRepository = walletRepo,
                        libraryRepository = libraryRepo,
                        parkingRepository = parkingRepo,
                        attendanceRepository = attendanceRepo,
                        eventRepository = eventRepo,
                        tokenManager = tokenManager
                    )
                }
                ScanScreen(
                    viewModel = scanVm,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToEmergency = { token ->
                        navController.navigate(Screen.PublicEmergency.createRoute(token))
                    },
                    onNavigateToRoomBooking = { _ ->
                        navController.navigate(Screen.RoomBookings.route)
                    }
                )
            }

            composable(
                route = Screen.PublicEmergency.route,
                arguments = listOf(navArgument("qrToken") { type = NavType.StringType })
            ) { backStackEntry ->
                val qrToken = backStackEntry.arguments?.getString("qrToken") ?: ""
                val publicVm = remember(qrToken) { PublicEmergencyViewModel(emergencyRepo, qrToken) }
                PublicEmergencyScreen(viewModel = publicVm)
            }

            // Staff Operation Screens
            composable(Screen.StaffHome.route) {
                val staffHomeVm = remember { StaffHomeViewModel(authRepo, emergencyRepo, tokenManager) }
                StaffHomeScreen(
                    viewModel = staffHomeVm,
                    onNavigate = { route -> navController.navigate(route) }
                )
            }

            composable(Screen.StaffAttendance.route) {
                val staffAttVm = remember { StaffAttendanceViewModel(attendanceRepo, qrRepo) }
                StaffAttendanceScreen(
                    viewModel = staffAttVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.StaffLibrary.route) {
                val staffLibVm = remember { StaffLibraryViewModel(libraryRepo) }
                StaffLibraryScreen(
                    viewModel = staffLibVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.StaffCanteen.route) {
                val staffCanteenVm = remember { StaffCanteenViewModel(walletRepo, qrRepo) }
                StaffCanteenScreen(
                    viewModel = staffCanteenVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.StaffParking.route) {
                val staffParkVm = remember { StaffParkingViewModel(parkingRepo) }
                StaffParkingScreen(
                    viewModel = staffParkVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.StaffRoomApproval.route) {
                val staffRoomVm = remember { StaffRoomApprovalViewModel(roomRepo) }
                StaffRoomApprovalScreen(
                    viewModel = staffRoomVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.StaffCardVerify.route) {
                val staffVerifyVm = remember { StaffCardVerifyViewModel(cardRepo) }
                StaffCardVerifyScreen(
                    viewModel = staffVerifyVm,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}
