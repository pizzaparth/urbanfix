import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Screen, PageTitle, Card, Tappable, PrimaryButton, GhostButton, FilterPill, StatusDot, EmptyLine, Label,
} from '../../components/uikit.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import api from '../../services/api.js';
import { colors, uf as font, statusColors } from '../../theme.js';

const SEGMENTS = [
  { value: 'staff', label: 'Employees' },
  { value: 'researcher', label: 'Researchers' },
];

const PeopleScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState([]);
  const [pendingApps, setPendingApps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState('staff');

  const fetchPeople = useCallback(async () => {
    try {
      const [u, apps] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/research-applications', { params: { status: 'pending' } }),
      ]);
      setUsers(u.data.users || []);
      setPendingApps(apps.data.results || 0);
    } catch (err) {
      console.error('Error fetching people:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const { refreshing, refresh } = useAutoRefresh(fetchPeople);

  const visible = useMemo(
    () => users.filter((u) => (segment === 'researcher' ? u.role === 'researcher' : u.role !== 'researcher')),
    [users, segment]
  );

  return (
    <Screen
      contentStyle={{ paddingTop: insets.top }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
    >
      <PageTitle sub="Staff, researchers, approvals.">People</PageTitle>

      <View style={s.body}>
        <PrimaryButton label="Add employee" onPress={() => navigation.navigate('UserForm')} style={s.add} />

        <View style={s.linkRow}>
          <View style={s.flex1}>
            <GhostButton
              label={pendingApps > 0 ? `Applications (${pendingApps})` : 'Applications'}
              color={pendingApps > 0 ? colors.accent : colors.text}
              onPress={() => navigation.navigate('ResearchApplications')}
            />
          </View>
          <View style={s.flex1}>
            <GhostButton label="Leave" onPress={() => navigation.navigate('LeaveApprovals')} />
          </View>
          <View style={s.flex1}>
            <GhostButton label="Audit" onPress={() => navigation.navigate('ResearchAudit')} />
          </View>
        </View>

        <View style={s.segRow}>
          {SEGMENTS.map((sg) => (
            <FilterPill
              key={sg.value}
              label={sg.label}
              active={segment === sg.value}
              color={colors.text}
              onPress={() => setSegment(sg.value)}
            />
          ))}
        </View>

        <View>
          <Label>{`${visible.length} ${segment === 'researcher' ? 'researchers' : 'employees'}`}</Label>
          {loading ? <SkeletonList count={4} /> : null}
          {!loading && visible.length === 0 ? <EmptyLine>Nobody here yet.</EmptyLine> : null}
          <View style={s.list}>
            {visible.map((u) => (
              <Tappable
                key={u._id}
                onPress={() => navigation.navigate('UserForm', { userId: u._id })}
                scaleTo={0.98}
                style={[s.row, u.isActive === false && s.rowOff]}
              >
                <View style={s.flex1}>
                  <Text style={s.name}>{u.name}</Text>
                  <Text style={s.meta}>{u.email}</Text>
                  <Text style={s.meta}>
                    {u.role === 'researcher'
                      ? [u.researcher?.institute, u.researcher?.accessExpiresAt ? `ends ${new Date(u.researcher.accessExpiresAt).toLocaleDateString()}` : null]
                          .filter(Boolean)
                          .join(' · ')
                      : [u.role, u.employee?.employeeCode, u.employee?.ward].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <View style={s.state}>
                  <StatusDot
                    color={
                      u.isActive === false
                        ? statusColors.Rejected
                        : u.mustSetPassword
                          ? statusColors.Pending
                          : statusColors.Resolved
                    }
                  />
                  <Text style={s.stateText}>
                    {u.isActive === false ? 'Inactive' : u.mustSetPassword ? 'Invited' : 'Active'}
                  </Text>
                </View>
              </Tappable>
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({
  flex1: { flex: 1 },
  body: { paddingHorizontal: 20, gap: 16 },
  add: { height: 66 },
  linkRow: { flexDirection: 'row', gap: 10 },
  segRow: { flexDirection: 'row', gap: 10 },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowOff: { opacity: 0.55 },
  name: { fontFamily: font.display, fontSize: 19, color: colors.text },
  meta: { fontFamily: font.body, fontSize: 14, color: colors.muted, marginTop: 3, textTransform: 'none' },
  state: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  stateText: { fontFamily: font.bodyBold, fontSize: 13, color: colors.muted },
});

export default PeopleScreen;
