import React from 'react';
import { CATEGORIES, CATEGORY_QUESTIONNAIRES } from '../../../constants/categories.js';

const CategoryStep = ({ category, onSelectCategory, answers, onToggleAnswer, urgency, onNext }) => {
  const currentQuestions = CATEGORY_QUESTIONNAIRES[category] || [];

  return (
    <div className="card border-0 p-3 p-md-4 bg-white mb-4" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(15,23,42,.06)' }}>
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 pb-3 border-bottom gap-2">
        <div className="d-flex align-items-center">
          <div className="p-2 rounded-3 text-primary me-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ backgroundColor: '#DBEAFE', width: '44px', height: '44px' }}>
            <i className="bi bi-tags-fill fs-5" style={{ color: '#2563EB' }}></i>
          </div>
          <div>
            <h3 className="fs-5 fw-bold mb-0" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>Step 1: Category & Context Questionnaire</h3>
            <p className="small mb-0 fw-medium" style={{ color: '#1E293B' }}>Select issue type to render category-specific urgency questions</p>
          </div>
        </div>

        {/* Calculated Urgency Badge */}
        <span className="badge px-3 py-2 fw-bold d-inline-flex align-items-center align-self-start align-self-sm-center" style={{ backgroundColor: urgency.bg, color: urgency.color, fontSize: '0.85rem' }}>
          <i className="bi bi-shield-exclamation me-1 fs-6"></i> {urgency.level}
        </span>
      </div>

      {/* Category Grid Cards */}
      <div className="mb-4">
        <label className="form-label small fw-bold mb-2" style={{ color: '#0F172A' }}>Select Issue Category *</label>
        <div className="row g-2">
          {CATEGORIES.map((cat, idx) => (
            <div key={idx} className="col-12 col-sm-6 col-md-4">
              <button
                type="button"
                className={`btn w-100 p-3 text-start border-2 rounded-3 d-flex align-items-center justify-content-between ${
                  category === cat ? 'btn-primary text-white border-primary' : 'btn-light text-dark border-light-subtle'
                }`}
                style={{
                  backgroundColor: category === cat ? '#2563EB' : '#FFFFFF',
                  borderColor: category === cat ? '#2563EB' : '#CBD5E1',
                  transition: 'all 0.2s',
                }}
                onClick={() => onSelectCategory(cat)}
              >
                <span className="fw-semibold small">{cat}</span>
                {category === cat && <i className="bi bi-check-circle-fill text-white fs-6"></i>}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Yes/No Questionnaire Section */}
      <div className="p-3 p-md-4 rounded-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <div className="d-flex align-items-center mb-2">
          <i className="bi bi-question-circle-fill me-2 text-primary fs-5"></i>
          <h4 className="fs-6 fw-bold mb-0" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
            {category} Context Questionnaire
          </h4>
        </div>
        <p className="small mb-3 fw-medium" style={{ color: '#1E293B' }}>
          Answering these Yes/No questions helps administrative teams assess urgency and prioritize inspection dispatch.
        </p>
        <div className="d-flex flex-column gap-3">
          {currentQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="p-3 glass-card rounded-3 d-flex flex-column gap-3 hover-shadow-card"
              style={{ border: '1px solid rgba(203, 213, 225, 0.8)' }}
            >
              <div className="d-flex align-items-center">
                <span className="badge bg-primary-subtle text-primary rounded-circle p-2 me-2 flex-shrink-0 d-inline-flex align-items-center justify-content-center" style={{ width: '26px', height: '26px', fontSize: '0.8rem' }}>
                  {idx + 1}
                </span>
                <span className="small fw-semibold" style={{ color: '#0F172A', lineHeight: '1.5' }}>
                  {q.question}
                </span>
              </div>

              <div className="btn-group w-100" role="group" style={{ maxWidth: '240px' }}>
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-2 fw-bold w-50 text-transition ${answers[q.id] === 'Yes' ? 'btn-danger shadow-sm' : 'btn-outline-secondary'}`}
                  onClick={() => onToggleAnswer(q.id, 'Yes')}
                  style={{
                    backgroundColor: answers[q.id] === 'Yes' ? '#EF4444' : 'rgba(255, 255, 255, 0.65)',
                    color: answers[q.id] === 'Yes' ? '#FFFFFF' : '#1E293B',
                    borderColor: answers[q.id] === 'Yes' ? '#EF4444' : 'rgba(203, 213, 225, 0.8)',
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                  }}
                >
                  <i className={`bi ${answers[q.id] === 'Yes' ? 'bi-check-circle-fill me-1' : ''}`}></i> Yes
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 py-2 fw-bold w-50 text-transition ${answers[q.id] === 'No' ? 'btn-success shadow-sm' : 'btn-outline-secondary'}`}
                  onClick={() => onToggleAnswer(q.id, 'No')}
                  style={{
                    backgroundColor: answers[q.id] === 'No' ? '#10B981' : 'rgba(255, 255, 255, 0.65)',
                    color: answers[q.id] === 'No' ? '#FFFFFF' : '#1E293B',
                    borderColor: answers[q.id] === 'No' ? '#10B981' : 'rgba(203, 213, 225, 0.8)',
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                  }}
                >
                  <i className={`bi ${answers[q.id] === 'No' ? 'bi-check-circle-fill me-1' : ''}`}></i> No
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-sm-end mt-4 pt-3 border-top gap-2">
        <button
          type="button"
          className="btn btn-primary px-4 py-2 fw-bold d-inline-flex align-items-center justify-content-center w-100 w-sm-auto"
          onClick={onNext}
          style={{ backgroundColor: '#2563EB', borderRadius: '8px' }}
        >
          Proceed to Details <i className="bi bi-arrow-right ms-2"></i>
        </button>
      </div>
    </div>
  );
};

export default CategoryStep;
