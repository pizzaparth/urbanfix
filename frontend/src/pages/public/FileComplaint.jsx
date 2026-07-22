import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout.jsx';
import api from '../../services/api.js';

// Category-Specific Dynamic Questionnaires as specified in project_description.pdf
const CATEGORY_QUESTIONNAIRES = {
  'Road Damage': [
    { id: 'q_accident', question: 'Has there been any accident because of this issue?' },
    { id: 'q_duration', question: 'Has the problem existed for more than one week?' },
    { id: 'q_public_facility', question: 'Is a school or hospital located nearby?' },
    { id: 'q_busy_area', question: 'Is there a market or busy public area nearby?' },
    { id: 'q_vehicle_flow', question: 'Is the issue affecting vehicle movement or blocking traffic?' },
    { id: 'q_inconvenience', question: 'Is the issue causing severe public inconvenience?' },
  ],
  'Water Leakage': [
    { id: 'q_flooding', question: 'Is there severe water wastage or street flooding?' },
    { id: 'q_drinking_water', question: 'Has the leakage affected clean drinking water supply?' },
    { id: 'q_duration', question: 'Has the problem existed for more than 3 days?' },
    { id: 'q_public_facility', question: 'Is a school or hospital located nearby?' },
    { id: 'q_property_damage', question: 'Is the water leakage causing structural or property damage?' },
    { id: 'q_inconvenience', question: 'Is the issue causing severe public inconvenience?' },
  ],
  'Garbage': [
    { id: 'q_overflowing', question: 'Is garbage overflowing onto the main road or public path?' },
    { id: 'q_odor_pest', question: 'Is there a severe foul odor or health hazard/pest risk?' },
    { id: 'q_uncollected', question: 'Has garbage been uncollected for more than 48 hours?' },
    { id: 'q_public_facility', question: 'Is a school, hospital, or food market located nearby?' },
    { id: 'q_inconvenience', question: 'Is the issue causing severe public inconvenience?' },
  ],
  'Street Light': [
    { id: 'q_darkness', question: 'Is the entire street or junction completely dark at night?' },
    { id: 'q_duration', question: 'Has the light malfunctioned for more than one week?' },
    { id: 'q_safety_risk', question: 'Does the dark area pose an immediate safety/crime concern?' },
    { id: 'q_busy_area', question: 'Is a market, bus stop, or public area nearby?' },
    { id: 'q_inconvenience', question: 'Is the issue causing public inconvenience?' },
  ],
  'Administrative': [
    { id: 'q_delayed', question: 'Has an official service request been delayed beyond standard limits?' },
    { id: 'q_violation', question: 'Were official administrative procedures violated or unheeded?' },
    { id: 'q_multiple_citizens', question: 'Does this administrative issue affect multiple citizens?' },
    { id: 'q_previous_notice', question: 'Have you previously submitted a physical or verbal request?' },
    { id: 'q_inconvenience', question: 'Is the issue causing public inconvenience?' },
  ],
  'Other': [
    { id: 'q_safety_risk', question: 'Is this issue causing immediate public inconvenience or safety risk?' },
    { id: 'q_duration', question: 'Has this issue persisted for more than a week?' },
    { id: 'q_public_facility', question: 'Is a school, hospital, or busy public area nearby?' },
  ],
};

