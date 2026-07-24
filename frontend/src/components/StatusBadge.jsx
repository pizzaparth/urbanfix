import { Clock, Settings2, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { ICON_STROKE } from '../constants/icons.js';

const STATUS_META = {
  Pending: { icon: Clock, color: 'var(--status-pending)' },
  'In Progress': { icon: Settings2, color: 'var(--status-progress)' },
  Resolved: { icon: CheckCircle2, color: 'var(--status-resolved)' },
  Rejected: { icon: XCircle, color: 'var(--status-rejected)' },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { icon: Circle, color: 'var(--text-muted)' };
  const Icon = meta.icon;

  return (
    <span className="status-pill" style={{ '--status-color': meta.color }}>
      <Icon size={13} strokeWidth={ICON_STROKE} />
      {status}
    </span>
  );
};

export default StatusBadge;
