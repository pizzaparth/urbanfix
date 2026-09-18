import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Calendar, ArrowRight, FileDown } from 'lucide-react-native';
import StatusBadge from './StatusBadge.jsx';
import { Button } from './ui.jsx';
import { downloadReceipt } from '../utils/downloadReceipt.js';
import { ICON_STROKE } from '../constants/icons.js';
import { color, space, radius, font, text } from '../theme.js';

// The web card linked to /track?id=<id>; here that becomes a navigate() with
// params, which the Track screen reads off route.params (and which the dsn://
// deep link also feeds).
const ComplaintCard = ({ item }) => {
  const navigation = useNavigation();

  return (
    <View style={s.card}>
      <View style={s.headRow}>
        <View style={s.headMeta}>
          <View style={s.tag}>
            <Text style={s.tagText} numberOfLines={1}>
              {item.category}
            </Text>
          </View>
          <View style={s.inlineRow}>
            <MapPin size={13} strokeWidth={ICON_STROKE} color={color.statusRejected} />
            <Text style={s.locationText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        </View>
        <StatusBadge status={item.status} variant="solid" />
      </View>

      <Text style={s.title}>{item.title}</Text>

      <View style={s.metaRow}>
        <Text style={s.metaLabel}>
          ID: <Text style={s.metaAccent}>{item.trackingId}</Text>
        </Text>
        <View style={s.inlineRow}>
          <Calendar size={12} strokeWidth={ICON_STROKE} color={color.textMuted} />
          <Text style={s.metaLabel}>Filed {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      <Text style={s.description} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={s.footer}>
        <Button
          title="Track Progress"
          variant="secondary"
          size="sm"
          onPress={() => navigation.navigate('Track', { id: item.trackingId })}
          icon={<ArrowRight size={14} strokeWidth={ICON_STROKE} />}
        />
        {item.status === 'Resolved' && (
          <Button
            title="PDF Receipt"
            variant="ghost"
            size="sm"
            onPress={() => downloadReceipt(item.trackingId)}
            icon={<FileDown size={14} strokeWidth={ICON_STROKE} />}
          />
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[4],
    gap: space[2],
  },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space[2] },
  headMeta: { flex: 1, gap: space[2] },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: space[1] },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: color.surfaceRaised,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.sm,
    paddingHorizontal: space[2],
    paddingVertical: 2,
  },
  tagText: { fontFamily: font.mono, fontSize: text.monoSm, color: color.textSecondary },
  locationText: { flex: 1, fontFamily: font.sans, fontSize: text.small, color: color.textSecondary },
  title: { fontFamily: font.sansSemibold, fontSize: 17, color: color.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space[4] },
  metaLabel: { fontFamily: font.mono, fontSize: text.monoSm, color: color.textMuted },
  metaAccent: { color: color.accent },
  description: { fontFamily: font.sans, fontSize: text.small, color: color.textSecondary, lineHeight: 20 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space[2],
    borderTopWidth: 1,
    borderTopColor: color.border,
    paddingTop: space[3],
    marginTop: space[1],
  },
});

export default ComplaintCard;
