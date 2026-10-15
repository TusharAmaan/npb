import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { NPBLogo } from '../common/NPBLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { calculateBatchLeaderboard } from '../../lib/performanceMath';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Flame,
  PhoneCall,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PublicLeaderboardView: React.FC = () => {
  const { batches, students, sessions, homeworks, exams, sheets, syllabi, settings } = useData();
  const config = settings.leaderboardConfig;
  const cols = config.visibleColumns;

  // Published Batches only
  const publishedBatches = batches.filter(
    (b) => b.isActive && (config.publishedBatchIds || []).includes(b.id)
  );

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    publishedBatches[0]?.id || batches[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState<'all_time' | 'this_month'>('all_time');

  const activeBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  // Calculate batch leaderboard
  const rawLeaderboard = activeBatch
    ? calculateBatchLeaderboard(
        activeBatch,
        students,
        sessions,
        homeworks,
        exams,
        sheets,
        syllabi
      )
    : [];

  // Filter search (roll or name if visible)
  let filteredList = rawLeaderboard.filter((item) => {
    const matchesRoll = item.publicRollNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesName = cols.studentName
      ? item.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      : false;
    const matchesSchool = item.schoolName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRoll || matchesName || matchesSchool;
  });

  // Apply row limit if configured
  if (config.rowLimit === 'top10') {
    filteredList = filteredList.slice(0, 10);
  }

  const top1 = filteredList[0];
  const top2 = filteredList[1];
  const top3 = filteredList[2];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-dark-border bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <NPBLogo size={36} />
            <div>
              <span className="font-extrabold text-lg bg-gradient-to-r from-light-indigo via-light-slate-blue to-spiro-disco-ball bg-clip-text text-transparent">
                {settings.platformName || 'NPB'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                {settings.tutorName || 'Abdullah All Masum'}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/880${settings.whatsappNumber || '01619663933'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-weird-green/10 text-emerald-700 dark:text-wintergreen border border-weird-green/20"
            >
              <PhoneCall className="w-3.5 h-3.5 text-weird-green" />
              <span>{settings.whatsappNumber || '01619663933'}</span>
            </a>

            <ThemeToggle />

            <Link
              to="/admin/dashboard"
              className="text-xs font-bold text-light-indigo dark:text-spiro-disco-ball hover:underline"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* Hero Title */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-radiant-yellow/15 text-amber-800 dark:text-radiant-yellow border border-radiant-yellow/30 shadow-xs">
            <Trophy className="w-4 h-4 text-radiant-yellow" />
            <span>Academic Performance Standings</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Official Batch Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time composite score based on Exam Averages, Homework Completion, and Attendance Consistency.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Batch Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Batch:</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              {publishedBatches.length === 0 ? (
                <option value="">No batches published yet by Admin</option>
              ) : (
                publishedBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.courseTag})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Timeframe & Search */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search roll, name, school..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setTimeframe('all_time')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === 'all_time'
                    ? 'bg-light-indigo text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                All-Time
              </button>
              <button
                onClick={() => setTimeframe('this_month')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === 'this_month'
                    ? 'bg-light-indigo text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        {/* Top 3 Podium (Gold, Silver, Bronze) */}
        {filteredList.length >= 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 items-end max-w-3xl mx-auto">
            {/* Rank #2 Silver */}
            {top2 && (
              <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-spiro-disco-ball/30 shadow-xs text-center order-2 sm:order-1 sm:-mb-2">
                <div className="w-10 h-10 rounded-full bg-spiro-disco-ball/20 text-sky-800 dark:text-spiro-disco-ball mx-auto flex items-center justify-center font-black text-sm mb-2">
                  #2
                </div>
                <div className="font-extrabold text-xs px-2.5 py-0.5 rounded-md bg-spiro-disco-ball/15 text-sky-800 dark:text-spiro-disco-ball inline-block">
                  Roll: {top2.publicRollNo}
                </div>
                {cols.studentName && (
                  <h3 className="font-black text-sm text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                    {top2.studentName}
                  </h3>
                )}
                {cols.schoolName && (
                  <span className="text-[11px] text-slate-400 block">{top2.schoolName}</span>
                )}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-dark-border">
                  <span className="text-xl font-black text-spiro-disco-ball">
                    {top2.totalPerformanceScore} pts
                  </span>
                </div>
              </div>
            )}

            {/* Rank #1 Gold Crown */}
            {top1 && (
              <div className="bg-gradient-to-b from-dorn-yellow/20 via-white to-white dark:from-dorn-yellow/15 dark:via-dark-surface dark:to-dark-surface p-6 rounded-2xl border-2 border-dorn-yellow shadow-lg text-center order-1 sm:order-2 transform sm:-translate-y-2">
                <div className="inline-flex p-2 rounded-full bg-dorn-yellow/30 text-amber-900 dark:text-unmellow-yellow mb-2 animate-bounce">
                  <Crown className="w-7 h-7 text-amber-600 dark:text-unmellow-yellow" />
                </div>
                <div className="text-xs font-black uppercase text-amber-800 dark:text-unmellow-yellow tracking-wider block">
                  Champion #1
                </div>
                <div className="font-extrabold text-sm px-3 py-1 rounded-md bg-dorn-yellow/30 text-amber-950 dark:text-unmellow-yellow inline-block mt-1">
                  Roll: {top1.publicRollNo}
                </div>
                {cols.studentName && (
                  <h2 className="font-black text-base text-slate-900 dark:text-white mt-2 line-clamp-1">
                    {top1.studentName}
                  </h2>
                )}
                {cols.schoolName && (
                  <span className="text-xs text-slate-400 block">{top1.schoolName}</span>
                )}
                <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-900/40">
                  <span className="text-2xl font-black text-amber-700 dark:text-unmellow-yellow">
                    {top1.totalPerformanceScore} pts
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {top1.badges.slice(0, 1).join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Rank #3 Bronze */}
            {top3 && (
              <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-mandarin-sorbet/30 shadow-xs text-center order-3 sm:order-3 sm:-mb-2">
                <div className="w-10 h-10 rounded-full bg-mandarin-sorbet/20 text-amber-800 dark:text-mandarin-sorbet mx-auto flex items-center justify-center font-black text-sm mb-2">
                  #3
                </div>
                <div className="font-extrabold text-xs px-2.5 py-0.5 rounded-md bg-mandarin-sorbet/15 text-amber-800 dark:text-mandarin-sorbet inline-block">
                  Roll: {top3.publicRollNo}
                </div>
                {cols.studentName && (
                  <h3 className="font-black text-sm text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                    {top3.studentName}
                  </h3>
                )}
                {cols.schoolName && (
                  <span className="text-[11px] text-slate-400 block">{top3.schoolName}</span>
                )}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-dark-border">
                  <span className="text-xl font-black text-mandarin-sorbet">
                    {top3.totalPerformanceScore} pts
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Ranking Table (Controlled 100% by Admin Matrix) */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Official Standing Table ({filteredList.length} Students)
              </h3>
              <span className="text-xs text-slate-400">
                Formula: (Exam × {activeBatch?.performanceWeights?.examWeight}%) + (HW ×{' '}
                {activeBatch?.performanceWeights?.homeworkWeight}%) + (Att ×{' '}
                {activeBatch?.performanceWeights?.attendanceWeight}%) + Bonus
              </span>
            </div>
            {config.rowLimit === 'top10' && (
              <span className="text-xs font-bold text-amber-600 dark:text-radiant-yellow bg-radiant-yellow/10 px-2.5 py-1 rounded-full">
                Showing Top 10 Only
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-dark-border bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 text-center">Rank</th>
                  {cols.publicRollNo && <th className="py-3 px-4">Roll No</th>}
                  {cols.studentName && <th className="py-3 px-4">Student Name</th>}
                  {cols.schoolName && <th className="py-3 px-4">School</th>}
                  {cols.attendanceRate && <th className="py-3 px-4 text-center">Attendance</th>}
                  {cols.homeworkRate && <th className="py-3 px-4 text-center">Homework</th>}
                  {cols.examAverage && <th className="py-3 px-4 text-center">Exam Avg</th>}
                  {cols.bonusStreakPoints && (
                    <th className="py-3 px-4 text-center">Streak/Bonus</th>
                  )}
                  {cols.totalPerformanceScore && (
                    <th className="py-3 px-4 text-center">Total Score</th>
                  )}
                  {cols.badges && <th className="py-3 px-4">Achievements</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-800 dark:text-slate-200">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400">
                      No students ranked for this batch yet.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => {
                    const isTop1 = item.rankInBatch === 1;
                    const isTop2 = item.rankInBatch === 2;
                    const isTop3 = item.rankInBatch === 3;

                    return (
                      <tr
                        key={item.studentId}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isTop1
                            ? 'bg-dorn-yellow/10 font-medium'
                            : isTop2
                            ? 'bg-spiro-disco-ball/5'
                            : isTop3
                            ? 'bg-mandarin-sorbet/5'
                            : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4 text-center">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-dorn-yellow text-slate-950 font-black shadow-xs">
                              1
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-spiro-disco-ball text-white font-black shadow-xs">
                              2
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-mandarin-sorbet text-white font-black shadow-xs">
                              3
                            </span>
                          ) : (
                            <span className="font-bold text-slate-500">#{item.rankInBatch}</span>
                          )}
                        </td>

                        {/* Public Roll No */}
                        {cols.publicRollNo && (
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold px-2.5 py-1 rounded-md bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow">
                              {item.publicRollNo}
                            </span>
                          </td>
                        )}

                        {/* Student Name */}
                        {cols.studentName && (
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {item.studentName}
                          </td>
                        )}

                        {/* School Name */}
                        {cols.schoolName && (
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-semibold">
                            {item.schoolName}
                          </td>
                        )}

                        {/* Attendance % */}
                        {cols.attendanceRate && (
                          <td className="py-3.5 px-4 text-center font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                item.attendanceRate >= 90
                                  ? 'bg-weird-green/20 text-emerald-800 dark:text-wintergreen'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {item.attendanceRate}%
                            </span>
                          </td>
                        )}

                        {/* Homework % */}
                        {cols.homeworkRate && (
                          <td className="py-3.5 px-4 text-center font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                item.homeworkRate >= 90
                                  ? 'bg-weird-green/20 text-emerald-800 dark:text-wintergreen'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {item.homeworkRate}%
                            </span>
                          </td>
                        )}

                        {/* Exam Avg % */}
                        {cols.examAverage && (
                          <td className="py-3.5 px-4 text-center font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                item.examAverage >= 80
                                  ? 'bg-weird-green/20 text-emerald-800 dark:text-wintergreen'
                                  : item.examAverage >= 60
                                  ? 'bg-spiro-disco-ball/20 text-sky-800 dark:text-spiro-disco-ball'
                                  : 'bg-light-red/20 text-red-800 dark:text-light-red'
                              }`}
                            >
                              {item.examAverage}%
                            </span>
                          </td>
                        )}

                        {/* Streak / Bonus Points */}
                        {cols.bonusStreakPoints && (
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-amber-700 dark:text-radiant-yellow">
                              +{item.streakBonus + item.bonusPoints}
                            </span>
                          </td>
                        )}

                        {/* Total Score */}
                        {cols.totalPerformanceScore && (
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-sm font-black text-light-indigo dark:text-neon-blue">
                              {item.totalPerformanceScore}
                            </span>
                          </td>
                        )}

                        {/* Badges */}
                        {cols.badges && (
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {item.badges.map((b, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-light-purple/15 text-purple-900 dark:text-light-purple font-bold"
                                >
                                  {b}
                                </span>
                              ))}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-dark-border py-6 text-center text-xs text-slate-400">
        <p>
          NPB Academic Performance System • Tutor: <strong>{settings.tutorName}</strong> • WhatsApp:{' '}
          <a
            href={`https://wa.me/880${settings.whatsappNumber}`}
            className="text-light-indigo dark:text-spiro-disco-ball hover:underline"
          >
            {settings.whatsappNumber}
          </a>
        </p>
      </footer>
    </div>
  );
};
