import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, RefreshControl, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

import { PageTitle, Field, FilterPill, EmptyLine } from '../../components/uikit.jsx';
import ComplaintCard from '../../components/ComplaintCard.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import { QUEUE_FILTERS, stageLabel } from '../../constants/stages.js';
import api from '../../services/api.js';
import { colors, uf as font } from '../../theme.js';

const QueueScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [stage, setStage] = useState('attention');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Filtering stays server-side, like the admin list.
  const fetchQueue = useCallback(async () => {
    try {
      const res = await api.get('/supervisor/queue', {
        params: { stage, search: debouncedSearch || undefined, limit: 50 },
      });
      setComplaints(res.data.complaints || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching queue:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [stage, debouncedSearch]);

  // Tabs mount up front (lazy: false), so the first fetch is left to
  // useAutoRefresh's focus handler — fetching here as well would fire a request
  // for a tab nobody has opened. This only reacts to a filter/search change.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setLoading(true);
    fetchQueue();
  }, [fetchQueue]);

  const { refreshing, refresh } = useAutoRefresh(fetchQueue);

  const header = (
    <View style={s.headerContainer}>
      <PageTitle sub="Triage, assign, verify.">Queue</PageTitle>

      <View style={s.searchWrap}>
        <Field value={search} onChangeText={setSearch} placeholder="Search title or tracking ID" autoCapitalize="none" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {QUEUE_FILTERS.map((f) => (
          <FilterPill
            key={f.value}
            label={f.label}
            active={stage === f.value}
            color={f.value === 'attention' ? colors.accent : colors.text}
            onPress={() => setStage(f.value)}
          />
        ))}
      </ScrollView>

      <Text style={s.count}>{total} records</Text>
    </View>
  );

  return (
    <FlashList
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: insets.top }]}
      data={loading ? [] : complaints}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={s.cardWrap}>
          <ComplaintCard
            item={item}
            badge={stageLabel(item.stage)}
            onPress={() => navigation.navigate('TriageDetail', { id: item._id })}
          />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListHeaderComponent={header}
      ListEmptyComponent={loading ? <SkeletonList count={5} /> : <EmptyLine>Nothing in this view.</EmptyLine>}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
    />
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 130 },
  headerContainer: { paddingBottom: 12 },
  cardWrap: { paddingHorizontal: 20 },
  searchWrap: { paddingHorizontal: 20 },
  filterRow: { gap: 10, paddingHorizontal: 20, paddingVertical: 14 },
  count: { paddingHorizontal: 20, fontFamily: font.display, fontSize: 15, color: colors.dim },
});

export default QueueScreen;
