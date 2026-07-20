import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import api from '../../services/api.js';

const AdminAction = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering and pagination states
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const categories = ['Road Damage', 'Water Leakage', 'Garbage', 'Street Light', 'Administrative', 'Other'];

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter, page, search]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/complaints', {
        params: {
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          search: search || undefined,
          page,
          limit: 10,
        },
      });
      setComplaints(response.data.complaints);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      setError('Failed to fetch administrative complaint records.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return 'bg-warning text-dark';
      case 'In Progress': return 'bg-primary';
      case 'Resolved': return 'bg-success';
      case 'Rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <AdminLayout>
      {/* Section Heading */}
      <h1
        className="display-6 fw-bold text-center mb-4"
        style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}
      >
        Administrative Action Panel
      </h1>

      {error && <div className="alert alert-danger border-0 shadow-sm mb-4">{error}</div>}

      {/* Filters and Search panel */}
      <div className="card border-0 shadow-sm rounded-3 p-3 bg-white mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search by Tracking ID or Title..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Categories</option>
              {categories.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-secondary w-100" onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); setPage(1); }}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : complaints.length > 0 ? (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4">Tracking ID</th>
                  <th>Citizen Details</th>
                  <th>Category</th>
                  <th>Subject / Title</th>
                  <th>Status</th>
                  <th>Filed Date</th>
                  <th className="text-end px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 fw-semibold">{item.trackingId}</td>
                    <td>
                      <div className="small fw-semibold">{item.citizenId?.name || 'Unknown'}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.citizenId?.phone}</div>
                    </td>
                    <td><span className="badge bg-secondary-subtle text-secondary">{item.category}</span></td>
                    <td className="text-truncate" style={{ maxWidth: '200px' }}>{item.title}</td>
                    <td><span className={`badge ${getStatusBadge(item.status)}`}>{item.status}</span></td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="text-end px-4">
                      <button
                        className="btn btn-outline-primary btn-xs fw-semibold px-2 py-1"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => navigate(`/admin/complaints/${item._id}`)}
                      >
                        Action <i className="bi bi-chevron-right ms-1"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <span className="small text-secondary">Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-5 bg-white border rounded shadow-sm">
          <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
          <p className="text-muted mb-0">No complaints match your filtering criteria.</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAction;
