import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import api from '../../services/api.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchStats(true);

    // Auto-refresh graphs every 10 seconds to reflect real-time creation/updates/deletions
    const intervalId = setInterval(() => {
      fetchStats(false);
    }, 10000);

    // Re-fetch when browser tab receives focus
    const handleFocus = () => fetchStats(false);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchStats = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Failed to load system overview metrics.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // 1. Dynamic Category Distribution Data (Reads directly from MongoDB aggregate results)
  const categoryLabels = stats?.categoryDistribution?.length > 0
    ? stats.categoryDistribution.map(item => item._id || 'Other')
    : ['Road Damage', 'Water Leakage', 'Garbage', 'Street Light', 'Administrative', 'Other'];

  const categoryCounts = stats?.categoryDistribution?.length > 0
    ? stats.categoryDistribution.map(item => item.count)
    : [0, 0, 0, 0, 0, 0];

  const categoryData = {
    labels: categoryLabels,
    datasets: [
      {
        label: 'Number of Complaints',
        data: categoryCounts,
        backgroundColor: '#2563EB',
        borderRadius: 6,
      },
    ],
  };

  // 2. Timeline Trend Data
  const timelineLabels = stats?.timelineTrend?.length > 0 
    ? stats.timelineTrend.map(t => t._id) 
    : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];

  const timelineData = {
    labels: timelineLabels,
    datasets: [
      {
        label: 'Total Filed',
        data: stats?.timelineTrend?.length > 0 ? stats.timelineTrend.map(t => t.totalCount) : [5, 8, 12, 10, 15],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Resolved',
        data: stats?.timelineTrend?.length > 0 ? stats.timelineTrend.map(t => t.resolvedCount) : [2, 5, 8, 7, 12],
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Pending',
        data: stats?.timelineTrend?.length > 0 ? stats.timelineTrend.map(t => t.pendingCount) : [3, 3, 4, 3, 3],
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // 3. Urgency Matrix Data
  const urgencyLabels = ['High Urgency', 'Medium Urgency', 'Standard Urgency'];
  const urgencyData = {
    labels: urgencyLabels,
    datasets: [
      {
        label: 'Complaint Count',
        data: urgencyLabels.map(u => {
          const found = stats?.urgencyDistribution?.find(item => item._id === u);
          return found ? found.count : 0;
        }),
        backgroundColor: ['#EF4444', '#F59E0B', '#2563EB'],
        borderRadius: 6,
      },
    ],
  };

  return (
    <AdminLayout>
      {/* 1. Top Statistic Counter Section (Homepage Aligned Glassmorphic Container) */}
      {stats && (
        <div className="card glass-card py-4 px-3 mb-4">
          <div className="row g-4 text-center justify-content-center align-items-center">
            <div className="col-12 col-md">
              <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
                <span className="fw-bold text-uppercase mb-1" style={{ color: '#000000', fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  Total Issues
                </span>
                <span className="display-6 fw-bold mb-0" style={{ color: '#2563EB', fontFamily: 'Inter, sans-serif' }}>
                  {stats.statusBreakdown.total || 0}
                </span>
              </div>
            </div>

            <div className="col-12 col-md">
              <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
                <span className="fw-bold text-uppercase mb-1" style={{ color: '#000000', fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  Pending
                </span>
                <span className="display-6 fw-bold mb-0" style={{ color: '#F59E0B', fontFamily: 'Inter, sans-serif' }}>
                  {stats.statusBreakdown.Pending || 0}
                </span>
              </div>
            </div>

            <div className="col-12 col-md">
              <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
                <span className="fw-bold text-uppercase mb-1" style={{ color: '#000000', fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  In Progress
                </span>
                <span className="display-6 fw-bold mb-0" style={{ color: '#06B6D4', fontFamily: 'Inter, sans-serif' }}>
                  {stats.statusBreakdown['In Progress'] || 0}
                </span>
              </div>
            </div>

            <div className="col-12 col-md">
              <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
                <span className="fw-bold text-uppercase mb-1" style={{ color: '#000000', fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  Resolved
                </span>
                <span className="display-6 fw-bold mb-0" style={{ color: '#22C55E', fontFamily: 'Inter, sans-serif' }}>
                  {stats.statusBreakdown.Resolved || 0}
                </span>
              </div>
            </div>

            <div className="col-12 col-md">
              <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
                <span className="fw-bold text-uppercase mb-1" style={{ color: '#000000', fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  Rejected
                </span>
                <span className="display-6 fw-bold mb-0" style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
                  {stats.statusBreakdown.Rejected || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Page Section Title */}
      <h2 className="display-6 fw-bold text-center mb-4" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
        System Overview & Analytics
      </h2>

      {error && <div className="alert alert-danger border-0 shadow-sm mb-4">{error}</div>}

      {/* STACKED VISUAL GRAPHS (ONE BELOW ANOTHER) */}
      <div className="d-flex flex-column gap-4 mb-4">
        {/* GRAPH 1: Category Distribution Breakdown */}
        <div className="card glass-card border-0 p-4">
          <div className="mb-3 pb-2 border-bottom">
            <h3 className="fs-5 fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
              1. Category Volume Breakdown
            </h3>
            <p className="small text-secondary mb-0">Distribution of filed complaints across municipal departments</p>
          </div>
          <div style={{ height: '300px' }}>
            <Bar
              data={categoryData}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { backgroundColor: '#0F172A', padding: 12 },
                },
                scales: {
                  x: { grid: { color: '#F1F5F9' }, ticks: { color: '#1E293B', font: { family: 'Inter' } } },
                  y: { grid: { display: false }, ticks: { color: '#0F172A', font: { family: 'Poppins', weight: 'bold' } } },
                },
              }}
            />
          </div>
        </div>

        {/* GRAPH 2: Complaint Inflow & Resolution Timeline Trends */}
        <div className="card glass-card border-0 p-4">
          <div className="mb-3 pb-2 border-bottom">
            <h3 className="fs-5 fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
              2. Complaint Inflow & Resolution Timeline Trend
            </h3>
            <p className="small text-secondary mb-0">Daily tracking of newly registered vs pending vs resolved issues</p>
          </div>
          <div style={{ height: '320px' }}>
            <Line
              data={timelineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', labels: { font: { family: 'Poppins', weight: 'bold' }, color: '#0F172A' } },
                  tooltip: { backgroundColor: '#0F172A', padding: 12 },
                },
                scales: {
                  x: { grid: { color: '#F1F5F9' }, ticks: { color: '#1E293B', font: { family: 'Inter' } } },
                  y: { grid: { color: '#F1F5F9' }, ticks: { color: '#1E293B', font: { family: 'Inter' } } },
                },
              }}
            />
          </div>
        </div>

        {/* GRAPH 3: Urgency & Impact Matrix */}
        <div className="card glass-card border-0 p-4">
          <div className="mb-3 pb-2 border-bottom">
            <h3 className="fs-5 fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
              3. Calculated Priority & Urgency Impact Breakdown
            </h3>
            <p className="small text-secondary mb-0">Priority distribution calculated from citizen context questionnaires</p>
          </div>
          <div style={{ height: '280px' }}>
            <Bar
              data={urgencyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { backgroundColor: '#0F172A', padding: 12 },
                },
                scales: {
                  x: { grid: { display: false }, ticks: { color: '#0F172A', font: { family: 'Poppins', weight: 'bold' } } },
                  y: { grid: { color: '#F1F5F9' }, ticks: { color: '#1E293B', font: { family: 'Inter' } } },
                },
              }}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
