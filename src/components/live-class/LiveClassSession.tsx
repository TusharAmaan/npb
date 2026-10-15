import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
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
  History,
  UserPlus,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { MasterSyllabusSelector } from './MasterSyllabusSelector';
import { ClassRecordsView } from './ClassRecordsView';

interface LiveClassSessionProps {
  defaultTab?: 'conduct' | 'records';
}

export const LiveClassSession: React.FC<LiveClassSessionProps> = ({ defaultTab = 'conduct' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    batches,
    students,
    sessions,
    sheets,
    saveClassSession,
    toggleSheetDistributed,
  } = useData();

  // Tab state: 'conduct' (live recording) or 'records' (history archive)
  const isRecordsRoute =
    defaultTab === 'records' ||
    location.pathname.includes('/records') ||
    searchParams.get('tab') === 'records';

  const [activeTab, setActiveTab] = useState<'conduct' | 'records'>(
    isRecordsRoute ? 'records' : 'conduct'
  );

  // Sync tab state when route or params change
  useEffect(() => {
    if (location.pathname.includes('/records') || defaultTab === 'records' || searchParams.get('tab') === 'records') {
      setActiveTab('records');
    } else {
      setActiveTab('conduct');
    }
  }, [location.pathname, defaultTab, searchParams]);

  // Switch tabs
  const handleSwitchTab = (tab: 'conduct' | 'records') => {
    setActiveTab(tab);
    if (tab === 'records') {
      navigate('/admin/records');
    } else {
      navigate('/admin/live-class');
    }
  };

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
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
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

  // Initialize or load session records when batch or date changes
  useEffect(() => {
    if (!activeBatch) return;

    // Check if a session already exists for this batch and date
    const existing = sessions.find(
      (s) => s.batchId === activeBatch.id && s.date === sessionDate
    );

    if (existing) {
      setAttendanceRecords(existing.records || {});
      setLessonSummary(existing.generalLessonSummary || '');
      setSelectedTopics(existing.topicsTaught || []);
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
      // If new session and no existing data, reset summary & topics
      setLessonSummary('');
      setSelectedTopics([]);
    }
  }, [selectedBatchId, sessionDate]);

  // Handle URL sessionId param directly for deep-linking
  useEffect(() => {
    const sessionIdParam = searchParams.get('sessionId');
    if (sessionIdParam) {
      const targetSession = sessions.find((s) => s.id === sessionIdParam);
      if (targetSession) {
        setSelectedBatchId(targetSession.batchId);
        setSessionDate(targetSession.date);
        setSessionType(targetSession.sessionType);
        setLessonSummary(targetSession.generalLessonSummary || '');
        setSelectedTopics(targetSession.topicsTaught || []);
        setAttendanceRecords(targetSession.records || {});
        setActiveTab('conduct');
      }
    }
  }, [searchParams, sessions]);

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

  // Save session
  const handleSaveSession = async () => {
    if (!activeBatch) return;

    const sessionId = `sess-${activeBatch.id}-${sessionDate}`;

    const newSession: ClassSession = {
      id: sessionId,
      batchId: activeBatch.id,
      date: sessionDate,
      sessionType,
      generalLessonSummary: lessonSummary.trim(),
      topicsTaught: selectedTopics,
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

  // Handle session editing from Records view
  const handleEditSessionFromRecords = (sess: ClassSession) => {
    setSelectedBatchId(sess.batchId);
    setSessionDate(sess.date);
    setSessionType(sess.sessionType);
    setLessonSummary(sess.generalLessonSummary || '');
    setSelectedTopics(sess.topicsTaught || []);
    setAttendanceRecords(sess.records || {});
    handleSwitchTab('conduct');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Segmented Navigation Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-dark-surface p-2.5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div className="flex items-center gap-2">
          {/* Conduct Live Class Tab Button */}
          <button
            type="button"
            onClick={() => handleSwitchTab('conduct')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
              activeTab === 'conduct'
                ? 'bg-weird-green text-slate-950 shadow-md shadow-weird-green/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Radio className={`w-4 h-4 ${activeTab === 'conduct' ? 'animate-pulse' : ''}`} />
            <span>Live Class Mode</span>
          </button>

          {/* Class Records & Archive Tab Button */}
          <button
            type="button"
            onClick={() => handleSwitchTab('records')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
              activeTab === 'records'
                ? 'bg-light-indigo text-white shadow-md shadow-light-indigo/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Class Records & History</span>
            <span
              className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'records'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {sessions.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-2 sm:px-0">
          <Clock className="w-3.5 h-3.5" />
          <span>Quick 30s attendance & automated syllabus sync</span>
        </div>
      </div>

      {/* Conditionally Render Records View OR Conduct Live Class */}
      {activeTab === 'records' ? (
        <ClassRecordsView
          onEditSession={handleEditSessionFromRecords}
          onConductNewClass={() => handleSwitchTab('conduct')}
        />
      ) : (
        /* LIVE CLASS SESSION FORM */
        <div className="space-y-5">
          {/* Hero Control Header */}
          <div className="bg-white dark:bg-dark-surface p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-weird-green text-slate-950 animate-pulse">
                    <Radio className="w-3.5 h-3.5" />
                    Live In-Class Session
                  </span>
                  <span className="text-xs text-slate-400">
                    Recording for: <strong className="text-slate-800 dark:text-white">{activeBatch?.name || 'Selected Batch'}</strong>
                  </span>
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
                  disabled={enrolledStudents.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCheck className="w-4 h-4 text-weird-green" />
                  <span>Mark All Present</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSession}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen shadow-md shadow-weird-green/20 transition-transform active:scale-95"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
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

          {/* Structured Lessons & Master Syllabus Synchronization */}
          <div className="bg-white dark:bg-dark-surface p-5 sm:p-6 rounded-2xl border border-light-indigo/30 dark:border-light-indigo/20 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-light-indigo dark:text-neon-blue" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Lessons Covered & Master Syllabus Sync
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select curriculum topics taught today. Present students will be marked completed; absent students will be flagged for makeup.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Mark topics as:</span>
                <select
                  value={targetTopicStatus}
                  onChange={(e) => setTargetTopicStatus(e.target.value as any)}
                  className="px-2 py-0.5 rounded-lg text-xs font-bold border-0 bg-transparent text-slate-900 dark:text-white focus:ring-0 cursor-pointer"
                >
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                </select>
              </div>
            </div>

            {/* General Lesson Summary Log */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                General Lesson Summary & Batch Notes
              </label>
              <textarea
                rows={2}
                value={lessonSummary}
                onChange={(e) => setLessonSummary(e.target.value)}
                placeholder="e.g. Covered Modifiers Rules 1–7 with board question examples. Assigned Practice Sheet 04 for homework."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Structured Master Syllabus Selector */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Curriculum Topics Covered (Tap to Select or Add Custom)
              </label>
              <MasterSyllabusSelector
                selectedTopics={selectedTopics}
                onChange={setSelectedTopics}
                enrolledStudentsCount={enrolledStudents.length}
              />
            </div>

            {/* Sync Automation Alert Banner */}
            <div className="p-3 rounded-xl bg-light-indigo/5 dark:bg-light-indigo/10 border border-light-indigo/20 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-radiant-yellow flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white">Automated Syllabus & Makeup Pipeline:</span>
                <p>
                  When you save, <strong>Present/Late</strong> students have these topics updated to{' '}
                  <span className="font-bold text-emerald-600 dark:text-wintergreen">{targetTopicStatus}</span>.
                  Any <strong>Absent</strong> student automatically has these topics tagged as{' '}
                  <span className="font-bold text-light-red">Missed</span> in their profile and queued in the{' '}
                  <span className="font-bold text-light-indigo dark:text-spiro-disco-ball">Makeup Planner</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Student Attendance & Handouts Section */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Student Attendance & Lecture Sheet Handouts
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {enrolledStudents.length} Enrolled
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tap P (Present), A (Absent), L (Late), E (Excused). Tick lecture sheets to mark as handed over.
                </p>
              </div>

              {enrolledStudents.length > 0 && (
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-weird-green" /> P = Present
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-light-red" /> A = Absent
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-radiant-yellow" /> L = Late
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-spiro-disco-ball" /> E = Excused
                  </span>
                </div>
              )}
            </div>

            {/* Zero Students Alert Box */}
            {enrolledStudents.length === 0 ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-radiant-yellow flex items-center justify-center mx-auto">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    No Students Enrolled in {activeBatch?.name || 'this Batch'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Students must be assigned to this batch in the Student Directory to take attendance. You can still log the batch curriculum topics and lesson notes above.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/students')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue transition-all shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Go to Student Directory</span>
                  </button>
                  {batches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const otherBatch = batches.find((b) => b.id !== activeBatch?.id);
                        if (otherBatch) setSelectedBatchId(otherBatch.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      <span>Switch to Another Batch</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Enrolled Students Roster */
              <div className="divide-y divide-slate-100 dark:divide-dark-border">
                {enrolledStudents.map((stu) => {
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
                      className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
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
                        <span className="font-extrabold text-xs px-2.5 py-1.5 rounded-lg bg-radiant-yellow/20 text-amber-900 dark:text-radiant-yellow min-w-[50px] text-center">
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

                      {/* Right: Attendance Pills & WhatsApp Button */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {/* Absent / Late WhatsApp dispatch button */}
                        {(currentStatus === 'absent' || currentStatus === 'late') && (
                          <button
                            type="button"
                            onClick={() => handleSendAttendanceWhatsApp(stu, currentStatus)}
                            title="Send Instant WhatsApp Notice to Guardian"
                            className="p-2.5 rounded-xl bg-weird-green/10 text-emerald-600 dark:text-wintergreen hover:bg-weird-green/20 transition-all border border-weird-green/20"
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
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
