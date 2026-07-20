import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import api from '../../services/api.js';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status modify states
  const [status, setStatus] = useState('Pending');
  const [remarks, setRemarks] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const fetchComplaintDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/complaints`);
      // Filter list locally to find target complaint
      const found = response.data.complaints.find(c => c._id === id);
      if (found) {
        setComplaint(found);
        setStatus(found.status);
        setIsPublic(found.isPublic);
      } else {
        setError('Complaint details not found.');
      }
    } catch (err) {
      setError('Failed to fetch details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdating(true);

    try {
      await api.patch(`/admin/complaints/${id}/status`, {
        status,
        remarks,
        isPublic,
      });
      setRemarks('');
      fetchComplaintDetails();
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'Pending': return 'bg-warning text-dark';
      case 'In Progress': return 'bg-primary';
      case 'Resolved': return 'bg-success';
      case 'Rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const isTerminalState = complaint?.status === 'Resolved' || complaint?.status === 'Rejected';

  return (
    <AdminLayout>
      <div className="mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/admin/dashboard')}>
          <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
        </button>
      </div>

      {error && <div className="alert alert-danger border-0 shadow-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : complaint && (
        <div className="row g-4">
          {/* Main Info Card */}
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 rounded-3 p-4 bg-white mb-4">
              <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
                <div>
                  <h3 className="fs-5 fw-bold mb-1 text-dark">{complaint.title}</h3>
                  <span className="text-muted small">Tracking ID: <strong>{complaint.trackingId}</strong></span>
                </div>
                <span className={`badge ${getStatusBadge(complaint.status)} px-3 py-2 fs-7 fw-bold`}>
                  {complaint.status}
                </span>
              </div>

              <div className="mb-4">
                <h4 className="fs-7 fw-bold text-secondary text-uppercase tracking-wider">Citizen Description</h4>
                <p className="bg-light p-3 rounded border text-secondary small text-justify" style={{ whiteSpace: 'pre-wrap' }}>
                  {complaint.description}
                </p>
              </div>

              {/* Media uploads */}
              {complaint.images && complaint.images.length > 0 && (
                <div className="mb-4">
                  <h4 className="fs-7 fw-bold text-secondary text-uppercase tracking-wider mb-2">Supporting Proofs</h4>
                  <div className="row g-2">
                    {complaint.images.map((img, idx) => (
                      <div key={idx} className="col-4">
                        <a href={`http://localhost:5001${img}`} target="_blank" rel="noopener noreferrer">
                          <img
                            src={`http://localhost:5001${img}`}
                            alt={`Upload ${idx + 1}`}
                            className="img-fluid rounded border hover-shadow-card"
                            style={{ height: '140px', width: '100%', objectFit: 'cover' }}
                          />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status history timeline */}
              <div>
                <h4 className="fs-7 fw-bold text-secondary text-uppercase tracking-wider mb-3">Status Audit Log</h4>
                <div className="timeline-stepper">
                  {complaint.statusHistory.map((step, idx) => (
                    <div key={idx} className="timeline-step-item">
                      <span className="timeline-step-icon">
                        <i className="bi bi-record-fill text-secondary"></i>
                      </span>
                      <div className="bg-light p-3 rounded border ms-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold small">{step.status}</span>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(step.changedAt).toLocaleString()}</small>
                        </div>
                        <p className="text-secondary small mb-0 text-justify">{step.remarks}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions panel */}
          <div className="col-lg-5">
            {/* Citizen Details Card */}
            <div className="card shadow-sm border-0 rounded-3 p-4 bg-white mb-4">
              <h4 className="fs-6 fw-bold text-dark mb-3 border-bottom pb-2">Reporter Information</h4>
              <div className="mb-2">
                <span className="text-muted small d-block">Full Name</span>
                <span className="fw-semibold">{complaint.citizenId?.name || 'Unknown'}</span>
              </div>
              <div className="mb-2">
                <span className="text-muted small d-block">Email Address</span>
                <span>{complaint.citizenId?.email || 'N/A'}</span>
              </div>
              <div className="mb-0">
                <span className="text-muted small d-block">Phone Number</span>
                <span>{complaint.citizenId?.phone || 'N/A'}</span>
              </div>
            </div>

            {/* Transition operation controls */}
            <div className="card shadow-sm border-0 rounded-3 p-4 bg-white">
              <h4 className="fs-6 fw-bold text-dark mb-3 border-bottom pb-2">Transition Operations</h4>
              
              {isTerminalState ? (
                <div className="alert alert-info border-0 small mb-0">
                  <i className="bi bi-info-circle me-1"></i> This ticket is resolved/rejected and cannot be updated.
                </div>
              ) : (
                <form onSubmit={handleUpdateStatus}>
                  {updateError && <div className="alert alert-danger border-0 small mb-3">{updateError}</div>}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Target Status</label>
                    <select className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                      {complaint.status === 'Pending' && (
                        <>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Rejected">Rejected</option>
                        </>
                      )}
                      {complaint.status === 'In Progress' && (
                        <>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Rejected">Rejected</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="mb-3 form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="publishSwitch"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <label className="form-check-label small fw-semibold text-secondary" htmlFor="publishSwitch">
                      Publish to Transparency Portal
                    </label>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Administrative Remarks / Comments</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={4}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Input review remarks (Min 10 characters)..."
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary btn-sm w-100 fw-bold" disabled={updating}>
                    {updating ? 'Processing...' : 'Apply Transition'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ComplaintDetail;
