import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, PageTitle, Card, Tappable, GhostButton } from '../../components/uikit.jsx';
import FormattedDescription from '../../components/FormattedDescription.jsx';
import Icon from '../../components/Icon.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import { downloadReceipt } from '../../utils/downloadReceipt.js';
import api from '../../services/api.js';
import { colors, uf as font, ufRadius as radius, statusColors } from '../../theme.js';

const TrackScreen = () => {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const idParam = route.params?.id || '';

  const [trackingId, setTrackingId] = useState(idParam);
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [receiptMsg, setReceiptMsg] = useState('');

  const fetchComplaint = useCallback(async (id) => {
    setLoading(true);
    setError('');
    setComplaint(null);
    try {
      const response = await api.get(`/complaints/track/${id}`);
      setComplaint(response.data.complaint);
    } catch (err) {
      setError('No complaint found for that ID.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Deep links (dsn://track?id=…) and the registry's "Track →" both arrive as a
  // route param.
  useEffect(() => {
    if (idParam) {
      setTrackingId(idParam);
      fetchComplaint(idParam);
    }
  }, [idParam, fetchComplaint]);

  const handleSearch = () => {
    const id = trackingId.trim();
    if (id) fetchComplaint(id);
  };

  const handleDownload = async () => {
    if (!complaint) return;
    setReceiptMsg('Downloading…');
    await downloadReceipt(complaint.trackingId);
    setReceiptMsg('Receipt downloaded.');
    setTimeout(() => setReceiptMsg(''), 2500);
  };

  const statusTone = complaint ? statusColors[complaint.status] || colors.text : colors.text;

  return (
    <Screen contentStyle={{ paddingTop: insets.top, paddingBottom: 130 }}>
      <PageTitle sub="Enter your tracking ID.">Track</PageTitle>

      <View style={s.searchBlock}>
        <TextInput
          value={trackingId}
          onChangeText={setTrackingId}
          placeholder="COMP-XXXXX-X"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          style={s.bigInput}
        />
        <Tappable onPress={handleSearch} disabled={loading || !trackingId.trim()} style={s.searchBtn}>
          <Icon name="search" size={22} color={colors.accentInk} strokeWidth={2.6} />
          <Text style={s.searchBtnText}>{loading ? 'Searching…' : 'Find my complaint'}</Text>
        </Tappable>
      </View>

      <View style={s.resultWrap}>
        {complaint ? (
          <View>
            <Card>
              <View style={s.resultHead}>
                <View style={s.flex1}>
                  <Text style={s.resultTitle}>{complaint.title}</Text>
                  <Text style={s.resultId}>{complaint.trackingId}</Text>
                </View>
                <View style={s.statusRow}>
                  <View style={[s.dot, { backgroundColor: statusTone }]} />
                  <Text style={[s.statusText, { color: statusTone }]}>{complaint.status}</Text>
                </View>
              </View>

              
              <FormattedDescription description={complaint.description} />

              <View style={s.metaRow}>
                <View style={s.flex1}>
                  <Label>Category</Label>
                  <Text style={s.metaValue}>{complaint.category}</Text>
                </View>
                <View>
                  <Label>Filed</Label>
                  <Text style={s.metaValue}>
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* The reference app had no audit trail to show; this one does, and
                  it's the whole point of a tracker, so it stays. */}
              <View style={s.timelineBlock}>
                <Label>Status log history</Label>
                <StatusTimeline statusHistory={complaint.statusHistory} />
              </View>

              {complaint.status === 'Resolved' ? (
                <GhostButton
                  label="Download receipt"
                  onPress={handleDownload}
                  style={s.receiptBtn}
                />
              ) : null}
              {receiptMsg ? <Text style={s.receipt}>{receiptMsg}</Text> : null}
            </Card>
          </View>
        ) : null}

        {error ? <Text style={s.empty}>{error}</Text> : null}
      </View>
    </Screen>
  );
};

function Label({ children }) {
  return <Text style={s.label}>{String(children).toUpperCase()}</Text>;
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  searchBlock: { paddingHorizontal: 20, paddingTop: 10, gap: 14 },
  bigInput: {
    height: 104,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: colors.text,
    fontFamily: font.display,
    // The reference placeholder was UF-XXXXX-X; real IDs are COMP-20260918-XXXXX,
    // which overruns at 30pt, so the field is a touch smaller here.
    fontSize: 24,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  searchBtn: {
    height: 66,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  searchBtnText: { fontFamily: font.display, fontSize: 18, color: colors.accentInk },
  resultWrap: { paddingHorizontal: 20, paddingTop: 20 },
  resultHead: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  resultTitle: { fontFamily: font.display, fontSize: 22, lineHeight: 26, color: colors.text },
  resultId: { fontFamily: font.display, fontSize: 14, color: colors.dim, marginTop: 5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontFamily: font.bodyBold, fontSize: 15 },
  label: {
    fontFamily: font.bodyBold,
    fontSize: 12,
    letterSpacing: 1.1,
    color: colors.dim,
    marginBottom: 6,
  },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 24, color: colors.body, marginBottom: 18 },
  metaRow: { flexDirection: 'row', gap: 20 },
  metaValue: { fontFamily: font.bodyBold, fontSize: 15, color: colors.text },
  timelineBlock: { marginTop: 22 },
  receiptBtn: { marginTop: 18 },
  receipt: {
    fontFamily: font.bodyBold,
    fontSize: 15,
    color: '#4ADE9B',
    marginTop: 12,
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 40,
    fontFamily: font.body,
    fontSize: 16,
    color: colors.muted,
  },
});

export default TrackScreen;
