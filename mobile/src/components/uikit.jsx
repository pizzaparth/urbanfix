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
import Icon from './Icon.jsx';
import { colors, uf as font, ufRadius as radius, statusColors } from '../theme.js';

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

// The 17pt label Field puts above an input, for pickers that aren't inputs.
export function FieldLabel({ children }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}

// Caps micro-heading above a block of content ("DESCRIPTION", "PHOTOGRAPHS").
export function Label({ children, style }) {
  return <Text style={[s.label, style]}>{String(children).toUpperCase()}</Text>;
}

// Label + value in a small surface tile; sits in a row or stands alone.
export function InfoTile({ label, value, flex, width, style }) {
  return (
    <View style={[s.tile, flex && { flex: 1 }, width ? { width } : null, style]}>
      <Label>{label}</Label>
      <Text style={s.tileValue}>{value}</Text>
    </View>
  );
}

// Big number over a label — the KPI cell from the admin dashboard.
export function StatTile({ label, value, color, style }) {
  return (
    <View style={[s.statTile, style]}>
      <View style={s.statHead}>
        {color ? <StatusDot color={color} /> : null}
        <Text numberOfLines={1} style={s.statLabel}>{label}</Text>
      </View>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

// The one empty state: a single centred line.
export function EmptyLine({ children }) {
  return <Text style={s.emptyLine}>{children}</Text>;
}

export function SuccessNote({ children }) {
  if (!children) return null;
  return <Text style={s.successNote}>{children}</Text>;
}

// Circular back button + title, for pushed screens.
export function BackHeader({ title, onBack }) {
  return (
    <View style={s.backHeader}>
      <Tappable onPress={onBack} scaleTo={0.9} style={s.backBtn}>
        <Icon name="chevronLeft" size={18} color={colors.text} strokeWidth={2.4} />
      </Tappable>
      <Text style={s.backTitle}>{title}</Text>
    </View>
  );
}

// A wrapped set of FilterPills for picking one value. options: string | { value, label, disabled }.
export function ChoiceGroup({ options, value, onChange, color = colors.accent }) {
  return (
    <View style={s.choiceRow}>
      {options.map((opt) => {
        const o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
        return (
          <View key={o.value} style={o.disabled ? { opacity: 0.35 } : null} pointerEvents={o.disabled ? 'none' : 'auto'}>
            <FilterPill label={o.label} active={value === o.value} color={color} onPress={() => onChange(o.value)} />
          </View>
        );
      })}
    </View>
  );
}

// Sliding pill selector. Same mechanism as GlassTabBar — one shared value driving
// translateX on the UI thread, same 200ms timing — so the app has one feel.
const SEG_PAD = 5;
const SEG_TIMING = { duration: 200 };
export function SegmentedPill({ options, value, onChange }) {
  const [width, setWidth] = React.useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const seg = width > 0 ? (width - SEG_PAD * 2 - 2) / options.length : 0;

  const x = useSharedValue(0);
  const laidOut = React.useRef(false);
  React.useEffect(() => {
    if (seg === 0) return;
    if (!laidOut.current) {
      // First measurement: place the pill, don't animate in from the left edge.
      laidOut.current = true;
      x.value = index * seg;
    } else {
      x.value = withTiming(index * seg, SEG_TIMING);
    }
  }, [index, seg]);

  const pillStyle = useAnimatedStyle(() => ({ width: seg, transform: [{ translateX: x.value }] }));

  return (
    <View style={s.segTrack} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {seg > 0 ? <Animated.View style={[s.segPill, pillStyle]} /> : null}
      {options.map((o) => (
        <Pressable key={o.value} onPress={() => onChange(o.value)} style={s.segItem}>
          <Text numberOfLines={1} style={[s.segText, { color: o.value === value ? colors.accentInk : colors.faint }]}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
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
  label: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.1, color: colors.dim, marginBottom: 7 },
  tile: {
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
  },
  tileValue: { fontFamily: font.bodyBold, fontSize: 15, color: colors.text },
  statTile: { padding: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { flex: 1, fontFamily: font.bodyBold, fontSize: 16, color: colors.text },
  statValue: { fontFamily: font.display, fontSize: 44, lineHeight: 46, color: colors.text, marginTop: 10 },
  emptyLine: { textAlign: 'center', paddingVertical: 44, fontFamily: font.body, fontSize: 15, color: colors.dim },
  successNote: { fontFamily: font.bodyBold, fontSize: 15, lineHeight: 22, color: statusColors.Resolved, textAlign: 'center' },
  backHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTitle: { fontFamily: font.display, fontSize: 24, color: colors.text },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  segTrack: {
    flexDirection: 'row',
    padding: SEG_PAD,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  segPill: {
    position: 'absolute',
    left: SEG_PAD,
    top: SEG_PAD,
    bottom: SEG_PAD,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  segItem: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  segText: { fontFamily: font.display, fontSize: 15 },
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
