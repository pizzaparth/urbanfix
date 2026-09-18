import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ShieldCheck, AlertCircle } from 'lucide-react-native';
import AuthCard from '../../components/AuthCard.jsx';
import { Field, Input, Button, Alert } from '../../components/ui.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { ICON_STROKE } from '../../constants/icons.js';
import { color, space, font, text } from '../../theme.js';

// On success the web app called navigate('/admin/dashboard' | '/dashboard').
// Here the root navigator swaps tab sets off `user.role` as soon as the context
// updates, so there's nothing to navigate to — the redirect is implicit.
const LoginScreen = ({ navigation }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await loginUser(form.email.trim(), form.password);
    } catch (err) {
      // 403 means the account exists but was never email-verified.
      if (err.response?.status === 403) {
        navigation.navigate('VerifyOtp', { email: form.email.trim() });
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      icon={ShieldCheck}
      title="Sign In"
      subtitle="Citizens and administrators sign in here"
      footer={
        <View style={s.footerRow}>
          <Text style={s.muted}>Don't have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
            <Text style={s.link}>Register</Text>
          </Pressable>
        </View>
      }
    >
      {error ? (
        <Alert tone="danger" icon={<AlertCircle size={15} strokeWidth={ICON_STROKE} />}>
          {error}
        </Alert>
      ) : null}

      <Field label="Email Address">
        <Input
          value={form.email}
          onChangeText={set('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
      </Field>

      <Field label="Password">
        <Input
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </Field>

      <Button
        title="Sign In"
        onPress={handleSubmit}
        loading={loading}
        disabled={!form.email.trim() || !form.password}
      />
    </AuthCard>
  );
};

const s = StyleSheet.create({
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  muted: { fontFamily: font.sans, fontSize: text.small, color: color.textMuted },
  link: { fontFamily: font.sansMedium, fontSize: text.small, color: color.accent },
});

export default LoginScreen;
