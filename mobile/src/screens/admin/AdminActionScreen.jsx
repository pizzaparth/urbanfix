import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, RefreshControl, StyleSheet, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronRight, Search, CircleX } from 'lucide-react-native';
import StatusBadge from '../../components/StatusBadge.jsx';
import SelectSheet from '../../components/SelectSheet.jsx';
import { CATEGORIES } from '../../constants/categories.js';
import api from '../../services/api.js';
import { color, font } from '../../theme.js';

const STATUS_COLORS = {
  'Filed': '#4ADE9B',
  'Pending': '#FFB86B',
  'In Progress': '#C08BFF',
  'Resolved': '#FF5FA2',
  'Rejected': '#A094A0'
};

const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const toOptions = (arr) => arr.map((v) => ({ label: v, value: v }));

const AdminActionScreen = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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

  const header = (
    <View style={s.headerGroup}>
      <View style={s.headerRow}>
        <Pressable style={s.topBackBtn} onPress={() => navigation.goBack()}>
          <Text style={{color: '#FFF', fontSize: 18, fontFamily: font.sansBold}}>{'<'}</Text>
        </Pressable>
        <Text style={s.h1}>Action Desk</Text>
      </View>

      <View style={s.controlsWrap}>
        <View style={s.searchWrap}>
          <Search size={20} color="#8E8290" style={s.searchIcon} strokeWidth={2} />
          <TextInput
            placeholder="Search ID or name"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
            style={s.searchInput}
            autoCorrect={false}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10} style={s.clearBtn}>
              <CircleX size={20} color="#8E8290" strokeWidth={2} />
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
            placeholder="All statuses"
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
            placeholder="All categories"
            style={s.flex1}
          />
        </View>
      </View>

      {error ? (
        <View style={s.errorAlert}>
          <Text style={s.errorAlertText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );

  const footer =
    totalPages > 1 ? (
      <View style={s.pager}>
        <Pressable 
          style={[s.pagerBtn, page <= 1 && s.pagerBtnDisabled]} 
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          <Text style={[s.pagerBtnText, page <= 1 && s.pagerBtnTextDisabled]}>Prev</Text>
        </Pressable>
        <Text style={s.pagerLabel}>
          {page} / {totalPages}
        </Text>
        <Pressable 
          style={[s.pagerBtn, page >= totalPages && s.pagerBtnDisabled]}
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          <Text style={[s.pagerBtnText, page >= totalPages && s.pagerBtnTextDisabled]}>Next</Text>
        </Pressable>
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
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
      renderItem={({ item }) => {
        const statusColor = STATUS_COLORS[item.status] || '#FFFFFF';
        return (
          <Pressable
            onPress={() => navigation.navigate('ComplaintDetail', { id: item._id })}
            style={({ pressed }) => [s.row, pressed && { transform: [{scale: 0.98}] }]}
          >
            <View style={s.rowMain}>
              <View style={s.rowHead}>
                <Text style={s.rowTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={s.badgeWrap}>
                  <View style={[s.badgeDot, { backgroundColor: statusColor }]} />
                  <Text style={[s.badgeLabel, { color: statusColor }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={s.rowMeta} numberOfLines={1}>
                {item.trackingId} · {item.category}
              </Text>
              <Text style={s.rowCitizen} numberOfLines={1}>
                {item.citizenId?.name || '—'} · {item.citizenId?.email || '—'}
              </Text>
            </View>
            <ChevronRight size={20} strokeWidth={2.4} color="rgba(255,255,255,0.4)" style={{flex: 'none'}} />
          </Pressable>
        );
      }}
    />
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingBottom: 104 },
  
  headerGroup: { },
  headerRow: { 
    paddingHorizontal: 20, 
    paddingTop: 22, 
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  topBackBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#2C222B',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
  },
  h1: {
    fontFamily: font.sansBold,
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -0.5,
    color: color.white,
  },
  
  controlsWrap: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 12,
  },
  searchWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 18,
    zIndex: 1,
  },
  searchInput: {
    width: '100%',
    height: 62,
    paddingLeft: 48,
    paddingRight: 48,
    backgroundColor: '#120E13',
    borderWidth: 1.5,
    borderColor: '#2C222B',
    borderRadius: 18,
    color: color.white,
    fontSize: 16,
    fontFamily: font.sansBold,
  },
  clearBtn: {
    position: 'absolute',
    right: 18,
  },
  
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: { flex: 1 },
  
  errorAlert: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    backgroundColor: 'rgba(255, 90, 122, 0.1)',
    borderWidth: 1,
    borderColor: '#FF5A7A',
    borderRadius: 12,
  },
  errorAlertText: {
    color: '#FF5A7A',
    fontFamily: font.sansBold,
    fontSize: 13,
  },

  row: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#120E13',
    borderWidth: 1,
    borderColor: '#231B22',
    borderRadius: 22,
    padding: 18,
  },
  rowMain: { flex: 1, gap: 4 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  rowTitle: { flex: 1, fontFamily: font.sansBold, fontSize: 14, color: color.white },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 'none',
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  badgeLabel: {
    fontSize: 11,
    fontFamily: font.sansBold,
  },
  rowMeta: { fontFamily: font.monoMedium, fontSize: 11, color: '#8E8290', marginTop: 2 },
  rowCitizen: { fontFamily: font.sansBold, fontSize: 11, color: color.textMuted },

  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
    paddingBottom: 20,
  },
  pagerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#3B2E3A',
  },
  pagerBtnDisabled: {
    backgroundColor: '#120E13',
    borderWidth: 1,
    borderColor: '#231B22',
  },
  pagerBtnText: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: color.white,
  },
  pagerBtnTextDisabled: {
    color: '#8E8290',
  },
  pagerLabel: { fontFamily: font.monoMedium, fontSize: 14, color: '#8E8290' },
});

export default AdminActionScreen;
