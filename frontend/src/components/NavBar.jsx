import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ICON_STROKE } from '../constants/icons.js';

const NavBar = ({ brandTo = '/', brandLabel = 'UrbanFix', items = [], actions }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = (path) => location.pathname === path;
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  return (
    <nav className="navbar">
      <div className="container">
        <Link to={brandTo} className="navbar-brand" onClick={closeMenu}>
          {brandLabel}
        </Link>

        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={20} strokeWidth={ICON_STROKE} /> : <Menu size={20} strokeWidth={ICON_STROKE} />}
        </button>

        <div className={`navbar-collapse ${open ? 'open' : ''}`}>
          <div className="navbar-links">
            {items.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`nav-link ${isActive(to) ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <Icon size={16} strokeWidth={ICON_STROKE} />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="navbar-actions">{actions}</div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
