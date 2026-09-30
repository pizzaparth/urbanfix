import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import AuthShell, { authStyles as a } from '../../components/AuthShell.jsx';
import { Field, FieldLabel, ChoiceGroup, PrimaryButton, GhostButton, Card } from '../../components/uikit.jsx';
import api from '../../services/api.js';
import { colors, uf as font } from '../../theme.js';

const MIN_PURPOSE = 100;

const SCOPES = [
  { value: 'aggregate_only', label: 'Statistics only' },
  { value: 'anonymised_records', label: 'Anonymised records' },
];
const DAYS = [
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '180 days' },
];

const ResearchApplyScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    institute: '',
    title: '',
    purpose: '',
    datasetScope: 'aggregate_only',
    requestedDays: 60,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.fullName.trim() || !form.email.trim() || !form.institute.trim() || !form.title.trim()) {
      return setError('Fill in your name, email, institute and title.');
    }
    if (form.purpose.trim().length < MIN_PURPOSE) {
      return setError(`Describe what you intend to study (at least ${MIN_PURPOSE} characters).`);
    }
    setLoading(true);
    try {
      const res = await api.post('/research/apply', form);
      setReferenceId(res.data.referenceId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send your application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (referenceId) {
    return (
      <AuthShell animationKey="research-done" title="Application sent" subtitle="An admin will review it.">
        <Card>
          <Text style={s.refLabel}>REFERENCE</Text>
          <Text selectable style={s.refValue}>{referenceId}</Text>
          <Text style={s.refNote}>
            You'll get an email either way. If approved, it carries your access period and a link to
            set your password.
          </Text>
        </Card>
        <PrimaryButton label="Back to sign in" onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login'))} style={a.primary} />
      </AuthShell>
    );
  }

  const remaining = MIN_PURPOSE - form.purpose.trim().length;

  return (
    <AuthShell
      animationKey="research-apply"
      title="Research access"
      subtitle="Time-limited, anonymised, logged."
      error={error}
    >
      <View style={a.fields}>
        <Field label="Full name" value={form.fullName} onChangeText={set('fullName')} placeholder="Your name" />
        <Field
          label="Email"
          value={form.email}
          onChangeText={set('email')}
          placeholder="you@university.edu"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field label="Institute" value={form.institute} onChangeText={set('institute')} placeholder="University or organisation" />
        <Field label="Title" value={form.title} onChangeText={set('title')} placeholder="e.g. PhD candidate, Urban Planning" />
        <View>
          <Field
            label="What will you study?"
            value={form.purpose}
            onChangeText={set('purpose')}
            placeholder="Describe your research question and how you'll use the data"
            multiline
          />
          <Text style={s.counter}>
            {remaining > 0 ? `${remaining} more characters needed` : 'Long enough'}
          </Text>
        </View>

        <View>
          <FieldLabel>Data you need</FieldLabel>
          <ChoiceGroup options={SCOPES} value={form.datasetScope} onChange={set('datasetScope')} color={colors.secondary} />
          <Text style={s.hint}>
            Record-level access still contains no names, contact details or free text — and an admin
            has to grant it explicitly.
          </Text>
        </View>

        <View>
          <FieldLabel>Access period</FieldLabel>
          <ChoiceGroup options={DAYS} value={form.requestedDays} onChange={set('requestedDays')} color={colors.secondary} />
        </View>
      </View>

      <PrimaryButton
        label={loading ? 'Sending…' : 'Send application'}
        onPress={handleSubmit}
        style={a.primary}
      />
      <GhostButton label="Back" onPress={() => navigation.goBack()} style={a.ghost} />
    </AuthShell>
  );
};

const s = StyleSheet.create({
  counter: { fontFamily: font.body, fontSize: 13, color: colors.dim, marginTop: 8 },
  hint: { fontFamily: font.body, fontSize: 14, lineHeight: 21, color: colors.dim, marginTop: 12 },
  refLabel: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.1, color: colors.dim, marginBottom: 7 },
  refValue: { fontFamily: font.display, fontSize: 18, color: colors.text },
  refNote: { fontFamily: font.body, fontSize: 15, lineHeight: 23, color: colors.muted, marginTop: 16 },
});

export default ResearchApplyScreen;
