import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Cards } from './pages/Cards';
import { Logs } from './pages/Logs';
import { Attendance } from './pages/Attendance';
import { Library } from './pages/Library';
import { Wallet } from './pages/Wallet';
import { Parking } from './pages/Parking';
import { RoomBookings } from './pages/RoomBookings';
import { Events } from './pages/Events';
import { Schedules } from './pages/Schedules';
import { Notifications } from './pages/Notifications';
import { Emergency } from './pages/Emergency';
import { Settings } from './pages/Settings';
import { QrManagement } from './pages/QrManagement';
import { VnpayReturn } from './pages/VnpayReturn';
import { Spin } from 'antd';

const ALLOWED_STAFF_ROLES = ['admin', 'librarian', 'canteen_staff', 'parking_staff'];

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F7F8',
        }}
      >
        <Spin size="large" tip="Đang xác thực phiên làm việc..." />
      </div>
    );
  }

  if (!user || !ALLOWED_STAFF_ROLES.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="cards" element={<Cards />} />
        <Route path="logs" element={<Logs />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="library" element={<Library />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="canteen-wallet" element={<Navigate to="/wallet" replace />} />
        <Route path="wallet/vnpay-return" element={<VnpayReturn />} />
        <Route path="parking" element={<Parking />} />
        <Route path="room-bookings" element={<RoomBookings />} />
        <Route path="events" element={<Events />} />
        <Route path="schedules" element={<Schedules />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="qr" element={<QrManagement />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

