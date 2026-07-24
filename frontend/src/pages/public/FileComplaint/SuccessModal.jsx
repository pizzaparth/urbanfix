import { BadgeCheck } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import { ICON_STROKE } from '../../../constants/icons.js';

const SuccessModal = ({ trackingId, onTrackProgress, onBackHome }) => {
  return (
    <Modal isOpen onClose={onBackHome} title="Complaint Logged">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <div
          className="flex items-center justify-center"
          style={{ width: '48px', height: '48px', flexShrink: 0, border: '1px solid var(--status-resolved)', borderRadius: 'var(--radius-md)', color: 'var(--status-resolved)', margin: '0 auto var(--space-3)' }}
        >
          <BadgeCheck size={22} strokeWidth={ICON_STROKE} />
        </div>
        <p className="text-small">
          Your complaint and questionnaire responses have been registered. A confirmation email has been dispatched.
        </p>
      </div>

      <div className="panel" style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <span className="text-mono-label" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Your Unique Tracking ID</span>
        <span className="text-mono" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{trackingId}</span>
      </div>

      <div className="flex gap-2" style={{ marginBottom: 'var(--space-3)' }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ flex: 1 }}
          onClick={() => {
            navigator.clipboard.writeText(trackingId);
            alert('Tracking ID copied to clipboard!');
          }}
        >
          Copy ID
        </button>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={onTrackProgress}>
          Track Progress
        </button>
      </div>

      <button type="button" className="btn btn-ghost" style={{ width: '100%' }} onClick={onBackHome}>
        Back to Public Dashboard
      </button>
    </Modal>
  );
};

export default SuccessModal;
