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
        const dateStr = sess.date.toLowerCase();
        return (
          batchName.includes(q) ||
          topicsStr.includes(q) ||
          summaryStr.includes(q) ||
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
      message: `Delete class record for ${batch?.name || 'Batch'} on ${sess.date}? This will delete attendance and lesson history for this session.`,
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
          <div className="w-10 h-10 rounded-xl bg-bright-lilac/15 text-bright-lilac flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past sessions by topic, lesson note, or date (YYYY-MM-DD)..."
              className="w-full pl-10 pr-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-light-indigo"
            />
          </div>

          {/* Batch Filter */}
          <div className="sm:w-48">
            <select
              value={filterBatchId}
              onChange={(e) => setFilterBatchId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Academic Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Session Type Filter */}
          <div className="sm:w-36">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Class Types</option>
              <option value="regular">Regular Routine</option>
              <option value="extra">Extra Class</option>
              <option value="makeup">Makeup Class</option>
            </select>
          </div>

          {/* Conduct Class Action */}
          <button
            type="button"
            onClick={onConductNewClass}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-weird-green hover:bg-wintergreen text-slate-950 shadow-md shadow-weird-green/20 transition-transform active:scale-95"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>+ Conduct Class</span>
          </button>
        </div>
      </div>

      {/* Sessions Chronological List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-dark-surface p-12 text-center rounded-2xl border border-slate-200/80 dark:border-dark-border">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No class records found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || filterBatchId !== 'all' || filterType !== 'all'
              ? 'No sessions match your search or filter criteria. Try clearing filters.'
              : 'You have not saved any class sessions yet. Switch to Live In-Class Mode to conduct and record your first class!'}
          </p>
          <button
            type="button"
            onClick={onConductNewClass}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Conduct First Class Session</span>
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
                className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/90 dark:border-dark-border p-5 transition-all hover:border-light-indigo/40 shadow-xs space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs font-black text-slate-900 dark:text-white">
                      <Calendar className="w-4 h-4 text-light-indigo dark:text-spiro-disco-ball" />
                      <span>{sess.date}</span>
                    </span>

                    <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                      {batch?.name || 'Batch'}
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${typeStyles}`}>
                      {sess.sessionType} Class
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
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
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
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

                {/* Lesson Summary Notes */}
                {sess.generalLessonSummary && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-700 dark:text-slate-200 mr-1.5">Lesson Notes:</span>
                    <span>{sess.generalLessonSummary}</span>
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
          <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-xl border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Student Attendance Roster
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {inspectingSession.date} • {batches.find((b) => b.id === inspectingSession.batchId)?.name}
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
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-12 text-center px-1.5 py-0.5 rounded font-black bg-slate-200 dark:bg-slate-800 text-[10px]">
                          Roll {stu?.publicRollNo || '—'}
                        </span>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white">
                            {stu?.name || 'Student'}
                          </div>
                          {stu?.guardianPhone && (
                            <div className="text-[10px] text-slate-400">
                              Guardian: {stu.guardianPhone}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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

            <div className="p-4 border-t border-slate-100 dark:border-dark-border flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
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
