import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { downloadReceipt } from '../utils/downloadReceipt.js';
import { Tappable } from './uikit.jsx';
import { color, space, radius, font, statusColors as STATUS_COLOR } from '../theme.js';

// Public cards link out to the tracker. Staff screens pass `onPress` to open
// their own detail instead, and `badge` (e.g. the workflow stage) in place of the
// Track/Receipt links.
const ComplaintCard = ({ item, onPress, badge }) => {
  const navigation = useNavigation();
  const sColor = STATUS_COLOR[item.status] || color.accent;
  const Wrap = onPress ? Tappable : React.Fragment;
  const wrapProps = onPress ? { onPress, scaleTo: 0.98 } : {};

  return (
    <Wrap {...wrapProps}>
    <View style={[s.card, { borderColor: sColor }]}>
      <View style={[s.colorStrip, { backgroundColor: sColor }]} />
      <View style={s.content}>
        <Text style={[s.category, { color: sColor }]} numberOfLines={1}>
          {item.category}
        </Text>
        <Text style={s.title}>{item.title}</Text>
        <Text style={s.location}>{item.location}</Text>
        
        <View style={s.footer}>
          <Text style={s.meta} numberOfLines={1}>
            {item.trackingId} · {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          
          {badge ? (
            <Text style={[s.trackText, { color: sColor }]}>{badge}</Text>
          ) : (
          <View style={s.actions}>
            {item.status === 'Resolved' && (
              <Pressable onPress={() => downloadReceipt(item.trackingId)}>
                <Text style={s.receiptText}>Receipt</Text>
              </Pressable>
            )}
            <Pressable onPress={() => navigation.navigate('Track', { id: item.trackingId })}>
              <Text style={[s.trackText, { color: sColor }]}>Track →</Text>
            </Pressable>
          </View>
          )}
        </View>
      </View>
    </View>
    </Wrap>
  );
};

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: color.surface,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  colorStrip: {
    width: 7,
  },
  content: {
    flex: 1,
    padding: 22,
    gap: 11,
  },
  category: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8, // roughly 0.06em
    fontFamily: font.sansBold,
  },
  title: {
    fontFamily: font.sansBold,
    fontSize: 24,
    lineHeight: 28,
    color: color.textPrimary,
  },
  location: {
    fontSize: 16,
    color: color.textSecondary,
    fontFamily: font.sans,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: color.borderStrong,
  },
  meta: {
    flex: 1,
    fontSize: 14,
    color: color.textMuted,
    fontFamily: font.sans,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  receiptText: {
    fontSize: 14,
    fontFamily: font.sansBold,
    color: color.textSecondary,
  },
  trackText: {
    fontSize: 16,
    fontFamily: font.sansBold,
  },
});

export default ComplaintCard;
