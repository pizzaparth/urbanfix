import React, { useState, useCallback } from 'react';
import { View, Text, RefreshControl, StyleSheet, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import { downloadReceipt } from '../../utils/downloadReceipt.js';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { color, font } from '../../theme.js';

const STATUS_COLORS = {
  'Filed': '#4ADE9B',
  'In Progress': '#FFB86B',
  'Resolved': '#FF5A7A',
  'Rejected': '#A094A0'
};

const DashboardScreen = ({ navigation }) => {
  const { user, logoutUser } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchMyComplaints = useCallback(async () => {
    try {
      const response = await api.get('/complaints/my-complaints');
      setComplaints(response.data.complaints || []);
      setError('');
    } catch {
      setError('Failed to fetch your complaint records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMyComplaints();
    }, [fetchMyComplaints])
  );

  const header = (
    <View style={s.headerGroup}>
      <View style={s.userRow}>
        <View style={s.flex1}>
          <Text style={s.userName}>{user?.name}</Text>
          <Text style={s.userEmail}>{user?.email}</Text>
        </View>
        <Pressable style={s.signOutBtn} onPress={logoutUser}>
          <Text style={s.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={s.fileNewWrap}>
        <Pressable style={s.fileNewBtn} onPress={() => navigation.navigate('File')}>
          <Text style={s.fileNewText}>File a new complaint</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={s.errorAlert}>
          <Text style={s.errorAlertText}>{error}</Text>
        </View>
      ) : null}

      <View style={s.countWrap}>
        <Text style={s.countLabel}>{complaints.length} complaints</Text>
      </View>
    </View>
  );

  return (
    <View style={s.screen}>
      <FlashList
        data={loading ? [] : complaints}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={header}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchMyComplaints();
            }}
            tintColor={color.accent}
          />
        }
        renderItem={({ item }) => {
          const statusColor = STATUS_COLORS[item.status] || '#FFFFFF';
          return (
            <View style={s.card}>
              <View style={s.cardHead}>
                <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={s.badgeWrap}>
                  <View style={[s.badgeDot, { backgroundColor: statusColor }]} />
                  <Text style={[s.badgeLabel, { color: statusColor }]}>{item.status}</Text>
                </View>
              </View>
              
              <Text style={s.cardMeta}>
                {item.trackingId} · {item.category} · {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              
              <View style={s.cardActions}>
                <Pressable onPress={() => navigation.navigate('Track', { id: item.trackingId })}>
                  <Text style={s.trackBtnText}>Track</Text>
                </Pressable>
                
                {item.status === 'Resolved' && (
                  <Pressable onPress={() => downloadReceipt(item.trackingId)}>
                    <Text style={s.receiptBtnText}>Receipt</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  listContent: { paddingBottom: 104 },
  
  headerGroup: { },
  userRow: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex1: { flex: 1 },
  userName: {
    fontFamily: font.sansBold,
    fontSize: 19,
    color: color.white,
  },
  userEmail: {
    fontSize: 12,
    color: '#8E8290',
    marginTop: 2,
    fontFamily: font.sans,
  },
  signOutBtn: {
    backgroundColor: '#7E1038',
    borderWidth: 1,
    borderColor: '#B02159',
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  signOutText: {
    color: color.white,
    fontSize: 12,
    fontFamily: font.sansBold,
  },
  
  fileNewWrap: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
  },
  fileNewBtn: {
    width: '100%',
    height: 48,
    borderRadius: 100,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileNewText: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: '#0A0A0A',
  },
  
  countWrap: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  countLabel: {
    fontSize: 11,
    color: '#8E8290',
    fontFamily: font.monoMedium,
  },
  
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

  card: {
    marginHorizontal: 20,
    padding: 18,
    backgroundColor: '#120E13',
    borderWidth: 1,
    borderColor: '#231B22',
    borderRadius: 22,
    gap: 9,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontFamily: font.sansBold,
    fontSize: 14,
    color: color.white,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  cardMeta: {
    fontSize: 11,
    color: '#8E8290',
    fontFamily: font.monoMedium,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#231B22',
  },
  trackBtnText: {
    color: color.accent,
    fontSize: 12,
    fontFamily: font.sansBold,
  },
  receiptBtnText: {
    color: '#B5A8B2',
    fontSize: 12,
    fontFamily: font.sansBold,
  },
});

export default DashboardScreen;
