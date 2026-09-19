import React, { useState } from 'react';
import { View, Text } from 'react-native';

import AuthShell, { authStyles as a } from '../../components/AuthShell.jsx';
import { Field, PrimaryButton, Tappable } from '../../components/uikit.jsx';
import api from '../../services/api.js';

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Fill in every field to continue.');
      return;
    }
    // Server-side rule; checked here so the user isn't told about it by a 400.
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigation.navigate('VerifyOtp', { email: form.email.trim() });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      animationKey="register"
      title="Create account"
      subtitle="Takes under a minute."
      error={error}
      footer={
        <Tappable onPress={() => navigation.navigate('Login')} scaleTo={0.96}>
          <Text style={a.switchText}>
            Already have one? <Text style={a.switchLink}>Sign in</Text>
          </Text>
        </Tappable>
      }
    >
      <View style={a.fields}>
        <Field
          label="Full name"
          value={form.name}
          onChangeText={set('name')}
          placeholder="Your name"
        />
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
        label={loading ? 'Creating…' : 'Continue'}
        onPress={handleSubmit}
        style={a.primary}
      />
    </AuthShell>
  );
};

export default RegisterScreen;
