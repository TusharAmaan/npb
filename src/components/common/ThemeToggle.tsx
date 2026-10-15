import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle Theme"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 border border-slate-200 dark:border-slate-700/60 shadow-sm ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-radiant-yellow animate-spin-slow transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-light-indigo transition-transform hover:-rotate-12" />
      )}
    </button>
  );
};
