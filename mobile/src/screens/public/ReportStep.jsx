import React from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import {
  Tags,
  CircleHelp,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileText,
  AlignLeft,
  MapPin,
  CloudUpload,
  Camera,
  ImagePlus,
  X,
  User,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react-native';
import { Input, Button, Field } from '../../components/ui.jsx';
import { CATEGORIES } from '../../constants/categories.js';
import { ICON_STROKE } from '../../constants/icons.js';
import { color, space, radius, font, text } from '../../theme.js';

// Solid, dark per-priority fill for the live-priority box below each question card —
// deliberately a filled swatch (unlike StatusBadge's icon/border/text-only color use
// elsewhere) so it reads at a glance as its own distinct UI element.
const PRIORITY_BG = {
  'High Urgency': '#6B1E23',
  'Medium Urgency': '#6B4E14',
  // Reuses the navbar CTA's dark-blue token, so every dark-blue fill in the app is
  // the same deliberately dark shade — never the brighter accent blue.
  'Standard Urgency': color.navCtaBg,
};

const CardHeader = ({ icon: Icon, title, subtitle }) => (
  <View style={s.cardHeader}>
    <View style={s.headerBadge}>
      <Icon size={18} strokeWidth={ICON_STROKE} color={color.accent} />
    </View>
    <View style={s.flex1}>
      <Text style={s.cardTitle}>{title}</Text>
      {subtitle ? <Text style={s.cardSubtitle}>{subtitle}</Text> : null}
    </View>
  </View>
);

const NavRow = ({ onBack, onNext, showBack, nextLabel = 'Next' }) => (
  <View style={s.navRow}>
    {showBack ? (
      <Button
        title="Back"
        variant="secondary"
        onPress={onBack}
        icon={<ArrowLeft size={16} strokeWidth={ICON_STROKE} />}
      />
    ) : (
      <View />
    )}
    <Button
      title={nextLabel}
      onPress={onNext}
      icon={<ArrowRight size={16} strokeWidth={ICON_STROKE} />}
    />
  </View>
);

// One simple text card covers title/description/location/name/email/phone, which
// on the web were six near-identical blocks.
const TEXT_CARDS = {
  title: {
    icon: FileText,
    title: 'Issue Subject',
    subtitle: 'A short headline for the issue',
    field: 'title',
    label: 'Subject / Title',
    placeholder: 'e.g. Large pothole near the bus stop',
  },
  description: {
    icon: AlignLeft,
    title: 'Detailed Description',
    subtitle: 'Describe what you observed',
    field: 'description',
    label: 'Description',
    placeholder: 'Describe the issue in detail…',
    multiline: true,
  },
  location: {
    icon: MapPin,
    title: 'Issue Location',
    subtitle: 'Ward, area, or nearest landmark',
    field: 'location',
    label: 'Location',
    placeholder: 'e.g. Ward 12, near City Hospital',
  },
  name: {
    icon: User,
    title: 'Your Name',
    subtitle: 'Kept private — never shown on the public registry',
    field: 'name',
    label: 'Full Name',
    placeholder: 'Your full name',
  },
  email: {
    icon: Mail,
    title: 'Your Email',
    subtitle: 'Used to verify this complaint and send your receipt',
    field: 'email',
    label: 'Email Address',
    placeholder: 'you@example.com',
    keyboardType: 'email-address',
  },
  phone: {
    icon: Phone,
    title: 'Phone Number',
    subtitle: 'Optional — helps officials reach you if needed',
    field: 'phone',
    label: 'Phone (optional)',
    placeholder: 'e.g. 9876543210',
    keyboardType: 'number-pad',
  },
};

const ReportStep = ({
  card,
  cardIndex,
  category,
  onSelectCategory,
  answers,
  onToggleAnswer,
  urgency,
  formData,
  onInputChange,
  files,
  onPickFromCamera,
  onPickFromLibrary,
  onRemoveFile,
  onNext,
  onBack,
  submittingForm,
  onSubmit,
}) => {
  const showBack = cardIndex > 0;

  if (card.type === 'category') {
    return (
      <View style={s.card}>
        <CardHeader
          icon={Tags}
          title="Select Issue Category"
          subtitle="Choose the type of issue you're reporting, then continue"
        />
        <View style={s.categoryList}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => onSelectCategory(cat)}
                style={({ pressed }) => [
                  s.categoryChip,
                  active && s.categoryChipActive,
                  pressed && !active && { backgroundColor: color.surfaceRaised },
                ]}
              >
                {active ? (
                  <CheckCircle2 size={16} strokeWidth={ICON_STROKE} color={color.gray950} />
                ) : null}
                <Text style={[s.categoryText, active && s.categoryTextActive]}>{cat}</Text>
              </Pressable>
            );
          })}
        </View>
        <NavRow onBack={onBack} onNext={onNext} showBack={false} />
      </View>
    );
  }

  if (card.type === 'question') {
    const q = card.question;
    const yes = answers[q.id] === 'Yes';

    return (
      <>
        <View style={s.card}>
          <View style={s.counter}>
            <Text style={s.counterText}>
              {card.questionIndex + 1}/{card.totalQuestions}
            </Text>
          </View>
          <CardHeader
            icon={CircleHelp}
            title={category}
            subtitle="Context questionnaire — helps assess urgency"
          />
          <Text style={s.questionText}>{q.question}</Text>

          <View style={s.answerRow}>
            <Button
              title="Yes"
              variant={yes ? 'danger' : 'secondary'}
              onPress={() => onToggleAnswer(q.id, 'Yes')}
              style={s.flex1}
            />
            <Button
              title="No"
              variant={!yes ? 'primary' : 'secondary'}
              onPress={() => onToggleAnswer(q.id, 'No')}
              style={s.flex1}
            />
          </View>
          <NavRow onBack={onBack} onNext={onNext} showBack={showBack} />
        </View>

        <View style={[s.priorityBox, { backgroundColor: PRIORITY_BG[urgency.level] }]}>
          <Text style={s.priorityLabel}>Live Priority Score</Text>
          <Text style={s.priorityValue}>{urgency.level}</Text>
        </View>
      </>
    );
  }

  if (card.type === 'upload') {
    return (
      <View style={s.card}>
        <CardHeader
          icon={CloudUpload}
          title="Supporting Photographs"
          subtitle="Up to 3 images — optional but strongly recommended"
        />

        {/* The web app had a hidden <input type="file"> behind a fake dropzone.
            On a phone the camera is the point, so it gets its own primary action. */}
        <View style={s.uploadActions}>
          <Button
            title="Take Photo"
            onPress={onPickFromCamera}
            icon={<Camera size={16} strokeWidth={ICON_STROKE} />}
            style={s.flex1}
            disabled={files.length >= 3}
          />
          <Button
            title="Choose"
            variant="secondary"
            onPress={onPickFromLibrary}
            icon={<ImagePlus size={16} strokeWidth={ICON_STROKE} />}
            style={s.flex1}
            disabled={files.length >= 3}
          />
        </View>

        {files.length > 0 ? (
          <View style={s.previewRow}>
            {files.map((f, idx) => (
              <View key={f.uri} style={s.previewItem}>
                <Image source={{ uri: f.uri }} style={s.previewImage} />
                <Pressable onPress={() => onRemoveFile(idx)} hitSlop={8} style={s.previewRemove}>
                  <X size={13} strokeWidth={2.25} color={color.gray50} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.uploadHint}>No images attached yet.</Text>
        )}

        <Text style={s.uploadMeta}>
          {files.length}/3 attached · JPEG, PNG or WebP · max 5 MB each
        </Text>

        <NavRow onBack={onBack} onNext={onNext} showBack={showBack} />
      </View>
    );
  }

  if (card.type === 'review') {
    const rows = [
      ['Category', formData.category],
      ['Calculated Priority', urgency.level],
      ['Subject', formData.title],
      ['Location', formData.location],
      ['Name', formData.name],
      ['Email', formData.email],
      ['Photos', `${files.length} attached`],
    ];

    return (
      <View style={s.card}>
        <CardHeader
          icon={ShieldCheck}
          title="Complaint Submission Review"
          subtitle="Confirm the details, then request your email OTP"
        />
        <View>
          {rows.map(([label, value], i) => (
            <View key={label} style={[s.reviewRow, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.reviewLabel}>{label}</Text>
              <Text
                style={[
                  s.reviewValue,
                  label === 'Calculated Priority' && { color: urgency.color },
                ]}
                numberOfLines={2}
              >
                {value || '—'}
              </Text>
            </View>
          ))}
        </View>
        <View style={s.navRow}>
          <Button
            title="Back"
            variant="secondary"
            onPress={onBack}
            icon={<ArrowLeft size={16} strokeWidth={ICON_STROKE} />}
          />
          <Button title="Request OTP" onPress={onSubmit} loading={submittingForm} />
        </View>
      </View>
    );
  }

  // Everything else is a single labelled text field.
  const cfg = TEXT_CARDS[card.type];
  if (!cfg) return null;

  return (
    <View style={s.card}>
      <CardHeader icon={cfg.icon} title={cfg.title} subtitle={cfg.subtitle} />
      <Field label={cfg.label}>
        <Input
          value={formData[cfg.field]}
          onChangeText={(v) => onInputChange(cfg.field, v)}
          placeholder={cfg.placeholder}
          multiline={cfg.multiline}
          keyboardType={cfg.keyboardType}
          autoCapitalize={cfg.keyboardType === 'email-address' ? 'none' : 'sentences'}
          autoCorrect={cfg.keyboardType !== 'email-address'}
        />
      </Field>
      <NavRow onBack={onBack} onNext={onNext} showBack={showBack} />
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[4],
  },
  flex1: { flex: 1 },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    borderBottomWidth: 1,
    borderBottomColor: color.border,
    paddingBottom: space[3],
    marginBottom: space[4],
  },
  headerBadge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.borderStrong,
    borderRadius: radius.md,
  },
  cardTitle: { fontFamily: font.sansSemibold, fontSize: 17, color: color.textPrimary },
  cardSubtitle: { fontFamily: font.sans, fontSize: text.small, color: color.textMuted, marginTop: 2 },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space[4],
    paddingTop: space[3],
    borderTopWidth: 1,
    borderTopColor: color.border,
  },

  categoryList: { gap: space[2] },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    minHeight: 40,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderWidth: 1,
    borderColor: color.borderStrong,
    borderRadius: radius.md,
  },
  categoryChipActive: { backgroundColor: color.accent, borderColor: color.accent },
  categoryText: { flex: 1, fontFamily: font.sansMedium, fontSize: text.small, color: color.textPrimary },
  categoryTextActive: { color: color.gray950 },

  counter: { alignSelf: 'flex-start', marginBottom: space[3] },
  counterText: { fontFamily: font.mono, fontSize: text.monoSm, color: color.textMuted },
  questionText: { fontFamily: font.sans, fontSize: text.body, color: color.textPrimary, lineHeight: 22 },
  answerRow: { flexDirection: 'row', gap: space[2], marginTop: space[4] },

  priorityBox: {
    marginTop: space[3],
    borderRadius: radius.md,
    padding: space[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityLabel: { fontFamily: font.mono, fontSize: text.monoSm, color: 'rgba(255,255,255,0.75)' },
  priorityValue: { fontFamily: font.monoMedium, fontSize: text.monoMd, color: color.white },

  uploadActions: { flexDirection: 'row', gap: space[2] },
  previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginTop: space[3] },
  previewItem: { position: 'relative' },
  previewImage: {
    width: 88,
    height: 88,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceRaised,
  },
  previewRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.statusRejected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadHint: {
    marginTop: space[3],
    fontFamily: font.sans,
    fontSize: text.small,
    color: color.textMuted,
  },
  uploadMeta: { marginTop: space[2], fontFamily: font.mono, fontSize: 11, color: color.textMuted },

  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space[4],
    paddingVertical: space[3],
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  reviewLabel: { fontFamily: font.sans, fontSize: text.small, color: color.textMuted },
  reviewValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: font.sansMedium,
    fontSize: text.small,
    color: color.textPrimary,
  },
});

export default ReportStep;
