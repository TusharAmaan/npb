import React from 'react';
import { Link } from 'react-router-dom';
import { LectureSheet, Student, StudentSyllabus, Exam } from '../../types/models';
import {
  FileSpreadsheet,
  AlertTriangle,
  CalendarClock,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

interface ActionAlertsPanelProps {
  sheets: LectureSheet[];
  students: Student[];
  syllabi: Record<string, StudentSyllabus>;
  exams: Exam[];
}

export const ActionAlertsPanel: React.FC<ActionAlertsPanelProps> = ({
  sheets,
  students,
  syllabi,
  exams,
}) => {
  // 1. Pending Lecture Sheets Calculation
  const pendingSheetCount = sheets.reduce((acc, sheet) => {
    const uncollected = (sheet.targetStudentIds || []).filter(
      (stuId) => !sheet.receivedByStudentIds?.includes(stuId)
    );
    return acc + uncollected.length;
  }, 0);

  // 2. Makeup Needed Calculation (Topics with status 'missed_pending_makeup')
  const makeupStudentsMap: Record<string, { student: Student; topics: string[] }> = {};
  Object.entries(syllabi).forEach(([stuId, syl]) => {
    const stu = students.find((s) => s.id === stuId);
    if (!stu || !syl?.topics) return;
    const missed = syl.topics.filter((t) => t.status === 'missed_pending_makeup');
    if (missed.length > 0) {
      makeupStudentsMap[stuId] = {
        student: stu,
        topics: missed.map((t) => t.title),
      };
    }
  });
  const totalMakeupCases = Object.values(makeupStudentsMap).reduce(
    (acc, item) => acc + item.topics.length,
    0
  );

  // 3. Weak Topics (< 60% Exam Mastery)
  const weakTopicCases: { studentName: string; roll: string; topicTitle: string; score: number }[] = [];
  Object.entries(syllabi).forEach(([stuId, syl]) => {
    const stu = students.find((s) => s.id === stuId);
    if (!stu || !syl?.topics) return;
    syl.topics.forEach((t) => {
      if (t.examMasteryAvg !== undefined && t.examMasteryAvg < 60) {
        weakTopicCases.push({
          studentName: stu.name,
          roll: stu.publicRollNo,
          topicTitle: t.title,
          score: t.examMasteryAvg,
        });
      }
    });
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-mandarin-sorbet" />
          <span>Academic Action Alerts</span>
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">Real-time alerts</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Alert 1: Pending Lecture Sheets */}
        <Link
          to="/admin/tools/sheets"
          className="group p-4 rounded-xl border border-hammam-blue/30 bg-hammam-blue/5 dark:bg-hammam-blue/10 hover:border-hammam-blue/60 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-hammam-blue/20 text-teal-800 dark:text-hammam-blue">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <span className="text-xl font-extrabold text-teal-900 dark:text-hammam-blue">
                {pendingSheetCount}
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-2.5">
              Pending Sheet Distribution
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Students who missed collecting lecture notes & sheets.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-hammam-blue/20 flex items-center justify-between text-xs font-bold text-teal-700 dark:text-hammam-blue">
            <span>Review Sheets</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Alert 2: Makeup Classes Needed */}
        <Link
          to="/admin/tools/makeup"
          className="group p-4 rounded-xl border border-mandarin-sorbet/30 bg-mandarin-sorbet/5 dark:bg-mandarin-sorbet/10 hover:border-mandarin-sorbet/60 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-mandarin-sorbet/20 text-amber-800 dark:text-mandarin-sorbet">
                <CalendarClock className="w-5 h-5" />
              </span>
              <span className="text-xl font-extrabold text-amber-900 dark:text-mandarin-sorbet">
                {totalMakeupCases}
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-2.5">
              Missed Lessons (Makeup)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Missed topics needing makeup sessions due to absence.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-mandarin-sorbet/20 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-mandarin-sorbet">
            <span>Open Makeup Planner</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Alert 3: Weak Topics < 60% */}
        <Link
          to="/admin/tools/weak-topics"
          className="group p-4 rounded-xl border border-light-red/30 bg-light-red/5 dark:bg-light-red/10 hover:border-light-red/60 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-light-red/20 text-red-700 dark:text-light-red">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <span className="text-xl font-extrabold text-red-800 dark:text-light-red">
                {weakTopicCases.length}
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-2.5">
              Weak Topic Flags (&lt; 60%)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Topics where student exam section average is below 60%.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-light-red/20 flex items-center justify-between text-xs font-bold text-red-700 dark:text-light-red">
            <span>Diagnostic Radar</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
};
