import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';

import { Screen, Field, PrimaryButton, GhostButton, DangerButton, ErrorNote, Tappable } from '../components/ui';
import ComplaintCard from '../components/ComplaintCard';
import { useApp } from '../context/AppContext';
import { colors, font } from '../theme';

export default function AccountScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, complaints, signInCitizen, signInAdmin, signOut } = useApp();

  if (user) return <CitizenDashboard insets={insets} user={user} complaints={complaints} signOut={signOut} navigation={navigation} />;
  return <AuthFlow insets={insets} signInCitizen={signInCitizen} signInAdmin={signInAdmin} />;
}

function AuthFlow({ insets, signInCitizen, signInAdmin }) {
  const [mode, setMode] = useState('login'); // login | register | verify
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const login = () => {
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setError('');
    signInCitizen('Alex Rivera', email.trim());
  };

  const register = () => {
    if (!name.trim() || !email.trim() || !password) { setError('Fill in every field to continue.'); return; }
    setError('');
    setMode('verify');
  };

  const verify = () => {
    if (otp.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setError('');
    signInCitizen(name.trim(), email.trim());
  };

  return (
    <Screen contentStyle={{ paddingTop: insets.top, flexGrow: 1, justifyContent: 'center' }}>
      <Animated.View key={mode} entering={SlideInRight.duration(340)} style={s.authWrap}>
        {mode === 'login' && (
          <>
            <Text style={s.authTitle}>Sign in</Text>
            <Text style={s.authSub}>Citizens and staff, one door.</Text>
            <ErrorNote>{error}</ErrorNote>
            <View style={{ gap: 20 }}>
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
              <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
            </View>
            <PrimaryButton label="Sign in" onPress={login} style={{ marginTop: 28 }} />
            <GhostButton label="Peek admin view" color={colors.secondary} onPress={signInAdmin} style={{ marginTop: 12 }} />
            <Tappable onPress={() => { setMode('register'); setError(''); }} scaleTo={0.96} style={{ marginTop: 24 }}>
              <Text style={s.switchText}>No account? <Text style={s.switchLink}>Create one</Text></Text>
            </Tappable>
          </>
        )}

        {mode === 'register' && (
          <>
            <Text style={s.authTitle}>Create account</Text>
            <Text style={s.authSub}>Takes under a minute.</Text>
            <ErrorNote>{error}</ErrorNote>
            <View style={{ gap: 20 }}>
              <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
              <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
            </View>
            <PrimaryButton label="Continue" onPress={register} style={{ marginTop: 28 }} />
            <Tappable onPress={() => { setMode('login'); setError(''); }} scaleTo={0.96} style={{ marginTop: 24 }}>
              <Text style={s.switchText}>Already have one? <Text style={s.switchLink}>Sign in</Text></Text>
            </Tappable>
          </>
        )}

        {mode === 'verify' && (
          <>
            <Text style={s.authTitle}>Verify email</Text>
            <Text style={s.authSub}>{'Code sent to ' + (email || 'you@example.com')}</Text>
            <ErrorNote>{error}</ErrorNote>
            <Field value={otp} onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="000000" keyboardType="number-pad" />
            <PrimaryButton label="Verify & continue" onPress={verify} style={{ marginTop: 22 }} />
          </>
        )}
      </Animated.View>
    </Screen>
  );
}

function CitizenDashboard({ insets, user, complaints, signOut, navigation }) {
  const mine = useMemo(() => complaints.filter((c) => c.mine), [complaints]);

  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      <View style={s.dashHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.dashName}>{user.name}</Text>
          <Text style={s.dashEmail}>{user.email}</Text>
        </View>
        <DangerButton label="Sign out" onPress={signOut} />
      </View>

      <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
        <PrimaryButton label="File a new complaint" onPress={() => navigation.navigate('Report')} />
      </View>

      <Text style={s.count}>{mine.length + ' complaints'}</Text>

      <View style={s.list}>
        {mine.map((c, i) => (
          <Animated.View key={c.id} entering={FadeInDown.duration(320).delay(i * 50)}>
            <ComplaintCard complaint={c} onTrack={() => navigation.navigate('Track', { trackingId: c.trackingId })} />
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  authWrap: { paddingHorizontal: 24, paddingVertical: 28 },
  authTitle: { fontFamily: font.display, fontSize: 46, lineHeight: 48, color: colors.text, letterSpacing: -0.9 },
  authSub: { fontFamily: font.bodyBold, fontSize: 18, color: colors.muted, marginTop: 10, marginBottom: 30 },
  switchText: { textAlign: 'center', fontFamily: font.bodyBold, fontSize: 17, color: colors.muted },
  switchLink: { color: colors.accent, textDecorationLine: 'underline' },
  dashHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 24 },
  dashName: { fontFamily: font.display, fontSize: 26, color: colors.text },
  dashEmail: { fontFamily: font.body, fontSize: 14, color: colors.dim, marginTop: 4 },
  count: { paddingHorizontal: 20, fontFamily: font.display, fontSize: 15, color: colors.dim },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
});
