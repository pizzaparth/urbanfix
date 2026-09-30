import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Screen, Card, PrimaryButton, ChoiceGroup, FieldLabel, ErrorNote, SuccessNote, BackHeader,
} from '../../components/uikit.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { saveTextFile } from '../../utils/saveTextFile.js';
import api from '../../services/api.js';
import { colors, uf as font } from '../../theme.js';

const GROUPS = [
  { value: 'category', label: 'Category' },
  { value: 'ward', label: 'Ward' },
  { value: 'status', label: 'Status' },
  { value: 'urgency', label: 'Urgency' },
  { value: 'month', label: 'Month' },
];
const FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
];

const ExportScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const recordAccess = user?.researcher?.datasetScope === 'anonymised_records';

  const [kind, setKind] = useState('aggregate');
  const [groupBy, setGroupBy] = useState('category');
  const [format, setFormat] = useState('csv');
  const [usage, setUsage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadUsage = async () => {
    try {
      const res = await api.get('/research/me');
      setUsage(res.data.usage);
    } catch {
      // The Profile tab surfaces load errors; here the counter just stays blank.
    }
  };

  useEffect(() => {
    loadUsage();
  }, []);

  const kinds = [
    { value: 'aggregate', label: 'Aggregates' },
    { value: 'records', label: 'Anonymised records', disabled: !recordAccess },
  ];

  const download = async () => {
    setError('');
    setSuccess('');
    if (usage && usage.exportsRemainingToday <= 0) {
      return setError(`You've used all ${usage.exportDailyLimit} exports for today. Try again tomorrow.`);
    }
    setBusy(true);
    try {
      const res = await api.get('/research/export', {
        params: { groupBy, format, records: kind === 'records' ? 'true' : 'false' },
        // The body is CSV/JSON text we save verbatim — don't let axios parse it.
        responseType: 'text',
        transformResponse: (d) => d,
      });
      const name =
        res.headers['x-export-filename'] || `urbanfix-export.${format}`;
      const saved = await saveTextFile(name, res.data, format === 'csv' ? 'text/csv' : 'application/json');
      if (saved) setSuccess(`Exported ${name}.`);
      await loadUsage();
    } catch (err) {
      // With responseType 'text' the error body arrives as a string.
      let message = 'Export failed. Please try again.';
      try {
        const body = typeof err.response?.data === 'string' ? JSON.parse(err.response.data) : err.response?.data;
        if (body?.message) message = body.message;
      } catch {
        // keep the generic message
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      <BackHeader title="Export" onBack={() => navigation.goBack()} />
      <View style={s.body}>
        <Card>
          <Text style={s.privacy}>
            Exports never contain names, contact details, addresses or free text. Locations are
            reduced to a ward and dates to a day. Every export is logged.
          </Text>
        </Card>

        <ErrorNote>{error}</ErrorNote>

        <View>
          <FieldLabel>What to export</FieldLabel>
          <ChoiceGroup options={kinds} value={kind} onChange={setKind} color={colors.secondary} />
          {!recordAccess ? (
            <Text style={s.hint}>Record-level access wasn't granted with your approval.</Text>
          ) : null}
        </View>

        {kind === 'aggregate' ? (
          <View>
            <FieldLabel>Group by</FieldLabel>
            <ChoiceGroup options={GROUPS} value={groupBy} onChange={setGroupBy} color={colors.secondary} />
          </View>
        ) : null}

        <View>
          <FieldLabel>Format</FieldLabel>
          <ChoiceGroup options={FORMATS} value={format} onChange={setFormat} color={colors.secondary} />
        </View>

        {usage ? (
          <Text style={s.hint}>
            {`${usage.exportsRemainingToday} of ${usage.exportDailyLimit} exports left today · up to ${usage.exportRowCap.toLocaleString()} rows each`}
          </Text>
        ) : null}

        <PrimaryButton label={busy ? 'Preparing…' : 'Download'} onPress={download} disabled={busy} />
        <SuccessNote>{success}</SuccessNote>
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 8, gap: 22 },
  privacy: { fontFamily: font.body, fontSize: 15, lineHeight: 23, color: colors.muted },
  hint: { fontFamily: font.body, fontSize: 14, lineHeight: 21, color: colors.dim, marginTop: 12 },
});

export default ExportScreen;
