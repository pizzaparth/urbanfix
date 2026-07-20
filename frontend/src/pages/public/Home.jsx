import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout.jsx';
import api from '../../services/api.js';

const Home = () => {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [locationSearch, setLocationSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const categories = ['Sanitation', 'Roads', 'Water Supply', 'Electricity', 'Administrative', 'Other'];

  // Fetch Public Stats and Complaints
  const fetchData = async () => {
    try {
      const statsRes = await api.get('/public/stats');
      setStats(statsRes.data.stats);
      
      let queryPath = '/public/complaints?limit=100';
      if (locationSearch) queryPath += `&location=${encodeURIComponent(locationSearch)}`;
      if (categoryFilter) queryPath += `&category=${encodeURIComponent(categoryFilter)}`;
      if (statusFilter) queryPath += `&status=${encodeURIComponent(statusFilter)}`;

      const complaintsRes = await api.get(queryPath);
      setComplaints(complaintsRes.data.complaints);
    } catch (err) {
      console.error('Error fetching portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [locationSearch, categoryFilter, statusFilter]);

  // Download receipt PDF
  const handleDownloadReceipt = async (trackingId) => {
    try {
      const response = await api.get(`/complaints/download-receipt/${trackingId}`, {
        responseType: 'blob',
      });
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
      const fileLink = document.createElement('a');
      fileLink.href = fileUrl;
      fileLink.setAttribute('download', `Resolution_Receipt_${trackingId}.pdf`);
      document.body.appendChild(fileLink);
      fileLink.click();
      fileLink.remove();
    } catch (err) {
      alert('Failed to download resolution receipt.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'badge-pending';
      case 'In Progress': return 'badge-wip';
      case 'Resolved': return 'badge-resolved';
      case 'Rejected': return 'badge-rejected';
      default: return 'bg-secondary text-white';
    }
  };

  return (
    <MainLayout>
      {/* 1. Repository KPI Overview Counter Section on Top */}
      <div className="row g-3 mb-4">
        <div className="col-md">
          <div className="card border-0 p-3 h-100" style={{ backgroundColor: '#DBEAFE', borderLeft: '5px solid #2563EB' }}>
            <div className="d-flex align-items-center">
              <div className="rounded-3 p-2 bg-white text-primary me-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                <i className="bi bi-folder-fill fs-4" style={{ color: '#2563EB' }}></i>
              </div>
              <div>
                <span className="d-block text-secondary small fw-semibold text-uppercase">Total Issues</span>
                <span className="h3 fw-bold mb-0" style={{ color: '#0F172A' }}>{stats?.statusBreakdown?.total || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md">
          <div className="card border-0 p-3 h-100" style={{ backgroundColor: '#FEF3C7', borderLeft: '5px solid #F59E0B' }}>
            <div className="d-flex align-items-center">
              <div className="rounded-3 p-2 bg-white text-warning me-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                <i className="bi bi-clock-history fs-4" style={{ color: '#F59E0B' }}></i>
              </div>
              <div>
                <span className="d-block text-secondary small fw-semibold text-uppercase">Pending</span>
                <span className="h3 fw-bold mb-0" style={{ color: '#0F172A' }}>{stats?.statusBreakdown?.Pending || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md">
          <div className="card border-0 p-3 h-100" style={{ backgroundColor: '#CFFAFE', borderLeft: '5px solid #06B6D4' }}>
            <div className="d-flex align-items-center">
              <div className="rounded-3 p-2 bg-white text-info me-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                <i className="bi bi-gear-wide-connected fs-4" style={{ color: '#06B6D4' }}></i>
              </div>
              <div>
                <span className="d-block text-secondary small fw-semibold text-uppercase">In Progress</span>
                <span className="h3 fw-bold mb-0" style={{ color: '#0F172A' }}>{stats?.statusBreakdown?.['In Progress'] || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md">
          <div className="card border-0 p-3 h-100" style={{ backgroundColor: '#DCFCE7', borderLeft: '5px solid #22C55E' }}>
            <div className="d-flex align-items-center">
              <div className="rounded-3 p-2 bg-white text-success me-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                <i className="bi bi-check-circle-fill fs-4" style={{ color: '#22C55E' }}></i>
              </div>
              <div>
                <span className="d-block text-secondary small fw-semibold text-uppercase">Resolved</span>
                <span className="h3 fw-bold mb-0" style={{ color: '#0F172A' }}>{stats?.statusBreakdown?.Resolved || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md">
          <div className="card border-0 p-3 h-100" style={{ backgroundColor: '#FEE2E2', borderLeft: '5px solid #EF4444' }}>
            <div className="d-flex align-items-center">
              <div className="rounded-3 p-2 bg-white text-danger me-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                <i className="bi bi-x-octagon-fill fs-4" style={{ color: '#EF4444' }}></i>
              </div>
              <div>
                <span className="d-block text-secondary small fw-semibold text-uppercase">Rejected</span>
                <span className="h3 fw-bold mb-0" style={{ color: '#0F172A' }}>{stats?.statusBreakdown?.Rejected || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* 2. Left Column: Filed Complaints Repository Search & List (Now full width) */}
        <div className="col-12">
          <div className="card border-0 p-4 bg-white mb-4" style={{ border: '1px solid #E2E8F0', borderRadius: '12px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="fs-5 fw-bold mb-0" style={{ color: '#0F172A' }}>
                <i className="bi bi-journal-text me-2 text-primary"></i> Filed Complaints Registry
              </h3>
              <span className="text-muted small">Showing {complaints.length} tickets</span>
            </div>

            {/* Searching Controls */}
            <div className="row g-2 mb-4 p-3 bg-light rounded-3" style={{ border: '1px solid #E2E8F0' }}>
              <div className="col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted small"><i className="bi bi-geo-alt"></i></span>
                  <input
                    type="text"
                    className="form-control border-start-0 small"
                    placeholder="Search by location..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="col-md-4">
                <select
                  className="form-select small"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories (Types)</option>
                  {categories.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <select
                  className="form-select small"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Complaints List */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading registry...</span>
                </div>
              </div>
            ) : complaints.length > 0 ? (
              <div className="row g-3">
                {complaints.map((item) => (
                  <div key={item._id} className="col-12">
                    <div className="card h-100 hover-shadow-card border-light-subtle rounded-3 bg-white p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <span className="badge bg-secondary-subtle text-secondary fw-semibold me-2">{item.category}</span>
                          <span className="text-muted small"><i className="bi bi-geo-alt me-1"></i>{item.location}</span>
                        </div>
                        <span className={`badge ${getStatusBadgeClass(item.status)} fw-bold px-2 py-1`}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <h4 className="card-title fs-6 fw-bold text-dark mb-1">{item.title}</h4>
                      <div className="d-flex align-items-center text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                        <span className="fw-semibold me-3 text-dark">ID: {item.trackingId}</span>
                        <span>Filed: {new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <p className="card-text text-secondary small mb-3 text-justify" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
                        {item.description}
                      </p>

                      <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-auto">
                        <Link to={`/track?id=${item.trackingId}`} className="text-decoration-none fw-semibold small text-primary">
                          <i className="bi bi-eye-fill me-1"></i> Track Progress
                        </Link>
                        {item.status === 'Resolved' && (
                          <button
                            className="btn btn-outline-primary btn-xs fw-semibold px-2 py-1 d-flex align-items-center"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => handleDownloadReceipt(item.trackingId)}
                          >
                            <i className="bi bi-file-earmark-pdf-fill me-1"></i> PDF Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 bg-light rounded-3">
                <i className="bi bi-folder-x fs-1 text-muted d-block mb-2"></i>
                <p className="text-muted mb-0">No complaints match your search query filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
