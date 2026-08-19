import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import MainLayout from '../../../layouts/MainLayout.jsx';
import api from '../../../services/api.js';
import { CATEGORY_QUESTIONNAIRES } from '../../../constants/categories.js';
import { calculateUrgency } from '../../../utils/urgency.js';
import { ICON_STROKE } from '../../../constants/icons.js';
import ReportStep from './ReportStep.jsx';
import OtpModal from './OtpModal.jsx';
import SuccessModal from './SuccessModal.jsx';

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
// upload, then name/email/phone, then a final review + submit card. `cardIndex`
// tracks position in this single sequence, kept here (not inside ReportStep) so
// navigation state survives across the whole form.
const buildCards = (questions) => [
  { type: 'category' },
  ...questions.map((q, idx) => ({ type: 'question', question: q, questionIndex: idx, totalQuestions: questions.length })),
  { type: 'title' },
  { type: 'description' },
  { type: 'location' },
  { type: 'upload' },
  { type: 'name' },
  { type: 'email' },
  { type: 'phone' },
  { type: 'review' },
];

const FileComplaint = () => {
  const navigate = useNavigate();

  const [cardIndex, setCardIndex] = useState(0);

  // Form Field States
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Dynamic Questionnaire Answers State (Map of Question ID -> Yes/No)
  const [answers, setAnswers] = useState({});

  const [files, setFiles] = useState([]);
  const [formError, setFormError] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [timer, setTimer] = useState(0);

  // Success Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTrackingId, setCreatedTrackingId] = useState('');

  const questions = CATEGORY_QUESTIONNAIRES[formData.category] || [];
  const cards = buildCards(questions);
  const currentCard = cards[Math.min(cardIndex, cards.length - 1)];

  // Initialize Questionnaire Answers when Category Changes
  useEffect(() => {
    const currentQuestions = CATEGORY_QUESTIONNAIRES[formData.category] || [];
    const initialAnswers = {};
    currentQuestions.forEach((q) => {
      initialAnswers[q.id] = 'No';
    });
    setAnswers(initialAnswers);
  }, [formData.category]);

  // OTP Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (showOtpModal && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, timer]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectCategory = (cat) => {
    setFormData({ ...formData, category: cat });
  };

  const handleQuestionToggle = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 3) {
      setFormError('You can upload at most 3 images.');
      setFiles([]);
    } else {
      setFormError('');
      setFiles(selectedFiles);
    }
  };

  // Card-by-card Validation & Navigation
  const handleCardNext = () => {
    setFormError('');

    if (currentCard.type === 'title') {
      if (!formData.title) {
        setFormError('Please enter a subject/title.');
        return;
      }
      if (formData.title.length < 5) {
        setFormError('Subject title must be at least 5 characters long.');
        return;
      }
    }

    if (currentCard.type === 'description') {
      if (!formData.description) {
        setFormError('Please enter a detailed description.');
        return;
      }
      if (formData.description.length < 15) {
        setFormError('Detailed description must be at least 15 characters long.');
        return;
      }
    }

    if (currentCard.type === 'location') {
      if (!formData.location) {
        setFormError('Please enter the specific location.');
        return;
      }
    }

    if (currentCard.type === 'name') {
      if (!formData.name) {
        setFormError('Please enter your full name.');
        return;
      }
    }

    if (currentCard.type === 'email') {
      if (!formData.email) {
        setFormError('Please enter your email address.');
        return;
      }
    }

    if (cardIndex < cards.length - 1) {
      setCardIndex((prev) => prev + 1);
    }
  };

  const handleCardBack = () => {
    setFormError('');
    setCardIndex((prev) => Math.max(prev - 1, 0));
  };

  // Final card (review): Request Email Verification OTP
  const handleVerifyEmailRequest = async (e) => {
    e.preventDefault();
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
      setFormError(err.response?.data?.message || 'Failed to send verification email. Please try again.');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError('');
    try {
      await api.post('/complaints/request-otp', { email: formData.email });
      setTimer(30);
      alert('Verification OTP resent successfully.');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  // Final Submission with OTP verification and formatted questionnaire summary
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpValue || otpValue.length !== 6) {
      setOtpError('Please enter a valid 6-digit verification code.');
      return;
    }

    setVerifyingOtp(true);
    setOtpError('');

    // Format questionnaire responses into textual audit block
    const questionsList = CATEGORY_QUESTIONNAIRES[formData.category] || [];
    let questionnaireSummary = `[CATEGORY QUESTIONNAIRE RESPONSES]\n`;
    questionsList.forEach((q) => {
      const userAns = answers[q.id] || 'No';
      questionnaireSummary += `• ${q.question}: ${userAns}\n`;
    });
    questionnaireSummary += `\n[CITIZEN DESCRIPTION]\n${formData.description}`;

    const urgency = calculateUrgency(answers, questionsList);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('phone', formData.phone || '');
    data.append('otp', otpValue);
    data.append('title', formData.title);
    data.append('description', questionnaireSummary);
    data.append('category', formData.category);
    data.append('location', formData.location);
    data.append('urgencyLevel', urgency.label);

    files.forEach((file) => {
      data.append('images', file);
    });

    try {
      const response = await api.post('/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Reset states
      setFormData(INITIAL_FORM_DATA);
      setFiles([]);
      setOtpValue('');
      setShowOtpModal(false);
      setCardIndex(0);

      // Show Success Modal
      setCreatedTrackingId(response.data.complaint.trackingId);
      setShowSuccessModal(true);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to verify OTP or submit complaint.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const urgency = calculateUrgency(answers, questions);

  return (
    <MainLayout>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <h1 style={{ fontSize: 'var(--text-h1)', marginBottom: 'var(--space-2)' }}>File a Public Complaint</h1>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto', fontSize: 'var(--text-body)' }}>
            Interactive citizen complaint filing portal. Answer the category questionnaire, describe the issue, and
            verify via email OTP.
          </p>
        </div>

        {formError && (
          <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
            <AlertCircle size={16} strokeWidth={ICON_STROKE} style={{ color: 'var(--status-rejected)', flexShrink: 0 }} />
            <div>{formError}</div>
          </div>
        )}

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
          onFileChange={handleFileChange}
          onNext={handleCardNext}
          onBack={handleCardBack}
          submittingForm={submittingForm}
          onSubmit={handleVerifyEmailRequest}
        />
      </div>

      {showOtpModal && (
        <OtpModal
          email={formData.email}
          otpValue={otpValue}
          setOtpValue={setOtpValue}
          otpError={otpError}
          timer={timer}
          verifyingOtp={verifyingOtp}
          onSubmit={handleOtpSubmit}
          onResend={handleResendOtp}
          onClose={() => setShowOtpModal(false)}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          trackingId={createdTrackingId}
          onTrackProgress={() => {
            setShowSuccessModal(false);
            navigate(`/track?id=${createdTrackingId}`);
          }}
          onBackHome={() => {
            setShowSuccessModal(false);
            navigate('/');
          }}
        />
      )}
    </MainLayout>
  );
};

export default FileComplaint;
