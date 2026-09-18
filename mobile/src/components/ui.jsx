import React from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { color, space, radius, font, text } from '../theme.js';
import { tapFeedback } from '../utils/haptics.js';

// Shared primitives: button, input, field and panel. Four button variants, no
// pill radius.
//
// There's no hover on touch, so each variant expresses its active state as a
// pressed state via Pressable's ({ pressed }) style callback — plus a haptic
// tick, so a press is confirmed by feel as well as by sight. Routing it through
// Button means every button in the app gets it without each call site
// remembering; `haptic={false}` opts out where a tap isn't a commitment.

const btnVariant = {
  primary: { bg: color.accent, fg: color.gray950, border: 'transparent', pressedBg: color.accentHover },
  secondary: { bg: 'transparent', fg: color.textPrimary, border: color.borderStrong, pressedBg: color.surfaceRaised },
  ghost: { bg: 'transparent', fg: color.textSecondary, border: 'transparent', pressedBg: color.surface },
  danger: { bg: 'transparent', fg: color.statusRejected, border: color.statusRejected, pressedBg: 'rgba(239, 90, 90, 0.1)' },
  cta: { bg: color.navCtaBg, fg: color.white, border: 'transparent', pressedBg: color.navCtaBgHover },
};

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  style,
  haptic = true,
}) => {
  const v = btnVariant[variant] || btnVariant.primary;
  const isOff = disabled || loading;

  const handlePress = (event) => {
    if (haptic) tapFeedback();
    onPress?.(event);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isOff}
      style={({ pressed }) => [
        s.btn,
        size === 'sm' && s.btnSm,
        {
          backgroundColor: pressed && !isOff ? v.pressedBg : v.bg,
          borderColor: v.border,
          opacity: isOff ? 0.4 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <>
          {icon ? React.cloneElement(icon, { color: v.fg }) : null}
          <Text
            style={[s.btnLabel, size === 'sm' && s.btnLabelSm, { color: v.fg }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

// RN has no :focus pseudo-class, so the focus ring is driven by onFocus/onBlur state.
export const Field = ({ label, error, children, style }) => (
  <View style={[s.field, style]}>
    {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
    {children}
    {error ? <Text style={s.fieldError}>{error}</Text> : null}
  </View>
);

export const Input = ({ multiline, style, ...props }) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <TextInput
      placeholderTextColor={color.textMuted}
      {...props}
      multiline={multiline}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={[
        s.input,
        multiline && s.inputMultiline,
        focused && s.inputFocused,
        props.editable === false && s.inputDisabled,
        style,
      ]}
    />
  );
};

export const Panel = ({ children, style }) => <View style={[s.panel, style]}>{children}</View>;

export const Divider = ({ style }) => <View style={[s.divider, style]} />;

// Section heading used above panels and list groups.
export const SectionTitle = ({ children, style }) => (
  <Text style={[s.sectionTitle, style]}>{children}</Text>
);

export const Muted = ({ children, style }) => <Text style={[s.muted, style]}>{children}</Text>;

export const Mono = ({ children, style }) => <Text style={[s.mono, style]}>{children}</Text>;

// Replaces .alert / .alert-danger / .alert-success. `tone` picks the accent edge.
export const Alert = ({ tone = 'danger', icon, children, style }) => {
  const tones = {
    danger: { fg: color.statusRejected, bg: 'rgba(239, 90, 90, 0.1)' },
    success: { fg: color.statusResolved, bg: 'rgba(34, 197, 94, 0.1)' },
    info: { fg: color.accent, bg: color.accentWash },
  };
  const t = tones[tone] || tones.danger;
  return (
    <View style={[s.alert, { backgroundColor: t.bg, borderColor: t.fg }, style]}>
      {icon ? React.cloneElement(icon, { color: t.fg }) : null}
      <Text style={s.alertText}>{children}</Text>
    </View>
  );
};

export const Loading = ({ label = 'Loading…' }) => (
  <View style={s.loading}>
    <ActivityIndicator color={color.accent} />
    <Text style={s.muted}>{label}</Text>
  </View>
);

export const EmptyState = ({ title, hint }) => (
  <View style={s.empty}>
    <Text style={s.emptyTitle}>{title}</Text>
    {hint ? <Text style={s.muted}>{hint}</Text> : null}
  </View>
);

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    height: 36,
    paddingHorizontal: space[4],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  btnSm: { height: 30, paddingHorizontal: space[3] },
  btnLabel: { fontFamily: font.sansMedium, fontSize: text.small },
  btnLabelSm: { fontSize: text.monoSm },

  field: { gap: space[1] },
  fieldLabel: { fontFamily: font.sans, fontSize: text.small, color: color.textSecondary },
  fieldError: { fontFamily: font.sans, fontSize: text.small, color: color.statusRejected },

  input: {
    height: 36,
    paddingHorizontal: space[3],
    backgroundColor: color.surface,
    color: color.textPrimary,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.sm,
    fontFamily: font.sans,
    fontSize: text.body,
  },
  inputMultiline: {
    height: 'auto',
    minHeight: 96,
    paddingTop: space[2],
    paddingBottom: space[2],
    textAlignVertical: 'top',
  },
  // The web used a 3px box-shadow ring; RN has no spread shadow, so the focus
  // affordance is the accent border alone.
  inputFocused: { borderColor: color.accent },
  inputDisabled: { backgroundColor: color.gray900, color: color.textMuted },

  panel: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[5],
  },
  divider: { height: 1, backgroundColor: color.border },

  sectionTitle: {
    fontFamily: font.sansSemibold,
    fontSize: text.h3,
    color: color.textPrimary,
  },
  muted: { fontFamily: font.sans, fontSize: text.small, color: color.textMuted },
  mono: { fontFamily: font.mono, fontSize: text.monoMd, color: color.textSecondary },

  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space[3],
  },
  alertText: { flex: 1, fontFamily: font.sans, fontSize: text.small, color: color.textPrimary },

  loading: { paddingVertical: space[8], alignItems: 'center', gap: space[3] },
  empty: { paddingVertical: space[8], alignItems: 'center', gap: space[2] },
  emptyTitle: { fontFamily: font.sansMedium, fontSize: text.body, color: color.textSecondary },
});
