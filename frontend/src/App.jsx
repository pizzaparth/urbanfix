import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import Home from './pages/public/Home.jsx';
import Registry from './pages/public/Registry.jsx';
import Tracker from './pages/public/Tracker.jsx';
import FileComplaint from './pages/public/FileComplaint.jsx';
import Register from './pages/citizen/Register.jsx';
import VerifyOtp from './pages/citizen/VerifyOtp.jsx';
import Login from './pages/citizen/Login.jsx';
import Dashboard from './pages/citizen/Dashboard.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ComplaintDetail from './pages/admin/ComplaintDetail.jsx';

// Guard wrapper to restrict routes to logged-in users and valid roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="text-center py-5" style={{ marginTop: '10%' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect role mismatches to landing page
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/registry" element={<Registry />} />
        <Route path="/track" element={<Tracker />} />
        <Route path="/file-complaint" element={<FileComplaint />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<Login />} />

        {/* Protected Citizen Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['citizen']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/complaints/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ComplaintDetail />
            </ProtectedRoute>
          }
        />

        {/* Fallback routing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
