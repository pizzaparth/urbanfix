import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Screen, PageTitle, Field, FilterPill } from '../components/ui';
import ComplaintCard from '../components/ComplaintCard';
import { useApp } from '../context/AppContext';
import { colors, font, statusColors } from '../theme';

const FILTERS = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'];

export default function RegistryScreen({ navigation }) {
  const { complaints } = useApp();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return complaints.filter((c) => {
      if (status !== 'All' && c.status !== status) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    });
  }, [complaints, query, status]);

  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      <PageTitle sub="Public tickets, live.">Registry</PageTitle>

      <View style={s.searchWrap}>
        <Field value={query} onChangeText={setQuery} placeholder="Search title or area" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {FILTERS.map((f) => (
          <FilterPill
            key={f}
            label={f}
            active={status === f}
            color={f === 'All' ? colors.text : statusColors[f]}
            onPress={() => setStatus(f)}
          />
        ))}
      </ScrollView>

      <Text style={s.count}>{list.length + ' records'}</Text>

      <View style={s.list}>
        {list.map((c, i) => (
          <Animated.View key={c.id} layout={LinearTransition.springify()} entering={FadeInDown.duration(320).delay(i * 40)}>
            <ComplaintCard
              complaint={c}
              onTrack={() => navigation.navigate('Track', { trackingId: c.trackingId })}
            />
          </Animated.View>
        ))}
        {list.length === 0 ? <Text style={s.empty}>No matching complaints.</Text> : null}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  searchWrap: { paddingHorizontal: 20 },
  filterRow: { gap: 10, paddingHorizontal: 20, paddingVertical: 14 },
  count: { paddingHorizontal: 20, fontFamily: font.display, fontSize: 15, color: colors.dim },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  empty: { textAlign: 'center', paddingVertical: 44, fontFamily: font.body, fontSize: 15, color: colors.dim },
});
