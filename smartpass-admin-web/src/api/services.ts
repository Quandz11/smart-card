import { http as apiClient, PaginatedResult } from '../lib/http';

// ----------------- Data Models -----------------

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'student' | 'librarian' | 'canteen_staff' | 'parking_staff';
  phone?: string;
  studentCode?: string;
  className?: string;
  avatarUrl?: string;
  isActive: boolean;
  pinSetAt?: string;
  pinLockedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Semester {
  _id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  weeksCount: number;
  isCurrent: boolean;
  createdAt: string;
}

export interface Subject {
  _id: string;
  code: string;
  name: string;
  credits: number;
  department?: string;
  createdAt: string;
}

export interface SchoolClass {
  _id: string;
  code: string;
  name: string;
  homeroomTeacher?: User;
  academicYear: string;
  studentsCount?: number;
  createdAt: string;
}

export interface ScheduleSlot {
  _id: string;
  classId: SchoolClass | string;
  semesterId: Semester | string;
  subjectId: Subject | string;
  teacherId?: User | string;
  room: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  weeks: number[];
  createdAt: string;
}

export interface AttendanceSession {
  _id: string;
  slotId: ScheduleSlot;
  date: string;
  openedBy: User;
  openedAt: string;
  closedAt?: string;
  status: 'OPEN' | 'CLOSED';
  qrPublicId?: string;
  qrPayload?: string;
  createdAt: string;
}

export interface AttendanceRecordV2 {
  _id: string;
  sessionId: string | AttendanceSession;
  studentId: User;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  recordedAt?: string;
  method?: 'QR' | 'CARD_SCAN' | 'MANUAL';
  correctedBy?: User;
  correctedAt?: string;
  correctionNote?: string;
}

export interface OtpChallenge {
  _id: string;
  user: string;
  purpose: 'RESET_PIN' | 'CHANGE_PIN' | 'STAFF_CASH_CONFIRM';
  expiresAt: string;
  remainingSeconds: number;
  deliveredCode?: string;
}

export interface TopupOrder {
  _id: string;
  user: User | string;
  amount: number;
  txnRef: string;
  vnpayBankCode?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  paidAt?: string;
  createdAt: string;
}

