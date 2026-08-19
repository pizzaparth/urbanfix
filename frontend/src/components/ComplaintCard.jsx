import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight, FileDown } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import { downloadReceipt } from '../utils/downloadReceipt.js';
import { ICON_STROKE } from '../constants/icons.js';

const ComplaintCard = ({ item }) => {
  return (
    <div className="panel flex-col" style={{ height: '100%' }}>
      <div className="flex justify-between items-start flex-wrap gap-2" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="tag">{item.category}</span>
          <span className="text-small flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
            <MapPin size={13} strokeWidth={ICON_STROKE} style={{ color: 'var(--status-rejected)' }} />
            {item.location}
          </span>
        </div>
        <StatusBadge status={item.status} variant="solid" />
      </div>

      <h3 style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-2)' }}>{item.title}</h3>

      <div className="flex items-center gap-4 flex-wrap text-mono-label" style={{ marginBottom: 'var(--space-3)' }}>
        <span>
          ID: <span style={{ color: 'var(--accent)' }}>{item.trackingId}</span>
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={12} strokeWidth={ICON_STROKE} />
          Filed {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="text-small" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', flex: 1 }}>
        {item.description}
      </p>

      <div
        className="flex justify-between items-center flex-wrap gap-2"
        style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-3)' }}
      >
        <Link to={`/track?id=${item.trackingId}`} className="btn btn-secondary btn-sm">
          Track Progress
          <ArrowRight size={14} strokeWidth={ICON_STROKE} />
        </Link>

        {item.status === 'Resolved' && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadReceipt(item.trackingId)}>
            <FileDown size={14} strokeWidth={ICON_STROKE} />
            Download PDF Receipt
          </button>
        )}
      </div>
    </div>
  );
};

export default ComplaintCard;
