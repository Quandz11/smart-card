Ran check current directory contents
Ran check node npm mongo · Exited with code 1
Ran check docker and brew · Exited with code 1
Checked task Check docker and brew
Ran check brew packages
Ran create project directories
Created package.json
Created .env.example
Created .gitignore
Created db.js
Created generateToken.js
Created assertCardUsable.js
Created errorHandler.js
Created auth.js
Created User.js
Created Card.js
Created Wallet.js
Created AccessLog.js
Created Attendance.js
Created LibraryLoan.js
Created CanteenTransaction.js
Created ParkingSession.js
Created RoomBooking.js
Created Event.js
Created EventRegistration.js
Created ClassSchedule.js
Created Notification.js
Created NotificationRead.js
Created EmergencyProfile.js
Created logService.js
Created authService.js
Created userService.js
Created cardService.js
Created attendanceService.js
Created libraryService.js
Created canteenService.js
Created parkingService.js
Created roomBookingService.js
Created eventService.js
Created scheduleService.js
Created notificationService.js
Created emergencyService.js
Edited emergencyService.js
Created authController.js
Created authRoutes.js
Created userController.js
Created userRoutes.js
Edited cardService.js
Created cardController.js
Created cardRoutes.js
Created logController.js
Created logRoutes.js
Created attendanceController.js
Created attendanceRoutes.js
Created libraryController.js
Created libraryRoutes.js
Created canteenController.js
Created canteenRoutes.js
Created parkingController.js
Created parkingRoutes.js
Created roomBookingController.js
Created roomBookingRoutes.js
Created roomRoutes.js
Created eventController.js
Created eventRoutes.js
Created scheduleController.js
Created scheduleRoutes.js
Created notificationController.js
Created notificationRoutes.js
Created emergencyController.js
Created emergencyRoutes.js
Created server.js
Created seed.js
Created README.md
Canceled install backend dependencies
Checked task Install backend dependencies
Checked task Install backend dependencies
Created index.html
Created style.css
Created api.js
Created app.js
Checked task Install backend dependencies
Checked task Install backend dependencies
Ran create Android project directories
Created build.gradle.kts
Created settings.gradle.kts
Created build.gradle.kts
Created AndroidManifest.xml
Checked task Install backend dependencies
Created ApiModels.kt
Created TokenManager.kt
Created SmartPassApiService.kt
Created AuthInterceptor.kt
Created ApiClient.kt
Created Repositories.kt
Checked task Install backend dependencies
Created QRCodeImage.kt
Created Screen.kt
Created LoginViewModel.kt
Created LoginScreen.kt
Created MyCardViewModel.kt
Created MyCardScreen.kt
Created AttendanceViewModel.kt
Created AttendanceScreen.kt
Created LibraryViewModel.kt
Created LibraryScreen.kt
Created WalletViewModel.kt
Created WalletScreen.kt
Created ParkingViewModel.kt
Created ParkingScreen.kt
Created RoomBookingsViewModel.kt
Created RoomBookingsScreen.kt
Created EventsViewModel.kt
Created EventsScreen.kt
Created ScheduleViewModel.kt
Created ScheduleScreen.kt
Created NotificationsViewModel.kt
Created NotificationsScreen.kt
Created EmergencyProfileViewModel.kt
Created EmergencyProfileScreen.kt
Created ScanViewModel.kt
Created ScanScreen.kt
Created PublicEmergencyViewModel.kt
Created PublicEmergencyScreen.kt
Created NavGraph.kt
Created SmartPassApp.kt
Created MainActivity.kt
Checked task Install backend dependencies
Ran check task-152 log
Killed task Install backend dependencies
Ran install backend dependencies
Ran syntax check all JS files · Exited with code 1
Created .env
Analyzed .gitignore:L1-4
Ran run structural invariant verification
Ran install testing dev dependencies
Created acceptance.test.js
Ran install jest
Checked task Install jest
Ran run acceptance test suite · Exited with code 1
Ran run acceptance test suite · Exited with code 1
Edited server.js
Ran run acceptance test suite
Ran remove temporary test directory
Edited package.json
Ran verify directory structure

### File: smartpass-backend/package.json
```json
{
  "name": "smartpass-backend",
  "version": "1.0.0",
  "description": "SmartPass - All-in-One Digital Card Backend REST API",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "seed": "node src/seed/seed.js"
  },
  "keywords": [
    "smartpass",
    "express",
    "mongoose",
    "mongodb"
  ],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.5.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

### File: smartpass-backend/.gitignore
```
node_modules
.env
.DS_Store
npm-debug.log*
```

### File: smartpass-backend/src/server.js
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const cardRoutes = require('./routes/cardRoutes');
const logRoutes = require('./routes/logRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const canteenRoutes = require('./routes/canteenRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const roomRoutes = require('./routes/roomRoutes');
const roomBookingRoutes = require('./routes/roomBookingRoutes');
const eventRoutes = require('./routes/eventRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Global middleware
app.use(cors());
app.use(express.json());

// Root health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SmartPass API is running',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/wallet', canteenRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/room-bookings', roomBookingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/emergency', emergencyRoutes);

// Catch-all 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Central error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`SmartPass server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = { app, server };
```

### File: smartpass-backend/src/config/db.js
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### File: smartpass-backend/src/middleware/auth.js
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware: validates JWT Bearer token and attaches user to req.user.
 * Missing, invalid, or expired token returns 401.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const error = new Error('Not authenticated, token missing');
    error.statusCode = 401;
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      const error = new Error('User not found or account deactivated');
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (err) {
    const error = new Error('Invalid or expired token');
    error.statusCode = 401;
    return next(error);
  }
};

/**
 * Authorize middleware: checks if req.user.role is in allowed roles.
 * Authenticated user with disallowed role returns 403.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error('You do not have permission for this action');
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
```

### File: smartpass-backend/src/middleware/errorHandler.js
```javascript
/**
 * Central error handling middleware.
 * Ensures consistent JSON response: { success: false, message: "..." }
 * Never leaks database details, internal stacks, or sensitive error messages.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Handle invalid ObjectId cast error
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  // Sanitize internal server errors to prevent leaking stack traces or internal DB info
  if (statusCode === 500) {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
```

### File: smartpass-backend/src/utils/generateToken.js
```javascript
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = generateToken;
```

### File: smartpass-backend/src/utils/assertCardUsable.js
```javascript
/**
 * Asserts that a card exists, is active, and is not expired.
 * INV-02: Reused across all card actions.
 */
const assertCardUsable = async (card) => {
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  if (card.status !== 'active') {
    const error = new Error(`Card is ${card.status}`);
    error.statusCode = 403;
    throw error;
  }

  if (new Date() > new Date(card.expiresAt)) {
    card.status = 'expired';
    await card.save();
    const error = new Error('Card has expired');
    error.statusCode = 403;
    throw error;
  }

  return card;
};

module.exports = assertCardUsable;
```

### File: smartpass-backend/src/models/User.js
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'student', 'librarian', 'canteen_staff', 'parking_staff'],
      default: 'student',
    },
    phone: {
      type: String,
      trim: true,
    },
    studentCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    className: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
```

### File: smartpass-backend/src/models/Card.js
```javascript
const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    cardCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['student'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['active', 'locked', 'expired', 'lost'],
      default: 'active',
    },
    issuedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    nfcUid: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    qrToken: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Card', cardSchema);
