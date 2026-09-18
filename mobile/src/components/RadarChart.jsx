import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { CHART_COLORS } from '../config/chartTheme.js';
import { color, space, font, text } from '../theme.js';

// Hand-rolled because no React Native charting library ships a radar chart —
// this replaces the Chart.js <Radar> in the web StatsCounterCard. The geometry is
// simple: N equally-spaced axes, a few concentric grid rings, and one polygon
// whose vertices sit at value/max along each axis.
//
// "Total" is deliberately not a 5th axis: it's the sum of the other four, so
// plotting it would always dominate the polygon's shape. It's shown separately
// as a plain label, exactly as on the web.
const METRICS = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

// Per-axis identity color (matches StatusBadge) — the connecting polygon stays a
// single accent tone, so magnitude reads as one consistent shape while each
// vertex still carries its own status meaning.
const POINT_COLORS = [
  CHART_COLORS.statusPending,
  CHART_COLORS.statusProgress,
  CHART_COLORS.statusResolved,
  CHART_COLORS.statusRejected,
];

const RINGS = 4;
const SIZE = 240;
const LABEL_PAD = 30;
const R = SIZE / 2 - LABEL_PAD;

// The east/west axis labels ("In Progress", "Rejected") are the longest strings
// on the chart and they sit at its extreme left and right, so they ran off a
// square canvas and got clipped mid-word. The drawing is widened horizontally
// to make room, and rendered through a viewBox at width="100%" so the whole
// thing scales to the panel instead of overflowing on a narrow phone.
const H_PAD = 60;
const CANVAS_W = SIZE + H_PAD * 2;
const CX = CANVAS_W / 2;
const CY = SIZE / 2;

// Start at 12 o'clock and go clockwise, matching Chart.js's radar orientation.
const angleFor = (i, n) => (Math.PI * 2 * i) / n - Math.PI / 2;

const pointAt = (i, n, ratio) => {
  const a = angleFor(i, n);
  return [CX + Math.cos(a) * R * ratio, CY + Math.sin(a) * R * ratio];
};

const RadarChart = ({ statusBreakdown }) => {
  const values = METRICS.map((k) => statusBreakdown?.[k] || 0);
  const total = statusBreakdown?.total || 0;

  // Scale to the largest value so the shape always fills the chart; guard the
  // all-zero case so an empty dataset collapses to the centre instead of NaN.
  const max = Math.max(...values, 1);

  const polygonPoints = useMemo(
    () =>
      values
        .map((v, i) => pointAt(i, METRICS.length, v / max))
        .map(([x, y]) => `${x},${y}`)
        .join(' '),
    [values.join(','), max]
  );

  return (
    <View style={s.wrap}>
      <View style={s.totalBlock}>
        <Text style={s.totalLabel}>Total Issues</Text>
        <Text style={s.totalValue}>{total}</Text>
      </View>

      <Svg
        width="100%"
        height={SIZE}
        viewBox={`0 0 ${CANVAS_W} ${SIZE}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Concentric grid rings */}
        {Array.from({ length: RINGS }, (_, ring) => {
          const ratio = (ring + 1) / RINGS;
          const pts = METRICS.map((_, i) => pointAt(i, METRICS.length, ratio))
            .map(([x, y]) => `${x},${y}`)
            .join(' ');
          return (
            <Polygon
              key={`ring-${ring}`}
              points={pts}
              fill="none"
              stroke={CHART_COLORS.border}
              strokeWidth={1}
            />
          );
        })}

        {/* Axis spokes */}
        {METRICS.map((_, i) => {
          const [x, y] = pointAt(i, METRICS.length, 1);
          return (
            <Line
              key={`axis-${i}`}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke={CHART_COLORS.border}
              strokeWidth={1}
            />
          );
        })}

        {/* The data polygon */}
        <Polygon
          points={polygonPoints}
          fill={color.accentWash}
          stroke={CHART_COLORS.accent}
          strokeWidth={2}
        />

        {/* Vertices, each in its own status color */}
        {values.map((v, i) => {
          const [x, y] = pointAt(i, METRICS.length, v / max);
          return (
            <Circle
              key={`pt-${i}`}
              cx={x}
              cy={y}
              r={4}
              fill={POINT_COLORS[i]}
              stroke={CHART_COLORS.surfaceRaised}
              strokeWidth={2}
            />
          );
        })}

        {/* Axis labels, nudged outside the outer ring. The side labels anchor
            away from the circle rather than on their own centre, so they read
            as belonging to their axis and stay clear of the plot. */}
        {METRICS.map((label, i) => {
          const [x, y] = pointAt(i, METRICS.length, 1.14);
          const dx = Math.round(x - CX);
          const anchor = Math.abs(dx) < 1 ? 'middle' : dx > 0 ? 'start' : 'end';
          return (
            <SvgText
              key={`label-${i}`}
              x={x + (anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0)}
              y={y + 4}
              fill={color.textSecondary}
              fontSize={11}
              fontFamily={font.sans}
              textAnchor={anchor}
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>

      {/* The web chart relied on hover tooltips for exact counts. There's no
          hover on touch, so the values are always visible instead. */}
      <View style={s.legend}>
        {METRICS.map((label, i) => (
          <View key={label} style={s.legendItem}>
            <View style={[s.swatch, { backgroundColor: POINT_COLORS[i] }]} />
            <Text style={s.legendLabel}>{label}</Text>
            <Text style={s.legendValue}>{values[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space[3] },
  totalBlock: { alignItems: 'center' },
  totalLabel: { fontFamily: font.mono, fontSize: 11, color: color.textMuted },
  totalValue: { fontFamily: font.monoMedium, fontSize: 28, color: color.textPrimary },
  legend: { alignSelf: 'stretch', gap: space[2] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { flex: 1, fontFamily: font.sans, fontSize: text.small, color: color.textSecondary },
  legendValue: { fontFamily: font.monoMedium, fontSize: text.monoMd, color: color.textPrimary },
});

export default RadarChart;