export interface Card {
  _id: string;
  cardCode: string;
  owner: User;
  type: string;
  status: 'active' | 'locked' | 'expired' | 'lost';
  issuedAt?: string;
  expiresAt: string;
  nfcUid?: string;
  qrToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccessLog {
  _id: string;
  card?: Card;
  owner?: User;
  action: string;
  location?: string;
  detail?: string;
  createdBy?: User;
  createdAt: string;
}

export interface AttendanceRecord {
  _id: string;
  student: User;
  card: Card;
  classSession: string;
  subject?: string;
  checkedAt: string;
  status: 'present' | 'late';
  createdAt: string;
}

export interface LibraryLoan {
  _id: string;
  borrower: User;
  bookCode: string;
  bookTitle: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  createdAt: string;
}

export interface CanteenTransaction {
  _id: string;
  wallet: string;
  user: User;
  type: 'topup' | 'pay';
  amount: number;
  balanceAfter: number;
  note?: string;
  performedBy?: User;
  createdAt: string;
}

export interface ParkingSession {
  _id: string;
  owner: User;
  card: Card;
  vehiclePlate?: string;
  checkInAt: string;
  checkOutAt?: string;
  fee?: number;
  status: 'in' | 'out';
  createdAt: string;
}

export interface RoomBooking {
  _id: string;
  room: string;
  bookedBy: User;
  date: string;
  startTime: string;
  endTime: string;
  purpose?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
}

export interface EventItem {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  capacity: number;
  registeredCount: number;
  createdAt: string;
}

export interface ClassSchedule {
  _id: string;
  className: string;
  subject: string;
  teacher?: string;
  room?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  semester?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  id?: string;
  type?: string;
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  category?: string;
  title: string;
  body: string;
  audience?: 'all' | 'class' | 'individual';
  className?: string;
  receiver?: User;
  createdBy?: User;
  actionRoute?: string;
  createdAt: string;
  isRead?: boolean;
  readAt?: string;
  isSilent?: boolean;
}

export interface EmergencyProfile {
  _id: string;
  user: string;
  fullName?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  bloodType?: string;
  insuranceInfo?: string;
  visibleFields: string[];
  isEnabled: boolean;
  qrToken?: string;
}

export interface VerifyCardResult {
  card: {
    id: string;
    cardCode: string;
    status: string;
    expiresAt: string;
  };
  owner: {
    fullName?: string | null;
    studentCode?: string | null;
    className?: string | null;
  };
}

export interface QrCodeItem {
  _id: string;
  publicId: string;
  type: string;
  refKind: string;
  refId: string;
  label: string;
  location?: string;
  isActive: boolean;
  scanCount: number;
  lastScannedAt?: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
  canonicalPayload: string;
  barePayload: string;
}

// ----------------- Service Functions -----------------

// Auth
export const authService = {
  login: (data: { email: string; password: string }) =>
    apiClient.post<{ user: User; token: string; mustSetPin?: boolean }>('/api/auth/login', data) as unknown as Promise<{
      user: User;
      token: string;
      mustSetPin?: boolean;
    }>,
  getMe: () => apiClient.get<User>('/api/auth/me') as unknown as Promise<User>,
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.patch<{ message: string }>('/api/auth/change-password', data),
};

// Users (Admin)
export const userService = {
  getUsers: (params?: { q?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResult<User>>('/api/users', { params }) as unknown as Promise<
      PaginatedResult<User>
    >,
  getUserById: (id: string) => apiClient.get<User>(`/api/users/${id}`) as unknown as Promise<User>,
  createUser: (data: {
    fullName: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    studentCode?: string;
    className?: string;
  }) => apiClient.post<User>('/api/users', data) as unknown as Promise<User>,
  updateUser: (
    id: string,
    data: {
      fullName?: string;
      phone?: string;
      studentCode?: string;
      className?: string;
      avatarUrl?: string;
    }
  ) => apiClient.patch<User>(`/api/users/${id}`, data) as unknown as Promise<User>,
  updateRole: (id: string, role: string) =>
    apiClient.patch<User>(`/api/users/${id}/role`, { role }) as unknown as Promise<User>,
  deactivateUser: (id: string) =>
    apiClient.patch<User>(`/api/users/${id}/deactivate`) as unknown as Promise<User>,
  deleteUser: (id: string) => apiClient.delete<{ message: string }>(`/api/users/${id}`),
};

// Cards
export const cardService = {
  getCards: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResult<Card>>('/api/cards', { params }) as unknown as Promise<
      PaginatedResult<Card>
    >,
  getCardById: (id: string) => apiClient.get<Card>(`/api/cards/${id}`) as unknown as Promise<Card>,
  createCard: (data: { cardCode: string; owner: string; expiresAt: string; nfcUid?: string }) =>
    apiClient.post<Card>('/api/cards', data) as unknown as Promise<Card>,
  issueCard: (id: string) =>
    apiClient.patch<Card>(`/api/cards/${id}/issue`) as unknown as Promise<Card>,
  lockCard: (id: string) =>
    apiClient.patch<Card>(`/api/cards/${id}/lock`) as unknown as Promise<Card>,
  unlockCard: (id: string) =>
    apiClient.patch<Card>(`/api/cards/${id}/unlock`) as unknown as Promise<Card>,
  renewCard: (id: string, months: number) =>
    apiClient.patch<Card>(`/api/cards/${id}/renew`, { months }) as unknown as Promise<Card>,
  markLost: (id: string) =>
    apiClient.patch<Card>(`/api/cards/${id}/lost`) as unknown as Promise<Card>,
  deleteCard: (id: string) => apiClient.delete<{ message: string }>(`/api/cards/${id}`),
  getHistory: (id: string) =>
    apiClient.get<AccessLog[]>(`/api/cards/${id}/history`) as unknown as Promise<AccessLog[]>,
  verifyCard: (data: { cardCode?: string; nfcUid?: string; qrToken?: string }) =>
    apiClient.post<VerifyCardResult>('/api/cards/verify', data) as unknown as Promise<VerifyCardResult>,
};

// Logs
export const logService = {
  getLogs: (params?: {
    action?: string;
    from?: string;
    to?: string;
    owner?: string;
    card?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient.get<PaginatedResult<AccessLog>>('/api/logs', { params }) as unknown as Promise<
      PaginatedResult<AccessLog>
    >,
};

// Attendance
export const attendanceService = {
  getAttendanceList: (params?: { classSession?: string; date?: string }) =>
    apiClient.get<AttendanceRecord[]>('/api/attendance', { params }) as unknown as Promise<
      AttendanceRecord[]
    >,
  checkAttendance: (data: {
    cardCode?: string;
    nfcUid?: string;
    qrToken?: string;
    classSession?: string;
    subject?: string;
    sessionId?: string;
  }) =>
    apiClient.post<AttendanceRecord>('/api/attendance/check', data) as unknown as Promise<
      AttendanceRecord
    >,
  openSession: (data: { slotId: string; date: string }) =>
    apiClient.post<AttendanceSession>('/api/attendance/sessions', data) as unknown as Promise<AttendanceSession>,
  closeSession: (id: string) =>
    apiClient.post<{ session: AttendanceSession; absenteesCount: number }>(`/api/attendance/sessions/${id}/close`) as unknown as Promise<{
      session: AttendanceSession;
      absenteesCount: number;
    }>,
  getSessionRoster: (id: string) =>
    apiClient.get<{
      session: AttendanceSession;
      slot: ScheduleSlot;
      stats: { totalEnrolled: number; present: number; late: number; absent: number; notRecorded: number };
      roster: Array<{
        student: User;
        status: 'PRESENT' | 'LATE' | 'ABSENT' | 'NOT_RECORDED';
        recordId?: string;
        recordedAt?: string;
        method?: string;
        correctionNote?: string;
      }>;
    }>(`/api/attendance/sessions/${id}/roster`) as unknown as Promise<{
      session: AttendanceSession;
      slot: ScheduleSlot;
      stats: { totalEnrolled: number; present: number; late: number; absent: number; notRecorded: number };
      roster: Array<{
        student: User;
        status: 'PRESENT' | 'LATE' | 'ABSENT' | 'NOT_RECORDED';
        recordId?: string;
        recordedAt?: string;
        method?: string;
        correctionNote?: string;
      }>;
    }>,
  correctRecord: (id: string, data: { status: 'PRESENT' | 'LATE' | 'ABSENT'; note: string }) =>
    apiClient.patch<{ record: AttendanceRecordV2 }>(`/api/attendance/records/${id}`, data) as unknown as Promise<{
      record: AttendanceRecordV2;
    }>,
  getClassReport: (classId: string, params?: { from?: string; to?: string }) =>
    apiClient.get<{
      classInfo: SchoolClass;
      totalSessions: number;
      studentStats: Array<{
        student: User;
        present: number;
        late: number;
        absent: number;
        rate: string;
      }>;
    }>(`/api/attendance/reports/class/${classId}`, { params }) as unknown as Promise<{
      classInfo: SchoolClass;
      totalSessions: number;
      studentStats: Array<{
        student: User;
        present: number;
        late: number;
        absent: number;
        rate: string;
      }>;
    }>,
};

// Library
export const libraryService = {
  getAllLoans: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResult<LibraryLoan>>('/api/library/loans', {
      params,
    }) as unknown as Promise<PaginatedResult<LibraryLoan>>,
  borrowBook: (data: { cardCode: string; bookCode: string; bookTitle: string }) =>
    apiClient.post<LibraryLoan>('/api/library/borrow', data) as unknown as Promise<LibraryLoan>,
  returnBook: (data: { loanId: string }) =>
    apiClient.post<{ loan: LibraryLoan; overdue: boolean }>(
      '/api/library/return',
      data
    ) as unknown as Promise<{ loan: LibraryLoan; overdue: boolean }>,
};

// Wallet & Canteen
export const walletService = {
  getAllTransactions: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResult<CanteenTransaction>>('/api/wallet/transactions/all', {
      params,
    }) as unknown as Promise<PaginatedResult<CanteenTransaction>>,
  topUpWallet: (data: { userId: string; amount: number; pin: string; note?: string; idempotencyKey?: string }) =>
    apiClient.post<CanteenTransaction>('/api/wallet/topup', data) as unknown as Promise<
      CanteenTransaction
    >,
  payFromWallet: (data: {
    cardCode?: string;
    nfcUid?: string;
    qrToken?: string;
    amount: number;
    pin?: string;
  }) =>
    apiClient.post<CanteenTransaction>('/api/wallet/pay', data) as unknown as Promise<
      CanteenTransaction
    >,
  setupPin: (data: { pin: string; confirmPin: string }) =>
    apiClient.post<{ message: string; pinSetAt: string }>('/api/wallet/pin/setup', data) as unknown as Promise<{
      message: string;
      pinSetAt: string;
    }>,
  changePin: (data: { currentPin: string; newPin: string; confirmPin: string }) =>
    apiClient.post<{ message: string; pinSetAt: string }>('/api/wallet/pin/change', data) as unknown as Promise<{
      message: string;
      pinSetAt: string;
    }>,
  resetPin: (data: { otpToken: string; newPin: string; confirmPin: string }) =>
    apiClient.post<{ message: string; pinSetAt: string }>('/api/wallet/pin/reset', data) as unknown as Promise<{
      message: string;
      pinSetAt: string;
    }>,
  createVnpayOrder: (data: { amount: number }) =>
    apiClient.post<{ orderId: string; txnRef: string; paymentUrl: string }>('/api/wallet/vnpay/create', data) as unknown as Promise<{
      orderId: string;
      txnRef: string;
      paymentUrl: string;
    }>,
  getVnpayOrder: (txnRef: string) =>
    apiClient.get<{ order: TopupOrder }>(`/api/wallet/vnpay/orders/${txnRef}`) as unknown as Promise<{
      order: TopupOrder;
    }>,
};

// Smart OTP
export const otpService = {
  requestOtp: (data: { purpose: 'RESET_PIN' | 'CHANGE_PIN' | 'STAFF_CASH_CONFIRM'; deviceId?: string }) =>
    apiClient.post<{ message: string; remainingSeconds: number; challengeId: string }>('/api/otp/request', data) as unknown as Promise<{
      message: string;
      remainingSeconds: number;
      challengeId: string;
    }>,
  getActiveOtp: (params?: { purpose?: string }) =>
    apiClient.get<{ challenge: OtpChallenge | null }>('/api/otp/active', { params }) as unknown as Promise<{
      challenge: OtpChallenge | null;
    }>,
  verifyOtp: (data: { purpose: string; code: string; deviceId?: string }) =>
    apiClient.post<{ message: string; otpToken: string; expiresInSeconds: number }>('/api/otp/verify', data) as unknown as Promise<{
      message: string;
      otpToken: string;
      expiresInSeconds: number;
    }>,
};

// Parking
export const parkingService = {
  getActiveSessions: () =>
    apiClient.get<ParkingSession[]>('/api/parking/active') as unknown as Promise<ParkingSession[]>,
  checkIn: (data: {
    cardCode?: string;
    nfcUid?: string;
    qrToken?: string;
    vehiclePlate?: string;
  }) =>
    apiClient.post<ParkingSession>('/api/parking/check-in', data) as unknown as Promise<
      ParkingSession
    >,
  checkOut: (data: { cardCode?: string; nfcUid?: string; qrToken?: string }) =>
    apiClient.post<ParkingSession>('/api/parking/check-out', data) as unknown as Promise<
      ParkingSession
    >,
};

// Room Bookings
export const roomBookingService = {
  getAvailability: (params: { date: string; room: string }) =>
    apiClient.get<Array<{ startTime: string; endTime: string; purpose?: string }>>(
      '/api/rooms/availability',
      { params }
    ) as unknown as Promise<Array<{ startTime: string; endTime: string; purpose?: string }>>,
  getMyBookings: () =>
    apiClient.get<RoomBooking[]>('/api/room-bookings/my') as unknown as Promise<RoomBooking[]>,
  createBooking: (data: {
    room: string;
    date: string;
    startTime: string;
    endTime: string;
    purpose?: string;
  }) =>
    apiClient.post<RoomBooking>('/api/room-bookings', data) as unknown as Promise<RoomBooking>,
  approveBooking: (id: string) =>
    apiClient.patch<RoomBooking>(`/api/room-bookings/${id}/approve`) as unknown as Promise<
      RoomBooking
    >,
  rejectBooking: (id: string) =>
    apiClient.patch<RoomBooking>(`/api/room-bookings/${id}/reject`) as unknown as Promise<
      RoomBooking
    >,
  cancelBooking: (id: string) =>
    apiClient.patch<RoomBooking>(`/api/room-bookings/${id}/cancel`) as unknown as Promise<
      RoomBooking
    >,
};

// Events
export const eventService = {
  getEvents: () => apiClient.get<EventItem[]>('/api/events') as unknown as Promise<EventItem[]>,
  createEvent: (data: {
    title: string;
    description?: string;
    location?: string;
    startAt: string;
    endAt: string;
    capacity: number;
  }) => apiClient.post<EventItem>('/api/events', data) as unknown as Promise<EventItem>,
};

// Schedules
export const scheduleService = {
  getSchedules: (params?: { className?: string }) =>
    apiClient.get<ClassSchedule[]>('/api/schedules', { params }) as unknown as Promise<
      ClassSchedule[]
    >,
  createSchedule: (data: {
    className: string;
    subject: string;
    teacher?: string;
    room?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    semester?: string;
  }) => apiClient.post<ClassSchedule>('/api/schedules', data) as unknown as Promise<ClassSchedule>,
  updateSchedule: (id: string, data: Partial<ClassSchedule>) =>
    apiClient.patch<ClassSchedule>(`/api/schedules/${id}`, data) as unknown as Promise<
      ClassSchedule
    >,
  deleteSchedule: (id: string) => apiClient.delete<{ message: string }>(`/api/schedules/${id}`),

  // Timetable
  getSemesters: () => apiClient.get<Semester[]>('/api/schedule/semesters') as unknown as Promise<Semester[]>,
  createSemester: (data: { code: string; name: string; startDate: string; endDate: string; weeksCount?: number; isCurrent?: boolean }) =>
    apiClient.post<Semester>('/api/schedule/semesters', data) as unknown as Promise<Semester>,
  getSubjects: () => apiClient.get<Subject[]>('/api/schedule/subjects') as unknown as Promise<Subject[]>,
  createSubject: (data: { code: string; name: string; credits?: number; department?: string }) =>
    apiClient.post<Subject>('/api/schedule/subjects', data) as unknown as Promise<Subject>,
  getClasses: () => apiClient.get<SchoolClass[]>('/api/schedule/classes') as unknown as Promise<SchoolClass[]>,
  createClass: (data: { code: string; name: string; homeroomTeacher?: string; academicYear?: string }) =>
    apiClient.post<SchoolClass>('/api/schedule/classes', data) as unknown as Promise<SchoolClass>,
  getClassRoster: (classId: string) =>
    apiClient.get<Array<{ enrollmentId: string; student: User; enrolledAt: string }>>(`/api/schedule/classes/${classId}/students`) as unknown as Promise<Array<{ enrollmentId: string; student: User; enrolledAt: string }>>,
  enrollStudent: (classId: string, studentId: string) =>
    apiClient.post(`/api/schedule/classes/${classId}/students`, { studentId }),
  getScheduleSlots: (params?: { classId?: string; semesterId?: string; week?: number }) =>
    apiClient.get<ScheduleSlot[]>('/api/schedule/slots', { params }) as unknown as Promise<ScheduleSlot[]>,
  createScheduleSlot: (data: {
    classId: string;
    semesterId: string;
    subjectId: string;
    teacherId?: string;
    room: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    weeks?: number[];
  }) => apiClient.post<ScheduleSlot>('/api/schedule/slots', data) as unknown as Promise<ScheduleSlot>,
  deleteScheduleSlot: (id: string) => apiClient.delete<{ message: string }>(`/api/schedule/slots/${id}`),
};

// Notifications
export const notificationService = {
  createNotification: (data: {
    title: string;
    body: string;
    audience: string;
    className?: string;
    receiver?: string;
    priority?: string;
    category?: string;
    actionRoute?: string;
    scheduledAt?: string;
  }) =>
    apiClient.post<NotificationItem>('/api/notifications', data) as unknown as Promise<
      NotificationItem
    >,
  getMyNotifications: (params?: { category?: string; page?: number; limit?: number }) =>
    apiClient.get<NotificationItem[] | { items: NotificationItem[]; total: number }>(
      '/api/notifications/my',
      { params }
    ) as unknown as Promise<any>,
  getUnreadCount: () =>
    apiClient.get<{ count: number }>(
      '/api/notifications/my/unread-count'
    ) as unknown as Promise<{ count: number }>,
  markAsRead: (id: string) =>
    apiClient.patch<NotificationItem>(
      `/api/notifications/${id}/read`
    ) as unknown as Promise<NotificationItem>,
  markAllAsRead: () =>
    apiClient.patch<{ count: number }>(
      '/api/notifications/read-all'
    ) as unknown as Promise<{ count: number }>,
  archiveNotification: (id: string) =>
    apiClient.delete<{ message: string }>(
      `/api/notifications/${id}`
    ) as unknown as Promise<{ message: string }>,
  getPreferences: () =>
    apiClient.get('/api/notifications/preferences') as unknown as Promise<any>,
  updatePreferences: (data: any) =>
    apiClient.put('/api/notifications/preferences', data) as unknown as Promise<any>,
  getSentHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/api/notifications/sent', { params }) as unknown as Promise<any>,
  cancelScheduled: (id: string) =>
    apiClient.delete(`/api/notifications/scheduled/${id}`) as unknown as Promise<any>,
};

// Emergency Profile
export const emergencyService = {
  getMyProfile: () =>
    apiClient.get<EmergencyProfile>('/api/emergency/me') as unknown as Promise<EmergencyProfile>,
  updateMyProfile: (data: Partial<EmergencyProfile>) =>
    apiClient.put<EmergencyProfile>(
      '/api/emergency/me',
      data
    ) as unknown as Promise<EmergencyProfile>,
  rotateQrToken: () =>
    apiClient.post<{ qrToken: string }>(
      '/api/emergency/me/rotate-qr'
    ) as unknown as Promise<{ qrToken: string }>,
  getPublicProfile: (qrToken: string) =>
    apiClient.get<Record<string, any>>(
      `/api/emergency/public/${qrToken}`
    ) as unknown as Promise<Record<string, any>>,
};

// Root Health
export const rootService = {
  checkHealth: () =>
    apiClient.get<{ success: boolean; message: string }>('/') as unknown as Promise<{
      success: boolean;
      message: string;
    }>,
};

// QR Management
export const qrService = {
  getQrCodes: (params: {
    page?: number;
    limit?: number;
    type?: string;
    isActive?: string | boolean;
    search?: string;
  }) =>
    apiClient.get<PaginatedResult<QrCodeItem>>('/api/qr', {
      params,
    }) as unknown as Promise<PaginatedResult<QrCodeItem>>,
  createQrCode: (data: {
    type: string;
    refKind: string;
    refId: string;
    label: string;
    location?: string;
  }) => apiClient.post<QrCodeItem>('/api/qr', data) as unknown as Promise<QrCodeItem>,
  revokeQrCode: (publicId: string) =>
    apiClient.patch<{ message: string; publicId: string }>(
      `/api/qr/${publicId}/revoke`
    ) as unknown as Promise<{ message: string; publicId: string }>,
  regenerateQrCode: (publicId: string) =>
    apiClient.post<QrCodeItem>(
      `/api/qr/${publicId}/regenerate`
    ) as unknown as Promise<QrCodeItem>,
};
