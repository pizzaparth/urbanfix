import React from 'react';

const TILES = [
  { key: 'total', label: 'Total Issues', color: '#2563EB' },
  { key: 'Pending', label: 'Pending', color: '#F59E0B' },
  { key: 'In Progress', label: 'In Progress', color: '#06B6D4' },
  { key: 'Resolved', label: 'Resolved', color: '#22C55E' },
  { key: 'Rejected', label: 'Rejected', color: '#EF4444' },
];

const StatsCounterCard = ({ statusBreakdown, className = 'card glass-card py-4 px-3 mb-5' }) => {
  return (
    <div className={className}>
      <div className="row g-4 text-center justify-content-center align-items-center">
        {TILES.map((tile) => (
          <div className="col-12 col-md" key={tile.key}>
            <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
              <span
                className="fw-bold text-uppercase mb-1"
                style={{ color: '#000000', fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', letterSpacing: '0.05em' }}
              >
                {tile.label}
              </span>
              <span className="display-6 fw-bold mb-0" style={{ color: tile.color, fontFamily: 'Inter, sans-serif' }}>
                {statusBreakdown?.[tile.key] || 0}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsCounterCard;
