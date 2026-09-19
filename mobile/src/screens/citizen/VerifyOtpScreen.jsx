import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';

import AuthShell, { authStyles as a } from '../../components/AuthShell.jsx';
import { Field, PrimaryButton, Tappable } from '../../components/uikit.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';

const RESEND_SECONDS = 30;

const VerifyOtpScreen = ({ route }) => {
  const email = route.params?.email || '';
  const { verifyOtpCode } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const int = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(int);
  }, [timer]);

  const handleSubmit = async () => {
    if (otp.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyOtpCode(email, otp);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError('');
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      setTimer(RESEND_SECONDS);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      animationKey="verify"
      title="Verify email"
      subtitle={'Code sent to ' + (email || 'your inbox')}
      error={error}
      footer={
        // The reference had no resend — its OTP was decorative. A real code can
        // expire or never arrive, so this has to be reachable.
        <Tappable onPress={handleResend} scaleTo={0.96} disabled={resending || timer > 0}>
          <Text style={a.switchText}>
            {resending ? (
              'Sending…'
            ) : timer > 0 ? (
              `Resend in ${timer}s`
            ) : (
              <Text style={a.switchLink}>Resend code</Text>
            )}
          </Text>
        </Tappable>
      }
    >
      <Field
        value={otp}
        onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, 6))}
        placeholder="000000"
        keyboardType="number-pad"
      />

      <PrimaryButton
        label={loading ? 'Verifying…' : 'Verify & continue'}
        onPress={handleSubmit}
        style={a.primary}
      />
    </AuthShell>
  );
};

export default VerifyOtpScreen;
