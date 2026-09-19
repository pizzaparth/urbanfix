import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import AuthCard from '../../components/AuthCard.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { color, font } from '../../theme.js';

const VerifyOtpScreen = ({ route, navigation }) => {
  const email = route.params?.email || '';
  const { verifyOtpCode } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (timer > 0) {
      const int = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(int);
    }
    return undefined;
  }, [timer]);

  const handleSubmit = async () => {
    if (otp.length !== 6) return setError('OTP must be exactly 6 digits.');
    setError('');
    setLoading(true);
    try {
      await verifyOtpCode(email, otp);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError('');
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      setTimer(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthCard
      title="Verify it's you"
      subtitle={`Code sent to ${email}`}
    >
      {error ? (
        <View style={s.errorAlert}>
          <Text style={s.errorAlertText}>{error}</Text>
        </View>
      ) : null}

      <View style={s.formGroup}>
        <View>
          <Text style={s.inputLabel}>Enter code</Text>
          <TextInput
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="number-pad"
            style={[s.giantInput, s.centerInput]}
            maxLength={6}
            onSubmitEditing={handleSubmit}
          />
        </View>
      </View>

      <Pressable 
        style={s.primaryBtn} 
        onPress={handleSubmit} 
        disabled={loading || otp.length !== 6}
      >
        <Text style={s.primaryBtnText}>{loading ? '...' : 'Verify Email'}</Text>
      </Pressable>

      <Pressable 
        style={s.secondaryBtn} 
        onPress={handleResend} 
        disabled={resending || timer > 0}
      >
        <Text style={s.secondaryBtnText}>
          {resending ? '...' : timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
        </Text>
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
    fontSize: 24,
    fontFamily: font.monoMedium,
    letterSpacing: 8,
  },
  centerInput: {
    textAlign: 'center',
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

export default VerifyOtpScreen;
