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
        <p className="fs-6 text-secondary mx-auto mb-4" style={{ maxWidth: '720px' }}>
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
              <p className="text-secondary small mb-4">
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
              <p className="text-secondary small mb-4">
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
              <p className="text-secondary small mb-4">
                Enter your unique Tracking ID to inspect the live audit log history, official remarks, and resolution status.
              </p>
              <Link to="/track" className="btn btn-warning text-white fw-bold mt-auto border-0" style={{ backgroundColor: '#F59E0B', borderRadius: '8px' }}>
                Track Status <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
