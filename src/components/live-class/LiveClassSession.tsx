import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import {
  AttendanceStatus,
  ClassSession,
  StudentSessionRecord,
  WeeklyDay,
  InClassExamDetail,
  AssignedHomeworkDetail,
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
  GraduationCap,
  BookOpenCheck,
  PlusCircle,
  Copy,
  Layers,
  Send,
  MessageSquare,
  HelpCircle,
  Award,
  Zap,
} from 'lucide-react';
import { MasterSyllabusSelector } from './MasterSyllabusSelector';
import { ClassRecordsView } from './ClassRecordsView';

interface LiveClassSessionProps {
  defaultTab?: 'conduct' | 'records';
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const [startTime, setStartTime] = useState<string>('18:30');
  const [endTime, setEndTime] = useState<string>('19:30');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Session mode: 'regular' | 'extra' | 'makeup'
  const [sessionType, setSessionType] = useState<'regular' | 'extra' | 'makeup'>(
    (searchParams.get('type') as any) || 'regular'
  );
  const [customTitle, setCustomTitle] = useState<string>('');

  // Lesson & Syllabus states
  const [lessonSummary, setLessonSummary] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [targetTopicStatus, setTargetTopicStatus] = useState<'in_progress' | 'completed'>(
    'completed'
  );

  // In-Class Exam / Pop Quiz states
  const [hasInClassExam, setHasInClassExam] = useState<boolean>(false);
  const [examTitle, setExamTitle] = useState<string>('In-Class Pop Quiz');
  const [examMaxMarks, setExamMaxMarks] = useState<number>(10);

