import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import {
  Homework,
  HomeworkStatus,
  HomeworkSubmission,
  Student,
} from '../../types/models';
import { WhatsAppTemplates } from '../../lib/whatsappTemplates';
import {
  BookOpenCheck,
  Plus,
  Trash2,
  Calendar,
  Check,
  Sparkles,
  Percent,
  X,
  MessageSquare,
  Users,
  BookOpen,
  Search,
  Building2,
  Layers,
  CheckCircle2,
  Clock,
  Tag,
  AlertCircle,
  Zap,
} from 'lucide-react';

export const HomeworkManager: React.FC = () => {
  const {
    batches,
    students,
    schools,
    homeworks,
    sessions,
    syllabusSchemes,
    saveHomework,
    deleteHomework,
    saveHomeworkSubmission,
    bulkUpdateHomeworkSubmissions,
  } = useData();
  const { confirm } = useModal();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [selectedHwId, setSelectedHwId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | HomeworkStatus>('all');
  const [groupBySchool, setGroupBySchool] = useState<boolean>(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // New Homework Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSelectedSchemeId, setNewSelectedSchemeId] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [newCustomTopic, setNewCustomTopic] = useState('');
  const [newCustomTopicsList, setNewCustomTopicsList] = useState<string[]>([]);
  const [newDueDate, setNewDueDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [newTargetType, setNewTargetType] = useState<
    'whole_batch' | 'specific_schools' | 'specific_students'
  >('whole_batch');
  const [newTargetSchoolIds, setNewTargetSchoolIds] = useState<string[]>([]);
  const [newGradingMode, setNewGradingMode] = useState<'status_only' | 'status_and_marks'>(
    'status_only'
  );
  const [newMaxMarks, setNewMaxMarks] = useState<number>(10);

  // Active Batch Homeworks & Schemes
  const batchHomeworks = useMemo(
    () => homeworks.filter((h) => h.batchId === selectedBatchId),
    [homeworks, selectedBatchId]
  );

  const activeHomework = useMemo(() => {
    if (selectedHwId) {
      const found = batchHomeworks.find((h) => h.id === selectedHwId);
      if (found) return found;
    }
    return batchHomeworks[0] || null;
  }, [batchHomeworks, selectedHwId]);

  const activeBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId) || batches[0],
    [batches, selectedBatchId]
  );

  const batchStudents = useMemo(
    () => students.filter((s) => s.isActive && s.batchIds?.includes(selectedBatchId)),
    [students, selectedBatchId]
  );

  // Eligible students for the active homework
  const eligibleStudents = useMemo(() => {
    if (!activeHomework) return batchStudents;
    if (activeHomework.targetType === 'specific_schools' && activeHomework.targetSchoolIds?.length) {
      return batchStudents.filter((s) => activeHomework.targetSchoolIds?.includes(s.schoolId));
    }
    if (activeHomework.targetType === 'specific_students' && activeHomework.targetStudentIds?.length) {
      return batchStudents.filter((s) => activeHomework.targetStudentIds?.includes(s.id));
    }
    return batchStudents;
  }, [activeHomework, batchStudents]);

  // Distinct schools in this batch
  const batchSchools = useMemo(() => {
    const ids = Array.from(new Set(batchStudents.map((s) => s.schoolId)));
    return ids
      .map((id) => schools.find((sc) => sc.id === id) || { id, name: id, shortCode: id, createdAt: 0 })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [batchStudents, schools]);

  const batchSchemes = useMemo(
    () => syllabusSchemes.filter((s) => s.targetBatchId === selectedBatchId),
    [syllabusSchemes, selectedBatchId]
  );

  // Filtered students based on school, search, and status
  const displayedStudents = useMemo(() => {
    return eligibleStudents.filter((stu) => {
      // School filter
      if (selectedSchoolId !== 'all' && stu.schoolId !== selectedSchoolId) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = stu.name.toLowerCase().includes(q);
        const matchRoll = (stu.publicRollNo || '').toLowerCase().includes(q);
        const matchSchool = (stu.schoolName || '').toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchSchool) return false;
      }
      // Status
      if (activeHomework && statusFilter !== 'all') {
        const subStatus = activeHomework.submissions?.[stu.id]?.status || 'pending';
        if (subStatus !== statusFilter) return false;
      }
      return true;
    });
  }, [eligibleStudents, selectedSchoolId, searchQuery, statusFilter, activeHomework]);

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

  // Submission statistics
  const stats = useMemo(() => {
    if (!activeHomework) {
      return { done: 0, partial: 0, late: 0, notDone: 0, pending: 0, total: 0, rate: 0 };
    }
    let done = 0;
    let partial = 0;
    let late = 0;
    let notDone = 0;
    let pending = 0;

    eligibleStudents.forEach((stu) => {
      const sub = activeHomework.submissions?.[stu.id];
      const status = sub?.status || 'pending';
      if (status === 'done') done++;
      else if (status === 'incomplete') partial++;
      else if (status === 'late') late++;
      else if (status === 'not_done') notDone++;
      else pending++;
    });

    const total = eligibleStudents.length;
    const rate = total > 0 ? Math.round(((done + late * 0.75 + partial * 0.5) / total) * 100) : 0;
    return { done, partial, late, notDone, pending, total, rate };
  }, [activeHomework, eligibleStudents]);

  // Handle Create HW
  const handleCreateHw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const hwId = `hw-${Date.now().toString(36)}`;
    const allTopics = [...selectedTopics, ...newCustomTopicsList];

    const newHw: Homework = {
      id: hwId,
      batchId: selectedBatchId,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      relatedTopics: allTopics,
      outOfSyllabusTopics: newCustomTopicsList,
      schemeId: newSelectedSchemeId || undefined,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate,
      targetType: newTargetType,
      targetSchoolIds: newTargetType === 'specific_schools' ? newTargetSchoolIds : undefined,
      gradingMode: newGradingMode,
      maxMarks: newGradingMode === 'status_and_marks' ? Number(newMaxMarks) : undefined,
      submissions: {},
      createdAt: Date.now(),
    };

    await saveHomework(newHw);
    setSelectedHwId(hwId);
    setIsCreateModalOpen(false);

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setSelectedTopics([]);
    setNewCustomTopicsList([]);
    setNewCustomTopic('');
    setNewTargetSchoolIds([]);
  };

  // Handle Submission update
  const handleUpdateStatus = async (studentId: string, status: HomeworkStatus) => {
    if (!activeHomework) return;
    const existing = activeHomework.submissions?.[studentId] || { studentId, status: 'pending' };
    const updated: HomeworkSubmission = {
      ...existing,
      status,
      checkedAt: Date.now(),
    };
    await saveHomeworkSubmission(activeHomework.id, studentId, updated);
  };

  // Handle Marks change
  const handleUpdateMarks = async (studentId: string, marks: number) => {
    if (!activeHomework) return;
    const max = activeHomework.maxMarks || 10;
    const pct = (marks / max) * 100;
    let status: HomeworkStatus = 'done';
    if (pct === 0) status = 'not_done';
    else if (pct < 50) status = 'incomplete';

    const existing = activeHomework.submissions?.[studentId] || { studentId, status: 'pending' };
    const updated: HomeworkSubmission = {
      ...existing,
      obtainedMarks: marks,
      status,
      checkedAt: Date.now(),
    };
    await saveHomeworkSubmission(activeHomework.id, studentId, updated);
  };

  // Bulk Actions
  const handleBulkMarkFiltered = async (status: HomeworkStatus) => {
    if (!activeHomework || displayedStudents.length === 0) return;
    const updates: Record<string, HomeworkStatus> = {};
    displayedStudents.forEach((stu) => {
      updates[stu.id] = status;
    });
    await bulkUpdateHomeworkSubmissions(activeHomework.id, updates);
  };

  // 1-Click WhatsApp Defaulter Summary Copy
  const handleCopyDefaulterSummary = () => {
    if (!activeHomework) return;

    const targetStudents =
      selectedSchoolId === 'all'
        ? eligibleStudents
        : eligibleStudents.filter((s) => s.schoolId === selectedSchoolId);

    const schoolLabel =
      selectedSchoolId === 'all'
        ? activeBatch.name
        : `${activeBatch.name} — ${batchSchools.find((s) => s.id === selectedSchoolId)?.name || 'School'}`;

    const defaulters: string[] = [];
    let doneCount = 0;

    targetStudents.forEach((stu) => {
      const sub = activeHomework.submissions?.[stu.id];
      if (sub && sub.status === 'done') {
        doneCount++;
      } else {
        const statusLabel =
          sub?.status === 'incomplete'
            ? 'Partial'
            : sub?.status === 'late'
            ? 'Submitted Late'
            : sub?.status === 'not_done'
            ? 'Not Done'
            : 'Pending / Not Checked';
        defaulters.push(`${stu.name} (Roll ${stu.publicRollNo}) [${stu.schoolName}] — ${statusLabel}`);
      }
    });

    const summaryText = WhatsAppTemplates.homeworkDefaulterSummary(
      schoolLabel,
      activeHomework.dueDate,
      defaulters,
      doneCount,
      targetStudents.length
    );

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Delete Homework
  const handleDeleteHomework = async () => {
    if (!activeHomework) return;
    const ok = await confirm({
      title: 'Delete Homework Assignment',
      message: `Permanently delete "${activeHomework.title}" and all recorded submissions?`,
      confirmText: 'Yes, Delete',
      variant: 'danger',
    });
    if (ok) {
      await deleteHomework(activeHomework.id);
      setSelectedHwId('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <BookOpenCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Dual-Mode Homework & Assignment Tracker
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {batchHomeworks.length} Homeworks Assigned
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Track exercises by Batch and School cohorts. Connect to syllabus topics or custom out-of-syllabus tasks, evaluate via fast status buttons or numeric marks, and generate WhatsApp defaulter lists.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-md shadow-light-indigo/25 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Assign New Homework</span>
        </button>
      </div>

      {/* Batch & Assignment Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Batch Selector */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Active Batch
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => {
              setSelectedBatchId(e.target.value);
              setSelectedHwId('');
              setSelectedSchoolId('all');
            }}
            className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.courseTag})
              </option>
            ))}
          </select>
        </div>

        {/* Assignment Selector */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs md:col-span-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Active Homework Task
            </label>
            {activeHomework && (
              <span className="text-[11px] font-semibold text-slate-400">
                Due: {activeHomework.dueDate}
              </span>
            )}
          </div>
          <select
            value={activeHomework?.id || ''}
            onChange={(e) => setSelectedHwId(e.target.value)}
            disabled={batchHomeworks.length === 0}
            className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
          >
            {batchHomeworks.length === 0 ? (
              <option value="">No homework assigned for this batch</option>
            ) : (
              batchHomeworks.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title} (Due: {h.dueDate})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Active Assignment Hero Card */}
      {activeHomework ? (
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
                  {activeHomework.gradingMode === 'status_and_marks'
                    ? `Status + Marks (Max: ${activeHomework.maxMarks})`
                    : 'Fast Status Buttons'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Due: {activeHomework.dueDate}
                </span>
                {activeHomework.sessionId && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Linked to Class Session
                  </span>
                )}
                {activeHomework.targetType === 'specific_schools' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    School-Targeted ({activeHomework.targetSchoolIds?.length || 0} schools)
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {activeHomework.title}
              </h2>

              {activeHomework.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                  {activeHomework.description}
                </p>
              )}

              {/* Topics Tags */}
              {activeHomework.relatedTopics && activeHomework.relatedTopics.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {activeHomework.relatedTopics.map((top, idx) => {
                    const isOutOfSyllabus = activeHomework.outOfSyllabusTopics?.includes(top);
                    return (
                      <span
                        key={idx}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          isOutOfSyllabus
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        {isOutOfSyllabus ? `⚡ ${top} (Out of Syllabus)` : top}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Completion Metric Card */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 min-w-[280px]">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <span>Cohort Completion Rate</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">
                  {stats.rate}% Evaluated
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, stats.rate)}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">Done</span>
                  <span className="font-black text-emerald-700 dark:text-emerald-300">{stats.done}</span>
                </div>
                <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-bold">Part</span>
                  <span className="font-black text-amber-700 dark:text-amber-300">{stats.partial}</span>
                </div>
                <div className="p-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800">
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 block font-bold">Late</span>
                  <span className="font-black text-cyan-700 dark:text-cyan-300">{stats.late}</span>
                </div>
                <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-bold">Not</span>
                  <span className="font-black text-rose-700 dark:text-rose-300">{stats.notDone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Bulk Action Strip & Export */}
          <div className="pt-3 border-t border-slate-100 dark:border-dark-border flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleBulkMarkFiltered('done')}
                disabled={displayedStudents.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Filtered as Done ({displayedStudents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkMarkFiltered('incomplete')}
                disabled={displayedStudents.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition-all disabled:opacity-50"
              >
                <span>Mark Partial</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkMarkFiltered('pending')}
                disabled={displayedStudents.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50"
              >
                <span>Reset to Pending</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* WhatsApp Defaulter Summary Copy */}
              <button
                type="button"
                onClick={handleCopyDefaulterSummary}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen shadow-xs transition-transform active:scale-95"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                <span>{copiedSummary ? 'Copied Log!' : 'Copy WhatsApp Defaulters'}</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteHomework}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                title="Delete Homework"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-surface p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <BookOpenCheck className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
          <h3 className="font-extrabold text-slate-800 dark:text-slate-200">
            No Homework Task Selected
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Assign your first homework or choose an existing homework above to start grading submissions.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Homework Now</span>
          </button>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      {activeHomework && (
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
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
                <option value="all">All Schools in Batch ({batchStudents.length})</option>
                {batchSchools.map((sc) => {
                  const count = batchStudents.filter((s) => s.schoolId === sc.id).length;
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
              onClick={() => setStatusFilter('done')}
              className={`px-3 py-1 rounded-xl font-bold transition-all border ${
                statusFilter === 'done'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
              }`}
            >
              Done ({stats.done})
            </button>

            <button
              onClick={() => setStatusFilter('incomplete')}
              className={`px-3 py-1 rounded-xl font-bold transition-all border ${
                statusFilter === 'incomplete'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
              }`}
            >
              Partial ({stats.partial})
            </button>

            <button
              onClick={() => setStatusFilter('late')}
              className={`px-3 py-1 rounded-xl font-bold transition-all border ${
                statusFilter === 'late'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-2xs'
                  : 'bg-cyan-50/60 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40'
              }`}
            >
              Late ({stats.late})
            </button>

            <button
              onClick={() => setStatusFilter('not_done')}
              className={`px-3 py-1 rounded-xl font-bold transition-all border ${
                statusFilter === 'not_done'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
              }`}
            >
              Not Done ({stats.notDone})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-xl font-bold transition-all border ${
                statusFilter === 'pending'
                  ? 'bg-slate-600 text-white border-slate-600 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              Pending / Unchecked ({stats.pending})
            </button>
          </div>
        </div>
      )}

      {/* CHECKING & EVALUATION TABLE */}
      {activeHomework && (
        <div className="space-y-4">
          {displayedStudents.length === 0 ? (
            <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-400 text-xs">
              No students match the current filter criteria.
            </div>
          ) : groupBySchool ? (
            /* GROUPED BY SCHOOL */
            studentsBySchool.map(([schoolName, schoolStudents]) => {
              const doneCount = schoolStudents.filter(
                (s) => activeHomework.submissions?.[s.id]?.status === 'done'
              ).length;
              const schoolPct =
                schoolStudents.length > 0 ? Math.round((doneCount / schoolStudents.length) * 100) : 0;

              return (
                <div
                  key={schoolName}
                  className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs overflow-hidden"
                >
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-dark-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {schoolName}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {doneCount} / {schoolStudents.length} Done ({schoolPct}%)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updates: Record<string, HomeworkStatus> = {};
                        schoolStudents.forEach((s) => (updates[s.id] = 'done'));
                        bulkUpdateHomeworkSubmissions(activeHomework.id, updates);
                      }}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      + Mark All in School Done
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-dark-border">
                    {schoolStudents.map((stu) => {
                      const sub = activeHomework.submissions?.[stu.id] || {
                        studentId: stu.id,
                        status: 'pending',
                      };

                      return (
                        <div
                          key={stu.id}
                          className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-black text-xs px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 min-w-[50px] text-center">
                              {stu.publicRollNo}
                            </span>
                            <div>
                              <span className="font-bold text-sm text-slate-900 dark:text-white block">
                                {stu.name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {sub.checkedAt ? `Checked: ${new Date(sub.checkedAt).toLocaleDateString()}` : 'Awaiting Check'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Marks input if enabled */}
                            {activeHomework.gradingMode === 'status_and_marks' && (
                              <div className="flex items-center gap-1 text-xs font-bold">
                                <input
                                  type="number"
                                  min="0"
                                  max={activeHomework.maxMarks || 10}
                                  value={sub.obtainedMarks ?? ''}
                                  onChange={(e) => handleUpdateMarks(stu.id, Number(e.target.value))}
                                  placeholder="Marks"
                                  className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                                />
                                <span className="text-slate-400">/ {activeHomework.maxMarks}</span>
                              </div>
                            )}

                            {/* Status Buttons */}
                            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 gap-1 text-xs">
                              <button
                                onClick={() => handleUpdateStatus(stu.id, 'done')}
                                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                  sub.status === 'done'
                                    ? 'bg-weird-green text-slate-950 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
                                }`}
                              >
                                Done
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(stu.id, 'incomplete')}
                                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                  sub.status === 'incomplete'
                                    ? 'bg-radiant-yellow text-slate-950 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
                                }`}
                              >
                                Partial
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(stu.id, 'late')}
                                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                  sub.status === 'late'
                                    ? 'bg-spiro-disco-ball text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
                                }`}
                              >
                                Late
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(stu.id, 'not_done')}
                                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                  sub.status === 'not_done'
                                    ? 'bg-light-red text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
                                }`}
                              >
                                Not Done
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            /* FLAT TABLE */
            <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-dark-border">
                {displayedStudents.map((stu) => {
                  const sub = activeHomework.submissions?.[stu.id] || {
                    studentId: stu.id,
                    status: 'pending',
                  };

                  return (
                    <div
                      key={stu.id}
                      className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-black text-xs px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 min-w-[50px] text-center">
                          {stu.publicRollNo}
                        </span>
                        <div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white block">
                            {stu.name}
                          </span>
                          <span className="text-[11px] text-slate-400">{stu.schoolName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {activeHomework.gradingMode === 'status_and_marks' && (
                          <div className="flex items-center gap-1 text-xs font-bold">
                            <input
                              type="number"
                              min="0"
                              max={activeHomework.maxMarks || 10}
                              value={sub.obtainedMarks ?? ''}
                              onChange={(e) => handleUpdateMarks(stu.id, Number(e.target.value))}
                              placeholder="Marks"
                              className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center"
                            />
                            <span className="text-slate-400">/ {activeHomework.maxMarks}</span>
                          </div>
                        )}

                        <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 gap-1 text-xs">
                          <button
                            onClick={() => handleUpdateStatus(stu.id, 'done')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                              sub.status === 'done'
                                ? 'bg-weird-green text-slate-950 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
                            }`}
                          >
                            Done
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(stu.id, 'incomplete')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                              sub.status === 'incomplete'
                                ? 'bg-radiant-yellow text-slate-950 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
                            }`}
                          >
                            Partial
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(stu.id, 'late')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                              sub.status === 'late'
                                ? 'bg-spiro-disco-ball text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(stu.id, 'not_done')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                              sub.status === 'not_done'
                                ? 'bg-light-red text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
                            }`}
                          >
                            Not Done
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE HOMEWORK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-lg border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  <BookOpenCheck className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Assign New Homework
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHw} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Homework Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Modifiers Board Questions 1-15 (Sheet #01)"
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Solve exercises in HW copy with question numbers."
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Syllabus Scheme Link & Topic Selector */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-light-indigo" />
                  <span>Link to Syllabus Scheme (Optional)</span>
                </span>

                <select
                  value={newSelectedSchemeId}
                  onChange={(e) => setNewSelectedSchemeId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">No Scheme Link / Independent Task</option>
                  {batchSchemes.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.title} ({sch.termType.replace('_', ' ').toUpperCase()})
                    </option>
                  ))}
                </select>

                {newSelectedSchemeId && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Select Topics Covered by this Homework:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                      {batchSchemes
                        .find((s) => s.id === newSelectedSchemeId)
                        ?.topics.map((top) => {
                          const isSelected = selectedTopics.includes(top.title);
                          return (
                            <button
                              key={top.id}
                              type="button"
                              onClick={() => {
                                setSelectedTopics((prev) =>
                                  isSelected ? prev.filter((t) => t !== top.title) : [...prev, top.title]
                                );
                              }}
                              className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${
                                isSelected
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

                {/* Out of Syllabus Custom Topic Input */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    + Add Out-of-Syllabus Custom Topic Tag:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newCustomTopic}
                      onChange={(e) => setNewCustomTopic(e.target.value)}
                      placeholder="e.g. Olympiad Grammar Challenge"
                      className="flex-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCustomTopic.trim() && !newCustomTopicsList.includes(newCustomTopic.trim())) {
                          setNewCustomTopicsList((prev) => [...prev, newCustomTopic.trim()]);
                          setNewCustomTopic('');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-2xs"
                    >
                      Add
                    </button>
                  </div>

                  {newCustomTopicsList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {newCustomTopicsList.map((ct, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        >
                          <span>{ct}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setNewCustomTopicsList((prev) => prev.filter((_, i) => i !== idx))
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

              {/* Due Date and Grading Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Evaluation Mode
                  </label>
                  <select
                    value={newGradingMode}
                    onChange={(e) => setNewGradingMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="status_only">Fast Status Buttons Only</option>
                    <option value="status_and_marks">Status + Numeric Marks</option>
                  </select>
                </div>
              </div>

              {newGradingMode === 'status_and_marks' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Target Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Student Scope
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setNewTargetType('whole_batch')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      newTargetType === 'whole_batch'
                        ? 'bg-light-indigo text-white border-light-indigo shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Entire Batch ({batchStudents.length} Students)
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTargetType('specific_schools')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      newTargetType === 'specific_schools'
                        ? 'bg-light-indigo text-white border-light-indigo shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Specific Schools in Batch
                  </button>
                </div>

                {newTargetType === 'specific_schools' && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Select Target Schools:
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {batchSchools.map((sc) => {
                        const isChecked = newTargetSchoolIds.includes(sc.id);
                        return (
                          <label key={sc.id} className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setNewTargetSchoolIds((prev) =>
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

              {/* Submit Buttons */}
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
                  Assign Homework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
