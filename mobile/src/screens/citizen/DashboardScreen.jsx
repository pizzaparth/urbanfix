import React, { useState, useCallback } from 'react';
import { View, Text, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, PrimaryButton, DangerButton } from '../../components/uikit.jsx';
import ComplaintCard from '../../components/ComplaintCard.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { colors, uf as font } from '../../theme.js';


const DashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logoutUser } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMine = useCallback(async () => {
    try {
      const response = await api.get('/complaints/my-complaints');
      setComplaints(response.data.complaints || []);
    } catch (err) {
      console.error('Error fetching your complaints:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const { refreshing, refresh } = useAutoRefresh(fetchMine);

  return (
    <Screen
      contentStyle={{ paddingTop: insets.top }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
      }
    >
      <View style={s.dashHeader}>
        <View style={s.flex1}>
          <Text style={s.dashName}>{user?.name}</Text>
          <Text style={s.dashEmail}>{user?.email}</Text>
        </View>
        <DangerButton label="Sign out" onPress={logoutUser} />
      </View>

      <View style={s.ctaWrap}>
        <PrimaryButton label="File a new complaint" onPress={() => navigation.navigate('File')} />
      </View>

      <Text style={s.count}>{complaints.length + ' complaints'}</Text>

      <View style={s.list}>
        {loading ? (
          <SkeletonList count={3} />
        ) : (
          complaints.map((c, i) => (
            <View key={c._id}>
              <ComplaintCard item={c} />
            </View>
          ))
        )}
        {!loading && complaints.length === 0 ? (
          <Text style={s.empty}>You haven't filed anything yet.</Text>
        ) : null}
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({
  flex1: { flex: 1 },
  dashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  dashName: { fontFamily: font.display, fontSize: 26, color: colors.text },
  dashEmail: { fontFamily: font.body, fontSize: 14, color: colors.dim, marginTop: 4 },
  ctaWrap: { paddingHorizontal: 20, paddingVertical: 16 },
  count: { paddingHorizontal: 20, fontFamily: font.display, fontSize: 15, color: colors.dim },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  empty: {
    textAlign: 'center',
    paddingVertical: 44,
    fontFamily: font.body,
    fontSize: 16,
    color: colors.dim,
  },
});

export default DashboardScreen;
