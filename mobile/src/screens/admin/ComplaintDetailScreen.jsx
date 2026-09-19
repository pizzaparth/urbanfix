import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, Card, Tappable, PrimaryButton, ErrorNote } from '../../components/uikit.jsx';
import FormattedDescription from '../../components/FormattedDescription.jsx';
import Icon from '../../components/Icon.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import { SkeletonBlock } from '../../components/Skeleton.jsx';
import api, { getUploadsBaseUrl } from '../../services/api.js';
import { colors, uf as font, statusColors } from '../../theme.js';

const STATUS_LIST = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

// The reference let an admin set any status from any status. The API doesn't:
// these are the only legal transitions, and Resolved/Rejected are terminal.
const NEXT_STATUSES = {
  Pending: ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Rejected'],
  Resolved: [],
  Rejected: [],
};

const MIN_REMARKS = 10;

const ComplaintDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { id } = route.params || {};

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [success, setSuccess] = useState('');

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
    if (remarks.trim().length < MIN_REMARKS) {
      setUpdateError(`Remarks must be at least ${MIN_REMARKS} characters.`);
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

  const header = (
    <View style={s.header}>
      <Tappable onPress={() => navigation.goBack()} scaleTo={0.9} style={s.backBtn}>
        <Icon name="chevronLeft" size={18} color={colors.text} strokeWidth={2.4} />
      </Tappable>
      <Text style={s.headerTitle}>Complaint</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={s.bootWrap}>
        {header}
        <View style={s.bootBody}>
          <SkeletonBlock height={28} width="80%" />
          <SkeletonBlock height={72} />
          <SkeletonBlock height={120} />
        </View>
      </View>
    );
  }

  if (error || !complaint) {
    return (
      <Screen contentStyle={{ paddingTop: insets.top }}>
        {header}
        <View style={s.body}>
          <ErrorNote>{error || 'Complaint details not found.'}</ErrorNote>
        </View>
      </Screen>
    );
  }

  const options = NEXT_STATUSES[complaint.status] || [];
  const isTerminal = options.length === 0;
  const uploadsBase = getUploadsBaseUrl();

  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      {header}

      <View style={s.body}>
        <View>
          <Text style={s.title}>{complaint.title}</Text>
          <Text style={s.trackingId}>{complaint.trackingId}</Text>
        </View>

        <View style={s.tileRow}>
          <InfoTile label="Category" value={complaint.category} flex />
          <InfoTile
            label="Filed"
            value={new Date(complaint.createdAt).toLocaleDateString()}
            width={112}
          />
        </View>

        <InfoTile label="Location" value={complaint.location} />

        <View>
          <Text style={s.label}>DESCRIPTION</Text>
          <FormattedDescription description={complaint.description} />
        </View>

        {complaint.images?.length > 0 ? (
          <View>
            <Text style={s.label}>PHOTOGRAPHS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.imageRow}>
              {complaint.images.map((img, i) => (
                <Image
                  key={i}
                  source={{ uri: `${uploadsBase}${img}` }}
                  style={s.image}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View>
          <Text style={s.label}>STATUS LOG HISTORY</Text>
          <StatusTimeline statusHistory={complaint.statusHistory} />
        </View>

        <View>
          <Text style={s.label}>SET STATUS</Text>

          {isTerminal ? (
            <Card style={s.terminalCard}>
              <Text style={s.terminalText}>
                This complaint is {complaint.status.toLowerCase()} — a terminal state. No further
                transitions are allowed.
              </Text>
            </Card>
          ) : (
            <View style={s.statusGrid}>
              {STATUS_LIST.map((st, i) => {
                const allowed = options.includes(st);
                const active = status === st;
                return (
                  <View
                    key={st}
                    style={s.statusCell}
                  >
                    <Tappable
                      onPress={() => allowed && setStatus(st)}
                      disabled={!allowed}
                      scaleTo={0.96}
                      style={[
                        s.statusBtn,
                        {
                          borderColor: active ? statusColors[st] : colors.borderStrong,
                          backgroundColor: active ? colors.surfaceInput : 'transparent',
                          // Illegal transitions stay visible but obviously inert,
                          // so the grid still reads as the full set of states.
                          opacity: allowed ? 1 : 0.35,
                        },
                      ]}
                    >
                      <View style={[s.dot, { backgroundColor: statusColors[st] }]} />
                      <Text style={s.statusLabel}>{st}</Text>
                    </Tappable>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {!isTerminal && status ? (
          <View>
            <Text style={s.label}>REMARKS</Text>
            <ErrorNote>{updateError}</ErrorNote>
            <TextInput
              value={remarks}
              onChangeText={setRemarks}
              placeholder={`Input review remarks (min ${MIN_REMARKS} characters)`}
              placeholderTextColor={colors.placeholder}
              multiline
              style={s.remarksInput}
            />
            <PrimaryButton
              label={
                updating
                  ? 'Updating…'
                  : status === 'Resolved'
                    ? 'Resolve & send receipt'
                    : 'Update status'
              }
              onPress={handleUpdateStatus}
              disabled={updating || remarks.trim().length < MIN_REMARKS} style={[s.submit, (updating || remarks.trim().length < MIN_REMARKS) && s.submitOff]}
            />
          </View>
        ) : null}

        {success ? <Text style={s.success}>{success}</Text> : null}
      </View>
    </Screen>
  );
};

function InfoTile({ label, value, flex, width }) {
  return (
    <View style={[s.tile, flex && s.flex1, width ? { width } : null]}>
      <Text style={s.label}>{label.toUpperCase()}</Text>
      <Text style={s.tileValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  bootWrap: { flex: 1, backgroundColor: colors.bg },
  bootBody: { padding: 20, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: font.display, fontSize: 24, color: colors.text },
  body: { paddingHorizontal: 20, paddingTop: 8, gap: 18 },
  title: { fontFamily: font.display, fontSize: 28, lineHeight: 33, color: colors.text },
  trackingId: { fontFamily: font.display, fontSize: 15, color: colors.dim, marginTop: 6 },
  tileRow: { flexDirection: 'row', gap: 10 },
  tile: {
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
  },
  tileValue: { fontFamily: font.bodyBold, fontSize: 15, color: colors.text },
  label: {
    fontFamily: font.bodyBold,
    fontSize: 12,
    letterSpacing: 1.1,
    color: colors.dim,
    marginBottom: 7,
  },
  description: { fontFamily: font.body, fontSize: 16, lineHeight: 25, color: colors.body },
  imageRow: { gap: 10, paddingRight: 20 },
  image: { width: 132, height: 132, borderRadius: 20, backgroundColor: colors.surfaceInput },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  statusCell: { width: '48%', flexGrow: 1 },
  statusBtn: { padding: 16, borderRadius: 20, borderWidth: 1.5, gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontFamily: font.display, fontSize: 15, color: colors.text },
  terminalCard: { padding: 18 },
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
  success: {
    fontFamily: font.bodyBold,
    fontSize: 15,
    lineHeight: 22,
    color: '#4ADE9B',
    textAlign: 'center',
  },
});

export default ComplaintDetailScreen;
