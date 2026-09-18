import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, useWindowDimensions, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart, LineChart } from 'react-native-gifted-charts';
import { ClipboardList, LogOut } from 'lucide-react-native';
import { Panel, Button, Loading } from '../../components/ui.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';
import { CHART_COLORS, CHART_CATEGORY_COLORS, getCategoryColor } from '../../config/chartTheme.js';
import { color, space, radius, font, text, statusColor } from '../../theme.js';

const STATUS_KEYS = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

const URGENCY_COLORS = {
  'High Urgency': color.statusRejected,
  'Medium Urgency': color.statusPending,
  'Standard Urgency': color.accent,
};

const AdminDashboardScreen = ({ navigation }) => {
  const { user, logoutUser } = useAuth();
  const { width } = useWindowDimensions();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching admin stats:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Replaces the web app's window 'focus' listener + 10s polling interval.
  // Polling a phone on cellular would be wasteful; refocus is the right trigger.
  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  if (loading) return <Loading label="Loading dashboard…" />;

  const breakdown = stats?.statusBreakdown || {};
  const categories = stats?.categoryDistribution || [];
  const urgency = stats?.urgencyDistribution || [];
  const timeline = stats?.timelineTrend || [];

  const categoryTotal = categories.reduce((sum, c) => sum + (c.count || 0), 0) || 1;

  const categoryPie = categories.map((c, i) => ({
    value: c.count || 0,
    color: getCategoryColor(i),
    text: '',
  }));

  const urgencyPie = urgency.map((u) => ({
    value: u.count || 0,
    color: URGENCY_COLORS[u._id] || color.gray600,
  }));

  const lineData = timeline.map((t) => ({
    value: t.totalCount || 0,
    label: t._id?.slice(5), // MM-DD — the full date won't fit on a phone axis
  }));

  const chartWidth = width - space[4] * 2 - space[5] * 2;

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchStats();
          }}
          tintColor={color.accent}
        />
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
          {/* The web line chart carried a hand-written Canvas 2D crosshair plugin.
              That's raw canvas with no RN analogue, so it's dropped — gifted-charts'
              built-in pointer covers the same intent. */}
          <LineChart
            data={lineData}
            width={chartWidth}
            height={160}
            initialSpacing={10}
            spacing={Math.max(28, chartWidth / Math.max(lineData.length, 1))}
            thickness={2}
            color={CHART_COLORS.accent}
            dataPointsColor={CHART_COLORS.accent}
            startFillColor={CHART_COLORS.accent}
            endFillColor={color.surface}
            startOpacity={0.25}
            endOpacity={0}
            areaChart
            hideRules={false}
            rulesColor={CHART_COLORS.grid}
            rulesType="dashed"
            yAxisColor={CHART_COLORS.grid}
            xAxisColor={CHART_COLORS.grid}
            yAxisTextStyle={s.axisText}
            xAxisLabelTextStyle={s.axisText}
            noOfSections={4}
            pointerConfig={{
              pointerStripColor: CHART_COLORS.accent,
              pointerStripWidth: 1,
              pointerColor: CHART_COLORS.accent,
              radius: 4,
              pointerLabelWidth: 90,
              pointerLabelHeight: 34,
              pointerLabelComponent: (items) => (
                <View style={s.tooltip}>
                  <Text style={s.tooltipText}>{items[0]?.value} filed</Text>
                </View>
              ),
            }}
          />
        </Panel>
      ) : null}

      {categoryPie.length > 0 ? (
        <Panel style={s.panelGap}>
          <Text style={s.panelTitle}>Issues by Category</Text>
          <View style={s.chartCenter}>
            <PieChart
              data={categoryPie}
              donut
              radius={90}
              innerRadius={58}
              innerCircleColor={color.surface}
              centerLabelComponent={() => (
                <View style={s.center}>
                  <Text style={s.donutCenterValue}>{categoryTotal}</Text>
                  <Text style={s.donutCenterLabel}>total</Text>
                </View>
              )}
            />
          </View>
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
          <View style={s.chartCenter}>
            <PieChart
              data={urgencyPie}
              donut
              radius={78}
              innerRadius={48}
              innerCircleColor={color.surface}
            />
          </View>
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

  chartCenter: { alignItems: 'center', paddingVertical: space[2] },
  center: { alignItems: 'center' },
  donutCenterValue: { fontFamily: font.monoMedium, fontSize: 22, color: color.textPrimary },
  donutCenterLabel: { fontFamily: font.mono, fontSize: 11, color: color.textMuted },

  legend: { gap: space[2] },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { flex: 1, fontFamily: font.sans, fontSize: text.small, color: color.textSecondary },
  legendValue: { fontFamily: font.monoMedium, fontSize: text.monoSm, color: color.textPrimary },
  legendPct: { width: 38, textAlign: 'right', fontFamily: font.mono, fontSize: 11, color: color.textMuted },

  axisText: { color: color.textMuted, fontSize: 9, fontFamily: font.mono },
  tooltip: {
    backgroundColor: color.surfaceRaised,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.sm,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  tooltipText: { fontFamily: font.mono, fontSize: 11, color: color.textPrimary },
});

export default AdminDashboardScreen;
