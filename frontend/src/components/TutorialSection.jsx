import React from 'react';
import { Link } from 'react-router-dom';

const handleBtnOver = (e, hoverColor) => {
  e.currentTarget.style.backgroundColor = hoverColor;
  e.currentTarget.style.borderColor = hoverColor;
  e.currentTarget.style.transform = 'translateY(-2px)';
  e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 23, 42, 0.15)';
};

const handleBtnOut = (e, baseColor) => {
  e.currentTarget.style.backgroundColor = baseColor;
  e.currentTarget.style.borderColor = baseColor;
  e.currentTarget.style.transform = 'none';
  e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.06)';
};

// Renders one "How to use the portal" tutorial block: header + CTA + vertical numbered steps.
const TutorialSection = ({ iconSrc, iconBg, title, subtitle, ctaTo, ctaLabel, ctaColor, ctaHoverColor, steps }) => {
  return (
    <section className="card glass-card py-4 px-3 px-md-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-3 border-bottom">
        <div className="d-flex align-items-center mb-3 mb-md-0">
          <div className="rounded-3 p-2 text-primary me-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: iconBg, width: '48px', height: '48px' }}>
            <img src={iconSrc} alt={title} style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h3 className="fs-4 fw-bold mb-0" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
              {title}
            </h3>
            <span className="small text-muted">{subtitle}</span>
          </div>
        </div>
        <Link
          to={ctaTo}
          className="btn text-white fw-bold px-4 py-2 text-nowrap d-inline-flex align-items-center justify-content-center"
          style={{
            backgroundColor: ctaColor,
            borderColor: ctaColor,
            borderRadius: '8px',
            fontSize: '0.9rem',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
            transition: 'all 0.2s ease-in-out',
          }}
          onMouseOver={(e) => handleBtnOver(e, ctaHoverColor)}
          onMouseOut={(e) => handleBtnOut(e, ctaColor)}
        >
          {ctaLabel} <i className="bi bi-arrow-right ms-2"></i>
        </Link>
      </div>

      <div className="ps-2 ps-md-4 py-2">
        {steps.map((step, idx) => (
          <div className={`d-flex align-items-start ${idx < steps.length - 1 ? 'mb-4' : ''}`} key={idx}>
            <div
              className="rounded-circle fw-bold text-white me-3 me-md-4 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: ctaColor, width: '40px', height: '40px', fontSize: '0.95rem' }}
            >
              {idx + 1}
            </div>
            <div className="pt-1">
              <h4 className="fs-6 fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
                {step.title}
              </h4>
              <p className="small mb-0 fw-medium" style={{ color: '#1E293B', lineHeight: '1.6' }}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TutorialSection;
