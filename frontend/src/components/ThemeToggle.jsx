import React from 'react';
import { useTheme } from '../hooks/useTheme.js';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="rocker"
      role="switch"
      aria-checked={isDark}
      aria-pressed={isDark}
      aria-label="Toggle Ledger / Blueprint theme"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Ledger (light)' : 'Switch to Blueprint (dark)'}
    >
      <span className="mark sun">☀</span>
      <span className="mark moon">●</span>
      <span className="knob"></span>
    </button>
  );
};

export default ThemeToggle;
