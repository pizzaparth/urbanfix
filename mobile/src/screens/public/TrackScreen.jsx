import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Pressable } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Search, AlertTriangle, FileDown } from 'lucide-react-native';
import StatusBadge from '../../components/StatusBadge.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import { Input, Button, Panel } from '../../components/ui.jsx';
import { downloadReceipt } from '../../utils/downloadReceipt.js';
import api, { getUploadsBaseUrl } from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';
import { color, space, radius, font, text } from '../../theme.js';

// Replaces useSearchParams('id') — the ID now arrives as a navigation param,
// either from a ComplaintCard tap or the dsn://track?id=... deep link.
const TrackScreen = () => {
  const route = useRoute();
  const idParam = route.params?.id || '';

  const [trackingId, setTrackingId] = useState(idParam);
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [zoomed, setZoomed] = useState(null);

  const fetchComplaint = useCallback(async (id) => {
    setLoading(true);
    setError('');
    setComplaint(null);
    try {
      const response = await api.get(`/complaints/track/${id}`);
      setComplaint(response.data.complaint);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to locate complaint records.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <Panel style={s.searchPanel}>
        <View style={s.rowCenter}>
          <Search size={18} strokeWidth={ICON_STROKE} color={color.accent} />
          <Text style={s.panelTitle}>Track Complaint Progress</Text>
        </View>
        <Input
          placeholder="Enter Tracking ID (e.g. COMP-XXXXX-X)"
          value={trackingId}
          onChangeText={setTrackingId}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Button title="Search" onPress={handleSearch} loading={loading} disabled={!trackingId.trim()} />
      </Panel>

      {error ? (
        <View style={s.alert}>
          <AlertTriangle size={16} strokeWidth={ICON_STROKE} color={color.statusRejected} />
          <Text style={s.alertText}>{error}</Text>
        </View>
      ) : null}

      {complaint ? (
        <Panel style={s.resultPanel}>
          <View style={s.resultHead}>
            <View style={s.flex1}>
              <Text style={s.title}>{complaint.title}</Text>
              <Text style={s.mono}>ID: {complaint.trackingId}</Text>
            </View>
            <StatusBadge status={complaint.status} />
          </View>

          <View style={s.section}>
            <Text style={s.sectionLabel}>ISSUE DESCRIPTION</Text>
            <Text style={s.body}>{complaint.description}</Text>
          </View>

          {complaint.images?.length > 0 ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>UPLOADED PROOFS</Text>
              <View style={s.thumbRow}>
                {complaint.images.map((img, idx) => {
                  const uri = `${getUploadsBaseUrl()}${img}`;
                  return (
                    <Pressable key={idx} onPress={() => setZoomed(zoomed === uri ? null : uri)}>
                      <Image source={{ uri }} style={zoomed === uri ? s.thumbLarge : s.thumb} />
                    </Pressable>
                  );
                })}
              </View>
              <Text style={s.hint}>Tap an image to enlarge</Text>
            </View>
          ) : null}

          <View style={s.section}>
            <Text style={s.sectionLabel}>STATUS LOG HISTORY</Text>
            <StatusTimeline statusHistory={complaint.statusHistory} />
          </View>

          {complaint.status === 'Resolved' ? (
            <Button
              title="Download PDF Receipt"
              variant="secondary"
              onPress={() => downloadReceipt(complaint.trackingId)}
              icon={<FileDown size={14} strokeWidth={ICON_STROKE} />}
            />
          ) : null}
        </Panel>
      ) : null}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space[4], paddingBottom: space[8], gap: space[4] },
  searchPanel: { gap: space[3] },
  resultPanel: { gap: space[4] },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  panelTitle: { fontFamily: font.sansSemibold, fontSize: 17, color: color.textPrimary },
  flex1: { flex: 1 },

  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: 'rgba(239, 90, 90, 0.1)',
    borderWidth: 1,
    borderColor: color.statusRejected,
    borderRadius: radius.md,
    padding: space[3],
  },
  alertText: { flex: 1, fontFamily: font.sans, fontSize: text.small, color: color.textPrimary },

  resultHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[3],
    borderBottomWidth: 1,
    borderBottomColor: color.border,
    paddingBottom: space[3],
  },
  title: { fontFamily: font.sansSemibold, fontSize: text.h3, color: color.textPrimary, marginBottom: space[1] },
  mono: { fontFamily: font.mono, fontSize: text.monoSm, color: color.textMuted },

  section: { gap: space[2] },
  sectionLabel: { fontFamily: font.mono, fontSize: 11, color: color.textMuted, letterSpacing: 0.5 },
  body: { fontFamily: font.sans, fontSize: text.small, color: color.textSecondary, lineHeight: 21 },

  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  thumb: {
    width: 110,
    height: 110,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceRaised,
  },
  thumbLarge: {
    width: '100%',
    minWidth: 280,
    height: 260,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.accent,
    backgroundColor: color.surfaceRaised,
  },
  hint: { fontFamily: font.sans, fontSize: 11, color: color.textMuted },
});

export default TrackScreen;
