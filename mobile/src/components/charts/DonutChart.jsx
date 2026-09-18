import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PolarChart, Pie } from 'victory-native';
import { color, space, font, text } from '../../theme.js';

// Donut built on Victory Native XL (Skia). Replaces the gifted-charts PieChart.
//
// Victory animates slice geometry itself, so when the poll brings new counts the
// arcs grow into place instead of snapping — which is the point of having the
// data refresh live.
//
// `centerValue`/`centerLabel` are rendered as normal RN text layered over the
// canvas rather than drawn into it: Skia would need its own font binary for
// that, and this keeps the numbers using the same Geist faces as the rest of
// the app, selectable and accessible.
const DonutChart = ({ data, size = 200, innerRadius = '62%', centerValue, centerLabel }) => {
  const slices = (data || []).filter((d) => (d.value || 0) > 0);

  if (slices.length === 0) {
    return (
      <View style={[s.empty, { height: size }]}>
        <Text style={s.emptyText}>No data yet</Text>
      </View>
    );
  }

  return (
    <View style={[s.wrap, { height: size }]}>
      <PolarChart data={slices} labelKey="label" valueKey="value" colorKey="color">
        <Pie.Chart innerRadius={innerRadius}>
          {({ slice }) => (
            <Pie.Slice animate={{ type: 'timing', duration: 300 }}>
              {/* A 1px inset in the panel color separates touching slices, so
                  adjacent categories stay distinguishable without a border. */}
              <Pie.SliceAngularInset
                angularInset={{ angularStrokeWidth: 1, angularStrokeColor: color.surface }}
              />
            </Pie.Slice>
          )}
        </Pie.Chart>
      </PolarChart>

      {centerValue !== undefined ? (
        <View style={s.center} pointerEvents="none">
          <Text style={s.centerValue}>{centerValue}</Text>
          {centerLabel ? <Text style={s.centerLabel}>{centerLabel}</Text> : null}
        </View>
      ) : null}
    </View>
  );
};

const s = StyleSheet.create({
  wrap: { width: '100%' },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: { fontFamily: font.sansBold, fontSize: text.h1, color: color.textPrimary },
  centerLabel: {
    fontFamily: font.mono,
    fontSize: text.monoSm,
    color: color.textMuted,
    marginTop: space[1],
  },
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: font.sans, fontSize: text.small, color: color.textMuted },
});

export default DonutChart;
