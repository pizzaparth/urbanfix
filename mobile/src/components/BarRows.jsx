import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors, uf as font } from '../theme.js';

// Labelled horizontal bars — the admin dashboard's "By urgency" rows, made
// reusable for the research charts. rows: [{ key, count }]; `color` is a single
// colour or a function of the row index.
export default function BarRows({ rows, color, max, unit }) {
  const top = max ?? Math.max(...rows.map((r) => r.count), 1);
  const total = rows.reduce((n, r) => n + r.count, 0) || 1;

  return (
    <View style={s.stack}>
      {rows.map((r, i) => {
        const pct = Math.round((r.count / total) * 100);
        const tone = typeof color === 'function' ? color(i, r) : color;
        return (
          <View key={r.key}>
            <View style={s.head}>
              <Text numberOfLines={1} style={s.label}>{r.key}</Text>
              <Text style={s.meta}>{`${r.count}${unit ? ` ${unit}` : ''}  ·  ${pct}%`}</Text>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: `${Math.max(3, (r.count / top) * 100)}%`, backgroundColor: tone }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  stack: { gap: 18 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9, gap: 10 },
  label: { flex: 1, fontFamily: font.bodyBold, fontSize: 17, color: colors.text },
  meta: { fontFamily: font.display, fontSize: 16, color: colors.muted },
  track: { height: 14, borderRadius: 7, backgroundColor: colors.surfaceInput, overflow: 'hidden' },
  fill: { height: 14, borderRadius: 7 },
});
