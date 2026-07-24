import { Tags, ShieldAlert, CircleHelp, CheckCircle2, ArrowRight } from 'lucide-react';
import { CATEGORIES, CATEGORY_QUESTIONNAIRES } from '../../../constants/categories.js';
import { ICON_STROKE } from '../../../constants/icons.js';

const CategoryStep = ({ category, onSelectCategory, answers, onToggleAnswer, urgency, onNext }) => {
  const currentQuestions = CATEGORY_QUESTIONNAIRES[category] || [];

  return (
    <div className="panel" style={{ marginBottom: 'var(--space-4)' }}>
      <div
        className="flex justify-between items-center flex-wrap gap-2"
        style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{ width: '40px', height: '40px', flexShrink: 0, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--accent)' }}
          >
            <Tags size={18} strokeWidth={ICON_STROKE} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.0625rem' }}>Step 1 — Category &amp; Context Questionnaire</h3>
            <p className="text-small text-muted">Select an issue type to render category-specific urgency questions</p>
          </div>
        </div>

        <span className="status-pill" style={{ '--status-color': urgency.color }}>
          <ShieldAlert size={13} strokeWidth={ICON_STROKE} />
          {urgency.level}
        </span>
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label className="text-small" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>Select Issue Category *</label>
        <div className="grid-12" style={{ gap: 'var(--space-2)' }}>
          {CATEGORIES.map((cat, idx) => (
            <div key={idx} className="col-span-4">
              <button
                type="button"
                className={`btn ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', justifyContent: 'space-between', height: '44px' }}
                onClick={() => onSelectCategory(cat)}
              >
                <span>{cat}</span>
                {category === cat && <CheckCircle2 size={16} strokeWidth={ICON_STROKE} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-1)' }}>
          <CircleHelp size={16} strokeWidth={ICON_STROKE} style={{ color: 'var(--accent)' }} />
          <h4 style={{ fontSize: 'var(--text-body)' }}>{category} Context Questionnaire</h4>
        </div>
        <p className="text-small" style={{ marginBottom: 'var(--space-3)' }}>
          Answering these yes/no questions helps administrative teams assess urgency and prioritize inspection dispatch.
        </p>

        <div className="stack">
          {currentQuestions.map((q, idx) => (
            <div key={q.id} className="panel" style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-3)' }}>
                <span className="text-mono" style={{ color: 'var(--text-muted)' }}>{idx + 1}.</span>
                <span className="text-small" style={{ color: 'var(--text-primary)' }}>{q.question}</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className={`btn btn-sm ${answers[q.id] === 'Yes' ? 'btn-danger' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => onToggleAnswer(q.id, 'Yes')}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${answers[q.id] === 'No' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => onToggleAnswer(q.id, 'No')}
                >
                  No
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex justify-end"
        style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}
      >
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Proceed to Details
          <ArrowRight size={16} strokeWidth={ICON_STROKE} />
        </button>
      </div>
    </div>
  );
};

export default CategoryStep;
