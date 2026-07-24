import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import api, { getUploadsBaseUrl } from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('Pending');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const fetchComplaintDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/complaints`);
      const found = response.data.complaints.find((c) => c._id === id);
      if (found) {
        setComplaint(found);
        setStatus(found.status);
      } else {
        setError('Complaint details not found.');
      }
    } catch {
      setError('Failed to fetch details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdating(true);

    try {
      await api.patch(`/admin/complaints/${id}/status`, { status, remarks });
      setRemarks('');
      fetchComplaintDetails();
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const isTerminalState = complaint?.status === 'Resolved' || complaint?.status === 'Rejected';

  return (
    <AdminLayout>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={14} strokeWidth={ICON_STROKE} />
        Back to Dashboard
      </button>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="flex justify-center" style={{ padding: 'var(--space-8) 0' }}>
          <span className="spinner" role="status" aria-label="Loading" />
        </div>
      ) : (
        complaint && (
          <div className="grid-12">
            <div className="col-span-7">
              <div className="panel">
                <div
                  className="flex justify-between items-start"
                  style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}
                >
                  <div>
                    <h3 style={{ marginBottom: 'var(--space-1)' }}>{complaint.title}</h3>
                    <span className="text-mono-label">ID: {complaint.trackingId}</span>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h4 className="text-mono-label" style={{ marginBottom: 'var(--space-2)' }}>Citizen Description</h4>
                  <p className="text-small" style={{ whiteSpace: 'pre-wrap' }}>{complaint.description}</p>
                </div>

                {complaint.images && complaint.images.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <h4 className="text-mono-label" style={{ marginBottom: 'var(--space-2)' }}>Supporting Proofs</h4>
                    <div className="flex flex-wrap gap-2">
                      {complaint.images.map((img, idx) => (
                        <a key={idx} href={`${getUploadsBaseUrl()}${img}`} target="_blank" rel="noopener noreferrer">
                          <img
                            src={`${getUploadsBaseUrl()}${img}`}
                            alt={`Upload ${idx + 1}`}
                            style={{ height: '110px', width: '110px', objectFit: 'cover', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-mono-label" style={{ marginBottom: 'var(--space-3)' }}>Status Audit Log</h4>
                  <StatusTimeline statusHistory={complaint.statusHistory} />
                </div>
              </div>
            </div>

            <div className="col-span-5">
              <div className="panel" style={{ marginBottom: 'var(--space-4)' }}>
                <h4 style={{ fontSize: 'var(--text-body)', marginBottom: 'var(--space-2)' }}>Reporter Information</h4>
                <dl style={{ margin: 0 }}>
                  <div className="field-row">
                    <dt>Full Name</dt>
                    <dd>{complaint.citizenId?.name || 'Unknown'}</dd>
                  </div>
                  <div className="field-row">
                    <dt>Email</dt>
                    <dd>{complaint.citizenId?.email || 'N/A'}</dd>
                  </div>
                  <div className="field-row">
                    <dt>Phone</dt>
                    <dd>{complaint.citizenId?.phone || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              <div className="panel">
                <h4 style={{ fontSize: 'var(--text-body)', marginBottom: 'var(--space-3)' }}>Transition Operations</h4>

                {isTerminalState ? (
                  <div className="alert alert-info">
                    <Info size={15} strokeWidth={ICON_STROKE} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    This ticket is resolved/rejected and cannot be updated.
                  </div>
                ) : (
                  <form onSubmit={handleUpdateStatus} className="stack">
                    {updateError && <div className="alert alert-danger">{updateError}</div>}

                    <div className="field">
                      <label>Target Status</label>
                      <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
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

                    <div className="field">
                      <label>Administrative Remarks / Comments</label>
                      <textarea
                        className="input"
                        rows={4}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Input review remarks (min 10 characters)"
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={updating}>
                      {updating ? 'Processing…' : 'Apply Transition'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </AdminLayout>
  );
};

export default ComplaintDetail;
