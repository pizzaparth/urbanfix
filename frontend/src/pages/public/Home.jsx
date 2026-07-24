import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NotebookText, CirclePlus, Search, ArrowRight } from 'lucide-react';
import MainLayout from '../../layouts/MainLayout.jsx';
import StatsCounterCard from '../../components/StatsCounterCard.jsx';
import TutorialSection from '../../components/TutorialSection.jsx';
import api from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';

const FEATURE_CARDS = [
  {
    icon: NotebookText,
    title: 'Public Registry',
    description: 'View all publicly registered complaints, search by area location, and filter by category or status.',
    to: '/registry',
    label: 'Browse Registry',
  },
  {
    icon: CirclePlus,
    title: 'File a Complaint',
    description: 'Report local road, sanitation, water, or electricity issues through our interactive questionnaire flow.',
    to: '/file-complaint',
    label: 'File Issue Now',
  },
  {
    icon: Search,
    title: 'Track Progress',
    description: 'Enter your unique Tracking ID to inspect the live audit log history, official remarks, and resolution status.',
    to: '/track',
    label: 'Track Status',
  },
];

const TUTORIALS = [
  {
    icon: CirclePlus,
    title: 'How to Submit a Public Complaint',
    subtitle: 'Account-less, friction-free 3-step filing workflow',
    ctaTo: '/file-complaint',
    ctaLabel: 'Start Filing',
    steps: [
      {
        title: 'Select category & answer the context questionnaire',
        description: 'Choose your issue category (e.g. Road Damage, Water Leakage) and answer dynamic yes/no questions to help municipal teams assess urgency.',
      },
      {
        title: 'Provide location, description & photographs',
        description: 'Enter the specific location (ward/landmarks), describe the issue in detail, and attach up to 3 supporting photographs.',
      },
      {
        title: 'Verify email OTP & receive tracking ID',
        description: (
          <>
            Enter your email address, request a 6-digit OTP code, verify identity, and receive your unique{' '}
            <span className="text-mono" style={{ color: 'var(--accent)' }}>COMP-XXXXX-X</span> tracking ID.
          </>
        ),
      },
    ],
  },
  {
    icon: NotebookText,
    title: 'How to Use the Public Registry',
    subtitle: 'Explore public records, status logs & resolution receipts',
    ctaTo: '/registry',
    ctaLabel: 'Explore Registry',
    steps: [
      {
        title: 'Access the public registry page',
        description: 'Open "Public Registry" from the navigation header or homepage card to view all publicly registered tickets (PII redacted).',
      },
      {
        title: 'Search & filter by location or status',
        description: 'Use the search bar to filter complaints by area/ward location, category type, or status (Pending, In Progress, Resolved, Rejected).',
      },
      {
        title: 'Track progress & download resolution receipts',
        description: 'Open "Track Progress" to inspect the live audit log timeline, or "PDF Receipt" for resolved tickets to download official reports.',
      },
    ],
  },
  {
    icon: Search,
    title: 'How to Track a Complaint Status',
    subtitle: 'Real-time audit log timeline, official remarks & resolution receipts',
    ctaTo: '/track',
    ctaLabel: 'Track Status',
    steps: [
      {
        title: 'Locate your unique tracking ID',
        description: (
          <>
            Obtain your 10-character <span className="text-mono" style={{ color: 'var(--accent)' }}>COMP-XXXXX-X</span> tracking ID displayed
            upon complaint submission or sent to your registered email.
          </>
        ),
      },
      {
        title: 'Enter the ID into the tracking portal',
        description: 'Navigate to "Track Complaint" via the navigation bar, paste your tracking ID into the search input, and search.',
      },
      {
        title: 'Inspect the live timeline & download the report',
        description: 'View real-time status transitions (Pending → In Progress → Resolved), official municipal remarks, and download your official PDF resolution receipt.',
      },
    ],
  },
];

const Home = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await api.get('/public/stats');
        setStats(statsRes.data.stats);
      } catch (err) {
        console.error('Error fetching portal statistics:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <MainLayout>
      <StatsCounterCard statusBreakdown={stats?.statusBreakdown} className="panel" />

      <div className="blueprint-guides" style={{ textAlign: 'center', padding: 'var(--space-8) 0 var(--space-7)' }}>
        <h1 className="text-display" style={{ marginBottom: 'var(--space-4)' }}>
          Smart Digital Public Administration &amp; Transparency
        </h1>
        <p className="text-secondary" style={{ maxWidth: '640px', margin: '0 auto', fontSize: 'var(--text-body)' }}>
          Connecting community members and municipal authorities. Report public issues, verify identity securely via
          email OTP, monitor real-time ticket progress, and access transparent public records.
        </p>
      </div>

      <div className="grid-12" style={{ marginBottom: 'var(--space-8)' }}>
        {FEATURE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div className="col-span-4" key={card.title}>
              <div className="panel flex-col" style={{ height: '100%' }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--accent)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <Icon size={20} strokeWidth={ICON_STROKE} />
                </div>
                <h3 style={{ marginBottom: 'var(--space-2)' }}>{card.title}</h3>
                <p className="text-small" style={{ flex: 1, marginBottom: 'var(--space-4)' }}>
                  {card.description}
                </p>
                <Link to={card.to} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
                  {card.label}
                  <ArrowRight size={14} strokeWidth={ICON_STROKE} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-h1)', marginBottom: 'var(--space-2)' }}>How to Use the UrbanFix Portal</h2>
        <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto', fontSize: 'var(--text-body)' }}>
          Step-by-step guidance for filing public complaints and exploring the public transparency registry.
        </p>
      </div>

      <div className="stack">
        {TUTORIALS.map((tutorial) => (
          <TutorialSection key={tutorial.title} {...tutorial} />
        ))}
      </div>
    </MainLayout>
  );
};

export default Home;
