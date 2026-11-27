import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen, Card, PrimaryButton, DangerButton, GrowBar } from '../../components/uikit.jsx';
import RingChart from '../../components/RingChart.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import api from '../../services/api.js';
import { colors, uf as font, statusColors, chartPalette, chartUrgency } from '../../theme.js';

const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

export default function AdminDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logoutUser } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching admin stats:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const { refreshing, refresh } = useAutoRefresh(fetchStats);

  const breakdown = stats?.statusBreakdown || {};
  
  const kpis = useMemo(
    () => STATUSES.map((k) => ({ label: k, value: breakdown[k] || 0, color: statusColors[k] })),
    [breakdown]
  );

  const resolvedCount = breakdown['Resolved'] || 0;
  const totalComplaints = breakdown.total || 0;
  const ringPct = totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 0;

  const categoryBars = useMemo(() => {
    const bars = (stats?.categoryDistribution || []).map(c => ({
      label: c._id,
      shortLabel: c._id.split(' ')[0],
      count: c.count
    })).sort((a,b) => b.count - a.count).slice(0, 4);
    
    const maxCatCount = Math.max(...bars.map(c => c.count), 1);
    bars.forEach(c => c.ratio = c.count / maxCatCount);
    return bars;
  }, [stats?.categoryDistribution]);

  const urgencyBars = useMemo(() => {
    const dist = stats?.urgencyDistribution || [];
    const totalUrgency = dist.reduce((acc, curr) => acc + curr.count, 0) || 1;
    return dist.map(u => ({
      label: u._id,
      count: u.count,
      pct: Math.round((u.count / totalUrgency) * 100),
      color: chartUrgency[u._id] || chartUrgency['Standard']
    })).sort((a,b) => b.count - a.count);
  }, [stats?.urgencyDistribution]);

  // P9: per-ward flag rate and median days to closure, so a ward whose
  // complaints the model flags more often, or that waits longer, is visible.
  const wards = stats?.wardMonitoring || [];

  return (
    <Screen 
      contentStyle={{ paddingTop: insets.top }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
    >
      <View style={s.header}>
        <Text style={s.title}>Admin console</Text>
        <DangerButton label="Sign out" onPress={logoutUser} />
      </View>

      <Animated.View entering={FadeInDown.duration(420)}>
        <Card style={s.ringCard}>
          <RingChart percent={ringPct} />
          <View style={{ flex: 1 }}>
            <Text style={s.ringTitle}>Resolution rate</Text>
            <Text style={s.ringSub}>{resolvedCount + ' of ' + totalComplaints + ' closed'}</Text>
          </View>
        </Card>
      </Animated.View>

      <View style={s.kpiGrid}>
        {kpis.map((k, i) => (
          <Animated.View key={k.label} entering={FadeInDown.duration(420).delay(60 + i * 50)} style={s.kpiCell}>
            <View style={s.kpiCard}>
              <View style={s.kpiHead}>
                <View style={[s.kpiDot, { backgroundColor: k.color }]} />
                <Text numberOfLines={1} style={s.kpiLabel}>{k.label}</Text>
              </View>
              <Text style={s.kpiValue}>{k.value}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <PrimaryButton label="Manage complaints" onPress={() => navigation.navigate('Complaints')} style={{ height: 66 }} />
      </View>

      {categoryBars.length > 0 && (
        <Card style={s.chartCard}>
          <Text style={s.cardTitle}>By category</Text>
          <View style={s.chartRow}>
            {categoryBars.map((bar, i) => (
              <View key={bar.label} style={s.barCol}>
                <Text style={s.barCount}>{bar.count}</Text>
                <GrowBar height={24 + bar.ratio * 90} color={chartPalette[i % chartPalette.length]} />
                <Text numberOfLines={1} style={s.barLabel}>{bar.shortLabel}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {urgencyBars.length > 0 && (
        <Card style={s.chartCard}>
          <Text style={s.cardTitle}>By urgency</Text>
          <View style={{ gap: 18 }}>
            {urgencyBars.map((bar) => (
              <View key={bar.label}>
                <View style={s.urgHead}>
                  <Text style={s.urgLabel}>{bar.label}</Text>
                  <Text style={s.urgMeta}>{bar.count + '  ·  ' + bar.pct + '%'}</Text>
                </View>
                <View style={s.urgTrack}>
                  <View style={[s.urgFill, { width: bar.pct + '%', backgroundColor: bar.color }]} />
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {wards.length > 0 && (
        <Card style={s.chartCard}>
          <Text style={s.cardTitle}>By ward</Text>
          <Text style={s.wardNote}>
            Model flag rate among checked complaints, and median days to closure. Complaint counts reflect who
            reports, not need.
          </Text>
          <View style={s.wardHeadRow}>
            <Text style={[s.wardCell, s.wardName, s.wardHead]}>Ward</Text>
            <Text style={[s.wardCell, s.wardHead]}>Filed</Text>
            <Text style={[s.wardCell, s.wardHead]}>Flagged</Text>
            <Text style={[s.wardCell, s.wardHead]}>Median days</Text>
          </View>
          {wards.map((w) => (
            <View key={w.ward} style={s.wardRow}>
              <Text numberOfLines={1} style={[s.wardCell, s.wardName]}>{w.ward}</Text>
              <Text style={s.wardCell}>{w.filed}</Text>
              <Text style={s.wardCell}>{w.flagRate == null ? '—' : Math.round(w.flagRate * 100) + '%'}</Text>
              <Text style={s.wardCell}>{w.medianResolutionDays == null ? '—' : String(w.medianResolutionDays)}</Text>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  wardNote: { fontFamily: font.bodyBold, fontSize: 14, lineHeight: 19, color: colors.muted, marginTop: -6, marginBottom: 14 },
  wardHeadRow: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceInput },
  wardRow: { flexDirection: 'row', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.surfaceInput },
  wardCell: { flex: 1, fontFamily: font.bodyBold, fontSize: 15, color: colors.text, textAlign: 'right' },
  wardName: { flex: 1.4, textAlign: 'left' },
  wardHead: { color: colors.muted, fontSize: 13 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 26, paddingBottom: 14 },
  title: { flex: 1, fontFamily: font.display, fontSize: 34, lineHeight: 36, color: colors.accent, letterSpacing: -0.4 },
  ringCard: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 20 },
  ringTitle: { fontFamily: font.display, fontSize: 24, lineHeight: 28, color: colors.text },
  ringSub: { fontFamily: font.bodyBold, fontSize: 17, color: colors.muted, marginTop: 8 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, paddingTop: 14, gap: 10 },
  kpiCell: { width: '48%', flexGrow: 1 },
  kpiCard: { padding: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22 },
  kpiHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kpiDot: { width: 10, height: 10, borderRadius: 5 },
  kpiLabel: { flex: 1, fontFamily: font.bodyBold, fontSize: 16, color: colors.text },
  kpiValue: { fontFamily: font.display, fontSize: 44, lineHeight: 46, color: colors.text, marginTop: 10 },
  chartCard: { marginHorizontal: 20, marginTop: 14, padding: 20 },
  cardTitle: { fontFamily: font.display, fontSize: 24, color: colors.text, marginBottom: 22 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, height: 210 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 8 },
  barCount: { fontFamily: font.display, fontSize: 26, color: colors.text },
  barLabel: { fontFamily: font.bodyBold, fontSize: 15, color: colors.muted, lineHeight: 20, paddingBottom: 4 },
  urgHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9, gap: 10 },
  urgLabel: { fontFamily: font.bodyBold, fontSize: 18, color: colors.text },
  urgMeta: { fontFamily: font.display, fontSize: 17, color: colors.muted },
  urgTrack: { height: 14, borderRadius: 7, backgroundColor: colors.surfaceInput, overflow: 'hidden' },
  urgFill: { height: 14, borderRadius: 7 },
});
