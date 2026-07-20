import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import api from '../../services/api.js';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Failed to load system overview metrics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      {/* 1. Repository Overview Counter Section (Top Statistic Card Container - Same as Homepage) */}
      {stats && (
        <div className="py-4 px-3 mb-5 rounded-3 bg-white" style={{ border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,23,42,.04)' }}>
          <div className="row g-4 text-center justify-content-center align-items-center">
            <div className="col-12 col-md">
              <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
                <span
                  className="fw-bold text-uppercase mb-1"
                  style={{
                    color: '#000000',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.85rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  Total Issues
                </span>
                <span className="display-6 fw-bold mb-0" style={{ color: '#2563EB', fontFamily: 'Inter, sans-serif' }}>
                  {stats.statusBreakdown.total || 0}
                </span>
              </div>
            </div>

            <div className="col-12 col-md">
              <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
                <span
                  className="fw-bold text-uppercase mb-1"
                  style={{
                    color: '#000000',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.85rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  Pending
                </span>
                <span className="display-6 fw-bold mb-0" style={{ color: '#F59E0B', fontFamily: 'Inter, sans-serif' }}>
                  {stats.statusBreakdown.Pending || 0}
                </span>
              </div>
            </div>

            <div className="col-12 col-md">
              <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
                <span
                  className="fw-bold text-uppercase mb-1"
                  style={{
                    color: '#000000',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.85rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  In Progress
                </span>
                <span className="display-6 fw-bold mb-0" style={{ color: '#06B6D4', fontFamily: 'Inter, sans-serif' }}>
                  {stats.statusBreakdown['In Progress'] || 0}
                </span>
              </div>
            </div>

            <div className="col-12 col-md">
              <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
                <span
                  className="fw-bold text-uppercase mb-1"
                  style={{
                    color: '#000000',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.85rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  Resolved
                </span>
                <span className="display-6 fw-bold mb-0" style={{ color: '#22C55E', fontFamily: 'Inter, sans-serif' }}>
                  {stats.statusBreakdown.Resolved || 0}
                </span>
              </div>
            </div>

            <div className="col-12 col-md">
              <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
                <span
                  className="fw-bold text-uppercase mb-1"
                  style={{
                    color: '#000000',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.85rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  Rejected
                </span>
                <span className="display-6 fw-bold mb-0" style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
                  {stats.statusBreakdown.Rejected || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Section Heading Below Top Statistic Cards */}
      <h2
        className="display-6 fw-bold text-center mb-4"
        style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}
      >
        System Overview & Management
      </h2>

      {error && <div className="alert alert-danger border-0 shadow-sm mb-4">{error}</div>}

    </AdminLayout>
  );
};

export default AdminDashboard;
