import React, { useState, useCallback } from 'react';
import { View, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, PageTitle, StatTile, EmptyLine } from './uikit.jsx';
import ComplaintCard from './ComplaintCard.jsx';
import { SkeletonList } from './Skeleton.jsx';
import { useAutoRefresh } from '../hooks/useAutoRefresh.js';
import { stageLabel } from '../constants/stages.js';
import api from '../services/api.js';
import { colors, statusColors } from '../theme.js';

// A field employee's task list — `state` is 'active' or 'completed'. Both tabs
// are this component; only the query, title and empty line differ.
export default function TaskList({ navigation, state, title, sub, empty, showStats }) {
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const [list, st] = await Promise.all([
        api.get('/field/tasks', { params: { state } }),
        showStats ? api.get('/field/stats') : Promise.resolve(null),
      ]);
      setTasks(list.data.tasks || []);
      if (st) setStats(st.data.stats);
    } catch (err) {
      console.error('Error fetching tasks:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [state, showStats]);

  const { refreshing, refresh } = useAutoRefresh(fetchTasks);

  return (
    <Screen
      contentStyle={{ paddingTop: insets.top }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
    >
      <PageTitle sub={sub(tasks.length)}>{title}</PageTitle>

      {showStats && stats ? (
        <View style={s.statRow}>
          <StatTile style={s.flex1} label="Assigned" value={stats.assigned} color={statusColors.Pending} />
          <StatTile style={s.flex1} label="Working" value={stats.inProgress} color={statusColors['In Progress']} />
          <StatTile style={s.flex1} label="Review" value={stats.awaitingReview} color={statusColors.Resolved} />
        </View>
      ) : null}

      <View style={s.list}>
        {loading ? (
          <SkeletonList count={3} />
        ) : (
          tasks.map((t) => (
            <ComplaintCard
              key={t._id}
              item={t}
              badge={stageLabel(t.stage)}
              onPress={() => navigation.navigate('TaskDetail', { id: t._id })}
            />
          ))
        )}
        {!loading && tasks.length === 0 ? <EmptyLine>{empty}</EmptyLine> : null}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  statRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 6 },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
});
