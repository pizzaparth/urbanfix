import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import AuthCard from '../../components/AuthCard.jsx';
import api from '../../services/api.js';
import { color, font } from '../../theme.js';

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters long.');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigation.navigate('VerifyOtp', { email: form.email });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  return (
    <AuthCard
      title="Join us"
      subtitle="Help build a better city today."
      footer={
        <Text style={s.muted}>
          Already registered?{' '}
          <Text style={s.link} onPress={() => navigation.navigate('Login')}>
            Sign in
          </Text>
        </Text>
      }
    >
      {error ? (
        <View style={s.errorAlert}>
          <Text style={s.errorAlertText}>{error}</Text>
        </View>
      ) : null}

      <View style={s.formGroup}>
        <View>
          <Text style={s.inputLabel}>Full name</Text>
          <TextInput
            value={form.name}
            onChangeText={set('name')}
            placeholder="Jane Doe"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={s.giantInput}
          />
        </View>
        <View>
          <Text style={s.inputLabel}>Email</Text>
          <TextInput
            value={form.email}
            onChangeText={set('email')}
            placeholder="you@example.com"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="email-address"
            autoCapitalize="none"
            style={s.giantInput}
          />
        </View>
        <View>
          <Text style={s.inputLabel}>Password</Text>
          <TextInput
            value={form.password}
            onChangeText={set('password')}
            placeholder="••••••••"
            placeholderTextColor="rgba(255,255,255,0.4)"
            secureTextEntry
            autoCapitalize="none"
            style={s.giantInput}
            onSubmitEditing={handleSubmit}
          />
        </View>
      </View>

      <Pressable 
        style={s.primaryBtn} 
        onPress={handleSubmit} 
        disabled={loading || !form.name.trim() || !form.email.trim() || !form.password}
      >
        <Text style={s.primaryBtnText}>{loading ? '...' : 'Create account'}</Text>
      </Pressable>
    </AuthCard>
  );
};

const s = StyleSheet.create({
  formGroup: { gap: 20 },
  inputLabel: {
    fontSize: 17,
    fontFamily: font.sansBold,
    color: color.white,
    marginBottom: 10,
  },
  giantInput: {
    width: '100%',
    height: 62,
    paddingHorizontal: 18,
    backgroundColor: '#120E13',
    borderWidth: 1.5,
    borderColor: '#2C222B',
    borderRadius: 18,
    color: color.white,
    fontSize: 18,
    fontFamily: font.sansBold,
  },
  primaryBtn: {
    width: '100%',
    height: 66,
    borderRadius: 100,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    fontFamily: font.sansBold,
    fontSize: 20,
    color: '#1C0512',
  },
  muted: {
    fontFamily: font.sansBold,
    fontSize: 17,
    color: color.white,
    opacity: 0.62,
  },
  link: {
    fontFamily: font.sansBold,
    fontSize: 17,
    textDecorationLine: 'underline',
    color: color.white,
  },
  errorAlert: {
    padding: 16,
    backgroundColor: '#1C0F15',
    borderWidth: 1.5,
    borderColor: '#FF5A7A',
    borderRadius: 18,
    marginBottom: -2,
  },
  errorAlertText: {
    color: '#FF5A7A',
    fontFamily: font.sansBold,
    fontSize: 16,
  },
});

export default RegisterScreen;
