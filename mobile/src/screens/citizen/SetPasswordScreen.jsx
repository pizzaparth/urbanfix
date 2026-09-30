import React, { useState } from 'react';
import { View } from 'react-native';

import AuthShell, { authStyles as a } from '../../components/AuthShell.jsx';
import { Field, PrimaryButton, GhostButton } from '../../components/uikit.jsx';
import { useAuth } from '../../hooks/useAuth.js';

// Redeems the single-use invite an admin's account-creation (or a research
// approval) emailed out. No password is ever sent by email — the person picks
// their own here, and the invite stops working once used.
//
// Reached from the email's deep link (dsn://set-password?token=…, which prefills
// the code) or by pasting the code from the email.
const SetPasswordScreen = ({ navigation, route }) => {
  const { setPasswordWithInvite } = useAuth();
  const [form, setForm] = useState({
    inviteToken: route.params?.token || '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.inviteToken.trim()) return setError('Enter the invite code from your email.');
    // Server-side rules, checked here so the user isn't told by a 400.
    if (form.password.length < 8) return setError('Password must be at least 8 characters long.');
    if (form.password !== form.confirm) return setError('The two passwords do not match.');

    setLoading(true);
    try {
      await setPasswordWithInvite(form.inviteToken.trim(), form.password);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not set your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      animationKey="set-password"
      title="Choose a password"
      subtitle="Use the invite code from your email."
      error={error}
    >
      <View style={a.fields}>
        <Field
          label="Invite code"
          value={form.inviteToken}
          onChangeText={set('inviteToken')}
          placeholder="Paste the code"
          autoCapitalize="none"
        />
        <Field
          label="New password"
          value={form.password}
          onChangeText={set('password')}
          placeholder="At least 8 characters"
          secureTextEntry
        />
        <Field
          label="Confirm password"
          value={form.confirm}
          onChangeText={set('confirm')}
          placeholder="Repeat it"
          secureTextEntry
        />
      </View>

      <PrimaryButton
        label={loading ? 'Saving…' : 'Set password & sign in'}
        onPress={handleSubmit}
        style={a.primary}
      />
      <GhostButton label="Back to sign in" onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login'))} style={a.ghost} />
    </AuthShell>
  );
};

export default SetPasswordScreen;
