import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const MainLayout = ({ children }) => {
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
          <Link className="navbar-brand fw-bold fs-4 me-4" to="/" style={{ color: '#FFFFFF', letterSpacing: '-0.02em', fontFamily: 'Poppins, sans-serif' }}>
            UrbanFix
          </Link>

          {/* Custom Styled Mobile Toggler */}
          <button
            className="navbar-toggler border-0 p-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Collapsible Navigation Menu */}
          <div className="collapse navbar-collapse mt-3 mt-lg-0" id="mainNavbar">
            <ul className="navbar-nav me-auto mb-3 mb-lg-0 gap-1 gap-lg-2">
              <li className="nav-item">
                <Link
                  className={`nav-link px-3 py-2 rounded-pill fw-semibold text-transition ${
                    isActive('/') ? 'text-white active-nav-pill' : 'text-slate-300'
                  }`}
                  to="/"
                  style={{
                    backgroundColor: isActive('/') ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                    color: isActive('/') ? '#60A5FA' : '#CBD5E1',
                    fontSize: '0.9rem',
                  }}
                >
                  <i className="bi bi-house-door me-1"></i> Transparency Portal
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={`nav-link px-3 py-2 rounded-pill fw-semibold text-transition d-inline-flex align-items-center ${
                    isActive('/registry') ? 'text-white active-nav-pill' : 'text-slate-300'
                  }`}
                  to="/registry"
                  style={{
                    backgroundColor: isActive('/registry') ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                    color: isActive('/registry') ? '#60A5FA' : '#CBD5E1',
                    fontSize: '0.9rem',
                  }}
                >
                  <img src="/notebook-test.svg" alt="" style={{ width: '18px', height: '18px' }} className="me-1" /> Public Registry
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={`nav-link px-3 py-2 rounded-pill fw-semibold text-transition d-inline-flex align-items-center ${
                    isActive('/track') ? 'text-white active-nav-pill' : 'text-slate-300'
                  }`}
                  to="/track"
                  style={{
                    backgroundColor: isActive('/track') ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                    color: isActive('/track') ? '#60A5FA' : '#CBD5E1',
                    fontSize: '0.9rem',
                  }}
                >
                  <img src="/search.svg" alt="" style={{ width: '18px', height: '18px' }} className="me-1" /> Track Complaint
                </Link>
              </li>
            </ul>

            {/* Right Action Items: Prominent File Complaint CTA Button & Session / Admin Switcher */}
            <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 pt-2 pt-lg-0">
              {/* Prominent Call To Action (CTA) Button */}
              <Link
                to="/file-complaint"
                className="btn btn-primary px-3 py-2 rounded-pill fw-bold d-inline-flex align-items-center justify-content-center shadow-sm text-decoration-none me-lg-2"
                style={{
                  backgroundColor: '#2563EB',
                  border: 'none',
                  fontSize: '0.9rem',
                  transition: 'transform 0.15s ease, background-color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
              >
                <img src="/circle-plus.svg" alt="" style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }} className="me-1" /> File a Complaint
              </Link>

              {/* Show Switch to Admin Panel button ONLY when logged in as Admin */}
              {user && user.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className="btn btn-warning px-3 py-2 rounded-pill fw-bold text-dark small d-inline-flex align-items-center justify-content-center text-decoration-none me-lg-2"
                  style={{ fontSize: '0.85rem' }}
                >
                  <i className="bi bi-shield-lock-fill me-2" style={{ marginRight: '0.45rem' }}></i> Admin Panel
                </Link>
              )}

              {/* User / Admin Session Badge & Logout Button (or Admin Login when unauthenticated) */}
              {user ? (
                <div className="d-flex align-items-center gap-2 p-1 pe-2 rounded-pill" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span
                    className="text-white small fw-bold px-2 py-1 d-inline-flex align-items-center"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <i className="bi bi-person-circle me-1 text-primary fs-6"></i>
                    <span>{user.name.split(' ')[0]}</span>
                    <span className="badge bg-primary-subtle text-primary ms-2 rounded-pill small" style={{ fontSize: '0.7rem' }}>
                      {user.role.toUpperCase()}
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
              ) : (
                <Link
                  to="/admin/login"
                  className="btn btn-outline-light px-3 py-2 rounded-pill fw-semibold small text-decoration-none"
                  style={{ fontSize: '0.85rem', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <i className="bi bi-shield-lock me-1"></i> Admin Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow-1 pb-4" style={{ paddingTop: '90px' }}>
        <div className="container">{children}</div>
      </main>

      {/* System Footer */}
      <footer className="bg-dark text-light py-4 mt-auto" style={{ backgroundColor: '#0F172A', borderTop: '1px solid #1E293B' }}>
        <div className="container text-center">
          <p className="mb-1 small">&copy; 2026 UrbanFix - Public Transparency Portal.</p>
          <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
            University Project Exhibition - DSN2098
          </small>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
