import React, { useState, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { useModal } from '../../../context/ModalContext';
import {
  OnlineExam,
  OnlineExamLinkMode,
  PassageSection,
  PassageGap,
  McqQuestion,
  McqOption,
  ExamSubmission,
} from '../../../types/models';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Users,
  Award,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Layers,
  Calendar,
  X,
  HelpCircle,
  RefreshCw,
  Eye,
  Sliders,
  BookOpen,
} from 'lucide-react';

// Robust helper to get the student-facing public exam URL
// Correctly includes repository subpath on GitHub Pages (e.g. /NPB/) as well as localhost
export function getExamPublicUrl(examCode: string): string {
  const origin = window.location.origin;
  const pathname = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '');
  const base = `${origin}${pathname}`;
  return `${base}/#/exam/${encodeURIComponent(examCode.trim())}`;
}

export const OnlineExamManager: React.FC = () => {
  const {
    batches,
    students,
    onlineExams,
    examSubmissions,
    saveOnlineExam,
    deleteOnlineExam,
    regradePassageGap,
    syncOnlineExamToBatchMarks,
  } = useData();

  const { confirm, alert } = useModal();

  // Active View Tab: 'exams' | 'submissions'
  const [activeTab, setActiveTab] = useState<'exams' | 'submissions'>('exams');
  const [selectedExamId, setSelectedExamId] = useState<string>(onlineExams[0]?.id || '');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [syncingExamId, setSyncingExamId] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('all');

  // Submissions review modal
  const [inspectSubmission, setInspectSubmission] = useState<ExamSubmission | null>(null);
  const [regradingScore, setRegradingScore] = useState<number>(0);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState<string>('');
  const [formSubject, setFormSubject] = useState<string>('English 1st Paper');
  const [formCode, setFormCode] = useState<string>('');
  const [formBatchIds, setFormBatchIds] = useState<string[]>([batches[0]?.id || '']);
  const [formDescription, setFormDescription] = useState<string>('');
  const [formLinkMode, setFormLinkMode] = useState<OnlineExamLinkMode>('permanent');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formDurationMinutes, setFormDurationMinutes] = useState<number>(20);
  const [formTabSwitchPenalty, setFormTabSwitchPenalty] = useState<
    'warn_and_record' | 'auto_submit' | 'reset_exam'
  >('warn_and_record');
  const [formAttemptLimit, setFormAttemptLimit] = useState<number>(1);
  const [formShowScore, setFormShowScore] = useState<boolean>(true);
  const [formShowSolutions, setFormShowSolutions] = useState<boolean>(true);
  const [formPassMarks, setFormPassMarks] = useState<number>(10);

  // Form Content: Passages & MCQs (both completely optional and deletable)
  const [formPassages, setFormPassages] = useState<PassageSection[]>([]);
  const [formMcqs, setFormMcqs] = useState<McqQuestion[]>([]);

  // Helpers to add & preset question types
  const handleAddPassage = () => {
    const newP: PassageSection = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `Question ${formPassages.length + 1}: Fill in the blanks with suitable words`,
      instructions: 'Read the passage below and fill in each numbered blank with an appropriate word.',
      passageType: 'with_clues',
      clues: ['nature', 'pollute', 'aware', 'preserve', 'threat', 'extinct', 'environment', 'future'],
      hasFormChange: false,
      directPlacementFeedback: false,
      passageText:
        'Man lives in a (a) _____ environment. Rapid urbanization causes (b) _____ of water and air. We must raise (c) _____ among students. Many rare birds face (d) _____. Trees help to (e) _____ ecological balance.',
      gaps: [
        { id: 'a', gapLabel: '(a)', acceptedAnswers: ['natural', 'nature'], marks: 1 },
        { id: 'b', gapLabel: '(b)', acceptedAnswers: ['pollution'], marks: 1 },
        { id: 'c', gapLabel: '(c)', acceptedAnswers: ['awareness'], marks: 1 },
        { id: 'd', gapLabel: '(d)', acceptedAnswers: ['extinction'], marks: 1 },
        { id: 'e', gapLabel: '(e)', acceptedAnswers: ['preserve'], marks: 1 },
      ],
    };
    setFormPassages((prev) => [...prev, newP]);
  };

  const handleAddMcq = () => {
    const newQ: McqQuestion = {
      id: `mcq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      question: `Question ${formMcqs.length + 1}: `,
      options: [
        { id: 'opt-1', label: 'A', text: 'Option A' },
        { id: 'opt-2', label: 'B', text: 'Option B' },
        { id: 'opt-3', label: 'C', text: 'Option C' },
        { id: 'opt-4', label: 'D', text: 'Option D' },
      ],
      correctOptionIds: ['opt-1'],
      allowMultiple: false,
      marks: 1,
    };
    setFormMcqs((prev) => [...prev, newQ]);
  };

  const handleSetPresetAllMcq = () => {
    setFormPassages([]);
    if (formMcqs.length === 0) {
      setFormMcqs([
        {
          id: `mcq-${Date.now()}-1`,
          question: 'MCQ Question 1: ',
          options: [
            { id: 'opt-1', label: 'A', text: 'Option A' },
            { id: 'opt-2', label: 'B', text: 'Option B' },
            { id: 'opt-3', label: 'C', text: 'Option C' },
            { id: 'opt-4', label: 'D', text: 'Option D' },
          ],
          correctOptionIds: ['opt-1'],
          allowMultiple: false,
          marks: 1,
        },
      ]);
    }
  };

  const handleSetPresetAllPassage = () => {
    setFormMcqs([]);
    if (formPassages.length === 0) {
      handleAddPassage();
    }
  };

  const handleClearAllPassages = () => {
    setFormPassages([]);
  };

  const handleClearAllMcqs = () => {
    setFormMcqs([]);
  };

  // Active Selected Exam for Submissions Tab
  const activeExam = useMemo(() => {
    return onlineExams.find((e) => e.id === selectedExamId) || onlineExams[0];
  }, [onlineExams, selectedExamId]);

  // Filtered Exams
  const filteredExams = useMemo(() => {
    return onlineExams.filter((exam) => {
      const matchSearch =
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.examCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const matchBatch =
        batchFilter === 'all' || exam.batchIds.includes(batchFilter);

      return matchSearch && matchBatch;
    });
  }, [onlineExams, searchQuery, batchFilter]);

  // Submissions for Active Exam
  const examSubmissionsList = useMemo(() => {
    if (!activeExam) return [];
    return examSubmissions
      .filter((s) => s.examId === activeExam.id)
      .sort((a, b) => b.totalMarksObtained - a.totalMarksObtained);
  }, [examSubmissions, activeExam]);

  // Open Create Modal with clean defaults (defaulting to pure MCQ preset so tutor is never forced into passages)
  const handleOpenCreateModal = () => {
    setEditingExamId(null);
    setFormTitle('');
    setFormSubject('English 1st Paper');
    setFormCode(`EXAM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    setFormBatchIds([batches[0]?.id || '']);
    setFormDescription('');
    setFormLinkMode('permanent');
    setFormIsActive(true);
    setFormStartDate('');
    setFormEndDate('');
    setFormDurationMinutes(20);
    setFormTabSwitchPenalty('warn_and_record');
    setFormAttemptLimit(1);
    setFormShowScore(true);
    setFormShowSolutions(true);
    setFormPassMarks(5);
    // Start with 1 MCQ and 0 passages (no mandatory passage!)
    setFormPassages([]);
    setFormMcqs([
      {
        id: `mcq-${Date.now()}-1`,
        question: 'MCQ Question 1: ',
        options: [
          { id: 'opt-1', label: 'A', text: 'Option A' },
          { id: 'opt-2', label: 'B', text: 'Option B' },
          { id: 'opt-3', label: 'C', text: 'Option C' },
          { id: 'opt-4', label: 'D', text: 'Option D' },
        ],
        correctOptionIds: ['opt-1'],
        allowMultiple: false,
        marks: 1,
      },
    ]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (exam: OnlineExam) => {
    setEditingExamId(exam.id);
    setFormTitle(exam.title);
    setFormSubject(exam.subject);
    setFormCode(exam.examCode);
    setFormBatchIds(exam.batchIds);
    setFormDescription(exam.description || '');
    setFormLinkMode(exam.linkMode);
    setFormIsActive(exam.isActive);
    setFormStartDate(exam.startDate || '');
    setFormEndDate(exam.endDate || '');
    setFormDurationMinutes(exam.durationMinutes);
    setFormTabSwitchPenalty(exam.tabSwitchPenalty);
    setFormAttemptLimit(exam.attemptLimit);
    setFormShowScore(exam.showScoreImmediately);
    setFormShowSolutions(exam.showSolutionsImmediately);
    setFormPassMarks(exam.passMarks);
    setFormPassages(JSON.parse(JSON.stringify(exam.passages || [])));
    setFormMcqs(JSON.parse(JSON.stringify(exam.mcqs || [])));
    setIsModalOpen(true);
  };

  // Save Exam Form
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCode.trim()) {
      await alert({
        title: 'Missing Required Fields',
        message: 'Please provide both an Exam Title and a Short Exam Code.',
        variant: 'warning',
      });
      return;
    }

    // Validate that at least one question (either an MCQ or a Passage) is present
    if (formPassages.length === 0 && formMcqs.length === 0) {
      await alert({
        title: 'No Questions Added',
        message: 'Please add at least one question (either an MCQ or a Fill in the Blanks passage) to save the exam.',
        variant: 'warning',
      });
      return;
    }

    // Calculate total marks
    const passageMarks = formPassages.reduce(
      (acc, p) => acc + p.gaps.reduce((gAcc, g) => gAcc + (g.marks || 1), 0),
      0
    );
    const mcqMarks = formMcqs.reduce((acc, q) => acc + (q.marks || 1), 0);
    const calculatedTotal = passageMarks + mcqMarks;

    const examToSave: OnlineExam = {
      id: editingExamId || `online-exam-${Date.now().toString(36)}`,
      examCode: formCode.trim().toUpperCase(),
      title: formTitle.trim(),
      subject: formSubject.trim(),
      batchIds: formBatchIds,
      description: formDescription.trim() || undefined,
      linkMode: formLinkMode,
      isActive: formIsActive,
      startDate: formStartDate || undefined,
      endDate: formEndDate || undefined,
      durationMinutes: Number(formDurationMinutes) || 0,
      tabSwitchPenalty: formTabSwitchPenalty,
      attemptLimit: formAttemptLimit,
      showScoreImmediately: formShowScore,
      showSolutionsImmediately: formShowSolutions,
      passages: formPassages,
      mcqs: formMcqs,
      totalMarks: calculatedTotal,
      passMarks: Number(formPassMarks) || Math.round(calculatedTotal * 0.4),
      createdAt: editingExamId
        ? onlineExams.find((e) => e.id === editingExamId)?.createdAt || Date.now()
        : Date.now(),
      updatedAt: Date.now(),
    };

    await saveOnlineExam(examToSave);
    setIsModalOpen(false);
  };

  // Delete Exam
  const handleDeleteExam = async (examId: string, title: string) => {
    const ok = await confirm({
      title: 'Delete Online Exam',
      message: `Are you sure you want to delete "${title}"? All submissions associated with this link will remain in records.`,
      confirmText: 'Delete Exam',
      variant: 'danger',
    });
    if (ok) {
      await deleteOnlineExam(examId);
    }
  };

  // Copy Direct Link
  const handleCopyLink = (exam: OnlineExam) => {
    const url = getExamPublicUrl(exam.examCode);
    navigator.clipboard.writeText(url);
    setCopiedLink(exam.id);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Copy 1-Click WhatsApp Invite
  const handleCopyWhatsAppInvite = (exam: OnlineExam) => {
    const url = getExamPublicUrl(exam.examCode);
    const batchNames = batches
      .filter((b) => exam.batchIds.includes(b.id))
      .map((b) => b.name)
      .join(', ');

    const text = `📢 *ONLINE EXAM NOTICE — NOBO PROTTASHAY BATCH (NPB)*
🏛️ *Batch:* ${batchNames || 'All Batches'}
📝 *Exam:* ${exam.title}
📚 *Subject:* ${exam.subject}
🎯 *Total Marks:* ${exam.totalMarks} Marks (Pass: ${exam.passMarks} Marks)
⏱️ *Time Limit:* ${exam.durationMinutes > 0 ? `${exam.durationMinutes} Minutes (Auto-submits on 00:00)` : 'Untimed'}

🔒 *Exam Rules & Security:*
• Enter your full name & mobile number to start
• ⚠️ *Warning:* Switching between tabs, minimizing, or leaving the page will be monitored & recorded!
• (সতর্কতা: পরীক্ষার সময় অন্য কোনো ট্যাব ওপেন করলে বা মিনিমাইজ করলে পরীক্ষা বাতিল/রিসেট হয়ে যেতে পারে)

👉 *Direct Exam Link:*
${url}

_Best of luck with your preparation!_`;

    navigator.clipboard.writeText(text);
    setCopiedLink(`wa-${exam.id}`);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Sync to Batch Exam Records
  const handleSyncToBatchRecords = async (examId: string) => {
    setSyncingExamId(examId);
    try {
      const count = await syncOnlineExamToBatchMarks(examId);
      await alert({
        title: 'Batch Records Synchronized',
        message: `Successfully synchronized ${count} student marks into your offline batch exam records and student report cards!`,
        variant: 'info',
      });
    } finally {
      setSyncingExamId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Online Exam Creator & Live Submissions
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create MCQ & Fill in the Blanks exams (with or without clues), generate short shareable links, and monitor live submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Online Exam</span>
          </button>
        </div>
      </div>

      {/* Main Tabs (Exams List vs Live Submissions) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-dark-border pb-1">
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'exams'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Exams & Links ({onlineExams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'submissions'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Live Submissions & Scores ({examSubmissions.length})</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          TAB 1: EXAMS LIST & SHAREABLE LINKS
         ------------------------------------------------------------- */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          {/* Controls: Search & Batch Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
            <div className="flex-1 max-w-sm relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exam by title or code..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-400">Batch:</label>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exams Grid */}
          {filteredExams.length === 0 ? (
            <div className="bg-white dark:bg-dark-surface p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No online exams created yet.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Exam</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExams.map((exam) => {
                const subCount = examSubmissions.filter((s) => s.examId === exam.id).length;
                const examUrl = getExamPublicUrl(exam.examCode);

                return (
                  <div
                    key={exam.id}
                    className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border p-5 shadow-xs hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          {exam.examCode}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              exam.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-slate-100 text-slate-500 border-slate-300'
                            }`}
                          >
                            {exam.isActive ? 'Active Link' : 'Closed'}
                          </span>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {exam.linkMode === 'permanent' ? 'Permanent' : 'Temporary'}
                          </span>
                        </div>
                      </div>

                      {/* Title & Subject */}
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-2">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {exam.subject} • {exam.durationMinutes > 0 ? `${exam.durationMinutes} Mins` : 'Untimed'}
                      </p>

                      {/* Content Summary */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-dark-border flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                        <span>
                          <strong>{exam.totalMarks}</strong> Marks
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{exam.passages.length}</strong> Passage{exam.passages.length === 1 ? '' : 's'}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{exam.mcqs.length}</strong> MCQ{exam.mcqs.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-dark-border space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-bold flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{subCount} Submissions</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedExamId(exam.id);
                              setActiveTab('submissions');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                          >
                            View Scores
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(exam)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded"
                            title="Edit Exam"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteExam(exam.id, exam.title)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                            title="Delete Exam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Direct Clickable URL Display */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ExternalLink className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate select-all">
                            {examUrl}
                          </span>
                        </div>
                        <a
                          href={examUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
                        >
                          Open View ↗
                        </a>
                      </div>

                      {/* Share Controls Strip */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopyWhatsAppInvite(exam)}
                          className="flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center justify-center gap-1.5 transition-colors"
                          title="Copy Complete WhatsApp Announcement to Clipboard"
                        >
                          {copiedLink === `wa-${exam.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied Notice!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>WhatsApp Notice</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(exam)}
                          className="py-2 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 transition-colors shadow-2xs"
                          title="Copy Direct Link to Clipboard"
                        >
                          {copiedLink === exam.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <a
                          href={examUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3.5 rounded-xl text-xs font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 flex items-center gap-1.5 shadow-2xs shrink-0 transition-all"
                          title="Open and preview the student exam portal in a new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Exam ↗</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: SUBMISSIONS & LIVE LEADERBOARD
         ------------------------------------------------------------- */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {/* Controls Strip: Select Exam & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
            <div className="flex-1 max-w-md">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Selected Online Exam:
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {onlineExams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({e.examCode})
                  </option>
                ))}
              </select>
            </div>

            {activeExam && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSyncToBatchRecords(activeExam.id)}
                  disabled={syncingExamId === activeExam.id || examSubmissionsList.length === 0}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-weird-green hover:bg-wintergreen text-slate-950 shadow-md shadow-weird-green/20 flex items-center gap-2 disabled:opacity-50"
                  title="Push these online scores directly into the batch's offline exam report card"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${syncingExamId === activeExam.id ? 'animate-spin' : ''}`}
                  />
                  <span>Sync to Batch Exam Marks</span>
                </button>
              </div>
            )}
          </div>

          {/* Submissions Table */}
          {examSubmissionsList.length === 0 ? (
            <div className="bg-white dark:bg-dark-surface p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No student submissions recorded for this exam yet.
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Share the exam link or WhatsApp notice with your batch students to start collecting submissions.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="p-3.5 pl-4">Rank</th>
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5">Mobile Phone</th>
                      <th className="p-3.5">Score</th>
                      <th className="p-3.5">Percentage</th>
                      <th className="p-3.5">Tab Switches</th>
                      <th className="p-3.5">Time Spent</th>
                      <th className="p-3.5">Submitted</th>
                      <th className="p-3.5 pr-4 text-right">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {examSubmissionsList.map((sub, idx) => {
                      const mins = Math.floor(sub.timeSpentSeconds / 60);
                      const secs = sub.timeSpentSeconds % 60;

                      return (
                        <tr
                          key={sub.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-3.5 pl-4 font-black">
                            <span
                              className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] ${
                                idx === 0
                                  ? 'bg-amber-500 text-slate-950 font-black'
                                  : idx === 1
                                  ? 'bg-slate-300 text-slate-900 font-bold'
                                  : idx === 2
                                  ? 'bg-amber-700 text-white font-bold'
                                  : 'text-slate-400'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {sub.studentName}
                            {sub.studentClass && (
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {sub.studentClass}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                            {sub.studentMobile}
                          </td>
                          <td className="p-3.5 font-black text-slate-900 dark:text-white">
                            <span className="text-emerald-600 dark:text-wintergreen">
                              {sub.totalMarksObtained}
                            </span>{' '}
                            / {sub.totalPossibleMarks}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                                sub.percentage >= 70
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-wintergreen'
                                  : sub.percentage >= 50
                                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              }`}
                            >
                              {sub.percentage}%
                            </span>
                          </td>
                          <td className="p-3.5 font-bold">
                            {sub.tabSwitchCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-red-600 dark:text-light-red">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>{sub.tabSwitchCount} switch{sub.tabSwitchCount > 1 ? 'es' : ''}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-500 font-mono">
                            {mins}m {secs}s
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {new Date(sub.submittedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-3.5 pr-4 text-right">
                            <button
                              onClick={() => setInspectSubmission(sub)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect Sheet</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: INSPECT SUBMISSION & MANUAL REGRADE
         ------------------------------------------------------------- */}
      {inspectSubmission && activeExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-dark-border shadow-2xl p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 block">
                  Answer Sheet Inspection
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {inspectSubmission.studentName} ({inspectSubmission.studentMobile})
                </h3>
              </div>
              <button
                onClick={() => setInspectSubmission(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Strip */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold">Total Score:</span>
                <div className="text-xl font-black text-emerald-600 dark:text-wintergreen">
                  {inspectSubmission.totalMarksObtained} / {inspectSubmission.totalPossibleMarks}{' '}
                  ({inspectSubmission.percentage}%)
                </div>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400 font-bold block">Integrity Monitor:</span>
                <span
                  className={
                    inspectSubmission.tabSwitchCount > 0
                      ? 'text-red-600 font-bold'
                      : 'text-slate-500 font-medium'
                  }
                >
                  {inspectSubmission.tabSwitchCount} tab switch(es)
                </span>
              </div>
            </div>

            {/* Passages Gap Inspection */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400">
                Passages (Fill in the Blanks) Responses:
              </h4>

              {activeExam.passages.map((p) => {
                const pSub = inspectSubmission.passageSubmissions?.[p.id];

                return (
                  <div key={p.id} className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {p.title}
                    </span>

                    <div className="space-y-2">
                      {p.gaps.map((g) => {
                        const gapAns = pSub?.answers?.[g.id];
                        const isCorrect = gapAns?.isCorrect;

                        return (
                          <div
                            key={g.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                              isCorrect
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300/80'
                                : 'bg-red-50/60 dark:bg-red-950/20 border-red-300/80'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                Gap {g.gapLabel}:
                              </span>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                Student Answer:{' '}
                                <strong className={isCorrect ? 'text-emerald-700' : 'text-red-600'}>
                                  &quot;{gapAns?.studentAnswer || '(Empty)'}&quot;
                                </strong>
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Accepted: {g.acceptedAnswers.join(' / ')}
                              </p>
                            </div>

                            {/* Tutor Regrade Option */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <label className="text-[10px] text-slate-400 font-bold">Marks:</label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max={g.marks}
                                defaultValue={gapAns?.marksObtained || 0}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val)) {
                                    regradePassageGap(inspectSubmission.id, p.id, g.id, val);
                                  }
                                }}
                                className="w-14 px-2 py-1 rounded-md text-xs font-bold border border-slate-300 dark:border-slate-700 text-center"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-dark-border text-right">
              <button
                onClick={() => setInspectSubmission(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              >
                Close Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: CREATE / EDIT ONLINE EXAM
         ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-3xl w-full max-w-3xl border border-slate-200 dark:border-dark-border shadow-2xl p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {editingExamId ? 'Edit Online Exam' : 'Create New Online Exam'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-6">
              {/* General Metadata */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Exam Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. SSC English 1st: Passage Fill in Blanks & Grammar MCQ"
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Short Exam Code *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const code = `EXAM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                          setFormCode(code);
                        }}
                        className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        ⚡ Generate Code
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.replace(/\s+/g, '-').toUpperCase())}
                      placeholder="e.g. ENG-SSC-01"
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono"
                    />

                    {/* Live Student URL Preview in modal */}
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block uppercase">
                          Student Exam Link Preview:
                        </span>
                        <code className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 truncate block select-all">
                          {getExamPublicUrl(formCode.trim() || 'EXAM-CODE')}
                        </code>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            if (formCode.trim()) {
                              navigator.clipboard.writeText(getExamPublicUrl(formCode.trim()));
                            }
                          }}
                          disabled={!formCode.trim()}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-slate-950 hover:bg-amber-600 disabled:opacity-40"
                        >
                          Copy Link
                        </button>
                        <a
                          href={getExamPublicUrl(formCode.trim() || 'TEST')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 inline-flex items-center gap-1"
                        >
                          <span>Test View ↗</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subject / Topic
                    </label>
                    <input
                      type="text"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Batch
                    </label>
                    <select
                      value={formBatchIds[0]}
                      onChange={(e) => setFormBatchIds([e.target.value])}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Time Limit (Minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formDurationMinutes}
                      onChange={(e) => setFormDurationMinutes(parseInt(e.target.value) || 0)}
                      placeholder="0 for untimed"
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Link Mode & Security Policies */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 block">
                  Link Mode & Anti-Cheat Rules
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Link Type
                    </label>
                    <select
                      value={formLinkMode}
                      onChange={(e) => setFormLinkMode(e.target.value as OnlineExamLinkMode)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                    >
                      <option value="permanent">Permanent (Always Active)</option>
                      <option value="temporary">Temporary (Window Deadline)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Tab Switch Action
                    </label>
                    <select
                      value={formTabSwitchPenalty}
                      onChange={(e) => setFormTabSwitchPenalty(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                    >
                      <option value="warn_and_record">Warn & Record Count</option>
                      <option value="auto_submit">Auto-Submit Exam Immediately</option>
                      <option value="reset_exam">Reset Answers to Start Again</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Status
                    </label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="rounded text-amber-500"
                      />
                      <span>Active Link (Accepting Submissions)</span>
                    </label>
                  </div>
                </div>

                {formLinkMode === 'temporary' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Opens At:
                      </label>
                      <input
                        type="datetime-local"
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Closes At (Deadline):
                      </label>
                      <input
                        type="datetime-local"
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* QUICK QUESTION FORMAT PRESETS */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border border-slate-200 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    <span>Question Format Presets:</span>
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Switch exam format in 1-click or add/remove questions freely below
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSetPresetAllMcq}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      formPassages.length === 0 && formMcqs.length > 0
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    🎯 All-MCQ Exam ({formMcqs.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleSetPresetAllPassage}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      formPassages.length > 0 && formMcqs.length === 0
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    📝 All-Passage Exam ({formPassages.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (formPassages.length === 0) handleAddPassage();
                      if (formMcqs.length === 0) handleAddMcq();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      formPassages.length > 0 && formMcqs.length > 0
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    ⚡ Hybrid (Passages + MCQs)
                  </button>
                </div>
              </div>

              {/* PASSAGE SECTIONS BUILDER */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Fill in the Blanks Passages ({formPassages.length})
                    </h4>
                    {formPassages.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        (Optional — delete all if you want pure MCQ)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {formPassages.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllPassages}
                        className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline"
                      >
                        Delete All Passages
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddPassage}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Passage</span>
                    </button>
                  </div>
                </div>

                {formPassages.length === 0 ? (
                  <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      No passage questions in this exam. (Pure MCQ mode is active)
                    </p>
                    <button
                      type="button"
                      onClick={handleAddPassage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Passage (Fill in the Blanks)</span>
                    </button>
                  </div>
                ) : (
                  formPassages.map((p, pIdx) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-amber-600 shrink-0">Passage {pIdx + 1}:</span>
                        <input
                          type="text"
                          value={p.title}
                          onChange={(e) => {
                            const updated = [...formPassages];
                            updated[pIdx].title = e.target.value;
                            setFormPassages(updated);
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                        />

                        {/* ALWAYS ALLOW DELETING ANY PASSAGE */}
                        <button
                          type="button"
                          onClick={() => setFormPassages(formPassages.filter((_, i) => i !== pIdx))}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Delete this passage"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Clue Box Style
                          </label>
                          <select
                            value={p.passageType}
                            onChange={(e) => {
                              const updated = [...formPassages];
                              updated[pIdx].passageType = e.target.value as any;
                              setFormPassages(updated);
                            }}
                            className="w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                          >
                            <option value="with_clues">With Clues (Top Word Box)</option>
                            <option value="without_clues">Without Clues (Grammar / Direct)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Word Form Changes
                          </label>
                          <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={p.hasFormChange}
                              onChange={(e) => {
                                const updated = [...formPassages];
                                updated[pIdx].hasFormChange = e.target.checked;
                                setFormPassages(updated);
                              }}
                              className="rounded text-amber-500"
                            />
                            <span>Requires form changes (e.g. nature → natural)</span>
                          </label>
                        </div>
                      </div>

                      {p.passageType === 'with_clues' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Clue Words (Comma separated):
                          </label>
                          <input
                            type="text"
                            value={p.clues.join(', ')}
                            onChange={(e) => {
                              const updated = [...formPassages];
                              updated[pIdx].clues = e.target.value
                                .split(',')
                                .map((w) => w.trim())
                                .filter(Boolean);
                              setFormPassages(updated);
                            }}
                            placeholder="e.g. nature, pollute, aware, preserve, threat, extinct..."
                            className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Passage Text (Use (a) _____, (b) _____ for blanks):
                        </label>
                        <textarea
                          rows={3}
                          value={p.passageText}
                          onChange={(e) => {
                            const updated = [...formPassages];
                            updated[pIdx].passageText = e.target.value;
                            setFormPassages(updated);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                        />
                      </div>

                      {/* Dynamic Gaps List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400 uppercase">
                            Answer Keys for Gaps ({p.gaps.length}):
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...formPassages];
                              const nextChar = String.fromCharCode(97 + updated[pIdx].gaps.length);
                              updated[pIdx].gaps.push({
                                id: nextChar,
                                gapLabel: `(${nextChar})`,
                                acceptedAnswers: ['answer'],
                                marks: 1,
                              });
                              setFormPassages(updated);
                            }}
                            className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            + Add Gap ({String.fromCharCode(97 + p.gaps.length)})
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {p.gaps.map((g, gIdx) => (
                            <div
                              key={g.id}
                              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface flex items-center justify-between gap-2"
                            >
                              <span className="font-bold text-amber-600 text-xs shrink-0">
                                {g.gapLabel}
                              </span>
                              <input
                                type="text"
                                value={g.acceptedAnswers.join(' / ')}
                                onChange={(e) => {
                                  const updated = [...formPassages];
                                  updated[pIdx].gaps[gIdx].acceptedAnswers = e.target.value
                                    .split('/')
                                    .map((a) => a.trim())
                                    .filter(Boolean);
                                  setFormPassages(updated);
                                }}
                                placeholder="Accepted (e.g. natural / naturally)"
                                className="flex-1 px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700"
                              />
                              {p.gaps.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...formPassages];
                                    updated[pIdx].gaps = updated[pIdx].gaps.filter((_, i) => i !== gIdx);
                                    setFormPassages(updated);
                                  }}
                                  className="text-slate-400 hover:text-red-500"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* MCQ BUILDER */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Multiple Choice Questions ({formMcqs.length})
                    </h4>
                    {formMcqs.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        (Optional — delete all if you want pure Passage exam)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {formMcqs.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllMcqs}
                        className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline"
                      >
                        Delete All MCQs
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddMcq}
                      className="text-[11px] font-bold text-sky-600 dark:text-spiro-disco-ball hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add MCQ</span>
                    </button>
                  </div>
                </div>

                {formMcqs.length === 0 ? (
                  <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      No MCQ questions in this exam. (Pure Passage mode is active)
                    </p>
                    <button
                      type="button"
                      onClick={handleAddMcq}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 hover:bg-sky-500/25 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add MCQ Question</span>
                    </button>
                  </div>
                ) : (
                  formMcqs.map((q, qIdx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-xs text-sky-600 shrink-0">Q{qIdx + 1}:</span>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...formMcqs];
                            updated[qIdx].question = e.target.value;
                            setFormMcqs(updated);
                          }}
                          placeholder="Type question here..."
                          className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                        />

                        {/* ALWAYS ALLOW DELETING ANY MCQ */}
                        <button
                          type="button"
                          onClick={() => setFormMcqs(formMcqs.filter((_, i) => i !== qIdx))}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Delete this question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={q.allowMultiple}
                            onChange={(e) => {
                              const updated = [...formMcqs];
                              updated[qIdx].allowMultiple = e.target.checked;
                              setFormMcqs(updated);
                            }}
                            className="rounded text-sky-500"
                          />
                          <span>Allow multiple correct answers</span>
                        </label>

                        <div className="flex items-center gap-1.5">
                          <label className="text-slate-400 font-bold">Marks:</label>
                          <input
                            type="number"
                            min="1"
                            value={q.marks}
                            onChange={(e) => {
                              const updated = [...formMcqs];
                              updated[qIdx].marks = parseInt(e.target.value) || 1;
                              setFormMcqs(updated);
                            }}
                            className="w-14 px-2 py-1 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700 text-center"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={opt.id}
                            className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={q.correctOptionIds.includes(opt.id)}
                              onChange={(e) => {
                                const updated = [...formMcqs];
                                if (e.target.checked) {
                                  updated[qIdx].correctOptionIds = q.allowMultiple
                                    ? [...q.correctOptionIds, opt.id]
                                    : [opt.id];
                                } else {
                                  updated[qIdx].correctOptionIds = q.correctOptionIds.filter(
                                    (id) => id !== opt.id
                                  );
                                }
                                setFormMcqs(updated);
                              }}
                              title="Mark as correct answer"
                              className="rounded text-emerald-500"
                            />
                            <span className="text-xs font-black shrink-0">{opt.label}:</span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const updated = [...formMcqs];
                                updated[qIdx].options[oIdx].text = e.target.value;
                                setFormMcqs(updated);
                              }}
                              className="flex-1 px-2 py-0.5 rounded text-xs border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) => {
                            const updated = [...formMcqs];
                            updated[qIdx].explanation = e.target.value;
                            setFormMcqs(updated);
                          }}
                          placeholder="Optional explanation / solution hint..."
                          className="w-full px-2.5 py-1 rounded-lg text-[11px] italic border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm"
                >
                  {editingExamId ? 'Save Changes' : 'Create Exam & Generate Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
