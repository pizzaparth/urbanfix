import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { downloadReceipt } from '../utils/downloadReceipt.js';

const handleBtnOver = (e, hoverBg, hoverBorder) => {
  e.currentTarget.style.backgroundColor = hoverBg;
  e.currentTarget.style.borderColor = hoverBorder || hoverBg;
  e.currentTarget.style.transform = 'translateY(-2px)';
  e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.12)';
};

const handleBtnOut = (e, baseBg, baseBorder) => {
  e.currentTarget.style.backgroundColor = baseBg;
  e.currentTarget.style.borderColor = baseBorder || baseBg;
  e.currentTarget.style.transform = 'none';
  e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.05)';
};

const ComplaintCard = ({ item }) => {
  return (
    <div className="card h-100 border-0 bg-white p-4" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(15,23,42,.04)' }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-3 gap-2">
        <div>
          <span className="badge rounded-pill fw-bold px-3 py-1 me-2" style={{ backgroundColor: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1' }}>
            {item.category}
          </span>
          <span className="fw-bold small" style={{ color: '#1E293B' }}>
            <i className="bi bi-geo-alt-fill text-danger me-1"></i>{item.location}
          </span>
        </div>
        <div><StatusBadge status={item.status} /></div>
      </div>

      <h3 className="fs-5 fw-bold mb-2" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
        {item.title}
      </h3>

      <div className="d-flex align-items-center mb-3" style={{ fontSize: '0.85rem' }}>
        <span className="me-3 fw-medium" style={{ color: '#1E293B' }}>
          Tracking ID: <code style={{ color: '#2563EB', fontWeight: 'bold', fontSize: '0.85rem' }}>{item.trackingId}</code>
        </span>
        <span className="fw-medium" style={{ color: '#1E293B' }}>
          <i className="bi bi-calendar3 me-1"></i>Filed: {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="small mb-4 fw-medium text-justify" style={{ color: '#1E293B', lineHeight: '1.6' }}>
        {item.description}
      </p>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center pt-3 border-top gap-2 mt-auto">
        <Link
          to={`/track?id=${item.trackingId}`}
          className="btn text-white fw-bold px-3 py-2 text-nowrap d-inline-flex align-items-center justify-content-center"
          style={{
            backgroundColor: '#2563EB',
            borderColor: '#2563EB',
            borderRadius: '8px',
            fontSize: '0.85rem',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)',
            transition: 'all 0.2s ease-in-out',
          }}
          onMouseOver={(e) => handleBtnOver(e, '#1D4ED8')}
          onMouseOut={(e) => handleBtnOut(e, '#2563EB')}
        >
          <img src="/search.svg" alt="" style={{ width: '16px', height: '16px' }} className="me-1" /> Track Progress <i className="bi bi-arrow-right ms-1"></i>
        </Link>

        {item.status === 'Resolved' && (
          <button
            className="btn text-white fw-bold px-3 py-2 text-nowrap d-inline-flex align-items-center justify-content-center"
            style={{
              backgroundColor: '#10B981',
              borderColor: '#10B981',
              borderRadius: '8px',
              fontSize: '0.85rem',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)',
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseOver={(e) => handleBtnOver(e, '#059669')}
            onMouseOut={(e) => handleBtnOut(e, '#10B981')}
            onClick={() => downloadReceipt(item.trackingId)}
          >
            <i className="bi bi-file-earmark-pdf-fill me-1"></i> Download PDF Receipt
          </button>
        )}
      </div>
    </div>
  );
};

export default ComplaintCard;
