import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen, Tappable } from '../components/ui';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { formatDate } from '../data/mock';
import { colors, font, statusColors } from '../theme';

const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

export default function ComplaintDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { complaints, setStatus } = useApp();
  const complaint = complaints.find((c) => c.id === route.params.id);

  if (!complaint) return null;

  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      <View style={s.header}>
        <Tappable onPress={() => navigation.goBack()} scaleTo={0.9} style={s.backBtn}>
          <Icon name="chevronLeft" size={18} color={colors.text} strokeWidth={2.4} />
        </Tappable>
        <Text style={s.headerTitle}>Complaint</Text>
      </View>

      <View style={s.body}>
        <View>
          <Text style={s.title}>{complaint.title}</Text>
          <Text style={s.trackingId}>{complaint.trackingId}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <InfoTile label="Category" value={complaint.category} flex />
          <InfoTile label="Filed" value={formatDate(complaint.date)} width={112} />
        </View>

        <InfoTile label="Location" value={complaint.location} />

        <View>
          <Text style={s.label}>DESCRIPTION</Text>
          <Text style={s.description}>{complaint.description}</Text>
        </View>

        <View>
          <Text style={s.label}>SET STATUS</Text>
          <View style={s.statusGrid}>
            {STATUSES.map((status, i) => {
              const active = complaint.status === status;
              return (
                <Animated.View key={status} entering={FadeInDown.duration(300).delay(i * 40)} style={s.statusCell}>
                  <Tappable
                    onPress={() => setStatus(complaint.id, status)}
                    scaleTo={0.96}
                    style={[
                      s.statusBtn,
                      { borderColor: active ? statusColors[status] : colors.borderStrong, backgroundColor: active ? colors.surfaceInput : 'transparent' },
                    ]}
                  >
                    <View style={[s.dot, { backgroundColor: statusColors[status] }]} />
                    <Text style={s.statusLabel}>{status}</Text>
                  </Tappable>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </View>
    </Screen>
  );
}

function InfoTile({ label, value, flex, width }) {
  return (
    <View style={[s.tile, flex && { flex: 1 }, width && { width }]}>
      <Text style={s.label}>{label.toUpperCase()}</Text>
      <Text style={s.tileValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: font.display, fontSize: 24, color: colors.text },
  body: { paddingHorizontal: 20, paddingTop: 8, gap: 18 },
  title: { fontFamily: font.display, fontSize: 28, lineHeight: 33, color: colors.text },
  trackingId: { fontFamily: font.display, fontSize: 15, color: colors.dim, marginTop: 6 },
  tile: { padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20 },
  tileValue: { fontFamily: font.bodyBold, fontSize: 15, color: colors.text },
  label: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.1, color: colors.dim, marginBottom: 7 },
  description: { fontFamily: font.body, fontSize: 16, lineHeight: 25, color: colors.body },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  statusCell: { width: '48%', flexGrow: 1 },
  statusBtn: { padding: 16, borderRadius: 20, borderWidth: 1.5, gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontFamily: font.display, fontSize: 15, color: colors.text },
});
