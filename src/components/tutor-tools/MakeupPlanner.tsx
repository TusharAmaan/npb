import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Student, StudentSyllabusTopic } from '../../types/models';
import { createWhatsAppLink, WhatsAppTemplates } from '../../lib/whatsappTemplates';
import {
  CalendarClock,
  Sparkles,
  Users,
  CheckCircle2,
  PhoneCall,
  Clock,
  Calendar,
  Share2,
  X,
  Radio,
} from 'lucide-react';

export const MakeupPlanner: React.FC = () => {
  const { students, batches, syllabi, saveStudentSyllabus } = useData();

  // Find all students who have missed topics
  const topicMissedMap: Record<
    string,
    {
      topicTitle: string;
      category: string;
      students: { student: Student; topicId: string }[];
    }
  > = {};

  students.forEach((stu) => {
    if (!stu.isActive) return;
    const syl = syllabi[stu.id];
    if (!syl?.topics) return;

    syl.topics.forEach((t) => {
      if (t.status === 'missed_pending_makeup') {
        if (!topicMissedMap[t.title]) {
          topicMissedMap[t.title] = {
            topicTitle: t.title,
            category: t.category,
            students: [],
          };
        }
        topicMissedMap[t.title].students.push({ student: stu, topicId: t.id });
      }
    });
  });

  const missedTopicsList = Object.values(topicMissedMap);

  // Scheduling State
  const [activeSchedulingTopic, setActiveSchedulingTopic] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [scheduleTime, setScheduleTime] = useState('11:00');

  // Mark Completed
  const handleMarkMakeupDone = async (topicTitle: string, stuList: { student: Student; topicId: string }[]) => {
    if (
      confirm(
        `Mark makeup class completed for topic "${topicTitle}" for all ${stuList.length} students? Their syllabus statuses will update to Completed.`
      )
    ) {
      for (const item of stuList) {
        const syl = syllabi[item.student.id];
        if (syl?.topics) {
          const updated = syl.topics.map((t) =>
            t.title === topicTitle
              ? {
                  ...t,
                  status: 'completed' as const,
                  completedDate: new Date().toISOString().split('T')[0],
                }
              : t
          );
          await saveStudentSyllabus(item.student.id, updated);
        }
      }
    }
  };

  // WhatsApp Alert dispatch for combined makeup
  const handleSendCombinedWhatsApp = (topicTitle: string, stuList: { student: Student; topicId: string }[]) => {
    const studentNames = stuList.map((s) => s.student.name);
    const msg = WhatsAppTemplates.makeupSessionAlert(
      topicTitle,
      scheduleDate,
      scheduleTime,
      studentNames
    );

    // Open first student's guardian WhatsApp as direct dispatch or copy
    navigator.clipboard.writeText(msg);
    alert(`Copied combined WhatsApp makeup notice to clipboard for:\n${studentNames.join(', ')}\n\nPaste in batch or group chat.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow">
                <CalendarClock className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                Multi-Batch Makeup Class Planner
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cross-batch aggregator. Groups students who missed topics due to class absences so you can conduct combined weekend makeup sessions.
            </p>
          </div>

          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow border border-radiant-yellow/30">
            {missedTopicsList.length} Topics Needing Makeup
          </span>
        </div>
      </div>

      {/* Topics Grouped List */}
      {missedTopicsList.length === 0 ? (
        <div className="bg-white dark:bg-dark-surface p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <CheckCircle2 className="w-12 h-12 text-weird-green mx-auto mb-3" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            All Students Are 100% Up to Date!
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            No students currently have topics flagged as "Missed / Pending Makeup". When an absent student is recorded during Live Class, their missed topics will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missedTopicsList.map((group) => {
            return (
              <div
                key={group.topicTitle}
                className="bg-white dark:bg-dark-surface rounded-2xl p-5 border border-slate-200/80 dark:border-dark-border shadow-xs hover:border-radiant-yellow/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-bright-lilac/20 text-purple-900 dark:text-bright-lilac">
                      {group.category}
                    </span>
                    <span className="text-xs font-bold text-red-600 dark:text-light-red flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {group.students.length} Students Missed
                    </span>
                  </div>

                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                    {group.topicTitle}
                  </h2>

                  {/* List of Affected Students */}
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Enrolled Students Requiring Makeup:
                    </span>
                    <div className="space-y-1">
                      {group.students.map(({ student }) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-800 dark:text-radiant-yellow">
                              {student.publicRollNo}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {student.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">{student.schoolName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Schedule & Mark Done Controls */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-dark-border flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveSchedulingTopic(group.topicTitle)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-radiant-yellow text-slate-950 hover:bg-mandarin-sorbet transition-all shadow-xs"
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>Schedule Makeup Session</span>
                  </button>

                  <button
                    onClick={() => handleMarkMakeupDone(group.topicTitle, group.students)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-weird-green/20 text-emerald-800 dark:text-wintergreen hover:bg-weird-green/30"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </button>
                </div>

                {/* Scheduling Drawer */}
                {activeSchedulingTopic === group.topicTitle && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>Schedule Time & WhatsApp Broadcast</span>
                      <button
                        onClick={() => setActiveSchedulingTopic(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Date</label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Time</label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendCombinedWhatsApp(group.topicTitle, group.students)}
                      className="w-full py-1.5 rounded-lg font-bold bg-weird-green text-slate-950 flex items-center justify-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Copy WhatsApp Broadcast Message</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
