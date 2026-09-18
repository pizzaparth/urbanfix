import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CartesianChart, Line, Area } from 'victory-native';
import { useFont, LinearGradient, vec } from '@shopify/react-native-skia';
import { CHART_COLORS } from '../../config/chartTheme.js';
import { color, space, font, text } from '../../theme.js';

// Filing timeline on Victory Native XL (Skia), replacing the gifted-charts
// LineChart.
//
// Axis labels are drawn *inside* the Skia canvas, so they need a font binary
// rather than a family name — useFont loads the same Geist face the rest of the
// app uses. It returns null on the first render while the file is read, which
// is why the chart only mounts once the font resolves; rendering before then
// throws inside Skia's text layout.
const GEIST = require('@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf');

const TrendChart = ({ data, height = 190 }) => {
  const axisFont = useFont(GEIST, 10);

  const points = (data || []).map((d) => ({
    // CartesianChart needs a numeric x, so the date label is carried alongside
    // the index and formatted back in formatXLabel.
    x: d.x,
    y: d.y,
    label: d.label,
  }));

  if (points.length === 0) {
    return (
      <View style={[s.empty, { height }]}>
        <Text style={s.emptyText}>No filings in this window</Text>
      </View>
    );
  }

  return (
    <View style={{ height }}>
      {axisFont ? (
        <CartesianChart
          data={points}
          xKey="x"
          yKeys={['y']}
          domainPadding={{ left: 12, right: 12, top: 18, bottom: 6 }}
          axisOptions={{
            font: axisFont,
            labelColor: CHART_COLORS.textMuted,
            lineColor: CHART_COLORS.grid,
            tickCount: { x: Math.min(points.length, 5), y: 4 },
            formatXLabel: (value) => points[Math.round(value)]?.label ?? '',
          }}
        >
          {({ points: p, chartBounds }) => (
            <>
              {/* The fill is what makes a sparse line readable at a glance —
                  it fades out downward so it never competes with the grid. */}
              <Area
                points={p.y}
                y0={chartBounds.bottom}
                curveType="natural"
                animate={{ type: 'timing', duration: 300 }}
              >
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(0, height)}
                  colors={[`${CHART_COLORS.accent}40`, `${CHART_COLORS.accent}00`]}
                />
              </Area>
              <Line
                points={p.y}
                color={CHART_COLORS.accent}
                strokeWidth={2}
                curveType="natural"
                animate={{ type: 'timing', duration: 300 }}
              />
            </>
          )}
        </CartesianChart>
      ) : (
        <View style={s.empty} />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: space[4] },
  emptyText: { fontFamily: font.sans, fontSize: text.small, color: color.textMuted },
});

export default TrendChart;
