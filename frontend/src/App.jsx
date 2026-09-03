import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthBootstrap } from './hooks/useAuthBootstrap';
import { useAuthStore } from './store/authStore';
import PageLoader from './components/PageLoader';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ClipStudioPage from './pages/ClipStudioPage';
import LibraryPage from './pages/LibraryPage';
import CalendarPage from './pages/CalendarPage';
import AccountsPage from './pages/AccountsPage';
import AdminPage from './pages/AdminPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const { isInitialized } = useAuthBootstrap();
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!isInitialized) return <PageLoader />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={accessToken ? '/app' : '/login'} replace />} />
      <Route path="/login" element={accessToken ? <Navigate to="/app" replace /> : <LoginPage />} />
      <Route path="/register" element={accessToken ? <Navigate to="/app" replace /> : <RegisterPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="clip-studio" element={<ClipStudioPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute requireRole="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
