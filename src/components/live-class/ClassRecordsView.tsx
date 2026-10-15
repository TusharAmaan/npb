import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import { ClassSession, Batch, Student } from '../../types/models';
import {
  Calendar,
  Clock,
  Users,
  Search,
  Trash2,
  Edit2,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  BookOpen,
  PhoneCall,
  Sparkles,
  X,
  Filter,
  Copy,
  Check,
  BookOpenCheck,
  GraduationCap,
  Zap,
  MessageSquare,
  Award,
} from 'lucide-react';
import { createWhatsAppLink, WhatsAppTemplates } from '../../lib/whatsappTemplates';

interface ClassRecordsViewProps {
  onEditSession: (session: ClassSession) => void;
  onConductNewClass: () => void;
}

export const ClassRecordsView: React.FC<ClassRecordsViewProps> = ({
  onEditSession,
  onConductNewClass,
}) => {
  const { sessions, batches, students, deleteClassSession } = useData();
  const { confirm, alert } = useModal();

  const [filterBatchId, setFilterBatchId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingSession, setInspectingSession] = useState<ClassSession | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  // Filter sessions
  const filteredSessions = sessions
    .filter((sess) => {
      if (filterBatchId !== 'all' && sess.batchId !== filterBatchId) return false;
      if (filterType !== 'all' && sess.sessionType !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const batchName = batches.find((b) => b.id === sess.batchId)?.name.toLowerCase() || '';
        const topicsStr = (sess.topicsTaught || []).join(' ').toLowerCase();
        const summaryStr = (sess.generalLessonSummary || '').toLowerCase();
        const customTitleStr = (sess.customTitle || '').toLowerCase();
        const dateStr = sess.date.toLowerCase();
        return (
          batchName.includes(q) ||
          topicsStr.includes(q) ||
          summaryStr.includes(q) ||
          customTitleStr.includes(q) ||
          dateStr.includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

  // Summary Metrics
  const totalSessions = sessions.length;
  const uniqueTopicsTaught = Array.from(
    new Set(sessions.flatMap((s) => s.topicsTaught || []))
  ).length;

  let totalPresent = 0;
  let totalStudentRecords = 0;
  sessions.forEach((s) => {
    Object.values(s.records || {}).forEach((r) => {
      totalStudentRecords++;
      if (r.attendance === 'present' || r.attendance === 'late') {
        totalPresent++;
      }
    });
  });
  const overallAttendancePct =
    totalStudentRecords > 0 ? Math.round((totalPresent / totalStudentRecords) * 100) : 100;

  const handleDeleteSession = async (sess: ClassSession) => {
    const batch = batches.find((b) => b.id === sess.batchId);
    const ok = await confirm({
      title: 'Delete Class Session Record',
      message: `Delete class record for ${batch?.name || 'Batch'} on ${sess.date}? This will delete attendance, quiz, and lesson history for this session.`,
      confirmText: 'Yes, Delete Record',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (ok) {
      await deleteClassSession(sess.id);
      await alert({
        title: 'Class Record Deleted',
        message: 'The class session record has been permanently removed.',
        variant: 'info',
      });
      if (inspectingSession?.id === sess.id) {
        setInspectingSession(null);
      }
    }
  };

  const handleCopyWhatsAppSummary = (sess: ClassSession) => {
    const batch = batches.find((b) => b.id === sess.batchId);
    const recordsList = Object.values(sess.records || {});
    const presentCount = recordsList.filter((r) => r.attendance === 'present').length;
    const absentCount = recordsList.filter((r) => r.attendance === 'absent').length;
    const lateCount = recordsList.filter((r) => r.attendance === 'late').length;

    let text = `📚 *NPB Academic Session Summary — ${batch?.name || 'Batch'}*\n`;
    text += `📅 *Date:* ${sess.date} (${sess.sessionType.toUpperCase()} CLASS)\n`;
    if (sess.startTime && sess.endTime) {
      text += `⏱️ *Time Slot:* ${sess.startTime} – ${sess.endTime}\n`;
    }
    if (sess.customTitle) {
      text += `🎯 *Focus:* ${sess.customTitle}\n`;
    }
    text += `\n📖 *Topics Covered:*\n`;
    if (sess.topicsTaught && sess.topicsTaught.length > 0) {
      sess.topicsTaught.forEach((t) => {
        text += `• ${t}\n`;
      });
    } else {
      text += `• ${sess.generalLessonSummary || 'General class exercise'}\n`;
    }

    if (sess.inClassExam?.hasExam) {
      text += `\n📝 *In-Class Quiz Held:*\n`;
      text += `• Quiz: ${sess.inClassExam.title} (Marks: /${sess.inClassExam.maxMarks})\n`;
      if (sess.inClassExam.classAverage) {
        text += `• Class Average: ${sess.inClassExam.classAverage}/${sess.inClassExam.maxMarks}\n`;
      }
    }

    if (sess.assignedHomework?.hasHomework) {
      text += `\n📚 *Homework Assigned:*\n`;
      text += `• ${sess.assignedHomework.title}\n`;
      text += `• Due Date: ${sess.assignedHomework.dueDate}\n`;
    }

    text += `\n👥 *Attendance Breakdown:*\n`;
    text += `✅ Present: ${presentCount} | ❌ Absent: ${absentCount} | ⏳ Late: ${lateCount}\n`;

    if (sess.nextClassLessonPlan) {
      text += `\n📌 *Next Class Focus:* ${sess.nextClassLessonPlan}\n`;
    }

    text += `\n_Recorded systematically via NPB Academic System._`;

    navigator.clipboard.writeText(text);
    setCopiedSessionId(sess.id);
    setTimeout(() => setCopiedSessionId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Sessions Held
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalSessions}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-weird-green/15 text-weird-green flex items-center justify-center font-bold">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Unique Topics Taught
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {uniqueTopicsTaught}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-light-indigo/10 text-light-indigo dark:text-spiro-disco-ball flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Average Attendance
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {overallAttendancePct}%
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-radiant-yellow/15 text-amber-800 dark:text-radiant-yellow flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, lesson note, title, or date (YYYY-MM-DD)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterBatchId}
                onChange={(e) => setFilterBatchId(e.target.value)}
                className="px-2.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="regular">Regular Routine</option>
              <option value="extra">Extra Class</option>
              <option value="makeup">Makeup Class</option>
            </select>
          </div>
        </div>
      </div>

      {/* Class Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-light-indigo/10 text-light-indigo flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
            No Class Sessions Found
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No class records match your search or filter criteria. Start a new session in Live Class Mode to begin logging history.
          </p>
          <button
            type="button"
            onClick={onConductNewClass}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen transition-all shadow-xs"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Launch Live Class Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((sess) => {
            const batch = batches.find((b) => b.id === sess.batchId);
            const recordsList = Object.values(sess.records || {});
            const presentCount = recordsList.filter((r) => r.attendance === 'present').length;
            const absentCount = recordsList.filter((r) => r.attendance === 'absent').length;
            const lateCount = recordsList.filter((r) => r.attendance === 'late').length;
            const excusedCount = recordsList.filter((r) => r.attendance === 'excused').length;
            const totalRoster = recordsList.length;

            const attPct = totalRoster > 0 ? Math.round(((presentCount + lateCount) / totalRoster) * 100) : 100;

            const typeStyles =
              sess.sessionType === 'regular'
                ? 'bg-light-indigo/15 text-light-indigo dark:text-spiro-disco-ball border-light-indigo/20'
                : sess.sessionType === 'extra'
                ? 'bg-bright-lilac/15 text-bright-lilac border-bright-lilac/20'
                : 'bg-weird-green/15 text-weird-green border-weird-green/20';

            return (
              <div
                key={sess.id}
                className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/90 dark:border-dark-border p-5 transition-all hover:border-light-indigo/40 shadow-xs space-y-3.5"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs font-black text-slate-900 dark:text-white">
                      <Calendar className="w-4 h-4 text-light-indigo dark:text-spiro-disco-ball" />
                      <span>{sess.date}</span>
                    </span>

                    {sess.startTime && sess.endTime && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{sess.startTime} – {sess.endTime}</span>
                      </span>
                    )}

                    <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                      {batch?.name || 'Batch'}
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${typeStyles}`}>
                      {sess.sessionType === 'extra' ? '⚡ Extra Class' : sess.sessionType === 'makeup' ? '🔄 Makeup' : 'Routine'}
                    </span>

                    {sess.customTitle && (
                      <span className="text-xs font-black text-light-indigo dark:text-neon-blue">
                        • {sess.customTitle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopyWhatsAppSummary(sess)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      title="Copy WhatsApp class summary to clipboard"
                    >
                      {copiedSessionId === sess.id ? <Check className="w-3.5 h-3.5 text-weird-green" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSessionId === sess.id ? 'Copied!' : 'Copy WA'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInspectingSession(sess)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Roster ({totalRoster})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditSession(sess)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Session in Live Mode"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSession(sess)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-light-red hover:bg-light-red/10 transition-colors"
                      title="Delete Session Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Topics Taught row */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Topics Taught
                  </div>
                  {sess.topicsTaught && sess.topicsTaught.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sess.topicsTaught.map((topic, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No specific topics logged</span>
                  )}
                </div>

                {/* Badges for In-Class Quiz & Homework Assigned */}
                {(sess.inClassExam?.hasExam || sess.assignedHomework?.hasHomework) && (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {sess.inClassExam?.hasExam && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-radiant-yellow/15 text-amber-900 dark:text-radiant-yellow border border-radiant-yellow/30">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Quiz: {sess.inClassExam.title} (Avg: {sess.inClassExam.classAverage || 0}/{sess.inClassExam.maxMarks})</span>
                      </span>
                    )}

                    {sess.assignedHomework?.hasHomework && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-light-indigo/15 text-light-indigo dark:text-spiro-disco-ball border border-light-indigo/30">
                        <BookOpenCheck className="w-3.5 h-3.5" />
                        <span>HW Due: {sess.assignedHomework.dueDate} ({sess.assignedHomework.title})</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Lesson Summary Notes */}
                {sess.generalLessonSummary && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-700 dark:text-slate-200 mr-1.5">Lesson Log:</span>
                    <span>{sess.generalLessonSummary}</span>
                  </div>
                )}

                {/* Next Class Plan */}
                {sess.nextClassLessonPlan && (
                  <div className="p-2.5 rounded-xl bg-spiro-disco-ball/5 dark:bg-spiro-disco-ball/10 border border-spiro-disco-ball/20 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-spiro-disco-ball flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Next Class Focus: </span>
                      <span>{sess.nextClassLessonPlan}</span>
                    </div>
                  </div>
                )}

                {/* Attendance Summary Bar */}
                <div className="pt-2 border-t border-slate-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 dark:text-white">
                      Attendance: {attPct}%
                    </span>
                    <span className="text-emerald-600 dark:text-weird-green font-bold">
                      {presentCount} Present
                    </span>
                    {absentCount > 0 && (
                      <span className="text-red-600 dark:text-light-red font-bold">
                        {absentCount} Absent
                      </span>
                    )}
                    {lateCount > 0 && (
                      <span className="text-amber-600 dark:text-radiant-yellow font-bold">
                        {lateCount} Late
                      </span>
                    )}
                    {excusedCount > 0 && (
                      <span className="text-slate-500 font-bold">
                        {excusedCount} Excused
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Saved on {new Date(sess.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Roster & Attendance Details Modal */}
      {inspectingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Student Attendance & Performance Roster
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {inspectingSession.date} • {batches.find((b) => b.id === inspectingSession.batchId)?.name}
                  {inspectingSession.inClassExam?.hasExam && ` • Quiz: ${inspectingSession.inClassExam.title}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSession(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
              {Object.keys(inspectingSession.records || {}).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No individual student records were logged for this session.
                </div>
              ) : (
                Object.values(inspectingSession.records || {}).map((rec) => {
                  const stu = students.find((s) => s.id === rec.studentId);
                  const statusColors = {
                    present: 'bg-weird-green/20 text-emerald-800 dark:text-weird-green border-weird-green/30',
                    absent: 'bg-light-red/20 text-red-800 dark:text-light-red border-light-red/30',
                    late: 'bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow border-radiant-yellow/30',
                    excused: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
                  }[rec.attendance || 'present'];

                  return (
                    <div
                      key={rec.studentId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-12 text-center px-1.5 py-0.5 rounded font-black bg-slate-200 dark:bg-slate-800 text-[10px]">
                          Roll {stu?.publicRollNo || '—'}
                        </span>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white">
                            {stu?.name || 'Student'}
                          </div>
                          {rec.remarks && (
                            <div className="text-[11px] text-light-indigo dark:text-neon-blue font-semibold">
                              Note: {rec.remarks}
                            </div>
                          )}
                          {stu?.guardianPhone && (
                            <div className="text-[10px] text-slate-400">
                              Guardian: {stu.guardianPhone}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {/* Quiz Score Badge */}
                        {inspectingSession.inClassExam?.hasExam && (
                          <span className="px-2 py-1 rounded-lg text-xs font-black bg-radiant-yellow/15 text-amber-800 dark:text-radiant-yellow border border-radiant-yellow/20">
                            Score: {rec.inClassQuizScore ?? 0}/{inspectingSession.inClassExam.maxMarks}
                          </span>
                        )}

                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${statusColors}`}>
                          {rec.attendance}
                        </span>

                        {rec.attendance === 'absent' && stu?.guardianPhone && (
                          <button
                            type="button"
                            onClick={() => {
                              const batchName = batches.find((b) => b.id === inspectingSession.batchId)?.name || 'Class';
                              const msg = WhatsAppTemplates.attendanceAlert(
                                stu.name,
                                'absent',
                                inspectingSession.date,
                                batchName
                              );
                              const link = createWhatsAppLink(stu.guardianPhone, msg);
                              window.open(link, '_blank');
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            title="Send WhatsApp Absence Alert"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-dark-border flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleCopyWhatsAppSummary(inspectingSession)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Summary for WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectingSession(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
