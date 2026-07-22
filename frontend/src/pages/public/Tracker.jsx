import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import api, { getUploadsBaseUrl } from '../../services/api.js';

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
              <StatusBadge status={complaint.status} />
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
                        src={`${getUploadsBaseUrl()}${img}`}
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
              <StatusTimeline statusHistory={complaint.statusHistory} />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Tracker;
