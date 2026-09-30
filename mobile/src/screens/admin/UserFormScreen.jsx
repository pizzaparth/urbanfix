import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Screen, Card, Field, FieldLabel, ChoiceGroup, PrimaryButton, DangerButton, GhostButton, ErrorNote, SuccessNote, BackHeader,
} from '../../components/uikit.jsx';
import { SkeletonBlock } from '../../components/Skeleton.jsx';
import { WARDS } from '../../constants/wards.js';
import api from '../../services/api.js';
import { colors, uf as font } from '../../theme.js';

const ROLES = [
  { value: 'field', label: 'Field' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'admin', label: 'Admin' },
];

// Create an employee (params: none) or edit / deactivate one (params: userId).
// Creating sends an invite link — no password is ever chosen or emailed here.
const UserFormScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const userId = route.params?.userId;
  const editing = Boolean(userId);

  const [loading, setLoading] = useState(editing);
  const [existing, setExisting] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', role: 'field', phone: '', employeeCode: '', ward: '', supervisorId: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/users');
        const all = res.data.users || [];
        setSupervisors(all.filter((u) => u.role === 'supervisor' && u.isActive !== false));
        if (editing) {
          const u = all.find((x) => x._id === userId);
          if (u) {
            setExisting(u);
            setForm({
              name: u.name,
              email: u.email,
              role: u.role,
              phone: u.phone || u.employee?.phone || '',
              employeeCode: u.employee?.employeeCode || '',
              ward: u.employee?.ward || '',
              supervisorId: u.employee?.supervisorId?._id || u.employee?.supervisorId || '',
            });
          } else {
            setError('User not found.');
          }
        }
      } catch {
        setError('Failed to load.');
      } finally {
        setLoading(false);
      }
    })();
  }, [editing, userId]);

  const isResearcher = existing?.role === 'researcher';
  const showsWard = form.role === 'field' || form.role === 'supervisor';

  const save = async () => {
    setError('');
    setSuccess('');
    // Server rules, checked here so the user isn't told by a 400.
    if (form.name.trim().length < 2) return setError('Enter a name (at least 2 characters).');
    if (!editing && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid email address.');
    if (showsWard && !form.ward) return setError('Choose the ward this person covers.');

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      employeeCode: form.employeeCode.trim() || undefined,
      ward: showsWard ? form.ward : undefined,
      supervisorId: form.role === 'field' && form.supervisorId ? form.supervisorId : undefined,
    };

    setBusy(true);
    try {
      if (editing) {
        await api.patch(`/admin/users/${userId}`, {
          ...payload,
          supervisorId: form.role === 'field' ? form.supervisorId || null : undefined,
        });
        setSuccess('Saved.');
      } else {
        await api.post('/admin/users', { ...payload, email: form.email.trim(), role: form.role });
        navigation.goBack();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async () => {
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const wasActive = existing.isActive !== false;
      const res = await api.patch(`/admin/users/${userId}/${wasActive ? 'deactivate' : 'reactivate'}`);
      setExisting(res.data.user);
      setSuccess(
        wasActive
          ? `Deactivated.${res.data.releasedTasks ? ` ${res.data.releasedTasks} task(s) returned to the assignment queue.` : ''}`
          : 'Reactivated.'
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change this account.');
    } finally {
      setBusy(false);
    }
  };

  const header = <BackHeader title={editing ? 'Edit person' : 'Add employee'} onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen contentStyle={{ paddingTop: insets.top }}>
        {header}
        <View style={s.body}>
          <SkeletonBlock height={60} />
          <SkeletonBlock height={60} />
          <SkeletonBlock height={120} />
        </View>
      </Screen>
    );
  }

  const active = existing ? existing.isActive !== false : true;

  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      {header}
      <View style={s.body}>
        <ErrorNote>{error}</ErrorNote>

        {isResearcher ? (
          <Card>
            <Text style={s.name}>{existing.name}</Text>
            <Text style={s.info}>{existing.email}</Text>
            <Text style={s.info}>
              {[existing.researcher?.title, existing.researcher?.institute].filter(Boolean).join(' · ')}
            </Text>
            <Text style={s.info}>
              {`Access ends ${existing.researcher?.accessExpiresAt ? new Date(existing.researcher.accessExpiresAt).toLocaleDateString() : '—'} · ${existing.researcher?.datasetScope === 'anonymised_records' ? 'anonymised records' : 'aggregate only'}`}
            </Text>
          </Card>
        ) : (
          <View style={s.stack}>
            <Field label="Full name" value={form.name} onChangeText={set('name')} placeholder="Their name" />
            {!editing ? (
              <Field
                label="Email"
                value={form.email}
                onChangeText={set('email')}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <View>
                <FieldLabel>Email</FieldLabel>
                <Text style={s.info}>{form.email}</Text>
              </View>
            )}

            {!editing ? (
              <View>
                <FieldLabel>Role</FieldLabel>
                <ChoiceGroup options={ROLES} value={form.role} onChange={set('role')} />
              </View>
            ) : (
              <View>
                <FieldLabel>Role</FieldLabel>
                <Text style={[s.info, s.cap]}>{form.role}</Text>
              </View>
            )}

            {showsWard ? (
              <View>
                <FieldLabel>Ward</FieldLabel>
                <ChoiceGroup options={WARDS} value={form.ward} onChange={set('ward')} />
              </View>
            ) : null}

            {form.role === 'field' ? (
              <View>
                <FieldLabel>Supervisor</FieldLabel>
                {supervisors.length === 0 ? (
                  <Text style={s.info}>No active supervisors yet.</Text>
                ) : (
                  <ChoiceGroup
                    options={supervisors.map((sv) => ({ value: sv._id, label: sv.name }))}
                    value={form.supervisorId}
                    onChange={set('supervisorId')}
                    color={colors.secondary}
                  />
                )}
              </View>
            ) : null}

            <Field label="Phone (optional)" value={form.phone} onChangeText={set('phone')} placeholder="Contact number" keyboardType="phone-pad" />
            <Field
              label="Employee code (optional)"
              value={form.employeeCode}
              onChangeText={set('employeeCode')}
              placeholder="Generated if left empty"
              autoCapitalize="characters"
            />

            {!editing ? (
              <Text style={s.info}>
                They'll get an email with a link to choose their own password. It expires in 72 hours.
              </Text>
            ) : null}

            <PrimaryButton label={busy ? 'Saving…' : editing ? 'Save changes' : 'Create & send invite'} onPress={save} disabled={busy} />
          </View>
        )}

        {editing && existing ? (
          <View style={s.stack}>
            {active ? (
              <DangerButton label={busy ? 'Working…' : 'Deactivate account'} onPress={toggleActive} style={s.center} />
            ) : (
              <GhostButton label={busy ? 'Working…' : 'Reactivate account'} onPress={toggleActive} />
            )}
            <Text style={s.info}>
              Accounts are never deleted — complaint history that references them stays intact.
            </Text>
          </View>
        ) : null}

        <SuccessNote>{success}</SuccessNote>
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 8, gap: 22 },
  stack: { gap: 22 },
  name: { fontFamily: font.display, fontSize: 22, color: colors.text },
  info: { fontFamily: font.body, fontSize: 15, lineHeight: 23, color: colors.muted, marginTop: 4 },
  cap: { textTransform: 'capitalize' },
  center: { alignItems: 'center' },
});

export default UserFormScreen;
