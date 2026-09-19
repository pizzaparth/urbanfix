import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen, Card, Tappable, GrowBar } from '../components/ui';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { buildCategoryBars } from '../data/mock';
import { colors, font, radius, chartPalette } from '../theme';

export default function HomeScreen({ navigation }) {
  const { complaints } = useApp();
  const insets = useSafeAreaInsets();

  const stats = useMemo(() => ({
    total: complaints.length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
    open: complaints.filter((c) => c.status === 'Pending' || c.status === 'In Progress').length,
  }), [complaints]);

  const bars = useMemo(() => buildCategoryBars(complaints), [complaints]);

  const entries = [
    { key: 'Registry', label: 'Browse registry', icon: 'list' },
    { key: 'Report', label: 'Report an issue', icon: 'plusBare' },
    { key: 'Track', label: 'Track a ticket', icon: 'search' },
  ];

  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      <Animated.View entering={FadeInDown.duration(420)} style={s.header}>
        <Text style={s.wordmark}>URBANFIX</Text>
        <Text style={s.hero}>Fix your{'\n'}neighborhood.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(60)} style={s.statRow}>
        <Stat value={stats.total} label="Filed" />
        <View style={s.statDivider} />
        <Stat value={stats.resolved} label="Resolved" />
        <View style={s.statDivider} />
        <Stat value={stats.open} label="Open" />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(120)}>
        <Card style={s.chartCard}>
          <Text style={s.cardTitle}>Top issues this month</Text>
          <View style={s.chartRow}>
            {bars.map((bar, i) => (
              <View key={bar.label} style={s.barCol}>
                <Text style={s.barCount}>{bar.count}</Text>
                <GrowBar height={24 + bar.ratio * 106} color={chartPalette[i % chartPalette.length]} />
                <Text numberOfLines={1} style={s.barLabel}>{bar.shortLabel}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>

      <View style={s.entryList}>
        {entries.map((e, i) => (
          <Animated.View key={e.key} entering={FadeInDown.duration(420).delay(170 + i * 60)}>
            <Tappable onPress={() => navigation.navigate(e.key)} style={s.entryRow}>
              <View style={s.entryIcon}>
                <Icon name={e.icon} size={22} color={colors.text} strokeWidth={2.2} />
              </View>
              <Text style={s.entryLabel}>{e.label}</Text>
              <View style={s.entryArrow}>
                <Icon name="chevronRight" size={18} color={colors.accentInk} strokeWidth={2.8} />
              </View>
            </Tappable>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

function Stat({ value, label }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 4 },
  wordmark: { fontFamily: font.display, fontSize: 22, letterSpacing: 2.6, color: colors.accent },
  hero: { fontFamily: font.display, fontSize: 52, lineHeight: 54, color: colors.text, marginTop: 8, letterSpacing: -0.6 },
  statRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 24,
    overflow: 'hidden',
  },
  statDivider: { width: 1, backgroundColor: colors.borderStrong },
  stat: { flex: 1, paddingVertical: 22, alignItems: 'center' },
  statValue: { fontFamily: font.display, fontSize: 44, lineHeight: 46, color: colors.text },
  statLabel: { fontFamily: font.body, fontSize: 13, color: colors.muted, marginTop: 6 },
  chartCard: { marginHorizontal: 20, marginTop: 20 },
  cardTitle: { fontFamily: font.display, fontSize: 20, color: colors.text, marginBottom: 22 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, height: 200 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 10 },
  barCount: { fontFamily: font.display, fontSize: 26, color: colors.text },
  barLabel: { fontFamily: font.body, fontSize: 14, color: colors.muted, maxWidth: 72 },
  entryList: { paddingHorizontal: 20, paddingTop: 22, gap: 12 },
  entryRow: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  entryIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  entryLabel: { flex: 1, fontFamily: font.display, fontSize: 18, color: colors.text },
  entryArrow: {
    width: 48, height: 48, borderRadius: 24, marginRight: 6,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
});
