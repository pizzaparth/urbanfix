import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, Settings2, CheckCircle2, XCircle, Circle } from 'lucide-react-native';
import { ICON_STROKE } from '../constants/icons.js';
import { color, space, radius, font, text } from '../theme.js';

const STATUS_META = {
  Pending: { icon: Clock, color: color.statusPending },
  'In Progress': { icon: Settings2, color: color.statusProgress },
  Resolved: { icon: CheckCircle2, color: color.statusResolved },
  Rejected: { icon: XCircle, color: color.statusRejected },
};

// Dark solid fill per status for the `variant="solid"` pill (registry cards,
// admin list) — green/yellow/orange/red, not the accent blue used for
// "In Progress" elsewhere, so every status reads as its own distinct color.
const STATUS_SOLID_BG = {
  Pending: '#713F12',
  'In Progress': '#7C2D12',
  Resolved: '#14532D',
  Rejected: '#7F1D1D',
};

const StatusBadge = ({ status, variant = 'outline' }) => {
  const meta = STATUS_META[status] || { icon: Circle, color: color.textMuted };
  const Icon = meta.icon;
  const solid = variant === 'solid';
  const fg = solid ? color.gray50 : meta.color;

  return (
    <View
      style={[
        s.pill,
        solid
          ? { backgroundColor: STATUS_SOLID_BG[status] || color.gray600, borderColor: 'transparent' }
          : { borderColor: meta.color },
      ]}
    >
      <Icon size={13} strokeWidth={ICON_STROKE} color={fg} />
      <Text style={[s.label, { color: fg }]}>{status}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space[1],
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  label: { fontFamily: font.sansMedium, fontSize: text.monoSm },
});

export default StatusBadge;
