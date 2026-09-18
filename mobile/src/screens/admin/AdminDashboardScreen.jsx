import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { ClipboardList, LogOut } from 'lucide-react-native';
import DonutChart from '../../components/charts/DonutChart.jsx';
import TrendChart from '../../components/charts/TrendChart.jsx';
import RefreshBar from '../../components/RefreshBar.jsx';
import { SkeletonBlock, SkeletonPanel } from '../../components/Skeleton.jsx';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import { Panel, Button } from '../../components/ui.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';
import { getCategoryColor } from '../../config/chartTheme.js';
import { color, space, radius, font, text, statusColor } from '../../theme.js';

const STATUS_KEYS = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

const URGENCY_COLORS = {
  'High Urgency': color.statusRejected,
  'Medium Urgency': color.statusPending,
  'Standard Urgency': color.accent,
};

const AdminDashboardScreen = ({ navigation }) => {
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

  // An admin watching this dashboard needs the numbers to move as complaints
  // land, so it polls while focused and stops when it isn't — see the hook for
  // why that's still battery-safe on a phone.
  const { refreshing, refresh, lastUpdatedAt } = useAutoRefresh(fetchStats);

  // A dashboard is mostly panels and charts, so the skeleton mirrors that shape
  // rather than showing a spinner over an empty screen.
  if (loading) {
    return (
      <View style={[s.screen, s.content]}>
        <SkeletonBlock height={18} width="45%" />
        <SkeletonPanel chartHeight={120} />
        <SkeletonPanel chartHeight={190} />
      </View>
    );
  }

  const breakdown = stats?.statusBreakdown || {};
  const categories = stats?.categoryDistribution || [];
  const urgency = stats?.urgencyDistribution || [];
  const timeline = stats?.timelineTrend || [];

  const categoryTotal = categories.reduce((sum, c) => sum + (c.count || 0), 0) || 1;

  const categoryPie = categories.map((c, i) => ({
    value: c.count || 0,
    color: getCategoryColor(i),
    label: c._id || 'Other',
  }));

  const urgencyPie = urgency.map((u) => ({
    value: u.count || 0,
    color: URGENCY_COLORS[u._id] || color.gray600,
    label: u._id || 'Unknown',
  }));

  // CartesianChart plots against a numeric x, so the index is the x value and
  // the MM-DD string rides along for the axis label — the full date won't fit
  // on a phone axis.
  const lineData = timeline.map((t, i) => ({
    x: i,
    y: t.totalCount || 0,
    label: t._id?.slice(5),
  }));

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.accent} />
      }
    >
      <View style={s.userRow}>
        <View style={s.flex1}>
          <Text style={s.hello}>{user?.name}</Text>
          <Text style={s.email}>Administrator</Text>
        </View>
        <Button
          title="Sign out"
          variant="ghost"
          size="sm"
          onPress={logoutUser}
          icon={<LogOut size={14} strokeWidth={ICON_STROKE} />}
        />
      </View>

      <RefreshBar lastUpdatedAt={lastUpdatedAt} refreshing={refreshing} onRefresh={refresh} />

      {/* KPI tiles — the web grid of counters, stacked two-up for a phone. */}
      <View style={s.kpiGrid}>
        {STATUS_KEYS.map((k) => (
          <View key={k} style={s.kpiTile}>
            <Text style={[s.kpiValue, { color: statusColor[k] }]}>{breakdown[k] || 0}</Text>
            <Text style={s.kpiLabel}>{k}</Text>
          </View>
        ))}
      </View>

      <Panel style={s.panelGap}>
        <Text style={s.panelTitle}>Total Issues</Text>
        <Text style={s.bigNumber}>{breakdown.total || 0}</Text>
      </Panel>

      <Button
        title="Manage Complaints"
        onPress={() => navigation.navigate('AdminAction')}
        icon={<ClipboardList size={16} strokeWidth={ICON_STROKE} />}
      />

      {timeline.length > 0 ? (
        <Panel style={s.panelGap}>
          <Text style={s.panelTitle}>Filing Timeline</Text>
          <TrendChart data={lineData} />
        </Panel>
      ) : null}

      {categoryPie.length > 0 ? (
        <Panel style={s.panelGap}>
          <Text style={s.panelTitle}>Issues by Category</Text>
          <DonutChart data={categoryPie} size={200} centerValue={categoryTotal} centerLabel="total" />
          {/* A slice is never identified by color alone — every category keeps a
              visible label with its count and share. */}
          <View style={s.legend}>
            {categories.map((c, i) => (
              <View key={c._id || i} style={s.legendRow}>
                <View style={[s.swatch, { backgroundColor: getCategoryColor(i) }]} />
                <Text style={s.legendLabel} numberOfLines={1}>
                  {c._id}
                </Text>
                <Text style={s.legendValue}>{c.count}</Text>
                <Text style={s.legendPct}>
                  {Math.round(((c.count || 0) / categoryTotal) * 100)}%
                </Text>
              </View>
            ))}
          </View>
        </Panel>
      ) : null}

      {urgencyPie.length > 0 ? (
        <Panel style={s.panelGap}>
          <Text style={s.panelTitle}>Urgency Distribution</Text>
          <DonutChart data={urgencyPie} size={176} />
          <View style={s.legend}>
            {urgency.map((u) => (
              <View key={u._id} style={s.legendRow}>
                <View
                  style={[s.swatch, { backgroundColor: URGENCY_COLORS[u._id] || color.gray600 }]}
                />
                <Text style={s.legendLabel} numberOfLines={1}>
                  {u._id}
                </Text>
                <Text style={s.legendValue}>{u.count}</Text>
              </View>
            ))}
          </View>
        </Panel>
      ) : null}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space[4], paddingBottom: space[8], gap: space[4] },
  flex1: { flex: 1 },
  panelGap: { gap: space[3] },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  hello: { fontFamily: font.sansSemibold, fontSize: text.h3, color: color.textPrimary },
  email: { fontFamily: font.sans, fontSize: text.small, color: color.textMuted },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  kpiTile: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[4],
    gap: space[1],
  },
  kpiValue: { fontFamily: font.monoMedium, fontSize: 26 },
  kpiLabel: { fontFamily: font.sans, fontSize: text.small, color: color.textMuted },

  panelTitle: { fontFamily: font.sansSemibold, fontSize: text.h3, color: color.textPrimary },
  bigNumber: { fontFamily: font.monoMedium, fontSize: 34, color: color.textPrimary },

  center: { alignItems: 'center' },

  legend: { gap: space[2] },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { flex: 1, fontFamily: font.sans, fontSize: text.small, color: color.textSecondary },
  legendValue: { fontFamily: font.monoMedium, fontSize: text.monoSm, color: color.textPrimary },
  legendPct: { width: 38, textAlign: 'right', fontFamily: font.mono, fontSize: 11, color: color.textMuted },

});

export default AdminDashboardScreen;
