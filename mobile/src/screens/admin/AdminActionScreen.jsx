import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { Screen, FilterPill, Field, Tappable } from '../../components/uikit.jsx';
import Icon from '../../components/Icon.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';
import api from '../../services/api.js';
import { colors, uf as font, statusColors } from '../../theme.js';


const FILTERS = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'];
const PAGE_SIZE = 10;

const AdminActionScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Filtering and paging stay server-side — the reference filtered a 12-item
  // mock array in memory, which doesn't survive a real queue.
  const fetchComplaints = useCallback(async () => {
    try {
      const response = await api.get('/admin/complaints', {
        params: {
          status: filter === 'All' ? undefined : filter,
          search: debouncedSearch || undefined,
          page,
          limit: PAGE_SIZE,
        },
      });
      setComplaints(response.data.complaints || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setError('');
    } catch {
      setError('Failed to fetch administrative complaint records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, debouncedSearch, page]);

  useEffect(() => {
    setLoading(true);
    fetchComplaints();
  }, [fetchComplaints]);

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [fetchComplaints])
  );

  return (
    <Screen
      contentStyle={{ paddingTop: insets.top }}
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
    >
      <View style={s.header}>
        <Tappable onPress={() => navigation.goBack()} scaleTo={0.9} style={s.backBtn}>
          <Icon name="chevronLeft" size={18} color={colors.text} strokeWidth={2.4} />
        </Tappable>
        <Text style={s.title}>Queue</Text>
      </View>

      <View style={s.searchWrap}>
        <Field
          value={search}
          onChangeText={setSearch}
          placeholder="Search title, area or ID"
          autoCapitalize="none"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {FILTERS.map((f) => (
          <FilterPill
            key={f}
            label={f}
            active={filter === f}
            color={f === 'All' ? colors.text : statusColors[f]}
            onPress={() => {
              setFilter(f);
              setPage(1);
            }}
          />
        ))}
      </ScrollView>

      <Text style={s.count}>{complaints.length + ' in view'}</Text>

      <View style={s.list}>
        {loading ? <SkeletonList count={4} /> : null}

        {!loading &&
          complaints.map((c, i) => {
            const tone = statusColors[c.status] || colors.accent;
            return (
              <View
                key={c._id}
              >
                <Tappable
                  onPress={() => navigation.navigate('ComplaintDetail', { id: c._id })}
                  scaleTo={0.98}
                  style={s.row}
                >
                  <View style={[s.rail, { backgroundColor: tone }]} />
                  <View style={s.rowBody}>
                    <Text style={s.rowTitle}>{c.title}</Text>
                    <Text numberOfLines={1} style={s.rowLocation}>
                      {c.location}
                    </Text>
                    <View style={s.rowMeta}>
                      <View style={[s.dot, { backgroundColor: tone }]} />
                      <Text style={[s.rowStatus, { color: tone }]}>{c.status}</Text>
                      <Text style={s.rowDate}>
                        {'·  ' + new Date(c.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Icon name="chevronRight" size={18} color={colors.dim} strokeWidth={2.2} />
                </Tappable>
              </View>
            );
          })}

        {!loading && error ? <Text style={s.empty}>{error}</Text> : null}
        {!loading && !error && complaints.length === 0 ? (
          <Text style={s.empty}>Nothing in this filter.</Text>
        ) : null}
      </View>

      {/* The reference queue was one unpaged list; a real one needs paging. */}
      {!loading && totalPages > 1 ? (
        <View style={s.pager}>
          <Tappable
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            scaleTo={0.94}
            style={[s.pagerBtn, page <= 1 && s.pagerBtnOff]}
          >
            <Icon name="chevronLeft" size={16} color={colors.text} strokeWidth={2.4} />
          </Tappable>
          <Text style={s.pagerLabel}>{`Page ${page} of ${totalPages}`}</Text>
          <Tappable
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            scaleTo={0.94}
            style={[s.pagerBtn, page >= totalPages && s.pagerBtnOff]}
          >
            <Icon name="chevronRight" size={16} color={colors.text} strokeWidth={2.4} />
          </Tappable>
        </View>
      ) : null}
    </Screen>
  );
};

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: font.display, fontSize: 24, color: colors.text },
  searchWrap: { paddingHorizontal: 20 },
  filterRow: { gap: 10, paddingHorizontal: 20, paddingVertical: 8 },
  count: { paddingHorizontal: 20, paddingTop: 14, fontFamily: font.display, fontSize: 17, color: colors.text },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 22,
    paddingVertical: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
  },
  rail: { width: 8, alignSelf: 'stretch', minHeight: 76, borderRadius: 4 },
  rowBody: { flex: 1, gap: 9 },
  rowTitle: { fontFamily: font.display, fontSize: 24, lineHeight: 29, color: colors.text },
  rowLocation: { fontFamily: font.body, fontSize: 17, color: colors.muted },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowStatus: { fontFamily: font.bodyBold, fontSize: 16 },
  rowDate: { fontFamily: font.body, fontSize: 16, color: colors.dim },
  empty: {
    textAlign: 'center',
    paddingVertical: 44,
    fontFamily: font.body,
    fontSize: 16,
    color: colors.dim,
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingTop: 22,
  },
  pagerBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagerBtnOff: { opacity: 0.35 },
  pagerLabel: { fontFamily: font.bodyBold, fontSize: 16, color: colors.muted },
});

export default AdminActionScreen;
