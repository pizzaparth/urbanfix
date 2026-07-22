import React from 'react';

const DetailsStep = ({ formData, onInputChange, files, onFileChange, onNext, onPrev }) => {
  return (
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
            onChange={onInputChange}
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
            onChange={onInputChange}
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
          onChange={onInputChange}
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
          onChange={onFileChange}
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
          onClick={onPrev}
          style={{ borderRadius: '8px', color: '#1E293B', borderColor: '#CBD5E1' }}
        >
          <i className="bi bi-arrow-left me-2"></i> Back to Questionnaire
        </button>
        <button
          type="button"
          className="btn btn-primary px-4 py-2 fw-bold d-inline-flex align-items-center justify-content-center w-100 w-sm-auto"
          onClick={onNext}
          style={{ backgroundColor: '#2563EB', borderRadius: '8px' }}
        >
          Continue to Verification <i className="bi bi-arrow-right ms-2"></i>
        </button>
      </div>
    </div>
  );
};

export default DetailsStep;
