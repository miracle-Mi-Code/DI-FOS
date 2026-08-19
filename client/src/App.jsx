import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import DocumentUploadPage from './pages/student/DocumentUploadPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import SubmissionReviewPage from './pages/admin/SubmissionReviewPage';

// Protected Route Wrapper for Students
const StudentRoute = ({ children }) => {
  const { isAuthenticated, isStudent, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isStudent) return <Navigate to="/admin/dashboard" replace />;
  return children;
};

// Protected Route Wrapper for Staff & Admin
const StaffRoute = ({ children }) => {
  const { isAuthenticated, isStaff, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/student/dashboard" replace />;
  return children;
};

// Root Redirect Helper
const HomeRedirect = () => {
  const { isAuthenticated, isStaff, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isStaff ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/student/dashboard" replace />;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Root */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Public Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Student Portal */}
              <Route
                path="/student/dashboard"
                element={
                  <StudentRoute>
                    <StudentDashboard />
                  </StudentRoute>
                }
              />
              <Route
                path="/student/upload"
                element={
                  <StudentRoute>
                    <DocumentUploadPage />
                  </StudentRoute>
                }
              />

              {/* Staff / Admin Portal */}
              <Route
                path="/admin/dashboard"
                element={
                  <StaffRoute>
                    <AdminDashboard />
                  </StaffRoute>
                }
              />
              <Route
                path="/admin/submissions/:id"
                element={
                  <StaffRoute>
                    <SubmissionReviewPage />
                  </StaffRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
