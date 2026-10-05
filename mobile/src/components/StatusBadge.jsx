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

// Pale tinted fill per status for the `variant="solid"` pill (registry cards,
// admin list); the label and icon use the status colour itself on top.
const STATUS_SOLID_BG = {
  Pending: '#FDEFD9',
  'In Progress': '#F0E6FC',
  Resolved: '#DFF5EA',
  Rejected: '#FDE3E9',
};

const StatusBadge = ({ status, variant = 'outline' }) => {
  const meta = STATUS_META[status] || { icon: Circle, color: color.textMuted };
  const Icon = meta.icon;
  const solid = variant === 'solid';
  const fg = meta.color;

  return (
    <View
      style={[
        s.pill,
        solid
          ? { backgroundColor: STATUS_SOLID_BG[status] || color.surface, borderColor: 'transparent' }
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
