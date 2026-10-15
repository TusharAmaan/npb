import React from 'react';
import { useData } from '../../context/DataContext';
import { Trophy, Eye, ShieldCheck, Check, Layers, Sliders } from 'lucide-react';

export const AdminLeaderboardControl: React.FC = () => {
  const { settings, batches, updateSettings } = useData();
  const config = settings.leaderboardConfig;

  const handleToggleColumn = async (columnKey: keyof typeof config.visibleColumns) => {
    const updated = {
      ...config,
      visibleColumns: {
        ...config.visibleColumns,
        [columnKey]: !config.visibleColumns[columnKey],
      },
    };
    await updateSettings({ leaderboardConfig: updated });
  };

  const handleToggleBatch = async (batchId: string) => {
    const current = config.publishedBatchIds || [];
    const updatedBatchIds = current.includes(batchId)
      ? current.filter((id) => id !== batchId)
      : [...current, batchId];

    await updateSettings({
      leaderboardConfig: {
        ...config,
        publishedBatchIds: updatedBatchIds,
      },
    });
  };

  const handleSetRowLimit = async (limit: 'top10' | 'all') => {
    await updateSettings({
      leaderboardConfig: {
        ...config,
        rowLimit: limit,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow">
            <Trophy className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Public Leaderboard Visibility & Privacy Matrix
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              100% controlled by Admin. Choose which batches, row limits, and columns the public can see at <code>/leaderboard</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Published Batches Selector */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-light-indigo" />
              <span>Published Batches for Public Ranking</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only checked batches will be visible in the public dropdown on <code>/leaderboard</code>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {batches.map((batch) => {
            const isPublished = config.publishedBatchIds?.includes(batch.id);

            return (
              <button
                key={batch.id}
                type="button"
                onClick={() => handleToggleBatch(batch.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  isPublished
                    ? 'bg-weird-green/10 border-weird-green/40 text-emerald-950 dark:text-wintergreen'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60 hover:opacity-100'
                }`}
              >
                <div>
                  <span className="font-bold text-xs block text-slate-900 dark:text-white">
                    {batch.name}
                  </span>
                  <span className="text-[10px] text-slate-400">{batch.courseTag}</span>
                </div>
                {isPublished ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-wintergreen" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row Limit (Top 10 vs All) */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-spiro-disco-ball" />
          <span>Leaderboard Row Limit</span>
        </h3>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
            <input
              type="radio"
              name="rowLimit"
              checked={config.rowLimit === 'top10'}
              onChange={() => handleSetRowLimit('top10')}
              className="text-light-indigo focus:ring-light-indigo"
            />
            <span>Show Top 10 Only (Exclusive High Performers)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
            <input
              type="radio"
              name="rowLimit"
              checked={config.rowLimit === 'all'}
              onChange={() => handleSetRowLimit('all')}
              className="text-light-indigo focus:ring-light-indigo"
            />
            <span>Show Full Batch (All Enrolled Students)</span>
          </label>
        </div>
      </div>

      {/* Column Visibility Matrix */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-weird-green" />
            <span>Public Column Visibility & Student Privacy Matrix</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Toggle switches below to show or hide columns. If "Student Name" is turned OFF, students verify their rank strictly by their manual <strong>Public Roll No</strong>!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(config.visibleColumns).map(([key, isVisible]) => {
            const labels: Record<string, { title: string; desc: string }> = {
              publicRollNo: { title: 'Public Roll No', desc: 'Manual Roll (Primary Identifier)' },
              studentName: { title: 'Student Name', desc: 'Hide for privacy / Anonymous roll mode' },
              schoolName: { title: 'School Name', desc: 'DRMC, VNSC, NDC, ACC badges' },
              attendanceRate: { title: 'Attendance %', desc: 'Attendance completion rate' },
              homeworkRate: { title: 'Homework %', desc: 'Homework rate and submission credit' },
              examAverage: { title: 'Exam Average %', desc: 'Overall academic test average' },
              bonusStreakPoints: { title: 'Bonus & Streak Points', desc: 'Class participation extra credit' },
              totalPerformanceScore: { title: 'Total Performance Score', desc: 'Calculated composite score' },
              badges: { title: 'Achievement Badges', desc: 'Streak Master, Academic Elite, etc.' },
            };

            const info = labels[key] || { title: key, desc: '' };

            return (
              <label
                key={key}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-all ${
                  isVisible
                    ? 'bg-light-indigo/10 border-light-indigo/40 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <div>
                  <span className="font-bold text-xs block">{info.title}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {info.desc}
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => handleToggleColumn(key as any)}
                  className="mt-1 rounded text-light-indigo focus:ring-light-indigo"
                />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
