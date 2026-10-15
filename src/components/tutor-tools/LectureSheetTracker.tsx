import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import { LectureSheet } from '../../types/models';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Calendar,
  X,
  Users,
} from 'lucide-react';

export const LectureSheetTracker: React.FC = () => {
  const { batches, students, sheets, saveLectureSheet, toggleSheetDistributed, deleteLectureSheet } =
    useData();
  const { confirm } = useModal();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Sheet Form
  const [newSheetNum, setNewSheetNum] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newRelatedTopic, setNewRelatedTopic] = useState('');
  const [newDistDate, setNewDistDate] = useState(new Date().toISOString().split('T')[0]);

  const batchSheets = sheets.filter((s) => s.batchId === selectedBatchId);
  const enrolledStudents = students.filter(
    (s) => s.isActive && s.batchIds?.includes(selectedBatchId)
  );

  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const sheetId = `sheet-${Date.now().toString(36)}`;
    const newSheet: LectureSheet = {
      id: sheetId,
      batchId: selectedBatchId,
      sheetNumber: newSheetNum.trim() || `Sheet #${sheets.length + 1}`,
      title: newTitle.trim(),
      relatedTopic: newRelatedTopic.trim() || undefined,
      distributedDate: newDistDate,
      receivedByStudentIds: [],
      targetStudentIds: enrolledStudents.map((s) => s.id),
      createdAt: Date.now(),
    };

    await saveLectureSheet(newSheet);
    setIsModalOpen(false);
    setNewSheetNum('');
    setNewTitle('');
    setNewRelatedTopic('');
  };

  const handleDelete = async (sheetId: string, title: string) => {
    const ok = await confirm({
      title: 'Delete Lecture Sheet',
      message: `Delete lecture sheet record "${title}"? Distribution logs for this sheet will be deleted.`,
      confirmText: 'Yes, Delete Sheet',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (ok) {
      await deleteLectureSheet(sheetId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-hammam-blue/20 text-teal-800 dark:text-hammam-blue">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Lecture Sheets & Note Tracker
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track physical lecture sheet handouts. Uncollected sheets automatically trigger glowing alerts in Live Class mode.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-md shadow-light-indigo/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log New Lecture Sheet</span>
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

      {/* Sheets List & Student Matrix */}
      <div className="space-y-4">
        {batchSheets.length === 0 ? (
          <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No lecture sheets logged for this batch yet.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click "+ Log New Lecture Sheet" above to record notes or handouts.
            </p>
          </div>
        ) : (
          batchSheets.map((sheet) => {
            const receivedCount = (sheet.receivedByStudentIds || []).length;
            const targetCount = sheet.targetStudentIds?.length || enrolledStudents.length;

            return (
              <div
                key={sheet.id}
                className="bg-white dark:bg-dark-surface rounded-2xl p-5 border border-slate-200/80 dark:border-dark-border shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-hammam-blue/20 text-teal-800 dark:text-hammam-blue">
                        {sheet.sheetNumber}
                      </span>
                      <span className="text-xs text-slate-400">Date: {sheet.distributedDate}</span>
                      {sheet.relatedTopic && (
                        <span className="text-xs font-semibold text-slate-500">
                          Topic: {sheet.relatedTopic}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      {sheet.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {receivedCount} / {targetCount} Students Received
                    </span>
                    <button
                      onClick={() => handleDelete(sheet.id, sheet.title)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                      title="Delete Sheet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Student Checklist Grid */}
                <div className="pt-3 border-t border-slate-100 dark:border-dark-border">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Student Distribution Status (Tap to toggle):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {enrolledStudents.map((stu) => {
                      const isReceived = sheet.receivedByStudentIds?.includes(stu.id);

                      return (
                        <button
                          key={stu.id}
                          type="button"
                          onClick={() => toggleSheetDistributed(sheet.id, stu.id)}
                          className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-1.5 border transition-all text-left ${
                            isReceived
                              ? 'bg-weird-green/15 text-emerald-800 dark:text-wintergreen border-weird-green/30'
                              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="truncate">
                            <span className="font-extrabold text-[10px] block opacity-75">
                              {stu.publicRollNo}
                            </span>
                            <span className="truncate block font-bold text-slate-900 dark:text-white">
                              {stu.name}
                            </span>
                          </div>
                          {isReceived ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-wintergreen flex-shrink-0" />
                          ) : (
                            <span className="text-[10px] font-bold text-red-500 flex-shrink-0">
                              Needs
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-md border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-border">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Log New Lecture Sheet
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSheet} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sheet Number / Code
                </label>
                <input
                  type="text"
                  required
                  value={newSheetNum}
                  onChange={(e) => setNewSheetNum(e.target.value)}
                  placeholder="e.g. Sheet #05"
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sheet Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Prepositions & Phrasal Verbs Board Special"
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Related Syllabus Topic
                </label>
                <input
                  type="text"
                  value={newRelatedTopic}
                  onChange={(e) => setNewRelatedTopic(e.target.value)}
                  placeholder="e.g. Prepositions"
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Distribution Date
                </label>
                <input
                  type="date"
                  required
                  value={newDistDate}
                  onChange={(e) => setNewDistDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-dark-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm"
                >
                  Save Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
