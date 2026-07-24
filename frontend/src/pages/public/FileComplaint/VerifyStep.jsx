import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { ICON_STROKE } from '../../../constants/icons.js';

const VerifyStep = ({ formData, onInputChange, urgency, submittingForm, onPrev, onSubmit }) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="panel" style={{ marginBottom: 'var(--space-4)' }}>
        <div
          className="flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}
        >
          <div
            className="flex items-center justify-center"
            style={{ width: '40px', height: '40px', flexShrink: 0, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--accent)' }}
          >
            <ShieldCheck size={18} strokeWidth={ICON_STROKE} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.0625rem' }}>Step 3 — Citizen Contact &amp; Verification</h3>
            <p className="text-small text-muted">Provide contact details to receive your Tracking ID and resolution receipt</p>
          </div>
        </div>

        <div className="grid-12" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="col-span-4 field">
            <label>Full Name *</label>
            <input type="text" name="name" className="input" placeholder="e.g. John Doe" value={formData.name} onChange={onInputChange} required />
          </div>

          <div className="col-span-4 field">
            <label>Email Address *</label>
            <input type="email" name="email" className="input" placeholder="name@email.com" value={formData.email} onChange={onInputChange} required />
          </div>

          <div className="col-span-4 field">
            <label>Phone Number (Optional)</label>
            <input type="tel" name="phone" className="input" placeholder="10-digit mobile number" value={formData.phone} onChange={onInputChange} />
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 'var(--space-4)' }}>
          <h4 style={{ fontSize: 'var(--text-body)', marginBottom: 'var(--space-3)' }}>Complaint Submission Review</h4>
          <dl style={{ margin: 0 }}>
            <div className="field-row">
              <dt>Category</dt>
              <dd>{formData.category}</dd>
            </div>
            <div className="field-row">
              <dt>Calculated Priority</dt>
              <dd>
                <span className="status-pill" style={{ '--status-color': urgency.color }}>{urgency.level}</span>
              </dd>
            </div>
            <div className="field-row">
              <dt>Subject</dt>
              <dd>{formData.title}</dd>
            </div>
            <div className="field-row">
              <dt>Location</dt>
              <dd>{formData.location}</dd>
            </div>
          </dl>
        </div>

        <div
          className="flex justify-between flex-wrap gap-2"
          style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}
        >
          <button type="button" className="btn btn-secondary" onClick={onPrev}>
            <ArrowLeft size={16} strokeWidth={ICON_STROKE} />
            Edit Details
          </button>
          <button type="submit" className="btn btn-primary" disabled={submittingForm}>
            {submittingForm ? (
              <>
                <span className="spinner" style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                Sending OTP…
              </>
            ) : (
              'Request Email OTP & Submit'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default VerifyStep;
