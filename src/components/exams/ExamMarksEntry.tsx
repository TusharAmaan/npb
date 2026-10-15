import React, { useState, useMemo } from 'react';
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
  Search,
  Building2,
  Layers,
  MessageSquare,
  Copy,
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
} from 'lucide-react';

interface ExamMarksEntryProps {
  exam: Exam;
  students: Student[];
  onBack: () => void;
}

export const ExamMarksEntry: React.FC<ExamMarksEntryProps> = ({ exam, students, onBack }) => {
  const { saveExam, schools } = useData();

  // Local state for exam results
  const [results, setResults] = useState<Record<string, StudentExamResult>>(
    exam.results || {}
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Filter & Search states
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [groupBySchool, setGroupBySchool] = useState<boolean>(true);

  // Eligible students
  const eligibleStudents = useMemo(() => {
    return students.filter((s) => {
      if (!s.isActive || !s.batchIds?.includes(exam.batchId)) return false;
      if (exam.scopeType === 'school_specific') {
        return exam.targetSchoolIds?.includes(s.schoolId);
      }
      if (exam.scopeType === 'student_specific') {
        return exam.targetStudentIds?.includes(s.id);
      }
      return true;
    });
  }, [students, exam]);

  // Distinct schools among eligible students
  const batchSchools = useMemo(() => {
    const ids = Array.from(new Set(eligibleStudents.map((s) => s.schoolId)));
    return ids
      .map((id) => schools.find((sc) => sc.id === id) || { id, name: id, shortCode: id, createdAt: 0 })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [eligibleStudents, schools]);

  // Filtered students
  const displayedStudents = useMemo(() => {
    return eligibleStudents.filter((stu) => {
      if (selectedSchoolId !== 'all' && stu.schoolId !== selectedSchoolId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = stu.name.toLowerCase().includes(q);
        const matchRoll = (stu.publicRollNo || '').toLowerCase().includes(q);
        const matchSchool = (stu.schoolName || '').toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchSchool) return false;
      }
      const res = results[stu.id];
      if (statusFilter === 'present' && res?.isAbsent) return false;
      if (statusFilter === 'absent' && !res?.isAbsent) return false;
      return true;
    });
  }, [eligibleStudents, selectedSchoolId, searchQuery, statusFilter, results]);

  // Grouped by School
  const studentsBySchool = useMemo(() => {
    const map = new Map<string, Student[]>();
    displayedStudents.forEach((stu) => {
      const key = stu.schoolName || 'General / Unassigned';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(stu);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [displayedStudents]);

  // Exam Statistics
  const stats = useMemo(() => {
    let evaluated = 0;
    let absent = 0;
    let totalScoreSum = 0;
    let passed = 0;
    let highest = 0;

    eligibleStudents.forEach((stu) => {
      const res = results[stu.id];
      if (!res) return;
      if (res.isAbsent) {
        absent++;
      } else {
        evaluated++;
        totalScoreSum += res.totalObtained;
        if (res.totalObtained > highest) highest = res.totalObtained;
        if (res.totalObtained >= (exam.passMarks || 0)) passed++;
      }
    });

    const avgScore = evaluated > 0 ? Math.round((totalScoreSum / evaluated) * 10) / 10 : 0;
    const avgPct = exam.totalMaxMarks > 0 ? Math.round((avgScore / exam.totalMaxMarks) * 100) : 0;
    const passRate = evaluated > 0 ? Math.round((passed / evaluated) * 100) : 0;

    // School-wise performance breakdown
    const schoolAverages = batchSchools.map((sc) => {
      const scStudents = eligibleStudents.filter((s) => s.schoolId === sc.id);
      let scTotal = 0;
      let scCount = 0;
      let scHigh = 0;
      scStudents.forEach((s) => {
        const r = results[s.id];
        if (r && !r.isAbsent) {
          scTotal += r.totalObtained;
          scCount++;
          if (r.totalObtained > scHigh) scHigh = r.totalObtained;
        }
      });
      const scAvg = scCount > 0 ? Math.round((scTotal / (scCount * (exam.totalMaxMarks || 1))) * 100) : 0;
      return {
        schoolId: sc.id,
        name: sc.shortCode || sc.name,
        count: scStudents.length,
        evaluated: scCount,
        avgPct: scAvg,
        highest: scHigh,
      };
    });

    return { evaluated, absent, avgScore, avgPct, passRate, highest, schoolAverages };
  }, [eligibleStudents, results, exam, batchSchools]);

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

  // Copy Full Class Result Summary for WhatsApp Group
  const handleCopyWhatsAppClassSummary = () => {
    let msg = `🏆 *EXAM RESULTS REPORT — ${exam.title}*\n`;
    msg += `📅 *Date:* ${exam.examDate} | *Total Marks:* ${exam.totalMaxMarks} (Pass: ${exam.passMarks})\n\n`;
    msg += `📊 *Class Overview:*\n`;
    msg += `  • Evaluated Students: ${stats.evaluated} / ${eligibleStudents.length}\n`;
    msg += `  • Class Average: ${stats.avgScore} / ${exam.totalMaxMarks} (${stats.avgPct}%)\n`;
    msg += `  • Highest Score: ${stats.highest} / ${exam.totalMaxMarks}\n`;
    msg += `  • Pass Rate: ${stats.passRate}%\n\n`;

    if (stats.schoolAverages.length > 1) {
      msg += `🏫 *School-wise Breakdown:*\n`;
      stats.schoolAverages.forEach((sc) => {
        msg += `  • ${sc.name}: Avg ${sc.avgPct}% (High: ${sc.highest}) [${sc.evaluated}/${sc.count}]\n`;
      });
      msg += `\n`;
    }

    msg += `📝 *Top Scorers:*\n`;
    const sorted = eligibleStudents
      .filter((s) => results[s.id] && !results[s.id].isAbsent)
      .sort((a, b) => (results[b.id]?.totalObtained || 0) - (results[a.id]?.totalObtained || 0))
      .slice(0, 10);

    sorted.forEach((stu, idx) => {
      const r = results[stu.id];
      msg += `  ${idx + 1}. [Roll ${stu.publicRollNo}] ${stu.name} (${stu.schoolName}) — *${r.totalObtained}* (${r.percentage}%)\n`;
    });

    msg += `\nNPB Academic Diagnostics & Tracking System`;

    navigator.clipboard.writeText(msg);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-light-slate-blue/15 text-light-slate-blue">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              {exam.title}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {exam.sections.length} Sections
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Exam Date: {exam.examDate} • Max Marks: {exam.totalMaxMarks} • Pass Marks: {exam.passMarks}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyWhatsAppClassSummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen shadow-xs transition-transform active:scale-95"
          >
            {copiedSummary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSummary ? 'Copied Summary!' : 'Copy WA Leaderboard'}</span>
          </button>

          <button
            onClick={handleSaveMarks}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-md shadow-light-indigo/25 transition-transform active:scale-95"
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
      </div>

      {/* Cohort Performance Overview & School Comparative Bar */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Evaluated
            </span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {stats.evaluated} / {eligibleStudents.length}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Class Average
            </span>
            <span className="text-base font-black text-light-indigo dark:text-neon-blue">
              {stats.avgScore} ({stats.avgPct}%)
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Highest Score
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {stats.highest} / {exam.totalMaxMarks}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pass Rate
            </span>
            <span className="text-base font-black text-teal-600 dark:text-teal-400">
              {stats.passRate}%
            </span>
          </div>
        </div>

        {/* School-Wise Comparative Pills */}
        {stats.schoolAverages.length > 1 && (
          <div className="pt-2 border-t border-slate-100 dark:border-dark-border flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>School Comparison:</span>
            </span>
            {stats.schoolAverages.map((sc) => (
              <span
                key={sc.schoolId}
                className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {sc.name}: <strong className="text-slate-900 dark:text-white">{sc.avgPct}% avg</strong> (Top: {sc.highest})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by name, roll # or school..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* School Filter Dropdown */}
          <div className="flex items-center gap-2 min-w-[220px]">
            <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Schools in Batch ({eligibleStudents.length})</option>
              {batchSchools.map((sc) => {
                const count = eligibleStudents.filter((s) => s.schoolId === sc.id).length;
                return (
                  <option key={sc.id} value={sc.id}>
                    {sc.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Group by School Toggle */}
          <button
            type="button"
            onClick={() => setGroupBySchool(!groupBySchool)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
              groupBySchool
                ? 'bg-light-indigo text-white border-light-indigo shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Group by School</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-xl font-bold transition-all border ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            All Students ({eligibleStudents.length})
          </button>

          <button
            onClick={() => setStatusFilter('present')}
            className={`px-3 py-1 rounded-xl font-bold transition-all border ${
              statusFilter === 'present'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
            }`}
          >
            Attended ({stats.evaluated})
          </button>

          <button
            onClick={() => setStatusFilter('absent')}
            className={`px-3 py-1 rounded-xl font-bold transition-all border ${
              statusFilter === 'absent'
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                : 'bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
            }`}
          >
            Absent ({stats.absent})
          </button>
        </div>
      </div>

      {/* MARKS ENTRY TABLE */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Marks Entry Grid ({displayedStudents.length} Students Displayed)
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
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6 + exam.sections.length} className="text-center py-8 text-slate-400">
                    No students match the current filter criteria.
                  </td>
                </tr>
              ) : groupBySchool ? (
                /* GROUPED BY SCHOOL ROWS */
                studentsBySchool.map(([schoolName, schoolStudents]) => (
                  <React.Fragment key={schoolName}>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/60 font-black text-slate-900 dark:text-white">
                      <td colSpan={6 + exam.sections.length} className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          <span>{schoolName}</span>
                          <span className="text-[11px] font-bold text-slate-400">
                            ({schoolStudents.length} Students)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {schoolStudents.map((stu) => {
                      const res = results[stu.id] || {
                        studentId: stu.id,
                        isAbsent: false,
                        sectionMarks: {},
                        totalObtained: 0,
                        percentage: 0,
                      };

                      return (
                        <tr
                          key={stu.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            res.isAbsent ? 'bg-light-red/5 opacity-70' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-extrabold px-2 py-0.5 rounded-md bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow">
                              {stu.publicRollNo}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {stu.name}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={res.isAbsent}
                              onChange={(e) => handleToggleAbsent(stu.id, e.target.checked)}
                              className="rounded text-red-500 focus:ring-red-400"
                            />
                          </td>

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

                          <td className="py-3 px-4 text-center font-black text-sm">
                            {res.isAbsent ? '0' : res.totalObtained} / {exam.totalMaxMarks}
                          </td>

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

                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={res.remarks || ''}
                              onChange={(e) => handleRemarksChange(stu.id, e.target.value)}
                              placeholder="Teacher feedback..."
                              className="w-full px-2 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </td>

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
                    })}
                  </React.Fragment>
                ))
              ) : (
                /* FLAT ROWS */
                displayedStudents.map((stu) => {
                  const res = results[stu.id] || {
                    studentId: stu.id,
                    isAbsent: false,
                    sectionMarks: {},
                    totalObtained: 0,
                    percentage: 0,
                  };

                  return (
                    <tr
                      key={stu.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        res.isAbsent ? 'bg-light-red/5 opacity-70' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-extrabold px-2 py-0.5 rounded-md bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow">
                          {stu.publicRollNo}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div>
                          <span>{stu.name}</span>
                          <span className="text-[10px] text-slate-400 block">{stu.schoolName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={res.isAbsent}
                          onChange={(e) => handleToggleAbsent(stu.id, e.target.checked)}
                          className="rounded text-red-500 focus:ring-red-400"
                        />
                      </td>

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

                      <td className="py-3 px-4 text-center font-black text-sm">
                        {res.isAbsent ? '0' : res.totalObtained} / {exam.totalMaxMarks}
                      </td>

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

                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={res.remarks || ''}
                          onChange={(e) => handleRemarksChange(stu.id, e.target.value)}
                          placeholder="Teacher feedback..."
                          className="w-full px-2 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </td>

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
