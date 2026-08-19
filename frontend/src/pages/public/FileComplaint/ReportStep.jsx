import {
  Tags,
  CircleHelp,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileText,
  AlignLeft,
  MapPin,
  CloudUpload,
  Image,
  User,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { CATEGORIES } from '../../../constants/categories.js';
import { ICON_STROKE } from '../../../constants/icons.js';

// Solid, dark per-priority fill for the live-priority box below each question card —
// deliberately a filled swatch (unlike `.status-pill`'s icon/border/text-only color use
// elsewhere in the app) so it reads at a glance as its own distinct UI element.
const PRIORITY_BG = {
  'High Urgency': '#6B1E23',
  'Medium Urgency': '#6B4E14',
  // Reuses the navbar CTA's dark-blue token, so every dark-blue fill in the app
  // is the same deliberately dark shade — never the brighter --accent blue.
  'Standard Urgency': 'var(--nav-cta-bg)',
};

const CardHeader = ({ icon: Icon, title, subtitle }) => (
  <div
    className="flex items-center gap-3"
    style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}
  >
    <div
      className="flex items-center justify-center"
      style={{
        width: '40px',
        height: '40px',
        flexShrink: 0,
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--accent)',
      }}
    >
      <Icon size={18} strokeWidth={ICON_STROKE} />
    </div>
    <div>
      <h3 style={{ fontSize: '1.0625rem' }}>{title}</h3>
      {subtitle && <p className="text-small text-muted">{subtitle}</p>}
    </div>
  </div>
);

const NavRow = ({ onBack, onNext, showBack, nextLabel = 'Next' }) => (
  <div
    className="flex justify-between"
    style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}
  >
    {showBack ? (
      <button type="button" className="btn btn-secondary" onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={ICON_STROKE} />
        Back
      </button>
    ) : (
      <span />
    )}
    <button type="button" className="btn btn-primary" onClick={onNext}>
      {nextLabel}
      <ArrowRight size={16} strokeWidth={ICON_STROKE} />
    </button>
  </div>
);

