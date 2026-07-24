const TILES = [
  { key: 'total', label: 'Total Issues', area: 'total' },
  { key: 'Pending', label: 'Pending', area: 'pending' },
  { key: 'In Progress', label: 'In Progress', area: 'progress' },
  { key: 'Resolved', label: 'Resolved', area: 'resolved' },
  { key: 'Rejected', label: 'Rejected', area: 'rejected' },
];

const StatsCounterCard = ({ statusBreakdown, className = 'panel' }) => {
  return (
    <div className={className} style={{ padding: 0 }}>
      <div className="stats-grid">
        {TILES.map((tile) => (
          <div key={tile.key} className={`stats-tile stats-tile--${tile.area}`}>
            <span className="text-mono-label" style={{ marginBottom: 'var(--space-1)' }}>{tile.label}</span>
            <span className="text-mono" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {statusBreakdown?.[tile.key] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsCounterCard;
