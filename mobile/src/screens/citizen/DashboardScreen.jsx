import React, { useState, useCallback } from 'react';
import { View, Text, RefreshControl, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SkeletonList } from '../../components/Skeleton.jsx';
import { useFocusEffect } from '@react-navigation/native';
import { CirclePlus, FileDown, LogOut } from 'lucide-react-native';
import StatusBadge from '../../components/StatusBadge.jsx';
import { Button, Loading, Alert, EmptyState } from '../../components/ui.jsx';
import { downloadReceipt } from '../../utils/downloadReceipt.js';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';
import { color, space, radius, font, text } from '../../theme.js';

// The web dashboard had an inline "new complaint" modal that POSTed to
// /complaints with only title/description/category. That endpoint requires a
// valid OTP plus name/email/location and rejects anything else with a 400, so
// that form could never have succeeded. Rather than port a broken path, the
// button here routes to the real OTP-backed filing wizard.
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
    <View style={s.header}>
      <View style={s.userRow}>
        <View style={s.flex1}>
          <Text style={s.hello}>{user?.name}</Text>
          <Text style={s.email}>{user?.email}</Text>
        </View>
        <Button
          title="Sign out"
          variant="ghost"
          size="sm"
          onPress={logoutUser}
          icon={<LogOut size={14} strokeWidth={ICON_STROKE} />}
        />
      </View>

      <Button
        title="File a New Complaint"
        onPress={() => navigation.navigate('File')}
        icon={<CirclePlus size={16} strokeWidth={ICON_STROKE} />}
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Text style={s.countLabel}>
        {complaints.length} complaint{complaints.length === 1 ? '' : 's'} filed
      </Text>
    </View>
  );

  return (
    <FlashList
      style={s.screen}
      contentContainerStyle={s.content}
      data={loading ? [] : complaints}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={header}
      ItemSeparatorComponent={() => <View style={{ height: space[3] }} />}
      ListEmptyComponent={
        loading ? (
          <SkeletonList count={4} />
        ) : (
          <EmptyState
            title="No complaints yet"
            hint="Anything you file will appear here with its live status."
          />
        )
      }
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
      renderItem={({ item }) => (
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <StatusBadge status={item.status} variant="solid" />
          </View>
          <Text style={s.mono}>{item.trackingId}</Text>
          <Text style={s.cardMeta}>
            {item.category} · {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <View style={s.cardActions}>
            <Button
              title="Track"
              variant="secondary"
              size="sm"
              onPress={() => navigation.navigate('Track', { id: item.trackingId })}
            />
            {item.status === 'Resolved' ? (
              <Button
                title="Receipt"
                variant="ghost"
                size="sm"
                onPress={() => downloadReceipt(item.trackingId)}
                icon={<FileDown size={14} strokeWidth={ICON_STROKE} />}
              />
            ) : null}
          </View>
        </View>
      )}
    />
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space[4], paddingBottom: space[8] },
  header: { gap: space[3], marginBottom: space[4] },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  flex1: { flex: 1 },
  hello: { fontFamily: font.sansSemibold, fontSize: text.h3, color: color.textPrimary },
  email: { fontFamily: font.sans, fontSize: text.small, color: color.textMuted },
  countLabel: { fontFamily: font.mono, fontSize: text.monoSm, color: color.textMuted },

  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[4],
    gap: space[2],
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', gap: space[2] },
  cardTitle: { flex: 1, fontFamily: font.sansSemibold, fontSize: text.body, color: color.textPrimary },
  mono: { fontFamily: font.mono, fontSize: text.monoSm, color: color.accent },
  cardMeta: { fontFamily: font.sans, fontSize: text.small, color: color.textSecondary },
  cardActions: {
    flexDirection: 'row',
    gap: space[2],
    borderTopWidth: 1,
    borderTopColor: color.border,
    paddingTop: space[3],
  },
});

export default DashboardScreen;