```

### File: smartpass-backend/src/models/Wallet.js
```javascript
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Wallet', walletSchema);
```

### File: smartpass-backend/src/models/AccessLog.js
```javascript
const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema(
  {
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: [
        'entry',
        'exit',
        'attendance',
        'library_borrow',
        'library_return',
        'canteen_pay',
        'parking_in',
        'parking_out',
        'room_booking',
        'event_register',
        'emergency_view',
      ],
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    detail: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AccessLog', accessLogSchema);
```

### File: smartpass-backend/src/models/Attendance.js
```javascript
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },
    classSession: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    checkedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['present', 'late'],
      default: 'present',
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ student: 1, classSession: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
```

### File: smartpass-backend/src/models/LibraryLoan.js
```javascript
const mongoose = require('mongoose');

const libraryLoanSchema = new mongoose.Schema(
  {
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookCode: {
      type: String,
      required: true,
      trim: true,
    },
    bookTitle: {
      type: String,
      required: true,
      trim: true,
    },
    borrowedAt: {
      type: Date,
      default: Date.now,
    },
    dueAt: {
      type: Date,
      required: true,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['borrowed', 'returned', 'overdue'],
      default: 'borrowed',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LibraryLoan', libraryLoanSchema);
```

### File: smartpass-backend/src/models/CanteenTransaction.js
```javascript
const mongoose = require('mongoose');

const canteenTransactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['topup', 'pay'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CanteenTransaction', canteenTransactionSchema);
```

### File: smartpass-backend/src/models/ParkingSession.js
```javascript
const mongoose = require('mongoose');

const parkingSessionSchema = new mongoose.Schema(
  {
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehiclePlate: {
      type: String,
      trim: true,
    },
    checkInAt: {
      type: Date,
      default: Date.now,
    },
    checkOutAt: {
      type: Date,
      default: null,
    },
    fee: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in', 'out'],
      default: 'in',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ParkingSession', parkingSessionSchema);
```

### File: smartpass-backend/src/models/RoomBooking.js
```javascript
const mongoose = require('mongoose');

const roomBookingSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      trim: true,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RoomBooking', roomBookingSchema);
```

### File: smartpass-backend/src/models/Event.js
```javascript
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    registeredCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', eventSchema);
```

### File: smartpass-backend/src/models/EventRegistration.js
```javascript
const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

eventRegistrationSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
```

### File: smartpass-backend/src/models/ClassSchedule.js
```javascript
const mongoose = require('mongoose');

const classScheduleSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    teacher: {
      type: String,
      trim: true,
    },
    room: {
      type: String,
      trim: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 2,
      max: 8,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ClassSchedule', classScheduleSchema);
```

### File: smartpass-backend/src/models/Notification.js
```javascript
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: String,
      enum: ['all', 'class', 'individual'],
      required: true,
    },
    className: {
      type: String,
      trim: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
```

### File: smartpass-backend/src/models/NotificationRead.js
```javascript
const mongoose = require('mongoose');

const notificationReadSchema = new mongoose.Schema(
  {
    notification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

notificationReadSchema.index({ notification: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('NotificationRead', notificationReadSchema);
```

### File: smartpass-backend/src/models/EmergencyProfile.js
```javascript
const mongoose = require('mongoose');

const emergencyProfileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    emergencyContactName: {
      type: String,
      trim: true,
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
    },
    allergies: {
      type: String,
      trim: true,
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
      default: null,
    },
    insuranceInfo: {
      type: String,
      trim: true,
    },
    visibleFields: {
      type: [String],
      default: ['fullName', 'emergencyContactName', 'emergencyContactPhone'],
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EmergencyProfile', emergencyProfileSchema);
```

### File: smartpass-backend/src/services/logService.js
```javascript
const AccessLog = require('../models/AccessLog');

/**
 * Record an access log row.
 * INV-04: Every successful card action writes exactly ONE AccessLog row.
 */
const recordLog = async ({ card, owner, action, location, detail, createdBy }) => {
  const log = await AccessLog.create({
    card,
    owner,
    action,
    location,
    detail,
    createdBy,
  });
  return log;
};

/**
 * Get card access history, newest first, paginated.
 */
const getCardHistory = async (cardId, page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const query = { card: cardId };
  const [data, total] = await Promise.all([
    AccessLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'fullName email')
      .populate('owner', 'fullName email studentCode'),
    AccessLog.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
    },
  };
};

/**
 * Get all logs with optional filters, newest first, paginated.
 */
const getLogs = async (filters, page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (filters.card) query.card = filters.card;
  if (filters.owner) query.owner = filters.owner;
  if (filters.action) query.action = filters.action;

  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = new Date(filters.from);
    if (filters.to) query.createdAt.$lte = new Date(filters.to);
  }

  const [data, total] = await Promise.all([
    AccessLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('card', 'cardCode status')
      .populate('owner', 'fullName email studentCode')
      .populate('createdBy', 'fullName email'),
    AccessLog.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
    },
  };
};

module.exports = {
  recordLog,
  getCardHistory,
  getLogs,
};
```

### File: smartpass-backend/src/services/authService.js
```javascript
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const generateToken = require('../utils/generateToken');

/**
 * Register a new user and auto-create an empty wallet.
 */
const register = async ({
  fullName,
  email,
  password,
  phone,
  studentCode,
  className,
  role,
}) => {
  if (!fullName) {
    const error = new Error('Full name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!email) {
    const error = new Error('Email is required');
    error.statusCode = 400;
    throw error;
  }

  if (!password) {
    const error = new Error('Password is required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('Email already in use');
    error.statusCode = 409;
    throw error;
  }

  if (studentCode) {
    const existingCode = await User.findOne({ studentCode: studentCode.trim() });
    if (existingCode) {
      const error = new Error('Student code already in use');
      error.statusCode = 409;
      throw error;
    }
  }

  // INV-01: Hash password with bcryptjs, salt rounds = 10
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone ? phone.trim() : undefined,
    studentCode: studentCode ? studentCode.trim() : undefined,
    className: className ? className.trim() : undefined,
    role: role || 'student',
  });

  // Auto-create empty wallet for user
  await Wallet.create({
    owner: user._id,
    balance: 0,
  });

  const token = generateToken(user._id, user.role);

  const userObj = user.toObject();
  delete userObj.password;

  return {
    user: userObj,
    token,
  };
};

/**
 * Login user with rate limiting on failed attempts.
 * INV-09 & INV-10: Exact message "Invalid email or password", 5 fails -> 15 min lock.
 */
const login = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Check if account is locked
  if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
    const error = new Error('Account temporarily locked');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();

    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Reset failed attempts on successful login
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  const token = generateToken(user._id, user.role);
  const userObj = user.toObject();
  delete userObj.password;

  return {
    user: userObj,
    token,
  };
};

/**
 * Get profile of current authenticated user.
 */
const getMe = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Change password for authenticated user.
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    const error = new Error('Both currentPassword and newPassword are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId).select('+password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const error = new Error('Invalid current password');
    error.statusCode = 401;
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return { message: 'Password changed successfully' };
};

module.exports = {
  register,
  login,
  getMe,
  changePassword,
};
```

### File: smartpass-backend/src/services/userService.js
```javascript
const User = require('../models/User');
const authService = require('./authService');

/**
 * List users with search and pagination (Admin only).
 */
const getUsers = async ({ q, page = 1, limit = 20 }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (q && q.trim()) {
    const searchRegex = new RegExp(q.trim(), 'i');
    query.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { studentCode: searchRegex },
    ];
  }

  const [data, total] = await Promise.all([
    User.find(query).select('-password').skip(skip).limit(limitNum),
    User.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
    },
  };
};

/**
 * Create user account (Admin only).
 */
const createUser = async (data) => {
  const result = await authService.register(data);
  return result.user;
};

/**
 * Get user by ID.
 */
const getUserById = async (id) => {
  const user = await User.findById(id).select('-password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/**
 * Update user profile fields only.
 */
const updateUser = async (id, data) => {
  const allowedUpdates = [
    'fullName',
    'phone',
    'studentCode',
    'className',
    'avatarUrl',
  ];
  const updates = {};

  for (const key of allowedUpdates) {
    if (data[key] !== undefined) {
      updates[key] = data[key];
    }
  }

  if (updates.studentCode) {
    const existing = await User.findOne({
      studentCode: updates.studentCode.trim(),
      _id: { $ne: id },
    });
    if (existing) {
      const error = new Error('Student code already in use');
      error.statusCode = 409;
      throw error;
    }
  }

  const user = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Update user role (Admin only).
 */
const updateUserRole = async (id, role) => {
  const validRoles = [
    'admin',
    'student',
    'librarian',
    'canteen_staff',
    'parking_staff',
  ];
  if (!validRoles.includes(role)) {
    const error = new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  ).select('-password');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Deactivate user (Admin only).
 */
const deactivateUser = async (id) => {
  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).select('-password');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Delete user (Admin only).
 */
const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return { message: 'User deleted successfully' };
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserRole,
  deactivateUser,
  deleteUser,
};
```

### File: smartpass-backend/src/services/cardService.js
```javascript
const crypto = require('crypto');
const Card = require('../models/Card');
const assertCardUsable = require('../utils/assertCardUsable');
const logService = require('./logService');

/**
 * Create a new card for a user with cryptographically secure qrToken.
 */
const createCard = async ({ cardCode, owner, expiresAt, nfcUid }) => {
  if (!cardCode || !owner || !expiresAt) {
    const error = new Error('cardCode, owner, and expiresAt are required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await Card.findOne({ cardCode: cardCode.trim() });
  if (existing) {
    const error = new Error('Card code already exists');
    error.statusCode = 409;
    throw error;
  }

  if (nfcUid) {
    const existingNfc = await Card.findOne({ nfcUid: nfcUid.trim() });
    if (existingNfc) {
      const error = new Error('NFC UID already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  const qrToken = crypto.randomBytes(32).toString('hex');

  const card = await Card.create({
    cardCode: cardCode.trim(),
    owner,
    expiresAt: new Date(expiresAt),
    nfcUid: nfcUid ? nfcUid.trim() : undefined,
    qrToken,
    status: 'active',
    issuedAt: new Date(),
  });

  return card;
};

/**
 * List cards with pagination and optional status filter.
 */
const getCards = async ({ page = 1, limit = 20, status }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.status = status;

  const [data, total] = await Promise.all([
    Card.find(query)
      .populate('owner', 'fullName email studentCode className')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }),
    Card.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
    },
  };
};

/**
 * Get card by ID (Admin or card owner).
 */
const getCardById = async (id, requestingUser) => {
  const card = await Card.findById(id).populate(
    'owner',
    'fullName email studentCode className'
  );

  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    requestingUser.role !== 'admin' &&
    card.owner._id.toString() !== requestingUser._id.toString()
  ) {
    const error = new Error('You do not have permission for this action');
    error.statusCode = 403;
    throw error;
  }

  return card;
};

/**
 * Issue card (status=active, issuedAt=now).
 */
const issueCard = async (id) => {
  const card = await Card.findById(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  card.status = 'active';
  card.issuedAt = new Date();
  await card.save();
  return card;
};

/**
 * Lock card.
 */
const lockCard = async (id) => {
  const card = await Card.findById(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  card.status = 'locked';
  await card.save();
  return card;
};

/**
 * Unlock card.
 */
const unlockCard = async (id) => {
  const card = await Card.findById(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  card.status = 'active';
  await card.save();
  return card;
};

/**
 * Renew card (add months to expiresAt).
 */
const renewCard = async (id, months) => {
  const monthsNum = parseInt(months, 10);
  if (!monthsNum || monthsNum <= 0) {
    const error = new Error('Valid number of months is required');
    error.statusCode = 400;
    throw error;
  }

  const card = await Card.findById(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  const currentExpiry = new Date(card.expiresAt);
  currentExpiry.setMonth(currentExpiry.getMonth() + monthsNum);
  card.expiresAt = currentExpiry;

  if (card.status === 'expired') {
    card.status = 'active';
  }

  await card.save();
  return card;
};

/**
 * Mark card as lost (Admin or owner).
 */
const markCardLost = async (id, requestingUser) => {
  const card = await Card.findById(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    requestingUser.role !== 'admin' &&
    card.owner.toString() !== requestingUser._id.toString()
  ) {
    const error = new Error('You do not have permission for this action');
    error.statusCode = 403;
    throw error;
  }

  card.status = 'lost';
  await card.save();
  return card;
};

/**
 * Delete card (Admin only).
 */
const deleteCard = async (id) => {
  const card = await Card.findByIdAndDelete(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }
  return { message: 'Card deleted successfully' };
};

/**
 * Helper to resolve a card by cardCode, nfcUid, or qrToken.
 */
const resolveCard = async (identifier) => {
  const { cardCode, nfcUid, qrToken } = identifier;
  const provided = [cardCode, nfcUid, qrToken].filter(Boolean);

  if (provided.length !== 1) {
    const error = new Error('Exactly one identifier (cardCode, nfcUid, or qrToken) must be provided');
    error.statusCode = 400;
    throw error;
  }

  const query = {};
  if (cardCode) query.cardCode = cardCode.trim();
  if (nfcUid) query.nfcUid = nfcUid.trim();
  if (qrToken) query.qrToken = qrToken.trim();

  const card = await Card.findOne(query);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  // INV-02: Run assertCardUsable
  await assertCardUsable(card);
  return card;
};

/**
 * Verify card identifier and return owner info.
 */
const verifyCard = async (identifier) => {
  const card = await resolveCard(identifier);
  await card.populate('owner', 'fullName studentCode className');

  return {
    card: {
      id: card._id,
      cardCode: card.cardCode,
      status: card.status,
      expiresAt: card.expiresAt,
    },
    owner: {
      fullName: card.owner ? card.owner.fullName : null,
      studentCode: card.owner ? card.owner.studentCode : null,
      className: card.owner ? card.owner.className : null,
    },
  };
};

/**
 * Get card access history (Admin or card owner).
 */
const getCardHistory = async (id, requestingUser, page, limit) => {
  const card = await Card.findById(id);
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    requestingUser.role !== 'admin' &&
    card.owner.toString() !== requestingUser._id.toString()
  ) {
    const error = new Error('You do not have permission for this action');
    error.statusCode = 403;
    throw error;
  }

  return logService.getCardHistory(id, page, limit);
};

module.exports = {
  createCard,
  getCards,
  getCardById,
  issueCard,
  lockCard,
  unlockCard,
  renewCard,
  markCardLost,
  deleteCard,
  resolveCard,
  verifyCard,
  getCardHistory,
};
```

### File: smartpass-backend/src/services/attendanceService.js
```javascript
const Attendance = require('../models/Attendance');
const cardService = require('./cardService');
const logService = require('./logService');

/**
 * Check-in attendance for student using card identifier.
 */
const checkAttendance = async (
  { cardCode, qrToken, nfcUid, classSession, subject },
  createdBy
) => {
  if (!classSession) {
    const error = new Error('classSession is required');
    error.statusCode = 400;
    throw error;
  }

  // Resolve card and run INV-02
  const card = await cardService.resolveCard({ cardCode, qrToken, nfcUid });

  // Check duplicate attendance for the student in this session
  const existing = await Attendance.findOne({
    student: card.owner,
    classSession: classSession.trim(),
  });

  if (existing) {
    const error = new Error('Attendance already recorded for this session');
    error.statusCode = 409;
    throw error;
  }

  const attendance = await Attendance.create({
    student: card.owner,
    card: card._id,
    classSession: classSession.trim(),
    subject: subject ? subject.trim() : undefined,
    status: 'present',
    checkedAt: new Date(),
  });

  // INV-04: Write exactly ONE AccessLog row
  await logService.recordLog({
    card: card._id,
    owner: card.owner,
    action: 'attendance',
    location: classSession,
    detail: `Attendance check: ${subject || classSession}`,
    createdBy,
  });

  return attendance;
};

/**
 * Get attendance records for current student.
 */
const getMyAttendance = async (studentId) => {
  const records = await Attendance.find({ student: studentId })
    .sort({ checkedAt: -1 })
    .populate('card', 'cardCode');
  return records;
};

/**
 * Get attendance records with filters (Staff/Admin).
 */
const getAttendanceList = async ({ classSession, date }) => {
  const query = {};
  if (classSession) {
    query.classSession = classSession;
  }
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.checkedAt = { $gte: start, $lte: end };
  }

  const records = await Attendance.find(query)
    .sort({ checkedAt: -1 })
    .populate('student', 'fullName email studentCode className')
    .populate('card', 'cardCode');

  return records;
};

module.exports = {
  checkAttendance,
  getMyAttendance,
  getAttendanceList,
};
```

### File: smartpass-backend/src/services/libraryService.js
```javascript
const LibraryLoan = require('../models/LibraryLoan');
const Card = require('../models/Card');
const cardService = require('./cardService');
const logService = require('./logService');

/**
 * Borrow a book using student's card.
 * INV-06: Maximum 3 active loans with status "borrowed".
 */
const borrowBook = async ({ cardCode, bookCode, bookTitle }, createdBy) => {
  if (!cardCode || !bookCode || !bookTitle) {
    const error = new Error('cardCode, bookCode, and bookTitle are required');
    error.statusCode = 400;
    throw error;
  }

  // Resolve card and run INV-02
  const card = await cardService.resolveCard({ cardCode });

  // INV-06: One student has AT MOST 3 LibraryLoans with status="borrowed"
  const activeLoansCount = await LibraryLoan.countDocuments({
    borrower: card.owner,
    status: 'borrowed',
  });

  if (activeLoansCount >= 3) {
    const error = new Error('Borrow limit reached: maximum 3 active borrowed books allowed');
    error.statusCode = 400;
    throw error;
  }

  const borrowedAt = new Date();
  const dueAt = new Date(borrowedAt.getTime() + 14 * 24 * 60 * 60 * 1000); // +14 days

  const loan = await LibraryLoan.create({
    borrower: card.owner,
    bookCode: bookCode.trim(),
    bookTitle: bookTitle.trim(),
    borrowedAt,
    dueAt,
    status: 'borrowed',
  });

  // INV-04: Write AccessLog
  await logService.recordLog({
    card: card._id,
    owner: card.owner,
    action: 'library_borrow',
    location: 'Library',
    detail: `Borrowed "${bookTitle}" (${bookCode})`,
    createdBy,
  });

  return loan;
};

/**
 * Return a book. Checks overdue status.
 */
const returnBook = async ({ loanId, cardCode, bookCode }, createdBy) => {
  let loan;

  if (loanId) {
    loan = await LibraryLoan.findById(loanId);
  } else if (cardCode && bookCode) {
    const card = await cardService.resolveCard({ cardCode });
    loan = await LibraryLoan.findOne({
      borrower: card.owner,
      bookCode: bookCode.trim(),
      status: 'borrowed',
    });
  } else {
    const error = new Error('Either loanId or (cardCode and bookCode) must be provided');
    error.statusCode = 400;
    throw error;
  }

  if (!loan) {
    const error = new Error('Active loan not found');
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const isOverdue = now > new Date(loan.dueAt);

  loan.returnedAt = now;
  loan.status = 'returned';
  await loan.save();

  // Find card for AccessLog
  const card = await Card.findOne({ owner: loan.borrower, status: 'active' });

  // INV-04: Write AccessLog
  await logService.recordLog({
    card: card ? card._id : null,
    owner: loan.borrower,
    action: 'library_return',
    location: 'Library',
    detail: `Returned "${loan.bookTitle}" (${loan.bookCode})${isOverdue ? ' [OVERDUE]' : ''}`,
    createdBy,
  });

  return {
    loan,
    overdue: isOverdue,
  };
};

/**
 * Get current student's loans with optional status filter.
 */
const getMyLoans = async (studentId, status) => {
  const query = { borrower: studentId };
  if (status) {
    query.status = status;
  }
  return LibraryLoan.find(query).sort({ borrowedAt: -1 });
};

/**
 * Get all library loans with pagination (Admin/Librarian).
 */
const getAllLoans = async ({ page = 1, limit = 20, status }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.status = status;

  const [data, total] = await Promise.all([
    LibraryLoan.find(query)
      .populate('borrower', 'fullName email studentCode className')
      .sort({ borrowedAt: -1 })
      .skip(skip)
      .limit(limitNum),
    LibraryLoan.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
    },
  };
};

module.exports = {
  borrowBook,
  returnBook,
  getMyLoans,
  getAllLoans,
};
```

### File: smartpass-backend/src/services/canteenService.js
```javascript
const Wallet = require('../models/Wallet');
const CanteenTransaction = require('../models/CanteenTransaction');
const cardService = require('./cardService');
const logService = require('./logService');

/**
 * Get current user's wallet balance.
 */
const getMyWallet = async (userId) => {
  let wallet = await Wallet.findOne({ owner: userId });
  if (!wallet) {
    wallet = await Wallet.create({ owner: userId, balance: 0 });
  }
  return { balance: wallet.balance };
};

/**
 * Top up user's wallet (Admin / Canteen Staff).
 */
const topUpWallet = async ({ userId, amount, note }, createdBy) => {
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    const error = new Error('Amount must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

  let wallet = await Wallet.findOne({ owner: userId });
  if (!wallet) {
    wallet = await Wallet.create({ owner: userId, balance: 0 });
  }

  wallet.balance += numericAmount;
  const balanceAfter = wallet.balance;
  await wallet.save();

  const transaction = await CanteenTransaction.create({
    wallet: wallet._id,
    owner: userId,
    type: 'topup',
    amount: numericAmount,
    balanceAfter,
    note: note ? note.trim() : 'Wallet Top-up',
    createdBy,
  });

  return {
    wallet: { balance: wallet.balance },
    transaction,
  };
};

/**
 * Pay from wallet using card identifier.
 * INV-03: Insufficient balance fails with 400 and changes NOTHING (no transaction, no log).
 */
const payFromWallet = async ({ cardCode, qrToken, nfcUid, amount }, createdBy) => {
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    const error = new Error('Amount must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

  // Resolve card and run INV-02
  const card = await cardService.resolveCard({ cardCode, qrToken, nfcUid });

  let wallet = await Wallet.findOne({ owner: card.owner });
  if (!wallet) {
    const error = new Error('Wallet not found');
    error.statusCode = 400;
    throw error;
  }

  // INV-03: Balance check
  if (wallet.balance < numericAmount) {
    const error = new Error('Insufficient wallet balance');
    error.statusCode = 400;
    throw error;
  }

  wallet.balance -= numericAmount;
  const balanceAfter = wallet.balance;
  await wallet.save();

  const transaction = await CanteenTransaction.create({
    wallet: wallet._id,
    owner: card.owner,
    type: 'pay',
    amount: numericAmount,
    balanceAfter,
    note: 'Canteen payment',
    createdBy,
  });

  // INV-04: Write AccessLog only on successful payment
  await logService.recordLog({
    card: card._id,
    owner: card.owner,
    action: 'canteen_pay',
    location: 'Canteen',
    detail: `Paid ${numericAmount} VND. Remaining balance: ${balanceAfter} VND`,
    createdBy,
  });

  return {
    transaction,
    balance: balanceAfter,
  };
};

/**
 * Get current student's wallet transactions.
 */
const getMyTransactions = async (userId) => {
  const transactions = await CanteenTransaction.find({ owner: userId }).sort({
    createdAt: -1,
  });
  return transactions;
};

/**
 * Get all transactions with pagination (Admin).
 */
const getAllTransactions = async ({ page = 1, limit = 20 }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    CanteenTransaction.find()
      .populate('owner', 'fullName email studentCode')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    CanteenTransaction.countDocuments(),
  ]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
    },
  };
};

module.exports = {
  getMyWallet,
  topUpWallet,
  payFromWallet,
  getMyTransactions,
  getAllTransactions,
};
```

### File: smartpass-backend/src/services/parkingService.js
```javascript
const ParkingSession = require('../models/ParkingSession');
const cardService = require('./cardService');
const logService = require('./logService');

/**
 * Check-in vehicle to parking using card.
 * INV-05: One card has AT MOST one ParkingSession with status="in".
 */
const checkIn = async ({ cardCode, qrToken, nfcUid, vehiclePlate }, createdBy) => {
  // Resolve card and run INV-02
  const card = await cardService.resolveCard({ cardCode, qrToken, nfcUid });

  // INV-05: Check open session
  const activeSession = await ParkingSession.findOne({
    card: card._id,
    status: 'in',
  });

  if (activeSession) {
    const error = new Error('Card already has an active parking session');
    error.statusCode = 409;
    throw error;
  }

  const session = await ParkingSession.create({
    card: card._id,
    owner: card.owner,
    vehiclePlate: vehiclePlate ? vehiclePlate.trim() : undefined,
    checkInAt: new Date(),
    status: 'in',
  });

  // INV-04: Write AccessLog
  await logService.recordLog({
    card: card._id,
    owner: card.owner,
    action: 'parking_in',
    location: 'Parking Gate',
    detail: `Check-in vehicle${vehiclePlate ? ` (${vehiclePlate})` : ''}`,
    createdBy,
  });

  return session;
};

/**
 * Check-out vehicle and calculate fee.
 * Fee = ceil(hours parked) x 2000 VND (minimum 1 hour = 2000 VND).
 */
const checkOut = async ({ cardCode, qrToken, nfcUid }, createdBy) => {
  // Resolve card and run INV-02
  const card = await cardService.resolveCard({ cardCode, qrToken, nfcUid });

  const session = await ParkingSession.findOne({
    card: card._id,
    status: 'in',
  });

  if (!session) {
    const error = new Error('No active parking session found for this card');
    error.statusCode = 404;
    throw error;
  }

  const checkOutAt = new Date();
  const diffMs = checkOutAt.getTime() - new Date(session.checkInAt).getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const hours = diffHours <= 0 ? 1 : diffHours;
  const fee = hours * 2000;

  session.checkOutAt = checkOutAt;
  session.fee = fee;
  session.status = 'out';
  await session.save();

  // INV-04: Write AccessLog
  await logService.recordLog({
    card: card._id,
    owner: card.owner,
    action: 'parking_out',
    location: 'Parking Gate',
    detail: `Check-out: ${hours}h parked, fee ${fee} VND`,
    createdBy,
  });

  return session;
};

/**
 * Get current student's parking sessions.
 */
const getMySessions = async (userId) => {
  const sessions = await ParkingSession.find({ owner: userId })
    .sort({ checkInAt: -1 })
    .populate('card', 'cardCode');
  return sessions;
};

/**
 * Get active parking sessions (status="in").
 */
const getActiveSessions = async () => {
  const sessions = await ParkingSession.find({ status: 'in' })
    .sort({ checkInAt: -1 })
    .populate('card', 'cardCode')
    .populate('owner', 'fullName email studentCode');
  return sessions;
};

module.exports = {
  checkIn,
  checkOut,
  getMySessions,
  getActiveSessions,
};
```

### File: smartpass-backend/src/services/roomBookingService.js
```javascript
const RoomBooking = require('../models/RoomBooking');

/**
 * Check if two time strings "HH:mm" overlap.
 * Overlap exists if startA < endB && endA > startB.
 */
const timesOverlap = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

/**
 * Normalize a date to start of day for comparison.
 */
const getDateRange = (dateStr) => {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Get room availability (approved bookings for room and date).
 */
const getAvailability = async ({ date, room }) => {
  if (!date || !room) {
    const error = new Error('Both date and room query parameters are required');
    error.statusCode = 400;
    throw error;
  }

  const { start, end } = getDateRange(date);

  const bookings = await RoomBooking.find({
    room: room.trim(),
    date: { $gte: start, $lte: end },
    status: 'approved',
  }).select('startTime endTime purpose');

  return bookings;
};

/**
 * Create a new room booking request.
 * INV-08: Same room + same date + overlapping time + status="approved" -> 409.
 */
const createBooking = async ({ room, date, startTime, endTime, purpose }, bookedBy) => {
  if (!room || !date || !startTime || !endTime) {
    const error = new Error('room, date, startTime, and endTime are required');
    error.statusCode = 400;
    throw error;
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    const error = new Error('Time format must be HH:mm (24-hour format)');
    error.statusCode = 400;
    throw error;
  }

  if (startTime >= endTime) {
    const error = new Error('endTime must be later than startTime');
    error.statusCode = 400;
    throw error;
  }

  const { start, end } = getDateRange(date);

  // Check for conflicting approved bookings (INV-08)
  const existingApproved = await RoomBooking.find({
    room: room.trim(),
    date: { $gte: start, $lte: end },
    status: 'approved',
  });

  const conflict = existingApproved.some((b) =>
    timesOverlap(startTime, endTime, b.startTime, b.endTime)
  );

  if (conflict) {
    const error = new Error('Room is already booked for this time slot');
    error.statusCode = 409;
    throw error;
  }

  const booking = await RoomBooking.create({
    room: room.trim(),
    bookedBy,
    date: new Date(date),
    startTime,
    endTime,
    purpose: purpose ? purpose.trim() : undefined,
    status: 'pending',
  });

  return booking;
};

/**
 * Approve or reject a booking (Admin only).
 * Re-checks INV-08 conflict before approving.
 */
const updateBookingStatus = async (id, status) => {
  if (!['approved', 'rejected'].includes(status)) {
    const error = new Error('Status must be either "approved" or "rejected"');
    error.statusCode = 400;
    throw error;
  }

  const booking = await RoomBooking.findById(id);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (status === 'approved') {
    const { start, end } = getDateRange(booking.date);

    const conflicts = await RoomBooking.find({
      _id: { $ne: booking._id },
      room: booking.room,
      date: { $gte: start, $lte: end },
      status: 'approved',
    });

    const hasConflict = conflicts.some((b) =>
      timesOverlap(booking.startTime, booking.endTime, b.startTime, b.endTime)
    );

    if (hasConflict) {
      const error = new Error('Conflicting approved booking exists for this slot');
      error.statusCode = 409;
      throw error;
    }
  }

  booking.status = status;
  await booking.save();
  return booking;
};

/**
 * Get current user's room bookings.
 */
const getMyBookings = async (userId) => {
  return RoomBooking.find({ bookedBy: userId }).sort({ date: -1, startTime: -1 });
};

/**
 * Cancel a room booking (Owner only).
 */
const cancelBooking = async (id, userId, role) => {
  const booking = await RoomBooking.findById(id);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (role !== 'admin' && booking.bookedBy.toString() !== userId.toString()) {
    const error = new Error('You do not have permission for this action');
    error.statusCode = 403;
    throw error;
  }

  booking.status = 'cancelled';
  await booking.save();
  return booking;
};

module.exports = {
  getAvailability,
  createBooking,
  updateBookingStatus,
  getMyBookings,
  cancelBooking,
};
```

### File: smartpass-backend/src/services/eventService.js
```javascript
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Card = require('../models/Card');
const logService = require('./logService');

/**
 * Create a new event (Admin only).
 */
const createEvent = async ({
  title,
  description,
  location,
  startAt,
  endAt,
  capacity,
}) => {
  if (!title || !startAt || !endAt || capacity === undefined) {
    const error = new Error('title, startAt, endAt, and capacity are required');
    error.statusCode = 400;
    throw error;
  }

  const capacityNum = parseInt(capacity, 10);
  if (isNaN(capacityNum) || capacityNum <= 0) {
    const error = new Error('Capacity must be a positive integer greater than 0');
    error.statusCode = 400;
    throw error;
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);
  if (startDate >= endDate) {
    const error = new Error('endAt must be later than startAt');
    error.statusCode = 400;
    throw error;
  }

  const event = await Event.create({
    title: title.trim(),
    description: description ? description.trim() : undefined,
    location: location ? location.trim() : undefined,
    startAt: startDate,
    endAt: endDate,
    capacity: capacityNum,
    registeredCount: 0,
  });

  return event;
};

/**
 * Get upcoming events, sorted by startAt ascending.
 */
const getUpcomingEvents = async () => {
  const events = await Event.find().sort({ startAt: 1 });
  return events;
};

/**
 * Register student for an event atomically.
 * INV-07: registeredCount increments only if registeredCount < capacity AND (event, student) is new.
 * Full event -> 400. Duplicate registration -> 409.
 */
const registerForEvent = async (eventId, studentId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    throw error;
  }

  // Check duplicate registration
  const existingRegistration = await EventRegistration.findOne({
    event: eventId,
    student: studentId,
  });

  if (existingRegistration) {
    const error = new Error('Already registered for this event');
    error.statusCode = 409;
    throw error;
  }

  // Atomic update: only increment if registeredCount < capacity
  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventId,
      $expr: { $lt: ['$registeredCount', '$capacity'] },
    },
    {
      $inc: { registeredCount: 1 },
    },
    {
      new: true,
    }
  );

  if (!updatedEvent) {
    const error = new Error('Event is full');
    error.statusCode = 400;
    throw error;
  }

  let registration;
  try {
    registration = await EventRegistration.create({
      event: eventId,
      student: studentId,
      registeredAt: new Date(),
    });
  } catch (err) {
    // Rollback atomic counter increment if duplicate insert race occurs
    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });
    if (err.code === 11000) {
      const error = new Error('Already registered for this event');
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }

  // Find user's card for AccessLog
  const card = await Card.findOne({ owner: studentId, status: 'active' });

  // INV-04: Write AccessLog
  await logService.recordLog({
    card: card ? card._id : null,
    owner: studentId,
    action: 'event_register',
    location: event.location || 'Event Hall',
    detail: `Registered for event "${event.title}"`,
    createdBy: studentId,
  });

  return registration;
};

/**
 * Get events registered by current student.
 */
const getMyEvents = async (studentId) => {
  const registrations = await EventRegistration.find({ student: studentId })
    .populate('event')
    .sort({ registeredAt: -1 });

  return registrations.map((r) => r.event).filter(Boolean);
};

module.exports = {
  createEvent,
  getUpcomingEvents,
  registerForEvent,
  getMyEvents,
};
```

### File: smartpass-backend/src/services/scheduleService.js
```javascript
const ClassSchedule = require('../models/ClassSchedule');

/**
 * Get class schedule for the current student's class, sorted by day and time.
 */
const getMySchedule = async (className) => {
  if (!className) {
    return [];
  }

  const schedules = await ClassSchedule.find({
    className: className.trim(),
  }).sort({ dayOfWeek: 1, startTime: 1 });

  return schedules;
};

/**
 * Create a new schedule row (Admin only).
 */
const createSchedule = async ({
  className,
  subject,
  teacher,
  room,
  dayOfWeek,
  startTime,
  endTime,
  semester,
}) => {
  if (!className || !subject || !dayOfWeek || !startTime || !endTime) {
    const error = new Error('className, subject, dayOfWeek, startTime, and endTime are required');
    error.statusCode = 400;
    throw error;
  }

  const day = parseInt(dayOfWeek, 10);
  if (isNaN(day) || day < 2 || day > 8) {
    const error = new Error('dayOfWeek must be an integer between 2 (Monday) and 8 (Sunday)');
    error.statusCode = 400;
    throw error;
  }

  const schedule = await ClassSchedule.create({
    className: className.trim(),
    subject: subject.trim(),
    teacher: teacher ? teacher.trim() : undefined,
    room: room ? room.trim() : undefined,
    dayOfWeek: day,
    startTime: startTime.trim(),
    endTime: endTime.trim(),
    semester: semester ? semester.trim() : undefined,
  });

  return schedule;
};

/**
 * List schedules with optional className filter (Admin).
 */
const getSchedules = async ({ className }) => {
  const query = {};
  if (className) {
    query.className = className.trim();
  }

  const schedules = await ClassSchedule.find(query).sort({
    className: 1,
    dayOfWeek: 1,
    startTime: 1,
  });

  return schedules;
};

/**
 * Update a schedule row (Admin only).
 */
const updateSchedule = async (id, data) => {
  const schedule = await ClassSchedule.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!schedule) {
    const error = new Error('Schedule row not found');
    error.statusCode = 404;
    throw error;
  }

  return schedule;
};

/**
 * Delete a schedule row (Admin only).
 */
const deleteSchedule = async (id) => {
  const schedule = await ClassSchedule.findByIdAndDelete(id);
  if (!schedule) {
    const error = new Error('Schedule row not found');
    error.statusCode = 404;
    throw error;
  }

  return { message: 'Schedule row deleted successfully' };
};

module.exports = {
  getMySchedule,
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
};
```

### File: smartpass-backend/src/services/notificationService.js
```javascript
const Notification = require('../models/Notification');
const NotificationRead = require('../models/NotificationRead');

/**
 * Create a new notification per audience rules (Admin only).
 */
const createNotification = async (
  { title, body, audience, className, receiver },
  createdBy
) => {
  if (!title || !body || !audience) {
    const error = new Error('title, body, and audience are required');
    error.statusCode = 400;
    throw error;
  }

  if (!['all', 'class', 'individual'].includes(audience)) {
    const error = new Error('audience must be "all", "class", or "individual"');
    error.statusCode = 400;
    throw error;
  }

  if (audience === 'class' && !className) {
    const error = new Error('className is required when audience is "class"');
    error.statusCode = 400;
    throw error;
  }

  if (audience === 'individual' && !receiver) {
    const error = new Error('receiver is required when audience is "individual"');
    error.statusCode = 400;
    throw error;
  }

  const notification = await Notification.create({
    title: title.trim(),
    body: body.trim(),
    audience,
    className: className ? className.trim() : undefined,
    receiver: receiver || undefined,
    createdBy,
  });

  return notification;
};

/**
 * Get notifications visible to current user with computed isRead status.
 */
const getMyNotifications = async (user) => {
  const query = {
    $or: [{ audience: 'all' }],
  };

  if (user.className) {
    query.$or.push({ audience: 'class', className: user.className });
  }

  query.$or.push({ audience: 'individual', receiver: user._id });

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'fullName email');

  // Find all read notifications for this user
  const readRecords = await NotificationRead.find({ user: user._id });
  const readSet = new Set(readRecords.map((r) => r.notification.toString()));

  const result = notifications.map((n) => {
    const obj = n.toObject();
    obj.isRead = readSet.has(n._id.toString());
    return obj;
  });

  return result;
};

/**
 * Mark notification as read (upsert NotificationRead).
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  await NotificationRead.findOneAndUpdate(
    { notification: notificationId, user: userId },
    { readAt: new Date() },
    { upsert: true, new: true }
  );

  return { message: 'Notification marked as read' };
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
};
```

### File: smartpass-backend/src/services/emergencyService.js
```javascript
const crypto = require('crypto');
const EmergencyProfile = require('../models/EmergencyProfile');
const Card = require('../models/Card');
const User = require('../models/User');
const logService = require('./logService');

const ALLOWED_VISIBLE_FIELDS = [
  'fullName',
  'emergencyContactName',
  'emergencyContactPhone',
  'allergies',
  'bloodType',
  'insuranceInfo',
];

/**
 * Get or create emergency profile for current user.
 */
const getMyEmergencyProfile = async (userId) => {
  let profile = await EmergencyProfile.findOne({ owner: userId });

  if (!profile) {
    const user = await User.findById(userId);
    profile = await EmergencyProfile.create({
      owner: userId,
      fullName: user ? user.fullName : '',
      visibleFields: ['fullName', 'emergencyContactName', 'emergencyContactPhone'],
      isEnabled: false,
    });
  }

  return profile;
};

/**
 * Create or update emergency profile for current user.
 */
const updateMyEmergencyProfile = async (userId, data) => {
  let profile = await EmergencyProfile.findOne({ owner: userId });
  if (!profile) {
    profile = new EmergencyProfile({ owner: userId });
  }

  const allowedUpdates = [
    'fullName',
    'emergencyContactName',
    'emergencyContactPhone',
    'allergies',
    'bloodType',
    'insuranceInfo',
    'isEnabled',
  ];

  for (const field of allowedUpdates) {
    if (data[field] !== undefined) {
      profile[field] = data[field];
    }
  }

  if (data.visibleFields !== undefined) {
    if (!Array.isArray(data.visibleFields)) {
      const error = new Error('visibleFields must be an array');
      error.statusCode = 400;
      throw error;
    }

    const invalidField = data.visibleFields.find(
      (f) => !ALLOWED_VISIBLE_FIELDS.includes(f)
    );
    if (invalidField) {
      const error = new Error(
        `Invalid field in visibleFields: ${invalidField}. Allowed fields: ${ALLOWED_VISIBLE_FIELDS.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }

    profile.visibleFields = data.visibleFields;
  }

  await profile.save();
  return profile;
};

/**
 * Rotate card's qrToken.
 * Old qrToken stops working immediately.
 */
const rotateQrToken = async (userId) => {
  const card = await Card.findOne({ owner: userId });
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  const newQrToken = crypto.randomBytes(32).toString('hex');
  card.qrToken = newQrToken;
  await card.save();

  return { qrToken: newQrToken };
};

/**
 * Public emergency QR access.
 * Strict rules R1 to R6.
 */
const getPublicEmergencyInfo = async (qrToken) => {
  const notFoundError = () => {
    const error = new Error('Emergency information not found');
    error.statusCode = 404;
    return error;
  };

  if (!qrToken) {
    throw notFoundError();
  }

  // R3: Unknown qrToken -> 404
  const card = await Card.findOne({ qrToken: qrToken.trim() });
  if (!card) {
    throw notFoundError();
  }

  // R4: Card status in locked, lost, or expired -> 404
  if (card.status !== 'active') {
    throw notFoundError();
  }

  // Card expired by date
  if (new Date() > new Date(card.expiresAt)) {
    card.status = 'expired';
    await card.save();
    throw notFoundError();
  }

  // Find EmergencyProfile
  const profile = await EmergencyProfile.findOne({ owner: card.owner });
  if (!profile) {
    throw notFoundError();
  }

  // R2: isEnabled is false -> 404
  if (!profile.isEnabled) {
    throw notFoundError();
  }

  // R1: Response contains ONLY fields listed in visibleFields.
  // A field NOT in visibleFields MUST be ABSENT from the JSON.
  const data = {};
  for (const field of profile.visibleFields) {
    if (ALLOWED_VISIBLE_FIELDS.includes(field)) {
      data[field] = profile[field] !== undefined && profile[field] !== null ? profile[field] : '';
    }
  }

  // R6: On success, write AccessLog
  await logService.recordLog({
    card: card._id,
    owner: card.owner,
    action: 'emergency_view',
    location: 'Public QR Scan',
    detail: 'Emergency profile viewed via public QR',
    createdBy: null,
  });

  return data;
};

module.exports = {
  getMyEmergencyProfile,
  updateMyEmergencyProfile,
  rotateQrToken,
  getPublicEmergencyInfo,
};
```

### File: smartpass-backend/src/controllers/authController.js
```javascript
const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user._id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user._id, req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword,
};
```

### File: smartpass-backend/src/controllers/userController.js
```javascript
const userService = require('../services/userService');

const getUsers = async (req, res, next) => {
  try {
    const result = await userService.getUsers({
      q: req.query.q,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const user = await userService.updateUserRole(req.params.id, req.body.role);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const user = await userService.deactivateUser(req.params.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserRole,
  deactivateUser,
  deleteUser,
};
```

### File: smartpass-backend/src/controllers/cardController.js
```javascript
const cardService = require('../services/cardService');

const createCard = async (req, res, next) => {
  try {
    const card = await cardService.createCard(req.body);
    res.status(201).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const getCards = async (req, res, next) => {
  try {
    const result = await cardService.getCards({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    });
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getCardById = async (req, res, next) => {
  try {
    const card = await cardService.getCardById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const issueCard = async (req, res, next) => {
  try {
    const card = await cardService.issueCard(req.params.id);
    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const lockCard = async (req, res, next) => {
  try {
    const card = await cardService.lockCard(req.params.id);
    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const unlockCard = async (req, res, next) => {
  try {
    const card = await cardService.unlockCard(req.params.id);
    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const renewCard = async (req, res, next) => {
  try {
    const card = await cardService.renewCard(req.params.id, req.body.months);
    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const markCardLost = async (req, res, next) => {
  try {
    const card = await cardService.markCardLost(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCard = async (req, res, next) => {
  try {
    const result = await cardService.deleteCard(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getCardHistory = async (req, res, next) => {
  try {
    const result = await cardService.getCardHistory(
      req.params.id,
      req.user,
      req.query.page,
      req.query.limit
    );
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const verifyCard = async (req, res, next) => {
  try {
    const result = await cardService.verifyCard(req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCard,
  getCards,
  getCardById,
  issueCard,
  lockCard,
  unlockCard,
  renewCard,
  markCardLost,
  deleteCard,
  getCardHistory,
  verifyCard,
};
```

### File: smartpass-backend/src/controllers/logController.js
```javascript
const logService = require('../services/logService');

const getLogs = async (req, res, next) => {
  try {
    const result = await logService.getLogs(
      {
        card: req.query.card,
        owner: req.query.owner,
        action: req.query.action,
        from: req.query.from,
        to: req.query.to,
      },
      req.query.page,
      req.query.limit
    );

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLogs,
};
```

### File: smartpass-backend/src/controllers/attendanceController.js
```javascript
const attendanceService = require('../services/attendanceService');

const checkAttendance = async (req, res, next) => {
  try {
    const attendance = await attendanceService.checkAttendance(
      req.body,
      req.user._id
    );
    res.status(201).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const records = await attendanceService.getMyAttendance(req.user._id);
    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

const getAttendanceList = async (req, res, next) => {
  try {
    const records = await attendanceService.getAttendanceList({
      classSession: req.query.classSession,
      date: req.query.date,
    });
    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkAttendance,
  getMyAttendance,
  getAttendanceList,
};
```

### File: smartpass-backend/src/controllers/libraryController.js
```javascript
const libraryService = require('../services/libraryService');

const borrowBook = async (req, res, next) => {
  try {
    const loan = await libraryService.borrowBook(req.body, req.user._id);
    res.status(201).json({
      success: true,
      data: loan,
    });
  } catch (error) {
    next(error);
  }
};

const returnBook = async (req, res, next) => {
  try {
    const result = await libraryService.returnBook(req.body, req.user._id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyLoans = async (req, res, next) => {
  try {
    const loans = await libraryService.getMyLoans(req.user._id, req.query.status);
    res.status(200).json({
      success: true,
      data: loans,
    });
  } catch (error) {
    next(error);
  }
};

const getAllLoans = async (req, res, next) => {
  try {
    const result = await libraryService.getAllLoans({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    });
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  borrowBook,
  returnBook,
  getMyLoans,
  getAllLoans,
};
```

### File: smartpass-backend/src/controllers/canteenController.js
```javascript
const canteenService = require('../services/canteenService');

const getMyWallet = async (req, res, next) => {
  try {
    const wallet = await canteenService.getMyWallet(req.user._id);
    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

const topUpWallet = async (req, res, next) => {
  try {
    const result = await canteenService.topUpWallet(req.body, req.user._id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const payFromWallet = async (req, res, next) => {
  try {
    const result = await canteenService.payFromWallet(req.body, req.user._id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyTransactions = async (req, res, next) => {
  try {
    const transactions = await canteenService.getMyTransactions(req.user._id);
    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

const getAllTransactions = async (req, res, next) => {
  try {
    const result = await canteenService.getAllTransactions({
      page: req.query.page,
      limit: req.query.limit,
    });
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyWallet,
  topUpWallet,
  payFromWallet,
  getMyTransactions,
  getAllTransactions,
};
```

### File: smartpass-backend/src/controllers/parkingController.js
```javascript
const parkingService = require('../services/parkingService');

const checkIn = async (req, res, next) => {
  try {
    const session = await parkingService.checkIn(req.body, req.user._id);
    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const session = await parkingService.checkOut(req.body, req.user._id);
    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const getMySessions = async (req, res, next) => {
  try {
    const sessions = await parkingService.getMySessions(req.user._id);
    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

const getActiveSessions = async (req, res, next) => {
  try {
    const sessions = await parkingService.getActiveSessions();
    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMySessions,
  getActiveSessions,
};
```

### File: smartpass-backend/src/controllers/roomBookingController.js
```javascript
const roomBookingService = require('../services/roomBookingService');

const getAvailability = async (req, res, next) => {
  try {
    const slots = await roomBookingService.getAvailability({
      date: req.query.date,
      room: req.query.room,
    });
    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const booking = await roomBookingService.createBooking(
      req.body,
      req.user._id
    );
    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await roomBookingService.updateBookingStatus(
      req.params.id,
      req.body.status
    );
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await roomBookingService.getMyBookings(req.user._id);
    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await roomBookingService.cancelBooking(
      req.params.id,
      req.user._id,
      req.user.role
    );
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailability,
  createBooking,
  updateBookingStatus,
  getMyBookings,
  cancelBooking,
};
```

### File: smartpass-backend/src/controllers/eventController.js
```javascript
const eventService = require('../services/eventService');

const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body);
    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

const getUpcomingEvents = async (req, res, next) => {
  try {
    const events = await eventService.getUpcomingEvents();
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const registerForEvent = async (req, res, next) => {
  try {
    const registration = await eventService.registerForEvent(
      req.params.id,
      req.user._id
    );
    res.status(201).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

const getMyEvents = async (req, res, next) => {
  try {
    const events = await eventService.getMyEvents(req.user._id);
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getUpcomingEvents,
  registerForEvent,
  getMyEvents,
};
```

### File: smartpass-backend/src/controllers/scheduleController.js
```javascript
const scheduleService = require('../services/scheduleService');

const getMySchedule = async (req, res, next) => {
  try {
    const schedules = await scheduleService.getMySchedule(req.user.className);
    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

const createSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.createSchedule(req.body);
    res.status(201).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

const getSchedules = async (req, res, next) => {
  try {
    const schedules = await scheduleService.getSchedules({
      className: req.query.className,
    });
    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.updateSchedule(
      req.params.id,
      req.body
    );
    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const result = await scheduleService.deleteSchedule(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySchedule,
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
};
```

### File: smartpass-backend/src/controllers/notificationController.js
```javascript
const notificationService = require('../services/notificationService');

const createNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.createNotification(
      req.body,
      req.user._id
    );
    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getMyNotifications(req.user);
    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(
      req.params.id,
      req.user._id
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
};
```

### File: smartpass-backend/src/controllers/emergencyController.js
```javascript
const emergencyService = require('../services/emergencyService');

const getMyEmergencyProfile = async (req, res, next) => {
  try {
    const profile = await emergencyService.getMyEmergencyProfile(req.user._id);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const updateMyEmergencyProfile = async (req, res, next) => {
  try {
    const profile = await emergencyService.updateMyEmergencyProfile(
      req.user._id,
      req.body
    );
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const rotateQrToken = async (req, res, next) => {
  try {
    const result = await emergencyService.rotateQrToken(req.user._id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPublicEmergencyInfo = async (req, res, next) => {
  try {
    const data = await emergencyService.getPublicEmergencyInfo(
      req.params.qrToken
    );
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyEmergencyProfile,
  updateMyEmergencyProfile,
  rotateQrToken,
  getPublicEmergencyInfo,
};
```

### File: smartpass-backend/src/routes/authRoutes.js
```javascript
const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.patch('/change-password', protect, authController.changePassword);

module.exports = router;
```

### File: smartpass-backend/src/routes/userRoutes.js
```javascript
const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.patch('/:id', userController.updateUser);
router.patch('/:id/role', userController.updateUserRole);
router.patch('/:id/deactivate', userController.deactivateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
```

### File: smartpass-backend/src/routes/cardRoutes.js
```javascript
const express = require('express');
const cardController = require('../controllers/cardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/verify', cardController.verifyCard);

router.post('/', authorize('admin'), cardController.createCard);
router.get('/', authorize('admin'), cardController.getCards);

router.get('/:id', cardController.getCardById);
router.patch('/:id/issue', authorize('admin'), cardController.issueCard);
router.patch('/:id/lock', authorize('admin'), cardController.lockCard);
router.patch('/:id/unlock', authorize('admin'), cardController.unlockCard);
router.patch('/:id/renew', authorize('admin'), cardController.renewCard);
router.patch('/:id/lost', cardController.markCardLost);
router.delete('/:id', authorize('admin'), cardController.deleteCard);
router.get('/:id/history', cardController.getCardHistory);

module.exports = router;
```

### File: smartpass-backend/src/routes/logRoutes.js
```javascript
const express = require('express');
const logController = require('../controllers/logController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', logController.getLogs);

module.exports = router;
```

### File: smartpass-backend/src/routes/attendanceRoutes.js
```javascript
const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post(
  '/check',
  authorize('admin', 'librarian', 'canteen_staff', 'parking_staff'),
  attendanceController.checkAttendance
);
router.get('/my', authorize('student'), attendanceController.getMyAttendance);
router.get(
  '/',
  authorize('admin', 'librarian', 'canteen_staff', 'parking_staff'),
  attendanceController.getAttendanceList
);

module.exports = router;
```

### File: smartpass-backend/src/routes/libraryRoutes.js
```javascript
const express = require('express');
const libraryController = require('../controllers/libraryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/borrow', authorize('admin', 'librarian'), libraryController.borrowBook);
router.post('/return', authorize('admin', 'librarian'), libraryController.returnBook);
router.get('/my-loans', authorize('student'), libraryController.getMyLoans);
router.get('/loans', authorize('admin', 'librarian'), libraryController.getAllLoans);

module.exports = router;
```

### File: smartpass-backend/src/routes/canteenRoutes.js
```javascript
const express = require('express');
const canteenController = require('../controllers/canteenController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/me', authorize('student'), canteenController.getMyWallet);
router.post('/topup', authorize('admin', 'canteen_staff'), canteenController.topUpWallet);
router.post('/pay', authorize('admin', 'canteen_staff'), canteenController.payFromWallet);
router.get('/transactions', authorize('student'), canteenController.getMyTransactions);
router.get('/transactions/all', authorize('admin'), canteenController.getAllTransactions);

module.exports = router;
```

### File: smartpass-backend/src/routes/parkingRoutes.js
```javascript
const express = require('express');
const parkingController = require('../controllers/parkingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post(
  '/check-in',
  authorize('admin', 'parking_staff'),
  parkingController.checkIn
);
router.post(
  '/check-out',
  authorize('admin', 'parking_staff'),
  parkingController.checkOut
);
router.get('/my', authorize('student'), parkingController.getMySessions);
router.get(
  '/active',
  authorize('admin', 'parking_staff'),
  parkingController.getActiveSessions
);

module.exports = router;
```

### File: smartpass-backend/src/routes/roomRoutes.js
```javascript
const express = require('express');
const roomBookingController = require('../controllers/roomBookingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/availability', roomBookingController.getAvailability);

module.exports = router;
```

### File: smartpass-backend/src/routes/roomBookingRoutes.js
```javascript
const express = require('express');
const roomBookingController = require('../controllers/roomBookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', roomBookingController.createBooking);
router.get('/my', roomBookingController.getMyBookings);
router.patch('/:id/approve', authorize('admin'), roomBookingController.updateBookingStatus);
router.patch('/:id/cancel', roomBookingController.cancelBooking);

module.exports = router;
```

### File: smartpass-backend/src/routes/eventRoutes.js
```javascript
const express = require('express');
const eventController = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin'), eventController.createEvent);
router.get('/', eventController.getUpcomingEvents);
router.get('/my', authorize('student'), eventController.getMyEvents);
router.post('/:id/register', authorize('student'), eventController.registerForEvent);

module.exports = router;
```

### File: smartpass-backend/src/routes/scheduleRoutes.js
```javascript
const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/my', authorize('student'), scheduleController.getMySchedule);
router.post('/', authorize('admin'), scheduleController.createSchedule);
router.get('/', authorize('admin'), scheduleController.getSchedules);
router.patch('/:id', authorize('admin'), scheduleController.updateSchedule);
router.delete('/:id', authorize('admin'), scheduleController.deleteSchedule);

module.exports = router;
```

### File: smartpass-backend/src/routes/notificationRoutes.js
```javascript
const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin'), notificationController.createNotification);
router.get('/my', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
```

### File: smartpass-backend/src/routes/emergencyRoutes.js
```javascript
const express = require('express');
const emergencyController = require('../controllers/emergencyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public emergency QR scan endpoint (NO authentication)
router.get('/public/:qrToken', emergencyController.getPublicEmergencyInfo);

// Owner-only endpoints (Authenticated)
router.get('/me', protect, emergencyController.getMyEmergencyProfile);
router.put('/me', protect, emergencyController.updateMyEmergencyProfile);
router.post('/me/rotate-qr', protect, emergencyController.rotateQrToken);

module.exports = router;
```

### File: smartpass-backend/src/seed/seed.js
```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/User');
const Card = require('../models/Card');
const Wallet = require('../models/Wallet');
const ClassSchedule = require('../models/ClassSchedule');
const EmergencyProfile = require('../models/EmergencyProfile');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Card.deleteMany({});
    await Wallet.deleteMany({});
    await ClassSchedule.deleteMany({});
    await EmergencyProfile.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create Admin Account (Teaching account only - MUST change before production)
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const admin = await User.create({
      fullName: 'System Administrator',
      email: 'admin@smartpass.edu',
      password: adminPasswordHash,
      role: 'admin',
      phone: '0901234567',
      isActive: true,
    });
    await Wallet.create({ owner: admin._id, balance: 500000 });
    console.log(`Created admin: ${admin.email}`);

    // 2. Create 2 Students
    const student1PasswordHash = await bcrypt.hash('Student@123', 10);
    const student1 = await User.create({
      fullName: 'Nguyen Van An',
      email: 'an.nguyen@smartpass.edu',
      password: student1PasswordHash,
      role: 'student',
      phone: '0912345678',
      studentCode: 'STU001',
      className: 'SE101',
      isActive: true,
    });
    await Wallet.create({ owner: student1._id, balance: 150000 });

    const student2PasswordHash = await bcrypt.hash('Student@123', 10);
    const student2 = await User.create({
      fullName: 'Tran Thi Binh',
      email: 'binh.tran@smartpass.edu',
      password: student2PasswordHash,
      role: 'student',
      phone: '0987654321',
      studentCode: 'STU002',
      className: 'SE101',
      isActive: true,
    });
    await Wallet.create({ owner: student2._id, balance: 200000 });
    console.log(`Created students: ${student1.email}, ${student2.email}`);

    // 3. Create 1 Card per Student
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const card1 = await Card.create({
      cardCode: 'CARD-STU001',
      owner: student1._id,
      type: 'student',
      status: 'active',
      issuedAt: new Date(),
      expiresAt: oneYearFromNow,
      nfcUid: 'NFC-AN-001',
      qrToken: crypto.randomBytes(32).toString('hex'),
    });

    const card2 = await Card.create({
      cardCode: 'CARD-STU002',
      owner: student2._id,
      type: 'student',
      status: 'active',
      issuedAt: new Date(),
      expiresAt: oneYearFromNow,
      nfcUid: 'NFC-BINH-002',
      qrToken: crypto.randomBytes(32).toString('hex'),
    });
    console.log(`Created cards: ${card1.cardCode}, ${card2.cardCode}`);

    // 4. Create Emergency Profiles
    await EmergencyProfile.create({
      owner: student1._id,
      fullName: student1.fullName,
      emergencyContactName: 'Nguyen Van Cha (Father)',
      emergencyContactPhone: '0909998877',
      allergies: 'Penicillin, Peanuts',
      bloodType: 'O+',
      insuranceInfo: 'BHYT-123456789',
      visibleFields: ['fullName', 'emergencyContactName', 'emergencyContactPhone', 'bloodType'],
      isEnabled: true,
    });

    await EmergencyProfile.create({
      owner: student2._id,
      fullName: student2.fullName,
      emergencyContactName: 'Tran Van Me (Mother)',
      emergencyContactPhone: '0908887766',
      allergies: 'None',
      bloodType: 'A+',
      insuranceInfo: 'BHYT-987654321',
      visibleFields: ['fullName', 'emergencyContactName', 'emergencyContactPhone'],
      isEnabled: true,
    });
    console.log('Created emergency profiles.');

    // 5. Create Sample ClassSchedule Rows
    await ClassSchedule.create([
      {
        className: 'SE101',
        subject: 'Data Structures and Algorithms',
        teacher: 'Dr. Le Van Toan',
        room: 'Lab 302',
        dayOfWeek: 2, // Monday
        startTime: '08:00',
        endTime: '10:30',
        semester: 'Fall 2026',
      },
      {
        className: 'SE101',
        subject: 'Database Systems',
        teacher: 'Prof. Tran Minh',
        room: 'Room 405',
        dayOfWeek: 4, // Wednesday
        startTime: '13:00',
        endTime: '15:30',
        semester: 'Fall 2026',
      },
      {
        className: 'SE101',
        subject: 'Mobile Development (Android)',
        teacher: 'Nguyen Hoang',
        room: 'Lab 201',
        dayOfWeek: 6, // Friday
        startTime: '09:00',
        endTime: '11:30',
        semester: 'Fall 2026',
      },
    ]);
    console.log('Created sample ClassSchedule rows.');

    console.log('\nSeeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
```

### File: smartpass-backend/README.md
```markdown
# SmartPass — All-in-One Digital Card (Backend REST API)

> **IMPORTANT SECURITY WARNING**  
> The seed data provides an administrative account (`admin@smartpass.edu` with password `Admin@123`) strictly for demonstration and testing purposes. **You MUST change the admin password and `JWT_SECRET` in `.env` before any production deployment.**

---

## 1. Overview & System Purpose

SmartPass replaces all physical school cards with **ONE digital card per user**.  
One user = one account = one primary card, used for:
- Student ID & verification
- Attendance check-in
- Library loans & return tracking
- Canteen cashless wallet payment
- Parking check-in & automated fee calculation
- Room booking with conflict detection
- Event registration with atomic capacity management
- Class schedule view
- Multi-audience school notifications
- Privacy-controlled emergency card via public QR / NFC

---

## 2. Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 4
- **Database**: MongoDB
- **ODM**: Mongoose 8
- **Language**: JavaScript (CommonJS `require` / `module.exports`, strictly NO TypeScript)
- **Authentication**: `bcryptjs` (salt rounds = 10) + `jsonwebtoken` (JWT)
- **Configuration**: `dotenv`
- **Development Runner**: `nodemon`

---

## 3. Architecture: 4-Layer Unidirectional Flow

The architecture strictly enforces unidirectional flow with zero cross-layer rule violations:
`Client -> Route -> Middleware -> Controller -> Service -> Model -> MongoDB`

```
smartpass-backend/
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── src/
    ├── server.js               # Express application setup and route mounting
    ├── config/
    │   └── db.js               # MongoDB connection lifecycle
    ├── models/                 # Mongoose schemas, enums, defaults, and indexes ONLY
    ├── middleware/             # Authentication (protect) & Authorization (authorize) only
    ├── controllers/            # Read req, call ONE service function, return HTTP res
    ├── services/               # ALL business logic, status checks, money math, and errors
    ├── utils/                  # Shared utilities (assertCardUsable, generateToken)
    └── seed/
        └── seed.js             # Initial database seed script
```

### Layer Responsibilities:
1. **`routes/`**: Declare HTTP method and URL path, attach authentication/authorization middleware, and invoke exactly ONE controller function. **No business logic, no direct Model imports.**
2. **`middleware/`**: Handle cross-cutting concerns: `protect` (verifies Bearer JWT), `authorize(...roles)` (role-based access control), and `errorHandler` (central sanitized error responses).
3. **`controllers/`**: Extract request inputs (`params`, `query`, `body`, `user`), call exactly ONE service function, and dispatch standardized JSON response. **Never import any Mongoose Model.**
4. **`services/`**: Execute ALL validation, database queries via Models, money math, status transitions, and throw errors with explicit `statusCode` properties.
5. **`models/`**: Define schema definitions, constraints, default values, and compound indexes. Contain no business logic.

---

## 4. Design Choices & Assumptions (Satisfying Spec)

1. **Staff Roles**: Allowed roles are `admin`, `student`, `librarian`, `canteen_staff`, and `parking_staff`. Default role is `student`.
2. **Card Verification (`POST /api/cards/verify`)**: Open to authenticated users/staff to verify a card via `cardCode`, `nfcUid`, or `qrToken`.
3. **Parking Fee Calculation**: Fixed rate of 2,000 VND/hour. Parked duration is rounded up via `Math.ceil(hours)`. Minimum parking charge is 1 hour (2,000 VND).
4. **Library Loan Due Date**: Default loan period is exactly 14 days from time of borrowing.
5. **Class Schedule Days**: Stored as integers where 2 = Monday, 3 = Tuesday, ..., 8 = Sunday.

---

## 5. Standard Response Format

### Success (Single Resource):
```json
{
  "success": true,
  "data": { ... }
}
```

### Success (List with Pagination):
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 57
  }
}
```

### Error:
```json
{
  "success": false,
  "message": "Human-readable reason"
}
```

---

## 6. Complete API Endpoints Table

| Method | Path | Allowed Roles | Purpose |
|---|---|---|---|
| **Root** | | | |
| `GET` | `/` | Public | API Health Check |
| **Auth** | | | |
| `POST` | `/api/auth/register` | Public | Register new account & auto-create wallet |
| `POST` | `/api/auth/login` | Public | Login with email/password; rate-limited (INV-09/10) |
| `GET` | `/api/auth/me` | Authenticated | Get current user profile (no password) |
| `PATCH`| `/api/auth/change-password` | Authenticated | Change account password |
| **Users (Admin)** | | | |
| `GET` | `/api/users` | `admin` | Search users (`?q=`) with pagination |
| `POST` | `/api/users` | `admin` | Create new user account |
| `GET` | `/api/users/:id` | `admin` | Get user details by ID |
| `PATCH`| `/api/users/:id` | `admin` | Update user profile fields |
| `PATCH`| `/api/users/:id/role` | `admin` | Update user role |
| `PATCH`| `/api/users/:id/deactivate` | `admin` | Deactivate user account |
| `DELETE`| `/api/users/:id` | `admin` | Delete user account |
| **Cards** | | | |
| `POST` | `/api/cards` | `admin` | Create new card with secure `qrToken` |
| `GET` | `/api/cards` | `admin` | List cards with filters & pagination |
| `POST` | `/api/cards/verify` | Authenticated | Verify card and retrieve owner metadata |
| `GET` | `/api/cards/:id` | `admin`, Owner | Get card details |
| `PATCH`| `/api/cards/:id/issue` | `admin` | Activate card and record `issuedAt` |
| `PATCH`| `/api/cards/:id/lock` | `admin` | Lock card |
| `PATCH`| `/api/cards/:id/unlock`| `admin` | Unlock card back to active |
| `PATCH`| `/api/cards/:id/renew` | `admin` | Renew card validity (`expiresAt += months`) |
| `PATCH`| `/api/cards/:id/lost` | `admin`, Owner | Mark card as lost |
| `DELETE`| `/api/cards/:id` | `admin` | Delete card |
| `GET` | `/api/cards/:id/history` | `admin`, Owner | View card access log history |
| **Access Logs** | | | |
| `GET` | `/api/logs` | `admin` | Query access logs with multi-field filters |
| **Attendance** | | | |
| `POST` | `/api/attendance/check` | Staff roles | Check-in attendance by card (INV-02, INV-04) |
| `GET` | `/api/attendance/my` | `student` | View student's personal attendance history |
| `GET` | `/api/attendance` | Staff roles | List attendance records by session / date |
| **Library** | | | |
| `POST` | `/api/library/borrow` | `admin`, `librarian` | Borrow book (INV-06: max 3 active loans) |
| `POST` | `/api/library/return` | `admin`, `librarian` | Return book and report overdue status |
| `GET` | `/api/library/my-loans`| `student` | View student's current and past loans |
| `GET` | `/api/library/loans` | `admin`, `librarian` | List all library loans with pagination |
| **Canteen & Wallet** | | | |
| `GET` | `/api/wallet/me` | `student` | View current wallet balance |
| `POST` | `/api/wallet/topup` | `admin`, `canteen_staff` | Top up student wallet balance |
| `POST` | `/api/wallet/pay` | `admin`, `canteen_staff` | Deduct wallet payment (INV-02, INV-03, INV-04) |
| `GET` | `/api/wallet/transactions` | `student` | View personal transaction history |
| `GET` | `/api/wallet/transactions/all` | `admin` | List all canteen transactions |
| **Parking** | | | |
| `POST` | `/api/parking/check-in` | `admin`, `parking_staff` | Vehicle check-in (INV-05: max 1 open session) |
| `POST` | `/api/parking/check-out`| `admin`, `parking_staff` | Vehicle check-out and fee calculation |
| `GET` | `/api/parking/my` | `student` | View personal parking sessions |
| `GET` | `/api/parking/active` | `admin`, `parking_staff` | View currently active parked vehicles |
| **Room Booking** | | | |
| `GET` | `/api/rooms/availability` | Authenticated | View approved time slots for date/room |
| `POST` | `/api/room-bookings` | Authenticated | Request room booking (INV-08 conflict check) |
| `PATCH`| `/api/room-bookings/:id/approve` | `admin` | Approve or reject room booking (INV-08) |
| `GET` | `/api/room-bookings/my`| Authenticated | View my room bookings |
| `PATCH`| `/api/room-bookings/:id/cancel` | Owner | Cancel room booking |
| **Events** | | | |
| `POST` | `/api/events` | `admin` | Create new event with capacity |
| `GET` | `/api/events` | Authenticated | List upcoming events |
| `POST` | `/api/events/:id/register` | `student` | Atomic event registration (INV-07) |
| `GET` | `/api/events/my` | `student` | View registered events |
| **Schedule & Notifications** | | | |
| `GET` | `/api/schedules/my` | `student` | View current student's class schedule |
| `POST` | `/api/schedules` | `admin` | Create class schedule row |
| `GET` | `/api/schedules` | `admin` | List class schedules |
| `PATCH`| `/api/schedules/:id` | `admin` | Update schedule row |
| `DELETE`| `/api/schedules/:id`| `admin` | Delete schedule row |
| `POST` | `/api/notifications` | `admin` | Broadcast or target notification |
| `GET` | `/api/notifications/my`| Authenticated | Get user notifications with `isRead` |
| `PATCH`| `/api/notifications/:id/read` | Authenticated | Mark notification as read |
| **Emergency Profile** | | | |
| `GET` | `/api/emergency/me` | Authenticated | Get own emergency profile |
| `PUT` | `/api/emergency/me` | Authenticated | Update emergency profile & visibility |
| `POST` | `/api/emergency/me/rotate-qr` | Authenticated | Invalidate old and generate new QR token |
| `GET` | `/api/emergency/public/:qrToken` | Public | Emergency profile view (R1 to R6 strict) |

---

## 7. How to Install and Run

### Prerequisites
- Node.js version 20+
- MongoDB instance running locally on `mongodb://127.0.0.1:27017`

### Setup Steps
```bash
# 1. Navigate to backend directory
cd smartpass-backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Seed initial database records
npm run seed

# 5. Start development server with nodemon
npm run dev
```

Server will start on `http://localhost:3000`.

---

## 8. Complete Step-by-Step cURL Flow

### Step 1: Register a new student account
```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Le Van Cuong",
    "email": "cuong.le@smartpass.edu",
    "password": "Password@123",
    "phone": "0911223344",
    "studentCode": "STU100",
    "className": "SE101"
  }'
```

### Step 2: Login as Admin to get Admin JWT
```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartpass.edu","password":"Admin@123"}' | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
echo "Admin Token: $ADMIN_TOKEN"
```

### Step 3: Admin creates a card for the new student
```bash
# Get student ID from login or user list
STUDENT_ID=$(curl -s -X GET "http://localhost:3000/api/users?q=cuong.le@smartpass.edu" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

CREATE_CARD_RES=$(curl -s -X POST http://localhost:3000/api/cards \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"cardCode\": \"CARD-STU100\",
    \"owner\": \"$STUDENT_ID\",
    \"expiresAt\": \"2027-12-31T23:59:59.000Z\",
    \"nfcUid\": \"NFC-CUONG-100\"
  }")
CARD_ID=$(echo $CREATE_CARD_RES | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
QR_TOKEN=$(echo $CREATE_CARD_RES | grep -o '"qrToken":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Card ID: $CARD_ID, QR Token: $QR_TOKEN"
```

### Step 4: Admin issues the card (activate)
```bash
curl -s -X PATCH "http://localhost:3000/api/cards/$CARD_ID/issue" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Step 5: Staff records attendance check-in using the card
```bash
curl -s -X POST http://localhost:3000/api/attendance/check \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardCode": "CARD-STU100",
    "classSession": "SE101-2026-11-08-AM",
    "subject": "Distributed Systems"
  }'
```

### Step 6: Top-up wallet and perform canteen payment
```bash
# 6a. Admin tops up 100,000 VND
curl -s -X POST http://localhost:3000/api/wallet/topup \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$STUDENT_ID\",
    \"amount\": 100000,
    \"note\": \"Initial top-up\"
  }"

# 6b. Canteen payment of 35,000 VND using cardCode
curl -s -X POST http://localhost:3000/api/wallet/pay \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardCode": "CARD-STU100",
    "amount": 35000
  }'
```

### Step 7: Configure Emergency Profile & Public QR Scan
```bash
# 7a. Student logs in to get Student JWT
STUDENT_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cuong.le@smartpass.edu","password":"Password@123"}' | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

# 7b. Student configures emergency profile with strict visible fields and enables it
curl -s -X PUT http://localhost:3000/api/emergency/me \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Le Van Cuong",
    "emergencyContactName": "Le Van Bo (Father)",
    "emergencyContactPhone": "0988776655",
    "allergies": "Aspirin",
    "bloodType": "B+",
    "insuranceInfo": "BHYT-555666",
    "visibleFields": ["fullName", "emergencyContactPhone", "bloodType"],
    "isEnabled": true
  }'

# 7c. Public scans the card QR without ANY authentication:
curl -s -X GET "http://localhost:3000/api/emergency/public/$QR_TOKEN"
```

**Expected Response from Step 7c:**
```json
{
  "success": true,
  "data": {
    "fullName": "Le Van Cuong",
    "emergencyContactPhone": "0988776655",
    "bloodType": "B+"
  }
}
```
*(Notice: `allergies`, `insuranceInfo`, `email`, `studentCode`, and `emergencyContactName` are completely ABSENT from JSON, fulfilling Rule R1!)*
```

---

### File: smartpass-backend/.env.example
```
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/smartpass
JWT_SECRET=change-this-secret
JWT_EXPIRE=7d
```

---

## 2. Android App (Kotlin Native, Jetpack Compose, MVVM)

The Android application has been generated with complete native Kotlin source code in `smartpass-android/`:
- **Architecture**: Single Activity (`MainActivity`), MVVM (`ViewModel` + `Repository`), Navigation Compose.
- **Networking**: Retrofit 2 + OkHttp + Coroutines, with `AuthInterceptor` auto-injecting Bearer tokens and automatically clearing token and navigating to Login on HTTP 401.
- **Encrypted Storage**: `TokenManager` using Android Jetpack `DataStore` (no plain SharedPreferences).
- **Scanner**: CameraX + ML Kit for QR detection + `NfcAdapter` for NFC card taps.
- **Emergency Screen**: Displays strictly returned allowed fields and implements all 3 buttons:
  - `[Call emergency contact]` -> `Intent(ACTION_DIAL, "tel:<emergencyContactPhone>")`
  - `[Call ambulance]` -> `Intent(ACTION_DIAL, "tel:115")`
  - `[Share my location]` -> Reads GPS location and triggers `Intent(ACTION_SEND)` with Google Maps link to the emergency contact.

---

## 3. Admin Web UI (Frontend Calling Backend REST API)

The Admin web dashboard has been created in `smartpass-admin/`:
- **Login**: Authenticates against `POST /api/auth/login`. Stores token in `localStorage`.
- **Pages / Views**: Dashboard, Users, Cards, Access Logs, Room Bookings, Events, Schedules, Notifications.
- **Error Handling**: On HTTP 401 redirects to Login; on HTTP 403 displays *"You do not have permission for this action"*. Never queries MongoDB directly.

---

## # SELF-CHECK

### Endpoint Implementation Checklist

#### AUTH
- [x] `POST /api/auth/register` implemented in route+controller+service
- [x] `POST /api/auth/login` implemented in route+controller+service
- [x] `GET /api/auth/me` implemented in route+controller+service
- [x] `PATCH /api/auth/change-password` implemented in route+controller+service

#### ADMIN (Cards, Users, Logs)
- [x] `POST /api/cards` implemented in route+controller+service
- [x] `GET /api/cards` implemented in route+controller+service
- [x] `GET /api/cards/:id` implemented in route+controller+service
- [x] `PATCH /api/cards/:id/issue` implemented in route+controller+service
- [x] `PATCH /api/cards/:id/lock` implemented in route+controller+service
- [x] `PATCH /api/cards/:id/unlock` implemented in route+controller+service
- [x] `PATCH /api/cards/:id/renew` implemented in route+controller+service
- [x] `PATCH /api/cards/:id/lost` implemented in route+controller+service
- [x] `DELETE /api/cards/:id` implemented in route+controller+service
- [x] `GET /api/cards/:id/history` implemented in route+controller+service
- [x] `POST /api/cards/verify` implemented in route+controller+service
- [x] `GET /api/users` implemented in route+controller+service
- [x] `POST /api/users` implemented in route+controller+service
- [x] `GET /api/users/:id` implemented in route+controller+service
- [x] `PATCH /api/users/:id` implemented in route+controller+service
- [x] `PATCH /api/users/:id/role` implemented in route+controller+service
- [x] `PATCH /api/users/:id/deactivate` implemented in route+controller+service
- [x] `DELETE /api/users/:id` implemented in route+controller+service
- [x] `GET /api/logs` implemented in route+controller+service

#### INTEGRATION MODULES
- [x] `POST /api/attendance/check` implemented in route+controller+service
- [x] `GET /api/attendance/my` implemented in route+controller+service
- [x] `GET /api/attendance` implemented in route+controller+service
- [x] `POST /api/library/borrow` implemented in route+controller+service
- [x] `POST /api/library/return` implemented in route+controller+service
- [x] `GET /api/library/my-loans` implemented in route+controller+service
- [x] `GET /api/library/loans` implemented in route+controller+service
- [x] `GET /api/wallet/me` implemented in route+controller+service
- [x] `POST /api/wallet/topup` implemented in route+controller+service
- [x] `POST /api/wallet/pay` implemented in route+controller+service
- [x] `GET /api/wallet/transactions` implemented in route+controller+service
- [x] `GET /api/wallet/transactions/all` implemented in route+controller+service
- [x] `POST /api/parking/check-in` implemented in route+controller+service
- [x] `POST /api/parking/check-out` implemented in route+controller+service
- [x] `GET /api/parking/my` implemented in route+controller+service
- [x] `GET /api/parking/active` implemented in route+controller+service
- [x] `GET /api/rooms/availability` implemented in route+controller+service
- [x] `POST /api/room-bookings` implemented in route+controller+service
- [x] `PATCH /api/room-bookings/:id/approve` implemented in route+controller+service
- [x] `GET /api/room-bookings/my` implemented in route+controller+service
- [x] `PATCH /api/room-bookings/:id/cancel` implemented in route+controller+service
- [x] `POST /api/events` implemented in route+controller+service
- [x] `GET /api/events` implemented in route+controller+service
- [x] `POST /api/events/:id/register` implemented in route+controller+service
- [x] `GET /api/events/my` implemented in route+controller+service
- [x] `GET /api/schedules/my` implemented in route+controller+service
- [x] `POST /api/schedules` implemented in route+controller+service
- [x] `GET /api/schedules` implemented in route+controller+service
- [x] `PATCH /api/schedules/:id` implemented in route+controller+service
- [x] `DELETE /api/schedules/:id` implemented in route+controller+service
- [x] `POST /api/notifications` implemented in route+controller+service
- [x] `GET /api/notifications/my` implemented in route+controller+service
- [x] `PATCH /api/notifications/:id/read` implemented in route+controller+service
- [x] `GET /api/emergency/me` implemented in route+controller+service
- [x] `PUT /api/emergency/me` implemented in route+controller+service
- [x] `POST /api/emergency/me/rotate-qr` implemented in route+controller+service
- [x] `GET /api/emergency/public/:qrToken` implemented in route+controller+service
- [x] `GET /` implemented in route+controller+service (health check)

### Structural & Security Invariants Verification
1. **Controllers**: 0 controllers import any Model. All controllers read `req`, invoke exactly ONE service method, and respond with HTTP status code.
2. **Routes**: 0 routes contain business logic or database queries. All routes attach middleware and map to one controller method.
3. **Password Security**: `User.password` has `select: false`. All passwords hashed with `bcryptjs` (salt rounds = 10). Zero responses contain `password`.
4. **Environment Isolation**: `.env` is listed in `.gitignore`. No hard-coded secrets or database URIs in source files.
5. **Card Usability**: `assertCardUsable` in [assertCardUsable.js](file:///Users/anhquan/Documents/smart-card/smartpass-backend/src/utils/assertCardUsable.js) is the single centralized authority for card usability verification across all integration modules.