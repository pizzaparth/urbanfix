import React, { useState } from 'react';
import { View, Text } from 'react-native';

import AuthShell, { authStyles as a } from '../../components/AuthShell.jsx';
import { Field, PrimaryButton, GhostButton, Tappable, SegmentedPill } from '../../components/uikit.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { colors, uf as font } from '../../theme.js';

// The reference's "Peek admin view" flipped a local flag — there was no server.
// Here the admin tab set is gated on a real session, so the button prefills the
// admin account and leaves the password to be typed.
const ADMIN_EMAIL = 'admin@complaintsystem.gov';

const ENDS = [
  { value: 'citizen', label: 'Citizen' },
  { value: 'employee', label: 'Employee' },
  { value: 'research', label: 'Research' },
];

// The pill only chooses which form and copy to show. After sign-in the SERVER's
// role decides the tab set — so someone who picks the wrong end still gets in
// with the right password, instead of a confusing failure. (new_changes.md §10.1)
const COPY = {
  citizen: { title: 'Citizens', subtitle: 'No account, no password.' },
  employee: { title: 'Sign in', subtitle: 'Field staff, supervisors and admins.' },
  research: { title: 'Research', subtitle: 'Approved researchers only.' },
};

const LoginScreen = ({ navigation }) => {
  const [end, setEnd] = useState('citizen');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const changeEnd = (next) => {
    setError('');
    setEnd(next);
  };

  const signIn = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'MUST_SET_PASSWORD') {
        // Invited but hasn't redeemed the link yet.
        navigation.navigate('SetPassword');
      } else if (err.response?.status === 403) {
        // An unverified citizen account comes back 403 — send them to the OTP step.
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

  const copy = COPY[end];

  return (
    <AuthShell animationKey="login" title={copy.title} subtitle={copy.subtitle} error={error}>
      <View style={a.pillWrap}>
        <SegmentedPill options={ENDS} value={end} onChange={changeEnd} />
      </View>

      {end === 'citizen' ? (
        <View>
          <Text style={a.blurb}>
            Report a problem with just your email. We send a one-time code to confirm it's you, and
            give you a tracking ID to follow the fix.
          </Text>
          <PrimaryButton
            label="File a complaint"
            onPress={() => navigation.navigate('File')}
            style={a.primary}
          />
          <GhostButton
            label="Track a complaint"
            onPress={() => navigation.navigate('Track')}
            style={a.ghost}
          />
        </View>
      ) : (
        <View>
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

          {end === 'research' ? (
            <GhostButton
              label="Apply for research access"
              color={colors.secondary}
              onPress={() => navigation.navigate('ResearchApply')}
              style={a.ghost}
            />
          ) : (
            <GhostButton
              label="Peek admin view"
              color={colors.secondary}
              onPress={() => {
                setError('');
                setForm((f) => ({ ...f, email: ADMIN_EMAIL }));
              }}
              style={a.ghost}
            />
          )}

          <View style={a.footerLink}>
            <Tappable onPress={() => navigation.navigate('SetPassword')} scaleTo={0.96}>
              <Text style={a.switchText}>
                Invited? <Text style={a.switchLink}>Enter your invite code</Text>
              </Text>
            </Tappable>
          </View>
        </View>
      )}
    </AuthShell>
  );
};

export default LoginScreen;
