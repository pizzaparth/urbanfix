import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import StatsCounterCard from '../../components/StatsCounterCard.jsx';
import api from '../../services/api.js';
import { CHART_COLORS, CHART_FONT_SANS, CHART_FONT_MONO } from '../../config/chartTheme.js';
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

const tooltipBase = {
  backgroundColor: CHART_COLORS.surfaceRaised,
  padding: 12,
  titleFont: { family: CHART_FONT_MONO, size: 11 },
  bodyFont: { family: CHART_FONT_MONO, size: 11 },
  borderColor: CHART_COLORS.border,
  borderWidth: 1,
};

const axisTicks = { color: CHART_COLORS.textSecondary, font: { family: CHART_FONT_MONO, size: 11 } };

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async (showLoading = true) => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data.stats);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Failed to load system overview metrics.');
      }
    };

    fetchStats(true);
    const intervalId = setInterval(() => fetchStats(false), 10000);
    const handleFocus = () => fetchStats(false);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const categoryLabels = stats?.categoryDistribution?.length > 0
    ? stats.categoryDistribution.map((item) => item._id || 'Other')
    : ['Road Damage', 'Water Leakage', 'Garbage', 'Street Light', 'Administrative', 'Other'];

  const categoryCounts = stats?.categoryDistribution?.length > 0
    ? stats.categoryDistribution.map((item) => item.count)
    : [0, 0, 0, 0, 0, 0];

  const categoryData = {
    labels: categoryLabels,
    datasets: [
      {
        label: 'Number of Complaints',
        data: categoryCounts,
        backgroundColor: CHART_COLORS.accent,
        borderRadius: 2,
      },
    ],
  };

  const timelineLabels = stats?.timelineTrend?.length > 0
    ? stats.timelineTrend.map((t) => t._id)
    : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];

  const timelineData = {
    labels: timelineLabels,
    datasets: [
      {
        label: 'Total Filed',
        data: stats?.timelineTrend?.length > 0 ? stats.timelineTrend.map((t) => t.totalCount) : [5, 8, 12, 10, 15],
        borderColor: CHART_COLORS.gray400,
        backgroundColor: 'rgba(140, 140, 140, 0.08)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Resolved',
        data: stats?.timelineTrend?.length > 0 ? stats.timelineTrend.map((t) => t.resolvedCount) : [2, 5, 8, 7, 12],
        borderColor: CHART_COLORS.accent,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Pending',
        data: stats?.timelineTrend?.length > 0 ? stats.timelineTrend.map((t) => t.pendingCount) : [3, 3, 4, 3, 3],
        borderColor: CHART_COLORS.gray500,
        backgroundColor: 'rgba(110, 110, 110, 0.06)',
        borderDash: [4, 4],
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const urgencyLabels = ['High Urgency', 'Medium Urgency', 'Standard Urgency'];
  const urgencyData = {
    labels: urgencyLabels,
    datasets: [
      {
        label: 'Complaint Count',
        data: urgencyLabels.map((u) => {
          const found = stats?.urgencyDistribution?.find((item) => item._id === u);
          return found ? found.count : 0;
        }),
        backgroundColor: [CHART_COLORS.statusRejected, CHART_COLORS.statusPending, CHART_COLORS.accent],
        borderRadius: 2,
      },
    ],
  };

  return (
    <AdminLayout>
      {stats && <StatsCounterCard statusBreakdown={stats.statusBreakdown} className="panel" />}

      <h2 style={{ fontSize: 'var(--text-h1)', textAlign: 'center', margin: 'var(--space-5) 0' }}>System Overview &amp; Analytics</h2>

      {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      <div className="stack">
        <div className="panel">
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-1)' }}>Category Volume Breakdown</h3>
            <p className="text-small">Distribution of filed complaints across municipal departments</p>
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
                  tooltip: tooltipBase,
                },
                scales: {
                  x: { grid: { color: CHART_COLORS.grid }, ticks: axisTicks },
                  y: { grid: { display: false }, ticks: { color: CHART_COLORS.textPrimary, font: { family: CHART_FONT_SANS, size: 12 } } },
                },
              }}
            />
          </div>
        </div>

        <div className="panel">
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-1)' }}>Complaint Inflow &amp; Resolution Timeline Trend</h3>
            <p className="text-small">Daily tracking of newly registered vs pending vs resolved issues</p>
          </div>
          <div style={{ height: '320px' }}>
            <Line
              data={timelineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', labels: { font: { family: CHART_FONT_MONO, size: 11 }, color: CHART_COLORS.textSecondary } },
                  tooltip: tooltipBase,
                },
                scales: {
                  x: { grid: { color: CHART_COLORS.grid }, ticks: axisTicks },
                  y: { grid: { color: CHART_COLORS.grid }, ticks: axisTicks },
                },
              }}
            />
          </div>
        </div>

        <div className="panel">
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-1)' }}>Calculated Priority &amp; Urgency Impact Breakdown</h3>
            <p className="text-small">Priority distribution calculated from citizen context questionnaires</p>
          </div>
          <div style={{ height: '280px' }}>
            <Bar
              data={urgencyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: tooltipBase,
                },
                scales: {
                  x: { grid: { display: false }, ticks: { color: CHART_COLORS.textPrimary, font: { family: CHART_FONT_SANS, size: 12 } } },
                  y: { grid: { color: CHART_COLORS.grid }, ticks: axisTicks },
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
