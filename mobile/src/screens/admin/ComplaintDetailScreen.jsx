import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { AlertCircle, CheckCircle2 } from 'lucide-react-native';
import StatusBadge from '../../components/StatusBadge.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import SelectSheet from '../../components/SelectSheet.jsx';
import { Panel, Input, Button, Field, Alert, Loading } from '../../components/ui.jsx';
import api, { getUploadsBaseUrl } from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';
import { color, space, radius, font, text } from '../../theme.js';

// Backend rule (adminController): Pending -> In Progress -> Resolved | Rejected.
// Going straight from Pending to Resolved is rejected server-side, so the picker
// only offers the transitions that will actually be accepted.
const NEXT_STATUSES = {
  Pending: ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Rejected'],
  Resolved: [],
  Rejected: [],
};

const ComplaintDetailScreen = ({ route }) => {
  const { id } = route.params || {};

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [success, setSuccess] = useState('');

  // Mirrors the web page: there's no GET-one admin endpoint, so the list is
  // fetched and the record picked out of it.
  const fetchComplaintDetails = useCallback(async () => {
    try {
      const response = await api.get('/admin/complaints', { params: { limit: 200 } });
      const found = (response.data.complaints || []).find((c) => c._id === id);
      if (found) {
        setComplaint(found);
        setStatus('');
        setError('');
      } else {
        setError('Complaint details not found.');
      }
    } catch {
      setError('Failed to fetch details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaintDetails();
  }, [fetchComplaintDetails]);

  const handleUpdateStatus = async () => {
    setUpdateError('');
    setSuccess('');
    if (remarks.trim().length < 10) {
      setUpdateError('Remarks must be at least 10 characters.');
      return;
    }
    setUpdating(true);
    try {
      await api.patch(`/admin/complaints/${id}/status`, { status, remarks });
      setRemarks('');
      setSuccess(
        status === 'Resolved'
          ? 'Status updated. A PDF receipt has been generated and emailed to the citizen.'
          : 'Status updated successfully.'
      );
      await fetchComplaintDetails();
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loading label="Loading complaint…" />;

  if (error) {
    return (
      <View style={s.errorWrap}>
        <Alert tone="danger" icon={<AlertCircle size={15} strokeWidth={ICON_STROKE} />}>
          {error}
        </Alert>
      </View>
    );
  }

  const options = NEXT_STATUSES[complaint.status] || [];
  const isTerminal = options.length === 0;

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Panel style={s.gap3}>
          <View style={s.head}>
            <View style={s.flex1}>
              <Text style={s.title}>{complaint.title}</Text>
              <Text style={s.mono}>{complaint.trackingId}</Text>
            </View>
            <StatusBadge status={complaint.status} />
          </View>

          <View style={s.metaGrid}>
            {[
              ['Category', complaint.category],
              ['Location', complaint.location],
              ['Urgency', complaint.urgencyLevel],
              ['Filed', new Date(complaint.createdAt).toLocaleDateString()],
            ].map(([k, v]) => (
              <View key={k} style={s.metaRow}>
                <Text style={s.metaKey}>{k}</Text>
                <Text style={s.metaVal}>{v || '—'}</Text>
              </View>
            ))}
          </View>
        </Panel>

        {/* Admin-only: the public registry redacts these. */}
        <Panel style={s.gap2}>
          <Text style={s.sectionLabel}>CITIZEN CONTACT</Text>
          {[
            ['Name', complaint.citizenId?.name],
            ['Email', complaint.citizenId?.email],
            ['Phone', complaint.citizenId?.phone],
          ].map(([k, v]) => (
            <View key={k} style={s.metaRow}>
              <Text style={s.metaKey}>{k}</Text>
              <Text style={s.metaVal}>{v || '—'}</Text>
            </View>
          ))}
        </Panel>

        <Panel style={s.gap2}>
          <Text style={s.sectionLabel}>DESCRIPTION</Text>
          <Text style={s.body}>{complaint.description}</Text>
        </Panel>

        {complaint.images?.length > 0 ? (
          <Panel style={s.gap2}>
            <Text style={s.sectionLabel}>ATTACHED PROOFS</Text>
            <View style={s.thumbRow}>
              {complaint.images.map((img, i) => (
                <Image
                  key={i}
                  source={{ uri: `${getUploadsBaseUrl()}${img}` }}
                  style={s.thumb}
                />
              ))}
            </View>
          </Panel>
        ) : null}

        <Panel style={s.gap3}>
          <Text style={s.sectionLabel}>STATUS LOG</Text>
          <StatusTimeline statusHistory={complaint.statusHistory} />
        </Panel>

        <Panel style={s.gap3}>
          <Text style={s.sectionLabel}>UPDATE STATUS</Text>

          {success ? (
            <Alert tone="success" icon={<CheckCircle2 size={15} strokeWidth={ICON_STROKE} />}>
              {success}
            </Alert>
          ) : null}
          {updateError ? (
            <Alert tone="danger" icon={<AlertCircle size={15} strokeWidth={ICON_STROKE} />}>
              {updateError}
            </Alert>
          ) : null}

          {isTerminal ? (
            <Text style={s.terminalNote}>
              This complaint is {complaint.status.toLowerCase()} — a terminal state. No further
              transitions are allowed.
            </Text>
          ) : (
            <>
              <SelectSheet
                label="New Status"
                value={status}
                onChange={setStatus}
                options={options.map((o) => ({ label: o, value: o }))}
                placeholder="Select a status"
              />

              <Field
                label="Official Remarks"
                error={remarks && remarks.trim().length < 10 ? 'At least 10 characters.' : ''}
              >
                <Input
                  value={remarks}
                  onChangeText={setRemarks}
                  placeholder="Input review remarks (min 10 characters)"
                  multiline
                />
              </Field>

              <Button
                title={status === 'Resolved' ? 'Resolve & Send Receipt' : 'Update Status'}
                onPress={handleUpdateStatus}
                loading={updating}
                disabled={!status || remarks.trim().length < 10}
              />
            </>
          )}
        </Panel>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: color.bg },
  content: { padding: space[4], paddingBottom: space[8], gap: space[4] },
  errorWrap: { flex: 1, backgroundColor: color.bg, padding: space[4] },
  gap2: { gap: space[2] },
  gap3: { gap: space[3] },
  flex1: { flex: 1 },

  head: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3] },
  title: { fontFamily: font.sansSemibold, fontSize: text.h3, color: color.textPrimary },
  mono: { fontFamily: font.mono, fontSize: text.monoSm, color: color.accent, marginTop: 2 },

  metaGrid: { gap: space[2], borderTopWidth: 1, borderTopColor: color.border, paddingTop: space[3] },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space[4] },
  metaKey: { fontFamily: font.sans, fontSize: text.small, color: color.textMuted },
  metaVal: {
    flex: 1,
    textAlign: 'right',
    fontFamily: font.sansMedium,
    fontSize: text.small,
    color: color.textPrimary,
  },

  sectionLabel: { fontFamily: font.mono, fontSize: 11, color: color.textMuted, letterSpacing: 0.5 },
  body: { fontFamily: font.sans, fontSize: text.small, color: color.textSecondary, lineHeight: 21 },

  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceRaised,
  },

  terminalNote: {
    fontFamily: font.sans,
    fontSize: text.small,
    color: color.textMuted,
    lineHeight: 20,
  },
});

export default ComplaintDetailScreen;
