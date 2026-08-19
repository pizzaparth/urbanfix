import { Clock, Settings2, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { ICON_STROKE } from '../constants/icons.js';

const STATUS_META = {
  Pending: { icon: Clock, color: 'var(--status-pending)' },
  'In Progress': { icon: Settings2, color: 'var(--status-progress)' },
  Resolved: { icon: CheckCircle2, color: 'var(--status-resolved)' },
  Rejected: { icon: XCircle, color: 'var(--status-rejected)' },
};

// Dark solid fill per status for the `variant="solid"` pill (registry cards,
// admin action table) — green/yellow/orange/red, not the accent blue used for
// "In Progress" elsewhere, so every status reads as its own distinct color.
const STATUS_SOLID_BG = {
  Pending: '#713F12',
  'In Progress': '#7C2D12',
  Resolved: '#14532D',
  Rejected: '#7F1D1D',
};

const StatusBadge = ({ status, variant = 'outline' }) => {
  const meta = STATUS_META[status] || { icon: Circle, color: 'var(--text-muted)' };
  const Icon = meta.icon;

  if (variant === 'solid') {
    const bg = STATUS_SOLID_BG[status] || 'var(--gray-600)';
    return (
      <span className="status-pill-solid" style={{ '--status-solid-bg': bg }}>
        <Icon size={13} strokeWidth={ICON_STROKE} />
        {status}
      </span>
    );
  }

  return (
    <span className="status-pill" style={{ '--status-color': meta.color }}>
      <Icon size={13} strokeWidth={ICON_STROKE} />
      {status}
    </span>
  );
};

export default StatusBadge;
