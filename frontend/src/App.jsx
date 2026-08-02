import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';

// Auth Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';
import GuestRoute from './components/auth/GuestRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import EmailVerified from './pages/auth/EmailVerified';
import EmailExpired from './pages/auth/EmailExpired';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';

// Dashboard Pages
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import ManageMasterData from './pages/admin/ManageMasterData';
import CreateComplaint from './pages/complaints/CreateComplaint';
import ComplaintDetails from './pages/complaints/ComplaintDetails';
import AILogsConsole from './pages/admin/AILogsConsole';
import AdminPortal from './pages/admin/AdminPortal';
import ManageUsers from './pages/admin/ManageUsers';
import ManageOfficers from './pages/admin/ManageOfficers';
import AnnouncementsList from './pages/AnnouncementsList';
import NotificationSettings from './pages/NotificationSettings';

// Error Pages
import ForbiddenPage from './pages/auth/ForbiddenPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Guest Pages (Access only if NOT logged in) */}
            <Route element={<GuestRoute />}>
              <Route element={<PublicLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>
            </Route>

            {/* Verification Link Handling (Always accessible) */}
            <Route element={<PublicLayout />}>
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/email-verified" element={<EmailVerified />} />
              <Route path="/email-expired" element={<EmailExpired />} />
              <Route path="/403" element={<ForbiddenPage />} />
              <Route path="/401" element={<UnauthorizedPage />} />
            </Route>

            {/* Protected Routes (Access only if logged in) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AuthenticatedLayout />}>
                {/* Fallback routing base on default login landing */}
                <Route path="/" element={<Navigate to="/citizen/dashboard" replace />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/complaints/:id" element={<ComplaintDetails />} />
                <Route path="/announcements" element={<AnnouncementsList />} />
                <Route path="/notifications/settings" element={<NotificationSettings />} />

                {/* Citizen Specific Dashboard */}
                <Route element={<RoleGuard allowedRoles={['citizen']} />}>
                  <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
                  <Route path="/complaints/new" element={<CreateComplaint />} />
                </Route>

                {/* Officer Specific Dashboard */}
                <Route element={<RoleGuard allowedRoles={['officer']} />}>
                  <Route path="/officer/dashboard" element={<OfficerDashboard />} />
                </Route>

                {/* Admin Specific Dashboard */}
                <Route element={<RoleGuard allowedRoles={['admin']} />}>
                  <Route path="/admin/dashboard" element={<AdminPortal />} />
                  <Route path="/admin/master-data" element={<ManageMasterData />} />
                  <Route path="/admin/users" element={<ManageUsers />} />
                  <Route path="/admin/officers" element={<ManageOfficers />} />
                  <Route path="/admin/ai-logs" element={<AILogsConsole />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}
