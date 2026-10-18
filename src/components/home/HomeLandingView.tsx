import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NPBLogo } from '../common/NPBLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Trophy,
  ShieldCheck,
  UserCheck,
  PhoneCall,
  ArrowRight,
  BookOpenCheck,
  Radio,
  GraduationCap,
  Sparkles,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  PenTool,
} from 'lucide-react';

export const HomeLandingView: React.FC = () => {
  const { isAdmin, currentUser } = useAuth();
  const { settings, batches, students, onlineExams } = useData();
  const navigate = useNavigate();

  const [lookupToken, setLookupToken] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [examCodeInput, setExamCodeInput] = useState('');
  const [examError, setExamError] = useState('');

  // Auto-detect GitHub Pages redirect search (?/exam/CODE) if landing here
  useEffect(() => {
    const search = window.location.search;
    if (search && search.startsWith('?/exam/')) {
      const code = search.slice(7);
      if (code) {
        navigate(`/exam/${code}`, { replace: true });
      }
    }
  }, [navigate]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    const trimmed = lookupToken.trim();
    if (!trimmed) return;

    // 1. Check if user typed an exam code in the main box
    const matchedExam = onlineExams.find(
      (ex) =>
        ex.examCode.toLowerCase() === trimmed.toLowerCase() ||
        ex.id.toLowerCase() === trimmed.toLowerCase()
    );
    if (matchedExam) {
      navigate(`/exam/${matchedExam.examCode}`);
      return;
    }

    // 2. Search by shareToken or publicRollNo
    const matched = students.find(
      (s) =>
        s.shareToken.toLowerCase() === trimmed.toLowerCase() ||
        s.publicRollNo.toLowerCase() === trimmed.toLowerCase()
    );

    if (matched) {
      navigate(`/report/${matched.shareToken}`);
      return;
    }

    // 3. Fallback: If it has hyphens or resembles an exam code, attempt exam route
    if (trimmed.includes('-')) {
      navigate(`/exam/${trimmed.toUpperCase()}`);
      return;
    }

    setLookupError('No student or exam found matching this Roll Number, Token, or Code.');
  };

  const handleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setExamError('');
    const code = examCodeInput.trim();
    if (!code) return;
    navigate(`/exam/${encodeURIComponent(code)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base text-slate-800 dark:text-slate-100 flex flex-col transition-colors">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-dark-border bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <NPBLogo size={38} />
            <div>
              <span className="font-extrabold text-lg bg-gradient-to-r from-light-indigo via-light-slate-blue to-spiro-disco-ball bg-clip-text text-transparent">
                {settings.platformName || 'NPB'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                Tutor: {settings.tutorName || 'Abdullah All Masum'}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/880${settings.whatsappNumber || '01619663933'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-weird-green/10 text-emerald-700 dark:text-wintergreen border border-weird-green/30"
            >
              <PhoneCall className="w-3.5 h-3.5 text-weird-green" />
              <span>{settings.whatsappNumber || '01619663933'}</span>
            </a>

            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-radiant-yellow/15 text-amber-800 dark:text-radiant-yellow border border-radiant-yellow/30"
            >
              <Trophy className="w-3.5 h-3.5 text-radiant-yellow" />
              <span>Leaderboard</span>
            </Link>

            <ThemeToggle />

            {isAdmin ? (
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-weird-green" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Tutor Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full space-y-12">
        {/* Admin Logged In Quick Access Banner */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-light-indigo/15 via-spiro-disco-ball/10 to-weird-green/15 border border-light-indigo/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-light-indigo text-white shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <span className="text-xs font-bold text-light-indigo dark:text-spiro-disco-ball block">
                  Logged in as Administrator
                </span>
                <strong className="text-sm text-slate-900 dark:text-white">
                  Abdullah All Masum ({currentUser?.email || 'abdullahallmasum@npb.edu'})
                </strong>
              </div>
            </div>

            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm transition-transform active:scale-95"
            >
              <span>Open Admin Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-spiro-disco-ball/15 text-sky-800 dark:text-spiro-disco-ball border border-spiro-disco-ball/30 shadow-xs">
            <Sparkles className="w-4 h-4 text-spiro-disco-ball" />
            <span>Academic Performance & Student Tracking Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Excellence in English Language & Board Curriculum
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Welcome to <strong>NPB</strong>, founded by English tutor <strong>Abdullah All Masum</strong>. 
            Real-time tracking of in-class attendance, individual school syllabi, section-wise exams, and transparent guardian reporting.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-radiant-yellow text-slate-950 hover:bg-mandarin-sorbet shadow-md shadow-radiant-yellow/20 transition-transform active:scale-95"
            >
              <Trophy className="w-4 h-4 text-slate-950" />
              <span>View Public Leaderboard</span>
            </Link>

            <Link
              to="/admin/live-class"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-weird-green text-slate-950 hover:bg-wintergreen shadow-md shadow-weird-green/20 transition-transform active:scale-95"
            >
              <Radio className="w-4 h-4 text-emerald-950 animate-pulse" />
              <span>Launch Live Class Mode</span>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-dark-border hover:bg-slate-50 transition-all"
            >
              <UserCheck className="w-4 h-4 text-light-indigo" />
              <span>Tutor Portal Login</span>
            </Link>
          </div>
        </div>

        {/* Guardian & Student Instant Report Search */}
        <div className="max-w-2xl mx-auto bg-white dark:bg-dark-surface p-6 rounded-3xl border border-slate-200/80 dark:border-dark-border shadow-md space-y-4">
          <div className="text-center space-y-1">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-light-indigo" />
              <span>Guardian & Student Live Report Card Lookup</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the student's <strong>Public Roll No</strong> (e.g. <code>HSC-01</code>, <code>HSC-02</code>, <code>SSC-11</code>) or secret share token to view their live report card.
            </p>
          </div>

          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={lookupToken}
                onChange={(e) => setLookupToken(e.target.value)}
                placeholder="Enter Roll No (e.g. HSC-01) or Secret Token..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-light-indigo"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm transition-all"
            >
              Open Report Card
            </button>
          </form>

          {lookupError && (
            <div className="p-3 rounded-xl bg-light-red/10 border border-light-red/30 text-xs font-semibold text-red-700 dark:text-light-red text-center">
              {lookupError}
            </div>
          )}

          {/* Quick Demo Sample links */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span>Sample quick reports:</span>
            {students.slice(0, 3).map((stu) => (
              <button
                key={stu.id}
                type="button"
                onClick={() => navigate(`/report/${stu.shareToken}`)}
                className="font-bold text-light-indigo dark:text-spiro-disco-ball hover:underline"
              >
                {stu.name} ({stu.publicRollNo})
              </button>
            ))}
          </div>
        </div>

        {/* Student Online Exam Direct Entry Card */}
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/70 dark:from-indigo-950/20 dark:via-dark-surface dark:to-sky-950/20 p-6 rounded-3xl border border-indigo-200/80 dark:border-indigo-900/40 shadow-md space-y-4">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Interactive Student Assessment</span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Take Online Exam — Enter Exam Code</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Have an exam code from your tutor on WhatsApp? Enter it below (e.g. <code>HSC-ENG-01</code> or <code>H27-PREP01</code>) to start immediately.
            </p>
          </div>

          <form onSubmit={handleExamSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <PenTool className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={examCodeInput}
                onChange={(e) => setExamCodeInput(e.target.value)}
                placeholder="Enter Exam Code (e.g. HSC-ENG-01 or H27-PREP01)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider font-semibold placeholder:normal-case placeholder:font-normal"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Start Exam</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {examError && (
            <div className="p-3 rounded-xl bg-light-red/10 border border-light-red/30 text-xs font-semibold text-red-700 dark:text-light-red text-center">
              {examError}
            </div>
          )}

          {/* Active Exams Quick Shortcuts */}
          {onlineExams.filter((e) => e.isActive).length > 0 && (
            <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Active Exams:</span>
              {onlineExams
                .filter((e) => e.isActive)
                .slice(0, 3)
                .map((exam) => (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => navigate(`/exam/${exam.examCode}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-200 dark:hover:bg-indigo-800/60 transition-colors"
                  >
                    <span>{exam.title.length > 28 ? exam.title.slice(0, 28) + '...' : exam.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-mono">
                      {exam.examCode}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* 3 Core System Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs hover:border-light-indigo/40 transition-all flex flex-col justify-between">
            <div>
              <span className="p-2 rounded-xl bg-weird-green/20 text-emerald-800 dark:text-wintergreen inline-block mb-3">
                <Radio className="w-6 h-6" />
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Mobile-First Live Class Mode
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                One-handed 30-second in-class attendance. Automatic lesson synchronization flags absent students' topics as "Missed / Pending Makeup" in real-time.
              </p>
            </div>
            <Link
              to="/admin/live-class"
              className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border text-xs font-bold text-light-indigo dark:text-spiro-disco-ball flex items-center gap-1 hover:underline"
            >
              <span>Explore Live Class Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs hover:border-light-indigo/40 transition-all flex flex-col justify-between">
            <div>
              <span className="p-2 rounded-xl bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow inline-block mb-3">
                <Trophy className="w-6 h-6" />
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Public Leaderboard & Rankings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Objective performance score formula balancing exams (50%), homework completion (30%), and attendance (20%) plus streak bonus points.
              </p>
            </div>
            <Link
              to="/leaderboard"
              className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border text-xs font-bold text-amber-700 dark:text-radiant-yellow flex items-center gap-1 hover:underline"
            >
              <span>Check Current Standings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs hover:border-light-indigo/40 transition-all flex flex-col justify-between">
            <div>
              <span className="p-2 rounded-xl bg-spiro-disco-ball/20 text-sky-800 dark:text-spiro-disco-ball inline-block mb-3">
                <GraduationCap className="w-6 h-6" />
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Weak Topic Diagnostic Radar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Granular section-wise exam tracking automatically flags any grammar or writing skill below 60% mastery for focused board questions practice.
              </p>
            </div>
            <Link
              to="/admin/tools/weak-topics"
              className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border text-xs font-bold text-light-indigo dark:text-spiro-disco-ball flex items-center gap-1 hover:underline"
            >
              <span>View Diagnostic Tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Active Batches Showcase */}
        <div className="bg-white dark:bg-dark-surface p-6 rounded-3xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Academic Programs & Batch Schedules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Weekly routines for HSC, SSC, and Foundation Grammar
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {batches.length} Active Batches • {students.length} Enrolled
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {batches.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-spiro-disco-ball/15 text-sky-800 dark:text-spiro-disco-ball">
                    {b.courseTag}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                    {b.name}
                  </h4>
                  <span className="text-xs text-slate-400">{b.classLevel}</span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-light-indigo" />
                  <span>
                    {b.weeklyRoutine?.map((r) => `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][r.dayOfWeek]}`).join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-dark-border py-8 text-center text-xs text-slate-400 bg-white dark:bg-dark-surface">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-600 dark:text-slate-300">
            NPB — Student, Batch & Academic Performance Management System
          </p>
          <p>
            English Tutor: <strong>{settings.tutorName}</strong> • WhatsApp:{' '}
            <a
              href={`https://wa.me/880${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-light-indigo dark:text-spiro-disco-ball hover:underline"
            >
              {settings.whatsappNumber}
            </a>
          </p>
          <p className="text-[11px] text-slate-400">
            Strict Academic Governance: Zero Monetary or Fee Tracking System.
          </p>
        </div>
      </footer>
    </div>
  );
};
