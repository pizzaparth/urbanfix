import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GrowBar } from './uikit.jsx';
import { colors, uf as font, chartPalette } from '../theme.js';

export default function PeekGraph({ title, bars }) {
  return (
    <View style={s.container}>
      <Text style={s.cardTitle}>{title}</Text>
      
      {/* Horizontal Bar Chart for better label visibility */}
      <View style={s.list}>
        {bars.map((bar, i) => {
          const color = chartPalette[i % chartPalette.length];
          const pct = Math.max(bar.ratio * 100, 5); // at least 5%
          
          return (
            <View key={bar.label} style={s.row}>
              <View style={s.header}>
                <Text style={s.label}>{bar.label}</Text>
                <Text style={s.count}>{bar.count}</Text>
              </View>
              <View style={s.track}>
                <View style={[s.fill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%',
  },
  cardTitle: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.text,
    marginBottom: 24,
  },
  list: {
    gap: 20,
  },
  row: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontFamily: font.bodyBold,
    fontSize: 16,
    color: colors.text,
    flex: 1,
    paddingRight: 12,
  },
  count: {
    fontFamily: font.display,
    fontSize: 18,
    color: colors.muted,
  },
  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceInput,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
});
