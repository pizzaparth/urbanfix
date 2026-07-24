import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, AlertTriangle } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import api, { getUploadsBaseUrl } from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';

const Tracker = () => {
  const [searchParams] = useSearchParams();
  const trackingIdParam = searchParams.get('id') || '';

  const [trackingId, setTrackingId] = useState(trackingIdParam);
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (trackingIdParam) {
      fetchComplaint(trackingIdParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingIdParam]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (trackingId.trim()) {
      fetchComplaint(trackingId.trim());
    }
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div className="panel" style={{ marginBottom: 'var(--space-4)' }}>
          <h2 className="flex items-center gap-2" style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-4)' }}>
            <Search size={18} strokeWidth={ICON_STROKE} style={{ color: 'var(--accent)' }} />
            Track Complaint Progress
          </h2>
          <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
            <input
              type="text"
              className="input flex-1"
              style={{ minWidth: '220px' }}
              placeholder="Enter Tracking ID (e.g. COMP-XXXXX-X)"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
            <AlertTriangle size={16} strokeWidth={ICON_STROKE} style={{ color: 'var(--status-rejected)', flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {complaint && (
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
              <h4 className="text-mono-label" style={{ marginBottom: 'var(--space-2)' }}>Issue Description</h4>
              <p className="text-small" style={{ whiteSpace: 'pre-wrap' }}>{complaint.description}</p>
            </div>

            {complaint.images && complaint.images.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <h4 className="text-mono-label" style={{ marginBottom: 'var(--space-2)' }}>Uploaded Proofs</h4>
                <div className="flex flex-wrap gap-2">
                  {complaint.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={`${getUploadsBaseUrl()}${img}`}
                      alt={`Attachment ${idx + 1}`}
                      style={{
                        height: '110px',
                        width: '110px',
                        objectFit: 'cover',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-mono-label" style={{ marginBottom: 'var(--space-3)' }}>Status Log History</h4>
              <StatusTimeline statusHistory={complaint.statusHistory} />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Tracker;
