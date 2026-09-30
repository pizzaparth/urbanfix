import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Card, Field, Label, PrimaryButton, GhostButton, ErrorNote, SuccessNote, StatusDot } from './uikit.jsx';
import { useAutoRefresh } from '../hooks/useAutoRefresh.js';
import api from '../services/api.js';
import { colors, uf as font, statusColors } from '../theme.js';

const LEAVE_TONE = { pending: statusColors.Pending, approved: statusColors.Resolved, rejected: statusColors.Rejected };

const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
const fmtDay = (d) => new Date(d).toLocaleDateString();
const isoDay = (offset = 0) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

// Check-in/out and leave, shared by the field and supervisor profile screens.
// `base` is the router prefix: '/field' or '/supervisor'; `leavePath` differs
// because a supervisor's own leave lives at /my-leave (the plain /leave is the
// pending queue they decide).
export default function AttendanceLeavePanel({ base, leavePath = '/leave' }) {
  const [today, setToday] = useState(null);
  const [leave, setLeave] = useState([]);
  const [busy, setBusy] = useState(false);
  const [attError, setAttError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromDate: isoDay(1), toDate: isoDay(1), reason: '' });
  const [leaveError, setLeaveError] = useState('');
  const [leaveOk, setLeaveOk] = useState('');

  const load = useCallback(async () => {
    try {
      const [att, lv] = await Promise.all([api.get(`${base}/attendance`), api.get(`${base}${leavePath}`)]);
      setToday(att.data.today);
      setLeave(lv.data.leave || []);
    } catch (err) {
      console.error('Error loading attendance/leave:', err?.message);
    }
  }, [base, leavePath]);

  useAutoRefresh(load);

  const punch = async (kind) => {
    setBusy(true);
    setAttError('');
    try {
      await api.post(`${base}/attendance/${kind}`);
      await load();
    } catch (err) {
      setAttError(err.response?.data?.message || 'Could not record that. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitLeave = async () => {
    setLeaveError('');
    setLeaveOk('');
    // Server rules, checked here so the user isn't told by a 400.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(form.toDate)) {
      return setLeaveError('Enter dates as YYYY-MM-DD.');
    }
    if (form.toDate < form.fromDate) return setLeaveError('The end date cannot be before the start date.');
    if (form.reason.trim().length < 5) return setLeaveError('Give a short reason (at least 5 characters).');
    setBusy(true);
    try {
      await api.post(`${base}${leavePath}`, form);
      setLeaveOk('Leave request sent for approval.');
      setShowForm(false);
      setForm({ fromDate: isoDay(1), toDate: isoDay(1), reason: '' });
      await load();
    } catch (err) {
      setLeaveError(err.response?.data?.message || 'Could not send the request.');
    } finally {
      setBusy(false);
    }
  };

  const checkedIn = Boolean(today?.checkInAt);
  const checkedOut = Boolean(today?.checkOutAt);

  return (
    <View style={s.wrap}>
      <View>
        <Label>Attendance today</Label>
        <Card>
          <ErrorNote>{attError}</ErrorNote>
          <View style={s.timesRow}>
            <View style={s.flex1}>
              <Text style={s.timeLabel}>In</Text>
              <Text style={s.timeValue}>{fmtTime(today?.checkInAt)}</Text>
            </View>
            <View style={s.flex1}>
              <Text style={s.timeLabel}>Out</Text>
              <Text style={s.timeValue}>{fmtTime(today?.checkOutAt)}</Text>
            </View>
          </View>
          {!checkedIn ? (
            <PrimaryButton label={busy ? 'Working…' : 'Check in'} onPress={() => punch('check-in')} disabled={busy} style={s.gap} />
          ) : !checkedOut ? (
            <GhostButton label={busy ? 'Working…' : 'Check out'} onPress={() => punch('check-out')} style={s.gap} />
          ) : (
            <Text style={s.done}>Shift complete.</Text>
          )}
        </Card>
      </View>

      <View>
        <Label>Leave</Label>
        <SuccessNote>{leaveOk}</SuccessNote>
        {showForm ? (
          <Card>
            <ErrorNote>{leaveError}</ErrorNote>
            <View style={s.formStack}>
              <Field label="From (YYYY-MM-DD)" value={form.fromDate} onChangeText={(v) => setForm((f) => ({ ...f, fromDate: v }))} placeholder="2026-01-31" autoCapitalize="none" />
              <Field label="To (YYYY-MM-DD)" value={form.toDate} onChangeText={(v) => setForm((f) => ({ ...f, toDate: v }))} placeholder="2026-01-31" autoCapitalize="none" />
              <Field label="Reason" value={form.reason} onChangeText={(v) => setForm((f) => ({ ...f, reason: v }))} placeholder="Why do you need leave?" multiline />
            </View>
            <PrimaryButton label={busy ? 'Sending…' : 'Send request'} onPress={submitLeave} disabled={busy} style={s.gap} />
            <GhostButton label="Cancel" onPress={() => { setShowForm(false); setLeaveError(''); }} style={s.gapSm} />
          </Card>
        ) : (
          <GhostButton label="Request leave" onPress={() => setShowForm(true)} />
        )}

        <View style={s.leaveList}>
          {leave.length === 0 ? <Text style={s.none}>No leave requests yet.</Text> : null}
          {leave.map((l) => (
            <View key={l._id} style={s.leaveRow}>
              <StatusDot color={LEAVE_TONE[l.status]} />
              <View style={s.flex1}>
                <Text style={s.leaveDates}>{fmtDay(l.fromDate)} – {fmtDay(l.toDate)}</Text>
                <Text style={s.leaveMeta}>
                  {l.status[0].toUpperCase() + l.status.slice(1)}
                  {l.decisionNote ? ` · ${l.decisionNote}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  wrap: { gap: 22 },
  timesRow: { flexDirection: 'row', gap: 12 },
  timeLabel: { fontFamily: font.bodyBold, fontSize: 13, color: colors.dim },
  timeValue: { fontFamily: font.display, fontSize: 30, color: colors.text, marginTop: 4 },
  gap: { marginTop: 18 },
  gapSm: { marginTop: 10 },
  done: { fontFamily: font.bodyBold, fontSize: 16, color: statusColors.Resolved, marginTop: 16 },
  formStack: { gap: 16 },
  leaveList: { gap: 14, marginTop: 16 },
  leaveRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leaveDates: { fontFamily: font.bodyBold, fontSize: 16, color: colors.text },
  leaveMeta: { fontFamily: font.body, fontSize: 14, color: colors.muted, marginTop: 2 },
  none: { fontFamily: font.body, fontSize: 15, color: colors.dim },
});
