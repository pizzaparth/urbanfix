import { useState, useEffect } from 'react';
import { CirclePlus, FileDown, FilePlus } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Modal from '../../components/Modal.jsx';
import { CATEGORIES } from '../../constants/categories.js';
import { downloadReceipt } from '../../utils/downloadReceipt.js';
import api from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';

const Dashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: CATEGORIES[0] });
  const [files, setFiles] = useState([]);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const response = await api.get('/complaints/my-complaints');
      setComplaints(response.data.complaints);
    } catch {
      setError('Failed to fetch your complaint records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

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
      setFormData({ title: '', description: '', category: CATEGORIES[0] });
      setFiles([]);
      fetchMyComplaints();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div
        className="flex justify-between items-center"
        style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}
      >
        <h2 style={{ fontSize: 'var(--text-h2)' }}>My Complaint Registry</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <CirclePlus size={16} strokeWidth={ICON_STROKE} />
          File New Complaint
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center" style={{ padding: 'var(--space-8) 0' }}>
          <span className="spinner" role="status" aria-label="Loading records" />
        </div>
      ) : complaints.length > 0 ? (
        <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Category</th>
                <th>Title</th>
                <th>Status</th>
                <th>Last Update</th>
                <th style={{ textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((item) => (
                <tr key={item._id}>
                  <td className="text-mono">{item.trackingId}</td>
                  <td>
                    <span className="tag">{item.category}</span>
                  </td>
                  <td style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="text-mono-label">{new Date(item.updatedAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    {item.status === 'Resolved' ? (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadReceipt(item.trackingId)}>
                        <FileDown size={14} strokeWidth={ICON_STROKE} />
                        PDF
                      </button>
                    ) : (
                      <span className="text-small text-muted">Not resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <FilePlus size={32} strokeWidth={ICON_STROKE} style={{ color: 'var(--text-muted)', margin: '0 auto var(--space-3)' }} />
          <p className="text-small">You have not submitted any complaints yet.</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="File a New Complaint" size="md">
        <form onSubmit={handleFormSubmit} className="stack">
          {submitError && <div className="alert alert-danger">{submitError}</div>}

          <div className="grid-12">
            <div className="col-span-8 field">
              <label>Complaint Subject / Title</label>
              <input type="text" name="title" className="input" value={formData.title} onChange={handleInputChange} required />
            </div>
            <div className="col-span-4 field">
              <label>Issue Category</label>
              <select name="category" className="input" value={formData.category} onChange={handleInputChange}>
                {CATEGORIES.map((c, idx) => (
                  <option key={idx} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Detailed Description</label>
            <textarea name="description" rows={5} className="input" value={formData.description} onChange={handleInputChange} required />
          </div>

          <div className="field">
            <label>Upload Supporting Proofs (Max 3 Images, Max 5MB each)</label>
            <input type="file" className="input" multiple accept="image/*" onChange={handleFileChange} style={{ paddingBlock: 'var(--space-1)' }} />
          </div>

          <div className="flex justify-end gap-2" style={{ paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
};

export default Dashboard;
