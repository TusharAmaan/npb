import React, { useState } from 'react';
import { Exam, Student, StudentExamResult } from '../../types/models';
import { useData } from '../../context/DataContext';
import { createWhatsAppLink, WhatsAppTemplates, getReportShareUrl } from '../../lib/whatsappTemplates';
import {
  Save,
  Check,
  PhoneCall,
  X,
  GraduationCap,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface ExamMarksEntryProps {
  exam: Exam;
  students: Student[];
  onBack: () => void;
}

export const ExamMarksEntry: React.FC<ExamMarksEntryProps> = ({ exam, students, onBack }) => {
  const { saveExam } = useData();

  // Local state for exam results
  const [results, setResults] = useState<Record<string, StudentExamResult>>(
    exam.results || {}
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Eligible students
  const eligibleStudents = students.filter((s) => {
    if (!s.isActive || !s.batchIds?.includes(exam.batchId)) return false;
    if (exam.scopeType === 'school_specific') {
      return exam.targetSchoolIds?.includes(s.schoolId);
    }
    if (exam.scopeType === 'student_specific') {
      return exam.targetStudentIds?.includes(s.id);
    }
    return true;
  });

  // Handle section marks change
  const handleSectionMarksChange = (studentId: string, sectionId: string, marks: number) => {
    const existing = results[studentId] || {
      studentId,
      isAbsent: false,
      sectionMarks: {},
      totalObtained: 0,
      percentage: 0,
    };

    const updatedSectionMarks = {
      ...existing.sectionMarks,
      [sectionId]: marks,
    };

    // Calculate total obtained
    const totalObtained = Object.values(updatedSectionMarks).reduce((a, b) => a + (Number(b) || 0), 0);
    const maxMarks = exam.totalMaxMarks || 1;
    const percentage = Math.round((totalObtained / maxMarks) * 100);

    setResults((prev) => ({
      ...prev,
      [studentId]: {
        ...existing,
        sectionMarks: updatedSectionMarks,
        totalObtained,
        percentage,
        isAbsent: false,
      },
    }));
  };

  // Handle Absent toggle
  const handleToggleAbsent = (studentId: string, isAbsent: boolean) => {
    const existing = results[studentId] || {
      studentId,
      isAbsent: false,
      sectionMarks: {},
      totalObtained: 0,
      percentage: 0,
    };

    setResults((prev) => ({
      ...prev,
      [studentId]: {
        ...existing,
        isAbsent,
        totalObtained: isAbsent ? 0 : existing.totalObtained,
        percentage: isAbsent ? 0 : existing.percentage,
      },
    }));
  };

  // Handle Remarks
  const handleRemarksChange = (studentId: string, remarks: string) => {
    const existing = results[studentId] || {
      studentId,
      isAbsent: false,
      sectionMarks: {},
      totalObtained: 0,
      percentage: 0,
    };

    setResults((prev) => ({
      ...prev,
      [studentId]: {
        ...existing,
        remarks,
      },
    }));
  };

  // Save Exam
  const handleSaveMarks = async () => {
    const updatedExam: Exam = {
      ...exam,
      status: 'completed',
      results,
    };

    await saveExam(updatedExam);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Send Result to Guardian WhatsApp
  const handleSendResultWhatsApp = (stu: Student) => {
    const res = results[stu.id];
    if (!res) return;

    const shareUrl = getReportShareUrl(stu.shareToken);
    const msg = WhatsAppTemplates.examResultNotification(
      stu.name,
      exam.title,
      res.totalObtained,
      exam.totalMaxMarks,
      res.percentage,
      shareUrl
    );
    const link = createWhatsAppLink(stu.guardianPhone, msg);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Exams List</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-light-slate-blue/15 text-light-slate-blue">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              {exam.title}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Exam Date: {exam.examDate} • Max Marks: {exam.totalMaxMarks} • Pass Marks: {exam.passMarks}
          </p>
        </div>

        <button
          onClick={handleSaveMarks}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen shadow-md shadow-weird-green/20 transition-transform active:scale-95"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Marks Saved & Syllabi Synced!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Marks & Sync Weak Radar</span>
            </>
          )}
        </button>
      </div>

      {/* Marks Entry Grid Table */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Marks Entry Grid ({eligibleStudents.length} Students)
          </h3>
          <span className="text-xs text-slate-400">
            Scores &lt; 60% automatically update syllabus status to "Revision Needed"
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-dark-border bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Roll</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4 text-center">Absent?</th>
                {exam.sections.map((sec) => (
                  <th key={sec.id} className="py-3 px-4 text-center">
                    <span className="block">{sec.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Max {sec.maxMarks})
                    </span>
                  </th>
                ))}
                <th className="py-3 px-4 text-center">Total Score</th>
                <th className="py-3 px-4 text-center">% Rate</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-800 dark:text-slate-200">
              {eligibleStudents.length === 0 ? (
                <tr>
                  <td colSpan={6 + exam.sections.length} className="text-center py-8 text-slate-400">
                    No students eligible for this exam.
                  </td>
                </tr>
              ) : (
                eligibleStudents.map((stu) => {
                  const res = results[stu.id] || {
                    studentId: stu.id,
                    isAbsent: false,
                    sectionMarks: {},
                    totalObtained: 0,
                    percentage: 0,
                  };

                  const isPass = res.totalObtained >= (exam.passMarks || 0);

                  return (
                    <tr
                      key={stu.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        res.isAbsent ? 'bg-light-red/5 opacity-70' : ''
                      }`}
                    >
                      {/* Roll */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold px-2 py-0.5 rounded-md bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow">
                          {stu.publicRollNo}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {stu.name}
                      </td>

                      {/* Absent checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={res.isAbsent}
                          onChange={(e) => handleToggleAbsent(stu.id, e.target.checked)}
                          className="rounded text-red-500 focus:ring-red-400"
                        />
                      </td>

                      {/* Section marks inputs */}
                      {exam.sections.map((sec) => (
                        <td key={sec.id} className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max={sec.maxMarks}
                            step="0.5"
                            disabled={res.isAbsent}
                            value={res.sectionMarks?.[sec.id] ?? ''}
                            onChange={(e) =>
                              handleSectionMarksChange(stu.id, sec.id, Number(e.target.value))
                            }
                            className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-bold disabled:opacity-30"
                          />
                        </td>
                      ))}

                      {/* Total Obtained */}
                      <td className="py-3 px-4 text-center font-black text-sm">
                        {res.isAbsent ? '0' : res.totalObtained} / {exam.totalMaxMarks}
                      </td>

                      {/* Percentage */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-full ${
                            res.isAbsent
                              ? 'bg-slate-200 text-slate-600'
                              : res.percentage >= 80
                              ? 'bg-weird-green/20 text-emerald-800 dark:text-wintergreen'
                              : res.percentage >= 60
                              ? 'bg-spiro-disco-ball/20 text-sky-800 dark:text-spiro-disco-ball'
                              : 'bg-light-red/20 text-red-800 dark:text-light-red'
                          }`}
                        >
                          {res.isAbsent ? 'ABS' : `${res.percentage}%`}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={res.remarks || ''}
                          onChange={(e) => handleRemarksChange(stu.id, e.target.value)}
                          placeholder="Teacher feedback..."
                          className="w-full px-2 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </td>

                      {/* WhatsApp Notify */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSendResultWhatsApp(stu)}
                          title="Send Exam Result via WhatsApp"
                          className="p-1.5 rounded-lg bg-weird-green/15 text-emerald-700 dark:text-wintergreen hover:bg-weird-green/25"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
