import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout.jsx';
import api from '../../services/api.js';

const Registry = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter & Sorting States
  const [locationSearch, setLocationSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'

  const categories = ['Road Damage', 'Water Leakage', 'Garbage', 'Street Light', 'Administrative', 'Other'];

  // Fetch Redacted Public Complaints Registry
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      let queryPath = '/public/complaints?limit=100';
      if (locationSearch) queryPath += `&location=${encodeURIComponent(locationSearch)}`;
      if (categoryFilter) queryPath += `&category=${encodeURIComponent(categoryFilter)}`;
      if (statusFilter) queryPath += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await api.get(queryPath);
      setComplaints(res.data.complaints);
    } catch (err) {
      console.error('Error fetching registry data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [locationSearch, categoryFilter, statusFilter]);

  // Reset all filters in one click
  const handleResetAllFilters = () => {
    setLocationSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setSortBy('newest');
  };

  // Check if any filter is currently applied
  const hasActiveFilters = Boolean(locationSearch || categoryFilter || statusFilter || sortBy !== 'newest');
  const activeFilterCount = (locationSearch ? 1 : 0) + (categoryFilter ? 1 : 0) + (statusFilter ? 1 : 0);

  // Sort Complaints Client-Side according to sortBy state
  const sortedComplaints = [...complaints].sort((a, b) => {
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return new Date(b.createdAt) - new Date(a.createdAt); // default newest first
  });

  // Download resolution PDF receipt
  const handleDownloadReceipt = async (trackingId) => {
    try {
      const response = await api.get(`/complaints/download-receipt/${trackingId}`, {
        responseType: 'blob',
      });
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
      const fileLink = document.createElement('a');
      fileLink.href = fileUrl;
      fileLink.setAttribute('download', `Resolution_Receipt_${trackingId}.pdf`);
      document.body.appendChild(fileLink);
      fileLink.click();
      fileLink.remove();
    } catch (err) {
      alert('Failed to download resolution receipt.');
    }
  };

  // Uniform Button Hover Handlers
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

  // Status Badge Pill Renderer with Solid Semantic Tokens
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', fontSize: '0.75rem' }}>
            <i className="bi bi-clock-history me-1"></i> PENDING
          </span>
        );
      case 'In Progress':
        return (
          <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#CFFAFE', color: '#0E7490', border: '1px solid #67E8F9', fontSize: '0.75rem' }}>
            <i className="bi bi-gear-wide-connected me-1"></i> IN PROGRESS
          </span>
        );
      case 'Resolved':
        return (
          <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', fontSize: '0.75rem' }}>
            <i className="bi bi-check-circle-fill me-1"></i> RESOLVED
          </span>
        );
      case 'Rejected':
        return (
          <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', fontSize: '0.75rem' }}>
            <i className="bi bi-x-circle-fill me-1"></i> REJECTED
          </span>
        );
      default:
        return <span className="badge bg-secondary text-white rounded-pill px-3 py-1">{status}</span>;
    }
  };

  return (
    <MainLayout>
      <div className="py-4">
        {/* Page Title Header */}
        <div className="mb-4">
          <h1 className="display-6 fw-bold mb-2" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
            Public Complaints Registry
          </h1>
          <p className="fs-6 fw-medium mb-0" style={{ color: '#1E293B', maxWidth: '780px' }}>
            Browse all publicly filed municipal issues. Citizen contact details are strictly redacted for privacy and transparency compliance.
          </p>
        </div>

        {/* Search & Filter Controls Card */}
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
                {sortedComplaints.length} Records
              </span>

              {/* Reset All Filters Button */}
              {hasActiveFilters && (
                <button
                  className="btn btn-sm fw-bold rounded-pill px-3 text-nowrap d-inline-flex align-items-center"
                  onClick={handleResetAllFilters}
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
                    {categories.map((c, idx) => (
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
                onClick={handleResetAllFilters}
                style={{ fontSize: '0.8rem' }}
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Section Heading for Complaints Listing */}
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-3 mt-4 gap-2">
          <h2 className="display-6 fw-bold mb-0" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
            Registered Public Complaints
          </h2>
          <span className="small fw-semibold" style={{ color: '#1E293B', fontSize: '0.85rem' }}>
            Showing {sortedComplaints.length} public records
          </span>
        </div>

        {/* Complaints Listing Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading registry tickets...</span>
            </div>
          </div>
        ) : sortedComplaints.length > 0 ? (
          <div className="row g-3">
            {sortedComplaints.map((item) => (
              <div key={item._id} className="col-12">
                <div className="card h-100 border-0 bg-white p-4" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(15,23,42,.04)' }}>
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-3 gap-2">
                    <div>
                      <span className="badge rounded-pill fw-bold px-3 py-1 me-2" style={{ backgroundColor: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1' }}>
                        {item.category}
                      </span>
                      <span className="fw-bold small" style={{ color: '#1E293B' }}>
                        <i className="bi bi-geo-alt-fill text-danger me-1"></i>{item.location}
                      </span>
                    </div>
                    <div>{renderStatusBadge(item.status)}</div>
                  </div>

                  <h3 className="fs-5 fw-bold mb-2" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
                    {item.title}
                  </h3>

                  <div className="d-flex align-items-center mb-3" style={{ fontSize: '0.85rem' }}>
                    <span className="me-3 fw-medium" style={{ color: '#1E293B' }}>
                      Tracking ID: <code style={{ color: '#2563EB', fontWeight: 'bold', fontSize: '0.85rem' }}>{item.trackingId}</code>
                    </span>
                    <span className="fw-medium" style={{ color: '#1E293B' }}>
                      <i className="bi bi-calendar3 me-1"></i>Filed: {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="small mb-4 fw-medium text-justify" style={{ color: '#1E293B', lineHeight: '1.6' }}>
                    {item.description}
                  </p>

                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center pt-3 border-top gap-2 mt-auto">
                    <Link
                      to={`/track?id=${item.trackingId}`}
                      className="btn text-white fw-bold px-3 py-2 text-nowrap d-inline-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: '#2563EB',
                        borderColor: '#2563EB',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)',
                        transition: 'all 0.2s ease-in-out',
                      }}
                      onMouseOver={(e) => handleBtnOver(e, '#1D4ED8')}
                      onMouseOut={(e) => handleBtnOut(e, '#2563EB')}
                    >
                      <img src="/search.svg" alt="" style={{ width: '16px', height: '16px' }} className="me-1" /> Track Progress <i className="bi bi-arrow-right ms-1"></i>
                    </Link>

                    {item.status === 'Resolved' && (
                      <button
                        className="btn text-white fw-bold px-3 py-2 text-nowrap d-inline-flex align-items-center justify-content-center"
                        style={{
                          backgroundColor: '#10B981',
                          borderColor: '#10B981',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)',
                          transition: 'all 0.2s ease-in-out',
                        }}
                        onMouseOver={(e) => handleBtnOver(e, '#059669')}
                        onMouseOut={(e) => handleBtnOut(e, '#10B981')}
                        onClick={() => handleDownloadReceipt(item.trackingId)}
                      >
                        <i className="bi bi-file-earmark-pdf-fill me-1"></i> Download PDF Receipt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 bg-white rounded-3" style={{ border: '1px solid #E2E8F0' }}>
            <i className="bi bi-folder-x display-4 text-muted d-block mb-3"></i>
            <h3 className="fs-5 fw-bold mb-1" style={{ color: '#0F172A' }}>No Complaints Found</h3>
            <p className="small mb-2 fw-medium" style={{ color: '#1E293B' }}>No public tickets match your selected area location or filter criteria.</p>
            {hasActiveFilters && (
              <button className="btn btn-outline-primary btn-sm fw-bold rounded-pill px-3" onClick={handleResetAllFilters}>
                <i className="bi bi-arrow-counterclockwise me-1"></i> Reset All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Registry;
