import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ui/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import Toast from './components/ui/Toast';
import AuthPage from './pages/AuthPage';
import MasterProfileDashboard from './pages/MasterProfileDashboard';
import TailorInterface from './pages/TailorInterface';
import SessionHistory from './pages/SessionHistory';
import ResumeEditor from './pages/ResumeEditor';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
  },
});

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <Toast />
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/profile" element={<MasterProfileDashboard />} />
                  <Route path="/tailor" element={<TailorInterface />} />
                  <Route path="/history" element={<SessionHistory />} />
                  <Route path="/editor/:sessionId" element={<ResumeEditor />} />
                  <Route index element={<Navigate to="/tailor" replace />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
