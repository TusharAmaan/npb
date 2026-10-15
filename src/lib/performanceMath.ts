import {
  Batch,
  ClassSession,
  Exam,
  Homework,
  LectureSheet,
  Student,
  StudentAnalytics,
  StudentSyllabus,
  SyllabusTopicStatus,
} from '../types/models';

/**
 * Calculates a student's attendance rate (0 to 100%) based on batch attendance rules.
 */
export function calculateAttendanceRate(
  studentId: string,
  sessions: ClassSession[],
  batch: Batch
): {
  rate: number;
  stats: { total: number; present: number; absent: number; late: number; excused: number };
} {
  const studentSessions = sessions.filter((s) => s.batchId === batch.id && s.records && s.records[studentId]);

  let totalCount = 0;
  let earnedScore = 0;
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  const lateWeight = batch.attendanceRules?.lateWeight ?? 0.5;
  const excusedAction = batch.attendanceRules?.excusedAction ?? 'exclude_from_total';

  studentSessions.forEach((s) => {
    const status = s.records[studentId].attendance;
    if (status === 'present') {
      present++;
      totalCount++;
      earnedScore += 1;
    } else if (status === 'late') {
      late++;
      totalCount++;
      earnedScore += lateWeight;
    } else if (status === 'absent') {
      absent++;
      totalCount++;
    } else if (status === 'excused') {
      excused++;
      if (excusedAction === 'count_as_present') {
        totalCount++;
        earnedScore += 1;
      } else if (excusedAction === 'count_as_absent') {
        totalCount++;
      }
      // if 'exclude_from_total', totalCount is untouched
    }
  });

  const rate = totalCount > 0 ? Math.round((earnedScore / totalCount) * 100) : 100;
  return {
    rate,
    stats: { total: studentSessions.length, present, absent, late, excused },
  };
}

/**
 * Calculates a student's homework completion rate (0 to 100%).
 */
export function calculateHomeworkRate(
  studentId: string,
  homeworks: Homework[],
  student: Student
): {
  rate: number;
  stats: { total: number; done: number; partial: number; notDone: number; late: number };
} {
  // Filter homeworks that target this student
  const relevantHw = homeworks.filter((hw) => {
    if (hw.targetType === 'whole_batch') {
      return student.batchIds.includes(hw.batchId);
    }
    if (hw.targetType === 'specific_schools') {
      return hw.targetSchoolIds?.includes(student.schoolId) && student.batchIds.includes(hw.batchId);
    }
    if (hw.targetType === 'specific_students') {
      return hw.targetStudentIds?.includes(studentId);
    }
    return false;
  });

  if (relevantHw.length === 0) {
    return {
      rate: 100,
      stats: { total: 0, done: 0, partial: 0, notDone: 0, late: 0 },
    };
  }

  let totalScoreEarned = 0;
  let totalPossible = relevantHw.length * 100;
  let done = 0;
  let partial = 0;
  let notDone = 0;
  let late = 0;

  relevantHw.forEach((hw) => {
    const sub = hw.submissions ? hw.submissions[studentId] : null;
    if (!sub) {
      notDone++;
      return;
    }

    if (hw.gradingMode === 'status_and_marks' && typeof sub.obtainedMarks === 'number' && (hw.maxMarks ?? 0) > 0) {
      const percentage = Math.min(100, (sub.obtainedMarks / (hw.maxMarks || 100)) * 100);
      totalScoreEarned += percentage;
      if (percentage >= 80) done++;
      else if (percentage >= 40) partial++;
      else notDone++;
    } else {
      switch (sub.status) {
        case 'done':
          done++;
          totalScoreEarned += 100;
          break;
        case 'late':
          late++;
          totalScoreEarned += 75;
          break;
        case 'incomplete':
          partial++;
          totalScoreEarned += 50;
          break;
        case 'not_done':
        default:
          notDone++;
          totalScoreEarned += 0;
          break;
      }
    }
  });

  const rate = totalPossible > 0 ? Math.round((totalScoreEarned / totalPossible) * 100) : 100;
  return {
    rate,
    stats: { total: relevantHw.length, done, partial, notDone, late },
  };
}

