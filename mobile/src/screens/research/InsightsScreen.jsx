import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Screen, PageTitle, Card, StatTile, PrimaryButton, GhostButton, ChoiceGroup, FieldLabel, EmptyLine, ErrorNote,
} from '../../components/uikit.jsx';
import RingChart from '../../components/RingChart.jsx';
import BarRows from '../../components/BarRows.jsx';
import { SkeletonPanel } from '../../components/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { colors, uf as font, statusColors, chartPalette, chartUrgency } from '../../theme.js';

const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const GROUPS = [
  { value: 'category', label: 'Category' },
  { value: 'ward', label: 'Ward' },
  { value: 'urgency', label: 'Urgency' },
  { value: 'month', label: 'Month' },
];
const STATUS_FILTERS = [{ value: '', label: 'Any status' }, ...STATUSES.map((s) => ({ value: s, label: s }))];

// Deliberately NOT polled. Every dashboard view and query writes a row to the
// research access log (that log is the privacy audit trail), so a 15s refresh
// would bury it in noise. Load once, refresh on pull.
const InsightsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [groupBy, setGroupBy] = useState('category');
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState(null);
  const [querying, setQuerying] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/research/dashboard');
      setDash(res.data.dashboard);
      setError('');
    } catch (err) {
      if (err.response?.data?.code !== 'RESEARCH_ACCESS_EXPIRED') {
        setError(err.response?.data?.message || 'Failed to load the dataset.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runQuery = async () => {
    setQuerying(true);
    setError('');
    try {
      const res = await api.get('/research/query', { params: { groupBy, status: status || undefined } });
      setRows(res.data.rows);
    } catch (err) {
      setError(err.response?.data?.message || 'Query failed.');
    } finally {
      setQuerying(false);
    }
  };

  const breakdown = dash?.statusBreakdown || {};
  const total = breakdown.total || 0;
  const resolved = breakdown.Resolved || 0;
  const ringPct = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const categoryRows = useMemo(() => (dash?.byCategory || []).slice(0, 6), [dash]);
  const wardRows = useMemo(() => dash?.byWard || [], [dash]);
  const urgencyRows = useMemo(() => dash?.byUrgency || [], [dash]);
  const monthRows = useMemo(() => dash?.byMonth || [], [dash]);

  const recordAccess = user?.researcher?.datasetScope === 'anonymised_records';

  return (
    <Screen
      contentStyle={{ paddingTop: insets.top }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={colors.accent}
        />
      }
    >
      <PageTitle sub="Anonymised civic data.">Insights</PageTitle>

      <View style={s.body}>
        <ErrorNote>{error}</ErrorNote>

        {loading ? (
          <>
            <SkeletonPanel chartHeight={110} />
            <SkeletonPanel />
          </>
        ) : dash && total === 0 ? (
          <EmptyLine>No complaints in the dataset yet.</EmptyLine>
        ) : dash ? (
          <>
            <Card style={s.ringCard}>
              <RingChart percent={ringPct} />
              <View style={s.flex1}>
                <Text style={s.ringTitle}>Resolution rate</Text>
                <Text style={s.ringSub}>{`${resolved} of ${total} resolved`}</Text>
              </View>
            </Card>

            <View style={s.kpiGrid}>
              {STATUSES.map((k) => (
                <StatTile key={k} style={s.kpiCell} label={k} value={breakdown[k] || 0} color={statusColors[k]} />
              ))}
            </View>

            <Card>
              <Text style={s.cardTitle}>By category</Text>
              <BarRows rows={categoryRows} color={(i) => chartPalette[i % chartPalette.length]} />
            </Card>

            <Card>
              <Text style={s.cardTitle}>By ward</Text>
              <BarRows rows={wardRows} color={chartPalette[1]} />
            </Card>

            <Card>
              <Text style={s.cardTitle}>By urgency</Text>
              <BarRows rows={urgencyRows} color={(_, r) => chartUrgency[r.key] || chartUrgency.Standard} />
            </Card>

            <Card>
              <Text style={s.cardTitle}>Filed per month</Text>
              <BarRows rows={monthRows} color={chartPalette[0]} />
            </Card>

            <Card>
              <Text style={s.cardTitle}>Explore</Text>
              <View style={s.explore}>
                <View>
                  <FieldLabel>Group by</FieldLabel>
                  <ChoiceGroup options={GROUPS} value={groupBy} onChange={setGroupBy} color={colors.secondary} />
                </View>
                <View>
                  <FieldLabel>Status</FieldLabel>
                  <ChoiceGroup options={STATUS_FILTERS} value={status} onChange={setStatus} color={colors.secondary} />
                </View>
                <GhostButton label={querying ? 'Running…' : 'Run query'} onPress={runQuery} />
              </View>
              {rows ? (
                <View style={s.result}>
                  {rows.length === 0 ? (
                    <EmptyLine>No matching records.</EmptyLine>
                  ) : (
                    <BarRows rows={rows.map((r) => ({ key: String(r.key), count: r.count }))} color={colors.secondary} />
                  )}
                </View>
              ) : null}
            </Card>

            {!recordAccess ? (
              <Text style={s.scope}>Your access covers aggregate statistics only.</Text>
            ) : null}

            <PrimaryButton label="Export data" onPress={() => navigation.navigate('Export')} style={s.exportBtn} />
          </>
        ) : null}
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({
  flex1: { flex: 1 },
  body: { paddingHorizontal: 20, gap: 14 },
  ringCard: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ringTitle: { fontFamily: font.display, fontSize: 24, lineHeight: 28, color: colors.text },
  ringSub: { fontFamily: font.bodyBold, fontSize: 17, color: colors.muted, marginTop: 8 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCell: { width: '48%', flexGrow: 1 },
  cardTitle: { fontFamily: font.display, fontSize: 24, color: colors.text, marginBottom: 22 },
  explore: { gap: 18 },
  result: { marginTop: 22 },
  scope: { fontFamily: font.body, fontSize: 14, color: colors.dim, textAlign: 'center' },
  exportBtn: { height: 66 },
});

export default InsightsScreen;
