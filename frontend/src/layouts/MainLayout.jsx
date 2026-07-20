import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const MainLayout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Main Navigation Header */}
      <nav className="navbar navbar-expand-lg navbar-dark shadow-sm py-3" style={{ backgroundColor: '#0F172A', borderBottom: '1px solid #334155' }}>
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center fw-bold" to="/">
            <span>UrbanFix</span>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link text-white" to="/">Transparency Portal</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="/track">Track Complaint</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="/file-complaint">File a Complaint</Link>
              </li>
            </ul>
            
            <div className="d-flex align-items-center">
              {user ? (
                <>
                  <Link className="btn btn-outline-light me-3 btn-sm" to={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"}>
                    <i className="bi bi-person-fill me-1"></i> {user.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                  </Link>
                  <button className="btn btn-light btn-sm" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-1"></i> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link className="btn btn-outline-light btn-sm" to="/admin/login">Admin Login</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow-1 py-4 bg-light">
        <div className="container">
          {children}
        </div>
      </main>

      {/* System Footer */}
      <footer className="bg-dark text-light py-4 mt-auto">
        <div className="container text-center">
          <p className="mb-1">&copy; 2026 UrbanFix - Public Transparency Portal.</p>
          <small className="text-secondary">University Project Exhibition - DSN2098</small>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
