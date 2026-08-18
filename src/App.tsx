import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { MemberLayout } from './components/layout/MemberLayout';

import HomePage from './pages/member/HomePage';
import LeadsPage from './pages/member/LeadsPage';
import TeamPage from './pages/member/TeamPage';
import EventPage from './pages/member/EventPage';
import EventDetailPage from './pages/member/EventDetailPage';
import ProfilePage from './pages/member/profile/ProfilePage';
import { AdminLayout } from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import CreateAdminPage from './pages/admin/CreateAdminPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/member"
          element={
            <ProtectedRoute>
              <MemberLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="event" element={<EventPage />} />
          <Route path="event/:id" element={<EventDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="create-admin" element={<CreateAdminPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        </Route>


        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

export default App;
