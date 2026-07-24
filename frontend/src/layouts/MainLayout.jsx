import { Link, useNavigate } from 'react-router-dom';
import { House, NotebookText, Search, CirclePlus, ShieldCheck, Lock, CircleUserRound, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import NavBar from '../components/NavBar.jsx';
import { ICON_STROKE } from '../constants/icons.js';

const NAV_ITEMS = [
  { to: '/', label: 'Transparency Portal', icon: House },
  { to: '/registry', label: 'Public Registry', icon: NotebookText },
  { to: '/track', label: 'Track Complaint', icon: Search },
];

const MainLayout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <div className="flex-col" style={{ minHeight: '100vh' }}>
      <NavBar
        items={NAV_ITEMS}
        actions={
          <>
            <Link to="/file-complaint" className="btn btn-primary btn-sm">
              <CirclePlus size={16} strokeWidth={ICON_STROKE} />
              File a Complaint
            </Link>

            {user && user.role === 'admin' && (
              <Link to="/admin/dashboard" className="btn btn-secondary btn-sm">
                <ShieldCheck size={16} strokeWidth={ICON_STROKE} />
                Admin Panel
              </Link>
            )}

            {user ? (
              <div className="session-pill">
                <CircleUserRound size={16} strokeWidth={ICON_STROKE} />
                <span>{user.name.split(' ')[0]}</span>
                <span className="tag">{user.role.toUpperCase()}</span>
                <button type="button" className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
                  <LogOut size={15} strokeWidth={ICON_STROKE} />
                </button>
              </div>
            ) : (
              <Link to="/admin/login" className="btn btn-secondary btn-sm">
                <Lock size={16} strokeWidth={ICON_STROKE} />
                Admin Login
              </Link>
            )}
          </>
        }
      />

      <main className="flex-1">
        <div className="container section">{children}</div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: 'var(--space-5) 0' }}>
        <div className="container text-center">
          <p className="text-small text-secondary" style={{ marginBottom: 'var(--space-1)' }}>
            &copy; 2026 UrbanFix — Public Transparency Portal.
          </p>
          <p className="text-mono-label">University Project Exhibition — DSN2098</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
