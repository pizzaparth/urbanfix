import React from 'react';

const STATUS_STYLES = {
  Pending: { bg: '#FEF3C7', color: '#B45309', border: '#FCD34D', icon: 'bi-clock-history' },
  'In Progress': { bg: '#CFFAFE', color: '#0E7490', border: '#67E8F9', icon: 'bi-gear-wide-connected' },
  Resolved: { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC', icon: 'bi-check-circle-fill' },
  Rejected: { bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5', icon: 'bi-x-circle-fill' },
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status];

  if (!style) {
    return <span className="badge bg-secondary text-white rounded-pill px-3 py-1">{status}</span>;
  }

  return (
    <span
      className="badge rounded-pill px-3 py-1.5 fw-bold"
      style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}`, fontSize: '0.75rem' }}
    >
      <i className={`bi ${style.icon} me-1`}></i> {status.toUpperCase()}
    </span>
  );
};

export default StatusBadge;
