import { Link, useLocation } from 'react-router-dom';
import { ICON_STROKE } from '../constants/icons.js';

const NavBar = ({ brandTo = '/', brandLabel = 'UrbanFix', items = [], actions }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container">
        <Link to={brandTo} className="navbar-brand">
          {brandLabel}
        </Link>

        <div className="navbar-links">
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`nav-link ${isActive(to) ? 'active' : ''}`}>
              <Icon size={16} strokeWidth={ICON_STROKE} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        <div className="navbar-actions">{actions}</div>
      </div>
    </nav>
  );
};

export default NavBar;
