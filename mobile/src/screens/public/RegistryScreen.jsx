import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, RefreshControl, StyleSheet, TextInput, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SkeletonList } from '../../components/Skeleton.jsx';
import ComplaintCard from '../../components/ComplaintCard.jsx';
import api from '../../services/api.js';
import { color, space, radius, font, text, statusColor } from '../../theme.js';

const STATUSES = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'];

const RegistryScreen = () => {
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
      <View style={s.header}>
        <Text style={s.h1}>Registry</Text>
        <Text style={s.lede}>Public tickets, live.</Text>
      </View>

      <View style={s.searchWrap}>
        <TextInput
          placeholder="Search title or area"
          placeholderTextColor={color.textMuted}
          value={locationSearch}
          onChangeText={setLocationSearch}
          style={s.searchInput}
          autoCorrect={false}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statusScroll}>
        {STATUSES.map((status) => {
          const isActive = statusFilter === status;
          const sColor = status === 'All' ? color.white : statusColor[status];
          return (
            <Pressable
              key={status}
              onPress={() => setStatusFilter(status)}
              style={[
                s.statusBtn,
                { borderColor: isActive ? sColor : color.border },
              ]}
            >
              <Text style={[s.statusBtnText, { color: isActive ? sColor : color.textMuted }]}>
                {status}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={s.countText}>{sortedComplaints.length} records</Text>
    </View>
  );

  const empty = loading ? (
    <SkeletonList count={5} />
  ) : (
    <View style={s.emptyPanel}>
      <Text style={s.emptyHint}>No matching complaints.</Text>
    </View>
  );

  return (
    <FlashList
      style={s.screen}
      contentContainerStyle={s.content}
      data={loading ? [] : sortedComplaints}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <ComplaintCard item={item} />}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
  content: { paddingBottom: 24 },
  
  headerContainer: {
    paddingBottom: 10,
  },
  header: { 
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  h1: { 
    fontFamily: font.sansBold, 
    fontSize: 38, 
    lineHeight: 40,
    color: color.white 
  },
  lede: { 
    fontFamily: font.sans, 
    fontSize: 17, 
    color: color.textSecondary, 
    marginTop: 8 
  },

  searchWrap: {
    paddingHorizontal: 20,
  },
  searchInput: { 
    width: '100%',
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 14,
    color: color.white,
    fontSize: 14,
    fontFamily: font.sans,
  },

  statusScroll: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  statusBtn: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 100,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statusBtnText: {
    fontFamily: font.sansBold,
    fontSize: 17,
  },

  countText: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    fontSize: 11,
    color: color.textMuted,
    fontFamily: font.sansBold,
  },

  emptyPanel: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyHint: {
    fontFamily: font.sans,
    fontSize: 13,
    color: color.textMuted,
  },
});

export default RegistryScreen;
