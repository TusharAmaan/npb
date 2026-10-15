import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Radio, Layers, BookOpenCheck, Users } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#23232c]/95 border-t border-slate-200 dark:border-dark-border backdrop-blur-lg px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Dashboard */}
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive
                ? 'text-light-indigo dark:text-neon-blue font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </NavLink>

        {/* Batches */}
        <NavLink
          to="/admin/batches"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive
                ? 'text-light-indigo dark:text-neon-blue font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Batches</span>
        </NavLink>

        {/* Live Class (Prominent Center Button) */}
        <NavLink
          to="/admin/live-class"
          className={({ isActive }) =>
            `flex flex-col items-center -mt-5 p-2 rounded-full transition-transform active:scale-95 shadow-lg ${
              isActive
                ? 'bg-weird-green text-slate-950 ring-4 ring-weird-green/30'
                : 'bg-light-indigo text-white ring-4 ring-light-indigo/20'
            }`
          }
        >
          <Radio className="w-6 h-6 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 px-1">Live</span>
        </NavLink>

        {/* Homework */}
        <NavLink
          to="/admin/homework"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive
                ? 'text-light-indigo dark:text-neon-blue font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <BookOpenCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Homework</span>
        </NavLink>

        {/* Students */}
        <NavLink
          to="/admin/students"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2.5 rounded-xl transition-colors ${
              isActive
                ? 'text-light-indigo dark:text-neon-blue font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Students</span>
        </NavLink>
      </div>
    </nav>
  );
};
