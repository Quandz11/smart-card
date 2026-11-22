require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Startup validation: QR_SIGNING_SECRET length >= 32
const qrSecret = process.env.QR_SIGNING_SECRET;
if (!qrSecret || qrSecret.length < 32) {
  console.error('[FATAL CONFIG] QR_SIGNING_SECRET is missing or shorter than 32 characters');
  process.exit(1);
}

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
const qrRoutes = require('./routes/qrRoutes');
const otpRoutes = require('./routes/otpRoutes');

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
app.use('/api/schedule', scheduleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/otp', otpRoutes);

// Catch-all 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Central error handler
app.use(errorHandler);

const http = require('http');
const { initSocket } = require('./socket');
const { initScheduler } = require('./scheduler');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = initSocket(server);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartPass server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} (0.0.0.0)`);
    initScheduler();
  });
}

module.exports = { app, server, io };
