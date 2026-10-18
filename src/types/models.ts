// NPB Data Models & Strict Interfaces

export type WeeklyDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday ... 6 = Saturday

export interface WeeklySlot {
  dayOfWeek: WeeklyDay;
  startTime: string; // e.g. "16:00"
  endTime: string; // e.g. "17:30"
}

export interface BatchPerformanceWeights {
  examWeight: number; // e.g. 50 (%)
  homeworkWeight: number; // e.g. 30 (%)
  attendanceWeight: number; // e.g. 20 (%)
}

export interface BatchAttendanceRules {
  lateWeight: number; // e.g. 0.5 or 1.0 towards attendance %
  excusedAction: 'exclude_from_total' | 'count_as_present' | 'count_as_absent';
}

export interface Batch {
  id: string;
  name: string; // e.g. "Batch 1 - HSC 2027"
  courseTag: string; // e.g. "HSC Academic", "SSC Grammar", "Spoken Course"
  classLevel: string; // e.g. "Class 9", "Class 10", "HSC 1st Year"
  weeklyRoutine: WeeklySlot[];
  performanceWeights: BatchPerformanceWeights;
  attendanceRules: BatchAttendanceRules;
  isActive: boolean;
  createdAt: number;
}

export interface School {
  id: string;
  name: string;
  shortCode: string; // e.g. "DRMC", "VNSC", "ACC", "Notre Dame"
  address?: string;
  createdAt: number;
}

export interface Student {
  id: string; // System ID (e.g., "STU-2026-0042")
  publicRollNo: string; // MANUAL input by Admin for Public Leaderboard (e.g., "101" or "B1-05")
  name: string;
  schoolId: string;
  schoolName: string;
  classLevel: string;
  section?: string;
  shift?: 'Morning' | 'Day' | 'N/A';
  batchIds: string[]; // Supports multi-batch enrollment
  studentPhone?: string;
  guardianName?: string;
  guardianPhone: string; // Used for 1-click WhatsApp report & alert dispatch
  shareToken: string; // Unique unguessable token for /report/:shareToken
  joinedAt: number;
  isActive: boolean;
  notes?: string;
  streakCount: number; // Automated consecutive Present + HW Done streak
  manualBonusPoints: number; // Cumulative bonus/penalty points
}

export type SyllabusTopicStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'revision_needed'
  | 'missed_pending_makeup';

export interface StudentSyllabusTopic {
  id: string;
  category: string; // e.g. "Midterm - Grammar", "1st Paper Seen", "Writing Part"
  title: string; // e.g. "Modifiers", "Narration", "Right Form of Verbs"
  status: SyllabusTopicStatus;
  lastTaughtDate?: string;
  completedDate?: string;
  missedSessionIds: string[]; // Tracks if student was absent when topic was covered
  examMasteryAvg?: number; // Auto-calculated from section-wise exam tags (0-100%)
  priority?: TopicPriority;
  targetDate?: string;
  notes?: string;
}

export interface StudentSyllabus {
  studentId: string;
  updatedAt: number;
  topics: StudentSyllabusTopic[];
}

export type SyllabusTermType =
  | 'half_yearly'
  | 'first_term'
  | 'second_term'
  | 'pre_test'
  | 'test_exam'
  | 'final_board'
  | 'custom';

export type SyllabusScopeType =
  | 'batch_wide'
  | 'batch_and_schools'
  | 'batch_and_students'
  | 'global_template';

export type TopicPriority = 'high' | 'medium' | 'low';

export interface SyllabusSchemeTopic {
  id: string;
  unitTitle: string; // e.g. "Unit 1: Grammar Core", "Unit 2: Guided Writing"
  title: string; // e.g. "Modifiers", "Narration", "Formal Letter"
  priority: TopicPriority;
  weightageMarks?: number; // e.g. 5, 10
  status: 'not_started' | 'in_progress' | 'completed' | 'revision_needed';
  targetDate?: string; // Expected completion date
  lastTaughtDate?: string;
  notes?: string;
}

