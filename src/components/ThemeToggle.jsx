import React from 'react';
import useTheme from '../hooks/useTheme';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          <i className="bi bi-sun-fill fs-6"></i>
          <span className="d-none d-sm-inline">Light Mode</span>
        </>
      ) : (
        <>
          <i className="bi bi-moon-stars-fill fs-6"></i>
          <span className="d-none d-sm-inline">Dark Mode</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
