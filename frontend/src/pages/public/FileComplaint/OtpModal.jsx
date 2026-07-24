import { ShieldCheck, AlertCircle, Timer, RotateCw } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import { ICON_STROKE } from '../../../constants/icons.js';

const OtpModal = ({ email, otpValue, setOtpValue, otpError, timer, verifyingOtp, onSubmit, onResend, onClose }) => {
  return (
    <Modal isOpen onClose={onClose} title="OTP Verification">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <div
          className="flex items-center justify-center"
          style={{ width: '48px', height: '48px', flexShrink: 0, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--accent)', margin: '0 auto var(--space-3)' }}
        >
          <ShieldCheck size={22} strokeWidth={ICON_STROKE} />
        </div>
        <p className="text-small" style={{ marginBottom: 'var(--space-1)' }}>We sent a verification code to</p>
        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>{email}</p>
        <span className="status-pill" style={{ '--status-color': 'var(--status-resolved)' }}>OTP Dispatched</span>
      </div>

      {otpError && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--space-3)' }}>
          <AlertCircle size={15} strokeWidth={ICON_STROKE} style={{ color: 'var(--status-rejected)', flexShrink: 0 }} />
          {otpError}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="field" style={{ marginBottom: 'var(--space-4)', alignItems: 'center' }}>
          <label>Enter 6-Digit OTP Code</label>
          <input
            type="text"
            maxLength="6"
            className="input text-mono"
            style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center', maxWidth: '220px' }}
            placeholder="000000"
            value={otpValue}
            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
            required
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          {timer > 0 ? (
            <span className="text-small flex items-center justify-center gap-1">
              <Timer size={14} strokeWidth={ICON_STROKE} />
              Resend OTP in {timer}s
            </span>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onResend} style={{ margin: '0 auto' }}>
              <RotateCw size={14} strokeWidth={ICON_STROKE} />
              Resend OTP
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={verifyingOtp}>
            {verifyingOtp ? 'Verifying…' : 'Submit & Register'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default OtpModal;
