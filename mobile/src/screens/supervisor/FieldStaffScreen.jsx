import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, PageTitle, Card, FilterPill, Label, StatusDot, EmptyLine } from '../../components/uikit.jsx';
import LeaveRequests from '../../components/LeaveRequests.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import { WARDS } from '../../constants/wards.js';
import api from '../../services/api.js';
import { colors, uf as font, statusColors } from '../../theme.js';

const FieldStaffScreen = () => {
  const insets = useSafeAreaInsets();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ward, setWard] = useState('All');

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get('/supervisor/field-staff', {
        params: { ward: ward === 'All' ? undefined : ward },
      });
      setStaff(res.data.staff || []);
    } catch (err) {
      console.error('Error fetching roster:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [ward]);

  const { refreshing, refresh } = useAutoRefresh(fetchStaff);

  return (
    <Screen
      contentStyle={{ paddingTop: insets.top }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
    >
      <PageTitle sub="Roster, workload, leave.">Field staff</PageTitle>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {['All', ...WARDS].map((w) => (
          <FilterPill
            key={w}
            label={w}
            active={ward === w}
            color={w === 'All' ? colors.text : colors.secondary}
            onPress={() => setWard(w)}
          />
        ))}
      </ScrollView>

      <View style={s.body}>
        <View>
          <Label>Roster</Label>
          {loading ? <SkeletonList count={3} /> : null}
          {!loading && staff.length === 0 ? <EmptyLine>No field staff in this view.</EmptyLine> : null}
          <View style={s.list}>
            {staff.map((p) => (
              <Card key={p._id} style={s.card}>
                <View style={s.head}>
                  <View style={s.flex1}>
                    <Text style={s.name}>{p.name}</Text>
                    <Text style={s.meta}>
                      {[p.employee?.employeeCode, p.employee?.ward].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <View style={s.badge}>
                    <StatusDot
                      color={p.onLeaveToday ? statusColors.Pending : p.checkedInToday ? statusColors.Resolved : colors.borderStrong}
                    />
                    <Text style={s.badgeText}>
                      {p.onLeaveToday ? 'On leave' : p.checkedInToday ? 'In today' : 'Not in'}
                    </Text>
                  </View>
                </View>
                <View style={s.counts}>
                  <View>
                    <Text style={s.count}>{p.activeTasks}</Text>
                    <Text style={s.countLabel}>Active</Text>
                  </View>
                  <View>
                    <Text style={s.count}>{p.completedTasks}</Text>
                    <Text style={s.countLabel}>Completed</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>

        <View>
          <Label>Leave requests</Label>
          <LeaveRequests base="/supervisor" />
        </View>
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({
  flex1: { flex: 1 },
  filterRow: { gap: 10, paddingHorizontal: 20, paddingVertical: 8 },
  body: { paddingHorizontal: 20, paddingTop: 12, gap: 24 },
  list: { gap: 12 },
  card: { padding: 20 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: font.display, fontSize: 20, color: colors.text },
  meta: { fontFamily: font.body, fontSize: 14, color: colors.dim, marginTop: 3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeText: { fontFamily: font.bodyBold, fontSize: 14, color: colors.muted },
  counts: { flexDirection: 'row', gap: 32, marginTop: 16 },
  count: { fontFamily: font.display, fontSize: 30, color: colors.text },
  countLabel: { fontFamily: font.body, fontSize: 13, color: colors.dim, marginTop: 2 },
});

export default FieldStaffScreen;
