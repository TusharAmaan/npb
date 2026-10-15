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
  Student,
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
  Building2,
  BookOpen,
  Search,
  X,
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
    schools,
    sessions,
    sheets,
    homeworks,
    syllabusSchemes,
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
  const [homeworkSchemeId, setHomeworkSchemeId] = useState<string>('');
  const [homeworkSelectedTopics, setHomeworkSelectedTopics] = useState<string[]>([]);
  const [homeworkCustomTopic, setHomeworkCustomTopic] = useState<string>('');
  const [homeworkCustomTopicsList, setHomeworkCustomTopicsList] = useState<string[]>([]);
  const [homeworkGradingMode, setHomeworkGradingMode] = useState<'status_only' | 'status_and_marks'>('status_only');
  const [homeworkMaxMarks, setHomeworkMaxMarks] = useState<number>(10);
  const [homeworkTargetType, setHomeworkTargetType] = useState<'whole_batch' | 'specific_schools' | 'specific_students'>('whole_batch');
  const [homeworkTargetSchoolIds, setHomeworkTargetSchoolIds] = useState<string[]>([]);

  // Distributed lecture sheet states
  const [distributedSheetIds, setDistributedSheetIds] = useState<string[]>([]);

  // Next class lesson plan memo
  const [nextClassLessonPlan, setNextClassLessonPlan] = useState<string>('');

  // Feedback states
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Map of studentId -> StudentSessionRecord
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, StudentSessionRecord>
  >({});
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'excused'>('all');
  const [rosterSchoolFilter, setRosterSchoolFilter] = useState<string>('all');
  const [rosterSearchQuery, setRosterSearchQuery] = useState<string>('');
  const [rosterGroupBySchool, setRosterGroupBySchool] = useState<boolean>(true);

  // Active batch students
  const activeBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];
  const enrolledStudents = students.filter(
    (s) => s.isActive && s.batchIds?.includes(activeBatch?.id || '')
  );

  // Distinct schools in active batch
  const batchSchools = React.useMemo(() => {
    const ids = Array.from(new Set(enrolledStudents.map((s) => s.schoolId)));
    return ids
      .map((id) => schools.find((sc) => sc.id === id) || { id, name: id, shortCode: id, createdAt: 0 })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrolledStudents, schools]);

  // Active syllabus schemes for active batch
  const batchSchemes = React.useMemo(
    () => syllabusSchemes.filter((sch) => sch.targetBatchId === selectedBatchId),
    [syllabusSchemes, selectedBatchId]
  );

  // Active lecture sheets for active batch
  const batchSheets = React.useMemo(
    () => sheets.filter((sh) => sh.batchId === selectedBatchId),
    [sheets, selectedBatchId]
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

      setDistributedSheetIds(existing.distributedSheetIds || []);
      if (existing.assignedHomework?.hasHomework) {
        setHasAssignedHomework(true);
        setHomeworkTitle(existing.assignedHomework.title || '');
        setHomeworkDueDate(existing.assignedHomework.dueDate || '');
        setHomeworkDescription(existing.assignedHomework.description || '');
        setHomeworkSchemeId(existing.assignedHomework.schemeId || '');
        setHomeworkSelectedTopics(existing.assignedHomework.relatedTopics || []);
        setHomeworkCustomTopicsList(existing.assignedHomework.outOfSyllabusTopics || []);
        setHomeworkGradingMode(existing.assignedHomework.gradingMode || 'status_only');
        setHomeworkMaxMarks(existing.assignedHomework.maxMarks || 10);
        setHomeworkTargetType(existing.assignedHomework.targetType || 'whole_batch');
        setHomeworkTargetSchoolIds(existing.assignedHomework.targetSchoolIds || []);
      } else {
        setHasAssignedHomework(false);
        setHomeworkTitle('');
        setHomeworkSelectedTopics([]);
        setHomeworkCustomTopicsList([]);
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
      setDistributedSheetIds([]);
      setHasInClassExam(false);
      setHasAssignedHomework(false);
      setHomeworkTitle('');
      setHomeworkSelectedTopics([]);
      setHomeworkCustomTopicsList([]);
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
      const allHwTopics = [...homeworkSelectedTopics, ...homeworkCustomTopicsList];
      assignedHwData = {
        hasHomework: true,
        homeworkId: `hw-${sessionId}`,
        title: homeworkTitle.trim() || `Homework for ${sessionDate}`,
        dueDate: homeworkDueDate,
        description: homeworkDescription.trim(),
        relatedTopics: allHwTopics.length > 0 ? allHwTopics : selectedTopics,
        outOfSyllabusTopics: homeworkCustomTopicsList,
        schemeId: homeworkSchemeId || undefined,
        gradingMode: homeworkGradingMode,
        maxMarks: homeworkGradingMode === 'status_and_marks' ? Number(homeworkMaxMarks) : undefined,
        targetType: homeworkTargetType,
        targetSchoolIds: homeworkTargetType === 'specific_schools' ? homeworkTargetSchoolIds : undefined,
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
      distributedSheetIds,
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

          {/* ASSIGNED HOMEWORK, LECTURE SHEETS & NEXT CLASS PLAN INTEGRATION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Homework Assignment (Span 2 cols on lg) */}
            <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="w-4 h-4 text-radiant-yellow" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Homework Assignment for this Class
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/homework')}
                    className="text-[11px] font-bold text-light-indigo dark:text-neon-blue hover:underline"
                  >
                    Open Tracker ↗
                  </button>
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
              </div>

              {hasAssignedHomework ? (
                <div className="space-y-3 pt-1 animate-in fade-in-50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Homework Task Title *
                      </label>
                      <input
                        type="text"
                        value={homeworkTitle}
                        onChange={(e) => setHomeworkTitle(e.target.value)}
                        placeholder="e.g. Modifiers Sheet 04 Exercises 1–25"
                        className="w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
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
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Instructions & Reference Notes
                    </label>
                    <input
                      type="text"
                      value={homeworkDescription}
                      onChange={(e) => setHomeworkDescription(e.target.value)}
                      placeholder="e.g. Solve exercises 1 to 20 in HW copy; check board question formats."
                      className="w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Syllabus Scheme Link & Topic Picker */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-light-indigo" />
                        <span>Link to Syllabus Scheme (Optional):</span>
                      </label>
                      <select
                        value={homeworkSchemeId}
                        onChange={(e) => setHomeworkSchemeId(e.target.value)}
                        className="px-2 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="">No Scheme / Independent Homework</option>
                        {batchSchemes.map((sch) => (
                          <option key={sch.id} value={sch.id}>
                            {sch.title} ({sch.termType.replace('_', ' ').toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Topic chips from selected scheme */}
                    {homeworkSchemeId && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Select Syllabus Topics Tested:
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar p-1">
                          {batchSchemes
                            .find((s) => s.id === homeworkSchemeId)
                            ?.topics.map((top) => {
                              const isChecked = homeworkSelectedTopics.includes(top.title);
                              return (
                                <button
                                  key={top.id}
                                  type="button"
                                  onClick={() => {
                                    setHomeworkSelectedTopics((prev) =>
                                      isChecked
                                        ? prev.filter((t) => t !== top.title)
                                        : [...prev, top.title]
                                    );
                                  }}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                                    isChecked
                                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {top.title}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Out of Syllabus Custom Topic adder */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={homeworkCustomTopic}
                          onChange={(e) => setHomeworkCustomTopic(e.target.value)}
                          placeholder="+ Out-of-syllabus topic (e.g. Extra Olympiad Rules)"
                          className="flex-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              homeworkCustomTopic.trim() &&
                              !homeworkCustomTopicsList.includes(homeworkCustomTopic.trim())
                            ) {
                              setHomeworkCustomTopicsList((prev) => [
                                ...prev,
                                homeworkCustomTopic.trim(),
                              ]);
                              setHomeworkCustomTopic('');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-2xs"
                        >
                          Add
                        </button>
                      </div>

                      {homeworkCustomTopicsList.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {homeworkCustomTopicsList.map((ct, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            >
                              <span>⚡ {ct}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setHomeworkCustomTopicsList((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                                className="hover:text-red-500"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Target Scope & Grading Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Target Student Scope
                      </label>
                      <select
                        value={homeworkTargetType}
                        onChange={(e) => setHomeworkTargetType(e.target.value as any)}
                        className="w-full px-2.5 py-1 rounded-lg font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="whole_batch">Entire Batch ({enrolledStudents.length} Students)</option>
                        <option value="specific_schools">Specific Schools in Batch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Evaluation Mode
                      </label>
                      <select
                        value={homeworkGradingMode}
                        onChange={(e) => setHomeworkGradingMode(e.target.value as any)}
                        className="w-full px-2.5 py-1 rounded-lg font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="status_only">Fast Status (Done/Partial/Late/Not Done)</option>
                        <option value="status_and_marks">Status + Numeric Marks</option>
                      </select>
                    </div>
                  </div>

                  {homeworkTargetType === 'specific_schools' && (
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Select Target Schools:
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {batchSchools.map((sc) => {
                          const isChecked = homeworkTargetSchoolIds.includes(sc.id);
                          return (
                            <label key={sc.id} className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setHomeworkTargetSchoolIds((prev) =>
                                    isChecked ? prev.filter((id) => id !== sc.id) : [...prev, sc.id]
                                  );
                                }}
                                className="rounded text-light-indigo focus:ring-light-indigo w-3.5 h-3.5"
                              />
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {sc.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No homework tagged to this session. Check 'Assign HW' to record a task with syllabus topics or custom exercises.
                </p>
              )}
            </div>

            {/* Distributed Lecture Sheets & Next Class Memo (1 col on lg) */}
            <div className="space-y-4">
              {/* Lecture Sheet Handout Selection */}
              <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Handout Distributed Today
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/lecture-sheets')}
                    className="text-[10px] font-bold text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    Sheets ↗
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select sheets given in class. Attendees marked Present/Late will auto-receive them!
                </p>

                {batchSheets.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No sheets logged for this batch yet.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                    {batchSheets.map((sh) => {
                      const isChecked = distributedSheetIds.includes(sh.id);
                      return (
                        <label
                          key={sh.id}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-teal-500/10 border-teal-500/30'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-teal-500'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setDistributedSheetIds((prev) =>
                                  isChecked ? prev.filter((id) => id !== sh.id) : [...prev, sh.id]
                                );
                              }}
                              className="rounded text-teal-600 focus:ring-teal-600 w-3.5 h-3.5"
                            />
                            <div className="truncate">
                              <span className="text-[10px] font-black text-teal-700 dark:text-teal-300 block">
                                {sh.sheetNumber}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                                {sh.title}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Next Class Lesson Plan */}
              <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-2">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-spiro-disco-ball" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Next Class Memo
                  </h3>
                </div>
                <textarea
                  rows={2}
                  value={nextClassLessonPlan}
                  onChange={(e) => setNextClassLessonPlan(e.target.value)}
                  placeholder="e.g. Check Modifiers HW, distribute Sheet 05."
                  className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo"
                />
              </div>
            </div>
          </div>

          {/* Student Attendance & Detailed Recording Roster (Mobile-First Premium UI) */}
          {(() => {
            const presentCount = enrolledStudents.filter(
              (s) => (attendanceRecords[s.id]?.attendance || 'present') === 'present'
            ).length;
            const absentCount = enrolledStudents.filter(
              (s) => attendanceRecords[s.id]?.attendance === 'absent'
            ).length;
            const lateCount = enrolledStudents.filter(
              (s) => attendanceRecords[s.id]?.attendance === 'late'
            ).length;
            const excusedCount = enrolledStudents.filter(
              (s) => attendanceRecords[s.id]?.attendance === 'excused'
            ).length;
            const attendanceRate =
              enrolledStudents.length > 0 ? Math.round((presentCount / enrolledStudents.length) * 100) : 0;

            const displayedStudents = enrolledStudents.filter((stu) => {
              if (rosterSchoolFilter !== 'all' && stu.schoolId !== rosterSchoolFilter) {
                return false;
              }
              if (rosterSearchQuery.trim()) {
                const q = rosterSearchQuery.toLowerCase().trim();
                const matchName = stu.name.toLowerCase().includes(q);
                const matchRoll = (stu.publicRollNo || '').toLowerCase().includes(q);
                const matchSchool = (stu.schoolName || '').toLowerCase().includes(q);
                if (!matchName && !matchRoll && !matchSchool) return false;
              }
              if (attendanceFilter === 'all') return true;
              const status = attendanceRecords[stu.id]?.attendance || 'present';
              return status === attendanceFilter;
            });

            return (
              <div className="bg-white dark:bg-dark-surface rounded-3xl border border-slate-200/80 dark:border-dark-border shadow-xs overflow-hidden">
                {/* Roster Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-dark-border space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-base text-slate-900 dark:text-white">
                          Student Attendance Roster
                        </h3>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {enrolledStudents.length} Students
                        </span>
                        {hasInClassExam && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            Quiz Active (/{examMaxMarks} marks)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Tap P (Present), A (Absent), L (Late), E (Excused) to mark roster and log observations.
                      </p>
                    </div>

                    {/* Quick Bulk Actions */}
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      <button
                        type="button"
                        onClick={handleMarkAllPresent}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark All Present</span>
                      </button>

                      {absentCount > 0 && (
                        <button
                          type="button"
                          onClick={handleBroadcastAbsentWhatsApp}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-colors shadow-2xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>WhatsApp Absentees ({absentCount})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search and School Filter Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={rosterSearchQuery}
                        onChange={(e) => setRosterSearchQuery(e.target.value)}
                        placeholder="Search student by name, roll # or school..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      {rosterSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setRosterSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 min-w-[180px]">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select
                          value={rosterSchoolFilter}
                          onChange={(e) => setRosterSchoolFilter(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="all">All Schools ({enrolledStudents.length})</option>
                          {batchSchools.map((sc) => {
                            const scCount = enrolledStudents.filter((s) => s.schoolId === sc.id).length;
                            return (
                              <option key={sc.id} value={sc.id}>
                                {sc.name} ({scCount})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => setRosterGroupBySchool(!rosterGroupBySchool)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all ${
                          rosterGroupBySchool
                            ? 'bg-light-indigo text-white border-light-indigo shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Group Schools</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Pills & Mobile Filter Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    {/* Filter Chips */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => setAttendanceFilter('all')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                          attendanceFilter === 'all'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        All ({enrolledStudents.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setAttendanceFilter('present')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                          attendanceFilter === 'present'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                        }`}
                      >
                        Present ({presentCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => setAttendanceFilter('absent')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                          attendanceFilter === 'absent'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : 'bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
                        }`}
                      >
                        Absent ({absentCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => setAttendanceFilter('late')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                          attendanceFilter === 'late'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                        }`}
                      >
                        Late ({lateCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => setAttendanceFilter('excused')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                          attendanceFilter === 'excused'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                            : 'bg-sky-50/60 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/40'
                        }`}
                      >
                        Excused ({excusedCount})
                      </button>
                    </div>

                    {/* Overall Turnout Rate */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 ml-auto">
                      <span>Turnout:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">
                        {attendanceRate}%
                      </span>
                    </div>
                  </div>
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
                        Students must be assigned to this batch in the Student Directory to take attendance.
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
                  /* Enrolled Students Cards List (Supports School Grouping & Flat View) */
                  (() => {
                    const renderStudentCard = (stu: Student) => {
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
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 shadow-2xs ${
                            currentStatus === 'present'
                              ? 'border-l-4 border-l-emerald-500 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-dark-surface'
                              : currentStatus === 'absent'
                              ? 'border-l-4 border-l-rose-500 border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/15'
                              : currentStatus === 'late'
                              ? 'border-l-4 border-l-amber-500 border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/15'
                              : 'border-l-4 border-l-sky-500 border-sky-200 dark:border-sky-900/50 bg-sky-50/30 dark:bg-sky-950/15'
                          }`}
                        >
                          {/* Card Top: Roll, Name, Streak, Status, & WhatsApp Alert */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-slate-900 text-white dark:bg-slate-800 dark:text-emerald-400 border border-slate-700/60 shadow-2xs shrink-0">
                                {stu.publicRollNo}
                              </span>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                                    {stu.name}
                                  </h4>
                                  {stu.streakCount > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                      <Flame className="w-3 h-3 fill-current" />
                                      {stu.streakCount}d
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{stu.schoolName}</span>
                                  {stu.section && <span className="opacity-75">• Sec {stu.section}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Right: Status Pill & WhatsApp Notice */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {(currentStatus === 'absent' || currentStatus === 'late') && (
                                <button
                                  type="button"
                                  onClick={() => handleSendAttendanceWhatsApp(stu, currentStatus)}
                                  title="Send Instant WhatsApp Notice to Guardian"
                                  className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-wintergreen hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                                >
                                  <PhoneCall className="w-4 h-4" />
                                </button>
                              )}

                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                    : currentStatus === 'absent'
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                    : currentStatus === 'late'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                                }`}
                              >
                                {currentStatus}
                              </span>
                            </div>
                          </div>

                          {/* Full-Width Touch-Friendly 4-Button Attendance Bar (Mobile Optimized) */}
                          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                            {/* Present Button */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(stu.id, 'present')}
                              className={`h-10 sm:h-11 rounded-xl flex items-center justify-center gap-1 font-bold transition-all ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/40 scale-[1.02]'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900'
                              }`}
                            >
                              <span className="font-black text-sm">P</span>
                              <span className="text-[10px] hidden sm:inline">Present</span>
                            </button>

                            {/* Absent Button */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(stu.id, 'absent')}
                              className={`h-10 sm:h-11 rounded-xl flex items-center justify-center gap-1 font-bold transition-all ${
                                currentStatus === 'absent'
                                  ? 'bg-rose-500 text-white font-black shadow-md shadow-rose-500/30 ring-2 ring-rose-400/40 scale-[1.02]'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900'
                              }`}
                            >
                              <span className="font-black text-sm">A</span>
                              <span className="text-[10px] hidden sm:inline">Absent</span>
                            </button>

                            {/* Late Button */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(stu.id, 'late')}
                              className={`h-10 sm:h-11 rounded-xl flex items-center justify-center gap-1 font-bold transition-all ${
                                currentStatus === 'late'
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 ring-2 ring-amber-400/40 scale-[1.02]'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900'
                              }`}
                            >
                              <span className="font-black text-sm">L</span>
                              <span className="text-[10px] hidden sm:inline">Late</span>
                            </button>

                            {/* Excused Button */}
                            <button
                              type="button"
                              onClick={() => handleSetStatus(stu.id, 'excused')}
                              className={`h-10 sm:h-11 rounded-xl flex items-center justify-center gap-1 font-bold transition-all ${
                                currentStatus === 'excused'
                                  ? 'bg-sky-500 text-white font-black shadow-md shadow-sky-500/30 ring-2 ring-sky-400/40 scale-[1.02]'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900'
                              }`}
                            >
                              <span className="font-black text-sm">E</span>
                              <span className="text-[10px] hidden sm:inline">Excused</span>
                            </button>
                          </div>

                          {/* Card Bottom: Quiz Score & Observation Input */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                            {/* Quiz Score Input if Exam active */}
                            {hasInClassExam && (
                              <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                                <span className="font-bold text-amber-800 dark:text-amber-300">Quiz Score:</span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={examMaxMarks}
                                    value={record.inClassQuizScore ?? 0}
                                    onChange={(e) => handleSetQuizScore(stu.id, Number(e.target.value))}
                                    disabled={currentStatus === 'absent'}
                                    className="w-12 px-1.5 py-0.5 rounded-lg text-xs font-black text-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                                  />
                                  <span className="text-slate-500 font-bold">/{examMaxMarks}</span>
                                </div>
                              </div>
                            )}

                            {/* Remarks / Observation Input with Icon */}
                            <div className="relative flex-1">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                              <input
                                type="text"
                                value={record.remarks || ''}
                                onChange={(e) => handleSetStudentRemark(stu.id, e.target.value)}
                                placeholder="Observation / note (e.g. good mastery, needs revision)"
                                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-light-indigo/20 transition-all"
                              />
                            </div>
                          </div>

                          {/* Pending Sheet Handover Alert Banner */}
                          {unreceivedSheets.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {unreceivedSheets.map((sh) => (
                                <label
                                  key={sh.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/30 shadow-2xs cursor-pointer hover:bg-teal-500/20 transition-all"
                                >
                                  <input
                                    type="checkbox"
                                    onChange={() => toggleSheetDistributed(sh.id, stu.id)}
                                    className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                                  />
                                  <FileSpreadsheet className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                                  <span>Needs Sheet #{sh.sheetNumber} (Tap to Deliver)</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    };

                    if (rosterGroupBySchool) {
                      // Group displayed students by school
                      const schoolGroups = new Map<string, Student[]>();
                      displayedStudents.forEach((stu) => {
                        const sc = stu.schoolName || 'School';
                        if (!schoolGroups.has(sc)) schoolGroups.set(sc, []);
                        schoolGroups.get(sc)!.push(stu);
                      });

                      return (
                        <div className="p-3 sm:p-5 space-y-4">
                          {Array.from(schoolGroups.entries())
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([schoolName, schoolStudents]) => {
                              const schoolPresent = schoolStudents.filter(
                                (s) => (attendanceRecords[s.id]?.attendance || 'present') === 'present'
                              ).length;

                              return (
                                <div
                                  key={schoolName}
                                  className="rounded-2xl border border-slate-200/80 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/30 p-3 space-y-3"
                                >
                                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="w-4 h-4 text-slate-500" />
                                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                        {schoolName}
                                      </span>
                                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                        {schoolPresent} / {schoolStudents.length} Present
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = { ...attendanceRecords };
                                        schoolStudents.forEach((stu) => {
                                          updated[stu.id] = {
                                            ...updated[stu.id],
                                            studentId: stu.id,
                                            attendance: 'present',
                                          };
                                        });
                                        setAttendanceRecords(updated);
                                      }}
                                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                                    >
                                      + Mark All {schoolName} Present
                                    </button>
                                  </div>

                                  <div className="space-y-3">
                                    {schoolStudents.map(renderStudentCard)}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      );
                    }

                    return (
                      <div className="p-3 sm:p-5 space-y-3">
                        {displayedStudents.map(renderStudentCard)}
                      </div>
                    );
                  })()
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
