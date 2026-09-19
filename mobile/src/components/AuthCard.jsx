import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { color, space, radius, font, text } from '../theme.js';

const AuthCard = ({ title, subtitle, children, footer, header }) => (
  <KeyboardAvoidingView
    style={s.flex}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
  >
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.panel}>
        {header ? (
          header
        ) : (
          <View style={s.head}>
            <Text style={s.title}>{title}</Text>
            {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
          </View>
        )}
        <View style={s.body}>{children}</View>
        {footer ? <View style={s.footer}>{footer}</View> : null}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
);

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: color.bg },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 104 },
  panel: {
    // No background, no border
    paddingVertical: 28,
  },
  head: {
    marginBottom: 30,
  },
  title: { 
    fontFamily: font.sansBold, 
    fontSize: 46, 
    lineHeight: 48,
    letterSpacing: -0.5,
    color: color.white 
  },
  subtitle: {
    fontFamily: font.sansBold,
    fontSize: 18,
    color: color.white,
    opacity: 0.62,
    marginTop: 10,
  },
  body: { gap: 20 },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
});

export default AuthCard;
