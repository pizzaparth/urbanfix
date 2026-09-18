import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, Settings2, CheckCircle2, XCircle, Circle } from 'lucide-react-native';
import { ICON_STROKE } from '../constants/icons.js';
import { color, space, radius, font, text } from '../theme.js';

const STEP_META = {
  Pending: { icon: Clock, color: color.statusPending },
  'In Progress': { icon: Settings2, color: color.statusProgress },
  Resolved: { icon: CheckCircle2, color: color.statusResolved },
  Rejected: { icon: XCircle, color: color.statusRejected },
};

// The web timeline drew its connector with a CSS ::before on .timeline-step-item.
// RN has no pseudo-elements, so the rail is an explicit absolutely-positioned
// View, hidden on the last step.
const StatusTimeline = ({ statusHistory }) => {
  if (!statusHistory || statusHistory.length === 0) return null;

  return (
    <View>
      {statusHistory.map((step, idx) => {
        const meta = STEP_META[step.status] || { icon: Circle, color: color.textMuted };
        const Icon = meta.icon;
        const isLast = idx === statusHistory.length - 1;

        return (
          <View key={idx} style={s.item}>
            <View style={s.rail}>
              <View style={[s.dot, { borderColor: meta.color }]}>
                <Icon size={13} strokeWidth={ICON_STROKE} color={meta.color} />
              </View>
              {!isLast ? <View style={s.line} /> : null}
            </View>

            <View style={[s.card, isLast && { marginBottom: 0 }]}>
              <View style={s.cardHead}>
                <Text style={s.status}>{step.status}</Text>
                <Text style={s.stamp}>{new Date(step.changedAt).toLocaleString()}</Text>
              </View>
              {step.remarks ? <Text style={s.remarks}>{step.remarks}</Text> : null}
              {step.changedBy?.name ? (
                <Text style={s.by}>
                  {step.changedBy.name}
                  {step.changedBy.role ? ` · ${step.changedBy.role}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const s = StyleSheet.create({
  item: { flexDirection: 'row', gap: space[3] },
  rail: { alignItems: 'center', width: 26 },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    backgroundColor: color.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { flex: 1, width: 1, backgroundColor: color.border, marginVertical: space[1] },
  card: {
    flex: 1,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    marginBottom: space[3],
    gap: space[1],
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[2] },
  status: { fontFamily: font.sansSemibold, fontSize: text.small, color: color.textPrimary },
  stamp: { fontFamily: font.mono, fontSize: 11, color: color.textMuted },
  remarks: { fontFamily: font.sans, fontSize: text.small, color: color.textSecondary, lineHeight: 20 },
  by: { fontFamily: font.mono, fontSize: 11, color: color.textMuted },
});

export default StatusTimeline;
