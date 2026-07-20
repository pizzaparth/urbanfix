import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout.jsx';
import api from '../../services/api.js';

const Home = () => {
  const [stats, setStats] = useState(null);

  // Fetch Public Stats Overview
  const fetchStats = async () => {
    try {
      const statsRes = await api.get('/public/stats');
      setStats(statsRes.data.stats);
    } catch (err) {
      console.error('Error fetching portal statistics:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Uniform Hover Effect Handlers for Tutorial Buttons
  const handleTutorialBtnOver = (e, hoverColor) => {
    e.currentTarget.style.backgroundColor = hoverColor;
    e.currentTarget.style.borderColor = hoverColor;
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 23, 42, 0.15)';
  };

  const handleTutorialBtnOut = (e, baseColor) => {
    e.currentTarget.style.backgroundColor = baseColor;
    e.currentTarget.style.borderColor = baseColor;
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.06)';
  };

  return (
    <MainLayout>
      {/* 1. Repository Overview Counter Section (Centered, No Cards, Title on Top of Number) */}
      <div className="py-4 px-3 mb-5 rounded-3 bg-white" style={{ border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15,23,42,.04)' }}>
        <div className="row g-4 text-center justify-content-center align-items-center">
          <div className="col-12 col-md">
            <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
              <span
                className="fw-bold text-uppercase mb-1"
                style={{
                  color: '#000000',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.85rem',
                  letterSpacing: '0.05em',
                }}
              >
                Total Issues
              </span>
              <span className="display-6 fw-bold mb-0" style={{ color: '#2563EB', fontFamily: 'Inter, sans-serif' }}>
                {stats?.statusBreakdown?.total || 0}
              </span>
            </div>
          </div>

          <div className="col-12 col-md">
            <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
              <span
                className="fw-bold text-uppercase mb-1"
                style={{
                  color: '#000000',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.85rem',
                  letterSpacing: '0.05em',
                }}
              >
                Pending
              </span>
              <span className="display-6 fw-bold mb-0" style={{ color: '#F59E0B', fontFamily: 'Inter, sans-serif' }}>
                {stats?.statusBreakdown?.Pending || 0}
              </span>
            </div>
          </div>

          <div className="col-12 col-md">
            <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
              <span
                className="fw-bold text-uppercase mb-1"
                style={{
                  color: '#000000',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.85rem',
                  letterSpacing: '0.05em',
                }}
              >
                In Progress
              </span>
              <span className="display-6 fw-bold mb-0" style={{ color: '#06B6D4', fontFamily: 'Inter, sans-serif' }}>
                {stats?.statusBreakdown?.['In Progress'] || 0}
              </span>
            </div>
          </div>

          <div className="col-12 col-md">
            <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
              <span
                className="fw-bold text-uppercase mb-1"
                style={{
                  color: '#000000',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.85rem',
                  letterSpacing: '0.05em',
                }}
              >
                Resolved
              </span>
              <span className="display-6 fw-bold mb-0" style={{ color: '#22C55E', fontFamily: 'Inter, sans-serif' }}>
                {stats?.statusBreakdown?.Resolved || 0}
              </span>
            </div>
          </div>

          <div className="col-12 col-md">
            <div className="d-flex flex-column align-items-center justify-content-center py-2 py-md-0">
              <span
                className="fw-bold text-uppercase mb-1"
                style={{
                  color: '#000000',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.85rem',
                  letterSpacing: '0.05em',
                }}
              >
                Rejected
              </span>
              <span className="display-6 fw-bold mb-0" style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
                {stats?.statusBreakdown?.Rejected || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Portal Hero & Feature Quick Navigation Cards */}
      <div className="text-center py-4 mb-5">
        <h1 className="display-6 fw-bold mb-3" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
          Smart Digital Public Administration & Transparency
        </h1>
        <p className="fs-6 fw-medium mx-auto mb-4" style={{ maxWidth: '720px', color: '#1E293B' }}>
          Connecting community members and municipal authorities. Report public issues, verify identity securely via email OTP, monitor real-time ticket progress, and access transparent public records.
        </p>

        <div className="row g-4 mt-2">
          {/* Card 1: Public Registry */}
          <div className="col-md-4">
            <div className="card h-100 border-0 p-4 bg-white shadow-sm text-center" style={{ border: '1px solid #E2E8F0', borderRadius: '12px' }}>
              <div className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '56px', height: '56px', backgroundColor: '#DBEAFE' }}>
                <i className="bi bi-journal-text fs-3" style={{ color: '#2563EB' }}></i>
              </div>
              <h3 className="fs-5 fw-bold mb-2" style={{ color: '#0F172A' }}>Public Registry</h3>
              <p className="small mb-4 fw-medium" style={{ color: '#1E293B' }}>
                View all publicly registered complaints, search by area location, and filter by category or status.
              </p>
              <Link to="/registry" className="btn btn-primary fw-bold mt-auto border-0" style={{ backgroundColor: '#2563EB', borderRadius: '8px' }}>
                Browse Registry <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>

          {/* Card 2: File a Complaint */}
          <div className="col-md-4">
            <div className="card h-100 border-0 p-4 bg-white shadow-sm text-center" style={{ border: '1px solid #E2E8F0', borderRadius: '12px' }}>
              <div className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '56px', height: '56px', backgroundColor: '#DCFCE7' }}>
                <i className="bi bi-plus-circle-fill fs-3" style={{ color: '#10B981' }}></i>
              </div>
              <h3 className="fs-5 fw-bold mb-2" style={{ color: '#0F172A' }}>File a Complaint</h3>
              <p className="small mb-4 fw-medium" style={{ color: '#1E293B' }}>
                Report local road, sanitation, water, or electricity issues through our interactive questionnaire flow.
              </p>
              <Link to="/file-complaint" className="btn btn-success fw-bold mt-auto border-0" style={{ backgroundColor: '#10B981', borderRadius: '8px' }}>
                File Issue Now <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>

          {/* Card 3: Track Progress */}
          <div className="col-md-4">
            <div className="card h-100 border-0 p-4 bg-white shadow-sm text-center" style={{ border: '1px solid #E2E8F0', borderRadius: '12px' }}>
              <div className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '56px', height: '56px', backgroundColor: '#FEF3C7' }}>
                <i className="bi bi-search fs-3" style={{ color: '#F59E0B' }}></i>
              </div>
              <h3 className="fs-5 fw-bold mb-2" style={{ color: '#0F172A' }}>Track Progress</h3>
              <p className="small mb-4 fw-medium" style={{ color: '#1E293B' }}>
                Enter your unique Tracking ID to inspect the live audit log history, official remarks, and resolution status.
              </p>
              <Link to="/track" className="btn btn-warning text-white fw-bold mt-auto border-0" style={{ backgroundColor: '#F59E0B', borderRadius: '8px' }}>
                Track Status <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* 3. User Tutorial & Step-by-Step Guide Section (Full Width, Vertical Timeline Sections) */}
        <div className="mt-5 pt-4 text-start">
          <div className="text-center mb-5">
            <h2 className="display-6 fw-bold mb-2" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
              How to Use the UrbanFix Portal
            </h2>
            <p className="fs-6 fw-medium mx-auto mb-0" style={{ maxWidth: '680px', color: '#1E293B' }}>
              Step-by-step guidelines for filing public complaints and exploring the public transparency registry.
            </p>
          </div>

          <div className="d-flex flex-column gap-5">
            {/* Section 1: How to Submit a Complaint */}
            <section className="py-4 px-3 px-md-4 rounded-3 bg-white" style={{ borderBottom: '2px solid #E2E8F0' }}>
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-3 border-bottom">
                <div className="d-flex align-items-center mb-3 mb-md-0">
                  <div className="rounded-3 p-2 text-primary me-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#DCFCE7', width: '48px', height: '48px' }}>
                    <i className="bi bi-file-earmark-plus-fill fs-4" style={{ color: '#10B981' }}></i>
                  </div>
                  <div>
                    <h3 className="fs-4 fw-bold mb-0" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
                      Tutorial 1: How to Submit a Public Complaint
                    </h3>
                    <span className="small text-muted">Account-less friction-free 3-step filing workflow</span>
                  </div>
                </div>
                {/* Uniform Button Styling */}
                <Link
                  to="/file-complaint"
                  className="btn text-white fw-bold px-4 py-2 text-nowrap d-inline-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: '#10B981',
                    borderColor: '#10B981',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onMouseOver={(e) => handleTutorialBtnOver(e, '#059669')}
                  onMouseOut={(e) => handleTutorialBtnOut(e, '#10B981')}
                >
                  Start Filing Now <i className="bi bi-arrow-right ms-2"></i>
                </Link>
              </div>

              {/* Vertical Steps Container */}
              <div className="ps-2 ps-md-4 py-2">
                {/* Step 1 */}
                <div className="d-flex align-items-start mb-4">
                  <div
                    className="rounded-circle fw-bold text-white me-3 me-md-4 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: '#10B981', width: '40px', height: '40px', fontSize: '0.95rem' }}
                  >
                    1
                  </div>
                  <div className="pt-1">
                    <h4 className="fs-6 fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
                      Select Category & Answer Context Questionnaire
                    </h4>
                    <p className="small mb-0 fw-medium" style={{ color: '#1E293B', lineHeight: '1.6' }}>
                      Choose your issue category (e.g. Road Damage, Water Leakage) and answer dynamic Yes/No questions to help municipal teams assess urgency.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="d-flex align-items-start mb-4">
                  <div
                    className="rounded-circle fw-bold text-white me-3 me-md-4 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: '#10B981', width: '40px', height: '40px', fontSize: '0.95rem' }}
                  >
                    2
                  </div>
                  <div className="pt-1">
                    <h4 className="fs-6 fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
                      Provide Location, Description & Photographs
                    </h4>
                    <p className="small mb-0 fw-medium" style={{ color: '#1E293B', lineHeight: '1.6' }}>
                      Enter the specific location (ward/landmarks), describe the issue in detail, and attach up to 3 supporting photographs.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="d-flex align-items-start">
                  <div
                    className="rounded-circle fw-bold text-white me-3 me-md-4 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: '#10B981', width: '40px', height: '40px', fontSize: '0.95rem' }}
                  >
                    3
                  </div>
                  <div className="pt-1">
                    <h4 className="fs-6 fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
                      Verify Email OTP & Receive Tracking ID
                    </h4>
                    <p className="small mb-0 fw-medium" style={{ color: '#1E293B', lineHeight: '1.6' }}>
                      Enter your email address, request a 6-digit OTP code, verify identity, and receive your unique <code style={{ color: '#2563EB' }}>COMP-XXXXX-X</code> tracking ID.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: How to Use the Public Registry */}
            <section className="py-4 px-3 px-md-4 rounded-3 bg-white" style={{ borderBottom: '2px solid #E2E8F0' }}>
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-3 border-bottom">
                <div className="d-flex align-items-center mb-3 mb-md-0">
                  <div className="rounded-3 p-2 text-primary me-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#DBEAFE', width: '48px', height: '48px' }}>
                    <i className="bi bi-journal-check fs-4" style={{ color: '#2563EB' }}></i>
                  </div>
                  <div>
                    <h3 className="fs-4 fw-bold mb-0" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
                      Tutorial 2: How to Use the Public Registry
                    </h3>
                    <span className="small text-muted">Explore public records, status logs & resolution receipts</span>
                  </div>
                </div>
                {/* Uniform Button Styling */}
                <Link
                  to="/registry"
                  className="btn text-white fw-bold px-4 py-2 text-nowrap d-inline-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: '#2563EB',
                    borderColor: '#2563EB',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onMouseOver={(e) => handleTutorialBtnOver(e, '#1D4ED8')}
                  onMouseOut={(e) => handleTutorialBtnOut(e, '#2563EB')}
                >
                  Explore Registry <i className="bi bi-arrow-right ms-2"></i>
                </Link>
              </div>

              {/* Vertical Steps Container */}
              <div className="ps-2 ps-md-4 py-2">
                {/* Step 1 */}
                <div className="d-flex align-items-start mb-4">
                  <div
                    className="rounded-circle fw-bold text-white me-3 me-md-4 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: '#2563EB', width: '40px', height: '40px', fontSize: '0.95rem' }}
                  >
                    1
                  </div>
                  <div className="pt-1">
                    <h4 className="fs-6 fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
                      Access Public Registry Page
                    </h4>
                    <p className="small mb-0 fw-medium" style={{ color: '#1E293B', lineHeight: '1.6' }}>
                      Click <strong>"Public Registry"</strong> in the navigation header or homepage card to view all publicly registered tickets (PII redacted).
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="d-flex align-items-start mb-4 position-relative" style={{ zIndex: 1 }}>
                  <div
                    className="rounded-circle fw-bold text-white me-3 me-md-4 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: '#2563EB', width: '40px', height: '40px', fontSize: '0.95rem' }}
                  >
                    2
                  </div>
                  <div className="pt-1">
                    <h4 className="fs-6 fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
                      Search & Filter by Location or Status
                    </h4>
                    <p className="small mb-0 fw-medium" style={{ color: '#1E293B', lineHeight: '1.6' }}>
                      Use the search bar to filter complaints by area/ward location, category type, or status (Pending, In Progress, Resolved, Rejected).
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="d-flex align-items-start position-relative" style={{ zIndex: 1 }}>
                  <div
                    className="rounded-circle fw-bold text-white me-3 me-md-4 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: '#2563EB', width: '40px', height: '40px', fontSize: '0.95rem' }}
                  >
                    3
                  </div>
                  <div className="pt-1">
                    <h4 className="fs-6 fw-bold mb-1" style={{ color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
                      Track Progress & Download Resolution Receipts
                    </h4>
                    <p className="small mb-0 fw-medium" style={{ color: '#1E293B', lineHeight: '1.6' }}>
                      Click <strong>"Track Progress"</strong> to inspect the live audit log timeline, or click <strong>"PDF Receipt"</strong> for resolved tickets to download official reports.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