  // Assigned Homework states
  const [hasAssignedHomework, setHasAssignedHomework] = useState<boolean>(false);
  const [homeworkTitle, setHomeworkTitle] = useState<string>('');
  const [homeworkDueDate, setHomeworkDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [homeworkDescription, setHomeworkDescription] = useState<string>('');

  // Next class lesson plan memo
  const [nextClassLessonPlan, setNextClassLessonPlan] = useState<string>('');

  // Feedback states
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

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
      setCustomTitle(existing.customTitle || '');
      setStartTime(existing.startTime || '18:30');
      setEndTime(existing.endTime || '19:30');
      setNextClassLessonPlan(existing.nextClassLessonPlan || '');

      if (existing.inClassExam?.hasExam) {
        setHasInClassExam(true);
        setExamTitle(existing.inClassExam.title || 'In-Class Pop Quiz');
        setExamMaxMarks(existing.inClassExam.maxMarks || 10);
      } else {
        setHasInClassExam(false);
      }

      if (existing.assignedHomework?.hasHomework) {
        setHasAssignedHomework(true);
        setHomeworkTitle(existing.assignedHomework.title || '');
        setHomeworkDueDate(existing.assignedHomework.dueDate || '');
        setHomeworkDescription(existing.assignedHomework.description || '');
      } else {
        setHasAssignedHomework(false);
      }
    } else {
      // Default all enrolled students to 'present'
      const defaultRecords: Record<string, StudentSessionRecord> = {};
      enrolledStudents.forEach((stu) => {
        defaultRecords[stu.id] = {
          studentId: stu.id,
          attendance: 'present',
          topicsCoveredForStudent: [],
          inClassQuizScore: 0,
          remarks: '',
        };
      });
      setAttendanceRecords(defaultRecords);
      setLessonSummary('');
      setSelectedTopics([]);
      setHasInClassExam(false);
      setHasAssignedHomework(false);
      setNextClassLessonPlan('');
      setCustomTitle('');

      // Auto-set routine slot if today matches
      const todaySlot = activeBatch.weeklyRoutine?.find((s) => s.dayOfWeek === todayDay);
      if (todaySlot) {
        setStartTime(todaySlot.startTime);
        setEndTime(todaySlot.endTime);
        setSelectedSlotId(`${todaySlot.dayOfWeek}-${todaySlot.startTime}`);
      }
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
        setCustomTitle(targetSession.customTitle || '');
        setLessonSummary(targetSession.generalLessonSummary || '');
        setSelectedTopics(targetSession.topicsTaught || []);
        setAttendanceRecords(targetSession.records || {});
        setStartTime(targetSession.startTime || '18:30');
        setEndTime(targetSession.endTime || '19:30');
        setNextClassLessonPlan(targetSession.nextClassLessonPlan || '');
        if (targetSession.inClassExam?.hasExam) {
          setHasInClassExam(true);
          setExamTitle(targetSession.inClassExam.title);
          setExamMaxMarks(targetSession.inClassExam.maxMarks);
        }
        if (targetSession.assignedHomework?.hasHomework) {
          setHasAssignedHomework(true);
          setHomeworkTitle(targetSession.assignedHomework.title);
          setHomeworkDueDate(targetSession.assignedHomework.dueDate);
          setHomeworkDescription(targetSession.assignedHomework.description || '');
        }
        setActiveTab('conduct');
      }
    }
  }, [searchParams, sessions]);

  // Select a slot from weekly routine
  const handleSelectRoutineSlot = (slot: any) => {
    setSelectedSlotId(`${slot.dayOfWeek}-${slot.startTime}`);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setSessionType('regular');
    setCustomTitle('');
  };

  // Switch to Extra Class mode
  const handleActivateExtraClass = (type: 'extra' | 'makeup') => {
    setSelectedSlotId(null);
    setSessionType(type);
    setCustomTitle(type === 'extra' ? 'Extra Revision Marathon' : 'Scheduled Makeup Class');
  };

  // Set individual attendance status
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

  // Update student quiz score
  const handleSetQuizScore = (studentId: string, score: number) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        inClassQuizScore: Math.min(examMaxMarks, Math.max(0, score)),
      },
    }));
  };

  // Update student remark
  const handleSetStudentRemark = (studentId: string, remarks: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        remarks,
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

    // Calculate in-class quiz metrics if conducted
    let inClassExamData: InClassExamDetail | undefined = undefined;
    if (hasInClassExam) {
      let totalScores = 0;
      let evaluatedCount = 0;
      let highest = 0;
      Object.values(attendanceRecords).forEach((rec) => {
        if (rec.attendance === 'present' || rec.attendance === 'late') {
          const score = rec.inClassQuizScore || 0;
          totalScores += score;
          evaluatedCount++;
          if (score > highest) highest = score;
        }
      });
      inClassExamData = {
        hasExam: true,
        examId: `exam-quiz-${sessionId}`,
        title: examTitle.trim() || 'In-Class Pop Quiz',
        maxMarks: examMaxMarks,
        linkedTopicTitles: selectedTopics,
        classAverage: evaluatedCount > 0 ? Math.round((totalScores / evaluatedCount) * 10) / 10 : 0,
        highestScore: highest,
      };
    }

    // Assigned homework detail
    let assignedHwData: AssignedHomeworkDetail | undefined = undefined;
    if (hasAssignedHomework) {
      assignedHwData = {
        hasHomework: true,
        homeworkId: `hw-${sessionId}`,
        title: homeworkTitle.trim() || `Homework for ${sessionDate}`,
        dueDate: homeworkDueDate,
        description: homeworkDescription.trim(),
        relatedTopics: selectedTopics,
      };
    }

    const newSession: ClassSession = {
      id: sessionId,
      batchId: activeBatch.id,
      date: sessionDate,
      startTime,
      endTime,
      routineSlotId: selectedSlotId || undefined,
      sessionType,
      customTitle: customTitle.trim() || undefined,
      generalLessonSummary: lessonSummary.trim(),
      topicsTaught: selectedTopics,
      topicProgressStatus: targetTopicStatus,
      records: attendanceRecords,
      inClassExam: inClassExamData,
      assignedHomework: assignedHwData,
      nextClassLessonPlan: nextClassLessonPlan.trim() || undefined,
      createdAt: Date.now(),
    };

    await saveClassSession(newSession, targetTopicStatus);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Generate WhatsApp Class Summary for group broadcast
  const handleCopyWhatsAppSummary = () => {
    const presentCount = Object.values(attendanceRecords).filter(
      (r) => r.attendance === 'present'
    ).length;
    const absentCount = Object.values(attendanceRecords).filter(
      (r) => r.attendance === 'absent'
    ).length;
    const lateCount = Object.values(attendanceRecords).filter(
      (r) => r.attendance === 'late'
    ).length;

    let text = `📚 *NPB Academic Session Summary — ${activeBatch?.name}*\n`;
    text += `📅 *Date:* ${sessionDate} (${sessionType.toUpperCase()} CLASS)\n`;
    text += `⏱️ *Time Slot:* ${startTime} – ${endTime}\n`;
    if (customTitle) text += `🎯 *Focus:* ${customTitle}\n`;
    text += `\n📖 *Topics Covered Today:*\n`;
    if (selectedTopics.length > 0) {
      selectedTopics.forEach((t) => {
        text += `• ${t}\n`;
      });
    } else {
      text += `• ${lessonSummary || 'General revision exercises'}\n`;
    }

    if (hasInClassExam) {
      text += `\n📝 *In-Class Quiz Held:*\n`;
      text += `• Quiz: ${examTitle} (Marks: /${examMaxMarks})\n`;
    }

    if (hasAssignedHomework) {
      text += `\n📚 *Homework Assigned:*\n`;
      text += `• ${homeworkTitle}\n`;
      text += `• Due Date: ${homeworkDueDate}\n`;
    }

    text += `\n👥 *Attendance Breakdown:*\n`;
    text += `✅ Present: ${presentCount} | ❌ Absent: ${absentCount} | ⏳ Late: ${lateCount}\n`;

    if (nextClassLessonPlan) {
      text += `\n📌 *Next Class Focus:* ${nextClassLessonPlan}\n`;
    }

    text += `\n_Recorded systematically via NPB Academic System._`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  // Broadcast WhatsApp to all absent students
  const handleBroadcastAbsentWhatsApp = () => {
    const absentStudents = enrolledStudents.filter(
      (stu) => attendanceRecords[stu.id]?.attendance === 'absent'
    );
    if (absentStudents.length === 0) return;

    // Open first absent student's WhatsApp link
    const firstStu = absentStudents[0];
    const msg = WhatsAppTemplates.attendanceAlert(
      firstStu.name,
      'absent',
      sessionDate,
      activeBatch.name
    );
    const link = createWhatsAppLink(firstStu.guardianPhone, msg);
    window.open(link, '_blank');
  };

  // WhatsApp Alert for single student
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
    setCustomTitle(sess.customTitle || '');
    setStartTime(sess.startTime || '18:30');
    setEndTime(sess.endTime || '19:30');
    setLessonSummary(sess.generalLessonSummary || '');
    setSelectedTopics(sess.topicsTaught || []);
    setAttendanceRecords(sess.records || {});
    setNextClassLessonPlan(sess.nextClassLessonPlan || '');
    if (sess.inClassExam?.hasExam) {
      setHasInClassExam(true);
      setExamTitle(sess.inClassExam.title);
      setExamMaxMarks(sess.inClassExam.maxMarks);
    }
    if (sess.assignedHomework?.hasHomework) {
      setHasAssignedHomework(true);
      setHomeworkTitle(sess.assignedHomework.title);
      setHomeworkDueDate(sess.assignedHomework.dueDate);
      setHomeworkDescription(sess.assignedHomework.description || '');
    }
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
            <span>Live Class & Session Recording</span>
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
          <span>Select from schedule or create extra sessions</span>
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
          <div className="bg-white dark:bg-dark-surface p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black ${
                    sessionType === 'extra'
                      ? 'bg-bright-lilac text-white'
                      : sessionType === 'makeup'
                      ? 'bg-spiro-disco-ball text-white'
                      : 'bg-weird-green text-slate-950 animate-pulse'
                  }`}>
                    {sessionType === 'extra' ? <Zap className="w-3.5 h-3.5" /> : <Radio className="w-3.5 h-3.5" />}
                    <span>{sessionType === 'extra' ? 'Extra Revision Class' : sessionType === 'makeup' ? 'Scheduled Makeup' : 'Routine Class Session'}</span>
                  </span>
                  <span className="text-xs text-slate-400">
                    Batch: <strong className="text-slate-800 dark:text-white">{activeBatch?.name || 'Selected'}</strong>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Academic Session & Detailed Record System
                </h1>
              </div>

              {/* Action Buttons: Save Session + Copy WhatsApp Summary */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyWhatsAppSummary}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                  title="Copy formatted summary to paste into batch WhatsApp group"
                >
                  {copiedSummary ? <Check className="w-4 h-4 text-weird-green" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSummary ? 'Copied Summary!' : 'Copy WA Summary'}</span>
                </button>

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
                      <span>Save Session Record</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* SCHEDULE SELECTOR STRIP: Routine Slots vs Extra Class Creator */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-light-indigo dark:text-neon-blue" />
                  <span>Weekly Schedule Routine for {activeBatch?.name} (Tap to Select Slot):</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleActivateExtraClass('extra')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      sessionType === 'extra'
                        ? 'bg-bright-lilac text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>+ Add Extra Class</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleActivateExtraClass('makeup')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      sessionType === 'makeup'
                        ? 'bg-spiro-disco-ball text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>+ Makeup Class</span>
                  </button>
                </div>
              </div>

              {/* Routine Slots List */}
              <div className="flex flex-wrap items-center gap-2">
                {activeBatch?.weeklyRoutine && activeBatch.weeklyRoutine.length > 0 ? (
                  activeBatch.weeklyRoutine.map((slot, idx) => {
                    const isToday = slot.dayOfWeek === todayDay;
                    const isSelected =
                      selectedSlotId === `${slot.dayOfWeek}-${slot.startTime}` &&
                      sessionType === 'regular';

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectRoutineSlot(slot)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-light-indigo text-white shadow-md shadow-light-indigo/30 ring-2 ring-light-indigo'
                            : isToday
                            ? 'bg-weird-green/15 text-emerald-950 dark:text-weird-green border border-weird-green/40 hover:bg-weird-green/25'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {WEEKDAY_NAMES[slot.dayOfWeek]} {slot.startTime} – {slot.endTime}
                        </span>
                        {isToday && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-weird-green text-slate-950 font-black">
                            Today
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    No weekly routine slots configured in batch settings. Use Extra Class or configure in Batches tab.
                  </span>
                )}
              </div>
            </div>

            {/* Batch, Date, Time & Session Title Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
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
                  Class Time Slot
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-400 font-bold">–</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Session Title / Reason
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={
                    sessionType === 'extra'
                      ? 'e.g. Board Questions Solves Special'
                      : sessionType === 'makeup'
                      ? 'e.g. Narration Makeup Class'
                      : 'Regular Routine Class'
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo"
                />
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
                placeholder="e.g. Covered Modifiers Rules 1–7 with board question examples. Solved Dhaka Board 2024 exercises."
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
          </div>

          {/* IN-CLASS EXAM / POP QUIZ INTEGRATION CARD */}
          <div className="bg-white dark:bg-dark-surface p-5 sm:p-6 rounded-2xl border border-radiant-yellow/30 dark:border-radiant-yellow/20 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-radiant-yellow/15 text-amber-800 dark:text-radiant-yellow">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    In-Class Exam / Pop Quiz Detail
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Record quick test marks taken during this class. Auto-syncs to Exam Tracker and student mastery analytics.
                  </p>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasInClassExam}
                  onChange={(e) => setHasInClassExam(e.target.checked)}
                  className="rounded text-light-indigo focus:ring-light-indigo w-4 h-4"
                />
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {hasInClassExam ? 'Quiz Active' : 'Enable Quiz'}
                </span>
              </label>
            </div>

            {hasInClassExam && (
              <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-radiant-yellow/30 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in-50">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Quiz / Exam Title
                  </label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="e.g. Modifiers 10-Min Pop Quiz"
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={examMaxMarks}
                    onChange={(e) => setExamMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                  <Award className="w-4 h-4 text-radiant-yellow" />
                  <span>
                    Individual student score fields will appear in the attendance roster below (out of {examMaxMarks}).
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ASSIGNED HOMEWORK & NEXT CLASS PLAN INTEGRATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Homework Assignment */}
            <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="w-4 h-4 text-radiant-yellow" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Homework Assigned
                  </h3>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={hasAssignedHomework}
                    onChange={(e) => setHasAssignedHomework(e.target.checked)}
                    className="rounded text-light-indigo focus:ring-light-indigo w-3.5 h-3.5"
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">Assign HW</span>
                </label>
              </div>

              {hasAssignedHomework ? (
                <div className="space-y-2 pt-1 animate-in fade-in-50">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Homework Task Title
                    </label>
                    <input
                      type="text"
                      value={homeworkTitle}
                      onChange={(e) => setHomeworkTitle(e.target.value)}
                      placeholder="e.g. Modifiers Sheet 04 Exercises 1–25"
                      className="w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={homeworkDueDate}
                        onChange={(e) => setHomeworkDueDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        value={homeworkDescription}
                        onChange={(e) => setHomeworkDescription(e.target.value)}
                        placeholder="e.g. Solve in homework copy"
                        className="w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No homework tagged to this session. Check 'Assign HW' to log homework due next class.
                </p>
              )}
            </div>

            {/* Next Class Lesson Plan */}
            <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-spiro-disco-ball" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Next Class Preparation Plan & Memo
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reminder note for what to teach and check in the upcoming routine class.
              </p>
              <textarea
                rows={3}
                value={nextClassLessonPlan}
                onChange={(e) => setNextClassLessonPlan(e.target.value)}
                placeholder="e.g. Check Modifiers HW, begin Narration rules 1–5, distribute lecture sheet 05."
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo"
              />
            </div>
          </div>

          {/* Student Attendance & Detailed Recording Roster */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    Student Attendance Roster ({enrolledStudents.length} Students)
                  </h3>
                  {hasInClassExam && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-radiant-yellow/20 text-amber-900 dark:text-radiant-yellow">
                      Quiz Active (/{examMaxMarks} marks)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tap P (Present), A (Absent), L (Late), E (Excused). Record quiz score and teacher observations.
                </p>
              </div>

              {/* Absent broadcast button */}
              {enrolledStudents.some((s) => attendanceRecords[s.id]?.attendance === 'absent') && (
                <button
                  type="button"
                  onClick={handleBroadcastAbsentWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-light-red/10 text-red-700 dark:text-light-red hover:bg-light-red/20 transition-all border border-light-red/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Notify Absentees on WhatsApp</span>
                </button>
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
                    inClassQuizScore: 0,
                    remarks: '',
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
                      {/* Left: Roll, Name, School & In-Class Score Input */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="font-extrabold text-xs px-2.5 py-1.5 rounded-lg bg-radiant-yellow/20 text-amber-900 dark:text-radiant-yellow min-w-[50px] text-center">
                          {stu.publicRollNo}
                        </span>

                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
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

                          {/* Student remarks / notes input */}
                          <div className="pt-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={record.remarks || ''}
                              onChange={(e) => handleSetStudentRemark(stu.id, e.target.value)}
                              placeholder="Observation / note (e.g. good mastery, needs revision)"
                              className="px-2 py-1 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-full max-w-xs focus:ring-1 focus:ring-light-indigo"
                            />
                          </div>

                          {/* Pending Sheet Handover Alert Banner */}
                          {unreceivedSheets.length > 0 && (
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
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

                      {/* Right: Quiz Score & Attendance Status Buttons */}
                      <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                        {/* In-Class Quiz Score Field */}
                        {hasInClassExam && (
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Score:</span>
                            <input
                              type="number"
                              min={0}
                              max={examMaxMarks}
                              value={record.inClassQuizScore ?? 0}
                              onChange={(e) => handleSetQuizScore(stu.id, Number(e.target.value))}
                              disabled={currentStatus === 'absent'}
                              className="w-12 px-1.5 py-0.5 rounded text-xs font-black text-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                            />
                            <span className="text-[10px] font-bold text-slate-400">/{examMaxMarks}</span>
                          </div>
                        )}

                        {/* Absent WhatsApp Dispatch Button */}
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

                        {/* P / A / L / E Pills */}
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
