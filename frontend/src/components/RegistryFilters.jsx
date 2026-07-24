import { NotebookText, Search, CircleX, RotateCcw } from 'lucide-react';
import { CATEGORIES } from '../constants/categories.js';
import { ICON_STROKE } from '../constants/icons.js';

const RegistryFilters = ({
  locationSearch,
  setLocationSearch,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  resultCount,
  onResetAll,
}) => {
  const hasActiveFilters = Boolean(locationSearch || categoryFilter || statusFilter || sortBy !== 'newest');

  return (
    <div className="panel" style={{ marginBottom: 'var(--space-5)' }}>
      <div className="flex justify-between items-center flex-wrap gap-2" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 className="flex items-center gap-2" style={{ fontSize: '1.0625rem' }}>
          <NotebookText size={18} strokeWidth={ICON_STROKE} />
          Search &amp; Filter Registry
        </h2>

        <div className="flex items-center flex-wrap gap-2">
          <select className="input btn-sm" style={{ width: 'auto', height: '32px' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          <span className="text-mono-label">{resultCount} records</span>

          {hasActiveFilters && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onResetAll}>
              <RotateCcw size={14} strokeWidth={ICON_STROKE} />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid-12">
        <div className="col-span-4 field">
          <label>Ward / Area Location</label>
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              strokeWidth={ICON_STROKE}
              style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 'var(--space-7)', paddingRight: locationSearch ? 'var(--space-7)' : undefined }}
              placeholder="Ward, area, or landmark"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
            />
            {locationSearch && (
              <button
                type="button"
                onClick={() => setLocationSearch('')}
                title="Clear search text"
                style={{
                  position: 'absolute',
                  right: 'var(--space-2)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <CircleX size={15} strokeWidth={ICON_STROKE} />
              </button>
            )}
          </div>
        </div>

        <div className="col-span-4 field">
          <label>Category</label>
          <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c, idx) => (
              <option key={idx} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-4 field">
          <label>Status</label>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div
          className="flex flex-wrap items-center gap-2"
          style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}
        >
          <span className="text-mono-label">Active:</span>

          {locationSearch && (
            <span className="tag flex items-center gap-1">
              Location: {locationSearch}
              <button type="button" className="modal-close" style={{ padding: 0 }} onClick={() => setLocationSearch('')}>
                <CircleX size={13} strokeWidth={ICON_STROKE} />
              </button>
            </span>
          )}

          {categoryFilter && (
            <span className="tag flex items-center gap-1">
              Category: {categoryFilter}
              <button type="button" className="modal-close" style={{ padding: 0 }} onClick={() => setCategoryFilter('')}>
                <CircleX size={13} strokeWidth={ICON_STROKE} />
              </button>
            </span>
          )}

          {statusFilter && (
            <span className="tag flex items-center gap-1">
              Status: {statusFilter}
              <button type="button" className="modal-close" style={{ padding: 0 }} onClick={() => setStatusFilter('')}>
                <CircleX size={13} strokeWidth={ICON_STROKE} />
              </button>
            </span>
          )}

          {sortBy !== 'newest' && (
            <span className="tag flex items-center gap-1">
              Sort: {sortBy === 'oldest' ? 'Oldest First' : 'Newest First'}
              <button type="button" className="modal-close" style={{ padding: 0 }} onClick={() => setSortBy('newest')}>
                <CircleX size={13} strokeWidth={ICON_STROKE} />
              </button>
            </span>
          )}

          <button type="button" className="btn btn-ghost btn-sm" onClick={onResetAll}>
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default RegistryFilters;
