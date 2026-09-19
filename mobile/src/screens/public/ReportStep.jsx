import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

import { Card, Field, PrimaryButton, Tappable } from '../../components/uikit.jsx';
import Icon from '../../components/Icon.jsx';
import SwipeQuestionCard from '../../components/SwipeQuestionCard.jsx';
import { CATEGORIES } from '../../constants/categories.js';
import { colors, uf as font, ufRadius as radius, urgencyColors } from '../../theme.js';

// Renders one card of the filing wizard. The reference kept all of this inline
// in ReportScreen; here it stays a separate component because FileComplaintScreen
// owns the API calls (OTP, multipart upload) and is long enough already.
const ReportStep = ({
  card,
  category,
  onSelectCategory,
  answers,
  questions,
  questionIndex,
  onAnswerQuestion,
  urgency,
  formData,
  onInputChange,
  files,
  onPickFromCamera,
  onPickFromLibrary,
  onRemoveFile,
  onNext,
  submittingForm,
}) => {
  const swipeRef = useRef(null);
  const type = card.type;

  // calculateUrgency returns { label: 'High Urgency', … }; the palette is keyed
  // by both that and the bare word.
  const urgencyLabel = urgency?.label || 'Standard Urgency';
  const urgencyTone = urgencyColors[urgencyLabel] || colors.success;

  return (
    <View style={s.stepBody}>
      {type === 'category' ? (
        <View>
          <Text style={s.stepTitle}>What's the issue?</Text>
          <View style={s.stack12}>
            {CATEGORIES.map((c) => {
              const selected = c === category;
              return (
                <Tappable
                  key={c}
                  onPress={() => onSelectCategory(c)}
                  scaleTo={0.98}
                  style={[
                    s.categoryRow,
                    { borderColor: selected ? colors.accent : colors.borderStrong },
                  ]}
                >
                  <Text style={s.categoryLabel}>{c}</Text>
                  {selected ? (
                    <Icon name="check" size={24} color={colors.accent} strokeWidth={3} />
                  ) : null}
                </Tappable>
              );
            })}
          </View>
        </View>
      ) : null}

      {type === 'questions' ? (
        <View>
          <View style={s.dots}>
            {questions.map((q, i) => (
              <View
                key={q.id}
                style={[
                  s.dot,
                  {
                    width: i === questionIndex ? 22 : 8,
                    backgroundColor:
                      i < questionIndex
                        ? colors.secondary
                        : i === questionIndex
                          ? colors.accent
                          : colors.borderStrong,
                  },
                ]}
              />
            ))}
          </View>

          <SwipeQuestionCard
            key={questionIndex}
            ref={swipeRef}
            question={questions[questionIndex]?.question || ''}
            category={category}
            onAnswer={onAnswerQuestion}
          />

          <View style={s.swipeActions}>
            <Tappable
              onPress={() => swipeRef.current && swipeRef.current.swipe(-1)}
              scaleTo={0.86}
              style={s.noBtn}
            >
              <Icon name="close" size={26} color="#FF5A7A" strokeWidth={2.8} />
            </Tappable>
            <Tappable
              onPress={() => swipeRef.current && swipeRef.current.swipe(1)}
              scaleTo={0.86}
              style={s.yesBtn}
            >
              <Icon name="check" size={29} color="#06140D" strokeWidth={3.2} />
            </Tappable>
          </View>

          <View style={s.priorityRow}>
            <View style={[s.priorityDot, { backgroundColor: urgencyTone }]} />
            <Text style={s.priorityLabel}>Priority </Text>
            <Text style={[s.priorityValue, { color: urgencyTone }]}>
              {urgencyLabel.replace(' Urgency', '')}
            </Text>
          </View>
        </View>
      ) : null}

      {type === 'details' ? (
        <View>
          <Text style={s.stepTitle}>Describe it</Text>
          <View style={s.stack22}>
            <Field
              label="Title"
              value={formData.title}
              onChangeText={(v) => onInputChange('title', v)}
              placeholder="e.g. Pothole near bus stop"
            />
            <Field
              label="Details"
              value={formData.description}
              onChangeText={(v) => onInputChange('description', v)}
              placeholder="What did you see?"
              multiline
            />
            <Field
              label="Location"
              value={formData.location}
              onChangeText={(v) => onInputChange('location', v)}
              placeholder="Ward, street or landmark"
            />
          </View>
        </View>
      ) : null}

      {type === 'upload' ? (
        <View>
          <Text style={s.stepTitle}>Add photos</Text>
          <Text style={s.stepSub}>Optional — up to 3</Text>

          {/* The reference's slots were decorative. These actually pick images,
              so a filled slot shows the photo with a remove control. */}
          <View style={s.stack12}>
            {files.map((f, i) => (
              <View key={f.uri + i} style={s.thumbWrap}>
                <Image source={{ uri: f.uri }} style={s.thumb} resizeMode="cover" />
                <Tappable onPress={() => onRemoveFile(i)} scaleTo={0.9} style={s.thumbRemove}>
                  <Icon name="close" size={16} color={colors.text} strokeWidth={2.6} />
                </Tappable>
              </View>
            ))}

            {files.length < 3 ? (
              <View style={s.slotRow}>
                <Tappable onPress={onPickFromCamera} scaleTo={0.97} style={[s.photoSlot, s.flex1]}>
                  <Icon name="camera" size={24} color={colors.dim} />
                  <Text style={s.photoSlotText}>Take a photo</Text>
                </Tappable>
                <Tappable onPress={onPickFromLibrary} scaleTo={0.97} style={[s.photoSlot, s.flex1]}>
                  <Icon name="plusBare" size={24} color={colors.dim} />
                  <Text style={s.photoSlotText}>From library</Text>
                </Tappable>
              </View>
            ) : null}
          </View>

          <View style={s.photoHint}>
            <Icon name="camera" size={20} color={colors.accent} />
            <Text style={s.photoHintText}>Photos speed up triage.</Text>
          </View>
        </View>
      ) : null}

      {type === 'contact' ? (
        <View>
          <Text style={s.stepTitle}>Your contact</Text>
          <View style={s.stack22}>
            <Field
              label="Full name"
              value={formData.name}
              onChangeText={(v) => onInputChange('name', v)}
              placeholder="Your name"
            />
            <Field
              label="Email"
              value={formData.email}
              onChangeText={(v) => onInputChange('email', v)}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Phone (optional)"
              value={formData.phone}
              onChangeText={(v) => onInputChange('phone', v)}
              placeholder="9876543210"
              keyboardType="phone-pad"
            />
          </View>
        </View>
      ) : null}

      {type === 'review' ? (
        <View>
          <Text style={s.stepTitle}>Review</Text>
          <Card style={s.reviewCard}>
            <ReviewRow label="Category" value={category} />
            <ReviewRow label="Priority" value={urgencyLabel.replace(' Urgency', '')} />
            <ReviewRow label="Title" value={formData.title || '—'} />
            <ReviewRow label="Location" value={formData.location || '—'} />
            <ReviewRow label="Photos" value={String(files.length)} />
            <ReviewRow label="Name" value={formData.name || '—'} />
            <ReviewRow label="Email" value={formData.email || '—'} last />
          </Card>
        </View>
      ) : null}

      {type !== 'questions' ? (
        <PrimaryButton
          label={type === 'review' ? (submittingForm ? 'Sending code…' : 'Request code') : 'Next'}
          onPress={onNext}
          style={s.next}
        />
      ) : null}
    </View>
  );
};

