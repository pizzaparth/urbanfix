import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SkeletonList } from '../../components/Skeleton.jsx';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronRight, Search, CircleX } from 'lucide-react-native';
import StatusBadge from '../../components/StatusBadge.jsx';
import SelectSheet from '../../components/SelectSheet.jsx';
import ActivityHeatmap from '../../components/ActivityHeatmap.jsx';
import { Input, Button, Loading, Alert, EmptyState } from '../../components/ui.jsx';
import { CATEGORIES } from '../../constants/categories.js';
import api from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';
import { color, space, radius, font, text } from '../../theme.js';

const HEATMAP_DAYS = 365;
const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const toOptions = (arr) => arr.map((v) => ({ label: v, value: v }));

// The web version rendered a real <table> with overflow-x. RN has no table, and a
// horizontally-scrolling grid is miserable on a phone, so each complaint is a
// tappable card instead.
const AdminActionScreen = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [heatmap, setHeatmap] = useState({ activity: [], maxCount: 0 });

  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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

  const fetchComplaints = useCallback(async () => {
    try {
      const response = await api.get('/admin/complaints', {
        params: {
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          search: debouncedSearch || undefined,
          page,
          limit: 10,
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
  }, [statusFilter, categoryFilter, debouncedSearch, page]);

  useEffect(() => {
    setLoading(true);
    fetchComplaints();
  }, [fetchComplaints]);

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [fetchComplaints])
  );

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const response = await api.get('/admin/activity-heatmap', {
          params: { days: HEATMAP_DAYS },
        });
        setHeatmap({ activity: response.data.activity || [], maxCount: response.data.maxCount || 0 });
      } catch {
        // The heatmap is supplementary — a failure here shouldn't block the list.
      }
    };
    fetchHeatmap();
  }, []);

  const header = (
    <View style={s.header}>
      <ActivityHeatmap activity={heatmap.activity} maxCount={heatmap.maxCount} />

      <View style={s.searchWrap}>
        <Search size={15} strokeWidth={ICON_STROKE} color={color.textMuted} style={s.searchIcon} />
        <Input
          placeholder="Search title, tracking ID, or citizen"
          value={search}
          onChangeText={setSearch}
          style={s.searchInput}
          autoCorrect={false}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={10} style={s.clearBtn}>
            <CircleX size={15} strokeWidth={ICON_STROKE} color={color.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={s.filterRow}>
        <SelectSheet
          label="Status"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={toOptions(STATUSES)}
          placeholder="All Statuses"
          style={s.flex1}
        />
        <SelectSheet
          label="Category"
          value={categoryFilter}
          onChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
          options={toOptions(CATEGORIES)}
          placeholder="All"
          style={s.flex1}
        />
      </View>

      {error ? <Alert tone="danger">{error}</Alert> : null}
    </View>
  );

  const footer =
    totalPages > 1 ? (
      <View style={s.pager}>
        <Button
          title="Previous"
          variant="secondary"
          size="sm"
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        />
        <Text style={s.pagerLabel}>
          Page {page} of {totalPages}
        </Text>
        <Button
          title="Next"
          variant="secondary"
          size="sm"
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        />
      </View>
    ) : null;

  return (
    <FlashList
      style={s.screen}
      contentContainerStyle={s.content}
      data={loading ? [] : complaints}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      ItemSeparatorComponent={() => <View style={{ height: space[3] }} />}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        loading ? (
          <SkeletonList count={5} />
        ) : (
          <EmptyState title="No complaints found" hint="Try clearing the filters above." />
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchComplaints();
          }}
          tintColor={color.accent}
        />
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigation.navigate('ComplaintDetail', { id: item._id })}
          style={({ pressed }) => [s.row, pressed && { borderColor: color.accentBorder }]}
        >
          <View style={s.rowMain}>
            <View style={s.rowHead}>
              <Text style={s.rowTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <StatusBadge status={item.status} variant="solid" />
            </View>
            <Text style={s.mono}>{item.trackingId}</Text>
            <Text style={s.rowMeta} numberOfLines={1}>
              {item.category} · {item.location}
            </Text>
            <Text style={s.rowCitizen} numberOfLines={1}>
              {item.citizenId?.name || '—'} · {item.citizenId?.email || '—'}
            </Text>
          </View>
          <ChevronRight size={18} strokeWidth={ICON_STROKE} color={color.textMuted} />
        </Pressable>
      )}
    />
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space[4], paddingBottom: space[8] },
  header: { gap: space[3], marginBottom: space[4] },
  flex1: { flex: 1 },

  searchWrap: { justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: space[3], zIndex: 1 },
  searchInput: { paddingLeft: space[7], paddingRight: space[7] },
  clearBtn: { position: 'absolute', right: space[3] },
  filterRow: { flexDirection: 'row', gap: space[3] },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[4],
  },
  rowMain: { flex: 1, gap: space[1] },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', gap: space[2] },
  rowTitle: { flex: 1, fontFamily: font.sansSemibold, fontSize: text.body, color: color.textPrimary },
  mono: { fontFamily: font.mono, fontSize: text.monoSm, color: color.accent },
  rowMeta: { fontFamily: font.sans, fontSize: text.small, color: color.textSecondary },
  rowCitizen: { fontFamily: font.sans, fontSize: 11, color: color.textMuted },

  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space[4],
  },
  pagerLabel: { fontFamily: font.mono, fontSize: text.monoSm, color: color.textMuted },
});

export default AdminActionScreen;
