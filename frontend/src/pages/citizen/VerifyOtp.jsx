import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtpCode } = useAuth();
  
  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await verifyOtpCode(email, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      const response = await api.post('/auth/resend-otp', { email });
      setMessage(response.data.message || 'Verification code resent successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    }
  };

  return (
    <MainLayout>
      <div className="d-flex justify-content-center align-items-center py-4">
        <div className="card shadow-sm border-0 rounded-3 p-4 bg-white w-100" style={{ maxWidth: '440px' }}>
          <div className="text-center mb-4">
            <i className="bi bi-shield-lock-fill text-primary fs-1 mb-2"></i>
            <h2 className="fs-4 fw-bold mb-1">Verify Email Address</h2>
            <p className="text-muted small">Enter the 6-digit verification code sent to <strong>{email}</strong></p>
          </div>

          {error && (
            <div className="alert alert-danger border-0 small py-2 mb-3" role="alert">
              <i className="bi bi-exclamation-circle me-1"></i> {error}
            </div>
          )}

          {message && (
            <div className="alert alert-success border-0 small py-2 mb-3" role="alert">
              <i className="bi bi-check-circle me-1"></i> {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="text"
                className="form-control form-control-lg text-center fw-bold"
                style={{ letterSpacing: '8px', fontSize: '24px' }}
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-bold mb-3" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="text-center mt-2 small">
            <span className="text-muted">Didn't receive the email? </span>
            <button className="btn btn-link p-0 fw-semibold text-primary text-decoration-none small align-baseline" onClick={handleResend}>
              Resend OTP code
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default VerifyOtp;