function ReviewRow({ label, value, last }) {
  return (
    <View style={[s.reviewRow, last && s.reviewRowLast]}>
      <Text style={s.reviewLabel}>{label}</Text>
      <Text style={s.reviewValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  stack12: { gap: 12 },
  stack22: { gap: 22 },
  stepBody: { paddingHorizontal: 20 },
  stepTitle: {
    fontFamily: font.display,
    fontSize: 30,
    lineHeight: 34,
    color: colors.text,
    marginBottom: 22,
  },
  stepSub: {
    fontFamily: font.bodyBold,
    fontSize: 17,
    color: colors.muted,
    marginTop: -14,
    marginBottom: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 20,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderRadius: radius.md,
  },
  categoryLabel: { flex: 1, fontFamily: font.display, fontSize: 20, lineHeight: 25, color: colors.text },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 18 },
  dot: { height: 6, borderRadius: 3 },
  swipeActions: { flexDirection: 'row', justifyContent: 'center', gap: 26, marginTop: 22 },
  noBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FF5A7A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4ADE9B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { fontFamily: font.body, fontSize: 15, color: colors.muted },
  priorityValue: { fontFamily: font.bodyBold, fontSize: 15 },
  slotRow: { flexDirection: 'row', gap: 12 },
  photoSlot: {
    height: 150,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  photoSlotText: { fontFamily: font.bodyBold, fontSize: 14, color: colors.dim },
  thumbWrap: { borderRadius: 24, overflow: 'hidden' },
  thumb: { width: '100%', height: 200, backgroundColor: colors.surfaceInput },
  thumbRemove: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  photoHintText: { fontFamily: font.body, fontSize: 15, color: colors.muted },
  reviewCard: { gap: 0, paddingVertical: 6 },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewRowLast: { borderBottomWidth: 0 },
  reviewLabel: { fontFamily: font.body, fontSize: 15, color: colors.dim },
  reviewValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: font.bodyBold,
    fontSize: 15,
    color: colors.text,
  },
  next: { marginTop: 22 },
});

export default ReportStep;