export interface SyllabusScheme {
  id: string;
  title: string; // e.g. "HSC 2026 Half Yearly English 2nd Paper Syllabus"
  termType: SyllabusTermType;
  scopeType: SyllabusScopeType;
  targetBatchId: string;
  targetSchoolIds?: string[]; // If targeted to specific school(s)
  targetStudentIds?: string[]; // If customized for specific student(s)
  academicYear?: string; // e.g. "2025–2026"
  description?: string;
  topics: SyllabusSchemeTopic[];
  createdAt: number;
  updatedAt: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface StudentSessionRecord {
  studentId: string;
  attendance: AttendanceStatus;
  topicsCoveredForStudent: string[]; // Topic titles/IDs covered in this class
  remarks?: string;
  inClassQuizScore?: number; // Score obtained if in-class exam/quiz was conducted
  quizMaxMarks?: number;
  lateMinutes?: number; // If late, arrival delay in minutes
  distributedSheetIds?: string[]; // IDs of lecture sheets handed out to this student
}

export interface InClassExamDetail {
  hasExam: boolean;
  examId?: string; // Auto-synced ID into exam database
  title: string;
  maxMarks: number;
  linkedTopicTitles: string[];
  classAverage?: number;
  highestScore?: number;
}

export interface AssignedHomeworkDetail {
  hasHomework: boolean;
  homeworkId?: string; // Auto-synced ID into homework database
  title: string;
  dueDate: string;
  description?: string;
  relatedTopics: string[];
  outOfSyllabusTopics?: string[];
  schemeId?: string;
  gradingMode?: 'status_only' | 'status_and_marks';
  maxMarks?: number;
  targetType?: 'whole_batch' | 'specific_schools' | 'specific_students';
  targetSchoolIds?: string[];
}

export interface ClassSession {
  id: string;
  batchId: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // e.g. "18:30"
  endTime?: string; // e.g. "19:30"
  routineSlotId?: string; // If selected from weekly schedule
  sessionType: 'regular' | 'extra' | 'makeup';
  customTitle?: string; // e.g. "Board Solves Marathon" or "Scheduled Routine Class"
  generalLessonSummary: string; // Batch-level log of what was taught today
  topicsTaught: string[]; // Topics taught in this session
  topicProgressStatus?: 'in_progress' | 'completed';
  records: Record<string, StudentSessionRecord>; // Keyed by studentId
  inClassExam?: InClassExamDetail;
  assignedHomework?: AssignedHomeworkDetail;
  distributedSheetIds?: string[]; // Lecture sheet IDs handed over during this session
  nextClassLessonPlan?: string; // Reminder plan for upcoming class
  createdAt: number;
}

export type HomeworkStatus = 'done' | 'incomplete' | 'not_done' | 'late' | 'pending';

export interface HomeworkSubmission {
  studentId: string;
  status: HomeworkStatus;
  obtainedMarks?: number; // Optional numeric score
  remarks?: string;
  checkedAt?: number;
}

export interface Homework {
  id: string;
  batchId: string;
  title: string;
  description?: string;
  relatedTopics: string[];
  outOfSyllabusTopics?: string[];
  schemeId?: string;
  sessionId?: string; // Bidirectional link to ClassSession
  assignedDate: string;
  dueDate: string;
  targetType: 'whole_batch' | 'specific_schools' | 'specific_students';
  targetSchoolIds?: string[];
  targetStudentIds?: string[];
  gradingMode: 'status_only' | 'status_and_marks';
  maxMarks?: number;
  submissions: Record<string, HomeworkSubmission>;
  createdAt: number;
}

export interface ExamSection {
  id: string;
  name: string; // e.g. "Part A: Grammar - Modifiers", "Part B: Writing"
  category: 'Grammar' | 'Reading' | 'Writing' | 'Vocabulary' | 'MCQ' | 'General';
  linkedTopicTitles: string[]; // Links directly to Syllabus Topics for Weak Topic Radar!
  maxMarks: number;
}

export interface StudentExamResult {
  studentId: string;
  isAbsent: boolean;
  isExcusedAbsent?: boolean;
  sectionMarks: Record<string, number>; // sectionId -> obtainedMarks
  totalObtained: number;
  customMaxMarks?: number; // Used if student had a student-specific paper
  percentage: number;
  remarks?: string;
}

export type ExamCategoryType = 'weekly_quiz' | 'monthly_test' | 'term_exam' | 'pop_quiz';

export interface Exam {
  id: string;
  batchId: string;
  title: string;
  examDate: string;
  startTime?: string;
  examType?: ExamCategoryType;
  termExamType?: SyllabusTermType;
  syllabusSchemeId?: string;
  scopeType: 'batch_wide' | 'school_specific' | 'student_specific';
  targetSchoolIds?: string[];
  targetStudentIds?: string[];
  sections: ExamSection[]; // Allows section-wise or single-section entry
  totalMaxMarks: number;
  passMarks: number;
  absentPolicy: 'exclude_from_avg' | 'count_as_zero' | 'exclude_avg_but_zero_leaderboard';
  status: 'scheduled' | 'completed';
  results: Record<string, StudentExamResult>;
  createdAt: number;
}

export type LectureSheetType =
  | 'lecture_note'
  | 'practice_sheet'
  | 'solution_sheet'
  | 'exam_paper'
  | 'formula_sheet';

export interface LectureSheetStudentStatus {
  status: 'received' | 'pending' | 'absent_needs_handout' | 'extra_copy';
  receivedAt?: number;
  remarks?: string;
}

export interface LectureSheet {
  id: string;
  batchId: string;
  sheetNumber: string; // e.g. "Sheet #04"
  title: string; // e.g. "Modifiers Master Sheet"
  relatedTopic?: string;
  relatedTopics?: string[];
  outOfSyllabusTopics?: string[];
  schemeId?: string;
  sheetType?: LectureSheetType;
  distributedDate: string;
  receivedByStudentIds: string[]; // Students who received the sheet
  targetStudentIds: string[]; // All students who should receive it
  targetType?: 'whole_batch' | 'specific_schools' | 'specific_students';
  targetSchoolIds?: string[];
  totalCopiesPrinted?: number; // Physical stock count
  studentStatuses?: Record<string, LectureSheetStudentStatus>;
  createdAt: number;
}

export interface BonusLog {
  id: string;
  studentId: string;
  batchId: string;
  date: string;
  points: number; // Can be positive (+5) or negative (-3)
  reason: string; // e.g. "Best class participation", "Consistent HW streak"
  createdAt: number;
}

export interface LeaderboardVisibleColumns {
  publicRollNo: boolean; // Default: true
  studentName: boolean;
  schoolName: boolean;
  attendanceRate: boolean;
  homeworkRate: boolean;
  examAverage: boolean;
  bonusStreakPoints: boolean;
  totalPerformanceScore: boolean;
  badges: boolean;
}

export interface LeaderboardConfig {
  publishedBatchIds: string[];
  rowLimit: 'top10' | 'all';
  visibleColumns: LeaderboardVisibleColumns;
}

export interface GlobalSettings {
  platformName: string; // Default: "NPB"
  tutorName: string; // Default: "Abdullah All Masum"
  whatsappNumber: string; // Default: "01619663933"
  themeMode: 'light' | 'dark';
  leaderboardConfig: LeaderboardConfig;
}

export interface StudentAnalytics {
  studentId: string;
  studentName: string;
  publicRollNo: string;
  schoolName: string;
  batchId: string;
  batchName: string;
  attendanceRate: number; // 0-100%
  attendanceStats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  homeworkRate: number; // 0-100%
  homeworkStats: {
    total: number;
    done: number;
    partial: number;
    notDone: number;
    late: number;
  };
  examAverage: number; // 0-100%
  examCount: number;
  baseScore: number; // Weighted Base Score 0-100
  streakBonus: number;
  bonusPoints: number;
  totalPerformanceScore: number;
  rankInBatch: number;
  badges: string[];
  weakTopics: {
    topicTitle: string;
    category?: string;
    score: number;
    status: SyllabusTopicStatus;
  }[];
  uncollectedSheets: LectureSheet[];
}

export type ClassSlotStatus =
  | 'scheduled'
  | 'completed'
  | 'canceled'
  | 'postponed'
  | 'rescheduled'
  | 'makeup';

export interface MonthlyClassSlot {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: WeeklyDay;
  startTime: string;
  endTime: string;
  slotType: 'routine' | 'extra' | 'makeup';
  status: ClassSlotStatus;
  sessionId?: string;
  customTopicTitle?: string;
  cancellationReason?: string;
  rescheduledToDate?: string;
  rescheduledToTime?: string;
  notes?: string;
  createdAt: number;
}

export interface BatchMonthlyGoal {
  id: string; // "goal-${batchId}-${yearMonth}"
  batchId: string;
  yearMonth: string; // "YYYY-MM"
  monthName: string; // "October 2026"
  targetClassCount: number;
  startFromDate: string; // YYYY-MM-DD
  weeklyRoutineSnapshot: WeeklySlot[];
  slots: MonthlyClassSlot[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// --- Online Interactive Exam System (MCQ & Fill In The Blanks) ---

export interface McqOption {
  id: string; // 'opt-a', 'opt-b', 'opt-c', 'opt-d'
  label: string; // 'A', 'B', 'C', 'D'
  text: string;
}

export interface McqQuestion {
  id: string;
  question: string;
  options: McqOption[];
  correctOptionIds: string[]; // Supports single or multiple correct answers
  allowMultiple: boolean; // false for single radio, true for multi-select checkboxes
  marks: number;
  explanation?: string; // Optional explanation shown in solution review
}

export interface PassageGap {
  id: string; // 'a', 'b', 'c', ...
  gapLabel: string; // '(a)', '(b)', '(c)'
  acceptedAnswers: string[]; // e.g. ['natural', 'naturals'] (evaluated case-insensitively)
  marks: number; // e.g. 0.5 or 1 mark
  clueHint?: string; // Root word in clue box if form change is required (e.g. "nature")
}

export interface PassageSection {
  id: string;
  title: string; // e.g. "Question 1: Fill in the blanks with suitable words from the box"
  instructions: string; // e.g. "You may need to change the forms of some words. You may use one word more than once."
  passageType: 'with_clues' | 'without_clues';
  clues: string[]; // Clue words placed in the box (e.g. ['nature', 'pollute', 'aware'])
  hasFormChange: boolean; // if true, word forms need change (nature -> natural)
  directPlacementFeedback: boolean; // if true and clues placed directly without form change, show instant right/wrong; if form change, right/wrong shown after submit!
  passageText: string; // Passage text containing gaps (a), (b), (c)...
  gaps: PassageGap[]; // Dynamic count of gaps (e.g. 5, 8, 10, 12 gaps)
}

export type OnlineExamLinkMode = 'permanent' | 'temporary';

export interface OnlineExam {
  id: string;
  examCode: string; // Short unique code e.g. "ENG-SSC-01"
  title: string;
  subject: string;
  batchIds: string[]; // Target batch IDs
  description?: string;

  // Link & Availability
  linkMode: OnlineExamLinkMode; // 'permanent' | 'temporary'
  isActive: boolean; // Manual on/off toggle
  startDate?: string; // e.g. "2026-10-18T18:00"
  endDate?: string; // e.g. "2026-10-20T23:59"

  // Timing & Security
  durationMinutes: number; // 0 for untimed, or e.g. 15, 20, 30 minutes
  tabSwitchPenalty: 'warn_and_record' | 'auto_submit' | 'reset_exam';
  attemptLimit: number; // 1 for single attempt only, 0 for unlimited practice

  // Review & Feedback
  showScoreImmediately: boolean; // Show score & grade upon submission
  showSolutionsImmediately: boolean; // Show correct answers immediately or keep hidden until tutor releases

  // Questions Content
  passages: PassageSection[]; // Fill in the blanks passages (can be multiple)
  mcqs: McqQuestion[]; // Multiple choice questions

  totalMarks: number;
  passMarks: number;

  createdAt: number;
  updatedAt: number;
}

export interface PassageGapAnswer {
  gapId: string;
  studentAnswer: string;
  isCorrect: boolean;
  marksObtained: number;
  maxMarks: number;
  tutorOverriddenMarks?: number; // Manual regrade override
}

export interface PassageSubmission {
  passageId: string;
  answers: Record<string, PassageGapAnswer>; // gapId -> answer
  passageScore: number;
  passageMaxMarks: number;
}

export interface McqSubmission {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
  marksObtained: number;
  maxMarks: number;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examCode: string;
  batchId?: string;
  studentId?: string; // Optional matched student ID from student directory
  studentName: string;
  studentMobile: string;
  studentClass?: string;
  studentRoll?: string;

  // Answers
  passageSubmissions: Record<string, PassageSubmission>; // passageId -> submission
  mcqSubmissions: Record<string, McqSubmission>; // questionId -> submission

  // Scores
  totalMarksObtained: number;
  totalPossibleMarks: number;
  percentage: number;
  isPassed: boolean;

  // Proctoring & Meta
  tabSwitchCount: number;
  timeSpentSeconds: number;
  startedAt: number;
  submittedAt: number;

  // Integration
  syncedToBatchExamId?: string;
}

