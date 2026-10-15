import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import {
  SyllabusScheme,
  SyllabusTermType,
  SyllabusScopeType,
} from '../../types/models';
import { SyllabusSchemeEditorModal } from './SyllabusSchemeEditorModal';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Users,
  Building2,
  Calendar,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  Share2,
  Zap,
} from 'lucide-react';

const TERM_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Terms' },
  { id: 'half_yearly', label: 'Half Yearly' },
  { id: 'first_term', label: '1st Term' },
  { id: 'second_term', label: '2nd Term' },
  { id: 'pre_test', label: 'Pre-Test' },
  { id: 'test_exam', label: 'Test Exam' },
  { id: 'final_board', label: 'Board Final' },
  { id: 'custom', label: 'Custom' },
];

export const SyllabusManagerView: React.FC = () => {
  const {
    syllabusSchemes,
    batches,
    schools,
    students,
    saveSyllabusScheme,
    deleteSyllabusScheme,
    applySchemeToStudentSyllabi,
  } = useData();

  const { confirm, alert } = useModal();

  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [selectedTermFilter, setSelectedTermFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  // Modal State
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [schemeToEdit, setSchemeToEdit] = useState<SyllabusScheme | null>(null);

  // Filter schemes
  const filteredSchemes = syllabusSchemes.filter((scheme) => {
    if (selectedBatchId !== 'all' && scheme.targetBatchId !== selectedBatchId) {
      return false;
    }
    if (selectedTermFilter !== 'all' && scheme.termType !== selectedTermFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = scheme.title.toLowerCase().includes(q);
      const matchTopic = scheme.topics.some((t) => t.title.toLowerCase().includes(q));
      const matchDesc = scheme.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchTopic && !matchDesc) return false;
    }
    return true;
  });

  // Aggregate Stats
  const totalSchemes = syllabusSchemes.length;
  const totalTopics = syllabusSchemes.reduce((acc, s) => acc + s.topics.length, 0);
  const totalCompletedTopics = syllabusSchemes.reduce(
    (acc, s) => acc + s.topics.filter((t) => t.status === 'completed').length,
    0
  );
  const totalRevisionTopics = syllabusSchemes.reduce(
    (acc, s) => acc + s.topics.filter((t) => t.status === 'revision_needed').length,
    0
  );
  const overallCompletionRate = totalTopics > 0 ? Math.round((totalCompletedTopics / totalTopics) * 100) : 0;

  // Handlers
  const handleOpenCreate = () => {
    setSchemeToEdit(null);
    setIsEditorModalOpen(true);
  };

  const handleOpenEdit = (scheme: SyllabusScheme) => {
    setSchemeToEdit(scheme);
    setIsEditorModalOpen(true);
  };

  const handleDeleteScheme = async (scheme: SyllabusScheme) => {
    const ok = await confirm({
      title: 'Delete Syllabus Scheme?',
      message: `Are you sure you want to delete "${scheme.title}"? This cannot be undone.`,
      confirmText: 'Delete Scheme',
      variant: 'danger',
    });
    if (!ok) return;

    await deleteSyllabusScheme(scheme.id);
  };

  const handleApplyScheme = async (scheme: SyllabusScheme) => {
    await applySchemeToStudentSyllabi(scheme);
    await alert({
      title: 'Syllabus Synced Successfully!',
      message: `Topics from "${scheme.title}" have been updated in individual student tracking records and will reflect on student performance radars.`,
    });
  };

  const handleCloneScheme = async (scheme: SyllabusScheme) => {
    const clonedScheme: SyllabusScheme = {
      ...scheme,
      id: `scheme-${Date.now().toString(36)}`,
      title: `${scheme.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveSyllabusScheme(clonedScheme);
  };

  const handleTopicStatusCycle = async (
    scheme: SyllabusScheme,
    topicId: string,
    currentStatus: string
  ) => {
    const cycleMap: Record<string, 'not_started' | 'in_progress' | 'completed' | 'revision_needed'> = {
      not_started: 'in_progress',
      in_progress: 'completed',
      completed: 'revision_needed',
      revision_needed: 'not_started',
    };
    const nextStatus = cycleMap[currentStatus] || 'not_started';

    const updatedTopics = scheme.topics.map((t) =>
      t.id === topicId ? { ...t, status: nextStatus, lastTaughtDate: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : t.lastTaughtDate } : t
    );

    const updatedScheme: SyllabusScheme = {
      ...scheme,
      topics: updatedTopics,
      updatedAt: Date.now(),
    };
    await saveSyllabusScheme(updatedScheme);
  };

  const getTermBadge = (termType: SyllabusTermType) => {
    switch (termType) {
      case 'half_yearly':
        return { label: 'Half Yearly', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
      case 'first_term':
        return { label: '1st Term', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' };
      case 'second_term':
        return { label: '2nd Term', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' };
      case 'pre_test':
        return { label: 'Pre-Test', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' };
      case 'test_exam':
        return { label: 'Test Exam', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' };
      case 'final_board':
        return { label: 'Board Final', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' };
      default:
        return { label: 'Custom Term', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <BookOpen className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Syllabus Management System
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build term syllabi (Half Yearly, 1st Term, Pre-Test, Custom) scoped to batches, specific schools, or individual students.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Syllabus Scheme</span>
          </button>
        </div>
      </div>

      {/* Top Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Syllabus Schemes
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {totalSchemes}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Topics
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {totalTopics}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Taught / Covered
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {overallCompletionRate}%
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Needs Revision
            </span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400">
              {totalRevisionTopics}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Batch Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Batch:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.classLevel})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search syllabus by title, topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Term Chips Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {TERM_FILTERS.map((tf) => {
            const isSelected = selectedTermFilter === tf.id;
            return (
              <button
                key={tf.id}
                onClick={() => setSelectedTermFilter(tf.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                {tf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schemes List */}
      {filteredSchemes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Syllabus Schemes Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No syllabi match your search query.'
              : 'Create your first syllabus scheme or adjust the term and batch filters above.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Syllabus Scheme</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSchemes.map((scheme) => {
            const batch = batches.find((b) => b.id === scheme.targetBatchId);
            const termBadge = getTermBadge(scheme.termType);

            // Calculate progress
            const completedCount = scheme.topics.filter((t) => t.status === 'completed').length;
            const inProgressCount = scheme.topics.filter((t) => t.status === 'in_progress').length;
            const revisionCount = scheme.topics.filter((t) => t.status === 'revision_needed').length;
            const notStartedCount = scheme.topics.filter((t) => t.status === 'not_started').length;
            const total = scheme.topics.length || 1;

            const completedPct = Math.round((completedCount / total) * 100);
            const inProgressPct = Math.round((inProgressCount / total) * 100);
            const revisionPct = Math.round((revisionCount / total) * 100);

            const totalMarks = scheme.topics.reduce((acc, t) => acc + (t.weightageMarks || 0), 0);
            const completedMarks = scheme.topics
              .filter((t) => t.status === 'completed')
              .reduce((acc, t) => acc + (t.weightageMarks || 0), 0);

            const isExpanded = expandedSchemeId === scheme.id;

            // Target schools list if scoped
            const targetSchools = schools.filter((s) => scheme.targetSchoolIds?.includes(s.id));
            const targetStudents = students.filter((s) => scheme.targetStudentIds?.includes(s.id));

            return (
              <div
                key={scheme.id}
                className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-all hover:border-emerald-500/30 space-y-4"
              >
                {/* Top Row: Term Badge, Scope, Batch, and Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${termBadge.color}`}
                    >
                      {termBadge.label}
                    </span>

                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {batch?.name || 'General Batch'}
                    </span>

                    {/* Scope Badge */}
                    {scheme.scopeType === 'batch_wide' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>Batch-wide (All Students)</span>
                      </span>
                    )}

                    {scheme.scopeType === 'batch_and_schools' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>{targetSchools.length} School(s) Only</span>
                      </span>
                    )}

                    {scheme.scopeType === 'batch_and_students' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{targetStudents.length} Customized Student(s)</span>
                      </span>
                    )}

                    {scheme.academicYear && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Session: {scheme.academicYear}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* 1-Click Sync to Students */}
                    <button
                      onClick={() => handleApplyScheme(scheme)}
                      title="Sync this syllabus into matching students individual report trackers"
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 text-xs font-bold transition-colors flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sync to Students</span>
                    </button>

                    <button
                      onClick={() => handleCloneScheme(scheme)}
                      title="Duplicate Scheme"
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(scheme)}
                      title="Edit Syllabus"
                      className="p-1.5 text-slate-400 hover:text-light-indigo dark:hover:text-spiro-disco-ball hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteScheme(scheme)}
                      title="Delete Syllabus"
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Scheme Title & Details */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{scheme.title}</span>
                  </h3>
                  {scheme.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {scheme.description}
                    </p>
                  )}
                </div>

                {/* Scope specific info chips (e.g. Notre Dame, Holy Cross) */}
                {scheme.scopeType === 'batch_and_schools' && targetSchools.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                    <span className="text-[11px] font-bold text-slate-400">Target Colleges:</span>
                    {targetSchools.map((sch) => (
                      <span
                        key={sch.id}
                        className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-[10px] border border-blue-200 dark:border-blue-900"
                      >
                        {sch.name}
                      </span>
                    ))}
                  </div>
                )}

                {scheme.scopeType === 'batch_and_students' && targetStudents.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                    <span className="text-[11px] font-bold text-slate-400">Customized for:</span>
                    {targetStudents.slice(0, 5).map((stu) => (
                      <span
                        key={stu.id}
                        className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-[10px] border border-purple-200 dark:border-purple-900"
                      >
                        {stu.name} ({stu.publicRollNo})
                      </span>
                    ))}
                    {targetStudents.length > 5 && (
                      <span className="text-[10px] text-slate-400 font-bold">
                        +{targetStudents.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                {/* Progress Bar & Summary */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {completedPct}% Completed
                      </span>
                      <span className="text-slate-400">
                        • {completedMarks} / {totalMarks} Marks
                      </span>
                      {revisionCount > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{revisionCount} Need Revision</span>
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 dark:text-slate-400">
                      {completedCount} / {scheme.topics.length} Topics
                    </span>
                  </div>

                  {/* Multi-segment Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                    <div
                      style={{ width: `${completedPct}%` }}
                      className="h-full bg-emerald-500 transition-all duration-500"
                      title={`Completed: ${completedCount}`}
                    />
                    <div
                      style={{ width: `${inProgressPct}%` }}
                      className="h-full bg-blue-500 transition-all duration-500"
                      title={`In Progress: ${inProgressCount}`}
                    />
                    <div
                      style={{ width: `${revisionPct}%` }}
                      className="h-full bg-rose-500 transition-all duration-500"
                      title={`Needs Revision: ${revisionCount}`}
                    />
                  </div>
                </div>

                {/* Toggle Topics Table Accordion */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1"
                  >
                    <span>
                      {isExpanded ? 'Hide Topic Details' : `Show All ${scheme.topics.length} Topics (Tap status to cycle)`}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* Detailed Topics Table */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                      {scheme.topics.map((topic, tIdx) => (
                        <div
                          key={topic.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <span className="w-5 h-5 rounded-md bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-500">
                              {tIdx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {topic.title}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                                    topic.priority === 'high'
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                      : topic.priority === 'medium'
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                      : 'bg-slate-500/10 text-slate-500'
                                  }`}
                                >
                                  {topic.priority}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  {topic.weightageMarks || 5} Marks
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {topic.unitTitle} {topic.targetDate && `• Target: ${topic.targetDate}`}
                                {topic.lastTaughtDate && ` • Last Taught: ${topic.lastTaughtDate}`}
                              </span>
                            </div>
                          </div>

                          {/* Interactive Status Pill Button (Tap to cycle status) */}
                          <button
                            type="button"
                            onClick={() => handleTopicStatusCycle(scheme, topic.id, topic.status)}
                            title="Click to cycle status: Not Started -> In Progress -> Completed -> Needs Revision"
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 shadow-2xs ${
                              topic.status === 'completed'
                                ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                                : topic.status === 'in_progress'
                                ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'
                                : topic.status === 'revision_needed'
                                ? 'bg-rose-500 text-white border-rose-600 hover:bg-rose-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {topic.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {topic.status === 'in_progress' && <Clock className="w-3.5 h-3.5" />}
                            {topic.status === 'revision_needed' && <AlertTriangle className="w-3.5 h-3.5" />}
                            <span>
                              {topic.status === 'completed'
                                ? 'Completed'
                                : topic.status === 'in_progress'
                                ? 'In Progress'
                                : topic.status === 'revision_needed'
                                ? 'Needs Revision'
                                : 'Not Started'}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      <SyllabusSchemeEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        schemeToEdit={schemeToEdit}
        defaultBatchId={selectedBatchId !== 'all' ? selectedBatchId : batches[0]?.id}
      />
    </div>
  );
};
