import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { ICON_STROKE } from '../constants/icons.js';
import { color, space, radius, font, text } from '../theme.js';

// Shared chrome for Login / Register / VerifyOtp — the bordered icon badge,
// title and subtitle those three pages each repeated inline on the web.
// KeyboardAvoidingView is new: on a phone the keyboard would otherwise cover
// the submit button.
const AuthCard = ({ icon: Icon, title, subtitle, children, footer }) => (
  <KeyboardAvoidingView
    style={s.flex}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
  >
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.panel}>
        <View style={s.head}>
          <View style={s.badge}>
            <Icon size={20} strokeWidth={ICON_STROKE} color={color.accent} />
          </View>
          <Text style={s.title}>{title}</Text>
          {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={s.body}>{children}</View>
        {footer ? <View style={s.footer}>{footer}</View> : null}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
);

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: color.bg },
  content: { flexGrow: 1, justifyContent: 'center', padding: space[4] },
  panel: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[5],
  },
  head: { alignItems: 'center', marginBottom: space[4] },
  badge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.borderStrong,
    borderRadius: radius.md,
    marginBottom: space[3],
  },
  title: { fontFamily: font.sansSemibold, fontSize: 20, color: color.textPrimary, marginBottom: space[1] },
  subtitle: {
    fontFamily: font.sans,
    fontSize: text.small,
    color: color.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  body: { gap: space[3] },
  footer: {
    marginTop: space[4],
    paddingTop: space[3],
    borderTopWidth: 1,
    borderTopColor: color.border,
    alignItems: 'center',
  },
});

export default AuthCard;
