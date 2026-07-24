import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Inbox } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { CATEGORIES } from '../../constants/categories.js';
import api from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';

const AdminAction = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
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
      } catch {
        setError('Failed to fetch administrative complaint records.');
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, [statusFilter, categoryFilter, page, search]);

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 'var(--text-h1)', marginBottom: 'var(--space-4)' }}>Administrative Action Panel</h1>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      <div className="panel grid-12" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="col-span-4">
          <input
            type="text"
            className="input"
            placeholder="Search by Tracking ID or Title"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="col-span-3">
          <select className="input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="col-span-3">
          <select className="input" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c, idx) => (
              <option key={idx} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); setPage(1); }}
          >
            Reset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 'var(--space-8) 0' }}>
          <span className="spinner" role="status" aria-label="Loading" />
        </div>
      ) : complaints.length > 0 ? (
        <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Citizen Details</th>
                <th>Category</th>
                <th>Subject / Title</th>
                <th>Status</th>
                <th>Filed Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((item) => (
                <tr key={item._id}>
                  <td className="text-mono">{item.trackingId}</td>
                  <td>
                    <div className="text-small">{item.citizenId?.name || 'Unknown'}</div>
                    <div className="text-mono-label">{item.citizenId?.phone}</div>
                  </td>
                  <td>
                    <span className="tag">{item.category}</span>
                  </td>
                  <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="text-mono-label">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/complaints/${item._id}`)}>
                      Action
                      <ChevronRight size={14} strokeWidth={ICON_STROKE} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div
              className="flex justify-between items-center"
              style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--border)' }}
            >
              <button type="button" className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
                Previous
              </button>
              <span className="text-mono-label">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="panel" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <Inbox size={32} strokeWidth={ICON_STROKE} style={{ color: 'var(--text-muted)', margin: '0 auto var(--space-3)' }} />
          <p className="text-small">No complaints match your filtering criteria.</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAction;
