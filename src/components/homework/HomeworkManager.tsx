import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Homework,
  HomeworkStatus,
  HomeworkSubmission,
} from '../../types/models';
import { WhatsAppTemplates } from '../../lib/whatsappTemplates';
import {
  BookOpenCheck,
  Plus,
  Trash2,
  Share2,
  Calendar,
  Check,
  Sparkles,
  Percent,
  X,
  MessageSquare,
  Users,
} from 'lucide-react';

export const HomeworkManager: React.FC = () => {
  const { batches, students, schools, homeworks, saveHomework, deleteHomework, saveHomeworkSubmission } =
    useData();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [selectedHwId, setSelectedHwId] = useState<string>(homeworks[0]?.id || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // New Homework Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newRelatedTopic, setNewRelatedTopic] = useState('');
  const [newDueDate, setNewDueDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [newTargetType, setNewTargetType] = useState<
    'whole_batch' | 'specific_schools' | 'specific_students'
  >('whole_batch');
  const [newTargetSchoolIds, setNewTargetSchoolIds] = useState<string[]>([]);
  const [newGradingMode, setNewGradingMode] = useState<'status_only' | 'status_and_marks'>(
    'status_only'
  );
  const [newMaxMarks, setNewMaxMarks] = useState<number>(10);

  // Active Batch Homeworks
  const batchHomeworks = homeworks.filter((h) => h.batchId === selectedBatchId);
  const activeHomework =
    batchHomeworks.find((h) => h.id === selectedHwId) || batchHomeworks[0] || homeworks[0];

  // Active Batch Students
  const activeBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];
  const eligibleStudents = students.filter((s) => {
    if (!s.isActive || !s.batchIds?.includes(selectedBatchId)) return false;
    if (!activeHomework) return true;
    if (activeHomework.targetType === 'specific_schools') {
      return activeHomework.targetSchoolIds?.includes(s.schoolId);
    }
    if (activeHomework.targetType === 'specific_students') {
      return activeHomework.targetStudentIds?.includes(s.id);
    }
    return true;
  });

  // Handle Create HW
  const handleCreateHw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const hwId = `hw-${Date.now().toString(36)}`;
    const newHw: Homework = {
      id: hwId,
      batchId: selectedBatchId,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      relatedTopics: newRelatedTopic
        ? newRelatedTopic.split(',').map((t) => t.trim())
        : [],
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: newDueDate,
      targetType: newTargetType,
      targetSchoolIds: newTargetSchoolIds,
      gradingMode: newGradingMode,
      maxMarks: newGradingMode === 'status_and_marks' ? Number(newMaxMarks) : undefined,
      submissions: {},
      createdAt: Date.now(),
    };

    await saveHomework(newHw);
    setSelectedHwId(hwId);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDesc('');
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

  // 1-Click WhatsApp Defaulter Summary Copy
  const handleCopyDefaulterSummary = () => {
    if (!activeHomework) return;

    const defaulters: string[] = [];
    let doneCount = 0;

    eligibleStudents.forEach((stu) => {
      const sub = activeHomework.submissions?.[stu.id];
      if (sub && sub.status === 'done') {
        doneCount++;
      } else {
        defaulters.push(`${stu.name} (${stu.publicRollNo}) - ${sub?.status || 'not submitted'}`);
      }
    });

    const summaryText = WhatsAppTemplates.homeworkDefaulterSummary(
      activeBatch.name,
      activeHomework.dueDate,
      defaulters,
      doneCount,
      eligibleStudents.length
    );

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow">
              <BookOpenCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Dual-Mode Homework Tracker
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assign exercises to entire batch, specific schools, or individual students with instant status & marks grading.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-md shadow-light-indigo/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Assign New Homework</span>
        </button>
      </div>

      {/* Batch and Assignment Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Select Batch */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Filter by Batch
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => {
              setSelectedBatchId(e.target.value);
              const firstHw = homeworks.find((h) => h.batchId === e.target.value);
              if (firstHw) setSelectedHwId(firstHw.id);
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

        {/* Select Assignment */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Active Homework Task ({batchHomeworks.length} assigned)
          </label>
          <select
            value={activeHomework?.id || ''}
            onChange={(e) => setSelectedHwId(e.target.value)}
            disabled={batchHomeworks.length === 0}
            className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
          >
            {batchHomeworks.length === 0 ? (
              <option value="">No homework created for this batch</option>
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

      {/* Active Assignment Card & WhatsApp Defaulter Button */}
      {activeHomework && (
        <div className="bg-gradient-to-r from-radiant-yellow/10 via-white to-white dark:from-radiant-yellow/15 dark:via-dark-surface dark:to-dark-surface p-5 rounded-2xl border border-radiant-yellow/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow">
                {activeHomework.gradingMode === 'status_and_marks'
                  ? `Status + Marks (Max: ${activeHomework.maxMarks})`
                  : 'Status Buttons Only'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Due: {activeHomework.dueDate}
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Target: {activeHomework.targetType.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {activeHomework.title}
            </h2>
            {activeHomework.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {activeHomework.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 1-Click WhatsApp Defaulter Summary Copy */}
            <button
              onClick={handleCopyDefaulterSummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen shadow-sm transition-transform active:scale-95"
            >
              {copiedSummary ? <Check className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              <span>{copiedSummary ? 'Copied to Clipboard!' : 'Copy WhatsApp Defaulter Log'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Checking Grid Table */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Submission & Fast Checking Grid ({eligibleStudents.length} Students)
          </h3>
          <span className="text-xs text-slate-400">100% Done • 75% Late • 50% Partial • 0% Not Done</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-dark-border">
          {eligibleStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No students eligible for this homework task.
            </div>
          ) : (
            eligibleStudents.map((stu) => {
              const sub = activeHomework?.submissions?.[stu.id] || {
                studentId: stu.id,
                status: 'pending',
              };

              return (
                <div
                  key={stu.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Student info */}
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-xs px-2 py-1 rounded-md bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow min-w-[50px] text-center">
                      {stu.publicRollNo}
                    </span>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">
                        {stu.name}
                      </span>
                      <span className="text-xs text-slate-400">{stu.schoolName}</span>
                    </div>
                  </div>

                  {/* Submission controls */}
                  <div className="flex items-center gap-3">
                    {/* Optional Numeric Marks input if enabled */}
                    {activeHomework?.gradingMode === 'status_and_marks' && (
                      <div className="flex items-center gap-1.5 text-xs font-bold">
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

                    {/* Status Button Pills */}
                    <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 gap-1 text-xs">
                      {/* Done */}
                      <button
                        onClick={() => handleUpdateStatus(stu.id, 'done')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          sub.status === 'done'
                            ? 'bg-weird-green text-slate-950 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Done
                      </button>

                      {/* Incomplete / Partial */}
                      <button
                        onClick={() => handleUpdateStatus(stu.id, 'incomplete')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          sub.status === 'incomplete'
                            ? 'bg-radiant-yellow text-slate-950 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Partial
                      </button>

                      {/* Late */}
                      <button
                        onClick={() => handleUpdateStatus(stu.id, 'late')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          sub.status === 'late'
                            ? 'bg-spiro-disco-ball text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Late
                      </button>

                      {/* Not Done */}
                      <button
                        onClick={() => handleUpdateStatus(stu.id, 'not_done')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          sub.status === 'not_done'
                            ? 'bg-light-red text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Not Done
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Homework Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-lg border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-border">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Assign New Homework
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHw} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
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
                  placeholder="e.g. Write clean answers in HW copy with question numbers."
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

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
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Grading Mode
                  </label>
                  <select
                    value={newGradingMode}
                    onChange={(e) => setNewGradingMode(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="status_only">Status Buttons Only</option>
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
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Scope
                </label>
                <select
                  value={newTargetType}
                  onChange={(e) => setNewTargetType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="whole_batch">Whole Batch</option>
                  <option value="specific_schools">Specific Schools inside Batch</option>
                  <option value="specific_students">Specific Students</option>
                </select>
              </div>

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
