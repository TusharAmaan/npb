import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Student } from '../../types/models';
import { useData } from '../../context/DataContext';
import { SyllabusManager } from './SyllabusManager';
import { calculateStudentAnalytics } from '../../lib/performanceMath';
import { createWhatsAppLink, WhatsAppTemplates, getReportShareUrl } from '../../lib/whatsappTemplates';
import {
  User,
  PhoneCall,
  Share2,
  ExternalLink,
  Award,
  Flame,
  Plus,
  Minus,
  Sparkles,
  Layers,
  BookOpenCheck,
  GraduationCap,
  Calendar,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
} from 'lucide-react';

interface StudentProfileViewProps {
  student: Student;
  onBack: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({ student, onBack }) => {
  const { batches, sessions, homeworks, exams, sheets, syllabi, saveStudent, saveBonusLog } = useData();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'attendance' | 'homework' | 'exams'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [bonusInput, setBonusInput] = useState(5);
  const [bonusReason, setBonusReason] = useState('Outstanding participation');

  // Find primary enrolled batch
  const primaryBatch = batches.find((b) => student.batchIds?.includes(b.id)) || batches[0];
  const studentSyllabus = syllabi[student.id];

  const analytics = primaryBatch
    ? calculateStudentAnalytics(
        student,
        primaryBatch,
        sessions,
        homeworks,
        exams,
        sheets,
        studentSyllabus
      )
    : null;

  const shareUrl = getReportShareUrl(student.shareToken);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const msg = WhatsAppTemplates.guardianLiveReport(
      student.name,
      student.guardianName || 'Guardian',
      shareUrl
    );
    const link = createWhatsAppLink(student.guardianPhone, msg);
    window.open(link, '_blank');
  };

  const handleRegenerateToken = async () => {
    if (confirm('Regenerate secret report link? The previous link shared with guardian will stop working.')) {
      const newToken = `npb-${Math.random().toString(36).substring(2, 10)}`;
      await saveStudent({ ...student, shareToken: newToken });
    }
  };

