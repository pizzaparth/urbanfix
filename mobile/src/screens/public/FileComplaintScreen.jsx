import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';

import { PrimaryButton, GhostButton, Tappable, ErrorNote } from '../../components/uikit.jsx';
import Icon from '../../components/Icon.jsx';
import ReportStep from './ReportStep.jsx';
import { CATEGORY_QUESTIONNAIRES } from '../../constants/categories.js';
import { calculateUrgency } from '../../utils/urgency.js';
import { notify } from '../../utils/notify.js';
import api from '../../services/api.js';
import { colors, uf as font } from '../../theme.js';

const INITIAL_FORM_DATA = {
  name: '',
  email: '',
  phone: '',
  title: '',
  description: '',
  category: 'Pothole / Road Damage',
  location: '',
};

const STEPS = ['category', 'questions', 'details', 'upload', 'contact', 'review'];

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
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
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

  const questions = useMemo(
    () => CATEGORY_QUESTIONNAIRES[formData.category] || [],
    [formData.category]
  );
  const type = STEPS[step];
  const urgency = calculateUrgency(answers, questions);

  // Every question defaults to No, so urgency is well-defined before the first
  // swipe and a skipped questionnaire still scores.
  useEffect(() => {
    const initial = {};
    (CATEGORY_QUESTIONNAIRES[formData.category] || []).forEach((q) => {
      initial[q.id] = 'No';
    });
    setAnswers(initial);
    setQuestionIndex(0);
  }, [formData.category]);

  useEffect(() => {
    if (!showOtpModal || timer <= 0) return undefined;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [showOtpModal, timer]);

  const handleInputChange = (field, value) => setFormData((f) => ({ ...f, [field]: value }));
  const handleSelectCategory = (cat) => setFormData((f) => ({ ...f, category: cat }));

  // One swipe answers one question and advances; the last one moves the wizard on.
  const handleAnswerQuestion = (value) => {
    const q = questions[questionIndex];
    if (q) setAnswers((a) => ({ ...a, [q.id]: value }));
    if (questionIndex < questions.length - 1) setQuestionIndex((i) => i + 1);
    else setStep((sIdx) => sIdx + 1);
  };

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

  const handleBack = () => {
    setFormError('');
    if (type === 'questions' && questionIndex > 0) {
      setQuestionIndex((i) => i - 1);
      return;
    }
    if (step > 0) {
      setStep((prev) => prev - 1);
      setQuestionIndex(0);
    }
  };

  const handleNext = () => {
    setFormError('');

    // Server-side minimums, checked here so the user isn't told by a 400 after
    // sitting through the OTP round trip.
    if (type === 'details') {
      if (!formData.title) return setFormError('Please enter a subject/title.');
      if (formData.title.length < 5)
        return setFormError('Subject title must be at least 5 characters long.');
      if (!formData.description) return setFormError('Please enter a detailed description.');
      if (formData.description.length < 15)
        return setFormError('Detailed description must be at least 15 characters long.');
      if (!formData.location) return setFormError('Please enter the specific location.');
    }
    if (type === 'contact') {
      if (!formData.name) return setFormError('Please enter your full name.');
      if (!formData.email) return setFormError('Please enter your email address.');
    }

    if (step < STEPS.length - 1) {
      setStep((prev) => prev + 1);
      return undefined;
    }
    return handleVerifyEmailRequest();
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
      notify('OTP resent', 'Verification code resent successfully.');
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

    // The questionnaire is flattened into a textual audit block; the backend
    // stores this whole string as `description`.
    let summary = '[CATEGORY QUESTIONNAIRE RESPONSES]\n';
    questions.forEach((q) => {
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
      setStep(0);
      setQuestionIndex(0);

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
    notify('Copied', 'Tracking ID copied to clipboard.');
  };

  return (
    <>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={s.flex}
          contentContainerStyle={[s.content, { paddingTop: insets.top }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.header}>
            {step > 0 || questionIndex > 0 ? (
              <Tappable onPress={handleBack} scaleTo={0.9} style={s.backBtn}>
                <Icon name="chevronLeft" size={20} color={colors.text} strokeWidth={2.6} />
              </Tappable>
            ) : null}
            <View style={s.flex1}>
              <Text style={s.title}>Report an issue</Text>
              <Text style={s.stepLabel}>
                {type === 'questions'
                  ? 'Question ' + (questionIndex + 1) + ' of ' + questions.length
                  : 'Step ' + (step + 1) + ' of ' + STEPS.length}
              </Text>
            </View>
          </View>

          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: ((step + 1) / STEPS.length) * 100 + '%' }]} />
          </View>

          <View style={s.errorWrap}>
            <ErrorNote>{formError}</ErrorNote>
          </View>

          <ReportStep
            card={{ type }}
            category={formData.category}
            onSelectCategory={handleSelectCategory}
            answers={answers}
            questions={questions}
            questionIndex={questionIndex}
            onAnswerQuestion={handleAnswerQuestion}
            urgency={urgency}
            formData={formData}
            onInputChange={handleInputChange}
            files={files}
            onPickFromCamera={pickFromCamera}
            onPickFromLibrary={pickFromLibrary}
            onRemoveFile={removeFile}
            onNext={handleNext}
            submittingForm={submittingForm}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OTP sheet */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <Animated.View entering={FadeIn.duration(220)} style={s.backdrop}>
          <Animated.View entering={SlideInUp.duration(320)} style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Verify email</Text>
              <Tappable onPress={() => setShowOtpModal(false)} scaleTo={0.9}>
                <Icon name="close" size={20} color={colors.muted} strokeWidth={2.4} />
              </Tappable>
            </View>
            <Text style={s.sheetSub}>{'Code sent to ' + (formData.email || 'your inbox')}</Text>
            <ErrorNote>{otpError}</ErrorNote>
            <TextInput
              value={otpValue}
              onChangeText={(v) => setOtpValue(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={colors.placeholder}
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              style={s.otpInput}
            />
            <Tappable onPress={handleResendOtp} disabled={timer > 0} scaleTo={0.96}>
              <Text style={s.resend}>
                {timer > 0 ? `Resend code in ${timer}s` : 'Resend code'}
              </Text>
            </Tappable>
            <PrimaryButton
              label={verifyingOtp ? 'Submitting…' : 'Submit complaint'}
              onPress={handleOtpSubmit}
              style={s.sheetCta}
            />
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Success dialog */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <Animated.View entering={FadeIn.duration(220)} style={s.backdropCenter}>
          <Animated.View entering={FadeInDown.duration(340)} style={s.dialog}>
            <View style={s.successRing}>
              <Icon name="check" size={22} color="#4ADE9B" strokeWidth={2.8} />
            </View>
            <Text style={s.sheetTitle}>Complaint filed</Text>
            <Text style={s.sheetSub}>Save this tracking ID to follow its progress.</Text>
            <Tappable onPress={copyTrackingId} scaleTo={0.97} style={s.idBox}>
              <Text style={s.idText}>{createdTrackingId}</Text>
              <Text style={s.idHint}>Tap to copy</Text>
            </Tappable>
            <PrimaryButton
              label="Track progress"
              onPress={() => {
                const id = createdTrackingId;
                setShowSuccessModal(false);
                navigation.navigate('Track', { id });
              }}
              style={s.fullWidth}
            />
            <GhostButton
              label="Back home"
              color={colors.muted}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('Home');
              }}
              style={s.fullWidth}
            />
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  flex1: { flex: 1 },
  fullWidth: { width: '100%' },
  content: { paddingBottom: 130 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
  },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: font.display,
    fontSize: 38,
    lineHeight: 40,
    color: colors.text,
    letterSpacing: -0.7,
  },
  stepLabel: { fontFamily: font.bodyBold, fontSize: 18, color: colors.muted, marginTop: 9 },
  progressTrack: {
    height: 4,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 34,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
  errorWrap: { paddingHorizontal: 20 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  backdropCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 26,
    paddingBottom: 34,
    gap: 14,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: font.display, fontSize: 20, color: colors.text },
  sheetSub: { fontFamily: font.body, fontSize: 15, color: colors.muted, textAlign: 'center' },
  otpInput: {
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceInput,
    color: colors.text,
    fontFamily: font.display,
    fontSize: 26,
    letterSpacing: 10,
    textAlign: 'center',
  },
  resend: { fontFamily: font.bodyBold, fontSize: 15, color: colors.muted, textAlign: 'center' },
  sheetCta: { marginTop: 4 },
  dialog: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    gap: 14,
  },
  successRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#4ADE9B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idBox: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    gap: 4,
  },
  idText: { fontFamily: font.display, fontSize: 20, color: colors.text, letterSpacing: 1 },
  idHint: { fontFamily: font.body, fontSize: 12, color: colors.dim },
});

export default FileComplaintScreen;
