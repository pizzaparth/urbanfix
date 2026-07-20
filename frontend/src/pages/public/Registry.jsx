import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout.jsx';
import api from '../../services/api.js';

const Registry = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [locationSearch, setLocationSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const categories = ['Road Damage', 'Water Leakage', 'Garbage', 'Street Light', 'Administrative', 'Other'];

  // Fetch Redacted Public Complaints Registry
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      let queryPath = '/public/complaints?limit=100';
      if (locationSearch) queryPath += `&location=${encodeURIComponent(locationSearch)}`;
      if (categoryFilter) queryPath += `&category=${encodeURIComponent(categoryFilter)}`;
      if (statusFilter) queryPath += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await api.get(queryPath);
      setComplaints(res.data.complaints);
    } catch (err) {
      console.error('Error fetching registry data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [locationSearch, categoryFilter, statusFilter]);

  // Download resolution PDF receipt
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
      <div className="py-4">
        {/* Page Title Header */}
        <div className="mb-4">
          <h1 className="h3 fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
            Public Complaints Registry
          </h1>
          <p className="text-secondary small mb-0">
            Browse all publicly filed municipal issues. Citizen details are strictly redacted for privacy.
          </p>
        </div>

        {/* Search & Filter Controls Card */}
        <div className="card border-0 p-4 bg-white mb-4" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(15,23,42,.04)' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="fs-5 fw-bold mb-0" style={{ color: '#0F172A' }}>
              <i className="bi bi-journal-text me-2 text-primary"></i> Search & Filter Registry
            </h3>
            <span className="text-muted small">Showing {complaints.length} tickets</span>
          </div>

          <div className="row g-2 p-3 bg-light rounded-3" style={{ border: '1px solid #E2E8F0' }}>
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted small">
                  <i className="bi bi-geo-alt"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 small"
                  placeholder="Search by area/location..."
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
        </div>

        {/* Complaints Listing Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading registry tickets...</span>
            </div>
          </div>
        ) : complaints.length > 0 ? (
          <div className="row g-3">
            {complaints.map((item) => (
              <div key={item._id} className="col-12">
                <div className="card h-100 hover-shadow-card border-light-subtle rounded-3 bg-white p-3" style={{ border: '1px solid #E2E8F0' }}>
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
                        <i className="bi bi-file-earmark-pdf-fill me-1"></i> Download PDF Receipt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 bg-white border rounded-3" style={{ borderColor: '#E2E8F0' }}>
            <i className="bi bi-folder-x fs-1 text-muted d-block mb-2"></i>
            <p className="text-muted mb-0">No complaints match your selected search query filters.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Registry;
