import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, RefreshControl, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { SkeletonList } from '../../components/Skeleton.jsx';
import { PageTitle, Field, FilterPill } from '../../components/uikit.jsx';
import ComplaintCard from '../../components/ComplaintCard.jsx';
import api from '../../services/api.js';
import { colors, uf as font, statusColors } from '../../theme.js';

const STATUSES = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'];

const RegistryScreen = () => {
  const insets = useSafeAreaInsets();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [locationSearch, setLocationSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [debouncedLocation, setDebouncedLocation] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(locationSearch), 350);
    return () => clearTimeout(t);
  }, [locationSearch]);

  const fetchComplaints = useCallback(async () => {
    try {
      let queryPath = '/public/complaints?limit=100';
      if (debouncedLocation) queryPath += `&location=${encodeURIComponent(debouncedLocation)}`;
      if (statusFilter !== 'All') queryPath += `&status=${encodeURIComponent(statusFilter)}`;
      const res = await api.get(queryPath);
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error('Error fetching registry data:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedLocation, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchComplaints();
  }, [fetchComplaints]);

  const sortedComplaints = useMemo(
    () => [...complaints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [complaints]
  );

  const header = (
    <View style={s.headerContainer}>
      <PageTitle sub="Public tickets, live.">Registry</PageTitle>

      <View style={s.searchWrap}>
        <Field
          value={locationSearch}
          onChangeText={setLocationSearch}
          placeholder="Search title or area"
          autoCapitalize="none"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {STATUSES.map((status) => (
          <FilterPill
            key={status}
            label={status}
            active={statusFilter === status}
            color={status === 'All' ? colors.text : statusColors[status]}
            onPress={() => setStatusFilter(status)}
          />
        ))}
      </ScrollView>

      <Text style={s.count}>{sortedComplaints.length} records</Text>
    </View>
  );

  const empty = loading ? (
    <SkeletonList count={5} />
  ) : (
    <Text style={s.empty}>No matching complaints.</Text>
  );

  return (
    <FlashList
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: insets.top }]}
      data={loading ? [] : sortedComplaints}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={s.cardWrap}>
          <ComplaintCard item={item} />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchComplaints();
          }}
          tintColor={colors.accent}
        />
      }
    />
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 130 },

  headerContainer: { paddingBottom: 12 },
  // The header's children carry their own 20pt gutter (PageTitle/Field/pills),
  // so the rows are padded here rather than on the list's content container.
  cardWrap: { paddingHorizontal: 20 },
  searchWrap: { paddingHorizontal: 20 },
  filterRow: { gap: 10, paddingHorizontal: 20, paddingVertical: 14 },
  count: { paddingHorizontal: 20, fontFamily: font.display, fontSize: 15, color: colors.dim },

  empty: {
    textAlign: 'center',
    paddingVertical: 44,
    fontFamily: font.body,
    fontSize: 15,
    color: colors.dim,
  },
});

export default RegistryScreen;
