import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import StatusBadge from '../../components/StatusBadge.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import api, { getUploadsBaseUrl } from '../../services/api.js';
import { color, font } from '../../theme.js';

const STATUS_COLORS = {
  'Filed': '#4ADE9B',
  'Pending': '#FFB86B',
  'In Progress': '#C08BFF',
  'Resolved': '#FF5FA2',
  'Rejected': '#A094A0'
};

const NEXT_STATUSES = {
  Pending: ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Rejected'],
  Resolved: [],
  Rejected: [],
};

const STATUS_LIST = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

const ComplaintDetailScreen = ({ route, navigation }) => {
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

  if (loading) {
    return (
      <View style={s.flex}>
        <Text style={{color: '#FFF', padding: 20}}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.flex}>
        <View style={s.errorAlert}>
          <Text style={s.errorAlertText}>{error}</Text>
        </View>
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
        <View style={s.headerRow}>
          <Pressable style={s.topBackBtn} onPress={() => navigation.goBack()}>
            <Text style={{color: '#FFF', fontSize: 18, fontFamily: font.sansBold}}>{'<'}</Text>
          </Pressable>
          <Text style={s.h1}>Complaint</Text>
        </View>

        <View style={s.bodySection}>
          <View style={s.titleWrap}>
            <Text style={s.title}>{complaint.title}</Text>
            <Text style={s.trackingId}>{complaint.trackingId}</Text>
          </View>

          <View style={s.metaGridTop}>
            <View style={[s.metaCard, {flex: 1}]}>
              <Text style={s.metaLabel}>CATEGORY</Text>
              <Text style={s.metaValue}>{complaint.category}</Text>
            </View>
            <View style={[s.metaCard, {width: 112, flex: 'none'}]}>
              <Text style={s.metaLabel}>FILED</Text>
              <Text style={s.metaValue}>{new Date(complaint.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>

          <View style={s.metaCard}>
            <Text style={s.metaLabel}>LOCATION</Text>
            <Text style={s.metaValue}>{complaint.location}</Text>
          </View>
          
          <View style={s.metaCard}>
            <Text style={s.metaLabel}>CITIZEN</Text>
            <Text style={s.metaValue}>{complaint.citizenId?.name || '—'} ({complaint.citizenId?.email || '—'})</Text>
          </View>

          <View style={s.descWrap}>
            <Text style={s.metaLabel}>DESCRIPTION</Text>
            <Text style={s.descText}>{complaint.description}</Text>
          </View>
          
          {complaint.images?.length > 0 && (
            <View style={s.descWrap}>
              <Text style={s.metaLabel}>ATTACHED PROOFS</Text>
              <View style={s.thumbRow}>
                {complaint.images.map((img, i) => (
                  <Image
                    key={i}
                    source={{ uri: `${getUploadsBaseUrl()}${img}` }}
                    style={s.thumb}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={s.descWrap}>
            <Text style={s.metaLabel}>STATUS LOG</Text>
            <StatusTimeline statusHistory={complaint.statusHistory} />
          </View>

          <View style={s.descWrap}>
            <Text style={s.metaLabel}>SET STATUS</Text>
            
            {success ? (
              <View style={[s.errorAlert, {backgroundColor: 'rgba(74, 222, 155, 0.1)', borderColor: '#4ADE9B', marginBottom: 12, marginHorizontal: 0}]}>
                <Text style={[s.errorAlertText, {color: '#4ADE9B'}]}>{success}</Text>
              </View>
            ) : null}
            {updateError ? (
              <View style={[s.errorAlert, {marginBottom: 12, marginHorizontal: 0}]}>
                <Text style={s.errorAlertText}>{updateError}</Text>
              </View>
            ) : null}

            {isTerminal ? (
              <Text style={s.terminalNote}>
                This complaint is {complaint.status.toLowerCase()} — a terminal state. No further transitions are allowed.
              </Text>
            ) : (
              <View style={s.statusGrid}>
                {STATUS_LIST.map(st => {
                  const isEnabled = options.includes(st);
                  const isSelected = status === st;
                  const stColor = STATUS_COLORS[st] || '#FFFFFF';
                  
                  return (
                    <Pressable
                      key={st}
                      onPress={() => isEnabled && setStatus(st)}
                      style={[
                        s.statusBtn,
                        isSelected && { borderColor: stColor, backgroundColor: `${stColor}1A` },
                        !isEnabled && { opacity: 0.4 }
                      ]}
                      disabled={!isEnabled}
                    >
                      <View style={[s.statusDot, {backgroundColor: stColor}]} />
                      <Text style={s.statusBtnLabel}>{st}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
          
          {!isTerminal && status ? (
            <View style={s.descWrap}>
              <Text style={s.metaLabel}>REMARKS (Required)</Text>
              <TextInput
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Input review remarks (min 10 characters)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                style={s.remarksInput}
              />
              <Pressable 
                style={[s.primaryBtn, (updating || remarks.trim().length < 10) && {opacity: 0.5}]} 
                onPress={handleUpdateStatus} 
                disabled={updating || remarks.trim().length < 10}
              >
                <Text style={s.primaryBtnText}>{updating ? '...' : (status === 'Resolved' ? 'Resolve & Send Receipt' : 'Update Status')}</Text>
              </Pressable>
            </View>
          ) : null}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: color.bg },
  content: { paddingBottom: 104 },
  
  headerRow: { 
    paddingHorizontal: 20, 
    paddingTop: 22, 
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  topBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#2C222B',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
  },
  h1: {
    fontFamily: font.sansBold,
    fontSize: 24,
    color: color.white,
  },
  
  bodySection: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 18,
  },
  titleWrap: { },
  title: {
    fontFamily: font.sansBold,
    fontSize: 24,
    color: color.white,
    lineHeight: 28,
  },
  trackingId: {
    fontSize: 13,
    color: '#8E8290',
    marginTop: 6,
    fontFamily: font.sans,
  },
  
  metaGridTop: {
    flexDirection: 'row',
    gap: 10,
  },
  metaCard: {
    padding: 16,
    backgroundColor: '#120E13',
    borderWidth: 1,
    borderColor: '#231B22',
    borderRadius: 20,
  },
  metaLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#8E8290',
    fontFamily: font.sansBold,
    marginBottom: 6,
  },
  metaValue: {
    fontSize: 14,
    color: color.white,
    fontFamily: font.sansBold,
  },
  
  descWrap: { },
  descText: {
    fontSize: 15,
    color: '#D2C6CE',
    lineHeight: 23,
    fontFamily: font.sans,
  },
  
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusBtn: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#120E13',
    borderWidth: 1.5,
    borderColor: '#231B22',
    alignItems: 'flex-start',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusBtnLabel: {
    fontSize: 14,
    fontFamily: font.sansBold,
    color: color.white,
  },
  
  remarksInput: {
    width: '100%',
    minHeight: 100,
    padding: 18,
    paddingTop: 18,
    backgroundColor: '#120E13',
    borderWidth: 1.5,
    borderColor: '#2C222B',
    borderRadius: 18,
    color: color.white,
    fontSize: 16,
    fontFamily: font.sans,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    width: '100%',
    height: 58,
    borderRadius: 100,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  primaryBtnText: {
    fontFamily: font.sansBold,
    fontSize: 16,
    color: '#18062B',
  },
  
  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#120E13',
  },

  errorAlert: {
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 90, 122, 0.1)',
    borderWidth: 1,
    borderColor: '#FF5A7A',
    borderRadius: 12,
  },
  errorAlertText: {
    color: '#FF5A7A',
    fontFamily: font.sansBold,
    fontSize: 13,
  },
  
  terminalNote: {
    fontFamily: font.sans,
    fontSize: 14,
    color: '#8E8290',
    lineHeight: 20,
  },
});

export default ComplaintDetailScreen;
