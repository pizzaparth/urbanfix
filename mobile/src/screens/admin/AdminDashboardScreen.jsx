import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Pressable } from 'react-native';
import { Activity } from 'lucide-react-native';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { color, font } from '../../theme.js';

const AdminDashboardScreen = ({ navigation }) => {
  const { user, logoutUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching admin stats:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const { refreshing, refresh } = useAutoRefresh(fetchStats);

  const breakdown = stats?.statusBreakdown || {};

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.accent} />
      }
    >
      <View style={s.headerGroup}>
        <View style={s.flex1}>
          <Text style={s.h1}>Admin{'\n'}Dashboard</Text>
          <Text style={s.subText}>Viewing as {user?.name}</Text>
        </View>
        <Pressable style={s.signOutBtn} onPress={logoutUser}>
          <Text style={s.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={s.actionWrap}>
        <Pressable style={s.manageBtn} onPress={() => navigation.navigate('AdminAction')}>
          <Text style={s.manageBtnText}>Manage Complaints</Text>
        </Pressable>
      </View>

      <View style={s.statsGrid}>
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Pending</Text>
            <Text style={[s.statValue, { color: '#FFB86B' }]}>{breakdown['Pending'] || 0}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Resolved</Text>
            <Text style={[s.statValue, { color: '#4ADE9B' }]}>{breakdown['Resolved'] || 0}</Text>
          </View>
        </View>
        
        <View style={[s.statBox, s.totalBox]}>
          <View>
            <Text style={s.statLabel}>Total</Text>
            <Text style={[s.statValue, { color: color.white }]}>{breakdown.total || 0}</Text>
          </View>
          <View style={s.totalIcon}>
            <Activity size={20} color="#FF5FA2" strokeWidth={2} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingBottom: 104 },
  
  headerGroup: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  flex1: { flex: 1 },
  h1: {
    fontFamily: font.sansBold,
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -0.5,
    color: color.white,
  },
  subText: {
    fontSize: 13,
    color: '#8E8290',
    marginTop: 6,
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
  
  actionWrap: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  manageBtn: {
    width: '100%',
    height: 58,
    borderRadius: 100,
    backgroundColor: '#C08BFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  manageBtnText: {
    fontFamily: font.sansBold,
    fontSize: 16,
    color: '#18062B',
  },
  
  statsGrid: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 18,
    backgroundColor: '#120E13',
    borderWidth: 1,
    borderColor: '#231B22',
    borderRadius: 22,
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8290',
    fontFamily: font.sansBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontFamily: font.sansBold,
    fontSize: 28,
    marginTop: 4,
  },
  totalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#3B2E3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AdminDashboardScreen;
