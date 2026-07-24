import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';

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
      <div className="flex justify-center" style={{ padding: 'var(--space-6) 0' }}>
        <div className="panel" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <div
              className="flex items-center justify-center"
              style={{ width: '44px', height: '44px', flexShrink: 0, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--accent)', margin: '0 auto var(--space-3)' }}
            >
              <ShieldCheck size={20} strokeWidth={ICON_STROKE} />
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-1)' }}>Verify Email Address</h2>
            <p className="text-small text-muted">
              Enter the 6-digit verification code sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 'var(--space-3)' }}>
              <AlertCircle size={15} strokeWidth={ICON_STROKE} style={{ color: 'var(--status-rejected)', flexShrink: 0 }} />
              {error}
            </div>
          )}

          {message && (
            <div className="alert alert-success" style={{ marginBottom: 'var(--space-3)' }}>
              <CheckCircle2 size={15} strokeWidth={ICON_STROKE} style={{ color: 'var(--status-resolved)', flexShrink: 0 }} />
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="stack">
            <input
              type="text"
              className="input text-mono"
              style={{ letterSpacing: '8px', fontSize: '1.5rem', textAlign: 'center' }}
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
          </form>

          <div className="text-small" style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
            <span className="text-muted">Didn't receive the email? </span>
            <button type="button" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', height: 'auto', padding: 0 }} onClick={handleResend}>
              Resend OTP code
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default VerifyOtp;
