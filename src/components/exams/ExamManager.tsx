import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import { Exam, ExamSection, ExamCategoryType, SyllabusTermType } from '../../types/models';
import { ExamMarksEntry } from './ExamMarksEntry';
import { ExamSectionBuilder } from './ExamSectionBuilder';
import {
  GraduationCap,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
  X,
  BookOpen,
  Sparkles,
  Filter,
  Search,
  Building2,
  TrendingUp,
  Users,
  Copy,
  Check,
  Award,
} from 'lucide-react';

export const ExamManager: React.FC = () => {
  const { batches, students, schools, exams, syllabi, syllabusSchemes, saveExam, deleteExam } = useData();
  const { confirm } = useModal();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [activeMarksExamId, setActiveMarksExamId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExamCategoryType>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedExamId, setCopiedExamId] = useState<string | null>(null);

  // New Exam Form
  const [newTitle, setNewTitle] = useState('');
  const [newExamDate, setNewExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('16:00');
  const [newExamType, setNewExamType] = useState<ExamCategoryType>('weekly_quiz');
  const [newTermExamType, setNewTermExamType] = useState<SyllabusTermType>('half_yearly');
  const [newScopeType, setNewScopeType] = useState<'batch_wide' | 'school_specific'>('batch_wide');
  const [newTargetSchoolIds, setNewTargetSchoolIds] = useState<string[]>([]);
  const [newPassMarks, setNewPassMarks] = useState(15);
  const [newAbsentPolicy, setNewAbsentPolicy] = useState<
    'exclude_from_avg' | 'count_as_zero' | 'exclude_avg_but_zero_leaderboard'
  >('exclude_from_avg');

  // Initial sections for new exam
  const [newSections, setNewSections] = useState<ExamSection[]>([
    {
      id: 'sec-1',
      name: 'Part A: Grammar Core',
      category: 'Grammar',
      linkedTopicTitles: [],
      maxMarks: 15,
    },
    {
      id: 'sec-2',
      name: 'Part B: Guided Writing',
      category: 'Writing',
      linkedTopicTitles: [],
      maxMarks: 15,
    },
  ]);

  // Batch students & schools
  const batchStudents = useMemo(() => {
    return students.filter((s) => s.isActive && s.batchIds?.includes(selectedBatchId));
  }, [students, selectedBatchId]);

  const batchSchools = useMemo(() => {
    const sIds = new Set(batchStudents.map((s) => s.schoolId).filter(Boolean));
    return schools.filter((sch) => sIds.has(sch.id));
  }, [batchStudents, schools]);

  const schoolMap = useMemo(() => {
    const map = new Map<string, string>();
    schools.forEach((s) => map.set(s.id, s.shortCode || s.name));
    return map;
  }, [schools]);

  // Active batch exams & schemes
  const batchExams = useMemo(() => {
    return exams.filter((e) => e.batchId === selectedBatchId);
  }, [exams, selectedBatchId]);

  const batchSchemes = useMemo(() => {
    return syllabusSchemes.filter((s) => s.targetBatchId === selectedBatchId);
  }, [syllabusSchemes, selectedBatchId]);

  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');

  // Available topics for section builder
  const availableTopics = useMemo(() => {
    return Array.from(
      new Set([
        ...batchSchemes.flatMap((sch) => sch.topics.map((t) => t.title)),
        ...batchStudents.flatMap((s) => syllabi[s.id]?.topics?.map((t) => t.title) || []),
      ])
    );
  }, [batchSchemes, batchStudents, syllabi]);

  const handleImportFromScheme = (schemeId: string) => {
    const scheme = batchSchemes.find((s) => s.id === schemeId);
    if (!scheme) return;

    if (scheme.termType) {
      setNewTermExamType(scheme.termType);
      setNewExamType('term_exam');
    }

    // Group scheme topics by unitTitle
    const unitMap: Record<string, typeof scheme.topics> = {};
    scheme.topics.forEach((t) => {
      const unit = t.unitTitle || 'General Unit';
      if (!unitMap[unit]) unitMap[unit] = [];
      unitMap[unit].push(t);
    });

    const generatedSections: ExamSection[] = Object.entries(unitMap).map(([unit, unitTopics], idx) => {
      const totalUnitMarks = unitTopics.reduce((sum, t) => sum + (t.weightageMarks || 5), 0);
      const category = unit.toLowerCase().includes('writing')
        ? 'Writing'
        : unit.toLowerCase().includes('reading')
        ? 'Reading'
        : 'Grammar';

      return {
        id: `sec-sch-${Date.now().toString(36)}-${idx + 1}`,
        name: `${unit}`,
        category,
        linkedTopicTitles: unitTopics.map((t) => t.title),
        maxMarks: totalUnitMarks || 10,
      };
    });

    if (generatedSections.length > 0) {
      setNewSections(generatedSections);
      if (!newTitle) {
        setNewTitle(`${scheme.title} - Assessment`);
      }
    }
  };

  const totalMaxMarks = newSections.reduce((sum, s) => sum + (Number(s.maxMarks) || 0), 0);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const examId = `exam-${Date.now().toString(36)}`;
    const newExam: Exam = {
      id: examId,
      batchId: selectedBatchId,
      title: newTitle.trim(),
      examDate: newExamDate,
      startTime: newStartTime,
      examType: newExamType,
      termExamType: newExamType === 'term_exam' ? newTermExamType : undefined,
      syllabusSchemeId: selectedSchemeId || undefined,
      scopeType: newScopeType,
      targetSchoolIds: newScopeType === 'school_specific' ? newTargetSchoolIds : [],
      sections: newSections,
      totalMaxMarks,
      passMarks: Number(newPassMarks),
      absentPolicy: newAbsentPolicy,
      status: 'scheduled',
      results: {},
      createdAt: Date.now(),
    };

    await saveExam(newExam);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setSelectedSchemeId('');
    setNewTargetSchoolIds([]);
    setNewScopeType('batch_wide');
  };

  const handleDelete = async (examId: string, title: string) => {
    const ok = await confirm({
      title: 'Delete Exam',
      message: `Delete exam "${title}"? All recorded student scores and section breakdowns for this exam will be permanently removed.`,
      confirmText: 'Yes, Delete Exam',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (ok) {
      await deleteExam(examId);
    }
  };

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return batchExams.filter((ex) => {
      // Category filter
      if (categoryFilter !== 'all') {
        const type = ex.examType || 'weekly_quiz';
        if (type !== categoryFilter) return false;
      }
      // School filter
      if (schoolFilter !== 'all') {
        if (ex.scopeType === 'school_specific') {
          if (!ex.targetSchoolIds?.includes(schoolFilter)) return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ex.title.toLowerCase().includes(q);
        const matchesSection = ex.sections.some(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.linkedTopicTitles.some((t) => t.toLowerCase().includes(q))
        );
        if (!matchesTitle && !matchesSection) return false;
      }
      return true;
    });
  }, [batchExams, categoryFilter, schoolFilter, searchQuery]);

  // Copy WhatsApp Exam Summary
  const handleCopyWhatsAppSummary = (exam: Exam) => {
    const resultsList = Object.values(exam.results || {});
    const satList = resultsList.filter((r) => !r.isAbsent);
    const avgScore = satList.length > 0 ? (satList.reduce((sum, r) => sum + r.totalObtained, 0) / satList.length).toFixed(1) : 'N/A';
    const avgPct = satList.length > 0 ? (satList.reduce((sum, r) => sum + r.percentage, 0) / satList.length).toFixed(1) : '0';
    const highest = satList.length > 0 ? Math.max(...satList.map((r) => r.totalObtained)) : 0;

    // School breakdowns
    const schoolStats: Record<string, { total: number; sat: number; sumPct: number }> = {};
    batchStudents.forEach((st) => {
      if (exam.scopeType === 'school_specific' && !exam.targetSchoolIds?.includes(st.schoolId)) return;
      const schName = schoolMap.get(st.schoolId) || st.schoolName || 'Other School';
      if (!schoolStats[schName]) {
        schoolStats[schName] = { total: 0, sat: 0, sumPct: 0 };
      }
      schoolStats[schName].total += 1;
      const res = exam.results?.[st.id];
      if (res && !res.isAbsent) {
        schoolStats[schName].sat += 1;
        schoolStats[schName].sumPct += res.percentage;
      }
    });

    let schoolSummaryText = '';
    Object.entries(schoolStats).forEach(([schName, stats]) => {
      const avg = stats.sat > 0 ? (stats.sumPct / stats.sat).toFixed(1) : '0';
      schoolSummaryText += `\n🏫 *${schName}*: Avg ${avg}% (${stats.sat}/${stats.total} sat)`;
    });

    const text = `📊 *EXAM RESULT & DIAGNOSTIC REPORT*
📝 *Exam:* ${exam.title}
📅 *Date:* ${exam.examDate}
🎯 *Total Marks:* ${exam.totalMaxMarks} (Pass: ${exam.passMarks})

📈 *Cohort Performance Overview:*
• Total Students Sat: ${satList.length}
• Class Average: ${avgScore}/${exam.totalMaxMarks} (${avgPct}%)
• Highest Score: ${highest}/${exam.totalMaxMarks}

🏫 *School-Wise Performance Breakdown:*${schoolSummaryText}

_Detailed individual diagnostic report cards are accessible via the parent portal._`;

    navigator.clipboard.writeText(text);
    setCopiedExamId(exam.id);
    setTimeout(() => setCopiedExamId(null), 2500);
  };

  const activeMarksExam = exams.find((e) => e.id === activeMarksExamId);

  if (activeMarksExam) {
    return (
      <ExamMarksEntry
        exam={activeMarksExam}
        students={students}
        onBack={() => setActiveMarksExamId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-light-slate-blue/15 text-light-slate-blue">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Exams & Diagnostic Assessments
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Weekly quizzes, monthly tests, term assessments, school-segmented comparisons, and syllabus-linked marks.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-md shadow-light-indigo/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Exam</span>
        </button>
      </div>

      {/* Control Strip: Batch & Filters */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Batch Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Selected Batch
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.courseTag})
                </option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter by School</span>
            </label>
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Schools in Batch ({batchSchools.length})</option>
              {batchSchools.map((sch) => {
                const count = batchStudents.filter((s) => s.schoolId === sch.id).length;
                return (
                  <option key={sch.id} value={sch.id}>
                    {sch.name} ({count} students)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search Exam or Topic</span>
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Modifiers, Pre-Test, Quiz 3..."
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-dark-border">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-light-indigo text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Assessments ({batchExams.length})
          </button>
          <button
            onClick={() => setCategoryFilter('weekly_quiz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              categoryFilter === 'weekly_quiz'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100'
            }`}
          >
            <span>Weekly Quizzes</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {batchExams.filter((e) => (e.examType || 'weekly_quiz') === 'weekly_quiz').length}
            </span>
          </button>
          <button
            onClick={() => setCategoryFilter('monthly_test')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              categoryFilter === 'monthly_test'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <span>Monthly Tests</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {batchExams.filter((e) => e.examType === 'monthly_test').length}
            </span>
          </button>
          <button
            onClick={() => setCategoryFilter('term_exam')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              categoryFilter === 'term_exam'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
            }`}
          >
            <span>Term Exams</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {batchExams.filter((e) => e.examType === 'term_exam').length}
            </span>
          </button>
          <button
            onClick={() => setCategoryFilter('pop_quiz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              categoryFilter === 'pop_quiz'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            <span>Pop Quizzes</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {batchExams.filter((e) => e.examType === 'pop_quiz').length}
            </span>
          </button>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExams.length === 0 ? (
          <div className="md:col-span-2 bg-white dark:bg-dark-surface p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No matching exams or assessments found.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click "+ Create New Exam" above to schedule a model test or assessment.
            </p>
          </div>
        ) : (
          filteredExams.map((ex) => {
            const resultsList = Object.values(ex.results || {});
            const resultsCount = resultsList.length;
            const satList = resultsList.filter((r) => !r.isAbsent);
            const isCompleted = ex.status === 'completed' || resultsCount > 0;

            const classAvgPct =
              satList.length > 0
                ? (satList.reduce((sum, r) => sum + r.percentage, 0) / satList.length).toFixed(1)
                : null;
            const highestObtained =
              satList.length > 0 ? Math.max(...satList.map((r) => r.totalObtained)) : null;

            // School breakdown stats
            const schoolStats: Record<string, { total: number; sat: number; sumPct: number }> = {};
            batchStudents.forEach((st) => {
              if (ex.scopeType === 'school_specific' && !ex.targetSchoolIds?.includes(st.schoolId)) return;
              const schName = schoolMap.get(st.schoolId) || st.schoolName || 'Other';
              if (!schoolStats[schName]) {
                schoolStats[schName] = { total: 0, sat: 0, sumPct: 0 };
              }
              schoolStats[schName].total += 1;
              const res = ex.results?.[st.id];
              if (res && !res.isAbsent) {
                schoolStats[schName].sat += 1;
                schoolStats[schName].sumPct += res.percentage;
              }
            });

            // Category badge style
            const getCategoryBadge = () => {
              const type = ex.examType || 'weekly_quiz';
              switch (type) {
                case 'term_exam':
                  return {
                    label: `Term: ${(ex.termExamType || 'exam').replace('_', ' ').toUpperCase()}`,
                    bg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/60',
                  };
                case 'monthly_test':
                  return {
                    label: 'Monthly Assessment',
                    bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60',
                  };
                case 'pop_quiz':
                  return {
                    label: 'Pop Quiz',
                    bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60',
                  };
                default:
                  return {
                    label: 'Weekly Quiz',
                    bg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/60',
                  };
              }
            };

            const catBadge = getCategoryBadge();

            return (
              <div
                key={ex.id}
                className="bg-white dark:bg-dark-surface rounded-2xl p-5 border border-slate-200/80 dark:border-dark-border shadow-xs hover:border-light-indigo/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Category, Date, Status */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${catBadge.bg}`}
                      >
                        {catBadge.label}
                      </span>

                      {ex.scopeType === 'school_specific' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60">
                          {ex.targetSchoolIds?.length || 0} School(s) Only
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Whole Batch
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {ex.examDate}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-weird-green/20 text-emerald-800 dark:text-wintergreen'
                            : 'bg-spiro-disco-ball/20 text-sky-800 dark:text-spiro-disco-ball'
                        }`}
                      >
                        {isCompleted ? 'Evaluated' : 'Scheduled'}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-black text-slate-900 dark:text-white mt-2.5">
                    {ex.title}
                  </h2>

                  {/* Marks info */}
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Total Max: <strong className="text-slate-700 dark:text-slate-200">{ex.totalMaxMarks}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Pass: <strong className="text-slate-700 dark:text-slate-200">{ex.passMarks}</strong>
                    </span>
                    <span>•</span>
                    <span>{ex.sections.length} Sections</span>
                  </div>

                  {/* Section Pills */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {ex.sections.map((sec) => (
                      <span
                        key={sec.id}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {sec.name} ({sec.maxMarks})
                      </span>
                    ))}
                  </div>

                  {/* Performance Breakdown Overview (If Sat) */}
                  {satList.length > 0 && (
                    <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-light-indigo" />
                          <span>Class Average:</span>
                          <strong className="text-light-indigo font-black">{classAvgPct}%</strong>
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Highest: <strong>{highestObtained}/{ex.totalMaxMarks}</strong>
                        </span>
                      </div>

                      {/* School-wise breakdown pills */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>School Performance Breakdown:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(schoolStats).map(([schName, stats]) => {
                            const avg = stats.sat > 0 ? (stats.sumPct / stats.sat).toFixed(0) : '0';
                            return (
                              <span
                                key={schName}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-700 shadow-2xs font-semibold text-slate-700 dark:text-slate-300"
                              >
                                <span className="text-slate-900 dark:text-white font-bold">{schName}:</span>
                                <span className="text-light-indigo font-bold">{avg}%</span>
                                <span className="text-[10px] text-slate-400">({stats.sat}/{stats.total})</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-dark-border flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveMarksExamId(ex.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-xs transition-all"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Enter / Review Marks ({resultsCount})</span>
                    </button>

                    <button
                      onClick={() => handleCopyWhatsAppSummary(ex)}
                      className="p-1.5 text-slate-500 hover:text-light-indigo rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Copy WhatsApp Result Summary"
                    >
                      {copiedExamId === ex.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(ex.id, ex.title)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Exam Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Create Assessment / Model Test
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Section-wise paper design with linked syllabus topics & school targeting
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Monthly Assessment 2: Narration & Prepositions"
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Assessment Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assessment Category
                  </label>
                  <select
                    value={newExamType}
                    onChange={(e) => setNewExamType(e.target.value as ExamCategoryType)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="weekly_quiz">Weekly Quiz</option>
                    <option value="monthly_test">Monthly Assessment Test</option>
                    <option value="term_exam">Term / Institutional Exam</option>
                    <option value="pop_quiz">Pop Quiz / Surprise Test</option>
                  </select>
                </div>

                {/* Term Type if Term Exam */}
                {newExamType === 'term_exam' ? (
                  <div>
                    <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">
                      Term Scheme Type
                    </label>
                    <select
                      value={newTermExamType}
                      onChange={(e) => setNewTermExamType(e.target.value as SyllabusTermType)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-100"
                    >
                      <option value="half_yearly">Half Yearly Examination</option>
                      <option value="first_term">1st Term Examination</option>
                      <option value="second_term">2nd Term Examination</option>
                      <option value="pre_test">Pre-Test Examination</option>
                      <option value="test_exam">Test Examination</option>
                      <option value="final_board">Final Board Exam Mock</option>
                      <option value="custom">Custom Academic Term</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pass Marks (Total: {totalMaxMarks})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalMaxMarks}
                    value={newPassMarks}
                    onChange={(e) => setNewPassMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Target Scope: Batch-Wide vs Specific Schools */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-dark-border space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Scope for this Assessment
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                    <input
                      type="radio"
                      name="scopeType"
                      checked={newScopeType === 'batch_wide'}
                      onChange={() => setNewScopeType('batch_wide')}
                      className="text-light-indigo"
                    />
                    <span>All Students in Batch ({batchStudents.length})</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                    <input
                      type="radio"
                      name="scopeType"
                      checked={newScopeType === 'school_specific'}
                      onChange={() => setNewScopeType('school_specific')}
                      className="text-light-indigo"
                    />
                    <span>Specific Schools in this Batch</span>
                  </label>
                </div>

                {newScopeType === 'school_specific' && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] text-slate-500 mb-2">
                      Select which schools should sit this assessment:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {batchSchools.map((sch) => {
                        const isSelected = newTargetSchoolIds.includes(sch.id);
                        const count = batchStudents.filter((s) => s.schoolId === sch.id).length;
                        return (
                          <button
                            type="button"
                            key={sch.id}
                            onClick={() => {
                              if (isSelected) {
                                setNewTargetSchoolIds(newTargetSchoolIds.filter((id) => id !== sch.id));
                              } else {
                                setNewTargetSchoolIds([...newTargetSchoolIds, sch.id]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-light-indigo text-white border-light-indigo shadow-xs'
                                : 'bg-white dark:bg-dark-surface border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span>{sch.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Absent Handling Policy */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Absentee Policy for Averages & Leaderboard
                </label>
                <select
                  value={newAbsentPolicy}
                  onChange={(e) => setNewAbsentPolicy(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="exclude_from_avg">
                    Exclude from Average (Only averages sat exams)
                  </option>
                  <option value="count_as_zero">
                    Count as Zero (0) in all academic averages & leaderboard
                  </option>
                  <option value="exclude_avg_but_zero_leaderboard">
                    Exclude from Report Average, but 0 on Public Leaderboard
                  </option>
                </select>
              </div>

              {/* Syllabus Scheme Link & 1-Click Section Import */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Select Topics from Syllabus Scheme:</span>
                  </span>
                  {batchSchemes.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                      {batchSchemes.length} Scheme(s) Available
                    </span>
                  )}
                </div>

                {batchSchemes.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={selectedSchemeId}
                      onChange={(e) => {
                        setSelectedSchemeId(e.target.value);
                        if (e.target.value) handleImportFromScheme(e.target.value);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-dark-surface text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="">-- Choose Syllabus Scheme to auto-generate sections & marks --</option>
                      {batchSchemes.map((sch) => (
                        <option key={sch.id} value={sch.id}>
                          {sch.title} ({sch.topics.length} topics)
                        </option>
                      ))}
                    </select>

                    {selectedSchemeId && (
                      <button
                        type="button"
                        onClick={() => handleImportFromScheme(selectedSchemeId)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Re-import</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    No syllabus schemes created for this batch yet. Go to{' '}
                    <span className="font-bold text-emerald-600">Syllabus Schemes</span> to add a Half Yearly or Term syllabus.
                  </p>
                )}
              </div>

              {/* Section Builder */}
              <ExamSectionBuilder
                sections={newSections}
                availableTopics={availableTopics}
                onChange={setNewSections}
              />

              <div className="pt-3 border-t border-slate-100 dark:border-dark-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm"
                >
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
