import React from 'react';

const OtpModal = ({ email, otpValue, setOtpValue, otpError, timer, verifyingOtp, onSubmit, onResend, onClose }) => {
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered px-3" style={{ maxWidth: '440px' }}>
        <div className="modal-content border-0 p-4 bg-white shadow-lg" style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <div className="text-center mb-4">
            <div className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px', backgroundColor: '#DBEAFE' }}>
              <i className="bi bi-shield-check fs-2" style={{ color: '#2563EB' }}></i>
            </div>
            <h4 className="fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>OTP Verification</h4>
            <p className="small mb-1 fw-medium" style={{ color: '#1E293B' }}>We sent a verification code to</p>
            <p className="fw-bold mb-2" style={{ color: '#0F172A' }}>{email}</p>
            <span className="badge px-3 py-1 fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>OTP Dispatched ✓</span>
          </div>

          {otpError && (
            <div className="alert border-0 small py-2 mb-3" style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B' }}>
              <i className="bi bi-exclamation-circle me-1"></i> {otpError}
            </div>
          )}

          <form onSubmit={onSubmit}>
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
                <button type="button" className="btn btn-link p-0 text-decoration-none fw-bold text-primary small" onClick={onResend}>
                  <i className="bi bi-arrow-clockwise me-1"></i> Resend OTP
                </button>
              )}
            </div>

            <div className="row g-2">
              <div className="col-6">
                <button type="button" className="btn btn-outline-secondary w-100 fw-bold" onClick={onClose} style={{ borderRadius: '8px', color: '#1E293B', borderColor: '#CBD5E1' }}>
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
  );
};

export default OtpModal;
