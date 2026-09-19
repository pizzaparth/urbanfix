import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Screen, FilterPill, Tappable } from '../components/ui';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { formatDate } from '../data/mock';
import { colors, font, statusColors } from '../theme';

const FILTERS = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'];

export default function AdminQueueScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { complaints } = useApp();
  const [filter, setFilter] = useState('All');

  const list = useMemo(
    () => complaints.filter((c) => filter === 'All' || c.status === filter),
    [complaints, filter]
  );

  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      <View style={s.header}>
        <Tappable onPress={() => navigation.goBack()} scaleTo={0.9} style={s.backBtn}>
          <Icon name="chevronLeft" size={18} color={colors.text} strokeWidth={2.4} />
        </Tappable>
        <Text style={s.title}>Queue</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {FILTERS.map((f) => (
          <FilterPill
            key={f}
            label={f}
            active={filter === f}
            color={f === 'All' ? colors.text : statusColors[f]}
            onPress={() => setFilter(f)}
          />
        ))}
      </ScrollView>

      <Text style={s.count}>{list.length + ' in view'}</Text>

      <View style={s.list}>
        {list.map((c, i) => {
          const color = statusColors[c.status];
          return (
            <Animated.View key={c.id} layout={LinearTransition.springify()} entering={FadeInDown.duration(320).delay(i * 35)}>
              <Tappable
                onPress={() => navigation.navigate('ComplaintDetail', { id: c.id })}
                scaleTo={0.98}
                style={s.row}
              >
                <View style={[s.rail, { backgroundColor: color }]} />
                <View style={{ flex: 1, gap: 9 }}>
                  <Text style={s.rowTitle}>{c.title}</Text>
                  <Text numberOfLines={1} style={s.rowLocation}>{c.location}</Text>
                  <View style={s.rowMeta}>
                    <View style={[s.dot, { backgroundColor: color }]} />
                    <Text style={[s.rowStatus, { color }]}>{c.status}</Text>
                    <Text style={s.rowDate}>{'·  ' + formatDate(c.date)}</Text>
                  </View>
                </View>
                <Icon name="chevronRight" size={18} color={colors.dim} strokeWidth={2.2} />
              </Tappable>
            </Animated.View>
          );
        })}
        {list.length === 0 ? <Text style={s.empty}>Nothing in this filter.</Text> : null}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.display, fontSize: 24, color: colors.text },
  filterRow: { gap: 10, paddingHorizontal: 20, paddingVertical: 8 },
  count: { paddingHorizontal: 20, paddingTop: 14, fontFamily: font.display, fontSize: 17, color: colors.text },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 22, paddingVertical: 24,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 28,
  },
  rail: { width: 8, alignSelf: 'stretch', minHeight: 76, borderRadius: 4 },
  rowTitle: { fontFamily: font.display, fontSize: 24, lineHeight: 29, color: colors.text },
  rowLocation: { fontFamily: font.body, fontSize: 17, color: colors.muted },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowStatus: { fontFamily: font.bodyBold, fontSize: 16 },
  rowDate: { fontFamily: font.body, fontSize: 16, color: colors.dim },
  empty: { textAlign: 'center', paddingVertical: 44, fontFamily: font.body, fontSize: 16, color: colors.dim },
});
