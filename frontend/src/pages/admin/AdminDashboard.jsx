import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import StatsCounterCard from '../../components/StatsCounterCard.jsx';
import api from '../../services/api.js';
import { CHART_COLORS, CHART_FONT_MONO, getCategoryColor } from '../../config/chartTheme.js';
import { CATEGORIES } from '../../constants/categories.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
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

const lineSeriesBase = {
  borderWidth: 2,
  pointRadius: 0,
  pointHoverRadius: 5,
  pointHoverBorderWidth: 2,
  pointHoverBorderColor: CHART_COLORS.surfaceRaised,
  fill: true,
  tension: 0.35,
};

const urgencyLabels = ['High Urgency', 'Medium Urgency', 'Standard Urgency'];

// Reserved status hues (never reused for plain "series N" identity) — red
// for High, gold for Medium, the one accent for Standard.
const urgencyRingColors = [CHART_COLORS.statusRejected, CHART_COLORS.statusPending, CHART_COLORS.accent];

// Explicit outer→inner radius bands so the three rings nest with a tight
// gap, rather than relying on Chart.js's automatic weight-based layout.
// The canvas itself is sized up (see .donut-canvas-wrap--lg) so the 70%
// cutout below is still ~91px of real clearance — measured against the
// rendered bounding box of the widest center label ("Standard Urgency")
// plus headroom for the rounded end-cap on the innermost ring, which
// bulges a few px past the nominal cutout radius right at its tip.
const urgencyRingBands = [
  { radius: '100%', cutout: '91%' },
  { radius: '89.5%', cutout: '80.5%' },
  { radius: '79%', cutout: '70%' },
];

