import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, SlideInRight, SlideInUp } from 'react-native-reanimated';

import { Screen, Card, Field, PrimaryButton, GhostButton, Tappable, ErrorNote } from '../components/ui';
import Icon from '../components/Icon';
import SwipeQuestionCard from '../components/SwipeQuestionCard';
import { CATEGORIES, QUESTIONS, scoreUrgency } from '../constants/categories';
import { makeTrackingId } from '../data/mock';
import { useApp } from '../context/AppContext';
import { colors, font, radius, urgencyColors } from '../theme';

const STEPS = ['category', 'questions', 'details', 'photos', 'contact', 'review'];

export default function ReportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { addComplaint } = useApp();
  const swipeRef = useRef(null);

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [form, setForm] = useState({ title: '', description: '', location: '', name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [success, setSuccess] = useState(null);

  const type = STEPS[step];
  const urgency = useMemo(() => scoreUrgency(answers), [answers]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const reset = () => {
    setStep(0); setCategory(CATEGORIES[0]); setQIndex(0); setAnswers({});
    setForm({ title: '', description: '', location: '', name: '', email: '', phone: '' });
    setError(''); setOtp(''); setOtpError('');
  };

  const answerQuestion = (value) => {
    const q = QUESTIONS[qIndex];
    setAnswers((a) => ({ ...a, [q.id]: value }));
    if (qIndex < QUESTIONS.length - 1) setQIndex(qIndex + 1);
    else setStep(step + 1);
  };

  const back = () => {
    if (type === 'questions' && qIndex > 0) { setQIndex(qIndex - 1); return; }
    if (step > 0) { setStep(step - 1); setQIndex(0); setError(''); }
  };

  const next = () => {
    if (type === 'details') {
      if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
        setError('Fill in title, details and location.'); return;
      }
    }
    if (type === 'contact') {
      if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    }
    setError('');
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    setOtp(''); setOtpError(''); setOtpOpen(true);
  };

  const submit = () => {
    if (otp.length !== 6) { setOtpError('Enter the 6-digit code.'); return; }
    const trackingId = makeTrackingId();
    addComplaint({
      id: 'local-' + trackingId,
      trackingId,
      title: form.title,
      category,
      location: form.location,
      status: 'Pending',
      date: new Date().toISOString().slice(0, 10),
      description: form.description,
      urgency,
    });
    setOtpOpen(false);
    setSuccess(trackingId);
    reset();
  };

  return (
    <>
      <Screen contentStyle={{ paddingTop: insets.top }}>
        <View style={s.header}>
          {step > 0 || qIndex > 0 ? (
            <Tappable onPress={back} scaleTo={0.9} style={s.backBtn}>
              <Icon name="chevronLeft" size={20} color={colors.text} strokeWidth={2.6} />
            </Tappable>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Report an issue</Text>
            <Text style={s.stepLabel}>
              {type === 'questions'
                ? 'Question ' + (qIndex + 1) + ' of ' + QUESTIONS.length
                : 'Step ' + (step + 1) + ' of ' + STEPS.length}
            </Text>
          </View>
        </View>

        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: (((step + 1) / STEPS.length) * 100) + '%' }]} />
        </View>

        <View style={s.stepBody}>
          {type === 'category' && (
            <Animated.View entering={SlideInRight.duration(340)}>
              <Text style={s.stepTitle}>What's the issue?</Text>
              <View style={{ gap: 12 }}>
                {CATEGORIES.map((c) => {
                  const selected = c === category;
                  return (
                    <Tappable key={c} onPress={() => setCategory(c)} scaleTo={0.98}
                      style={[s.categoryRow, { borderColor: selected ? colors.accent : colors.borderStrong }]}>
                      <Text style={s.categoryLabel}>{c}</Text>
                      {selected ? <Icon name="check" size={24} color={colors.accent} strokeWidth={3} /> : null}
                    </Tappable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {type === 'questions' && (
            <View>
              <View style={s.dots}>
                {QUESTIONS.map((q, i) => (
                  <View key={q.id} style={[
                    s.dot,
                    { width: i === qIndex ? 22 : 8, backgroundColor: i < qIndex ? colors.secondary : i === qIndex ? colors.accent : colors.borderStrong },
                  ]} />
                ))}
              </View>

              <SwipeQuestionCard
                key={qIndex}
                ref={swipeRef}
                question={QUESTIONS[qIndex].text}
                category={category}
                onAnswer={answerQuestion}
              />

              <View style={s.swipeActions}>
                <Tappable onPress={() => swipeRef.current && swipeRef.current.swipe(-1)} scaleTo={0.86} style={s.noBtn}>
                  <Icon name="close" size={26} color="#FF5A7A" strokeWidth={2.8} />
                </Tappable>
                <Tappable onPress={() => swipeRef.current && swipeRef.current.swipe(1)} scaleTo={0.86} style={s.yesBtn}>
                  <Icon name="check" size={29} color="#06140D" strokeWidth={3.2} />
                </Tappable>
              </View>

              <View style={s.priorityRow}>
                <View style={[s.priorityDot, { backgroundColor: urgencyColors[urgency] }]} />
                <Text style={s.priorityLabel}>Priority </Text>
                <Text style={[s.priorityValue, { color: urgencyColors[urgency] }]}>{urgency}</Text>
              </View>
            </View>
          )}

          {type === 'details' && (
            <Animated.View entering={SlideInRight.duration(340)}>
              <Text style={s.stepTitle}>Describe it</Text>
              <View style={{ gap: 22 }}>
                <Field label="Title" value={form.title} onChangeText={(v) => set('title', v)} placeholder="e.g. Pothole near bus stop" />
                <Field label="Details" value={form.description} onChangeText={(v) => set('description', v)} placeholder="What did you see?" multiline />
                <Field label="Location" value={form.location} onChangeText={(v) => set('location', v)} placeholder="Ward, street or landmark" />
              </View>
            </Animated.View>
          )}

          {type === 'photos' && (
            <Animated.View entering={SlideInRight.duration(340)}>
              <Text style={s.stepTitle}>Add photos</Text>
              <Text style={s.stepSub}>Optional — up to 3</Text>
              <View style={{ gap: 12 }}>
                <PhotoSlot label="Drop the main photo" height={210} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <PhotoSlot label="Wider shot" height={130} flex />
                  <PhotoSlot label="Close-up" height={130} flex />
                </View>
              </View>
              <View style={s.photoHint}>
                <Icon name="camera" size={20} color={colors.accent} />
                <Text style={s.photoHintText}>Photos speed up triage.</Text>
              </View>
            </Animated.View>
          )}

          {type === 'contact' && (
            <Animated.View entering={SlideInRight.duration(340)}>
              <Text style={s.stepTitle}>Your contact</Text>
              <View style={{ gap: 22 }}>
                <Field label="Full name" value={form.name} onChangeText={(v) => set('name', v)} placeholder="Your name" />
                <Field label="Email" value={form.email} onChangeText={(v) => set('email', v)} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
                <Field label="Phone (optional)" value={form.phone} onChangeText={(v) => set('phone', v)} placeholder="9876543210" keyboardType="phone-pad" />
              </View>
            </Animated.View>
          )}

          {type === 'review' && (
            <Animated.View entering={SlideInRight.duration(340)}>
              <Text style={s.stepTitle}>Review</Text>
              <Card style={{ gap: 0, paddingVertical: 6 }}>
                <ReviewRow label="Category" value={category} />
                <ReviewRow label="Priority" value={urgency} />
                <ReviewRow label="Title" value={form.title || '—'} />
                <ReviewRow label="Location" value={form.location || '—'} />
                <ReviewRow label="Name" value={form.name || '—'} />
                <ReviewRow label="Email" value={form.email || '—'} last />
              </Card>
            </Animated.View>
          )}

          <ErrorNote>{error}</ErrorNote>

          {type !== 'questions' ? (
            <PrimaryButton
              label={type === 'review' ? 'Request code' : 'Next'}
              onPress={next}
              style={{ marginTop: 22 }}
            />
          ) : null}
        </View>
      </Screen>

      {/* OTP sheet */}
      <Modal visible={otpOpen} transparent animationType="none" onRequestClose={() => setOtpOpen(false)}>
        <Animated.View entering={FadeIn.duration(220)} style={s.backdrop}>
          <Animated.View entering={SlideInUp.duration(320)} style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Verify email</Text>
              <Tappable onPress={() => setOtpOpen(false)} scaleTo={0.9}>
                <Icon name="close" size={20} color={colors.muted} strokeWidth={2.4} />
              </Tappable>
            </View>
            <Text style={s.sheetSub}>{'Code sent to ' + (form.email || 'you@example.com')}</Text>
            <ErrorNote>{otpError}</ErrorNote>
            <TextInput
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={colors.placeholder}
              keyboardType="number-pad"
              style={s.otpInput}
            />
            <PrimaryButton label="Submit complaint" onPress={submit} style={{ marginTop: 18 }} />
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Success dialog */}
      <Modal visible={!!success} transparent animationType="none" onRequestClose={() => setSuccess(null)}>
        <Animated.View entering={FadeIn.duration(220)} style={s.backdropCenter}>
          <Animated.View entering={FadeInDown.duration(340)} style={s.dialog}>
            <View style={s.successRing}>
              <Icon name="check" size={22} color="#4ADE9B" strokeWidth={2.8} />
            </View>
            <Text style={s.sheetTitle}>Complaint filed</Text>
            <Text style={s.sheetSub}>Save this tracking ID to follow its progress.</Text>
            <View style={s.idBox}><Text style={s.idText}>{success}</Text></View>
            <PrimaryButton
              label="Track progress"
              onPress={() => { const id = success; setSuccess(null); navigation.navigate('Track', { trackingId: id }); }}
              style={{ width: '100%' }}
            />
            <GhostButton label="Back home" color={colors.muted} onPress={() => { setSuccess(null); navigation.navigate('Home'); }} style={{ width: '100%' }} />
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

function PhotoSlot({ label, height, flex }) {
  return (
    <View style={[s.photoSlot, { height }, flex && { flex: 1 }]}>
      <Icon name="camera" size={24} color={colors.dim} />
      <Text style={s.photoSlotText}>{label}</Text>
    </View>
  );
}

function ReviewRow({ label, value, last }) {
  return (
    <View style={[s.reviewRow, last && { borderBottomWidth: 0 }]}>
      <Text style={s.reviewLabel}>{label}</Text>
      <Text style={s.reviewValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 8 },
  backBtn: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: font.display, fontSize: 38, lineHeight: 40, color: colors.text, letterSpacing: -0.7 },
  stepLabel: { fontFamily: font.bodyBold, fontSize: 18, color: colors.muted, marginTop: 9 },
  progressTrack: { height: 4, marginHorizontal: 20, marginTop: 10, marginBottom: 34, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
  stepBody: { paddingHorizontal: 20 },
  stepTitle: { fontFamily: font.display, fontSize: 30, lineHeight: 34, color: colors.text, marginBottom: 22 },
  stepSub: { fontFamily: font.bodyBold, fontSize: 17, color: colors.muted, marginTop: -14, marginBottom: 20 },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    paddingHorizontal: 22, paddingVertical: 20,
    backgroundColor: colors.surface, borderWidth: 2, borderRadius: radius.md,
  },
  categoryLabel: { flex: 1, fontFamily: font.display, fontSize: 20, lineHeight: 25, color: colors.text },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 18 },
  dot: { height: 6, borderRadius: 3 },
  swipeActions: { flexDirection: 'row', justifyContent: 'center', gap: 26, marginTop: 22 },
  noBtn: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#FF5A7A', alignItems: 'center', justifyContent: 'center' },
  yesBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#4ADE9B', alignItems: 'center', justifyContent: 'center' },
  priorityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { fontFamily: font.body, fontSize: 15, color: colors.muted },
  priorityValue: { fontFamily: font.bodyBold, fontSize: 15 },
  photoSlot: {
    borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.borderDashed,
    backgroundColor: colors.surfaceSunken, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  photoSlotText: { fontFamily: font.bodyBold, fontSize: 14, color: colors.dim },
  photoHint: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  photoHintText: { fontFamily: font.body, fontSize: 15, color: colors.muted },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 12,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  reviewLabel: { fontFamily: font.body, fontSize: 15, color: colors.dim },
  reviewValue: { flex: 1, textAlign: 'right', fontFamily: font.bodyBold, fontSize: 15, color: colors.text },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  backdropCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: {
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderStrong,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 26, paddingBottom: 34, gap: 14,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: font.display, fontSize: 20, color: colors.text },
  sheetSub: { fontFamily: font.body, fontSize: 15, color: colors.muted, textAlign: 'center' },
  otpInput: {
    height: 62, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceInput, color: colors.text,
    fontFamily: font.display, fontSize: 26, letterSpacing: 10, textAlign: 'center',
  },
  dialog: {
    width: '100%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong,
    borderRadius: 28, padding: 28, alignItems: 'center', gap: 14,
  },
  successRing: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#4ADE9B', alignItems: 'center', justifyContent: 'center' },
  idBox: {
    width: '100%', padding: 16, borderRadius: 16, backgroundColor: colors.surfaceInput,
    borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center',
  },
  idText: { fontFamily: font.display, fontSize: 20, color: colors.text, letterSpacing: 1 },
});
