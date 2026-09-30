import React, { useState, useCallback } from 'react';
import { View, Text, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, Card, StatTile, Label } from '../../components/uikit.jsx';
import ProfileHeader from '../../components/ProfileHeader.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import api from '../../services/api.js';
import { colors, uf as font, statusColors } from '../../theme.js';

const SCOPE_TEXT = {
  aggregate_only: 'Aggregate statistics only.',
  anonymised_records: 'Anonymised records — ward-level location, no personal information.',
};

const ResearchProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, logoutUser } = useAuth();
  const [data, setData] = useState(null);

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get('/research/me');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching research profile:', err?.message);
    }
  }, []);

  // /research/me is not logged, so it's safe to poll — unlike the dashboard.
  const { refreshing, refresh } = useAutoRefresh(fetchMe);

  const profile = data?.profile;
  const usage = data?.usage;
  const days = profile?.daysRemaining ?? 0;
  const daysTone = days <= 3 ? statusColors.Rejected : days <= 14 ? statusColors.Pending : statusColors.Resolved;

  return (
    <Screen
      contentStyle={{ paddingTop: insets.top }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
    >
      <ProfileHeader
        user={user}
        meta={[user?.researcher?.title, user?.researcher?.institute].filter(Boolean).join(' · ')}
        onSignOut={logoutUser}
      />

      <View style={s.body}>
        <View>
          <Label>Access</Label>
          <Card>
            <Text style={[s.days, { color: daysTone }]}>{days}</Text>
            <Text style={s.daysLabel}>{days === 1 ? 'day remaining' : 'days remaining'}</Text>
            {profile?.accessExpiresAt ? (
              <Text style={s.meta}>Ends {new Date(profile.accessExpiresAt).toLocaleDateString()}</Text>
            ) : null}
            <Text style={s.scope}>{SCOPE_TEXT[profile?.datasetScope] || ''}</Text>
          </Card>
        </View>

        <View>
          <Label>Your usage</Label>
          <View style={s.grid}>
            <StatTile style={s.cell} label="Views" value={usage?.dashboardViews ?? 0} color={statusColors['In Progress']} />
            <StatTile style={s.cell} label="Queries" value={usage?.queries ?? 0} color={statusColors.Pending} />
            <StatTile style={s.cell} label="Exports" value={usage?.exports ?? 0} color={statusColors.Resolved} />
            <StatTile style={s.cell} label="Rows out" value={usage?.recordsDownloaded ?? 0} color={statusColors.Rejected} />
          </View>
          {usage ? (
            <Text style={s.meta}>
              {`${usage.exportsRemainingToday} of ${usage.exportDailyLimit} exports left today.`}
              {usage.lastExportAt ? ` Last export ${new Date(usage.lastExportAt).toLocaleString()}.` : ''}
            </Text>
          ) : null}
        </View>

        <Text style={s.audit}>All access to the dataset is logged and visible to the administrators.</Text>
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 22 },
  days: { fontFamily: font.display, fontSize: 64, lineHeight: 68 },
  daysLabel: { fontFamily: font.bodyBold, fontSize: 17, color: colors.muted, marginTop: 4 },
  meta: { fontFamily: font.body, fontSize: 14, lineHeight: 21, color: colors.dim, marginTop: 10 },
  scope: { fontFamily: font.body, fontSize: 15, lineHeight: 23, color: colors.muted, marginTop: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '48%', flexGrow: 1 },
  audit: { fontFamily: font.body, fontSize: 14, color: colors.dim, textAlign: 'center' },
});

export default ResearchProfileScreen;