// Vertical crosshair at the hovered index, drawn behind the tooltip dots —
// paired with `interaction: { mode: 'index', intersect: false }` so hovering
// anywhere along x reveals every series at that point, not just one line.
const crosshairPlugin = {
  id: 'crosshair',
  afterDatasetsDraw(chart) {
    const active = chart.getActiveElements();
    if (!active.length) return;
    const { ctx, chartArea } = chart;
    const x = active[0].element.x;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = CHART_COLORS.border;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  },
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredUrgency, setHoveredUrgency] = useState(null);

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

  // Memoized on `stats` only — these feed straight into chart `data`/`options`
  // props, and react-chartjs-2 replays the full entrance animation whenever
  // that object reference changes. Without this, every hover-driven re-render
  // (hoveredCategory/hoveredUrgency) would hand the chart a brand-new object
  // and restart its reveal animation mid-interaction, making rings/lines
  // flash blank while the user is hovering them.
  const { categoryLabels, categoryCounts, categoryTotal, categoryData } = useMemo(() => {
    const labels = stats?.categoryDistribution?.length > 0
      ? stats.categoryDistribution.map((item) => item._id || 'Other')
      : CATEGORIES;

    const counts = stats?.categoryDistribution?.length > 0
      ? stats.categoryDistribution.map((item) => item.count)
      : CATEGORIES.map(() => 0);

    const total = counts.reduce((sum, count) => sum + count, 0);

    return {
      categoryLabels: labels,
      categoryCounts: counts,
      categoryTotal: total,
      categoryData: {
        labels,
        datasets: [
          {
            label: 'Number of Complaints',
            data: counts,
            backgroundColor: labels.map((_, index) => getCategoryColor(index)),
            borderColor: CHART_COLORS.surfaceRaised,
            borderWidth: 2,
            borderRadius: 3,
            hoverOffset: 8,
          },
        ],
      },
    };
  }, [stats]);

  const timelineData = useMemo(() => {
    const labels = stats?.timelineTrend?.length > 0
      ? stats.timelineTrend.map((t) => t._id)
      : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];

    return {
      labels,
      datasets: [
        {
          ...lineSeriesBase,
          label: 'Total Filed',
          data: stats?.timelineTrend?.length > 0 ? stats.timelineTrend.map((t) => t.totalCount) : [5, 8, 12, 10, 15],
          borderColor: CHART_COLORS.gray400,
          backgroundColor: 'rgba(140, 140, 140, 0.08)',
          pointHoverBackgroundColor: CHART_COLORS.gray400,
        },
        {
          ...lineSeriesBase,
          label: 'Resolved',
          data: stats?.timelineTrend?.length > 0 ? stats.timelineTrend.map((t) => t.resolvedCount) : [2, 5, 8, 7, 12],
          borderColor: CHART_COLORS.accent,
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          pointHoverBackgroundColor: CHART_COLORS.accent,
        },
        {
          ...lineSeriesBase,
          label: 'Pending',
          data: stats?.timelineTrend?.length > 0 ? stats.timelineTrend.map((t) => t.pendingCount) : [3, 3, 4, 3, 3],
          borderColor: CHART_COLORS.gray500,
          backgroundColor: 'rgba(110, 110, 110, 0.06)',
          pointHoverBackgroundColor: CHART_COLORS.gray500,
          borderDash: [4, 4],
        },
      ],
    };
  }, [stats]);

  const { urgencyCounts, urgencyTotal, urgencyRingData } = useMemo(() => {
    const counts = urgencyLabels.map((u) => {
      const found = stats?.urgencyDistribution?.find((item) => item._id === u);
      return found ? found.count : 0;
    });
    const total = counts.reduce((sum, count) => sum + count, 0);

    return {
      urgencyCounts: counts,
      urgencyTotal: total,
      urgencyRingData: {
        labels: urgencyLabels,
        datasets: counts.map((count, index) => ({
          data: [count, Math.max(total - count, 0)],
          backgroundColor: [urgencyRingColors[index], CHART_COLORS.border],
          borderWidth: 0,
          borderRadius: [10, 0],
          rotation: -90,
          circumference: 360,
          ...urgencyRingBands[index],
        })),
      },
    };
  }, [stats]);

  const categoryDonutOptions = useMemo(() => ({
    cutout: '68%',
    responsive: true,
    maintainAspectRatio: false,
    animation: { animateRotate: true, animateScale: true },
    onHover: (_event, elements) => {
      setHoveredCategory(elements.length ? elements[0].index : null);
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  }), []);

  const timelineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { font: { family: CHART_FONT_MONO, size: 11 }, color: CHART_COLORS.textSecondary } },
      tooltip: { ...tooltipBase, mode: 'index', intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: axisTicks },
      y: { grid: { color: CHART_COLORS.grid, borderDash: [4, 4] }, ticks: axisTicks },
    },
  }), []);

  const urgencyRingOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { animateRotate: true, animateScale: true },
    onHover: (_event, elements) => {
      setHoveredUrgency(elements.length ? elements[0].datasetIndex : null);
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  }), []);

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
          <div className="donut-layout">
            <div className="donut-canvas-wrap" onMouseLeave={() => setHoveredCategory(null)}>
              <Doughnut data={categoryData} options={categoryDonutOptions} />
              <div className="donut-center">
                {hoveredCategory !== null ? (
                  <>
                    <span className="text-mono" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {categoryCounts[hoveredCategory]}
                    </span>
                    <span className="text-mono-label">{categoryLabels[hoveredCategory]}</span>
                  </>
                ) : (
                  <>
                    <span className="text-mono" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {categoryTotal}
                    </span>
                    <span className="text-mono-label">Total Filed</span>
                  </>
                )}
              </div>
            </div>

            <ul className="donut-legend">
              {categoryLabels.map((label, index) => {
                const count = categoryCounts[index];
                const percentage = categoryTotal > 0 ? Math.round((count / categoryTotal) * 100) : 0;
                return (
                  <li
                    key={label}
                    className={`donut-legend-item ${hoveredCategory === index ? 'is-active' : ''}`}
                    onMouseEnter={() => setHoveredCategory(index)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <span className="donut-swatch" style={{ backgroundColor: getCategoryColor(index) }} />
                    <span className="donut-legend-label">{label}</span>
                    <span className="text-mono text-secondary">{count}</span>
                    <span className="text-mono-label">{percentage}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="panel">
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-1)' }}>Complaint Inflow &amp; Resolution Timeline Trend</h3>
            <p className="text-small">Daily tracking of newly registered vs pending vs resolved issues</p>
          </div>
          <div style={{ height: '320px' }}>
            <Line data={timelineData} plugins={[crosshairPlugin]} options={timelineOptions} />
          </div>
        </div>

        <div className="panel">
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <h3 style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-1)' }}>Calculated Priority &amp; Urgency Impact Breakdown</h3>
            <p className="text-small">Priority distribution calculated from citizen context questionnaires</p>
          </div>
          <div className="donut-layout">
            <div className="donut-canvas-wrap donut-canvas-wrap--lg" onMouseLeave={() => setHoveredUrgency(null)}>
              <Doughnut data={urgencyRingData} options={urgencyRingOptions} />
              <div className="donut-center">
                {hoveredUrgency !== null ? (
                  <>
                    <span className="text-mono" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {urgencyCounts[hoveredUrgency]}
                    </span>
                    <span className="text-mono-label">{urgencyLabels[hoveredUrgency]}</span>
                  </>
                ) : (
                  <>
                    <span className="text-mono" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {urgencyTotal}
                    </span>
                    <span className="text-mono-label">Total Impact</span>
                  </>
                )}
              </div>
            </div>

            <ul className="donut-legend">
              {urgencyLabels.map((label, index) => {
                const count = urgencyCounts[index];
                const percentage = urgencyTotal > 0 ? Math.round((count / urgencyTotal) * 100) : 0;
                return (
                  <li
                    key={label}
                    className={`donut-legend-item ring-legend-item ${hoveredUrgency === index ? 'is-active' : ''}`}
                    onMouseEnter={() => setHoveredUrgency(index)}
                    onMouseLeave={() => setHoveredUrgency(null)}
                  >
                    <span className="donut-swatch" style={{ backgroundColor: urgencyRingColors[index] }} />
                    <div className="ring-legend-body">
                      <div className="ring-legend-row">
                        <span className="donut-legend-label">{label}</span>
                        <span className="text-mono text-secondary">{count}</span>
                      </div>
                      <div className="ring-progress-track">
                        <div className="ring-progress-fill" style={{ width: `${percentage}%`, backgroundColor: urgencyRingColors[index] }} />
                      </div>
                    </div>
                    <span className="text-mono-label">{percentage}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
