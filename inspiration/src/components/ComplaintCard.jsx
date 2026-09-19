import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tappable } from './ui';
import { colors, font, statusColors } from '../theme';
import { formatDate } from '../data/mock';

// Whole card is colour-coded by status: matching border, left rail, kicker and action.
export default function ComplaintCard({ complaint, onTrack }) {
  const color = statusColors[complaint.status];
  return (
    <View style={[s.card, { borderColor: color }]}>
      <View style={[s.rail, { backgroundColor: color }]} />
      <View style={s.body}>
        <Text numberOfLines={1} style={[s.kicker, { color }]}>{complaint.category.toUpperCase()}</Text>
        <Text style={s.title}>{complaint.title}</Text>
        <Text style={s.location}>{complaint.location}</Text>
        <View style={s.footer}>
          <Text numberOfLines={1} style={s.meta}>{complaint.trackingId + '  ·  ' + formatDate(complaint.date)}</Text>
          <Tappable onPress={onTrack} scaleTo={0.94}>
            <Text style={[s.action, { color }]}>Track →</Text>
          </Tappable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: 22,
    overflow: 'hidden',
  },
  rail: { width: 7 },
  body: { flex: 1, padding: 22, gap: 11 },
  kicker: { fontFamily: font.bodyBold, fontSize: 14, letterSpacing: 0.8 },
  title: { fontFamily: font.display, fontSize: 24, lineHeight: 29, color: colors.text },
  location: { fontFamily: font.body, fontSize: 16, color: colors.muted },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border,
  },
  meta: { flex: 1, fontFamily: font.body, fontSize: 14, color: colors.dim },
  action: { fontFamily: font.bodyBold, fontSize: 16 },
});
