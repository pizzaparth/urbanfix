import React from 'react';
import { CATEGORIES } from '../constants/categories.js';

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

  const handleBtnOver = (e, hoverBg, hoverBorder) => {
    e.currentTarget.style.backgroundColor = hoverBg;
    e.currentTarget.style.borderColor = hoverBorder || hoverBg;
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.12)';
  };

  const handleBtnOut = (e, baseBg, baseBorder) => {
    e.currentTarget.style.backgroundColor = baseBg;
    e.currentTarget.style.borderColor = baseBorder || baseBg;
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.05)';
  };

  return (
    <div className="card border-0 p-4 bg-white mb-4" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(15,23,42,.04)' }}>
      {/* Filter Bar Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
        <h2 className="fs-5 fw-bold mb-0 d-inline-flex align-items-center" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
          <img src="/notebook-test.svg" alt="" style={{ width: '24px', height: '24px' }} className="me-3" /> Search & Filter Registry
        </h2>

        <div className="d-flex align-items-center flex-wrap gap-2 ms-md-auto">
          {/* Sort Order Selector */}
          <div className="d-flex align-items-center">
            <span className="small me-2 fw-semibold d-none d-sm-inline" style={{ fontSize: '0.825rem', color: '#1E293B' }}>Sort:</span>
            <select
              className="form-select form-select-sm fw-bold border rounded-pill ps-3 pe-5 py-1 text-decoration-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                borderColor: '#CBD5E1',
                color: '#0F172A',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.825rem',
                width: 'auto',
                paddingRight: '2.85rem',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => handleBtnOver(e, '#FFFFFF', '#2563EB')}
              onMouseOut={(e) => handleBtnOut(e, '#FFFFFF', '#CBD5E1')}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Result Count Badge */}
          <span
            className="badge fw-bold px-3 py-2 border rounded-pill"
            style={{
              backgroundColor: '#F1F5F9',
              borderColor: '#CBD5E1',
              color: '#0F172A',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.825rem',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
            }}
          >
            {resultCount} Records
          </span>

          {/* Reset All Filters Button */}
          {hasActiveFilters && (
            <button
              className="btn btn-sm fw-bold rounded-pill px-3 text-nowrap d-inline-flex align-items-center"
              onClick={onResetAll}
              style={{
                backgroundColor: '#FEE2E2',
                borderColor: '#FCA5A5',
                color: '#B91C1C',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.825rem',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.1)',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#EF4444';
                e.currentTarget.style.borderColor = '#EF4444';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#FEE2E2';
                e.currentTarget.style.borderColor = '#FCA5A5';
                e.currentTarget.style.color = '#B91C1C';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(239, 68, 68, 0.1)';
              }}
              title="Reset all search filters"
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter Inputs Container (Full Vertical Stacked Layout - Always Visible) */}
      <div className="p-3 p-md-4 rounded-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <div className="d-flex flex-column gap-3">
          {/* 1. Location Search Input with Field Label & Clear Button */}
          <div>
            <label className="form-label small fw-bold mb-1" style={{ color: '#0F172A', fontSize: '0.85rem' }}>
              <i className="bi bi-geo-alt-fill text-danger me-2"></i> Filter by Ward / Area Location
            </label>
            <div className="d-flex align-items-center gap-2 position-relative">
              <span className="input-group-text bg-white text-muted px-3 rounded-3" style={{ borderColor: '#CBD5E1', height: '42px' }}>
                <i className="bi bi-search text-secondary"></i>
              </span>
              <div className="position-relative flex-grow-1">
                <input
                  type="text"
                  className="form-control fw-medium pe-5 rounded-3"
                  style={{ borderColor: '#CBD5E1', color: '#0F172A', fontSize: '0.9rem', height: '42px' }}
                  placeholder="Type area, ward, or landmark (e.g. Ward 4, Main Street)..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                />
                {locationSearch && (
                  <button
                    className="btn btn-link text-muted p-0 pe-3 border-0 position-absolute end-0 top-50 translate-middle-y"
                    onClick={() => setLocationSearch('')}
                    style={{ zIndex: 5 }}
                    title="Clear search text"
                  >
                    <i className="bi bi-x-circle-fill text-secondary"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Category Select with Field Label & Icon Indicator */}
          <div>
            <label className="form-label small fw-bold mb-1" style={{ color: '#0F172A', fontSize: '0.85rem' }}>
              <i className="bi bi-tag-fill text-primary me-2"></i> Filter by Category Type
            </label>
            <div className="d-flex align-items-center gap-2">
              <span className="input-group-text bg-white text-muted px-3 rounded-3" style={{ borderColor: '#CBD5E1', height: '42px' }}>
                <i className="bi bi-grid-fill text-primary"></i>
              </span>
              <select
                className="form-select fw-medium flex-grow-1 rounded-3"
                style={{ borderColor: '#CBD5E1', color: '#0F172A', fontSize: '0.9rem', height: '42px' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Status Select with Field Label & Icon Indicator */}
          <div>
            <label className="form-label small fw-bold mb-1" style={{ color: '#0F172A', fontSize: '0.85rem' }}>
              <i className="bi bi-funnel-fill text-warning me-2"></i> Filter by Complaint Status
            </label>
            <div className="d-flex align-items-center gap-2">
              <span className="input-group-text bg-white text-muted px-3 rounded-3" style={{ borderColor: '#CBD5E1', height: '42px' }}>
                <i className="bi bi-clock-history text-warning"></i>
              </span>
              <select
                className="form-select fw-medium flex-grow-1 rounded-3"
                style={{ borderColor: '#CBD5E1', color: '#0F172A', fontSize: '0.9rem', height: '42px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Removable Summary Chips */}
      {hasActiveFilters && (
        <div className="d-flex flex-wrap align-items-center gap-2 mt-3 pt-3 border-top" style={{ borderColor: '#F1F5F9' }}>
          <span className="small fw-bold me-1" style={{ fontSize: '0.8rem', color: '#0F172A' }}>
            Active Filters:
          </span>

          {locationSearch && (
            <span className="badge bg-white border rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center" style={{ borderColor: '#CBD5E1', fontSize: '0.8rem', color: '#0F172A' }}>
              Location: "{locationSearch}"
              <button type="button" className="btn-close btn-close-sm ms-2" aria-label="Close" onClick={() => setLocationSearch('')}></button>
            </span>
          )}

          {categoryFilter && (
            <span className="badge bg-white border rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center" style={{ borderColor: '#CBD5E1', fontSize: '0.8rem', color: '#0F172A' }}>
              Category: {categoryFilter}
              <button type="button" className="btn-close btn-close-sm ms-2" aria-label="Close" onClick={() => setCategoryFilter('')}></button>
            </span>
          )}

          {statusFilter && (
            <span className="badge bg-white border rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center" style={{ borderColor: '#CBD5E1', fontSize: '0.8rem', color: '#0F172A' }}>
              Status: {statusFilter}
              <button type="button" className="btn-close btn-close-sm ms-2" aria-label="Close" onClick={() => setStatusFilter('')}></button>
            </span>
          )}

          {sortBy !== 'newest' && (
            <span className="badge bg-white border rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center" style={{ borderColor: '#CBD5E1', fontSize: '0.8rem', color: '#0F172A' }}>
              Sort: {sortBy === 'oldest' ? 'Oldest First' : 'Newest First'}
              <button type="button" className="btn-close btn-close-sm ms-2" aria-label="Close" onClick={() => setSortBy('newest')}></button>
            </span>
          )}

          <button
            className="btn btn-link btn-sm text-danger text-decoration-none fw-bold p-0 ms-2"
            onClick={onResetAll}
            style={{ fontSize: '0.8rem' }}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default RegistryFilters;
