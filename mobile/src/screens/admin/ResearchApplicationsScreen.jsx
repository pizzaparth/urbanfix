import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Screen, Card, Tappable, Field, FieldLabel, ChoiceGroup, FilterPill, PrimaryButton, DangerButton, ErrorNote,
  EmptyLine, BackHeader, Label,
} from '../../components/uikit.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import api from '../../services/api.js';
import { colors, uf as font, statusColors } from '../../theme.js';

const FILTERS = [
  { value: 'pending', label: 'Pending', color: statusColors.Pending },
  { value: 'approved', label: 'Approved', color: statusColors.Resolved },
  { value: 'rejected', label: 'Rejected', color: statusColors.Rejected },
];
const DAYS = [30, 60, 90, 180].map((d) => ({ value: d, label: `${d} days` }));
const SCOPES = [
  { value: 'aggregate_only', label: 'Statistics only' },
  { value: 'anonymised_records', label: 'Anonymised records' },
];

const ResearchApplicationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState('pending');
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState('');

  const [days, setDays] = useState(60);
  const [scope, setScope] = useState('aggregate_only');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fetchApps = useCallback(async () => {
    try {
      const res = await api.get('/admin/research-applications', { params: { status } });
      setApps(res.data.applications || []);
    } catch (err) {
      console.error('Error fetching applications:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  const { refreshing, refresh } = useAutoRefresh(fetchApps);

  const open = (a) => {
    setError('');
    if (openId === a._id) return setOpenId('');
    setOpenId(a._id);
    setDays(DAYS.some((d) => d.value === a.requestedDays) ? a.requestedDays : 60);
    // Record-level access is never pre-selected on the admin's behalf — even if
    // the applicant asked for it, granting it is a deliberate tick.
    setScope('aggregate_only');
    setNote('');
  };

  const decide = async (a, decision) => {
    setError('');
    if (decision === 'rejected' && note.trim().length < 5) {
      return setError('Give the applicant a short reason for rejecting.');
    }
    setBusy(true);
    try {
      await api.patch(`/admin/research-applications/${a._id}`, {
        decision,
        days: decision === 'approved' ? days : undefined,
        grantRecordAccess: decision === 'approved' ? scope === 'anonymised_records' : undefined,
        note: note.trim() || undefined,
      });
      setOpenId('');
      await fetchApps();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not record that decision.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      contentStyle={{ paddingTop: insets.top }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
    >
      <BackHeader title="Applications" onBack={() => navigation.goBack()} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {FILTERS.map((f) => (
          <FilterPill
            key={f.value}
            label={f.label}
            active={status === f.value}
            color={f.color}
            onPress={() => {
              setLoading(true);
              setOpenId('');
              setStatus(f.value);
            }}
          />
        ))}
      </ScrollView>

      <View style={s.body}>
        {loading ? <SkeletonList count={3} /> : null}
        {!loading && apps.length === 0 ? <EmptyLine>{`No ${status} applications.`}</EmptyLine> : null}

        {apps.map((a) => (
          <Card key={a._id} style={s.card}>
            <Tappable onPress={() => open(a)} scaleTo={0.99}>
              <Text style={s.name}>{a.fullName}</Text>
              <Text style={s.meta}>{a.email}</Text>
              <Text style={s.meta}>{`${a.title} · ${a.institute}`}</Text>
              <Text style={s.meta}>
                {`Asked for ${a.requestedDays} days · ${a.datasetScope === 'anonymised_records' ? 'records' : 'statistics'}`}
              </Text>
            </Tappable>

            {openId === a._id ? (
              <View style={s.panel}>
                <Label>Purpose</Label>
                <Text style={s.purpose}>{a.purpose}</Text>

                {a.status === 'pending' ? (
                  <View style={s.decide}>
                    <ErrorNote>{error}</ErrorNote>
                    <View>
                      <FieldLabel>Access period</FieldLabel>
                      <ChoiceGroup options={DAYS} value={days} onChange={setDays} color={colors.secondary} />
                    </View>
                    <View>
                      <FieldLabel>Data to grant</FieldLabel>
                      <ChoiceGroup options={SCOPES} value={scope} onChange={setScope} color={colors.secondary} />
                      <Text style={s.hint}>
                        Record-level access shows anonymised rows (ward, category, dates). Never names,
                        contact details or free text.
                      </Text>
                    </View>
                    <Field label="Note (required to reject)" value={note} onChangeText={setNote} placeholder="Shown to the applicant on rejection" multiline />
                    <PrimaryButton label={busy ? 'Working…' : 'Approve & email invite'} onPress={() => decide(a, 'approved')} disabled={busy} />
                    <DangerButton label="Reject" onPress={() => decide(a, 'rejected')} style={s.center} />
                  </View>
                ) : (
                  <Text style={s.hint}>
                    {a.status === 'approved' ? 'Approved' : 'Rejected'}
                    {a.reviewedBy?.name ? ` by ${a.reviewedBy.name}` : ''}
                    {a.reviewedAt ? ` on ${new Date(a.reviewedAt).toLocaleDateString()}` : ''}
                    {a.reviewNote ? ` — ${a.reviewNote}` : ''}
                  </Text>
                )}
              </View>
            ) : null}
          </Card>
        ))}
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({
  filterRow: { gap: 10, paddingHorizontal: 20, paddingVertical: 8 },
  body: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  card: { padding: 20 },
  name: { fontFamily: font.display, fontSize: 20, color: colors.text },
  meta: { fontFamily: font.body, fontSize: 14, color: colors.muted, marginTop: 3 },
  panel: { marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.border, gap: 4 },
  purpose: { fontFamily: font.body, fontSize: 15, lineHeight: 23, color: colors.body, marginBottom: 14 },
  decide: { gap: 20, marginTop: 6 },
  hint: { fontFamily: font.body, fontSize: 14, lineHeight: 21, color: colors.dim, marginTop: 10 },
  center: { alignItems: 'center' },
});

export default ResearchApplicationsScreen;
