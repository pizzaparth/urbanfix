import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Screen, Card, PrimaryButton, ErrorNote, SuccessNote, Field, Label, InfoTile, BackHeader,
} from '../../components/uikit.jsx';
import FormattedDescription from '../../components/FormattedDescription.jsx';
import PhotoPicker from '../../components/PhotoPicker.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import { SkeletonBlock } from '../../components/Skeleton.jsx';
import { stageLabel } from '../../constants/stages.js';
import { appendImage } from '../../utils/imageFiles.js';
import api, { getUploadsBaseUrl } from '../../services/api.js';
import { colors, uf as font } from '../../theme.js';

const MIN_NOTE = 5;

const TaskDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { id } = route.params || {};

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/field/tasks/${id}`);
      setTask(res.data.task);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load this task.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const startWork = async () => {
    setBusy(true);
    setActionError('');
    setSuccess('');
    try {
      await api.patch(`/field/tasks/${id}/start`);
      setSuccess('Marked as started.');
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not start this task.');
    } finally {
      setBusy(false);
    }
  };

  const submitProof = async () => {
    setActionError('');
    setSuccess('');
    // Server rules, checked here so the user isn't told by a 400 after uploading.
    if (files.length === 0) return setActionError('Attach at least one photo of the finished work.');
    if (note.trim().length < MIN_NOTE) return setActionError('Add a short note describing the work done.');

    const data = new FormData();
    data.append('completionNote', note.trim());
    setBusy(true);
    try {
      for (const f of files) await appendImage(data, 'images', f);
      await api.post(`/field/tasks/${id}/proof`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (d) => d, // stop axios JSON-stringifying the FormData
      });
      setFiles([]);
      setNote('');
      setSuccess('Proof submitted. Your supervisor will review it.');
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not submit the proof.');
    } finally {
      setBusy(false);
    }
  };

  const header = <BackHeader title="Task" onBack={() => navigation.goBack()} />;

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

  if (error || !task) {
    return (
      <Screen contentStyle={{ paddingTop: insets.top }}>
        {header}
        <View style={s.body}>
          <ErrorNote>{error || 'Task not found.'}</ErrorNote>
        </View>
      </Screen>
    );
  }

  const uploads = getUploadsBaseUrl();
  const latest = task.statusHistory?.[task.statusHistory.length - 1];

  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      {header}
      <View style={s.body}>
        <View>
          <Text style={s.title}>{task.title}</Text>
          <Text style={s.trackingId}>{task.trackingId}</Text>
        </View>

        <View style={s.tileRow}>
          <InfoTile label="Stage" value={stageLabel(task.stage)} flex />
          <InfoTile label="Ward" value={task.ward || '—'} width={124} />
        </View>
        <InfoTile label="Location" value={task.location} />

        {latest?.remarks ? (
          <View>
            <Label>Latest update</Label>
            <Card style={s.noteCard}>
              <Text style={s.noteText}>{latest.remarks}</Text>
            </Card>
          </View>
        ) : null}

        <View>
          <Label>Description</Label>
          <FormattedDescription description={task.description} />
        </View>

        {task.images?.length > 0 ? (
          <View>
            <Label>Reported photographs</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.imageRow}>
              {task.images.map((img, i) => (
                <Image key={i} source={{ uri: `${uploads}${img}` }} style={s.image} resizeMode="cover" />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {task.completionImages?.length > 0 ? (
          <View>
            <Label>Your completion proof</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.imageRow}>
              {task.completionImages.map((img, i) => (
                <Image key={i} source={{ uri: `${uploads}${img}` }} style={s.image} resizeMode="cover" />
              ))}
            </ScrollView>
            {task.completionNote ? <Text style={s.proofNote}>{task.completionNote}</Text> : null}
          </View>
        ) : null}

        {task.stage === 'assigned' ? (
          <View>
            <ErrorNote>{actionError}</ErrorNote>
            <PrimaryButton label={busy ? 'Starting…' : 'Start work'} onPress={startWork} disabled={busy} />
          </View>
        ) : null}

        {task.stage === 'work_in_progress' ? (
          <View style={s.proofBlock}>
            <Label>Completion proof</Label>
            <ErrorNote>{actionError}</ErrorNote>
            <PhotoPicker files={files} onChange={setFiles} onError={setActionError} />
            <Field
              label="What was done?"
              value={note}
              onChangeText={setNote}
              placeholder="Describe the work you completed"
              multiline
            />
            <PrimaryButton label={busy ? 'Uploading…' : 'Submit proof'} onPress={submitProof} disabled={busy} />
          </View>
        ) : null}

        {task.stage === 'proof_submitted' ? (
          <Card>
            <Text style={s.noteText}>Submitted — waiting for your supervisor to review it.</Text>
          </Card>
        ) : null}
        {task.stage === 'closed' ? (
          <Card>
            <Text style={s.noteText}>This task was verified and closed.</Text>
          </Card>
        ) : null}

        <SuccessNote>{success}</SuccessNote>

        <View>
          <Label>Status log history</Label>
          <StatusTimeline statusHistory={task.statusHistory} />
        </View>
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
  noteCard: { padding: 18 },
  noteText: { fontFamily: font.body, fontSize: 15, lineHeight: 23, color: colors.muted },
  proofNote: { fontFamily: font.body, fontSize: 15, lineHeight: 23, color: colors.muted, marginTop: 12 },
  proofBlock: { gap: 16 },
});

export default TaskDetailScreen;
