import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { TodayClassesCard } from './TodayClassesCard';
import { ActionAlertsPanel } from './ActionAlertsPanel';
import {
  Users,
  Layers,
  BookOpenCheck,
  GraduationCap,
  PlusCircle,
  Radio,
  FileCheck,
  CalendarPlus,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { batches, students, sessions, homeworks, exams, sheets, syllabi } = useData();
  const navigate = useNavigate();

  const activeBatchesCount = batches.filter((b) => b.isActive).length;
  const activeStudentsCount = students.filter((s) => s.isActive).length;
  const totalHomeworksCount = homeworks.length;
  const totalExamsCount = exams.length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-light-indigo/15 text-light-indigo dark:text-spiro-disco-ball">
                Tutor Control Center
              </span>
              <span className="text-xs text-slate-400">Strictly Academic • Zero Fees</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Welcome back, Abdullah All Masum
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage in-class attendance, individual school syllabi, section-wise exams & guardian reporting.
            </p>
          </div>

          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/admin/live-class')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen shadow-sm transition-transform active:scale-95"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>+ Take Attendance</span>
            </button>
            <button
              onClick={() => navigate('/admin/homework')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-spiro-disco-ball/15 text-sky-800 dark:text-spiro-disco-ball hover:bg-spiro-disco-ball/25 border border-spiro-disco-ball/30 transition-all"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>+ Check HW</span>
            </button>
            <button
              onClick={() => navigate('/admin/exams')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-bright-lilac/15 text-purple-900 dark:text-bright-lilac hover:bg-bright-lilac/25 border border-bright-lilac/30 transition-all"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>+ Enter Marks</span>
            </button>
            <button
              onClick={() => navigate('/admin/students?action=new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-light-indigo/15 text-light-indigo dark:text-neon-blue hover:bg-light-indigo/25 border border-light-indigo/30 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Student</span>
            </button>
            <button
              onClick={() => navigate('/admin/live-class?type=extra')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-radiant-yellow" />
              <span>+ Extra Class</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-dark-border">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Active Batches</span>
              <Layers className="w-4 h-4 text-spiro-disco-ball" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {activeBatchesCount}
            </div>
            <span className="text-[11px] text-slate-400">HSC, SSC, Spoken, Grammar</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Total Students</span>
              <Users className="w-4 h-4 text-light-indigo" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {activeStudentsCount}
            </div>
            <span className="text-[11px] text-slate-400">From DRMC, VNSC, NDC, ACC</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Homework Sets</span>
              <BookOpenCheck className="w-4 h-4 text-radiant-yellow" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalHomeworksCount}
            </div>
            <span className="text-[11px] text-slate-400">Status & Numeric Grading</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Exams Conducted</span>
              <GraduationCap className="w-4 h-4 text-bright-lilac" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalExamsCount}
            </div>
            <span className="text-[11px] text-slate-400">Section-wise Diagnostics</span>
          </div>
        </div>
      </div>

      {/* Hero Today's Classes & Routine Engine */}
      <TodayClassesCard batches={batches} students={students} />

      {/* Action Alerts Panel: Sheets, Makeup & Weak Topics */}
      <ActionAlertsPanel
        sheets={sheets}
        students={students}
        syllabi={syllabi}
        exams={exams}
      />

      {/* Recent Sessions & Activity Overview */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Recent Class Sessions & Lesson Log
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automated record of topics covered and attendance status
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/live-class')}
            className="text-xs font-bold text-light-indigo dark:text-spiro-disco-ball hover:underline flex items-center gap-1"
          >
            <span>Live Class Center</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-dark-border">
          {sessions.slice(0, 4).map((sess) => {
            const batch = batches.find((b) => b.id === sess.batchId);
            const presentCount = Object.values(sess.records || {}).filter(
              (r) => r.attendance === 'present' || r.attendance === 'late'
            ).length;
            const totalCount = Object.keys(sess.records || {}).length;

            return (
              <div key={sess.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {batch?.name || 'Class Session'}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        sess.sessionType === 'makeup'
                          ? 'bg-radiant-yellow/20 text-amber-700 dark:text-radiant-yellow'
                          : sess.sessionType === 'extra'
                          ? 'bg-spiro-disco-ball/20 text-sky-700 dark:text-spiro-disco-ball'
                          : 'bg-weird-green/20 text-emerald-800 dark:text-wintergreen'
                      }`}
                    >
                      {sess.sessionType}
                    </span>
                    <span className="text-xs text-slate-400">{sess.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                    {sess.generalLessonSummary || 'Topics covered during session.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-wintergreen bg-weird-green/10 px-2.5 py-1 rounded-lg">
                    {presentCount}/{totalCount} Present
                  </span>
                  <button
                    onClick={() => navigate(`/admin/live-class?sessionId=${sess.id}&batchId=${sess.batchId}`)}
                    className="font-bold text-light-indigo dark:text-spiro-disco-ball hover:underline"
                  >
                    View / Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
