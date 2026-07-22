import React from 'react';

const VerifyStep = ({ formData, onInputChange, urgency, submittingForm, onPrev, onSubmit }) => {
  return (
    <form onSubmit={onSubmit}>
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
              onChange={onInputChange}
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
              onChange={onInputChange}
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
              onChange={onInputChange}
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
            onClick={onPrev}
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
  );
};

export default VerifyStep;
