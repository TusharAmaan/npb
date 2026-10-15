import React, { useState } from 'react';
import { Batch, WeeklySlot } from '../../types/models';
import { X } from 'lucide-react';
import { ModernWeeklySchedulePicker } from './ModernWeeklySchedulePicker';

interface BatchFormModalProps {
  batch?: Batch | null;
  onClose: () => void;
  onSave: (batch: Batch) => void;
}

export const BatchFormModal: React.FC<BatchFormModalProps> = ({ batch, onClose, onSave }) => {
  const [name, setName] = useState(batch?.name || '');
  const [courseTag, setCourseTag] = useState(batch?.courseTag || 'HSC Academic');
  const [classLevel, setClassLevel] = useState(batch?.classLevel || 'HSC 1st Year');
  const [weeklyRoutine, setWeeklyRoutine] = useState<WeeklySlot[]>(
    batch?.weeklyRoutine || [
      { dayOfWeek: 0, startTime: '16:00', endTime: '17:30' },
      { dayOfWeek: 2, startTime: '16:00', endTime: '17:30' },
    ]
  );
  const [examWeight, setExamWeight] = useState(batch?.performanceWeights?.examWeight ?? 50);
  const [homeworkWeight, setHomeworkWeight] = useState(batch?.performanceWeights?.homeworkWeight ?? 30);
  const [attendanceWeight, setAttendanceWeight] = useState(batch?.performanceWeights?.attendanceWeight ?? 20);
  const [lateWeight, setLateWeight] = useState(batch?.attendanceRules?.lateWeight ?? 0.5);
  const [excusedAction, setExcusedAction] = useState<
    'exclude_from_total' | 'count_as_present' | 'count_as_absent'
  >(batch?.attendanceRules?.excusedAction || 'exclude_from_total');
  const [isActive, setIsActive] = useState(batch?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newBatch: Batch = {
      id: batch?.id || `batch-${Date.now().toString(36)}`,
      name: name.trim(),
      courseTag: courseTag.trim(),
      classLevel: classLevel.trim(),
      weeklyRoutine,
      performanceWeights: {
        examWeight: Number(examWeight),
        homeworkWeight: Number(homeworkWeight),
        attendanceWeight: Number(attendanceWeight),
      },
      attendanceRules: {
        lateWeight: Number(lateWeight),
        excusedAction,
      },
      isActive,
      createdAt: batch?.createdAt || Date.now(),
    };

    onSave(newBatch);
  };

  const totalWeights = Number(examWeight) + Number(homeworkWeight) + Number(attendanceWeight);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-border">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              {batch ? 'Edit Batch & Academic Rules' : 'Create New Academic Batch'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure weekly routine, attendance policies, and performance weights
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Batch Name & Course Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Batch Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Batch 1 - HSC 2027 Academic Care"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-light-indigo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Course Program / Tag
              </label>
              <input
                type="text"
                value={courseTag}
                onChange={(e) => setCourseTag(e.target.value)}
                placeholder="e.g. HSC Academic, SSC Board, Spoken"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-light-indigo"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Class Level
              </label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-light-indigo"
              >
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="SSC Examinee">SSC Examinee</option>
                <option value="HSC 1st Year">HSC 1st Year</option>
                <option value="HSC 2nd Year">HSC 2nd Year</option>
                <option value="HSC Examinee">HSC Examinee</option>
                <option value="College Combined">College Combined</option>
                <option value="Spoken Club">Spoken Club</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-weird-green"></div>
                <span className="ml-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                  Batch Is Currently Active
                </span>
              </label>
            </div>
          </div>

          {/* Modern Visual Weekly Routine Schedule Calendar & Picker */}
          <ModernWeeklySchedulePicker
            value={weeklyRoutine}
            onChange={setWeeklyRoutine}
          />

          {/* Performance Weights Matrix */}
          <div className="border border-slate-200/80 dark:border-dark-border rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Performance Score Weights (Sum: {totalWeights}%)
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  totalWeights === 100
                    ? 'bg-weird-green/20 text-emerald-700 dark:text-wintergreen'
                    : 'bg-radiant-yellow/20 text-amber-700 dark:text-radiant-yellow'
                }`}
              >
                {totalWeights === 100 ? 'Balanced (100%)' : `Total: ${totalWeights}%`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Exams Weight %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={examWeight}
                  onChange={(e) => setExamWeight(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Homework Weight %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={homeworkWeight}
                  onChange={(e) => setHomeworkWeight(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Attendance Weight %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={attendanceWeight}
                  onChange={(e) => setAttendanceWeight(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Attendance Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Late Attendance Credit
              </label>
              <select
                value={lateWeight}
                onChange={(e) => setLateWeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white"
              >
                <option value={0.5}>50% Credit (0.5)</option>
                <option value={0.75}>75% Credit (0.75)</option>
                <option value={1.0}>100% Full Credit (1.0)</option>
                <option value={0}>0% (Counts as absent)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Excused Absence Policy
              </label>
              <select
                value={excusedAction}
                onChange={(e) => setExcusedAction(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white"
              >
                <option value="exclude_from_total">Exclude from Total (Does not penalize)</option>
                <option value="count_as_present">Count as 100% Present</option>
                <option value="count_as_absent">Count as Absent</option>
              </select>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-md shadow-light-indigo/20"
            >
              {batch ? 'Save Changes' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
