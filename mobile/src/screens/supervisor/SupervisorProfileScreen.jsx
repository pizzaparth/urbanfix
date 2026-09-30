import React, { useState, useCallback } from 'react';
import { View, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, StatTile, Label } from '../../components/uikit.jsx';
import ProfileHeader from '../../components/ProfileHeader.jsx';
import AttendanceLeavePanel from '../../components/AttendanceLeavePanel.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import api from '../../services/api.js';
import { colors, statusColors } from '../../theme.js';

const SupervisorProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, logoutUser } = useAuth();
  const [stats, setStats] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/supervisor/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching supervisor stats:', err?.message);
    }
  }, []);

  const { refreshing, refresh } = useAutoRefresh(fetchStats);

  const meta = [user?.employee?.employeeCode, user?.employee?.ward].filter(Boolean).join(' · ');

  return (
    <Screen
      contentStyle={{ paddingTop: insets.top }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
    >
      <ProfileHeader user={user} meta={meta} onSignOut={logoutUser} />

      <View style={s.body}>
        <View>
          <Label>Across the city</Label>
          <View style={s.grid}>
            <StatTile style={s.cell} label="To triage" value={stats?.awaitingTriage ?? 0} color={statusColors.Pending} />
            <StatTile style={s.cell} label="To assign" value={stats?.awaitingAssignment ?? 0} color={statusColors['In Progress']} />
            <StatTile style={s.cell} label="To review" value={stats?.awaitingReview ?? 0} color={statusColors.Rejected} />
            <StatTile style={s.cell} label="Closed / wk" value={stats?.closedThisWeek ?? 0} color={statusColors.Resolved} />
          </View>
        </View>

        <AttendanceLeavePanel base="/supervisor" leavePath="/my-leave" />
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '48%', flexGrow: 1 },
});

export default SupervisorProfileScreen;
