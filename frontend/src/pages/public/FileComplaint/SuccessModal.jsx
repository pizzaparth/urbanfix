import React from 'react';

const SuccessModal = ({ trackingId, onTrackProgress, onBackHome }) => {
  return (
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
            <span className="h4 fw-bold text-dark d-block select-all mb-0" style={{ color: '#0F172A' }}>{trackingId}</span>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <button
                type="button"
                className="btn btn-outline-primary w-100 fw-bold"
                onClick={() => {
                  navigator.clipboard.writeText(trackingId);
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
                onClick={onTrackProgress}
                style={{ borderRadius: '8px', backgroundColor: '#2563EB' }}
              >
                Track Progress
              </button>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-link text-center w-100 text-decoration-none fw-bold mt-3 small"
            onClick={onBackHome}
            style={{ color: '#1E293B' }}
          >
            Back to Public Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
