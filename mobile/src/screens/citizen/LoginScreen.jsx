import React, { useState } from 'react';
import { View, Text } from 'react-native';

import AuthShell, { authStyles as a } from '../../components/AuthShell.jsx';
import { Field, PrimaryButton, GhostButton, Tappable } from '../../components/uikit.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { colors } from '../../theme.js';

// The reference's "Peek admin view" flipped a local flag — there was no server.
// Here the admin tab set is gated on a real session, so the button prefills the
// admin account and leaves the password to be typed. It previously hard-coded
// admin@urbanfix.org / admin123, which is not an account that exists; the button
// could never have worked.
const ADMIN_EMAIL = 'admin@complaintsystem.gov';

const LoginScreen = ({ navigation }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const signIn = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
    } catch (err) {
      // An unverified account comes back 403 — send them to the OTP step rather
      // than showing a dead end.
      if (err.response?.status === 403) {
        navigation.navigate('VerifyOtp', { email });
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password.');
      return;
    }
    signIn(form.email.trim(), form.password);
  };

  return (
    <AuthShell
      animationKey="login"
      title="Sign in"
      subtitle="Citizens and staff, one door."
      error={error}
      footer={
        <Tappable onPress={() => navigation.navigate('Register')} scaleTo={0.96}>
          <Text style={a.switchText}>
            No account? <Text style={a.switchLink}>Create one</Text>
          </Text>
        </Tappable>
      }
    >
      <View style={a.fields}>
        <Field
          label="Email"
          value={form.email}
          onChangeText={set('email')}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Password"
          value={form.password}
          onChangeText={set('password')}
          placeholder="••••••••"
          secureTextEntry
        />
      </View>

      <PrimaryButton
        label={loading ? 'Signing in…' : 'Sign in'}
        onPress={handleSubmit}
        style={a.primary}
      />
      <GhostButton
        label="Peek admin view"
        color={colors.secondary}
        onPress={() => {
          setError('');
          setForm((f) => ({ ...f, email: ADMIN_EMAIL }));
        }}
        style={a.ghost}
      />
    </AuthShell>
  );
};

export default LoginScreen;
