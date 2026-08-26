import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OtpVerificationPage } from './pages/auth/OtpVerificationPage';
import { AcceptInvitePage } from './pages/auth/AcceptInvitePage';
import { ProtectedRoute } from './routes/ProtectedRoutes';
import { MainLayout } from './components/layout/MainLayout';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminTasksPage } from './pages/admin/AdminTasksPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Member Pages
import { MemberMyTasksPage } from './pages/member/MemberMyTasksPage';
import { MemberProjectsPage } from './pages/member/MemberProjectsPage';
import { MemberProfilePage } from './pages/member/MemberProfilePage';

// Project Pages
import { ProjectDetailPage } from './pages/project/ProjectDetailPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-dummyclientid.apps.googleusercontent.com';

const RootRedirect = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/member/my-tasks'} replace />;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<OtpVerificationPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />

            {/* Root Path Smart Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected Routes inside Jira Main Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                {/* Admin Scope Routes */}
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/tasks" element={<AdminTasksPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/projects" element={<AdminProjectsPage />} />
                <Route path="/admin/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />

                {/* Member Scope Routes */}
                <Route path="/member/my-tasks" element={<MemberMyTasksPage />} />
                <Route path="/member/projects" element={<MemberProjectsPage />} />
                <Route path="/member/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/member/profile" element={<MemberProfilePage />} />

                {/* Common Project Detail Route */}
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
              </Route>
            </Route>

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
