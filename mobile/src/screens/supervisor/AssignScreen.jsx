import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Screen, Tappable, PrimaryButton, ErrorNote, Field, Label, BackHeader, EmptyLine, StatusDot,
} from '../../components/uikit.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import api from '../../services/api.js';
import { colors, uf as font, statusColors } from '../../theme.js';

// Pick a field employee for a complaint. A supervisor can only choose someone
// who covers the complaint's ward and isn't on leave; an admin can override the
// ward (the server enforces both — this just greys out what it would refuse).
const AssignScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { id, ward, title } = route.params || {};

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get('/supervisor/field-staff');
      setStaff(res.data.staff || []);
    } catch (err) {
      console.error('Error fetching field staff:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useAutoRefresh(fetchStaff);

  const blockedReason = (p) => {
    if (p.onLeaveToday) return 'On leave today';
    if (user.role !== 'admin' && ward && p.employee?.ward && p.employee.ward !== ward) {
      return `Covers ${p.employee.ward}`;
    }
    return '';
  };

  // Same-ward staff first, then the rest.
  const sorted = [...staff].sort((a, b) => {
    const am = a.employee?.ward === ward ? 0 : 1;
    const bm = b.employee?.ward === ward ? 0 : 1;
    return am - bm || (a.activeTasks - b.activeTasks);
  });

  const submit = async () => {
    setError('');
    if (!selected) return setError('Choose a field employee first.');
    setBusy(true);
    try {
      await api.patch(`/supervisor/complaints/${id}/assign`, {
        fieldEmployeeId: selected,
        note: note.trim() || undefined,
      });
      navigation.goBack();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not assign this complaint.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      <BackHeader title="Assign" onBack={() => navigation.goBack()} />
      <View style={s.body}>
        <View>
          <Text style={s.title}>{title}</Text>
          <Text style={s.sub}>{ward ? `${ward} · ` : ''}choose who takes it</Text>
        </View>

        <ErrorNote>{error}</ErrorNote>

        <View>
          <Label>Field staff</Label>
          {loading ? <SkeletonList count={3} /> : null}
          {!loading && sorted.length === 0 ? <EmptyLine>No field staff available.</EmptyLine> : null}
          <View style={s.list}>
            {sorted.map((p) => {
              const blocked = blockedReason(p);
              const active = selected === p._id;
              return (
                <Tappable
                  key={p._id}
                  onPress={() => !blocked && setSelected(p._id)}
                  disabled={Boolean(blocked)}
                  scaleTo={0.98}
                  style={[
                    s.row,
                    { borderColor: active ? colors.accent : colors.borderStrong, opacity: blocked ? 0.4 : 1 },
                  ]}
                >
                  <View style={s.flex1}>
                    <Text style={s.name}>{p.name}</Text>
                    <Text style={s.meta}>
                      {[p.employee?.employeeCode, p.employee?.ward].filter(Boolean).join(' · ')}
                    </Text>
                    <Text style={s.meta}>{`${p.activeTasks} active · ${p.completedTasks} done`}</Text>
                  </View>
                  {blocked ? (
                    <Text style={s.blocked}>{blocked}</Text>
                  ) : (
                    <StatusDot color={p.checkedInToday ? statusColors.Resolved : colors.borderStrong} />
                  )}
                </Tappable>
              );
            })}
          </View>
        </View>

        <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Anything they should know" multiline />

        <PrimaryButton label={busy ? 'Assigning…' : 'Assign'} onPress={submit} disabled={busy} />
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({
  flex1: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 8, gap: 20 },
  title: { fontFamily: font.display, fontSize: 26, lineHeight: 31, color: colors.text },
  sub: { fontFamily: font.bodyBold, fontSize: 15, color: colors.muted, marginTop: 6 },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  name: { fontFamily: font.display, fontSize: 17, color: colors.text },
  meta: { fontFamily: font.body, fontSize: 14, color: colors.muted, marginTop: 3 },
  blocked: { fontFamily: font.bodyBold, fontSize: 13, color: colors.dim },
});

export default AssignScreen;
