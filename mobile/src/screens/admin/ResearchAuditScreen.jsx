import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, Card, GhostButton, EmptyLine, BackHeader, Label } from '../../components/uikit.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';
import api from '../../services/api.js';
import { colors, uf as font } from '../../theme.js';

const ACTION_LABEL = { view_dashboard: 'Viewed dashboard', query: 'Ran a query', export: 'Exported data' };

// Who looked at the dataset, when, and how much. Loaded on demand rather than
// polled — the log is the audit trail, not a live feed.
const ResearchAuditScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p) => {
    try {
      const res = await api.get('/admin/audit/research', { params: { page: p, limit: 30 } });
      setLogs((prev) => (p === 1 ? res.data.logs : [...prev, ...res.data.logs]));
      setPages(res.data.pagination?.pages || 1);
      setPage(p);
    } catch (err) {
      console.error('Error fetching audit log:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      <BackHeader title="Research audit" onBack={() => navigation.goBack()} />
      <View style={s.body}>
        <Label>Access log</Label>
        {loading ? <SkeletonList count={4} /> : null}
        {!loading && logs.length === 0 ? <EmptyLine>No research access yet.</EmptyLine> : null}
        {logs.map((l) => (
          <Card key={l._id} style={s.card}>
            <Text style={s.action}>{ACTION_LABEL[l.action] || l.action}</Text>
            <Text style={s.who}>{l.researcherId?.name || 'Unknown'} · {l.researcherId?.email || ''}</Text>
            <Text style={s.meta}>
              {`${l.recordCount} rows${l.exportFormat ? ` · ${l.exportFormat.toUpperCase()}` : ''} · ${new Date(l.createdAt).toLocaleString()}`}
            </Text>
          </Card>
        ))}
        {page < pages ? <GhostButton label="Load more" onPress={() => load(page + 1)} /> : null}
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  card: { padding: 18 },
  action: { fontFamily: font.display, fontSize: 18, color: colors.text },
  who: { fontFamily: font.bodyBold, fontSize: 14, color: colors.muted, marginTop: 4 },
  meta: { fontFamily: font.body, fontSize: 13, color: colors.dim, marginTop: 4 },
});

export default ResearchAuditScreen;