const ReportStep = ({
  card,
  cardIndex,
  category,
  onSelectCategory,
  answers,
  onToggleAnswer,
  urgency,
  formData,
  onInputChange,
  files,
  onFileChange,
  onNext,
  onBack,
  submittingForm,
  onSubmit,
}) => {
  const showBack = cardIndex > 0;

  if (card.type === 'category') {
    return (
      <div className="question-card question-card--auto">
        <div className="question-card-body">
          <CardHeader icon={Tags} title="Select Issue Category" subtitle="Choose the type of issue you're reporting, then continue" />
          <div className="category-line">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onSelectCategory(cat)}
              >
                {category === cat && <CheckCircle2 size={16} strokeWidth={ICON_STROKE} />}
                {cat}
              </button>
            ))}
          </div>
        </div>
        <NavRow onBack={onBack} onNext={onNext} showBack={false} />
      </div>
    );
  }

  if (card.type === 'question') {
    const q = card.question;
    const totalQuestions = card.totalQuestions;
    const questionNumber = card.questionIndex + 1;

    return (
      <>
        <div className="question-card">
          <div className="question-card-body">
            <span className="question-counter" style={{ display: 'inline-block', marginBottom: 'var(--space-3)' }}>
              {questionNumber}/{totalQuestions}
            </span>
            <CardHeader icon={CircleHelp} title={category} subtitle="Context questionnaire — helps assess urgency" />
            <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>{q.question}</p>
          </div>
          <div>
            <div className="flex gap-2">
              <button
                type="button"
                className={`btn ${answers[q.id] === 'Yes' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => onToggleAnswer(q.id, 'Yes')}
              >
                Yes
              </button>
              <button
                type="button"
                className={`btn ${answers[q.id] === 'No' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => onToggleAnswer(q.id, 'No')}
              >
                No
              </button>
            </div>
            <NavRow onBack={onBack} onNext={onNext} showBack={showBack} />
          </div>
        </div>

        <div className="priority-box" style={{ '--priority-bg': PRIORITY_BG[urgency.level] }}>
          <span className="text-mono-label">Live Priority Score</span>
          <span className="text-mono" style={{ fontWeight: 600 }}>
            {urgency.level}
          </span>
        </div>
      </>
    );
  }

  if (card.type === 'title') {
    return (
      <div className="question-card">
        <div className="question-card-body">
          <CardHeader icon={FileText} title="Subject / Title" subtitle="A short, clear summary of the issue" />
          <div className="field">
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
        </div>
        <NavRow onBack={onBack} onNext={onNext} showBack={showBack} />
      </div>
    );
  }

  if (card.type === 'description') {
    return (
      <div className="question-card">
        <div className="question-card-body">
          <CardHeader icon={AlignLeft} title="Detailed Explanation" subtitle="Describe the complaint so field staff can locate and resolve it quickly" />
          <div className="field">
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
        </div>
        <NavRow onBack={onBack} onNext={onNext} showBack={showBack} />
      </div>
    );
  }

  if (card.type === 'location') {
    return (
      <div className="question-card">
        <div className="question-card-body">
          <CardHeader icon={MapPin} title="Specific Location" subtitle="Ward, street, or landmark so the issue can be found" />
          <div className="field">
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
        </div>
        <NavRow onBack={onBack} onNext={onNext} showBack={showBack} />
      </div>
    );
  }

  if (card.type === 'upload') {
    return (
      <div className="question-card">
        <div className="question-card-body">
          <CardHeader icon={CloudUpload} title="Supporting Photographs" subtitle="Optional — up to 3 images (PNG, JPG, JPEG)" />
          <div
            className="flex-col items-center"
            style={{
              border: '1px dashed var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)',
              textAlign: 'center',
              cursor: 'pointer',
            }}
            onClick={() => document.getElementById('file-upload-input').click()}
          >
            <CloudUpload size={22} strokeWidth={ICON_STROKE} style={{ color: 'var(--accent)', marginBottom: 'var(--space-2)' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>Click or drag images here</p>
            <span className="text-small">Upload photos showing the issue (PNG, JPG, JPEG)</span>
          </div>
          <input type="file" id="file-upload-input" style={{ display: 'none' }} multiple accept="image/*" onChange={onFileChange} />

          {files.length > 0 && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <p className="text-mono-label" style={{ marginBottom: 'var(--space-2)' }}>
                Attached ({files.length}/3)
              </p>
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
        <NavRow onBack={onBack} onNext={onNext} showBack={showBack} />
      </div>
    );
  }

  if (card.type === 'name') {
    return (
      <div className="question-card">
        <div className="question-card-body">
          <CardHeader icon={User} title="Full Name" subtitle="So we know who filed this complaint" />
          <div className="field">
            <input type="text" name="name" className="input" placeholder="e.g. John Doe" value={formData.name} onChange={onInputChange} required />
          </div>
        </div>
        <NavRow onBack={onBack} onNext={onNext} showBack={showBack} />
      </div>
    );
  }

  if (card.type === 'email') {
    return (
      <div className="question-card">
        <div className="question-card-body">
          <CardHeader icon={Mail} title="Email Address" subtitle="Your Tracking ID and resolution receipt are sent here" />
          <div className="field">
            <input type="email" name="email" className="input" placeholder="name@email.com" value={formData.email} onChange={onInputChange} required />
          </div>
        </div>
        <NavRow onBack={onBack} onNext={onNext} showBack={showBack} />
      </div>
    );
  }

  if (card.type === 'phone') {
    return (
      <div className="question-card">
        <div className="question-card-body">
          <CardHeader icon={Phone} title="Phone Number (Optional)" subtitle="In case field staff need to reach you directly" />
          <div className="field">
            <input type="tel" name="phone" className="input" placeholder="10-digit mobile number" value={formData.phone} onChange={onInputChange} />
          </div>
        </div>
        <NavRow onBack={onBack} onNext={onNext} showBack={showBack} />
      </div>
    );
  }

  // card.type === 'review'
  return (
    <form className="question-card question-card--auto" onSubmit={onSubmit}>
      <div className="question-card-body">
        <CardHeader icon={ShieldCheck} title="Complaint Submission Review" subtitle="Confirm the details, then request your email OTP" />
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
          <div className="field-row">
            <dt>Name</dt>
            <dd>{formData.name}</dd>
          </div>
          <div className="field-row">
            <dt>Email</dt>
            <dd>{formData.email}</dd>
          </div>
        </dl>
      </div>
      <div
        className="flex justify-between"
        style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}
      >
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} strokeWidth={ICON_STROKE} />
          Back
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
    </form>
  );
};

export default ReportStep;
