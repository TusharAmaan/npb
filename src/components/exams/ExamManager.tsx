import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import { Exam, ExamSection } from '../../types/models';
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
  Edit2,
} from 'lucide-react';

export const ExamManager: React.FC = () => {
  const { batches, students, schools, exams, syllabi, saveExam, deleteExam } = useData();
  const { confirm } = useModal();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [activeMarksExam, setActiveMarksExam] = useState<Exam | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Exam Form
  const [newTitle, setNewTitle] = useState('');
  const [newExamDate, setNewExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('16:00');
  const [newScopeType, setNewScopeType] = useState<
    'batch_wide' | 'school_specific' | 'student_specific'
  >('batch_wide');
  const [newTargetSchoolIds, setNewTargetSchoolIds] = useState<string[]>([]);
  const [newPassMarks, setNewPassMarks] = useState(15);
  const [newAbsentPolicy, setNewAbsentPolicy] = useState<
    'exclude_from_avg' | 'count_as_zero' | 'exclude_avg_but_zero_leaderboard'
  >('exclude_from_avg');

  // Initial sections for new exam
  const [newSections, setNewSections] = useState<ExamSection[]>([
    {
      id: 'sec-1',
      name: 'Part A: Grammar Focus',
      category: 'Grammar',
      linkedTopicTitles: [],
      maxMarks: 15,
    },
    {
      id: 'sec-2',
      name: 'Part B: Writing Part',
      category: 'Writing',
      linkedTopicTitles: [],
      maxMarks: 15,
    },
  ]);

  // Active batch exams
  const batchExams = exams.filter((e) => e.batchId === selectedBatchId);
  const activeBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  // Topics available in this batch
  const availableTopics = Array.from(
    new Set(
      students
        .filter((s) => s.isActive && s.batchIds?.includes(selectedBatchId))
        .flatMap((s) => syllabi[s.id]?.topics?.map((t) => t.title) || [])
    )
  );

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
      scopeType: newScopeType,
      targetSchoolIds: newTargetSchoolIds,
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

  if (activeMarksExam) {
    return (
      <ExamMarksEntry
        exam={activeMarksExam}
        students={students}
        onBack={() => setActiveMarksExam(null)}
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
              Exams & Section-Wise Diagnostics
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build section breakdowns, link syllabus topics, configure absent handling, and record student marks.
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

      {/* Batch Selector */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          Filter by Batch
        </label>
        <select
          value={selectedBatchId}
          onChange={(e) => setSelectedBatchId(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.courseTag})
            </option>
          ))}
        </select>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {batchExams.length === 0 ? (
          <div className="md:col-span-2 bg-white dark:bg-dark-surface p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No exams scheduled or conducted for this batch yet.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click "+ Create New Exam" above to schedule a model test or assessment.
            </p>
          </div>
        ) : (
          batchExams.map((ex) => {
            const resultsCount = Object.keys(ex.results || {}).length;

            return (
              <div
                key={ex.id}
                className="bg-white dark:bg-dark-surface rounded-2xl p-5 border border-slate-200/80 dark:border-dark-border shadow-xs hover:border-light-indigo/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        ex.status === 'completed'
                          ? 'bg-weird-green/20 text-emerald-800 dark:text-wintergreen'
                          : 'bg-spiro-disco-ball/20 text-sky-800 dark:text-spiro-disco-ball'
                      }`}
                    >
                      {ex.status === 'completed' ? 'Completed & Evaluated' : 'Scheduled'}
                    </span>

                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {ex.examDate}
                    </span>
                  </div>

                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                    {ex.title}
                  </h2>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Total Max: <strong>{ex.totalMaxMarks}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Pass: <strong>{ex.passMarks}</strong>
                    </span>
                    <span>•</span>
                    <span>{ex.sections.length} Sections</span>
                  </div>

                  {/* Section Pills */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {ex.sections.map((sec) => (
                      <span
                        key={sec.id}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        {sec.name} ({sec.maxMarks})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
                  <button
                    onClick={() => setActiveMarksExam(ex)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Enter / Review Marks ({resultsCount})</span>
                  </button>

                  <button
                    onClick={() => handleDelete(ex.id, ex.title)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
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
                  Section-wise paper design with linked syllabus topics
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
