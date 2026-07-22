import React from 'react';

const STEP_ICONS = {
  Pending: { icon: 'bi-clock', color: 'warning' },
  'In Progress': { icon: 'bi-gear-wide-connected', color: 'primary' },
  Resolved: { icon: 'bi-check2-circle', color: 'success' },
  Rejected: { icon: 'bi-x-circle', color: 'danger' },
};

const StatusTimeline = ({ statusHistory }) => {
  if (!statusHistory || statusHistory.length === 0) return null;

  return (
    <div className="timeline-stepper">
      {statusHistory.map((step, idx) => {
        const { icon = 'bi-circle', color = 'warning' } = STEP_ICONS[step.status] || {};

        return (
          <div key={idx} className="timeline-step-item">
            <span className={`timeline-step-icon ${color}`}>
              <i className={`bi ${icon}`}></i>
            </span>
            <div className="bg-light p-3 rounded border ms-2">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold mb-0 text-dark small">{step.status}</h6>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {new Date(step.changedAt).toLocaleString()}
                </small>
              </div>
              <p className="text-secondary small mb-0 text-justify">{step.remarks}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