  const handleAddBonus = async (isPositive: boolean) => {
    const points = isPositive ? bonusInput : -bonusInput;
    await saveBonusLog({
      id: `b-${Date.now().toString(36)}`,
      studentId: student.id,
      batchId: primaryBatch?.id || 'batch-1',
      date: new Date().toISOString().split('T')[0],
      points,
      reason: bonusReason || (isPositive ? 'Merit bonus' : 'Academic penalty'),
      createdAt: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          ← Back to Student Directory
        </button>

        <div className="flex items-center gap-2">
          {/* Guardian Presentation Mode Button */}
          <button
            onClick={() => navigate(`/report/${student.shareToken}?mode=presentation`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Presentation Mode</span>
          </button>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-light-indigo to-light-slate-blue flex items-center justify-center text-white font-black text-xl shadow-md">
              {student.name.substring(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow">
                  Roll: {student.publicRollNo}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {student.classLevel} • {student.schoolName}
                </span>
                {student.section && (
                  <span className="text-xs text-slate-400">Sec: {student.section}</span>
                )}
              </div>

              <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {student.name}
              </h1>

              {/* Guardian contact */}
              <div className="flex items-center gap-3 mt-2 text-xs">
                <a
                  href={`https://wa.me/880${student.guardianPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-wintergreen hover:underline"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Guardian: {student.guardianPhone}</span>
                </a>

                {student.streakCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-weird-green/15 text-emerald-700 dark:text-wintergreen">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    {student.streakCount} Day Streak
                  </span>
                )}

                {(student.manualBonusPoints || 0) !== 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-light-purple/20 text-light-purple">
                    <Award className="w-3.5 h-3.5" />
                    Bonus: {student.manualBonusPoints} pts
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Guardian Link & WhatsApp Dispatch */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2 max-w-sm">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>Secret Live Report Link</span>
              <button
                type="button"
                onClick={handleRegenerateToken}
                title="Revoke and generate new token"
                className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-0.5"
              >
                <RotateCw className="w-3 h-3" />
                Reset
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex-1 truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg bg-light-indigo text-white hover:bg-light-slate-blue transition-colors"
                title="Copy link"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen shadow-xs transition-transform active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Send Report via WhatsApp</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Score Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-dark-border">
            <div className="p-3 rounded-xl bg-light-indigo/10 border border-light-indigo/20">
              <span className="text-[11px] font-bold text-light-indigo uppercase">Total Score</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {analytics.totalPerformanceScore}
              </div>
              <span className="text-[10px] text-slate-500">Base: {analytics.baseScore} + Bonus: {analytics.streakBonus + analytics.bonusPoints}</span>
            </div>

            <div className="p-3 rounded-xl bg-weird-green/10 border border-weird-green/20">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-wintergreen uppercase">Attendance Rate</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {analytics.attendanceRate}%
              </div>
              <span className="text-[10px] text-slate-500">
                P: {analytics.attendanceStats.present} • A: {analytics.attendanceStats.absent} • L: {analytics.attendanceStats.late}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-radiant-yellow/10 border border-radiant-yellow/20">
              <span className="text-[11px] font-bold text-amber-700 dark:text-radiant-yellow uppercase">Homework Rate</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {analytics.homeworkRate}%
              </div>
              <span className="text-[10px] text-slate-500">
                Done: {analytics.homeworkStats.done} / {analytics.homeworkStats.total}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-spiro-disco-ball/10 border border-spiro-disco-ball/20">
              <span className="text-[11px] font-bold text-sky-700 dark:text-spiro-disco-ball uppercase">Exam Average</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {analytics.examAverage}%
              </div>
              <span className="text-[10px] text-slate-500">{analytics.examCount} Exams Taken</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-dark-border pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-light-indigo text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Performance & Diagnostics
        </button>

        <button
          onClick={() => setActiveTab('syllabus')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'syllabus'
              ? 'bg-light-indigo text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Individual Syllabus ({(studentSyllabus?.topics || []).length})
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'attendance'
              ? 'bg-light-indigo text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Attendance Log
        </button>

        <button
          onClick={() => setActiveTab('homework')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'homework'
              ? 'bg-light-indigo text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Homework Log
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'exams'
              ? 'bg-light-indigo text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Exams & Section Breakdown
        </button>
      </div>

      {/* Tab 1: Overview & Diagnostics & Bonus Manager */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Diagnostic Weak Topics & Uncollected Sheets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weak topics */}
            <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-light-red" />
                <span>Weak Topics & Revision Needed</span>
              </h3>

              {!analytics?.weakTopics || analytics.weakTopics.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No weak topics flagged! All tested syllabus topics are above 60% mastery.
                </p>
              ) : (
                <div className="space-y-2">
                  {analytics.weakTopics.map((wt, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-light-red/10 border border-light-red/20 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-red-900 dark:text-light-red">{wt.topicTitle}</span>
                      <span className="px-2 py-0.5 rounded-full font-black bg-light-red text-white text-[10px]">
                        {wt.score}% Score
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Uncollected Sheets */}
            <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <BookOpenCheck className="w-4 h-4 text-hammam-blue" />
                <span>Pending Lecture Sheets to Hand Over</span>
              </h3>

              {!analytics?.uncollectedSheets || analytics.uncollectedSheets.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  All distributed lecture notes and sheets have been collected by this student.
                </p>
              ) : (
                <div className="space-y-2">
                  {analytics.uncollectedSheets.map((sh) => (
                    <div
                      key={sh.id}
                      className="p-2.5 rounded-xl bg-hammam-blue/10 border border-hammam-blue/20 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-teal-900 dark:text-hammam-blue block">
                          {sh.sheetNumber} — {sh.title}
                        </span>
                        <span className="text-[10px] text-slate-400">Distributed: {sh.distributedDate}</span>
                      </div>
                      <span className="text-[10px] font-bold text-teal-800 dark:text-hammam-blue">Needs Copy</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bonus Points Adjuster */}
          <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-light-purple" />
              <span>Award Bonus Points or Deductions</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Add positive points for brilliant answers / streak consistency, or deduct for missed assignments.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                min="1"
                max="50"
                value={bonusInput}
                onChange={(e) => setBonusInput(Number(e.target.value))}
                className="w-20 px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={bonusReason}
                onChange={(e) => setBonusReason(e.target.value)}
                placeholder="Reason (e.g. Excellent board question answer)"
                className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleAddBonus(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Award Bonus</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddBonus(false)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-light-red/20 text-red-700 dark:text-light-red hover:bg-light-red/30"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>- Deduct</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Individual Syllabus Manager */}
      {activeTab === 'syllabus' && <SyllabusManager student={student} />}

      {/* Tab 3: Attendance History */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">
            In-Class Attendance Log
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-dark-border">
            {sessions
              .filter((s) => s.records && s.records[student.id])
              .map((sess) => {
                const rec = sess.records[student.id];
                return (
                  <div key={sess.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {sess.date} — {sess.sessionType.toUpperCase()} Class
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Lesson: {sess.generalLessonSummary || 'Topics practiced.'}
                      </span>
                    </div>

                    <span
                      className={`font-black uppercase px-2.5 py-0.5 rounded-full text-[10px] ${
                        rec.attendance === 'present'
                          ? 'bg-weird-green/20 text-emerald-800 dark:text-wintergreen'
                          : rec.attendance === 'late'
                          ? 'bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow'
                          : 'bg-light-red/20 text-red-800 dark:text-light-red'
                      }`}
                    >
                      {rec.attendance}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab 4: Homework Log */}
      {activeTab === 'homework' && (
        <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">
            Homework Submission History
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-dark-border">
            {homeworks
              .filter((h) => h.submissions && h.submissions[student.id])
              .map((hw) => {
                const sub = hw.submissions[student.id];
                return (
                  <div key={hw.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {hw.title}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Due: {hw.dueDate} {sub.remarks ? `• Remarks: ${sub.remarks}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {typeof sub.obtainedMarks === 'number' && (
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {sub.obtainedMarks} / {hw.maxMarks}
                        </span>
                      )}
                      <span
                        className={`font-black uppercase px-2.5 py-0.5 rounded-full text-[10px] ${
                          sub.status === 'done'
                            ? 'bg-weird-green/20 text-emerald-800 dark:text-wintergreen'
                            : sub.status === 'late'
                            ? 'bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow'
                            : 'bg-light-red/20 text-red-800 dark:text-light-red'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab 5: Exams & Section Breakdown */}
      {activeTab === 'exams' && (
        <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">
            Exam Performance & Section Breakdown
          </h3>
          <div className="space-y-3">
            {exams
              .filter((ex) => ex.results && ex.results[student.id])
              .map((ex) => {
                const res = ex.results[student.id];
                return (
                  <div
                    key={ex.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">
                          {ex.title}
                        </span>
                        <span className="text-slate-400 text-[11px]">Date: {ex.examDate}</span>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-base text-slate-900 dark:text-white">
                          {res.totalObtained} / {ex.totalMaxMarks} ({res.percentage}%)
                        </span>
                        {res.isAbsent && (
                          <span className="text-[10px] font-black text-red-500 uppercase block">
                            Absent
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Section Marks Pills */}
                    {ex.sections && ex.sections.length > 0 && !res.isAbsent && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-dark-border flex flex-wrap gap-2">
                        {ex.sections.map((sec) => (
                          <span
                            key={sec.id}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-[11px]"
                          >
                            <strong>{sec.name}:</strong> {res.sectionMarks[sec.id] ?? 0} /{' '}
                            {sec.maxMarks}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
