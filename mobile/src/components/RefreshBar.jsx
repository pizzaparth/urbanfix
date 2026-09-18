import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { ICON_STROKE } from '../constants/icons.js';
import { color, space, radius, font, text } from '../theme.js';

// A visible "last updated / refresh" control for the data screens.
//
// Pull-to-refresh can't be the only affordance: react-native-web renders
// RefreshControl as an empty View and discards onRefresh, so in the browser
// there would otherwise be no way to refresh at all. A tappable control works
// identically on both targets, and it doubles as the answer to "is this number
// stale?" — which a pull gesture never tells you.

const relativeLabel = (timestamp) => {
  if (!timestamp) return 'Never updated';
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 5) return 'Updated just now';
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  return `Updated ${Math.round(minutes / 60)}h ago`;
};

const RefreshBar = ({ lastUpdatedAt, refreshing, onRefresh, style }) => {
  const [, setTick] = useState(0);

  // The label is relative, so it has to re-render on a clock of its own —
  // nothing else changes between polls.
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={[s.row, style]}>
      <Text style={s.stamp}>{relativeLabel(lastUpdatedAt)}</Text>
      <Pressable
        onPress={onRefresh}
        disabled={refreshing}
        accessibilityRole="button"
        accessibilityLabel="Refresh data"
        hitSlop={8}
        style={({ pressed }) => [s.button, pressed && s.buttonPressed, refreshing && s.buttonBusy]}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color={color.accent} />
        ) : (
          <RefreshCw size={14} color={color.textSecondary} strokeWidth={ICON_STROKE} />
        )}
        <Text style={s.label}>{refreshing ? 'Refreshing' : 'Refresh'}</Text>
      </Pressable>
    </View>
  );
};

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  stamp: {
    fontFamily: font.mono,
    fontSize: text.monoSm,
    color: color.textMuted,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  buttonPressed: {
    borderColor: color.borderStrong,
    backgroundColor: color.surfaceRaised,
  },
  buttonBusy: {
    opacity: 0.7,
  },
  label: {
    fontFamily: font.sansMedium,
    fontSize: text.small,
    color: color.textSecondary,
  },
});

export default RefreshBar;
