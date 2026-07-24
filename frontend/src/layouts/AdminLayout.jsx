import { Link, useNavigate } from 'react-router-dom';
import { Gauge, Zap, Globe, CircleUserRound, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import NavBar from '../components/NavBar.jsx';
import { ICON_STROKE } from '../constants/icons.js';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/admin/action', label: 'Action Panel', icon: Zap },
];

const AdminLayout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <div className="flex-col" style={{ minHeight: '100vh' }}>
      <NavBar
        brandTo="/admin/dashboard"
        items={NAV_ITEMS}
        actions={
          <>
            <Link to="/" className="btn btn-secondary btn-sm">
              <Globe size={16} strokeWidth={ICON_STROKE} />
              Public Portal
            </Link>

            <div className="session-pill">
              <CircleUserRound size={16} strokeWidth={ICON_STROKE} />
              <span>{user?.name ? user.name.split(' ')[0] : 'Admin'}</span>
              <span className="tag">ADMIN</span>
              <button type="button" className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
                <LogOut size={15} strokeWidth={ICON_STROKE} />
              </button>
            </div>
          </>
        }
      />

      <main className="flex-1">
        <div className="container section">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
