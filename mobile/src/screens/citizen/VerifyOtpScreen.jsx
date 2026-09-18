import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import AuthCard from '../../components/AuthCard.jsx';
import { Input, Button, Alert } from '../../components/ui.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';
import { color, space, font, text } from '../../theme.js';

// The web version read the email from router location.state; here it's a
// navigation param passed by Login (on 403) or Register.
const VerifyOtpScreen = ({ route }) => {
  const email = route.params?.email || '';
  const { verifyOtpCode } = useAuth();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // On success the auth context populates `user` and the root navigator swaps
  // in the signed-in stack, so there's no explicit navigate here.
  const handleSubmit = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await verifyOtpCode(email, otp);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      const response = await api.post('/auth/resend-otp', { email });
      setMessage(response.data.message || 'Verification code resent successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    }
  };

  return (
    <AuthCard
      icon={ShieldCheck}
      title="Verify Email Address"
      subtitle={`Enter the 6-digit verification code sent to ${email}`}
      footer={
        <View style={s.footerRow}>
          <Text style={s.muted}>Didn't receive the email? </Text>
          <Pressable onPress={handleResend} hitSlop={8}>
            <Text style={s.link}>Resend code</Text>
          </Pressable>
        </View>
      }
    >
      {error ? (
        <Alert tone="danger" icon={<AlertCircle size={15} strokeWidth={ICON_STROKE} />}>
          {error}
        </Alert>
      ) : null}
      {message ? (
        <Alert tone="success" icon={<CheckCircle2 size={15} strokeWidth={ICON_STROKE} />}>
          {message}
        </Alert>
      ) : null}

      <Input
        value={otp}
        onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        style={s.otpInput}
      />

      <Button title="Verify OTP" onPress={handleSubmit} loading={loading} disabled={otp.length !== 6} />
    </AuthCard>
  );
};

const s = StyleSheet.create({
  otpInput: {
    height: 52,
    fontFamily: font.mono,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  muted: { fontFamily: font.sans, fontSize: text.small, color: color.textMuted },
  link: { fontFamily: font.sansMedium, fontSize: text.small, color: color.accent },
});

export default VerifyOtpScreen;
