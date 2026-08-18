import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { QueueProvider } from './contexts/QueueContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { LandingPage } from './pages/Landing/LandingPage';
import { AuthPage } from './pages/Auth/AuthPage';
import { RoleSelectPage } from './pages/Auth/RoleSelectPage';
import { PatientDashboard } from './pages/Patient/PatientDashboard';
import { StaffDashboard } from './pages/Staff/StaffDashboard';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { DisplayBoard } from './pages/Display/DisplayBoard';
import { JoinPage } from './pages/Join/JoinPage';
import { ProfilePage } from './pages/Profile/ProfilePage';

// Protected Route Guard for role-based sections with strict isolation
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001B4B] flex items-center justify-center text-[#97CADB]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#018ABE]" />
      </div>
    );
  }

  // If user is not authenticated, redirect to /auth
  if (!user) {
    localStorage.setItem('flowiq_return_url', location.pathname);
    return <Navigate to="/auth" replace />;
  }

  // Strict role isolation: if allowedRoles is specified, only permitted roles can enter
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'patient') {
      return <Navigate to="/patient" replace />;
    } else if (user.role === 'staff') {
      return <Navigate to="/staff" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/role-select" replace />;
  }

  return <>{children}</>;
};

// Layout wrapper that provides standard Navbar and Footer
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#001B4B] text-slate-100 font-sans selection:bg-[#018ABE] selection:text-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueueProvider>
          <Routes>
            {/* TV Standalone Display (No Header/Footer Chrome) */}
            <Route path="/display" element={<DisplayBoard />} />

            {/* Application Pages with Navigation & Footer Layout */}
            <Route
              path="/"
              element={
                <AppLayout>
                  <LandingPage />
                </AppLayout>
              }
            />

            <Route
              path="/auth"
              element={
                <AppLayout>
                  <AuthPage />
                </AppLayout>
              }
            />

            <Route
              path="/role-select"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <RoleSelectPage />
                  </ProtectedRoute>
                </AppLayout>
              }
            />

            <Route
              path="/patient"
              element={
                <AppLayout>
                  <ProtectedRoute allowedRoles={['patient', 'admin']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                </AppLayout>
              }
            />

            <Route
              path="/staff"
              element={
                <AppLayout>
                  <ProtectedRoute allowedRoles={['staff', 'admin']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                </AppLayout>
              }
            />

            <Route
              path="/admin"
              element={
                <AppLayout>
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                </AppLayout>
              }
            />

            <Route
              path="/join"
              element={
                <AppLayout>
                  <JoinPage />
                </AppLayout>
              }
            />

            <Route
              path="/profile"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                </AppLayout>
              }
            />

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </QueueProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
