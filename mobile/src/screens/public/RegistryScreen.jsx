import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SkeletonList } from '../../components/Skeleton.jsx';
import { FolderX, RotateCcw, Search, CircleX } from 'lucide-react-native';
import ComplaintCard from '../../components/ComplaintCard.jsx';
import SelectSheet from '../../components/SelectSheet.jsx';
import { Input, Button, Loading } from '../../components/ui.jsx';
import { CATEGORIES } from '../../constants/categories.js';
import { ICON_STROKE } from '../../constants/icons.js';
import api from '../../services/api.js';
import { color, space, radius, font, text } from '../../theme.js';

const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const toOptions = (arr) => arr.map((v) => ({ label: v, value: v }));

const RegistryScreen = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [locationSearch, setLocationSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // The web app refetched on every keystroke. That's tolerable on a LAN-backed
  // desktop but wasteful on a phone, so the location term is debounced.
  const [debouncedLocation, setDebouncedLocation] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(locationSearch), 350);
    return () => clearTimeout(t);
  }, [locationSearch]);

  const fetchComplaints = useCallback(async () => {
    try {
      let queryPath = '/public/complaints?limit=100';
      if (debouncedLocation) queryPath += `&location=${encodeURIComponent(debouncedLocation)}`;
      if (categoryFilter) queryPath += `&category=${encodeURIComponent(categoryFilter)}`;
      if (statusFilter) queryPath += `&status=${encodeURIComponent(statusFilter)}`;
      const res = await api.get(queryPath);
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error('Error fetching registry data:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedLocation, categoryFilter, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchComplaints();
  }, [fetchComplaints]);

  const handleResetAllFilters = () => {
    setLocationSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setSortBy('newest');
  };

  const hasActiveFilters = Boolean(
    locationSearch || categoryFilter || statusFilter || sortBy !== 'newest'
  );

  const sortedComplaints = useMemo(
    () =>
      [...complaints].sort((a, b) =>
        sortBy === 'oldest'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [complaints, sortBy]
  );

  const header = (
    <View style={s.header}>
      <Text style={s.h1}>Public Complaints Registry</Text>
      <Text style={s.lede}>
        Browse all publicly filed municipal issues. Citizen contact details are strictly redacted
        for privacy and transparency compliance.
      </Text>

      <View style={s.filterPanel}>
        <View style={s.searchWrap}>
          <Search size={15} strokeWidth={ICON_STROKE} color={color.textMuted} style={s.searchIcon} />
          <Input
            placeholder="Ward, area, or landmark"
            value={locationSearch}
            onChangeText={setLocationSearch}
            style={s.searchInput}
            autoCorrect={false}
          />
          {locationSearch ? (
            <Pressable onPress={() => setLocationSearch('')} hitSlop={10} style={s.clearBtn}>
              <CircleX size={15} strokeWidth={ICON_STROKE} color={color.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <SelectSheet
          label="Category"
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={toOptions(CATEGORIES)}
          placeholder="All Categories"
        />

        <View style={s.filterRow}>
          <SelectSheet
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={toOptions(STATUSES)}
            placeholder="All Statuses"
            style={s.flex1}
          />
          <SelectSheet
            label="Sort"
            value={sortBy === 'oldest' ? 'Oldest First' : 'Newest First'}
            onChange={(v) => setSortBy(v === 'Oldest First' ? 'oldest' : 'newest')}
            options={toOptions(['Newest First', 'Oldest First'])}
            placeholder="Newest First"
            style={s.flex1}
          />
        </View>

        <View style={s.countRow}>
          <Text style={s.mono}>{sortedComplaints.length} public records</Text>
          {hasActiveFilters ? (
            <Button
              title="Reset"
              variant="ghost"
              size="sm"
              onPress={handleResetAllFilters}
              icon={<RotateCcw size={14} strokeWidth={ICON_STROKE} />}
            />
          ) : null}
        </View>
      </View>
    </View>
  );

  const empty = loading ? (
    <SkeletonList count={5} />
  ) : (
    <View style={s.emptyPanel}>
      <FolderX size={32} strokeWidth={ICON_STROKE} color={color.textMuted} />
      <Text style={s.emptyTitle}>No Complaints Found</Text>
      <Text style={s.emptyHint}>
        No public tickets match your selected area location or filter criteria.
      </Text>
      {hasActiveFilters ? (
        <Button
          title="Reset All Filters"
          variant="secondary"
          size="sm"
          onPress={handleResetAllFilters}
          icon={<RotateCcw size={14} strokeWidth={ICON_STROKE} />}
        />
      ) : null}
    </View>
  );

  return (
    <FlashList
      style={s.screen}
      contentContainerStyle={s.content}
      data={loading ? [] : sortedComplaints}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <ComplaintCard item={item} />}
      ItemSeparatorComponent={() => <View style={{ height: space[3] }} />}
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
          tintColor={color.accent}
        />
      }
    />
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space[4], paddingBottom: space[8] },
  header: { marginBottom: space[4], gap: space[2] },
  h1: { fontFamily: font.sansBold, fontSize: text.h1, color: color.textPrimary },
  lede: { fontFamily: font.sans, fontSize: text.body, color: color.textSecondary, lineHeight: 21 },

  filterPanel: {
    marginTop: space[3],
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[4],
    gap: space[3],
  },
  searchWrap: { justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: space[3], zIndex: 1 },
  searchInput: { paddingLeft: space[7], paddingRight: space[7] },
  clearBtn: { position: 'absolute', right: space[3] },
  filterRow: { flexDirection: 'row', gap: space[3] },
  flex1: { flex: 1 },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: color.border,
    paddingTop: space[3],
  },
  mono: { fontFamily: font.mono, fontSize: text.monoSm, color: color.textMuted },

  emptyPanel: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[8],
    alignItems: 'center',
    gap: space[2],
  },
  emptyTitle: { fontFamily: font.sansSemibold, fontSize: text.h3, color: color.textPrimary },
  emptyHint: {
    fontFamily: font.sans,
    fontSize: text.small,
    color: color.textSecondary,
    textAlign: 'center',
    marginBottom: space[2],
  },
});

export default RegistryScreen;
