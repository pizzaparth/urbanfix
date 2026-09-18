import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Haptics are a no-op on web (no browser equivalent worth faking — the Vibration
// API is coarse and ignored on desktop), and any failure here is cosmetic, so
// every call swallows its error rather than risking a crash inside a press
// handler.
const safely = (fn) => {
  if (Platform.OS === 'web') return;
  try {
    fn();
  } catch {
    /* device without a taptic engine, or permission denied */
  }
};

// A light tick for ordinary taps: buttons, tab-like selections, pull-to-refresh.
export const tapFeedback = () =>
  safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

// Reserved for the moments that actually resolve something — a complaint filed,
// a status changed. Used sparingly so it keeps meaning.
export const successFeedback = () =>
  safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

export const errorFeedback = () =>
  safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
