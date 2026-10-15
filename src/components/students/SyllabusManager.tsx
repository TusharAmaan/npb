import React, { useState } from 'react';
import {
  Student,
  StudentSyllabus,
  StudentSyllabusTopic,
  SyllabusTopicStatus,
} from '../../types/models';
import { useData } from '../../context/DataContext';
import {
  Plus,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarClock,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface SyllabusManagerProps {
  student: Student;
}

const STATUS_CONFIG: Record<
  SyllabusTopicStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  not_started: {
    label: 'Not Started',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-spiro-disco-ball/15',
    text: 'text-sky-700 dark:text-spiro-disco-ball',
    border: 'border-spiro-disco-ball/30',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-weird-green/15',
    text: 'text-emerald-700 dark:text-wintergreen',
    border: 'border-weird-green/30',
  },
  revision_needed: {
    label: 'Revision Needed',
    bg: 'bg-radiant-yellow/15',
    text: 'text-amber-700 dark:text-radiant-yellow',
    border: 'border-radiant-yellow/30',
  },
  missed_pending_makeup: {
    label: 'Missed / Makeup Needed',
    bg: 'bg-light-red/15',
    text: 'text-red-700 dark:text-light-red',
    border: 'border-light-red/30',
  },
};

export const SyllabusManager: React.FC<SyllabusManagerProps> = ({ student }) => {
  const { syllabi, students, saveStudentSyllabus, cloneSyllabus } = useData();

  const studentSyllabus = syllabi[student.id] || {
    studentId: student.id,
    updatedAt: Date.now(),
    topics: [],
  };

  const topics = studentSyllabus.topics || [];

  // Bulk Quick-Add state
  const [bulkCategory, setBulkCategory] = useState('Grammar Mastery');
  const [bulkTopicsText, setBulkTopicsText] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Clone state
  const [cloneSourceId, setCloneSourceId] = useState('');

  // Group topics by category
  const categories = Array.from(new Set(topics.map((t) => t.category || 'General Topics')));

  // Add bulk topics
  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTopicsText.trim()) return;

    // Split by comma or newline
    const rawList = bulkTopicsText
      .split(/[,\n]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const newTopics: StudentSyllabusTopic[] = rawList.map((title) => ({
      id: `top-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      category: bulkCategory.trim() || 'General Topics',
      title,
      status: 'not_started',
      missedSessionIds: [],
    }));

    await saveStudentSyllabus(student.id, [...topics, ...newTopics]);
    setBulkTopicsText('');
    setIsBulkOpen(false);
  };

  // Change individual topic status
  const handleStatusChange = async (topicId: string, newStatus: SyllabusTopicStatus) => {
    const updated = topics.map((t) => {
      if (t.id !== topicId) return t;
      return {
        ...t,
        status: newStatus,
        completedDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : t.completedDate,
      };
    });
    await saveStudentSyllabus(student.id, updated);
  };

  // Delete topic
  const handleDeleteTopic = async (topicId: string) => {
    const updated = topics.filter((t) => t.id !== topicId);
    await saveStudentSyllabus(student.id, updated);
  };

  // Clone from classmate
  const handleClone = async () => {
    if (!cloneSourceId) return;
    const sourceStudent = students.find((s) => s.id === cloneSourceId);
    if (
      confirm(
        `Clone complete syllabus structure from ${sourceStudent?.name}? This will duplicate topics and reset their statuses for ${student.name}.`
      )
    ) {
      await cloneSyllabus(cloneSourceId, student.id);
      setCloneSourceId('');
    }
  };

  // Classmate options (same school or same batches)
  const classmateOptions = students.filter(
    (s) =>
      s.id !== student.id &&
      (s.schoolId === student.schoolId || s.batchIds?.some((b) => student.batchIds?.includes(b)))
  );

  return (
    <div className="space-y-5">
      {/* Action Header: Bulk Add & Clone from Classmate */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-bright-lilac" />
            <span>Individual Academic Syllabus</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tailored 2-level syllabus ({topics.length} topics) customized for {student.name}'s school standards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Clone from Classmate */}
          {classmateOptions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                value={cloneSourceId}
                onChange={(e) => setCloneSourceId(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none max-w-[160px] truncate"
              >
                <option value="">Clone from Classmate...</option>
                {classmateOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.schoolName.substring(0, 10)})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!cloneSourceId}
                onClick={handleClone}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-bright-lilac/20 text-purple-900 dark:text-bright-lilac hover:bg-bright-lilac/30 disabled:opacity-40 transition-all border border-bright-lilac/30"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Clone</span>
              </button>
            </div>
          )}

          {/* Bulk Quick-Add Button */}
          <button
            type="button"
            onClick={() => setIsBulkOpen(!isBulkOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Bulk Quick-Add Topics</span>
          </button>
        </div>
      </div>

      {/* Bulk Quick-Add Drawer */}
      {isBulkOpen && (
        <form
          onSubmit={handleBulkAdd}
          className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-light-indigo/30 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-light-indigo dark:text-spiro-disco-ball">
              Quick Bulk Topic Onboarding (Paste comma or newline separated items)
            </span>
            <button
              type="button"
              onClick={() => setIsBulkOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Category / Term
              </label>
              <input
                type="text"
                required
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                placeholder="e.g. Midterm Grammar, 1st Paper, Writing"
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Topics (Comma or newline separated)
              </label>
              <textarea
                required
                rows={2}
                value={bulkTopicsText}
                onChange={(e) => setBulkTopicsText(e.target.value)}
                placeholder="e.g. Modifiers, Narration, Sentence Connectors, Completing Sentences"
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm"
            >
              Add Topics in 1 Second
            </button>
          </div>
        </form>
      )}

      {/* Topics Display by Category */}
      {topics.length === 0 ? (
        <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No syllabus topics assigned yet for {student.name}.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Click "+ Bulk Quick-Add Topics" above or "Clone from Classmate" to load their syllabus in 1 second.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const catTopics = topics.filter((t) => (t.category || 'General Topics') === cat);
            const completedCount = catTopics.filter((t) => t.status === 'completed').length;
            const progressPct = Math.round((completedCount / catTopics.length) * 100);

            return (
              <div
                key={cat}
                className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border p-4 shadow-xs"
              >
                {/* Category Header with Progress bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-bold text-light-indigo dark:text-spiro-disco-ball uppercase tracking-wider">
                      Category
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {cat}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-weird-green h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {completedCount}/{catTopics.length} ({progressPct}%)
                    </span>
                  </div>
                </div>

                {/* Topics Table */}
                <div className="divide-y divide-slate-100 dark:divide-dark-border">
                  {catTopics.map((topic) => {
                    const statusStyle = STATUS_CONFIG[topic.status] || STATUS_CONFIG.not_started;

                    return (
                      <div
                        key={topic.id}
                        className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {topic.title}
                          </span>

                          {/* Exam Mastery Pill if available */}
                          {topic.examMasteryAvg !== undefined && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                topic.examMasteryAvg >= 80
                                  ? 'bg-weird-green/20 text-emerald-700 dark:text-wintergreen'
                                  : topic.examMasteryAvg >= 60
                                  ? 'bg-spiro-disco-ball/20 text-sky-700 dark:text-spiro-disco-ball'
                                  : 'bg-light-red/20 text-red-700 dark:text-light-red font-black'
                              }`}
                            >
                              Exam: {topic.examMasteryAvg}%
                            </span>
                          )}

                          {topic.lastTaughtDate && (
                            <span className="text-[10px] text-slate-400">
                              Taught: {topic.lastTaughtDate}
                            </span>
                          )}
                        </div>

                        {/* Status Switcher & Delete */}
                        <div className="flex items-center gap-2">
                          <select
                            value={topic.status}
                            onChange={(e) =>
                              handleStatusChange(topic.id, e.target.value as SyllabusTopicStatus)
                            }
                            className={`text-xs px-2.5 py-1 rounded-xl font-bold border transition-colors ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} focus:outline-none`}
                          >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="revision_needed">Revision Needed</option>
                            <option value="missed_pending_makeup">Missed / Makeup</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDeleteTopic(topic.id)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                            title="Delete Topic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
