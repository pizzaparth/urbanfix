import { Clock, Settings2, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { ICON_STROKE } from '../constants/icons.js';

const STEP_ICONS = {
  Pending: { icon: Clock, color: 'warning' },
  'In Progress': { icon: Settings2, color: 'primary' },
  Resolved: { icon: CheckCircle2, color: 'success' },
  Rejected: { icon: XCircle, color: 'danger' },
};

const StatusTimeline = ({ statusHistory }) => {
  if (!statusHistory || statusHistory.length === 0) return null;

  return (
    <div className="timeline-stepper">
      {statusHistory.map((step, idx) => {
        const { icon: Icon = Circle, color = 'warning' } = STEP_ICONS[step.status] || {};

        return (
          <div key={idx} className="timeline-step-item">
            <span className={`timeline-step-icon ${color}`}>
              <Icon size={13} strokeWidth={ICON_STROKE} />
            </span>
            <div className="panel" style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-1)' }}>
                <span className="text-small" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {step.status}
                </span>
                <span className="text-mono-label">{new Date(step.changedAt).toLocaleString()}</span>
              </div>
              <p className="text-small text-secondary" style={{ margin: 0 }}>
                {step.remarks}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
