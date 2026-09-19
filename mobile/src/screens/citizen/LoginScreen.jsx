import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import AuthCard from '../../components/AuthCard.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { color, font } from '../../theme.js';

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
      title="Sign in"
      subtitle="Citizens and staff, one door."
      footer={
        <Text style={s.muted}>
          No account?{' '}
          <Text style={s.link} onPress={() => navigation.navigate('Register')}>
            Create one
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
        disabled={loading || !form.email.trim() || !form.password}
      >
        <Text style={s.primaryBtnText}>{loading ? '...' : 'Sign in'}</Text>
      </Pressable>
      
      <Pressable 
        style={s.secondaryBtn} 
        onPress={() => {
          set('email')('admin@urbanfix.org');
          set('password')('admin123');
        }} 
      >
        <Text style={s.secondaryBtnText}>Peek admin view</Text>
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
  secondaryBtn: {
    width: '100%',
    height: 58,
    borderRadius: 100,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2C222B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: font.sansBold,
    fontSize: 17,
    color: '#C08BFF',
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

export default LoginScreen;
