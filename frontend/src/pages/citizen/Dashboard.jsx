import React, { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout.jsx';
import api from '../../services/api.js';

const Dashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Submit Form States
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'Sanitation' });
  const [files, setFiles] = useState([]);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = ['Sanitation', 'Roads', 'Water Supply', 'Electricity', 'Administrative', 'Other'];

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const response = await api.get('/complaints/my-complaints');
      setComplaints(response.data.complaints);
    } catch (err) {
      setError('Failed to fetch your complaint records.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 3) {
      setSubmitError('You can upload at most 3 images.');
      setFiles([]);
    } else {
      setSubmitError('');
      setFiles(selectedFiles);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    files.forEach((file) => {
      data.append('images', file);
    });

    try {
      await api.post('/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowModal(false);
      setFormData({ title: '', description: '', category: 'Sanitation' });
      setFiles([]);
      fetchMyComplaints();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

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

  const getStatusBadge = (status) => {
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
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <h2 className="fs-4 fw-bold text-dark mb-0">My Complaint Registry</h2>
        <button className="btn btn-primary d-flex align-items-center fw-bold" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle me-1"></i> File New Complaint
        </button>
      </div>

      {error && <div className="alert alert-danger border-0 shadow-sm mb-4">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading records...</span>
          </div>
        </div>
      ) : complaints.length > 0 ? (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4">Tracking ID</th>
                  <th>Category</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Last Update</th>
                  <th className="text-end px-4">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 fw-semibold">{item.trackingId}</td>
                    <td><span className="badge bg-secondary-subtle text-secondary">{item.category}</span></td>
                    <td className="text-truncate" style={{ maxWidth: '250px' }}>{item.title}</td>
                    <td><span className={`badge ${getStatusBadge(item.status)}`}>{item.status}</span></td>
                    <td>{new Date(item.updatedAt).toLocaleDateString()}</td>
                    <td className="text-end px-4">
                      {item.status === 'Resolved' ? (
                        <button
                          className="btn btn-outline-success btn-xs fw-semibold px-2 py-1"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => handleDownloadReceipt(item.trackingId)}
                        >
                          <i className="bi bi-file-earmark-pdf-fill me-1"></i> Download PDF
                        </button>
                      ) : (
                        <span className="text-muted small italic">Not Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-5 bg-white border rounded shadow-sm">
          <i className="bi bi-file-earmark-plus fs-1 text-muted d-block mb-2"></i>
          <p className="text-muted">You have not submitted any complaints yet.</p>
        </div>
      )}

      {/* Submit Complaint Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">File a New Complaint</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  {submitError && <div className="alert alert-danger border-0 small mb-3">{submitError}</div>}

                  <div className="row g-3">
                    <div className="col-md-8">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-secondary">Complaint Subject / Title</label>
                        <input
                          type="text"
                          name="title"
                          className="form-control"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-secondary">Issue Category</label>
                        <select name="category" className="form-select" value={formData.category} onChange={handleInputChange}>
                          {categories.map((c, idx) => (
                            <option key={idx} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Detailed Description</label>
                    <textarea
                      name="description"
                      rows={5}
                      className="form-control"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Upload Supporting Proofs (Max 3 Images, Max 5MB each)</label>
                    <input
                      type="file"
                      className="form-control"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm px-3" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Dashboard;
