import { useMemo } from 'react';
import {
  Chart as ChartJS,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { CHART_COLORS, CHART_FONT_SANS, CHART_FONT_MONO } from '../config/chartTheme.js';

// Registered here (not just in AdminDashboard.jsx) because this component
// also renders on the public Home page, which may mount before any
// admin-only module has ever registered these with Chart.js's global registry.
ChartJS.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

// "Total" is deliberately not a 5th axis here — it's the sum of the other
// four, so plotting it alongside its own components would always produce
// the largest point on the chart and dominate the polygon's shape. It's
// shown separately as a plain label instead.
const METRICS = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

// Per-axis identity color (matches StatusBadge / color_palatte.md elsewhere
// in the app) — the connecting polygon stays a single accent tone, so
// magnitude reads as one consistent shape while each vertex still carries
// its own status meaning.
const POINT_COLORS = [
  CHART_COLORS.statusPending,
  CHART_COLORS.statusProgress,
  CHART_COLORS.statusResolved,
  CHART_COLORS.statusRejected,
];

const radarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      beginAtZero: true,
      angleLines: { color: CHART_COLORS.border },
      grid: { color: CHART_COLORS.border },
      ticks: { display: false, count: 6 },
      pointLabels: {
        color: '#FFFFFF',
        font: { family: CHART_FONT_SANS, size: 12 },
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: CHART_COLORS.surfaceRaised,
      borderColor: CHART_COLORS.border,
      borderWidth: 1,
      padding: 12,
      titleFont: { family: CHART_FONT_MONO, size: 11 },
      bodyFont: { family: CHART_FONT_MONO, size: 11 },
    },
  },
};

const StatsCounterCard = ({ statusBreakdown, className = 'panel' }) => {
  const total = statusBreakdown?.total || 0;

  const chartData = useMemo(() => ({
    labels: METRICS,
    datasets: [
      {
        data: METRICS.map((key) => statusBreakdown?.[key] || 0),
        borderColor: CHART_COLORS.accent,
        borderWidth: 2,
        backgroundColor: 'transparent',
        pointBackgroundColor: POINT_COLORS,
        pointBorderColor: CHART_COLORS.surfaceRaised,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }), [statusBreakdown]);

  return (
    <div className={`${className} stats-radar-panel`}>
      <div className="radar-panel">
        <div style={{ textAlign: 'center' }}>
          <span className="text-mono-label" style={{ marginBottom: 'var(--space-1)', display: 'block' }}>Total Issues</span>
          <span className="text-mono" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {total}
          </span>
        </div>
        <div className="radar-canvas-wrap">
          <Radar data={chartData} options={radarOptions} />
        </div>
      </div>
    </div>
  );
};

export default StatsCounterCard;
