import { FileText, MapPin, CloudUpload, Image, ArrowLeft, ArrowRight } from 'lucide-react';
import { ICON_STROKE } from '../../../constants/icons.js';

const DetailsStep = ({ formData, onInputChange, files, onFileChange, onNext, onPrev }) => {
  return (
    <div className="panel" style={{ marginBottom: 'var(--space-4)' }}>
      <div
        className="flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}
      >
        <div
          className="flex items-center justify-center"
          style={{ width: '40px', height: '40px', flexShrink: 0, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--accent)' }}
        >
          <FileText size={18} strokeWidth={ICON_STROKE} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.0625rem' }}>Step 2 — Issue Location &amp; Description</h3>
          <p className="text-small text-muted">Provide location details, textual explanation, and photo evidence</p>
        </div>
      </div>

      <div className="grid-12" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="col-span-8 field">
          <label>Subject / Title *</label>
          <input
            type="text"
            name="title"
            className="input"
            placeholder="e.g. Severe pothole on main road causing accidents"
            value={formData.title}
            onChange={onInputChange}
            required
          />
        </div>

        <div className="col-span-4 field">
          <label>Selected Category</label>
          <input type="text" className="input" value={formData.category} disabled />
        </div>
      </div>

      <div className="field" style={{ marginBottom: 'var(--space-4)' }}>
        <label>Specific Location *</label>
        <div style={{ position: 'relative' }}>
          <MapPin
            size={15}
            strokeWidth={ICON_STROKE}
            style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--status-rejected)' }}
          />
          <input
            type="text"
            name="location"
            className="input"
            style={{ paddingLeft: 'var(--space-7)' }}
            placeholder="e.g. Ward 4, Main Market Road (Opposite City Hospital)"
            value={formData.location}
            onChange={onInputChange}
            required
          />
        </div>
      </div>

      <div className="field" style={{ marginBottom: 'var(--space-4)' }}>
        <label>Detailed Explanation *</label>
        <textarea
          name="description"
          rows={5}
          className="input"
          placeholder="Describe the complaint in detail so field inspection staff can locate and resolve it quickly."
          value={formData.description}
          onChange={onInputChange}
          required
        />
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label className="text-small" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
          Supporting Photographs (Max 3)
        </label>
        <div
          className="flex-col items-center"
          style={{
            border: '1px dashed var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('file-upload-input').click()}
        >
          <CloudUpload size={24} strokeWidth={ICON_STROKE} style={{ color: 'var(--accent)', marginBottom: 'var(--space-2)' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>Click or drag images here</p>
          <span className="text-small">Upload photos showing the issue (PNG, JPG, JPEG)</span>
        </div>
        <input type="file" id="file-upload-input" style={{ display: 'none' }} multiple accept="image/*" onChange={onFileChange} />

        {files.length > 0 && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <p className="text-mono-label" style={{ marginBottom: 'var(--space-2)' }}>Attached ({files.length}/3)</p>
            <div className="flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <div key={idx} className="tag flex items-center gap-2" style={{ padding: 'var(--space-1) var(--space-2)' }}>
                  <Image size={13} strokeWidth={ICON_STROKE} />
                  <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className="flex justify-between flex-wrap gap-2"
        style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}
      >
        <button type="button" className="btn btn-secondary" onClick={onPrev}>
          <ArrowLeft size={16} strokeWidth={ICON_STROKE} />
          Back to Questionnaire
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Continue to Verification
          <ArrowRight size={16} strokeWidth={ICON_STROKE} />
        </button>
      </div>
    </div>
  );
};

export default DetailsStep;
