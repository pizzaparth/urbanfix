import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { UserPlus, AlertCircle } from 'lucide-react-native';
import AuthCard from '../../components/AuthCard.jsx';
import { Field, Input, Button, Alert } from '../../components/ui.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { ICON_STROKE } from '../../constants/icons.js';
import { color, space, font, text } from '../../theme.js';

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerUser } = useAuth();

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  // The web form leaned on HTML validation (required, pattern="\d{10}",
  // min 8 chars). RN has no form validation, so the same rules are explicit.
  const phoneOk = /^\d{10}$/.test(form.phone);
  const canSubmit =
    form.name.trim() && form.email.trim() && phoneOk && form.password.length >= 8;

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await registerUser(form.name.trim(), form.email.trim(), form.password, form.phone);
      navigation.navigate('VerifyOtp', { email: form.email.trim() });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      icon={UserPlus}
      title="Create Citizen Account"
      subtitle="Register to report issues and track resolutions"
      footer={
        <View style={s.footerRow}>
          <Text style={s.muted}>Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
            <Text style={s.link}>Login here</Text>
          </Pressable>
        </View>
      }
    >
      {error ? (
        <Alert tone="danger" icon={<AlertCircle size={15} strokeWidth={ICON_STROKE} />}>
          {error}
        </Alert>
      ) : null}

      <Field label="Full Name">
        <Input value={form.name} onChangeText={set('name')} autoComplete="name" />
      </Field>

      <Field label="Email Address">
        <Input
          value={form.email}
          onChangeText={set('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </Field>

      <Field
        label="Phone Number (10 digits)"
        error={form.phone && !phoneOk ? 'Enter exactly 10 digits.' : ''}
      >
        <Input
          value={form.phone}
          onChangeText={(v) => set('phone')(v.replace(/\D/g, '').slice(0, 10))}
          keyboardType="number-pad"
          placeholder="e.g. 9876543210"
          maxLength={10}
        />
      </Field>

      <Field
        label="Password (Min 8 characters)"
        error={form.password && form.password.length < 8 ? 'At least 8 characters.' : ''}
      >
        <Input
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry
          autoCapitalize="none"
        />
      </Field>

      <Button title="Register" onPress={handleSubmit} loading={loading} disabled={!canSubmit} />
    </AuthCard>
  );
};

const s = StyleSheet.create({
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  muted: { fontFamily: font.sans, fontSize: text.small, color: color.textMuted },
  link: { fontFamily: font.sansMedium, fontSize: text.small, color: color.accent },
});

export default RegisterScreen;
