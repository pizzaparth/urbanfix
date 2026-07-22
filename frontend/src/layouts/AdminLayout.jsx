import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const AdminLayout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="d-flex flex-column min-vh-100 hero-grid-bg">
      {/* Frosted Glass Dark Navy Fixed Top Navbar */}
      <nav
        className="navbar navbar-expand-lg navbar-dark fixed-top py-2 shadow-sm"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
          zIndex: 1050,
        }}
      >
        <div className="container">
          {/* Brand Element */}
          <Link className="navbar-brand fw-bold fs-4 me-4" to="/admin/dashboard" style={{ color: '#FFFFFF', letterSpacing: '-0.02em', fontFamily: 'Poppins, sans-serif' }}>
            UrbanFix
          </Link>

          {/* Custom Styled Mobile Toggler */}
          <button
            className="navbar-toggler border-0 p-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#adminNavbar"
            aria-controls="adminNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Collapsible Navigation Menu */}
          <div className="collapse navbar-collapse mt-3 mt-lg-0" id="adminNavbar">
            <ul className="navbar-nav me-auto mb-3 mb-lg-0 gap-1 gap-lg-2">
              <li className="nav-item">
                <Link
                  className={`nav-link px-3 py-2 rounded-pill fw-semibold text-transition ${
                    isActive('/admin/dashboard') ? 'text-white active-nav-pill' : 'text-slate-300'
                  }`}
                  to="/admin/dashboard"
                  style={{
                    backgroundColor: isActive('/admin/dashboard') ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                    color: isActive('/admin/dashboard') ? '#60A5FA' : '#CBD5E1',
                    fontSize: '0.9rem',
                  }}
                >
                  <i className="bi bi-speedometer2 me-1"></i> Dashboard
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={`nav-link px-3 py-2 rounded-pill fw-semibold text-transition d-inline-flex align-items-center ${
                    isActive('/admin/action') ? 'text-white active-nav-pill' : 'text-slate-300'
                  }`}
                  to="/admin/action"
                  style={{
                    backgroundColor: isActive('/admin/action') ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                    color: isActive('/admin/action') ? '#60A5FA' : '#CBD5E1',
                    fontSize: '0.9rem',
                  }}
                >
                  <i className="bi bi-lightning-charge me-2 text-warning" style={{ marginRight: '0.45rem' }}></i> Action Panel
                </Link>
              </li>
            </ul>

            {/* Action Items: Switch to Public Portal & Admin Session Badge */}
            <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 pt-2 pt-lg-0 ms-auto">
              {/* Portal Switcher Button: Switch to Public Portal */}
              <Link
                to="/"
                className="btn px-3 py-2 rounded-pill fw-bold text-white small d-inline-flex align-items-center justify-content-center text-decoration-none me-lg-2 shadow-sm"
                style={{
                  backgroundColor: '#10B981',
                  borderColor: '#10B981',
                  fontSize: '0.85rem',
                  transition: 'all 0.15s ease-in-out',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.borderColor = '#059669';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#10B981';
                  e.currentTarget.style.borderColor = '#10B981';
                }}
              >
                <i className="bi bi-globe me-2 text-white" style={{ marginRight: '0.45rem' }}></i> Public Portal
              </Link>

              {/* Authenticated Admin Session Badge */}
              <div className="d-flex align-items-center gap-2 p-1 pe-2 rounded-pill" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <span
                  className="text-white small fw-bold px-2 py-1 d-inline-flex align-items-center"
                  style={{ fontSize: '0.85rem' }}
                >
                  <i className="bi bi-person-circle me-1 text-primary fs-6"></i>
                  <span>{user?.name ? user.name.split(' ')[0] : 'Admin'}</span>
                  <span className="badge bg-primary-subtle text-primary ms-2 rounded-pill small" style={{ fontSize: '0.7rem' }}>
                    ADMIN
                  </span>
                </span>
                <button
                  className="btn btn-outline-light btn-xs rounded-circle p-1 d-flex align-items-center justify-content-center"
                  onClick={handleLogout}
                  title="Logout"
                  style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}
                >
                  <i className="bi bi-box-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Console Content Section */}
      <main className="flex-grow-1 pb-4" style={{ paddingTop: '90px' }}>
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
