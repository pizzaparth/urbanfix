import React from 'react';
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, ErrorNote } from './uikit.jsx';
import { colors, uf as font } from '../theme.js';

// The reference app kept sign-in, register and verify as three modes of one
// AccountScreen. Here they are three routes on a stack (they have to be — the
// OTP step is reachable from a 403 on login, not just from register), so the
// shared chrome lives here instead and each screen fills in the middle.
//
// SlideInRight is keyed by the screen so moving between them reads as the same
// horizontal advance the reference had when it swapped modes.
const AuthShell = ({ title, subtitle, error, children, footer, animationKey }) => (
  <KeyboardAvoidingView
    style={s.flex}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
  >
    <AuthBody title={title} subtitle={subtitle} error={error} footer={footer} animationKey={animationKey}>
      {children}
    </AuthBody>
  </KeyboardAvoidingView>
);

const AuthBody = ({ title, subtitle, error, children, footer, animationKey }) => {
  const insets = useSafeAreaInsets();
  return (
    <Screen contentStyle={{ paddingTop: insets.top, flexGrow: 1, justifyContent: 'center' }}>
      <View key={animationKey} style={s.authWrap}>
        <Text style={s.authTitle}>{title}</Text>
        {subtitle ? <Text style={s.authSub}>{subtitle}</Text> : null}
        <ErrorNote>{error}</ErrorNote>
        {children}
        {footer ? <View style={s.footer}>{footer}</View> : null}
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  authWrap: { paddingHorizontal: 24, paddingVertical: 28 },
  authTitle: {
    fontFamily: font.display,
    fontSize: 46,
    lineHeight: 48,
    color: colors.text,
    letterSpacing: -0.9,
  },
  authSub: {
    fontFamily: font.bodyBold,
    fontSize: 18,
    color: colors.muted,
    marginTop: 10,
    marginBottom: 30,
  },
  footer: { marginTop: 24 },
});

export const authStyles = StyleSheet.create({
  fields: { gap: 20 },
  primary: { marginTop: 28 },
  ghost: { marginTop: 12 },
  switchText: {
    textAlign: 'center',
    fontFamily: font.bodyBold,
    fontSize: 17,
    color: colors.muted,
  },
  switchLink: { color: colors.accent, textDecorationLine: 'underline' },
});

export default AuthShell;
