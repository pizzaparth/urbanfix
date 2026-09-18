import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  Alert as RNAlert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { AlertCircle, ShieldCheck, BadgeCheck, Timer, RotateCw, X } from 'lucide-react-native';

import ReportStep from './ReportStep.jsx';
import { Input, Button, Alert } from '../../components/ui.jsx';
import { CATEGORY_QUESTIONNAIRES } from '../../constants/categories.js';
import { calculateUrgency } from '../../utils/urgency.js';
import { ICON_STROKE } from '../../constants/icons.js';
import api from '../../services/api.js';
import { color, space, radius, font, text } from '../../theme.js';

const INITIAL_FORM_DATA = {
  name: '',
  email: '',
  phone: '',
  title: '',
  description: '',
  category: 'Pothole / Road Damage',
  location: '',
};

// The whole filing flow is one continuous, one-card-at-a-time wizard: category
// selection, one card per questionnaire question, then title/description/location/
// upload, then name/email/phone, then a final review + submit card.
const buildCards = (questions) => [
  { type: 'category' },
  ...questions.map((q, idx) => ({
    type: 'question',
    question: q,
    questionIndex: idx,
    totalQuestions: questions.length,
  })),
  { type: 'title' },
  { type: 'description' },
  { type: 'location' },
  { type: 'upload' },
  { type: 'name' },
  { type: 'email' },
  { type: 'phone' },
  { type: 'review' },
];

// multer's allowlist is jpeg/png/webp only, so the mime type we send has to be
// right or the upload 400s. expo-image-picker gives us a uri and (usually) a
// mimeType; we derive from the extension when it doesn't.
const mimeFromUri = (uri, provided) => {
  if (provided && /^image\/(jpeg|png|webp)$/.test(provided)) return provided;
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
};

const assetToFile = (asset, idx) => {
  const type = mimeFromUri(asset.uri, asset.mimeType);
  const ext = type.split('/')[1].replace('jpeg', 'jpg');
  return {
    uri: asset.uri,
    name: asset.fileName || `complaint-${Date.now()}-${idx}.${ext}`,
    type,
  };
};

