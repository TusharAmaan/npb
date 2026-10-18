import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Users,
  Layers,
  BookOpenCheck,
  GraduationCap,
  Sparkles,
  Trophy,
  Sliders,
  Settings,
  X,
  FileSpreadsheet,
  AlertTriangle,
  CalendarClock,
  Landmark,
  BookOpen,
  Target,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    {
      to: '/admin/dashboard',
      label: 'Home Dashboard',
      icon: LayoutDashboard,
      color: 'text-light-indigo',
    },
    {
      to: '/admin/live-class',
      label: 'Live Class Mode',
      icon: Radio,
      badge: 'Fast',
      color: 'text-weird-green',
      highlight: true,
    },
    {
      to: '/admin/records',
      label: 'Class Records & History',
      icon: FileSpreadsheet,
      color: 'text-spiro-disco-ball',
    },
    {
      to: '/admin/class-goals',
      label: 'Class Goals & Progress',
      icon: Target,
      color: 'text-amber-500',
    },
    {
      to: '/admin/batches',
      label: 'Batches & Routine',
      icon: Layers,
      color: 'text-spiro-disco-ball',
    },
    {
      to: '/admin/schools',
      label: 'Schools & Colleges',
      icon: Landmark,
      color: 'text-hammam-blue',
    },
    {
      to: '/admin/students',
      label: 'Student Directory',
      icon: Users,
      color: 'text-bright-lilac',
    },
    {
      to: '/admin/syllabus',
      label: 'Syllabus Schemes',
      icon: BookOpen,
      color: 'text-emerald-500',
    },
    {
      to: '/admin/homework',
      label: 'Homework Tracker',
      icon: BookOpenCheck,
      color: 'text-radiant-yellow',
    },
    {
      to: '/admin/exams',
      label: 'Exams & Sections',
      icon: GraduationCap,
      color: 'text-light-slate-blue',
    },
    {
      to: '/admin/tools',
      label: 'Tutor Power Tools',
      icon: Sparkles,
      color: 'text-light-purple',
      subLinks: [
        { to: '/admin/tools/weak-topics', label: 'Weak Topic Radar', icon: AlertTriangle },
        { to: '/admin/tools/makeup', label: 'Makeup Planner', icon: CalendarClock },
        { to: '/admin/tools/sheets', label: 'Lecture Sheet Tracker', icon: FileSpreadsheet },
      ],
    },
    {
      to: '/admin/leaderboard-settings',
      label: 'Leaderboard Visibility',
      icon: Trophy,
      color: 'text-mandarin-sorbet',
    },
    {
      to: '/admin/settings',
      label: 'Data, CSV & Backup',
      icon: Settings,
      color: 'text-slate-500',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header with Close button */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-slate-100 dark:border-dark-border">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.to} className="space-y-1">
                <NavLink
                  to={item.to}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? item.highlight
                          ? 'bg-weird-green text-slate-900 shadow-md shadow-weird-green/20'
                          : 'bg-light-indigo text-white shadow-md shadow-light-indigo/25'
                        : item.highlight
                        ? 'bg-weird-green/10 text-emerald-700 dark:text-wintergreen hover:bg-weird-green/20 border border-weird-green/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                            isActive ? (item.highlight ? 'text-slate-900' : 'text-white') : item.color
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white text-emerald-800'
                              : 'bg-weird-green text-slate-900'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>

                {/* Sublinks if available */}
                {item.subLinks && (
                  <div className="pl-9 pr-1 py-1 space-y-1">
                    {item.subLinks.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          onClick={() => onClose()}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-light-purple/20 text-light-purple font-bold'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`
                          }
                        >
                          <SubIcon className="w-3.5 h-3.5" />
                          <span>{sub.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="p-3 border-t border-slate-100 dark:border-dark-border">
          <NavLink
            to="/leaderboard"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-bold text-amber-700 dark:text-radiant-yellow bg-radiant-yellow/10 border border-radiant-yellow/20 hover:bg-radiant-yellow/20 transition-all"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Open Public Leaderboard</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
