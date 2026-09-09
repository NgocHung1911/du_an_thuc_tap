import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { HomePage } from './pages/public/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OtpVerificationPage } from './pages/auth/OtpVerificationPage';
import { AcceptInvitePage } from './pages/auth/AcceptInvitePage';
import { ProtectedRoute } from './routes/ProtectedRoutes';
import { MainLayout } from './components/layout/MainLayout';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage';

// Member Pages
import { MemberDashboardPage } from './pages/member/MemberDashboardPage';
import { MemberMyTasksPage } from './pages/member/MemberMyTasksPage';
import { ManagerProjectsPage } from './pages/member/ManagerProjectsPage';
import { PersonalProfilePage } from './pages/member/PersonalProfilePage';

// Project Pages
import { ProjectDetailPage } from './pages/project/ProjectDetailPage';

import { PageTitleManager } from './components/common/PageTitleManager';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-dummyclientid.apps.googleusercontent.com';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <WebSocketProvider>
          <BrowserRouter>
            <PageTitleManager />
          <Routes>
            {/* Public Landing & Authentication Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<OtpVerificationPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />

            {/* Protected Routes inside Jira Main Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                {/* Admin Scope Routes */}
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/projects" element={<AdminProjectsPage />} />
                <Route path="/admin/my-projects" element={<ManagerProjectsPage />} />
                <Route path="/admin/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/admin/profile" element={<PersonalProfilePage />} />

                {/* Member Scope Routes */}
                <Route path="/member" element={<Navigate to="/member/dashboard" replace />} />
                <Route path="/member/dashboard" element={<MemberDashboardPage />} />
                <Route path="/member/my-tasks" element={<MemberMyTasksPage />} />
                <Route path="/member/projects" element={<ManagerProjectsPage />} />
                <Route path="/member/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/member/profile" element={<PersonalProfilePage />} />

              </Route>
            </Route>

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);
}

export default App;