/**
 * Calculates a student's exam average (0 to 100%) and section topic breakdown.
 */
export function calculateExamAverage(
  studentId: string,
  exams: Exam[],
  student: Student,
  batchId?: string,
  forLeaderboard = false
): {
  average: number;
  count: number;
  topicMastery: Record<string, { totalMarks: number; obtainedMarks: number; percentage: number }>;
} {
  const relevantExams = exams.filter((ex) => {
    if (ex.status !== 'completed') return false;
    if (batchId && ex.batchId !== batchId) return false;
    if (ex.scopeType === 'batch_wide') {
      return student.batchIds.includes(ex.batchId);
    }
    if (ex.scopeType === 'school_specific') {
      return ex.targetSchoolIds?.includes(student.schoolId) && student.batchIds.includes(ex.batchId);
    }
    if (ex.scopeType === 'student_specific') {
      return ex.targetStudentIds?.includes(studentId);
    }
    return false;
  });

  const topicMastery: Record<string, { totalMarks: number; obtainedMarks: number; percentage: number }> = {};

  let validExamsCount = 0;
  let totalPercentageSum = 0;

  relevantExams.forEach((ex) => {
    const res = ex.results ? ex.results[studentId] : null;
    if (!res) return;

    if (res.isAbsent) {
      if (ex.absentPolicy === 'exclude_from_avg' && !forLeaderboard) {
        return; // Exclude from average
      }
      if (ex.absentPolicy === 'exclude_avg_but_zero_leaderboard') {
        if (!forLeaderboard) return;
        validExamsCount++;
        totalPercentageSum += 0;
        return;
      }
      // count_as_zero
      validExamsCount++;
      totalPercentageSum += 0;
      return;
    }

    validExamsCount++;
    totalPercentageSum += res.percentage;

    // Aggregate topic performance from sections
    if (ex.sections && res.sectionMarks) {
      ex.sections.forEach((sec) => {
        const secMarks = res.sectionMarks[sec.id] ?? 0;
        const maxSecMarks = sec.maxMarks || 1;
        sec.linkedTopicTitles?.forEach((topicTitle) => {
          if (!topicMastery[topicTitle]) {
            topicMastery[topicTitle] = { totalMarks: 0, obtainedMarks: 0, percentage: 0 };
          }
          topicMastery[topicTitle].totalMarks += maxSecMarks;
          topicMastery[topicTitle].obtainedMarks += secMarks;
        });
      });
    }
  });

  // Calculate final percentages for each topic
  Object.keys(topicMastery).forEach((title) => {
    const item = topicMastery[title];
    item.percentage = item.totalMarks > 0 ? Math.round((item.obtainedMarks / item.totalMarks) * 100) : 0;
  });

  const average = validExamsCount > 0 ? Math.round(totalPercentageSum / validExamsCount) : 100;
  return {
    average,
    count: validExamsCount,
    topicMastery,
  };
}

/**
 * Calculates Full Student Performance Analytics, Rank, and Badges.
 */
