import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { NPBLogo } from '../common/NPBLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { calculateStudentAnalytics } from '../../lib/performanceMath';
import { PrintableReportCard } from './PrintableReportCard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  PhoneCall,
  Flame,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  BookOpenCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const GuardianReportView: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [searchParams] = useSearchParams();
  const isPresentationMode = searchParams.get('mode') === 'presentation';

  const { students, batches, sessions, homeworks, exams, sheets, syllabi, settings } = useData();

  const [activeTab, setActiveTab] = useState<'live_report' | 'printable_pdf'>('live_report');

  // Find student by secret shareToken
  const student = students.find((s) => s.shareToken === shareToken);

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl border border-slate-200 dark:border-dark-border text-center max-w-md shadow-xl">
          <NPBLogo size={48} className="mx-auto mb-3" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Academic Report Not Found
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            The link you opened may have been regenerated or expired. Please contact tutor{' '}
            <strong>Abdullah All Masum</strong> on WhatsApp (01619663933) for an updated link.
          </p>
          <a
            href="https://wa.me/8801619663933"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Chat with Tutor on WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  const primaryBatch = batches.find((b) => student.batchIds?.includes(b.id)) || batches[0];
  const studentSyllabus = syllabi[student.id];

  const analytics = calculateStudentAnalytics(
    student,
    primaryBatch,
    sessions,
    homeworks,
    exams,
    sheets,
    studentSyllabus
  );

  // Exam Trend Line Chart Data
  const studentCompletedExams = exams.filter(
    (e) => e.status === 'completed' && e.results && e.results[student.id]
  );

  const examTrendData = studentCompletedExams.map((ex) => {
    const studentScore = ex.results[student.id].percentage;
    // Calculate batch average for this exam
    const allPercentages = Object.values(ex.results)
      .filter((r) => !r.isAbsent)
      .map((r) => r.percentage);
    const batchAvg =
      allPercentages.length > 0
        ? Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length)
        : 75;

    return {
      name: ex.title.length > 14 ? ex.title.substring(0, 14) + '...' : ex.title,
      studentScore,
      batchAverage: batchAvg,
    };
  });

  // Syllabus Radar Chart Data
  const radarTopicData = (studentSyllabus?.topics || []).slice(0, 6).map((t) => ({
    topic: t.title.length > 12 ? t.title.substring(0, 12) + '...' : t.title,
    score: t.examMasteryAvg !== undefined ? t.examMasteryAvg : t.status === 'completed' ? 90 : 50,
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base text-slate-800 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Guardian Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-dark-border bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <NPBLogo size={38} />
            <div>
              <span className="font-extrabold text-lg bg-gradient-to-r from-light-indigo via-light-slate-blue to-spiro-disco-ball bg-clip-text text-transparent">
                {settings.platformName || 'NPB'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                Tutor: {settings.tutorName || 'Abdullah All Masum'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/880${settings.whatsappNumber || '01619663933'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-weird-green/10 text-emerald-700 dark:text-wintergreen border border-weird-green/30"
            >
              <PhoneCall className="w-3.5 h-3.5 text-weird-green" />
              <span className="hidden sm:inline">{settings.whatsappNumber || '01619663933'}</span>
            </a>

            <ThemeToggle />

            {!isPresentationMode && (
              <Link
                to="/admin/dashboard"
                className="text-xs font-bold text-slate-500 hover:text-light-indigo"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Toggle between Live Presentation Mode & Printable PDF */}
        <div className="no-print flex items-center justify-between bg-white dark:bg-dark-surface p-2 rounded-2xl border border-slate-200 dark:border-dark-border max-w-md mx-auto shadow-xs">
          <button
            onClick={() => setActiveTab('live_report')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'live_report'
                ? 'bg-light-indigo text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Live Interactive View
          </button>
          <button
            onClick={() => setActiveTab('printable_pdf')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'printable_pdf'
                ? 'bg-light-indigo text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Official A4 Printable Card
          </button>
        </div>

        {activeTab === 'printable_pdf' ? (
          <PrintableReportCard
            student={student}
            batch={primaryBatch}
            analytics={analytics}
            syllabus={studentSyllabus}
            tutorName={settings.tutorName}
            whatsappNumber={settings.whatsappNumber}
          />
        ) : (
          <div className="space-y-6">
            {/* Student Hero Card */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 border border-slate-200/80 dark:border-dark-border shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-light-indigo to-spiro-disco-ball flex items-center justify-center text-white font-black text-xl shadow-md">
                    {student.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs px-2.5 py-0.5 rounded-md bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow">
                        ROLL: {student.publicRollNo}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {student.classLevel} • {student.schoolName}
                      </span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {student.name}
                    </h1>
                    <span className="text-xs text-slate-400">
                      Enrolled: {primaryBatch.name} ({primaryBatch.courseTag})
                    </span>
                  </div>
                </div>

                {/* Rank & Streak Badges */}
                <div className="flex items-center gap-2">
                  <div className="text-center p-3 rounded-xl bg-dorn-yellow/15 border border-dorn-yellow/40">
                    <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-unmellow-yellow block">
                      Batch Rank
                    </span>
                    <strong className="text-xl font-black text-amber-900 dark:text-unmellow-yellow">
                      #{analytics.rankInBatch}
                    </strong>
                  </div>

                  {student.streakCount > 0 && (
                    <div className="text-center p-3 rounded-xl bg-weird-green/15 border border-weird-green/30">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-wintergreen flex items-center justify-center gap-0.5">
                        <Flame className="w-3 h-3 fill-current" />
                        Streak
                      </span>
                      <strong className="text-xl font-black text-emerald-900 dark:text-wintergreen">
                        {student.streakCount}d
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* 4 KPI Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-dark-border">
                <div className="p-3.5 rounded-xl bg-light-indigo/10 border border-light-indigo/25">
                  <span className="text-[11px] font-bold text-light-indigo uppercase">Total Score</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                    {analytics.totalPerformanceScore}
                  </div>
                  <span className="text-[10px] text-slate-500">Composite Leaderboard Score</span>
                </div>

                <div className="p-3.5 rounded-xl bg-weird-green/10 border border-weird-green/25">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-wintergreen uppercase">
                    Attendance
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                    {analytics.attendanceRate}%
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {analytics.attendanceStats.present} Attended / {analytics.attendanceStats.total} Classes
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-radiant-yellow/10 border border-radiant-yellow/25">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-radiant-yellow uppercase">
                    Homework
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                    {analytics.homeworkRate}%
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {analytics.homeworkStats.done} Completed / {analytics.homeworkStats.total} Assigned
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-spiro-disco-ball/10 border border-spiro-disco-ball/25">
                  <span className="text-[11px] font-bold text-sky-700 dark:text-spiro-disco-ball uppercase">
                    Exam Average
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                    {analytics.examAverage}%
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Across {analytics.examCount} Formal Tests
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Charts: Exam Performance Trend + Radar Spider */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Exam Trend Line Chart */}
              <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-light-indigo" />
                    <span>Exam Trend: Student Score vs. Batch Average</span>
                  </h3>
                </div>

                <div className="w-full h-64">
                  {examTrendData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No exam trend data available yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={examTrendData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line
                          type="monotone"
                          dataKey="studentScore"
                          name="Student Score %"
                          stroke="#7158e2"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="batchAverage"
                          name="Batch Average %"
                          stroke="#17c0eb"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Topic Radar */}
              <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-bright-lilac" />
                    <span>Topic Mastery Radar</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Granular Skills</span>
                </div>

                <div className="w-full h-64">
                  {radarTopicData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No topic radar data available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarTopicData}>
                        <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.3} />
                        <PolarAngleAxis
                          dataKey="topic"
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} opacity={0.2} />
                        <Radar
                          name="Mastery"
                          dataKey="score"
                          stroke="#7158e2"
                          fill="#7158e2"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Individual Syllabus Progress Bar & Table */}
            <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Individual School Syllabus Progress
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Syllabus tailored for {student.name}'s curriculum
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-dark-border">
                {(studentSyllabus?.topics || []).map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {t.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{t.category}</span>
                    </div>

                    <span
                      className={`font-black uppercase px-2.5 py-0.5 rounded-full text-[10px] ${
                        t.status === 'completed'
                          ? 'bg-weird-green/20 text-emerald-800 dark:text-wintergreen'
                          : t.status === 'in_progress'
                          ? 'bg-spiro-disco-ball/20 text-sky-800 dark:text-spiro-disco-ball'
                          : t.status === 'revision_needed'
                          ? 'bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weak Topic Diagnostic Box */}
            <div className="bg-light-red/10 border border-light-red/30 p-5 rounded-2xl">
              <h3 className="font-extrabold text-sm text-red-900 dark:text-light-red flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-light-red" />
                <span>Diagnostic Academic Attention List</span>
              </h3>

              {analytics.weakTopics.length === 0 ? (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  🎉 Excellent! {student.name} has no weak topics under 60% mastery.
                </p>
              ) : (
                <div className="space-y-1.5 mt-2">
                  {analytics.weakTopics.map((wt, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white dark:bg-dark-surface border border-light-red/20 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-900 dark:text-white">
                        {wt.topicTitle} ({wt.category})
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-bold bg-light-red text-white text-[10px]">
                        {wt.score}% Mastery
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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
