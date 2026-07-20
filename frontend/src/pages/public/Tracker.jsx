import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout.jsx';
import api from '../../services/api.js';

const Tracker = () => {
  const [searchParams] = useSearchParams();
  const trackingIdParam = searchParams.get('id') || '';
  
  const [trackingId, setTrackingId] = useState(trackingIdParam);
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (trackingIdParam) {
      fetchComplaint(trackingIdParam);
    }
  }, [trackingIdParam]);

  const fetchComplaint = async (id) => {
    setLoading(true);
    setError('');
    setComplaint(null);
    try {
      const response = await api.get(`/complaints/track/${id}`);
      setComplaint(response.data.complaint);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to locate complaint records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (trackingId.trim()) {
      fetchComplaint(trackingId.trim());
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'bg-warning text-dark';
      case 'In Progress': return 'bg-primary';
      case 'Resolved': return 'bg-success';
      case 'Rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto" style={{ maxWidth: '800px' }}>
        {/* Search header container */}
        <div className="card shadow-sm border-0 rounded-3 p-4 mb-4 bg-white">
          <h2 className="fs-5 fw-bold mb-3 d-flex align-items-center">
            <i className="bi bi-search text-primary me-2"></i>
            <span>Track Complaint Progress</span>
          </h2>
          <form onSubmit={handleSearch} className="d-flex">
            <input
              type="text"
              className="form-control me-2"
              placeholder="Enter Tracking ID (e.g. COMP-XXXXXX)..."
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary px-4 fw-bold" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Error notification alert */}
        {error && (
          <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            <div>{error}</div>
          </div>
        )}

        {/* Audit details card display */}
        {complaint && (
          <div className="card shadow-sm border-0 rounded-3 p-4 bg-white mb-4">
            <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
              <div>
                <h3 className="fs-5 fw-bold text-dark mb-1">{complaint.title}</h3>
                <span className="text-muted small">Tracking ID: <strong>{complaint.trackingId}</strong></span>
              </div>
              <span className={`badge ${getStatusBadgeClass(complaint.status)} px-3 py-2 fs-7 fw-bold`}>
                {complaint.status}
              </span>
            </div>

            <div className="mb-4">
              <h4 className="fs-7 fw-bold text-secondary text-uppercase tracking-wider mb-2">Issue Description</h4>
              <p className="text-secondary bg-light p-3 rounded border mb-0 text-justify" style={{ whiteSpace: 'pre-wrap' }}>
                {complaint.description}
              </p>
            </div>

            {/* Media proofs section */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="mb-4">
                <h4 className="fs-7 fw-bold text-secondary text-uppercase tracking-wider mb-2">Uploaded Proofs</h4>
                <div className="row g-2">
                  {complaint.images.map((img, idx) => (
                    <div key={idx} className="col-4">
                      <img
                        src={`http://localhost:5001${img}`}
                        alt={`Attachment ${idx + 1}`}
                        className="img-fluid rounded border hover-shadow-card"
                        style={{ height: '140px', width: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Timeline Stepper */}
            <div>
              <h4 className="fs-7 fw-bold text-secondary text-uppercase tracking-wider mb-3">Status Log History</h4>
              <div className="timeline-stepper">
                {complaint.statusHistory && complaint.statusHistory.map((step, idx) => {
                  let stepIcon = 'bi-circle';
                  let iconColor = 'warning';
                  
                  if (step.status === 'In Progress') { stepIcon = 'bi-gear-wide-connected'; iconColor = 'primary'; }
                  else if (step.status === 'Resolved') { stepIcon = 'bi-check2-circle'; iconColor = 'success'; }
                  else if (step.status === 'Rejected') { stepIcon = 'bi-x-circle'; iconColor = 'danger'; }
                  else if (step.status === 'Pending') { stepIcon = 'bi-clock'; iconColor = 'warning'; }

                  return (
                    <div key={idx} className="timeline-step-item">
                      <span className={`timeline-step-icon ${iconColor}`}>
                        <i className={`bi ${stepIcon}`}></i>
                      </span>
                      <div className="bg-light p-3 rounded border ms-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="fw-bold mb-0 text-dark small">{step.status}</h6>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {new Date(step.changedAt).toLocaleString()}
                          </small>
                        </div>
                        <p className="text-secondary small mb-0 text-justify">{step.remarks}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Tracker;