export function calculateStudentAnalytics(
  student: Student,
  batch: Batch,
  sessions: ClassSession[],
  homeworks: Homework[],
  exams: Exam[],
  sheets: LectureSheet[],
  syllabus?: StudentSyllabus
): StudentAnalytics {
  const attData = calculateAttendanceRate(student.id, sessions, batch);
  const hwData = calculateHomeworkRate(student.id, homeworks, student);
  const examData = calculateExamAverage(student.id, exams, student, batch.id, false);

  const wExam = (batch.performanceWeights?.examWeight ?? 50) / 100;
  const wHw = (batch.performanceWeights?.homeworkWeight ?? 30) / 100;
  const wAtt = (batch.performanceWeights?.attendanceWeight ?? 20) / 100;

  // Base Score (0 - 100)
  const baseScore = Math.round(examData.average * wExam + hwData.rate * wHw + attData.rate * wAtt);

  // Streak bonus: e.g. 0.5 points per consecutive streak day, capped at 10 bonus points
  const streakBonus = Math.min(10, Math.round((student.streakCount || 0) * 0.5));
  const bonusPoints = student.manualBonusPoints || 0;

  const totalPerformanceScore = Math.max(0, baseScore + streakBonus + bonusPoints);

  // Detect uncollected sheets
  const uncollectedSheets = sheets.filter(
    (sh) =>
      sh.batchId === batch.id &&
      (sh.targetStudentIds?.length === 0 || sh.targetStudentIds?.includes(student.id)) &&
      !sh.receivedByStudentIds?.includes(student.id)
  );

  // Identify weak topics: exam section topic average < 60% OR syllabus status marked revision_needed/missed
  const weakTopics: {
    topicTitle: string;
    category?: string;
    score: number;
    status: SyllabusTopicStatus;
  }[] = [];

  const syllabusTopics = syllabus?.topics || [];

  syllabusTopics.forEach((t) => {
    const examScore = examData.topicMastery[t.title]?.percentage;
    const isWeakByExam = examScore !== undefined && examScore < 60;
    const isPendingOrRevision = t.status === 'revision_needed' || t.status === 'missed_pending_makeup';

    if (isWeakByExam || isPendingOrRevision) {
      weakTopics.push({
        topicTitle: t.title,
        category: t.category,
        score: examScore !== undefined ? examScore : t.status === 'missed_pending_makeup' ? 0 : 50,
        status: isWeakByExam && t.status !== 'missed_pending_makeup' ? 'revision_needed' : t.status,
      });
    }
  });

  // Calculate Badges
  const badges: string[] = [];
  if (attData.rate >= 95) badges.push('Attendance Master 🎯');
  if (hwData.rate >= 95) badges.push('Homework Prodigy 📚');
  if (examData.average >= 85) badges.push('Academic Elite 🌟');
  if ((student.streakCount || 0) >= 5) badges.push(`Streak Master 🔥 ${student.streakCount}d`);
  if (bonusPoints > 0) badges.push(`Bonus Star ⚡ +${bonusPoints}`);

  return {
    studentId: student.id,
    studentName: student.name,
    publicRollNo: student.publicRollNo || '—',
    schoolName: student.schoolName || 'Unknown School',
    batchId: batch.id,
    batchName: batch.name,
    attendanceRate: attData.rate,
    attendanceStats: attData.stats,
    homeworkRate: hwData.rate,
    homeworkStats: hwData.stats,
    examAverage: examData.average,
    examCount: examData.count,
    baseScore,
    streakBonus,
    bonusPoints,
    totalPerformanceScore,
    rankInBatch: 1, // dynamically computed when sorted in batch list
    badges,
    weakTopics,
    uncollectedSheets,
  };
}

/**
 * Computes ranked leaderboard analytics for all active students in a batch.
 */
export function calculateBatchLeaderboard(
  batch: Batch,
  students: Student[],
  sessions: ClassSession[],
  homeworks: Homework[],
  exams: Exam[],
  sheets: LectureSheet[],
  syllabi: Record<string, StudentSyllabus>
): StudentAnalytics[] {
  const batchStudents = students.filter((s) => s.isActive && s.batchIds?.includes(batch.id));

  const list: StudentAnalytics[] = batchStudents.map((s) => {
    return calculateStudentAnalytics(s, batch, sessions, homeworks, exams, sheets, syllabi[s.id]);
  });

  // Sort descending by totalPerformanceScore, tiebreaker by examAverage then attendanceRate
  list.sort((a, b) => {
    if (b.totalPerformanceScore !== a.totalPerformanceScore) {
      return b.totalPerformanceScore - a.totalPerformanceScore;
    }
    if (b.examAverage !== a.examAverage) {
      return b.examAverage - a.examAverage;
    }
    return b.attendanceRate - a.attendanceRate;
  });

  // Assign ranks
  list.forEach((item, index) => {
    item.rankInBatch = index + 1;
  });

  return list;
}
