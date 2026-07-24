import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ICON_STROKE } from '../constants/icons.js';

// Renders one "How to use the portal" tutorial block: header + CTA + vertical numbered steps + a supporting screenshot.
const TutorialSection = ({ icon: Icon, title, subtitle, ctaTo, ctaLabel, steps, image }) => {
  return (
    <section className="panel">
      <div
        className="flex items-center justify-between flex-wrap gap-3"
        style={{ marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{ width: '40px', height: '40px', flexShrink: 0, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--accent)' }}
          >
            <Icon size={20} strokeWidth={ICON_STROKE} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem' }}>{title}</h3>
            <span className="text-small text-muted">{subtitle}</span>
          </div>
        </div>
        <Link to={ctaTo} className="btn btn-secondary btn-sm">
          {ctaLabel}
          <ArrowRight size={14} strokeWidth={ICON_STROKE} />
        </Link>
      </div>

      <div>
        {steps.map((step, idx) => (
          <div
            className="flex items-start gap-3"
            key={idx}
            style={{ marginBottom: idx < steps.length - 1 ? 'var(--space-4)' : 0 }}
          >
            <div
              className="flex items-center justify-center text-mono"
              style={{
                width: '28px',
                height: '28px',
                flexShrink: 0,
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-mono-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              {idx + 1}
            </div>
            <div>
              <h4 style={{ fontSize: 'var(--text-body)', marginBottom: 'var(--space-1)' }}>{step.title}</h4>
              <p className="text-small">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {image && (
        <div className="tutorial-image-wrap">
          <img src={image} alt={title} className="tutorial-image" loading="lazy" />
        </div>
      )}
    </section>
  );
};

export default TutorialSection;
