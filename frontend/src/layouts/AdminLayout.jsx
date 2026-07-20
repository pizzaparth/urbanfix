import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const AdminLayout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <div className="container-fluid p-0 d-flex min-vh-100 bg-light">
      {/* Sidebar navigation */}
      <aside className="bg-dark text-white p-3 d-none d-md-block" style={{ width: '260px' }}>
        <div className="d-flex align-items-center mb-4 pb-2 border-bottom border-secondary">
          <i className="bi bi-shield-lock-fill me-2 fs-3 text-warning"></i>
          <span className="fs-5 fw-bold text-white">Admin Console</span>
        </div>
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-2">
            <Link className="nav-link text-white d-flex align-items-center py-2" to="/admin/dashboard">
              <i className="bi bi-speedometer2 me-2"></i>
              Dashboard
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link text-white d-flex align-items-center py-2" to="/admin/dashboard">
              <i className="bi bi-list-stars me-2"></i>
              Complaints List
            </Link>
          </li>
          <li className="nav-item mb-2 mt-4">
            <Link className="nav-link text-white d-flex align-items-center py-2" to="/">
              <i className="bi bi-globe me-2 text-info"></i>
              View Public Portal
            </Link>
          </li>
        </ul>
      </aside>

      {/* Main console content wrapper */}
      <div className="d-flex flex-column flex-grow-1">
        {/* Top administration bar */}
        <header className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm px-4 py-3">
          <div className="container-fluid p-0 justify-content-between">
            <span className="navbar-brand d-md-none fw-bold">Admin Console</span>
            <div className="d-flex align-items-center ms-auto">
              <span className="me-3 text-secondary d-none d-sm-inline">
                Welcome, <strong>{user?.name || 'Administrator'}</strong>
              </span>
              <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1"></i> Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <main className="flex-grow-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
