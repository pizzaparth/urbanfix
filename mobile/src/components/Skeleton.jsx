import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { color, space, radius } from '../theme.js';

// Skeleton placeholders, in place of a centered spinner.
//
// A spinner says "something is happening"; a skeleton says "this is what is
// coming and roughly how much of it" — the screen stops jumping when the data
// lands, because the shape is already correct. The pulse is a simple opacity
// loop on the UI thread via Reanimated (which is what Moti compiles to), so it
// costs nothing on the JS thread while a fetch is in flight.

export const SkeletonBlock = ({ height = 16, width = '100%', style }) => (
  <MotiView
    from={{ opacity: 0.35 }}
    animate={{ opacity: 0.75 }}
    transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: true }}
    style={[{ height, width, backgroundColor: color.surfaceRaised, borderRadius: radius.sm }, style]}
  />
);

// Mirrors the ComplaintCard silhouette: title line, two metadata lines, a pill.
export const SkeletonCard = () => (
  <View style={s.card}>
    <View style={s.cardHeader}>
      <SkeletonBlock height={14} width="55%" />
      <SkeletonBlock height={20} width={72} />
    </View>
    <SkeletonBlock height={11} width="85%" />
    <SkeletonBlock height={11} width="65%" />
  </View>
);

export const SkeletonList = ({ count = 4 }) => (
  <View style={s.list}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
);

// Panel title + chart area, for the dashboard screens.
export const SkeletonPanel = ({ chartHeight = 180 }) => (
  <View style={s.panel}>
    <SkeletonBlock height={16} width="42%" />
    <SkeletonBlock height={chartHeight} style={s.chart} />
  </View>
);

const s = StyleSheet.create({
  list: { gap: space[3], padding: space[4] },
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[4],
    gap: space[2],
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panel: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[4],
    gap: space[3],
  },
  chart: { borderRadius: radius.md },
});

export default SkeletonList;
