import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Batch, Student } from '../../types/models';
import { Radio, Clock, Users, ArrowRight, CalendarDays, Sparkles } from 'lucide-react';

interface TodayClassesCardProps {
  batches: Batch[];
  students: Student[];
}

export const TodayClassesCard: React.FC<TodayClassesCardProps> = ({ batches, students }) => {
  const navigate = useNavigate();
  // Get current day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const todayDay = new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[todayDay];

  // Find batches scheduled today
  const todaysBatches = batches.filter((b) =>
    b.isActive && b.weeklyRoutine?.some((slot) => slot.dayOfWeek === todayDay)
  );

  return (
    <div className="bg-gradient-to-br from-light-indigo/10 via-light-slate-blue/5 to-spiro-disco-ball/10 dark:from-light-indigo/20 dark:via-dark-surface dark:to-dark-surface border border-light-indigo/25 dark:border-light-indigo/30 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-light-indigo text-white shadow-xs">
              <CalendarDays className="w-3.5 h-3.5" />
              {todayName}'s Schedule
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Today's Classes & Live Sessions
          </h2>
        </div>

        {todaysBatches.length > 0 && (
          <button
            onClick={() => navigate('/admin/live-class')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-weird-green text-slate-950 hover:bg-wintergreen shadow-md shadow-weird-green/20 transition-transform active:scale-95"
          >
            <Radio className="w-4 h-4 animate-pulse text-emerald-900" />
            <span>Start Live Class</span>
          </button>
        )}
      </div>

      {todaysBatches.length === 0 ? (
        <div className="bg-white/80 dark:bg-dark-surface/80 rounded-xl p-6 text-center border border-dashed border-slate-300 dark:border-slate-700">
          <Sparkles className="w-8 h-8 text-spiro-disco-ball mx-auto mb-2 opacity-70" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            No regular weekly classes scheduled for {todayName}.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            You can still conduct an Extra or Makeup Class anytime using the Live Class launcher.
          </p>
          <button
            onClick={() => navigate('/admin/live-class')}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-light-indigo dark:text-spiro-disco-ball hover:underline"
          >
            <span>Launch Extra / Makeup Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {todaysBatches.map((batch) => {
            const todaySlot = batch.weeklyRoutine?.find((s) => s.dayOfWeek === todayDay);
            const enrolledCount = students.filter(
              (s) => s.isActive && s.batchIds?.includes(batch.id)
            ).length;

            return (
              <div
                key={batch.id}
                className="bg-white dark:bg-dark-surface rounded-xl p-4 border border-slate-200/80 dark:border-dark-border shadow-xs hover:border-light-indigo/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-spiro-disco-ball/15 text-sky-700 dark:text-spiro-disco-ball">
                      {batch.courseTag}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {batch.classLevel}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                    {batch.name}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-light-indigo" />
                      {todaySlot?.startTime} - {todaySlot?.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {enrolledCount} Students
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/admin/live-class?batchId=${batch.id}`)}
                    className="inline-flex items-center gap-1 font-bold text-light-indigo dark:text-neon-blue hover:text-light-slate-blue transition-colors"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
