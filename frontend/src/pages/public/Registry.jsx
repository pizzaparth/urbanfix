import { useState, useEffect } from 'react';
import { FolderX, RotateCcw } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout.jsx';
import RegistryFilters from '../../components/RegistryFilters.jsx';
import ComplaintCard from '../../components/ComplaintCard.jsx';
import api from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';

const Registry = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [locationSearch, setLocationSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSearch, categoryFilter, statusFilter]);

  const handleResetAllFilters = () => {
    setLocationSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setSortBy('newest');
  };

  const hasActiveFilters = Boolean(locationSearch || categoryFilter || statusFilter || sortBy !== 'newest');

  const sortedComplaints = [...complaints].sort((a, b) => {
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <MainLayout>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h1 style={{ fontSize: 'var(--text-h1)', marginBottom: 'var(--space-2)' }}>Public Complaints Registry</h1>
        <p className="text-secondary" style={{ maxWidth: '720px', fontSize: 'var(--text-body)' }}>
          Browse all publicly filed municipal issues. Citizen contact details are strictly redacted for privacy and
          transparency compliance.
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

      <div className="flex justify-between items-center flex-wrap gap-2" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--text-h2)' }}>Registered Public Complaints</h2>
        <span className="text-mono-label">{sortedComplaints.length} public records</span>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 'var(--space-8) 0' }}>
          <span className="spinner" role="status" aria-label="Loading registry tickets" />
        </div>
      ) : sortedComplaints.length > 0 ? (
        <div className="stack">
          {sortedComplaints.map((item) => (
            <ComplaintCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <FolderX size={32} strokeWidth={ICON_STROKE} style={{ color: 'var(--text-muted)', margin: '0 auto var(--space-3)' }} />
          <h3 style={{ marginBottom: 'var(--space-1)' }}>No Complaints Found</h3>
          <p className="text-small" style={{ marginBottom: 'var(--space-3)' }}>
            No public tickets match your selected area location or filter criteria.
          </p>
          {hasActiveFilters && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetAllFilters} style={{ margin: '0 auto' }}>
              <RotateCcw size={14} strokeWidth={ICON_STROKE} />
              Reset All Filters
            </button>
          )}
        </div>
      )}
    </MainLayout>
  );
};

export default Registry;
