import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import { Batch } from '../../types/models';
import { BatchFormModal } from './BatchFormModal';
import {
  Layers,
  Plus,
  Radio,
  Edit2,
  Trash2,
  Calendar,
  Users,
  Percent,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const BatchList: React.FC = () => {
  const { batches, students, saveBatch, deleteBatch } = useData();
  const { confirm } = useModal();
  const navigate = useNavigate();
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedBatch(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (batchId: string, batchName: string) => {
    const ok = await confirm({
      title: 'Delete Batch',
      message: `Are you sure you want to delete batch "${batchName}"? Enrolled students will remain in the database without an assigned batch.`,
      confirmText: 'Yes, Delete Batch',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (ok) {
      await deleteBatch(batchId);
    }
  };

  const handleSave = async (batch: Batch) => {
    await saveBatch(batch);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-spiro-disco-ball/15 text-spiro-disco-ball">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Academic Batches & Weekly Routines
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure courses, routine days, attendance rules, and leaderboard weighting per batch.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-md shadow-light-indigo/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Batch</span>
        </button>
      </div>

      {/* Batch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {batches.map((batch) => {
          const enrolledStudents = students.filter(
            (s) => s.isActive && s.batchIds?.includes(batch.id)
          );

          // Get unique schools represented
          const schoolCodes = Array.from(
            new Set(enrolledStudents.map((s) => s.schoolName).filter(Boolean))
          );

          return (
            <div
              key={batch.id}
              className="bg-white dark:bg-dark-surface rounded-2xl p-5 border border-slate-200/80 dark:border-dark-border shadow-xs hover:border-light-indigo/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-spiro-disco-ball/15 text-sky-800 dark:text-spiro-disco-ball">
                      {batch.courseTag}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {batch.classLevel}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      batch.isActive
                        ? 'bg-weird-green/20 text-emerald-800 dark:text-wintergreen'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {batch.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-slate-400" />
                        Archived
                      </>
                    )}
                  </span>
                </div>

                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2">
                  {batch.name}
                </h2>

                {/* Routine pills */}
                <div className="mt-3 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Weekly Schedule
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {batch.weeklyRoutine?.map((slot, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                      >
                        <Calendar className="w-3 h-3 text-light-indigo" />
                        <strong className="text-light-indigo dark:text-spiro-disco-ball">
                          {DAY_LABELS[slot.dayOfWeek]}
                        </strong>
                        <span>
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Enrolled Students & Schools */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Enrollment</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-spiro-disco-ball" />
                      {enrolledStudents.length} Students
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Weights Matrix</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                      <Percent className="w-3.5 h-3.5 text-bright-lilac" />
                      E:{batch.performanceWeights?.examWeight}% H:
                      {batch.performanceWeights?.homeworkWeight}% A:
                      {batch.performanceWeights?.attendanceWeight}%
                    </span>
                  </div>
                </div>

                {/* School chips */}
                {schoolCodes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {schoolCodes.slice(0, 3).map((school, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {school}
                      </span>
                    ))}
                    {schoolCodes.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold">
                        +{schoolCodes.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
                <button
                  onClick={() => navigate(`/admin/live-class?batchId=${batch.id}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen transition-transform active:scale-95 shadow-xs"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-900 animate-pulse" />
                  <span>Start Live Class</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(batch)}
                    className="p-2 rounded-xl text-slate-500 hover:text-light-indigo hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Batch"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(batch.id, batch.name)}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete Batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <BatchFormModal
          batch={selectedBatch}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