const FileComplaintScreen = ({ navigation }) => {
  const [cardIndex, setCardIndex] = useState(0);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [answers, setAnswers] = useState({});
  const [files, setFiles] = useState([]);
  const [formError, setFormError] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [timer, setTimer] = useState(0);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTrackingId, setCreatedTrackingId] = useState('');

  const questions = CATEGORY_QUESTIONNAIRES[formData.category] || [];
  const cards = useMemo(() => buildCards(questions), [questions]);
  const currentCard = cards[Math.min(cardIndex, cards.length - 1)];
  const urgency = calculateUrgency(answers, questions);

  // Reset questionnaire answers whenever the category changes.
  useEffect(() => {
    const currentQuestions = CATEGORY_QUESTIONNAIRES[formData.category] || [];
    const initial = {};
    currentQuestions.forEach((q) => {
      initial[q.id] = 'No';
    });
    setAnswers(initial);
  }, [formData.category]);

  useEffect(() => {
    if (!showOtpModal || timer <= 0) return undefined;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [showOtpModal, timer]);

  const handleInputChange = (field, value) => setFormData((f) => ({ ...f, [field]: value }));
  const handleSelectCategory = (cat) => setFormData((f) => ({ ...f, category: cat }));
  const handleQuestionToggle = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }));

  const addAssets = (assets) => {
    const room = 3 - files.length;
    if (room <= 0) {
      setFormError('You can upload at most 3 images.');
      return;
    }
    setFormError('');
    setFiles((prev) => [...prev, ...assets.slice(0, room).map(assetToFile)]);
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setFormError('Camera permission is required to photograph the issue.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) addAssets(result.assets);
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setFormError('Photo library permission is required to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 3 - files.length,
      quality: 0.7,
    });
    if (!result.canceled) addAssets(result.assets);
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleCardNext = () => {
    setFormError('');
    const t = currentCard.type;

    if (t === 'title') {
      if (!formData.title) return setFormError('Please enter a subject/title.');
      if (formData.title.length < 5)
        return setFormError('Subject title must be at least 5 characters long.');
    }
    if (t === 'description') {
      if (!formData.description) return setFormError('Please enter a detailed description.');
      if (formData.description.length < 15)
        return setFormError('Detailed description must be at least 15 characters long.');
    }
    if (t === 'location' && !formData.location)
      return setFormError('Please enter the specific location.');
    if (t === 'name' && !formData.name) return setFormError('Please enter your full name.');
    if (t === 'email' && !formData.email) return setFormError('Please enter your email address.');

    if (cardIndex < cards.length - 1) setCardIndex((prev) => prev + 1);
    return undefined;
  };

  const handleCardBack = () => {
    setFormError('');
    setCardIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleVerifyEmailRequest = async () => {
    setFormError('');
    if (!formData.name || !formData.email) {
      setFormError('Please enter your full name and email address.');
      return;
    }
    setSubmittingForm(true);
    try {
      await api.post('/complaints/request-otp', { email: formData.email });
      setOtpError('');
      setOtpValue('');
      setTimer(30);
      setShowOtpModal(true);
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Failed to send verification email. Please try again.'
      );
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError('');
    try {
      await api.post('/complaints/request-otp', { email: formData.email });
      setTimer(30);
      RNAlert.alert('OTP resent', 'Verification code resent successfully.');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  const handleOtpSubmit = async () => {
    if (otpValue.length !== 6) {
      setOtpError('Please enter a valid 6-digit verification code.');
      return;
    }
    setVerifyingOtp(true);
    setOtpError('');

    // Format questionnaire responses into a textual audit block, exactly as the
    // web app did — the backend stores this whole string as `description`.
    const questionsList = CATEGORY_QUESTIONNAIRES[formData.category] || [];
    let summary = '[CATEGORY QUESTIONNAIRE RESPONSES]\n';
    questionsList.forEach((q) => {
      summary += `• ${q.question}: ${answers[q.id] || 'No'}\n`;
    });
    summary += `\n[CITIZEN DESCRIPTION]\n${formData.description}`;

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('phone', formData.phone || '');
    data.append('otp', otpValue);
    data.append('title', formData.title);
    data.append('description', summary);
    data.append('category', formData.category);
    data.append('location', formData.location);
    data.append('urgencyLevel', urgency.label);

    // RN's FormData takes {uri, name, type} objects where the web took File.
    files.forEach((file) => data.append('images', file));

    try {
      const response = await api.post('/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (d) => d, // stop axios JSON-stringifying the FormData
      });

      setFormData(INITIAL_FORM_DATA);
      setFiles([]);
      setOtpValue('');
      setShowOtpModal(false);
      setCardIndex(0);

      setCreatedTrackingId(response.data.complaint.trackingId);
      setShowSuccessModal(true);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to verify OTP or submit complaint.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const copyTrackingId = async () => {
    await Clipboard.setStringAsync(createdTrackingId);
    RNAlert.alert('Copied', 'Tracking ID copied to clipboard.');
  };

  const progress = (cardIndex + 1) / cards.length;

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.intro}>
          <Text style={s.h1}>File a Public Complaint</Text>
          <Text style={s.lede}>
            Answer the category questionnaire, describe the issue, and verify via email OTP.
          </Text>
        </View>

        {/* Replaces the web wizard's implicit position cue — on a small screen a
            10+ card sequence needs an explicit progress bar. */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={s.progressLabel}>
          Step {cardIndex + 1} of {cards.length}
        </Text>

        {formError ? (
          <Alert tone="danger" icon={<AlertCircle size={16} strokeWidth={ICON_STROKE} />}>
            {formError}
          </Alert>
        ) : null}

        <ReportStep
          card={currentCard}
          cardIndex={cardIndex}
          category={formData.category}
          onSelectCategory={handleSelectCategory}
          answers={answers}
          onToggleAnswer={handleQuestionToggle}
          urgency={urgency}
          formData={formData}
          onInputChange={handleInputChange}
          files={files}
          onPickFromCamera={pickFromCamera}
          onPickFromLibrary={pickFromLibrary}
          onRemoveFile={removeFile}
          onNext={handleCardNext}
          onBack={handleCardBack}
          submittingForm={submittingForm}
          onSubmit={handleVerifyEmailRequest}
        />
      </ScrollView>

      {/* OTP verification — the web Modal.jsx (portal + focus trap) is replaced
          wholesale by RN's built-in Modal. */}
      <Modal visible={showOtpModal} animationType="slide" transparent onRequestClose={() => setShowOtpModal(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>OTP Verification</Text>
              <Pressable onPress={() => setShowOtpModal(false)} hitSlop={12}>
                <X size={20} strokeWidth={ICON_STROKE} color={color.textSecondary} />
              </Pressable>
            </View>

            <View style={s.modalCenter}>
              <View style={s.modalBadge}>
                <ShieldCheck size={22} strokeWidth={ICON_STROKE} color={color.accent} />
              </View>
              <Text style={s.modalSmall}>We sent a verification code to</Text>
              <Text style={s.modalEmail}>{formData.email}</Text>
            </View>

            {otpError ? (
              <Alert tone="danger" icon={<AlertCircle size={15} strokeWidth={ICON_STROKE} />}>
                {otpError}
              </Alert>
            ) : null}

            <Input
              value={otpValue}
              onChangeText={(v) => setOtpValue(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              style={s.otpInput}
            />

            <View style={s.timerRow}>
              {timer > 0 ? (
                <>
                  <Timer size={14} strokeWidth={ICON_STROKE} color={color.textMuted} />
                  <Text style={s.modalSmall}>Resend OTP in {timer}s</Text>
                </>
              ) : (
                <Button
                  title="Resend OTP"
                  variant="ghost"
                  size="sm"
                  onPress={handleResendOtp}
                  icon={<RotateCw size={14} strokeWidth={ICON_STROKE} />}
                />
              )}
            </View>

            <View style={s.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowOtpModal(false)}
                style={s.flex1}
              />
              <Button
                title="Submit"
                onPress={handleOtpSubmit}
                loading={verifyingOtp}
                style={s.flex1}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSuccessModal} animationType="fade" transparent>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalCenter}>
              <View style={[s.modalBadge, { borderColor: color.statusResolved }]}>
                <BadgeCheck size={22} strokeWidth={ICON_STROKE} color={color.statusResolved} />
              </View>
              <Text style={s.modalSmall}>
                Your complaint has been registered. A confirmation email has been dispatched.
              </Text>
            </View>

            <View style={s.idPanel}>
              <Text style={s.idLabel}>Your Unique Tracking ID</Text>
              <Text style={s.idValue}>{createdTrackingId}</Text>
            </View>

            <View style={s.modalActions}>
              <Button title="Copy ID" variant="secondary" onPress={copyTrackingId} style={s.flex1} />
              <Button
                title="Track Progress"
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.navigate('Track', { id: createdTrackingId });
                }}
                style={s.flex1}
              />
            </View>
            <Button
              title="Back to Overview"
              variant="ghost"
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('Home');
              }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: color.bg },
  content: { padding: space[4], paddingBottom: space[8], gap: space[3] },
  intro: { alignItems: 'center', gap: space[2] },
  h1: { fontFamily: font.sansBold, fontSize: text.h1, color: color.textPrimary, textAlign: 'center' },
  lede: {
    fontFamily: font.sans,
    fontSize: text.body,
    color: color.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },

  progressTrack: {
    height: 3,
    backgroundColor: color.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: color.accent },
  progressLabel: { fontFamily: font.mono, fontSize: 11, color: color.textMuted, textAlign: 'right' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: space[4],
  },
  modalCard: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderStrong,
    borderRadius: radius.md,
    padding: space[5],
    gap: space[3],
  },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontFamily: font.sansSemibold, fontSize: text.h3, color: color.textPrimary },
  modalCenter: { alignItems: 'center', gap: space[1] },
  modalBadge: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.borderStrong,
    borderRadius: radius.md,
    marginBottom: space[2],
  },
  modalSmall: {
    fontFamily: font.sans,
    fontSize: text.small,
    color: color.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalEmail: { fontFamily: font.sansSemibold, fontSize: text.body, color: color.textPrimary },
  otpInput: { height: 52, fontFamily: font.mono, fontSize: 24, letterSpacing: 8, textAlign: 'center' },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[1] },
  modalActions: { flexDirection: 'row', gap: space[2] },
  flex1: { flex: 1 },

  idPanel: {
    backgroundColor: color.surfaceRaised,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[4],
    alignItems: 'center',
    gap: space[1],
  },
  idLabel: { fontFamily: font.mono, fontSize: 11, color: color.textMuted },
  idValue: { fontFamily: font.monoMedium, fontSize: 20, color: color.textPrimary },
});

export default FileComplaintScreen;
