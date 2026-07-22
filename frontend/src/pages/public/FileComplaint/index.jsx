import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../../layouts/MainLayout.jsx';
import api from '../../../services/api.js';
import { CATEGORY_QUESTIONNAIRES } from '../../../constants/categories.js';
import { calculateUrgency } from '../../../utils/urgency.js';
import CategoryStep from './CategoryStep.jsx';
import DetailsStep from './DetailsStep.jsx';
import VerifyStep from './VerifyStep.jsx';
import OtpModal from './OtpModal.jsx';
import SuccessModal from './SuccessModal.jsx';

const INITIAL_FORM_DATA = {
  name: '',
  email: '',
  phone: '',
  title: '',
  description: '',
  category: 'Road Damage',
  location: '',
};

const FileComplaint = () => {
  const navigate = useNavigate();

  // Submission Flow Wizard Step State
  const [currentStep, setCurrentStep] = useState(1);

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

  // Step Validation & Navigation
  const handleNextStep = () => {
    setFormError('');
    if (currentStep === 1) {
      // Step 1: Category selection & questionnaire complete
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Step 2: Validate details
      if (!formData.title || !formData.location || !formData.description) {
        setFormError('Please fill in the subject, location, and description.');
        return;
      }
      if (formData.title.length < 5) {
        setFormError('Subject title must be at least 5 characters long.');
        return;
      }
      if (formData.description.length < 15) {
        setFormError('Detailed description must be at least 15 characters long.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setFormError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Step 3: Request Email Verification OTP
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

    const urgency = calculateUrgency(answers);
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
      setCurrentStep(1);

      // Show Success Modal
      setCreatedTrackingId(response.data.complaint.trackingId);
      setShowSuccessModal(true);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to verify OTP or submit complaint.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const urgency = calculateUrgency(answers);

  return (
    <MainLayout>
      <div className="mx-auto py-5" style={{ maxWidth: '920px' }}>
        {/* Header Title */}
        <div className="text-center mb-4">
          <h1 className="display-5 fw-bold mb-2" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
            File a Public Complaint
          </h1>
          <p className="fs-6 mx-auto mb-4" style={{ color: '#64748B', maxWidth: '650px' }}>
            Interactive citizen complaint filing portal. Answer the category questionnaire, describe the issue, and verify via email OTP.
          </p>
        </div>

        {/* Global Error Banner */}
        {formError && (
          <div
            className="alert border-0 p-3 mb-4 rounded-3 d-flex align-items-center"
            style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B' }}
            role="alert"
          >
            <i className="bi bi-exclamation-circle-fill me-2 fs-5"></i>
            <div>{formError}</div>
          </div>
        )}

        {currentStep === 1 && (
          <CategoryStep
            category={formData.category}
            onSelectCategory={handleSelectCategory}
            answers={answers}
            onToggleAnswer={handleQuestionToggle}
            urgency={urgency}
            onNext={handleNextStep}
          />
        )}

        {currentStep === 2 && (
          <DetailsStep
            formData={formData}
            onInputChange={handleInputChange}
            files={files}
            onFileChange={handleFileChange}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        )}

        {currentStep === 3 && (
          <VerifyStep
            formData={formData}
            onInputChange={handleInputChange}
            urgency={urgency}
            submittingForm={submittingForm}
            onPrev={handlePrevStep}
            onSubmit={handleVerifyEmailRequest}
          />
        )}
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
