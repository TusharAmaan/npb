import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import {
  SyllabusScheme,
  SyllabusSchemeTopic,
  SyllabusTermType,
  SyllabusScopeType,
  TopicPriority,
} from '../../types/models';
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  Sparkles,
  Layers,
  GraduationCap,
  Users,
  Building2,
  Calendar,
  Check,
  Award,
} from 'lucide-react';

interface SyllabusSchemeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemeToEdit: SyllabusScheme | null;
  defaultBatchId?: string;
}

const TERM_OPTIONS: { id: SyllabusTermType; label: string; badgeColor: string }[] = [
  { id: 'half_yearly', label: 'Half Yearly Syllabus', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { id: 'first_term', label: '1st Term Exam Syllabus', badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { id: 'second_term', label: '2nd Term Exam Syllabus', badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  { id: 'pre_test', label: 'Pre-Test Board Syllabus', badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { id: 'test_exam', label: 'Test Exam Syllabus', badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  { id: 'final_board', label: 'Final Board Exam Syllabus', badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  { id: 'custom', label: 'Custom Term / Model Test', badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
];

export const SyllabusSchemeEditorModal: React.FC<SyllabusSchemeEditorModalProps> = ({
  isOpen,
  onClose,
  schemeToEdit,
  defaultBatchId,
}) => {
  const { batches, schools, students, saveSyllabusScheme, applySchemeToStudentSyllabi } = useData();

  const [title, setTitle] = useState('');
  const [termType, setTermType] = useState<SyllabusTermType>('half_yearly');
  const [scopeType, setScopeType] = useState<SyllabusScopeType>('batch_wide');
  const [targetBatchId, setTargetBatchId] = useState(defaultBatchId || batches[0]?.id || '');
  const [targetSchoolIds, setTargetSchoolIds] = useState<string[]>([]);
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([]);
  const [academicYear, setAcademicYear] = useState('2025–2026');
  const [description, setDescription] = useState('');
  const [topics, setTopics] = useState<SyllabusSchemeTopic[]>([]);
  const [autoApplyToStudents, setAutoApplyToStudents] = useState(true);

  // Quick topic input form
  const [newUnitTitle, setNewUnitTitle] = useState('Unit 1: Grammar Core');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TopicPriority>('high');
  const [newWeightage, setNewWeightage] = useState<number>(5);
  const [newTargetDate, setNewTargetDate] = useState('');

  // Student search within selected batch
  const [studentSearch, setStudentSearch] = useState('');

  // Active batch students
  const batchStudents = students.filter(
    (s) => s.isActive && s.batchIds?.includes(targetBatchId)
  );

  useEffect(() => {
    if (schemeToEdit) {
      setTitle(schemeToEdit.title);
      setTermType(schemeToEdit.termType);
      setScopeType(schemeToEdit.scopeType);
      setTargetBatchId(schemeToEdit.targetBatchId);
      setTargetSchoolIds(schemeToEdit.targetSchoolIds || []);
      setTargetStudentIds(schemeToEdit.targetStudentIds || []);
      setAcademicYear(schemeToEdit.academicYear || '2025–2026');
      setDescription(schemeToEdit.description || '');
      setTopics(schemeToEdit.topics || []);
    } else {
      setTitle('');
      setTermType('half_yearly');
      setScopeType('batch_wide');
      setTargetBatchId(defaultBatchId || batches[0]?.id || '');
      setTargetSchoolIds([]);
      setTargetStudentIds([]);
      setAcademicYear('2025–2026');
      setDescription('');
      // Default initial topics
      setTopics([
        {
          id: `st-${Date.now()}-1`,
          unitTitle: 'Unit 1: Grammar Core',
          title: 'Modifiers (Pre & Post Modifiers)',
          priority: 'high',
          weightageMarks: 5,
          status: 'not_started',
        },
        {
          id: `st-${Date.now()}-2`,
          unitTitle: 'Unit 1: Grammar Core',
          title: 'Narration (Direct & Indirect Speech)',
          priority: 'high',
          weightageMarks: 5,
          status: 'not_started',
        },
        {
          id: `st-${Date.now()}-3`,
          unitTitle: 'Unit 2: Guided Writing',
          title: 'Formal Letter & Official Application',
          priority: 'high',
          weightageMarks: 8,
          status: 'not_started',
        },
      ]);
    }
  }, [schemeToEdit, defaultBatchId, isOpen]);

  if (!isOpen) return null;

  const handleAddTopic = () => {
    if (!newTopicTitle.trim()) return;
    const newTopic: SyllabusSchemeTopic = {
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      unitTitle: newUnitTitle.trim() || 'General Unit',
      title: newTopicTitle.trim(),
      priority: newPriority,
      weightageMarks: Number(newWeightage) || 5,
      status: 'not_started',
      targetDate: newTargetDate || undefined,
    };
    setTopics((prev) => [...prev, newTopic]);
    setNewTopicTitle('');
  };

  const handleRemoveTopic = (topicId: string) => {
    setTopics((prev) => prev.filter((t) => t.id !== topicId));
  };

  const handleUpdateTopicField = (
    topicId: string,
    field: keyof SyllabusSchemeTopic,
    val: any
  ) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, [field]: val } : t))
    );
  };

  const handleToggleSchool = (schoolId: string) => {
    setTargetSchoolIds((prev) =>
      prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId]
    );
  };

  const handleToggleStudent = (studentId: string) => {
    setTargetStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleImportHscPreset = () => {
    const hscTopics: SyllabusSchemeTopic[] = [
      { id: `st-${Date.now()}-1`, unitTitle: 'Unit 1: Grammar Core', title: 'Modifiers (Pre & Post Modifiers)', priority: 'high', weightageMarks: 5, status: 'not_started' },
      { id: `st-${Date.now()}-2`, unitTitle: 'Unit 1: Grammar Core', title: 'Narration & Speech Transformation', priority: 'high', weightageMarks: 5, status: 'not_started' },
      { id: `st-${Date.now()}-3`, unitTitle: 'Unit 1: Grammar Core', title: 'Right Form of Verbs & Subject-Verb Agreement', priority: 'high', weightageMarks: 7, status: 'not_started' },
      { id: `st-${Date.now()}-4`, unitTitle: 'Unit 1: Grammar Core', title: 'Special Phrases (was born, would rather, had better)', priority: 'medium', weightageMarks: 5, status: 'not_started' },
      { id: `st-${Date.now()}-5`, unitTitle: 'Unit 1: Grammar Core', title: 'Sentence Connectors & Linkers', priority: 'medium', weightageMarks: 5, status: 'not_started' },
      { id: `st-${Date.now()}-6`, unitTitle: 'Unit 1: Grammar Core', title: 'Synonyms and Antonyms', priority: 'medium', weightageMarks: 5, status: 'not_started' },
      { id: `st-${Date.now()}-7`, unitTitle: 'Unit 1: Grammar Core', title: 'Punctuation & Capitalization', priority: 'low', weightageMarks: 5, status: 'not_started' },
      { id: `st-${Date.now()}-8`, unitTitle: 'Unit 2: Guided Writing', title: 'Formal Letter / Application Writing', priority: 'high', weightageMarks: 8, status: 'not_started' },
      { id: `st-${Date.now()}-9`, unitTitle: 'Unit 2: Guided Writing', title: 'Report Writing (Newspaper / Investigation)', priority: 'high', weightageMarks: 8, status: 'not_started' },
      { id: `st-${Date.now()}-10`, unitTitle: 'Unit 2: Guided Writing', title: 'Paragraph Writing (Cause & Effect / Comparison)', priority: 'high', weightageMarks: 10, status: 'not_started' },
      { id: `st-${Date.now()}-11`, unitTitle: 'Unit 3: Board Practice', title: 'Dhaka Board 2024 Past Question Mastery', priority: 'high', weightageMarks: 15, status: 'not_started' },
    ];
    setTopics(hscTopics);
  };

  const handleImportSscPreset = () => {
    const sscTopics: SyllabusSchemeTopic[] = [
      { id: `st-ssc-${Date.now()}-1`, unitTitle: 'Unit 1: SSC Grammar', title: 'Transformation of Sentences (Voice, Degree, Structure)', priority: 'high', weightageMarks: 5, status: 'not_started' },
      { id: `st-ssc-${Date.now()}-2`, unitTitle: 'Unit 1: SSC Grammar', title: 'Tag Questions & Suffix-Prefix', priority: 'high', weightageMarks: 10, status: 'not_started' },
      { id: `st-ssc-${Date.now()}-3`, unitTitle: 'Unit 1: SSC Grammar', title: 'Right Form of Verbs', priority: 'high', weightageMarks: 5, status: 'not_started' },
      { id: `st-ssc-${Date.now()}-4`, unitTitle: 'Unit 1: SSC Grammar', title: 'Punctuation & Capitalization', priority: 'medium', weightageMarks: 5, status: 'not_started' },
      { id: `st-ssc-${Date.now()}-5`, unitTitle: 'Unit 2: SSC Composition', title: 'CV with Cover Letter Writing', priority: 'high', weightageMarks: 8, status: 'not_started' },
      { id: `st-ssc-${Date.now()}-6`, unitTitle: 'Unit 2: SSC Composition', title: 'Formal Letter & Complaint Notice', priority: 'medium', weightageMarks: 8, status: 'not_started' },
      { id: `st-ssc-${Date.now()}-7`, unitTitle: 'Unit 2: SSC Composition', title: 'Descriptive Paragraph Writing', priority: 'high', weightageMarks: 10, status: 'not_started' },
    ];
    setTopics(sscTopics);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetBatchId) return;

    const schemeId = schemeToEdit?.id || `scheme-${Date.now().toString(36)}`;
    const schemeObj: SyllabusScheme = {
      id: schemeId,
      title: title.trim(),
      termType,
      scopeType,
      targetBatchId,
      targetSchoolIds: scopeType === 'batch_and_schools' ? targetSchoolIds : undefined,
      targetStudentIds: scopeType === 'batch_and_students' ? targetStudentIds : undefined,
      academicYear,
      description: description.trim() || undefined,
      topics,
      createdAt: schemeToEdit?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await saveSyllabusScheme(schemeObj);

    if (autoApplyToStudents) {
      await applySchemeToStudentSyllabi(schemeObj);
    }

    onClose();
  };

  const totalMarks = topics.reduce((acc, t) => acc + (Number(t.weightageMarks) || 0), 0);
  const selectedBatch = batches.find((b) => b.id === targetBatchId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full my-auto flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {schemeToEdit ? 'Edit Syllabus Scheme' : 'Create New Syllabus Scheme'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure term syllabus, marks weightages, and customize audience scope.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Section 1: Identity & Term */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Step 1: Scheme Identity & Term</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Syllabus Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. HSC 2026 Half Yearly English 2nd Paper Syllabus"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Term / Examination Type *
                </label>
                <select
                  value={termType}
                  onChange={(e) => setTermType(e.target.value as SyllabusTermType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {TERM_OPTIONS.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Academic Session / Year
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="e.g. 2025–2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description / Teacher Note
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context, reference textbook units, or special guidelines for this syllabus..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 2: Target Audience & Scoping (User Requirement: batch, batch+school, batch+students) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Step 2: Audience Scoping & Customization</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Batch *
                </label>
                <select
                  value={targetBatchId}
                  onChange={(e) => {
                    setTargetBatchId(e.target.value);
                    setTargetStudentIds([]);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.classLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Audience Scope Type *
                </label>
                <select
                  value={scopeType}
                  onChange={(e) => setScopeType(e.target.value as SyllabusScopeType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="batch_wide">Entire Batch (All Students)</option>
                  <option value="batch_and_schools">Specific Schools / Colleges Only</option>
                  <option value="batch_and_students">Specific Students Only (Customized 1-on-1)</option>
                </select>
              </div>
            </div>

            {/* If Batch & Schools Selected: Multi-School Picker */}
            {scopeType === 'batch_and_schools' && (
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span>Select Institutions in this Batch:</span>
                  </span>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {targetSchoolIds.length} Selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {schools.map((school) => {
                    const isSelected = targetSchoolIds.includes(school.id);
                    return (
                      <button
                        key={school.id}
                        type="button"
                        onClick={() => handleToggleSchool(school.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{school.name}</span>
                        <span className="text-[10px] opacity-70">({school.shortCode})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If Batch & Students Selected: Multi-Student Picker */}
            {scopeType === 'batch_and_students' && (
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span>Select Specific Students ({batchStudents.length} enrolled in batch):</span>
                  </span>
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                    {targetStudentIds.length} Selected
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Filter students by name or roll..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-dark-surface text-xs"
                />

                <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                  {batchStudents
                    .filter(
                      (stu) =>
                        stu.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        stu.publicRollNo.toLowerCase().includes(studentSearch.toLowerCase())
                    )
                    .map((stu) => {
                      const isSelected = targetStudentIds.includes(stu.id);
                      return (
                        <div
                          key={stu.id}
                          onClick={() => handleToggleStudent(stu.id)}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-[10px]">
                              {stu.name[0]}
                            </div>
                            <span className="font-bold">{stu.name}</span>
                            <span className="text-[10px] opacity-75 font-mono">({stu.publicRollNo})</span>
                          </div>
                          <span className="text-[10px] opacity-80">{stu.schoolName}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 3: Topic & Unit Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Step 3: Syllabus Units & Topics ({topics.length} Topics • {totalMarks} Total Marks)</span>
              </div>

              {/* 1-Click Master Presets */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleImportHscPreset}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Import HSC Preset</span>
                </button>
                <button
                  type="button"
                  onClick={handleImportSscPreset}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Import SSC Preset</span>
                </button>
              </div>
            </div>

            {/* Quick Add Topic Bar */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Add New Topic:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={newUnitTitle}
                    onChange={(e) => setNewUnitTitle(e.target.value)}
                    placeholder="Unit (e.g. Unit 1: Grammar Core)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="Topic Name (e.g. Modifiers, Narration)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center gap-2">
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TopicPriority)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface text-xs"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Med Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span>Marks:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newWeightage}
                      onChange={(e) => setNewWeightage(Number(e.target.value))}
                      className="w-14 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface text-xs font-bold text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span>Target Date:</span>
                    <input
                      type="date"
                      value={newTargetDate}
                      onChange={(e) => setNewTargetDate(e.target.value)}
                      className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface text-xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddTopic}
                  disabled={!newTopicTitle.trim()}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Topic</span>
                </button>
              </div>
            </div>

            {/* List of Current Topics grouped by Unit */}
            <div className="space-y-2">
              {topics.map((top, idx) => (
                <div
                  key={top.id}
                  className="p-3 rounded-xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-500">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {top.title}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                            top.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : top.priority === 'medium'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {top.priority}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                          {top.weightageMarks || 5} Marks
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {top.unitTitle} {top.targetDate && `• Target: ${top.targetDate}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Pill Switcher */}
                    <select
                      value={top.status}
                      onChange={(e) =>
                        handleUpdateTopicField(top.id, 'status', e.target.value)
                      }
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${
                        top.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : top.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                          : top.status === 'revision_needed'
                          ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="revision_needed">Needs Revision</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(top.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Sync Checkbox */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
            <input
              type="checkbox"
              id="autoApply"
              checked={autoApplyToStudents}
              onChange={(e) => setAutoApplyToStudents(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="autoApply" className="text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                Automatically Sync Scheme to Matching Students' Trackers
              </span>
              Updates all targeted students ({selectedBatch?.name}) so this syllabus appears on their individual performance radar and report cards.
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || topics.length === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{schemeToEdit ? 'Save Changes' : 'Create Syllabus Scheme'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
