// UrbanFix primitives, ported from inspiration/src/components/ui.jsx.
//
// Kept separate from the older components/ui.jsx (Button/Input/Panel/…), which
// the not-yet-restyled screens still import. Screens move over to these as they
// are converted; once nothing imports the old module it can go.
//
// Uses ufRadius, not this project's `radius` — the two scales disagree (lg is
// 28 there, 22 here), and the design wants the reference numbers.
import React from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { colors, uf as font, ufRadius as radius } from '../theme.js';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Press-to-scale wrapper used by every tappable surface in the app.
export function Tappable({ onPress, style, children, scaleTo = 0.97, disabled }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(scaleTo, { damping: 18, stiffness: 320 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 260 }); }}
      style={[style, animStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

// `rest` is forwarded so callers can attach a refreshControl — the reference app
// had no server to refresh from, this one does.
export function Screen({ children, contentStyle, ...rest }) {
  return (
    
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.screenContent, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

export function PageTitle({ children, sub }) {
  return (
    <View style={s.pageTitleWrap}>
      <Text style={s.pageTitle}>{children}</Text>
      {sub ? <Text style={s.pageSub}>{sub}</Text> : null}
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function PrimaryButton({ label, onPress, style, disabled }) {
  return (
    <Tappable onPress={onPress} disabled={disabled} style={[s.primaryBtn, style]}>
      <Text style={s.primaryBtnText}>{label}</Text>
    </Tappable>
  );
}

export function GhostButton({ label, onPress, color = colors.text, style }) {
  return (
    <Tappable onPress={onPress} style={[s.ghostBtn, style]}>
      <Text style={[s.ghostBtnText, { color }]}>{label}</Text>
    </Tappable>
  );
}

export function DangerButton({ label, onPress, style }) {
  return (
    <Tappable onPress={onPress} style={[s.dangerBtn, style]}>
      <Text style={s.dangerBtnText}>{label}</Text>
    </Tappable>
  );
}

export function Field({ label, value, onChangeText, placeholder, secureTextEntry, multiline, keyboardType, autoCapitalize }) {
  return (
    <View>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete="off"
        importantForAutofill="no"
        style={[s.input, multiline && s.inputMultiline]}
      />
    </View>
  );
}

// Outlined pill. Never a tinted fill — transparent ground, colored border + label.
export function FilterPill({ label, active, color, onPress }) {
  return (
    <Tappable
      onPress={onPress}
      scaleTo={0.95}
      style={[s.filterPill, { borderColor: active ? color : colors.borderStrong }]}
    >
      <Text style={[s.filterPillText, { color: active ? color : colors.faint }]}>{label}</Text>
    </Tappable>
  );
}

export function StatusDot({ color, size = 10 }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <View style={s.errorNote}>
      <Text style={s.errorNoteText}>{children}</Text>
    </View>
  );
}

// Animated vertical bar — grows on mount.
export function GrowBar({ height, color, width = 44, delay = 0 }) {
  const h = useSharedValue(0);
  React.useEffect(() => {
    h.value = withTiming(height, { duration: 620 });
  }, [height]);
  const animStyle = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={[{ width: '100%', maxWidth: width, borderRadius: 12, backgroundColor: color }, animStyle]} />;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { paddingBottom: 130 },
  pageTitleWrap: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  pageTitle: { fontFamily: font.display, fontSize: 38, lineHeight: 40, color: colors.text, letterSpacing: -0.5 },
  pageSub: { fontFamily: font.bodyBold, fontSize: 17, color: colors.muted, marginTop: 8 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 22,
  },
  primaryBtn: {
    height: 62,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryBtnText: { fontFamily: font.display, fontSize: 18, color: colors.accentInk },
  ghostBtn: {
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: { fontFamily: font.bodyBold, fontSize: 17 },
  dangerBtn: {
    borderRadius: radius.pill,
    backgroundColor: colors.dangerFill,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  dangerBtnText: { fontFamily: font.bodyBold, fontSize: 15, color: colors.text },
  fieldLabel: { fontFamily: font.bodyBold, fontSize: 17, color: colors.text, marginBottom: 10 },
  input: {
    height: 60,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    color: colors.text,
    fontFamily: font.bodyBold,
    fontSize: 18,
  },
  inputMultiline: { height: 130, paddingTop: 16, textAlignVertical: 'top' },
  filterPill: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: { fontFamily: font.display, fontSize: 17 },
  errorNote: {
    backgroundColor: colors.errorBg,
    borderWidth: 1.5,
    borderColor: '#FF5A7A',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 18,
  },
  errorNoteText: { fontFamily: font.bodyBold, fontSize: 16, color: '#FF5A7A' },
});

export { s as uiStyles };
