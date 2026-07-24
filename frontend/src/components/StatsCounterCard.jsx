const TILES = [
  { key: 'total', label: 'Total Issues' },
  { key: 'Pending', label: 'Pending' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Resolved', label: 'Resolved' },
  { key: 'Rejected', label: 'Rejected' },
];

const StatsCounterCard = ({ statusBreakdown, className = 'panel' }) => {
  return (
    <div className={className} style={{ padding: 0 }}>
      <div className="stats-grid">
        {TILES.map((tile) => (
          <div key={tile.key} className="stats-tile">
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
