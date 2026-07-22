import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout.jsx';
import StatsCounterCard from '../../components/StatsCounterCard.jsx';
import TutorialSection from '../../components/TutorialSection.jsx';
import api from '../../services/api.js';

const TUTORIALS = [
  {
    iconSrc: '/circle-plus.svg',
    iconBg: '#DCFCE7',
    title: 'Tutorial 1: How to Submit a Public Complaint',
    subtitle: 'Account-less friction-free 3-step filing workflow',
    ctaTo: '/file-complaint',
    ctaLabel: 'Start Filing Now',
    ctaColor: '#10B981',
    ctaHoverColor: '#059669',
    steps: [
      {
        title: 'Select Category & Answer Context Questionnaire',
        description: 'Choose your issue category (e.g. Road Damage, Water Leakage) and answer dynamic Yes/No questions to help municipal teams assess urgency.',
      },
      {
        title: 'Provide Location, Description & Photographs',
        description: 'Enter the specific location (ward/landmarks), describe the issue in detail, and attach up to 3 supporting photographs.',
      },
      {
        title: 'Verify Email OTP & Receive Tracking ID',
        description: (
          <>
            Enter your email address, request a 6-digit OTP code, verify identity, and receive your unique{' '}
            <code style={{ color: '#2563EB' }}>COMP-XXXXX-X</code> tracking ID.
          </>
        ),
      },
    ],
  },
  {
    iconSrc: '/notebook-test.svg',
    iconBg: '#DBEAFE',
    title: 'Tutorial 2: How to Use the Public Registry',
    subtitle: 'Explore public records, status logs & resolution receipts',
    ctaTo: '/registry',
    ctaLabel: 'Explore Registry',
    ctaColor: '#2563EB',
    ctaHoverColor: '#1D4ED8',
    steps: [
      {
        title: 'Access Public Registry Page',
        description: (
          <>
            Click <strong>"Public Registry"</strong> in the navigation header or homepage card to view all publicly registered tickets (PII redacted).
          </>
        ),
      },
      {
        title: 'Search & Filter by Location or Status',
        description: 'Use the search bar to filter complaints by area/ward location, category type, or status (Pending, In Progress, Resolved, Rejected).',
      },
      {
        title: 'Track Progress & Download Resolution Receipts',
        description: (
          <>
            Click <strong>"Track Progress"</strong> to inspect the live audit log timeline, or click <strong>"PDF Receipt"</strong> for resolved tickets to download official reports.
          </>
        ),
      },
    ],
  },
  {
    iconSrc: '/search.svg',
    iconBg: '#FEF3C7',
    title: 'Tutorial 3: How to Track a Complaint Status',
    subtitle: 'Real-time audit log timeline, official remarks & resolution receipts',
    ctaTo: '/track',
    ctaLabel: 'Track Status Now',
    ctaColor: '#F59E0B',
    ctaHoverColor: '#D97706',
    steps: [
      {
        title: 'Locate Your Unique Tracking ID',
        description: (
          <>
            Obtain your 10-character <code style={{ color: '#2563EB' }}>COMP-XXXXX-X</code> tracking ID displayed upon complaint submission or sent to your registered email.
          </>
        ),
      },
      {
        title: 'Enter ID into the Tracking Portal',
        description: (
          <>
            Navigate to the <strong>"Track Complaint"</strong> page via the navigation bar, paste your Tracking ID into the search input, and click Search.
          </>
        ),
      },
      {
        title: 'Inspect Live Timeline & Download Report',
        description: 'View real-time status transitions (Pending → In Progress → Resolved), official municipal remarks, and download your official PDF resolution receipt.',
      },
    ],
  },
];

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
      {/* 1. Repository Overview Counter Section (Centered, Glassmorphic Container, Title on Top of Number) */}
      <StatsCounterCard statusBreakdown={stats?.statusBreakdown} />

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
              <div className="rounded-circle mx-auto d-flex align-items-center justify-content-center flex-shrink-0 mb-3" style={{ width: '56px', height: '56px', backgroundColor: '#DBEAFE' }}>
                <img src="/notebook-test.svg" alt="Public Registry" style={{ width: '28px', height: '28px' }} />
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
              <div className="rounded-circle mx-auto d-flex align-items-center justify-content-center flex-shrink-0 mb-3" style={{ width: '56px', height: '56px', backgroundColor: '#DCFCE7' }}>
                <img src="/circle-plus.svg" alt="File a Complaint" style={{ width: '28px', height: '28px' }} />
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
              <div className="rounded-circle mx-auto d-flex align-items-center justify-content-center flex-shrink-0 mb-3" style={{ width: '56px', height: '56px', backgroundColor: '#FEF3C7' }}>
                <img src="/search.svg" alt="Track Progress" style={{ width: '28px', height: '28px' }} />
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
            {TUTORIALS.map((tutorial, idx) => (
              <TutorialSection key={idx} {...tutorial} />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
