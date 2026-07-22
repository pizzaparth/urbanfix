import React, { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout.jsx';
import RegistryFilters from '../../components/RegistryFilters.jsx';
import ComplaintCard from '../../components/ComplaintCard.jsx';
import api from '../../services/api.js';

const Registry = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter & Sorting States
  const [locationSearch, setLocationSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'

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

  const hasActiveFilters = Boolean(locationSearch || categoryFilter || statusFilter || sortBy !== 'newest');

  // Sort Complaints Client-Side according to sortBy state
  const sortedComplaints = [...complaints].sort((a, b) => {
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return new Date(b.createdAt) - new Date(a.createdAt); // default newest first
  });

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

        <RegistryFilters
          locationSearch={locationSearch}
          setLocationSearch={setLocationSearch}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          resultCount={sortedComplaints.length}
          onResetAll={handleResetAllFilters}
        />

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
                <ComplaintCard item={item} />
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
