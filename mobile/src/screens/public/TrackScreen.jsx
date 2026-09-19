import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Search } from 'lucide-react-native';
import StatusBadge from '../../components/StatusBadge.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import { downloadReceipt } from '../../utils/downloadReceipt.js';
import api from '../../services/api.js';
import { color, space, radius, font, text, statusColor } from '../../theme.js';

const TrackScreen = () => {
  const route = useRoute();
  const idParam = route.params?.id || '';

  const [trackingId, setTrackingId] = useState(idParam);
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [receiptMsg, setReceiptMsg] = useState('');

  const fetchComplaint = useCallback(async (id) => {
    setLoading(true);
    setError('');
    setComplaint(null);
    setSearched(true);
    try {
      const response = await api.get(`/complaints/track/${id}`);
      setComplaint(response.data.complaint);
    } catch (err) {
      setError('No complaint found for that ID.');
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

  const handleDownload = async () => {
    if (!complaint) return;
    setReceiptMsg('Downloading...');
    await downloadReceipt(complaint.trackingId);
    setReceiptMsg('Downloaded!');
    setTimeout(() => setReceiptMsg(''), 3000);
  };

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.header}>
        <Text style={s.h1}>Track</Text>
        <Text style={s.lede}>Enter your tracking ID.</Text>
      </View>

      <View style={s.inputSection}>
        <TextInput
          placeholder="UF-XXXXX-X"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={trackingId}
          onChangeText={setTrackingId}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          style={s.giantInput}
        />
        <Pressable
          onPress={handleSearch}
          disabled={loading || !trackingId.trim()}
          style={({ pressed }) => [s.searchBtn, pressed && { transform: [{ scale: 0.97 }] }]}
        >
          <Search size={22} strokeWidth={2.6} color="#1C0512" />
          <Text style={s.searchBtnText}>Find my complaint</Text>
        </Pressable>
      </View>

      <View style={s.resultSection}>
        {error ? (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>{error}</Text>
          </View>
        ) : null}

        {complaint ? (
          <View style={s.resultCard}>
            <View style={s.rowSpace}>
              <View style={s.flex1}>
                <Text style={s.cardTitle}>{complaint.title}</Text>
                <Text style={s.cardId}>{complaint.trackingId}</Text>
              </View>
              <View style={s.statusRow}>
                <View style={[s.statusDot, { backgroundColor: statusColor[complaint.status] || color.accent }]} />
                <Text style={[s.statusText, { color: statusColor[complaint.status] || color.accent }]}>{complaint.status}</Text>
              </View>
            </View>

            <View>
              <Text style={s.label}>DESCRIPTION</Text>
              <Text style={s.descText}>{complaint.description}</Text>
            </View>

            <View style={s.row}>
              <View style={s.halfCol}>
                <Text style={s.label}>CATEGORY</Text>
                <Text style={s.valText}>{complaint.category}</Text>
              </View>
              <View style={s.halfCol}>
                <Text style={s.label}>FILED</Text>
                <Text style={s.valText}>{new Date(complaint.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
            
            <View>
              <Text style={[s.label, {marginTop: 10}]}>STATUS LOG HISTORY</Text>
              <StatusTimeline statusHistory={complaint.statusHistory} />
            </View>

            {complaint.status === 'Resolved' && (
              <Pressable onPress={handleDownload} style={s.receiptBtn}>
                <Text style={s.receiptBtnText}>Download receipt</Text>
              </Pressable>
            )}
            {!!receiptMsg && (
              <Text style={s.receiptMsgText}>{receiptMsg}</Text>
            )}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingBottom: 104 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  h1: {
    fontFamily: font.sansBold,
    fontSize: 38,
    lineHeight: 40,
    color: color.white,
  },
  lede: {
    fontFamily: font.sans,
    fontSize: 17,
    color: color.textSecondary,
    marginTop: 8,
  },

  inputSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 14,
  },
  giantInput: {
    width: '100%',
    height: 104,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 28,
    color: color.white,
    fontSize: 30,
    fontFamily: font.sansBold,
    letterSpacing: 1.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  searchBtn: {
    width: '100%',
    height: 66,
    borderRadius: 100,
    backgroundColor: color.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  searchBtnText: {
    fontFamily: font.sansBold,
    fontSize: 18,
    color: '#1C0512',
  },

  resultSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyState: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: color.textSecondary,
    fontFamily: font.sans,
  },

  resultCard: {
    padding: 18,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderStrong,
    borderRadius: 18,
    gap: 14,
  },
  rowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  flex1: { flex: 1 },
  cardTitle: {
    fontFamily: font.sansSemibold,
    fontSize: 17,
    color: color.white,
  },
  cardId: {
    fontFamily: font.sans,
    fontSize: 11,
    color: color.textMuted,
    marginTop: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: font.sansBold,
  },

  label: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: color.textMuted,
    textTransform: 'uppercase',
    marginBottom: 5,
    fontFamily: font.sans,
  },
  descText: {
    fontSize: 13,
    color: '#D2C6CE',
    lineHeight: 19.5,
    fontFamily: font.sans,
  },
  row: {
    flexDirection: 'row',
    gap: 20,
  },
  halfCol: {
    flex: 1,
  },
  valText: {
    fontSize: 12,
    color: color.white,
    fontFamily: font.sans,
  },

  receiptBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#352A34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptBtnText: {
    fontSize: 13,
    fontFamily: font.sansBold,
    color: color.white,
  },
  receiptMsgText: {
    fontSize: 12,
    color: color.success,
    textAlign: 'center',
    fontFamily: font.sans,
  }
});

export default TrackScreen;
