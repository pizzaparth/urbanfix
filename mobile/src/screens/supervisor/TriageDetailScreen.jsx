import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import {
  Screen, Card, Tappable, PrimaryButton, ErrorNote, SuccessNote, Label, InfoTile, BackHeader,
} from '../../components/uikit.jsx';
import FormattedDescription from '../../components/FormattedDescription.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import { SkeletonBlock } from '../../components/Skeleton.jsx';
import { stageLabel } from '../../constants/stages.js';
import api, { getUploadsBaseUrl } from '../../services/api.js';
import { colors, uf as font, statusColors } from '../../theme.js';

const MIN_REMARKS = 10;

// The five moves a supervisor/admin can make, and which stage allows each.
// (Mirrors TRANSITIONS in backend/utils/complaintStage.js; the server is the
// real gate, this just keeps the UI honest.) Illegal ones stay visible but
// dimmed, so the grid always reads as the full set — same as the status grid.
const ACTIONS = [
  { key: 'accept', label: 'Accept', tone: 'In Progress', from: ['submitted'], remarks: true, cta: 'Accept complaint' },
  { key: 'reject', label: 'Reject', tone: 'Rejected', from: ['submitted'], remarks: true, cta: 'Reject complaint' },
  { key: 'assign', label: 'Assign', tone: 'Pending', from: ['accepted', 'assigned'], remarks: false },
  { key: 'close', label: 'Close', tone: 'Resolved', from: ['proof_submitted'], remarks: true, cta: 'Close & send receipt' },
  { key: 'rework', label: 'Rework', tone: 'Pending', from: ['proof_submitted'], remarks: true, cta: 'Send back for rework' },
];

const TriageDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { id } = route.params || {};

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [action, setAction] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/supervisor/complaints/${id}`);
      setComplaint(res.data.complaint);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load this complaint.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Also reload on return from the Assign screen.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const choose = (a) => {
    setActionError('');
    setSuccess('');
    if (a.key === 'assign') {
      navigation.navigate('Assign', { id, ward: complaint.ward, title: complaint.title });
      return;
    }
    setAction(a.key);
  };

  const confirm = async () => {
    const a = ACTIONS.find((x) => x.key === action);
    setActionError('');
    if (remarks.trim().length < MIN_REMARKS) {
      return setActionError(`Remarks must be at least ${MIN_REMARKS} characters.`);
    }
    setBusy(true);
    try {
      await api.patch(`/supervisor/complaints/${id}/${a.key}`, { remarks: remarks.trim() });
      setRemarks('');
      setAction('');
      setSuccess(
        a.key === 'close'
          ? 'Closed. A PDF receipt has been generated and emailed to the citizen.'
          : 'Updated successfully.'
      );
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not update this complaint.');
    } finally {
      setBusy(false);
    }
  };

  const header = <BackHeader title="Complaint" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen contentStyle={{ paddingTop: insets.top }}>
        {header}
        <View style={s.body}>
          <SkeletonBlock height={28} width="80%" />
          <SkeletonBlock height={72} />
          <SkeletonBlock height={120} />
        </View>
      </Screen>
    );
  }

  if (error || !complaint) {
    return (
      <Screen contentStyle={{ paddingTop: insets.top }}>
        {header}
        <View style={s.body}>
          <ErrorNote>{error || 'Complaint not found.'}</ErrorNote>
        </View>
      </Screen>
    );
  }

  const uploads = getUploadsBaseUrl();
  const allowed = ACTIONS.filter((a) => a.from.includes(complaint.stage)).map((a) => a.key);
  const current = ACTIONS.find((a) => a.key === action);

  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      {header}
      <View style={s.body}>
        <View>
          <Text style={s.title}>{complaint.title}</Text>
          <Text style={s.trackingId}>{complaint.trackingId}</Text>
        </View>

        <View style={s.tileRow}>
          <InfoTile label="Stage" value={stageLabel(complaint.stage)} flex />
          <InfoTile label="Ward" value={complaint.ward || '—'} width={124} />
        </View>
        <View style={s.tileRow}>
          <InfoTile label="Category" value={complaint.category} flex />
          <InfoTile label="Filed" value={new Date(complaint.createdAt).toLocaleDateString()} width={124} />
        </View>
        <InfoTile label="Location" value={complaint.location} />
        {complaint.assignedTo ? (
          <InfoTile
            label="Assigned to"
            value={`${complaint.assignedTo.name}${complaint.assignedTo.employee?.ward ? ` · ${complaint.assignedTo.employee.ward}` : ''}`}
          />
        ) : null}

        <View>
          <Label>Description</Label>
          <FormattedDescription description={complaint.description} />
        </View>

        {complaint.images?.length > 0 ? (
          <View>
            <Label>Photographs</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.imageRow}>
              {complaint.images.map((img, i) => (
                <Image key={i} source={{ uri: `${uploads}${img}` }} style={s.image} resizeMode="cover" />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {complaint.completionImages?.length > 0 ? (
          <View>
            <Label>Completion proof</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.imageRow}>
              {complaint.completionImages.map((img, i) => (
                <Image key={i} source={{ uri: `${uploads}${img}` }} style={s.image} resizeMode="cover" />
              ))}
            </ScrollView>
            {complaint.completionNote ? <Text style={s.proofNote}>{complaint.completionNote}</Text> : null}
          </View>
        ) : null}

        <View>
          <Label>Status log history</Label>
          <StatusTimeline statusHistory={complaint.statusHistory} />
        </View>

        <View>
          <Label>Actions</Label>
          <View style={s.grid}>
            {ACTIONS.map((a) => {
              const ok = allowed.includes(a.key);
              const active = action === a.key;
              return (
                <View key={a.key} style={s.cell}>
                  <Tappable
                    onPress={() => ok && choose(a)}
                    disabled={!ok}
                    scaleTo={0.96}
                    style={[
                      s.actionBtn,
                      {
                        borderColor: active ? statusColors[a.tone] : colors.borderStrong,
                        backgroundColor: active ? colors.surfaceInput : 'transparent',
                        opacity: ok ? 1 : 0.35,
                      },
                    ]}
                  >
                    <View style={[s.dot, { backgroundColor: statusColors[a.tone] }]} />
                    <Text style={s.actionLabel}>{a.label}</Text>
                  </Tappable>
                </View>
              );
            })}
          </View>
          {allowed.length === 0 ? (
            <Card style={s.terminal}>
              <Text style={s.terminalText}>
                Nothing to do here — this complaint is {stageLabel(complaint.stage).toLowerCase()}.
                {complaint.stage === 'work_in_progress' ? ' It is with the field employee.' : ''}
              </Text>
            </Card>
          ) : null}
        </View>

        {current ? (
          <View>
            <Label>Remarks</Label>
            <ErrorNote>{actionError}</ErrorNote>
            <TextInput
              value={remarks}
              onChangeText={setRemarks}
              placeholder={`Explain your decision (min ${MIN_REMARKS} characters)`}
              placeholderTextColor={colors.placeholder}
              multiline
              style={s.remarksInput}
            />
            <PrimaryButton
              label={busy ? 'Working…' : current.cta}
              onPress={confirm}
              disabled={busy || remarks.trim().length < MIN_REMARKS}
              style={[s.submit, (busy || remarks.trim().length < MIN_REMARKS) && s.submitOff]}
            />
          </View>
        ) : null}

        <SuccessNote>{success}</SuccessNote>
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 8, gap: 18 },
  title: { fontFamily: font.display, fontSize: 28, lineHeight: 33, color: colors.text },
  trackingId: { fontFamily: font.display, fontSize: 15, color: colors.dim, marginTop: 6 },
  tileRow: { flexDirection: 'row', gap: 10 },
  imageRow: { gap: 10, paddingRight: 20 },
  image: { width: 132, height: 132, borderRadius: 20, backgroundColor: colors.surfaceInput },
  proofNote: { fontFamily: font.body, fontSize: 15, lineHeight: 23, color: colors.muted, marginTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  cell: { width: '48%', flexGrow: 1 },
  actionBtn: { padding: 16, borderRadius: 20, borderWidth: 1.5, gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  actionLabel: { fontFamily: font.display, fontSize: 15, color: colors.text },
  terminal: { padding: 18, marginTop: 10 },
  terminalText: { fontFamily: font.body, fontSize: 15, lineHeight: 23, color: colors.muted },
  remarksInput: {
    minHeight: 120,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    color: colors.text,
    fontFamily: font.bodyBold,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  submit: { marginTop: 14 },
  submitOff: { opacity: 0.5 },
});

export default TriageDetailScreen;
