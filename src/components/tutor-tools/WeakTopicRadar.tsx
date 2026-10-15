import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { AlertTriangle, Sparkles, Filter, CheckCircle2 } from 'lucide-react';

export const WeakTopicRadar: React.FC = () => {
  const { batches, students, syllabi } = useData();

  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');

  // Filter students based on batch
  const eligibleStudents = students.filter(
    (s) => s.isActive && (selectedBatchId === 'all' || s.batchIds?.includes(selectedBatchId))
  );

  // Aggregate topics across eligible students
  const topicStatsMap: Record<
    string,
    { title: string; category: string; totalScore: number; count: number; weakCount: number }
  > = {};

  const currentStudents =
    selectedStudentId === 'all'
      ? eligibleStudents
      : eligibleStudents.filter((s) => s.id === selectedStudentId);

  currentStudents.forEach((stu) => {
    const syl = syllabi[stu.id];
    if (!syl?.topics) return;

    syl.topics.forEach((t) => {
      const score = t.examMasteryAvg !== undefined ? t.examMasteryAvg : t.status === 'completed' ? 85 : 50;
      if (!topicStatsMap[t.title]) {
        topicStatsMap[t.title] = {
          title: t.title,
          category: t.category || 'Grammar',
          totalScore: 0,
          count: 0,
          weakCount: 0,
        };
      }
      topicStatsMap[t.title].totalScore += score;
      topicStatsMap[t.title].count += 1;
      if (score < 60) {
        topicStatsMap[t.title].weakCount += 1;
      }
    });
  });

  const radarData = Object.values(topicStatsMap).map((item) => {
    const avgScore = item.count > 0 ? Math.round(item.totalScore / item.count) : 0;
    return {
      topic: item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title,
      fullTitle: item.title,
      category: item.category,
      mastery: avgScore,
      weakStudents: item.weakCount,
      isWeak: avgScore < 60,
    };
  });

  // Sort: weakest first
  radarData.sort((a, b) => a.mastery - b.mastery);

  const weakTopics = radarData.filter((r) => r.mastery < 60);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-light-red/15 text-light-red">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                Weak Topic Diagnostic Radar
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Automated Recharts Radar & Spider breakdown. Any syllabus topic with average exam performance below 60% is highlighted in Light Red.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setSelectedStudentId('all');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 max-w-[180px] truncate"
            >
              <option value="all">All Students Combined</option>
              {eligibleStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.publicRollNo})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Visualizations: Radar + Bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Spider Chart */}
        <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-spiro-disco-ball" />
              <span>Syllabus Topic Mastery Radar</span>
            </h3>
            <span className="text-[11px] text-slate-400">Target: ≥ 80% Mastery</span>
          </div>

          <div className="w-full h-72 sm:h-80">
            {radarData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No topic data available for selected filter.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.3} />
                  <PolarAngleAxis
                    dataKey="topic"
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" opacity={0.3} />
                  <Radar
                    name="Mastery"
                    dataKey="mastery"
                    stroke="#7158e2"
                    fill="#7158e2"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Topic Mastery Distribution Bar Chart */}
        <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Topic Mastery Ranking (%)
            </h3>
            <span className="text-[11px] text-red-500 font-bold">
              Red bars = Below 60% threshold
            </span>
          </div>

          <div className="w-full h-72 sm:h-80">
            {radarData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No topics recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={radarData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="topic" type="category" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Mastery']}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="mastery" radius={[0, 6, 6, 0]}>
                    {radarData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.mastery < 60
                            ? '#ff4d4d' // Light Red
                            : entry.mastery >= 80
                            ? '#3ae374' // Weird Green
                            : '#17c0eb' // Spiro Disco Ball
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Critical Revision Table: Weak Topics < 60% */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-light-red/30 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-light-red" />
              <span>Critical Revision Action List (&lt; 60%)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Students and topics that require immediate board questions drill before tests.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-light-red text-white">
            {weakTopics.length} Priority Topics
          </span>
        </div>

        {weakTopics.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-weird-green" />
            <span>Zero critical weak topics found! All topics have achieved ≥60% mastery.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {weakTopics.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-light-red/30 bg-light-red/5 dark:bg-light-red/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-red-600 dark:text-light-red">
                      {item.category}
                    </span>
                    <span className="text-xs font-black text-red-700 dark:text-light-red">
                      {item.mastery}% Avg
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                    {item.fullTitle}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-light-red/20 text-[11px] text-slate-500 dark:text-slate-400">
                  ⚠️ Needs dedicated board drill session
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
