import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Card, FilterPill, ErrorNote, EmptyLine } from './uikit.jsx';
import { useAutoRefresh } from '../hooks/useAutoRefresh.js';
import api from '../services/api.js';
import { colors, uf as font, statusColors } from '../theme.js';

const fmtDay = (d) => new Date(d).toLocaleDateString();

// Pending leave for a decider to approve or reject. `base` is '/supervisor'
// (their own field staff) or '/admin' (everyone's — chiefly supervisors').
export default function LeaveRequests({ base, emptyText = 'No leave requests waiting.' }) {
  const [leave, setLeave] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get(`${base}/leave`);
      setLeave(res.data.leave || []);
    } catch (err) {
      console.error('Error fetching leave requests:', err?.message);
    }
  }, [base]);

  useAutoRefresh(load);

  const decide = async (id, decision) => {
    setError('');
    setBusyId(id);
    try {
      await api.patch(`${base}/leave/${id}`, { decision });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not record that decision.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <View>
      <ErrorNote>{error}</ErrorNote>
      {leave.length === 0 ? <EmptyLine>{emptyText}</EmptyLine> : null}
      <View style={s.list}>
        {leave.map((l) => (
          <Card key={l._id} style={s.card}>
            <Text style={s.name}>{l.employeeId?.name || 'Employee'}</Text>
            <Text style={s.meta}>
              {[l.employeeId?.role, l.employeeId?.employee?.ward].filter(Boolean).join(' · ')}
            </Text>
            <Text style={s.dates}>{fmtDay(l.fromDate)} – {fmtDay(l.toDate)}</Text>
            <Text style={s.reason}>{l.reason}</Text>
            <View style={s.actions}>
              <View style={busyId === l._id ? s.busy : null}>
                <FilterPill label="Approve" active color={statusColors.Resolved} onPress={() => decide(l._id, 'approved')} />
              </View>
              <View style={busyId === l._id ? s.busy : null}>
                <FilterPill label="Reject" active color={statusColors.Rejected} onPress={() => decide(l._id, 'rejected')} />
              </View>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  list: { gap: 12 },
  card: { padding: 20 },
  name: { fontFamily: font.display, fontSize: 20, color: colors.text },
  meta: { fontFamily: font.body, fontSize: 14, color: colors.dim, marginTop: 3, textTransform: 'capitalize' },
  dates: { fontFamily: font.bodyBold, fontSize: 16, color: colors.text, marginTop: 12 },
  reason: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  busy: { opacity: 0.4 },
});