const FileComplaint = () => {
  const navigate = useNavigate();
  const categories = ['Road Damage', 'Water Leakage', 'Garbage', 'Street Light', 'Administrative', 'Other'];

  // Submission Flow Wizard Step State
  const [currentStep, setCurrentStep] = useState(1);

  // Form Field States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    description: '',
    category: 'Road Damage',
    location: '',
  });

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

  // Calculate Urgency Indicator based on "Yes" responses
  const getUrgencyLevel = () => {
    const yesCount = Object.values(answers).filter((val) => val === 'Yes').length;
    if (yesCount >= 3) return { level: 'High Urgency', color: '#EF4444', bg: '#FEE2E2' };
    if (yesCount >= 1) return { level: 'Medium Urgency', color: '#B45309', bg: '#FEF3C7' };
    return { level: 'Standard Urgency', color: '#2563EB', bg: '#DBEAFE' };
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
      setFormData({
        name: '',
        email: '',
        phone: '',
        title: '',
        description: '',
        category: 'Road Damage',
        location: '',
      });
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

  const urgency = getUrgencyLevel();
  const currentQuestions = CATEGORY_QUESTIONNAIRES[formData.category] || [];

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

        {/* STEP 1: Category Selection & Dynamic Questionnaire */}
        {currentStep === 1 && (
          <div className="card border-0 p-3 p-md-4 bg-white mb-4" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(15,23,42,.06)' }}>
            <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 pb-3 border-bottom gap-2">
              <div className="d-flex align-items-center">
                <div className="p-2 rounded-3 text-primary me-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ backgroundColor: '#DBEAFE', width: '44px', height: '44px' }}>
                  <i className="bi bi-tags-fill fs-5" style={{ color: '#2563EB' }}></i>
                </div>
                <div>
                  <h3 className="fs-5 fw-bold mb-0" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>Step 1: Category & Context Questionnaire</h3>
                  <p className="small mb-0 fw-medium" style={{ color: '#1E293B' }}>Select issue type to render category-specific urgency questions</p>
                </div>
              </div>

              {/* Calculated Urgency Badge */}
              <span className="badge px-3 py-2 fw-bold d-inline-flex align-items-center align-self-start align-self-sm-center" style={{ backgroundColor: urgency.bg, color: urgency.color, fontSize: '0.85rem' }}>
                <i className="bi bi-shield-exclamation me-1 fs-6"></i> {urgency.level}
              </span>
            </div>

            {/* Category Grid Cards */}
            <div className="mb-4">
              <label className="form-label small fw-bold mb-2" style={{ color: '#0F172A' }}>Select Issue Category *</label>
              <div className="row g-2">
                {categories.map((cat, idx) => (
                  <div key={idx} className="col-12 col-sm-6 col-md-4">
                    <button
                      type="button"
                      className={`btn w-100 p-3 text-start border-2 rounded-3 d-flex align-items-center justify-content-between ${
                        formData.category === cat ? 'btn-primary text-white border-primary' : 'btn-light text-dark border-light-subtle'
                      }`}
                      style={{
                        backgroundColor: formData.category === cat ? '#2563EB' : '#FFFFFF',
                        borderColor: formData.category === cat ? '#2563EB' : '#CBD5E1',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => setFormData({ ...formData, category: cat })}
                    >
                      <span className="fw-semibold small">{cat}</span>
                      {formData.category === cat && <i className="bi bi-check-circle-fill text-white fs-6"></i>}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Yes/No Questionnaire Section */}
            <div className="p-3 p-md-4 rounded-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-question-circle-fill me-2 text-primary fs-5"></i>
                <h4 className="fs-6 fw-bold mb-0" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
                  {formData.category} Context Questionnaire
                </h4>
              </div>
              <p className="small mb-3 fw-medium" style={{ color: '#1E293B' }}>
                Answering these Yes/No questions helps administrative teams assess urgency and prioritize inspection dispatch.
              </p>
              <div className="d-flex flex-column gap-3">
                {currentQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 glass-card rounded-3 d-flex flex-column gap-3 hover-shadow-card"
                    style={{ border: '1px solid rgba(203, 213, 225, 0.8)' }}
                  >
                    <div className="d-flex align-items-center">
                      <span className="badge bg-primary-subtle text-primary rounded-circle p-2 me-2 flex-shrink-0 d-inline-flex align-items-center justify-content-center" style={{ width: '26px', height: '26px', fontSize: '0.8rem' }}>
                        {idx + 1}
                      </span>
                      <span className="small fw-semibold" style={{ color: '#0F172A', lineHeight: '1.5' }}>
                        {q.question}
                      </span>
                    </div>

                    <div className="btn-group w-100" role="group" style={{ maxWidth: '240px' }}>
                      <button
                        type="button"
                        className={`btn btn-sm px-3 py-2 fw-bold w-50 text-transition ${answers[q.id] === 'Yes' ? 'btn-danger shadow-sm' : 'btn-outline-secondary'}`}
                        onClick={() => handleQuestionToggle(q.id, 'Yes')}
                        style={{
                          backgroundColor: answers[q.id] === 'Yes' ? '#EF4444' : 'rgba(255, 255, 255, 0.65)',
                          color: answers[q.id] === 'Yes' ? '#FFFFFF' : '#1E293B',
                          borderColor: answers[q.id] === 'Yes' ? '#EF4444' : 'rgba(203, 213, 225, 0.8)',
                          backdropFilter: 'blur(8px)',
                          cursor: 'pointer',
                        }}
                      >
                        <i className={`bi ${answers[q.id] === 'Yes' ? 'bi-check-circle-fill me-1' : ''}`}></i> Yes
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm px-3 py-2 fw-bold w-50 text-transition ${answers[q.id] === 'No' ? 'btn-success shadow-sm' : 'btn-outline-secondary'}`}
                        onClick={() => handleQuestionToggle(q.id, 'No')}
                        style={{
                          backgroundColor: answers[q.id] === 'No' ? '#10B981' : 'rgba(255, 255, 255, 0.65)',
                          color: answers[q.id] === 'No' ? '#FFFFFF' : '#1E293B',
                          borderColor: answers[q.id] === 'No' ? '#10B981' : 'rgba(203, 213, 225, 0.8)',
                          backdropFilter: 'blur(8px)',
                          cursor: 'pointer',
                        }}
                      >
                        <i className={`bi ${answers[q.id] === 'No' ? 'bi-check-circle-fill me-1' : ''}`}></i> No
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Button */}
            <div className="d-flex flex-column flex-sm-row justify-content-sm-end mt-4 pt-3 border-top gap-2">
              <button
                type="button"
                className="btn btn-primary px-4 py-2 fw-bold d-inline-flex align-items-center justify-content-center w-100 w-sm-auto"
                onClick={handleNextStep}
                style={{ backgroundColor: '#2563EB', borderRadius: '8px' }}
              >
                Proceed to Details <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Issue Details & Image Uploads */}
        {currentStep === 2 && (
          <div className="card border-0 p-3 p-md-4 bg-white mb-4" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(15,23,42,.06)' }}>
            <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
              <div className="p-2 rounded-3 text-primary me-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ backgroundColor: '#DBEAFE', width: '44px', height: '44px' }}>
                <i className="bi bi-file-earmark-text-fill fs-5" style={{ color: '#2563EB' }}></i>
              </div>
              <div>
                <h3 className="fs-5 fw-bold mb-0" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>Step 2: Issue Location & Description</h3>
                <p className="small mb-0 fw-medium" style={{ color: '#1E293B' }}>Provide location details, textual explanation, and photo evidence</p>
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-md-8">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0F172A' }}>Subject / Title *</label>
                <input
                  type="text"
                  name="title"
                  className="form-control form-control-lg fw-medium"
                  placeholder="e.g. Severe pothole on main road causing accidents"
                  value={formData.title}
                  onChange={handleInputChange}
                  style={{ borderColor: '#CBD5E1', color: '#0F172A', fontSize: '0.95rem' }}
                  required
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-bold mb-1" style={{ color: '#0F172A' }}>Selected Category</label>
                <input
                  type="text"
                  className="form-control form-control-lg bg-light fw-bold"
                  value={formData.category}
                  style={{ borderColor: '#CBD5E1', color: '#0F172A', fontSize: '0.95rem' }}
                  disabled
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold mb-1" style={{ color: '#0F172A' }}>Specific Location *</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderColor: '#CBD5E1' }}><i className="bi bi-geo-alt-fill text-danger"></i></span>
                <input
                  type="text"
                  name="location"
                  className="form-control form-control-lg border-start-0 fw-medium"
                  placeholder="e.g. Ward 4, Main Market Road (Opposite City Hospital)"
                  value={formData.location}
                  onChange={handleInputChange}
                  style={{ borderColor: '#CBD5E1', color: '#0F172A', fontSize: '0.95rem' }}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold mb-1" style={{ color: '#0F172A' }}>Detailed Explanation *</label>
              <textarea
                name="description"
                rows={5}
                className="form-control fw-medium"
                placeholder="Describe the complaint in detail so field inspection staff can locate and resolve it quickly."
                value={formData.description}
                onChange={handleInputChange}
                style={{ borderColor: '#CBD5E1', color: '#0F172A', fontSize: '0.95rem' }}
                required
              ></textarea>
            </div>

            {/* Supporting Images Upload Box */}
            <div className="mb-4">
              <label className="form-label small fw-bold mb-1" style={{ color: '#0F172A' }}>Supporting Photographs (Max 3)</label>
              <div
                className="border p-4 text-center rounded-3 bg-light"
                style={{ border: '2px dashed #CBD5E1', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onClick={() => document.getElementById('file-upload-input').click()}
              >
                <i className="bi bi-cloud-arrow-up fs-2 mb-2 d-block" style={{ color: '#2563EB' }}></i>
                <p className="fw-bold mb-1" style={{ color: '#0F172A' }}>Click or Drag Images Here</p>
                <span className="small fw-medium" style={{ color: '#1E293B' }}>Upload photos showing the issue (PNG, JPG, JPEG)</span>
              </div>
              <input
                type="file"
                id="file-upload-input"
                className="d-none"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />

              {files.length > 0 && (
                <div className="mt-3">
                  <p className="small fw-bold mb-2" style={{ color: '#0F172A' }}>Attached Images ({files.length}/3):</p>
                  <div className="d-flex flex-wrap gap-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="p-2 border rounded-3 bg-white d-flex align-items-center" style={{ fontSize: '0.85rem', borderColor: '#CBD5E1' }}>
                        <i className="bi bi-image text-primary me-2"></i>
                        <span className="text-truncate fw-semibold" style={{ maxWidth: '180px', color: '#0F172A' }}>{file.name}</span>
                        <span className="ms-2 fw-medium" style={{ fontSize: '0.75rem', color: '#1E293B' }}>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 Actions */}
            <div className="d-flex flex-column-reverse flex-sm-row justify-content-between align-items-stretch align-items-sm-center mt-4 pt-3 border-top gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary px-4 py-2 fw-bold d-inline-flex align-items-center justify-content-center w-100 w-sm-auto"
                onClick={handlePrevStep}
                style={{ borderRadius: '8px', color: '#1E293B', borderColor: '#CBD5E1' }}
              >
                <i className="bi bi-arrow-left me-2"></i> Back to Questionnaire
              </button>
              <button
                type="button"
                className="btn btn-primary px-4 py-2 fw-bold d-inline-flex align-items-center justify-content-center w-100 w-sm-auto"
                onClick={handleNextStep}
                style={{ backgroundColor: '#2563EB', borderRadius: '8px' }}
              >
                Continue to Verification <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Contact Info & Email Verification */}
        {currentStep === 3 && (
          <form onSubmit={handleVerifyEmailRequest}>
            <div className="card border-0 p-3 p-md-4 bg-white mb-4" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(15,23,42,.06)' }}>
              <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                <div className="p-2 rounded-3 text-primary me-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ backgroundColor: '#DBEAFE', width: '44px', height: '44px' }}>
                  <i className="bi bi-shield-check fs-5" style={{ color: '#2563EB' }}></i>
                </div>
                <div>
                  <h3 className="fs-5 fw-bold mb-0" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>Step 3: Citizen Contact & Verification</h3>
                  <p className="small mb-0 fw-medium" style={{ color: '#1E293B' }}>Provide contact details to receive your Tracking ID and resolution receipt</p>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold mb-1" style={{ color: '#0F172A' }}>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control form-control-lg fw-medium"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{ borderColor: '#CBD5E1', color: '#0F172A', fontSize: '0.95rem' }}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold mb-1" style={{ color: '#0F172A' }}>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control form-control-lg fw-medium"
                    placeholder="name@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{ borderColor: '#CBD5E1', color: '#0F172A', fontSize: '0.95rem' }}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold mb-1" style={{ color: '#0F172A' }}>Phone Number (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control form-control-lg fw-medium"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={{ borderColor: '#CBD5E1', color: '#0F172A', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              {/* Review Summary Box */}
              <div className="p-3 p-md-4 rounded-3 mb-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1' }}>
                <h4 className="fs-6 fw-bold mb-3" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>Complaint Submission Review</h4>
                <div className="row g-3 small">
                  <div className="col-12 col-sm-6">
                    <span className="fw-semibold d-block mb-1" style={{ color: '#1E293B' }}>Category:</span>
                    <span className="fw-bold" style={{ color: '#0F172A' }}>{formData.category}</span>
                  </div>
                  <div className="col-12 col-sm-6">
                    <span className="fw-semibold d-block mb-1" style={{ color: '#1E293B' }}>Calculated Priority Impact:</span>
                    <span className="badge px-2.5 py-1.5 fw-bold" style={{ backgroundColor: urgency.bg, color: urgency.color }}>
                      {urgency.level}
                    </span>
                  </div>
                  <div className="col-12 col-sm-6">
                    <span className="fw-semibold d-block mb-1" style={{ color: '#1E293B' }}>Subject:</span>
                    <span className="fw-bold" style={{ color: '#0F172A' }}>{formData.title}</span>
                  </div>
                  <div className="col-12 col-sm-6">
                    <span className="fw-semibold d-block mb-1" style={{ color: '#1E293B' }}>Location:</span>
                    <span className="fw-bold" style={{ color: '#0F172A' }}>{formData.location}</span>
                  </div>
                </div>
              </div>

              {/* Step 3 Actions */}
              <div className="d-flex flex-column-reverse flex-sm-row justify-content-between align-items-stretch align-items-sm-center mt-4 pt-3 border-top gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 py-2 fw-bold d-inline-flex align-items-center justify-content-center w-100 w-sm-auto"
                  onClick={handlePrevStep}
                  style={{ borderRadius: '8px', color: '#1E293B', borderColor: '#CBD5E1' }}
                >
                  <i className="bi bi-arrow-left me-2"></i> Edit Details
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-4 py-2 fw-bold d-inline-flex align-items-center justify-content-center w-100 w-sm-auto"
                  disabled={submittingForm}
                  style={{ backgroundColor: '#2563EB', borderRadius: '8px' }}
                >
                  {submittingForm ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Sending OTP...
                    </>
                  ) : (
                    'Request Email OTP & Submit'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered px-3" style={{ maxWidth: '440px' }}>
            <div className="modal-content border-0 p-4 bg-white shadow-lg" style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div className="text-center mb-4">
                <div className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px', backgroundColor: '#DBEAFE' }}>
                  <i className="bi bi-shield-check fs-2" style={{ color: '#2563EB' }}></i>
                </div>
                <h4 className="fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>OTP Verification</h4>
                <p className="small mb-1 fw-medium" style={{ color: '#1E293B' }}>We sent a verification code to</p>
                <p className="fw-bold mb-2" style={{ color: '#0F172A' }}>{formData.email}</p>
                <span className="badge px-3 py-1 fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>OTP Dispatched ✓</span>
              </div>

              {otpError && (
                <div className="alert border-0 small py-2 mb-3" style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B' }}>
                  <i className="bi bi-exclamation-circle me-1"></i> {otpError}
                </div>
              )}

              <form onSubmit={handleOtpSubmit}>
                <div className="mb-4 text-center">
                  <label className="form-label small fw-bold d-block mb-2" style={{ color: '#0F172A' }}>Enter 6-Digit OTP Code</label>
                  <input
                    type="text"
                    maxLength="6"
                    className="form-control form-control-lg text-center fw-bold text-primary w-100"
                    style={{
                      fontSize: '1.65rem',
                      letterSpacing: '0.5rem',
                      borderColor: '#CBD5E1',
                      maxWidth: '240px',
                      margin: '0 auto',
                      paddingLeft: '0.5rem',
                    }}
                    placeholder="000000"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <div className="text-center mb-4">
                  {timer > 0 ? (
                    <span className="small fw-semibold" style={{ color: '#1E293B' }}>
                      <i className="bi bi-hourglass-split me-1"></i> Resend OTP in {timer}s
                    </span>
                  ) : (
                    <button type="button" className="btn btn-link p-0 text-decoration-none fw-bold text-primary small" onClick={handleResendOtp}>
                      <i className="bi bi-arrow-clockwise me-1"></i> Resend OTP
                    </button>
                  )}
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <button type="button" className="btn btn-outline-secondary w-100 fw-bold" onClick={() => setShowOtpModal(false)} style={{ borderRadius: '8px', color: '#1E293B', borderColor: '#CBD5E1' }}>
                      Cancel
                    </button>
                  </div>
                  <div className="col-6">
                    <button type="submit" className="btn btn-primary w-100 fw-bold border-0" disabled={verifyingOtp} style={{ borderRadius: '8px', backgroundColor: '#2563EB' }}>
                      {verifyingOtp ? 'Verifying...' : 'Submit & Register'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal Overlay */}
      {showSuccessModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered px-3" style={{ maxWidth: '440px' }}>
            <div className="modal-content border-0 p-4 bg-white shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="text-center mb-4">
                <div className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px', backgroundColor: '#DCFCE7' }}>
                  <i className="bi bi-patch-check-fill fs-2" style={{ color: '#22C55E' }}></i>
                </div>
                <h4 className="fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>Complaint Successfully Logged!</h4>
                <p className="small fw-medium" style={{ color: '#1E293B' }}>Your complaint and questionnaire responses have been registered. A confirmation email has been dispatched.</p>
              </div>

              <div className="p-3 bg-light rounded-3 text-center border mb-4" style={{ borderColor: '#CBD5E1' }}>
                <span className="small d-block mb-1 text-uppercase fw-bold" style={{ color: '#1E293B' }}>Your Unique Tracking ID</span>
                <span className="h4 fw-bold text-dark d-block select-all mb-0" style={{ color: '#0F172A' }}>{createdTrackingId}</span>
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100 fw-bold"
                    onClick={() => {
                      navigator.clipboard.writeText(createdTrackingId);
                      alert('Tracking ID copied to clipboard!');
                    }}
                    style={{ borderRadius: '8px' }}
                  >
                    Copy ID
                  </button>
                </div>
                <div className="col-6">
                  <button
                    type="button"
                    className="btn btn-primary w-100 fw-bold border-0"
                    onClick={() => {
                      setShowSuccessModal(false);
                      navigate(`/track?id=${createdTrackingId}`);
                    }}
                    style={{ borderRadius: '8px', backgroundColor: '#2563EB' }}
                  >
                    Track Progress
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-link text-center w-100 text-decoration-none fw-bold mt-3 small"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/');
                }}
                style={{ color: '#1E293B' }}
              >
                Back to Public Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default FileComplaint;
