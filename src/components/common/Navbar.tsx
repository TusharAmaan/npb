import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NPBLogo } from './NPBLogo';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Trophy,
  PhoneCall,
  LogOut,
  ShieldCheck,
  UserCheck,
  Menu,
} from 'lucide-react';

export const Navbar: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { currentUser, isAdmin, logout } = useAuth();
  const { settings } = useData();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-dark-border bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + NPB Logo & Tutor Branding */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <NPBLogo size={38} className="transition-transform group-hover:scale-105" />
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-light-indigo via-light-slate-blue to-spiro-disco-ball bg-clip-text text-transparent">
                {settings.platformName || 'NPB'}
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {settings.tutorName || 'Abdullah All Masum'}
              </span>
            </div>
          </Link>
        </div>

        {/* Center / Right: WhatsApp Direct + Leaderboard + Theme + Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* WhatsApp Direct Link */}
          <a
            href={`https://wa.me/880${settings.whatsappNumber || '01619663933'}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Chat with Tutor Abdullah All Masum on WhatsApp"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-weird-green/10 text-emerald-600 dark:text-wintergreen border border-weird-green/30 hover:bg-weird-green/20 transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5 text-weird-green" />
            <span>01619663933</span>
          </a>

          {/* Public Leaderboard Shortcut */}
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-radiant-yellow/15 text-amber-700 dark:text-radiant-yellow hover:bg-radiant-yellow/25 transition-all border border-radiant-yellow/30 shadow-xs"
          >
            <Trophy className="w-4 h-4 text-radiant-yellow" />
            <span className="hidden xs:inline">Leaderboard</span>
          </Link>

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* Admin Profile / Login Controls */}
          {isAdmin ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-700">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-weird-green" />
                  Admin
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                  {currentUser?.email || 'Abdullah All Masum'}
                </span>
              </div>
              <button
                onClick={() => logout()}
                title="Logout"
                className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm hover:shadow-indigo-500/20 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
