import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import {
  AttendanceStatus,
  ClassSession,
  StudentSessionRecord,
  WeeklyDay,
} from '../../types/models';
import { createWhatsAppLink, WhatsAppTemplates } from '../../lib/whatsappTemplates';
import {
  Radio,
  Calendar,
  CheckCheck,
  Save,
  Clock,
  Sparkles,
  PhoneCall,
  Check,
  FileSpreadsheet,
  AlertTriangle,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const LiveClassSession: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    batches,
    students,
    sessions,
    sheets,
    syllabi,
    saveClassSession,
    toggleSheetDistributed,
  } = useData();

  // Find today's scheduled batch as default
  const todayDay = new Date().getDay() as WeeklyDay;
  const initialBatch =
    batches.find((b) => b.id === searchParams.get('batchId')) ||
    batches.find((b) => b.isActive && b.weeklyRoutine?.some((s) => s.dayOfWeek === todayDay)) ||
    batches[0];

  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatch?.id || '');
  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [sessionType, setSessionType] = useState<'regular' | 'extra' | 'makeup'>(
    (searchParams.get('type') as any) || 'regular'
  );
  const [lessonSummary, setLessonSummary] = useState<string>('');
  const [topicsTaughtText, setTopicsTaughtText] = useState<string>('');
  const [targetTopicStatus, setTargetTopicStatus] = useState<'in_progress' | 'completed'>(
    'completed'
  );
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Map of studentId -> StudentSessionRecord
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, StudentSessionRecord>
  >({});

  // Active batch students
  const activeBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];
  const enrolledStudents = students.filter(
    (s) => s.isActive && s.batchIds?.includes(activeBatch?.id || '')
  );

  // Collect syllabus topics from all enrolled students for quick-selection chips
  const batchSyllabusTopics = Array.from(
    new Set(
      enrolledStudents.flatMap((stu) => {
        const syl = syllabi[stu.id];
        return syl?.topics?.map((t) => t.title) || [];
      })
    )
  );

  // Initialize or load session records when batch changes
  useEffect(() => {
    if (!activeBatch) return;

    // Check if a session already exists for this batch and date
    const existing = sessions.find(
      (s) => s.batchId === activeBatch.id && s.date === sessionDate
    );

    if (existing) {
      setAttendanceRecords(existing.records || {});
      setLessonSummary(existing.generalLessonSummary || '');
      setTopicsTaughtText((existing.topicsTaught || []).join(', '));
      setSessionType(existing.sessionType);
    } else {
      // Default all enrolled students to 'present'
      const defaultRecords: Record<string, StudentSessionRecord> = {};
      enrolledStudents.forEach((stu) => {
        defaultRecords[stu.id] = {
          studentId: stu.id,
          attendance: 'present',
          topicsCoveredForStudent: [],
        };
      });
      setAttendanceRecords(defaultRecords);
    }
  }, [selectedBatchId, sessionDate]);

  // Set individual status
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        attendance: status,
      },
    }));
  };

  // Mark all present button
  const handleMarkAllPresent = () => {
    const updated: Record<string, StudentSessionRecord> = {};
    enrolledStudents.forEach((stu) => {
      updated[stu.id] = {
        ...attendanceRecords[stu.id],
        studentId: stu.id,
        attendance: 'present',
      };
    });
    setAttendanceRecords(updated);
  };

  // Add topic chip
  const handleToggleTopicChip = (topicTitle: string) => {
    const currentList = topicsTaughtText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    let updated: string[];
    if (currentList.includes(topicTitle)) {
      updated = currentList.filter((t) => t !== topicTitle);
    } else {
      updated = [...currentList, topicTitle];
    }
    setTopicsTaughtText(updated.join(', '));
  };

  // Save session
  const handleSaveSession = async () => {
    if (!activeBatch) return;

    const topicsArray = topicsTaughtText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const sessionId = `sess-${activeBatch.id}-${sessionDate}`;

    const newSession: ClassSession = {
      id: sessionId,
      batchId: activeBatch.id,
      date: sessionDate,
      sessionType,
      generalLessonSummary: lessonSummary.trim(),
      topicsTaught: topicsArray,
      records: attendanceRecords,
      createdAt: Date.now(),
    };

    await saveClassSession(newSession, targetTopicStatus);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // WhatsApp Alert for Absent/Late
  const handleSendAttendanceWhatsApp = (stu: any, status: 'absent' | 'late') => {
    const msg = WhatsAppTemplates.attendanceAlert(
      stu.name,
      status,
      sessionDate,
      activeBatch.name
    );
    const link = createWhatsAppLink(stu.guardianPhone, msg);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Hero Control Header */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-weird-green text-slate-950 animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                Live In-Class Mode
              </span>
              <span className="text-xs text-slate-400">One-handed 30s attendance & syllabus sync</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              Class Session & Attendance Manager
            </h1>
          </div>

          {/* Quick Mark All Present + Save Session */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700"
            >
              <CheckCheck className="w-4 h-4 text-weird-green" />
              <span>Mark All Present</span>
            </button>

            <button
              type="button"
              onClick={handleSaveSession}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen shadow-md shadow-weird-green/20 transition-transform active:scale-95"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved & Synced!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Session</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Batch, Date & Session Type Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-dark-border">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Select Batch
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.courseTag})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Class Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Session Type
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo"
            >
              <option value="regular">Regular Routine Class</option>
              <option value="extra">Extra Revision Class</option>
              <option value="makeup">Scheduled Makeup Class</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lesson Covered Synchronization Box (Crucial Workflow) */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-light-indigo/30 dark:border-light-indigo/20 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-light-indigo dark:text-neon-blue" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Lessons Covered & Automated Syllabus Sync
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Set topic status as:</span>
            <select
              value={targetTopicStatus}
              onChange={(e) => setTargetTopicStatus(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              General Lesson Summary (Batch-level log)
            </label>
            <textarea
              rows={2}
              value={lessonSummary}
              onChange={(e) => setLessonSummary(e.target.value)}
              placeholder="e.g. Covered Modifiers Rules 1–7 & solved Dhaka Board 2024 exercises."
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Topics Taught Today (Comma-separated or tap chips below)
            </label>
            <input
              type="text"
              value={topicsTaughtText}
              onChange={(e) => setTopicsTaughtText(e.target.value)}
              placeholder="e.g. Modifiers, Narration"
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo"
            />

            {/* Quick Chips from student syllabi */}
            {batchSyllabusTopics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {batchSyllabusTopics.map((topic, i) => {
                  const isSelected = topicsTaughtText.includes(topic);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleToggleTopicChip(topic)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
                        isSelected
                          ? 'bg-light-indigo text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-radiant-yellow flex-shrink-0" />
          <span>
            <strong>Sync Automation:</strong> Present/Late students with these topics will be marked{' '}
            <strong className="text-emerald-600 dark:text-wintergreen">{targetTopicStatus}</strong>.
            Absent/Excused students will automatically have these topics tagged as{' '}
            <strong className="text-light-red">Missed / Pending Makeup</strong> and routed to the
            Makeup Planner.
          </span>
        </div>
      </div>

      {/* Attendance & Sheet Distribution Student List */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Student Attendance & Sheet Handouts ({enrolledStudents.length} Students)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tap P, A, L, E pills. Distribute pending lecture sheets with 1 tap.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-dark-border">
          {enrolledStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No students enrolled in this batch.
            </div>
          ) : (
            enrolledStudents.map((stu) => {
              const record = attendanceRecords[stu.id] || {
                studentId: stu.id,
                attendance: 'present',
                topicsCoveredForStudent: [],
              };
              const currentStatus = record.attendance;

              // Find pending sheets for this student
              const unreceivedSheets = sheets.filter(
                (sh) =>
                  sh.batchId === activeBatch.id &&
                  (sh.targetStudentIds?.length === 0 || sh.targetStudentIds?.includes(stu.id)) &&
                  !sh.receivedByStudentIds?.includes(stu.id)
              );

              return (
                <div
                  key={stu.id}
                  className={`p-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    currentStatus === 'absent'
                      ? 'bg-light-red/5 dark:bg-light-red/10'
                      : currentStatus === 'late'
                      ? 'bg-radiant-yellow/5 dark:bg-radiant-yellow/10'
                      : currentStatus === 'excused'
                      ? 'bg-spiro-disco-ball/5 dark:bg-spiro-disco-ball/10'
                      : ''
                  }`}
                >
                  {/* Left: Roll, Name, School & Pending Sheet Alert */}
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-xs px-2 py-1 rounded-md bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow min-w-[50px] text-center">
                      {stu.publicRollNo}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {stu.name}
                        </span>
                        {stu.streakCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-weird-green/20 text-emerald-800 dark:text-wintergreen">
                            <Flame className="w-3 h-3 fill-current" />
                            {stu.streakCount}d
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{stu.schoolName}</span>
                        {stu.section && <span>• Sec {stu.section}</span>}
                      </div>

                      {/* Glowing Hammam Blue Pending Sheet Alert Banner */}
                      {unreceivedSheets.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {unreceivedSheets.map((sh) => (
                            <label
                              key={sh.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-hammam-blue/20 text-teal-900 dark:text-hammam-blue border border-hammam-blue/40 shadow-xs cursor-pointer hover:bg-hammam-blue/30 transition-all"
                            >
                              <input
                                type="checkbox"
                                onChange={() => toggleSheetDistributed(sh.id, stu.id)}
                                className="rounded text-teal-600 focus:ring-teal-500"
                              />
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>Needs {sh.sheetNumber} (Tap to Hand Over)</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Thumb-friendly Attendance Pills (P / A / L / E) */}
                  <div className="flex items-center gap-2">
                    {/* Absent / Late WhatsApp dispatch button */}
                    {(currentStatus === 'absent' || currentStatus === 'late') && (
                      <button
                        type="button"
                        onClick={() => handleSendAttendanceWhatsApp(stu, currentStatus)}
                        title="Send Instant WhatsApp Notice"
                        className="p-2 rounded-xl bg-weird-green/10 text-emerald-600 dark:text-wintergreen hover:bg-weird-green/20 transition-all"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>
                    )}

                    <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      {/* Present Pill */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(stu.id, 'present')}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-black text-xs sm:text-sm transition-all duration-150 ${
                          currentStatus === 'present'
                            ? 'bg-weird-green text-slate-950 shadow-md shadow-weird-green/30 scale-105'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                        title="Present"
                      >
                        P
                      </button>

                      {/* Absent Pill */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(stu.id, 'absent')}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-black text-xs sm:text-sm transition-all duration-150 ${
                          currentStatus === 'absent'
                            ? 'bg-light-red text-white shadow-md shadow-light-red/30 scale-105'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                        title="Absent"
                      >
                        A
                      </button>

                      {/* Late Pill */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(stu.id, 'late')}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-black text-xs sm:text-sm transition-all duration-150 ${
                          currentStatus === 'late'
                            ? 'bg-radiant-yellow text-slate-950 shadow-md shadow-radiant-yellow/30 scale-105'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                        title="Late"
                      >
                        L
                      </button>

                      {/* Excused Pill */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(stu.id, 'excused')}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-black text-xs sm:text-sm transition-all duration-150 ${
                          currentStatus === 'excused'
                            ? 'bg-spiro-disco-ball text-white shadow-md shadow-spiro-disco-ball/30 scale-105'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                        title="Excused"
                      >
                        E
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
