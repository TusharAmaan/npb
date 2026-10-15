import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import { LectureSheet, LectureSheetType, Student } from '../../types/models';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Calendar,
  X,
  Users,
  Search,
  Filter,
  Package,
  Layers,
  Sparkles,
  Zap,
  Share2,
  MessageSquare,
  AlertCircle,
  Copy,
  Tag,
  Building2,
  Clock,
  BookOpen,
  Edit2,
} from 'lucide-react';

export const LectureSheetTracker: React.FC = () => {
  const {
    batches,
    students,
    schools,
    sheets,
    sessions,
    syllabusSchemes,
    saveLectureSheet,
    toggleSheetDistributed,
    bulkUpdateSheetDistribution,
    setSheetStudentStatus,
    deleteLectureSheet,
  } = useData();
  const { confirm, alert } = useModal();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'received' | 'pending' | 'absent_needs_handout' | 'extra_copy'
  >('all');
  const [groupBySchool, setGroupBySchool] = useState<boolean>(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  // New Sheet Form State
  const [newSheetNum, setNewSheetNum] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSheetType, setNewSheetType] = useState<LectureSheetType>('lecture_note');
  const [newTotalPrinted, setNewTotalPrinted] = useState<number>(50);
  const [newDistDate, setNewDistDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSelectedSchemeId, setNewSelectedSchemeId] = useState<string>('');
  const [newSelectedTopics, setNewSelectedTopics] = useState<string[]>([]);
  const [newCustomTopic, setNewCustomTopic] = useState<string>('');
  const [newCustomTopicsList, setNewCustomTopicsList] = useState<string[]>([]);
  const [newTargetType, setNewTargetType] = useState<'whole_batch' | 'specific_schools'>('whole_batch');
  const [newTargetSchoolIds, setNewTargetSchoolIds] = useState<string[]>([]);
  const [autoMarkPresentFromLatestSession, setAutoMarkPresentFromLatestSession] = useState(true);

  // Batch specific data
  const batchSheets = useMemo(
    () => sheets.filter((s) => s.batchId === selectedBatchId),
    [sheets, selectedBatchId]
  );

  const activeSheet = useMemo(() => {
    if (selectedSheetId) {
      const found = batchSheets.find((s) => s.id === selectedSheetId);
      if (found) return found;
    }
    return batchSheets[0] || null;
  }, [batchSheets, selectedSheetId]);

  const activeBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId) || batches[0],
    [batches, selectedBatchId]
  );

  const batchStudents = useMemo(
    () => students.filter((s) => s.isActive && s.batchIds?.includes(selectedBatchId)),
    [students, selectedBatchId]
  );

  // Eligible students for the active sheet
  const eligibleStudents = useMemo(() => {
    if (!activeSheet) return batchStudents;
    if (activeSheet.targetType === 'specific_schools' && activeSheet.targetSchoolIds?.length) {
      return batchStudents.filter((s) => activeSheet.targetSchoolIds?.includes(s.schoolId));
    }
    if (activeSheet.targetStudentIds?.length) {
      return batchStudents.filter((s) => activeSheet.targetStudentIds?.includes(s.id));
    }
    return batchStudents;
  }, [activeSheet, batchStudents]);

  // Distinct schools among batch students
  const batchSchools = useMemo(() => {
    const schoolIds = Array.from(new Set(batchStudents.map((s) => s.schoolId)));
    return schoolIds
      .map((id) => schools.find((sc) => sc.id === id) || { id, name: id, shortCode: id, createdAt: 0 })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [batchStudents, schools]);

  // Active schemes for this batch
  const batchSchemes = useMemo(
    () => syllabusSchemes.filter((sch) => sch.targetBatchId === selectedBatchId),
    [syllabusSchemes, selectedBatchId]
  );

  // Latest class session for this batch
  const latestSession = useMemo(() => {
    const list = sessions
      .filter((sess) => sess.batchId === selectedBatchId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list[0] || null;
  }, [sessions, selectedBatchId]);

  // Filtered students based on school, search, and status
  const displayedStudents = useMemo(() => {
    return eligibleStudents.filter((stu) => {
      // School filter
      if (selectedSchoolId !== 'all' && stu.schoolId !== selectedSchoolId) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = stu.name.toLowerCase().includes(q);
        const matchRoll = (stu.publicRollNo || '').toLowerCase().includes(q);
        const matchSchool = (stu.schoolName || '').toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchSchool) return false;
      }
      // Status filter
      if (activeSheet && statusFilter !== 'all') {
        const isReceived = activeSheet.receivedByStudentIds?.includes(stu.id);
        const detailedStatus = activeSheet.studentStatuses?.[stu.id]?.status || (isReceived ? 'received' : 'pending');
        if (statusFilter === 'received' && !isReceived) return false;
        if (statusFilter === 'pending' && isReceived) return false;
        if (statusFilter === 'absent_needs_handout' && detailedStatus !== 'absent_needs_handout') return false;
        if (statusFilter === 'extra_copy' && detailedStatus !== 'extra_copy') return false;
      }
      return true;
    });
  }, [eligibleStudents, selectedSchoolId, searchQuery, statusFilter, activeSheet]);

  // Students grouped by school
  const studentsBySchool = useMemo(() => {
    const map = new Map<string, Student[]>();
    displayedStudents.forEach((stu) => {
      const key = stu.schoolName || 'General / Unassigned';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(stu);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [displayedStudents]);

  // Sheet distribution statistics
  const sheetStats = useMemo(() => {
    if (!activeSheet) {
      return { receivedCount: 0, pendingCount: 0, totalTarget: 0, remainingStock: 0, percent: 0 };
    }
    const received = activeSheet.receivedByStudentIds?.length || 0;
    const totalTarget = eligibleStudents.length;
    const pending = Math.max(0, totalTarget - received);
    const printed = activeSheet.totalCopiesPrinted || totalTarget;
    const remainingStock = printed - received;
    const percent = totalTarget > 0 ? Math.round((received / totalTarget) * 100) : 0;
    return {
      receivedCount: received,
      pendingCount: pending,
      totalTarget,
      totalPrinted: printed,
      remainingStock,
      percent,
    };
  }, [activeSheet, eligibleStudents]);

  // Handle Sheet Creation
  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const sheetId = `sheet-${Date.now().toString(36)}`;
    const allTopics = [...newSelectedTopics, ...newCustomTopicsList];

    // Determine target students
    let targetStudents = batchStudents;
    if (newTargetType === 'specific_schools' && newTargetSchoolIds.length > 0) {
      targetStudents = batchStudents.filter((s) => newTargetSchoolIds.includes(s.schoolId));
    }

    // Auto mark students present in latest session if requested
    const initialReceivedIds: string[] = [];
    const initialStatuses: Record<string, any> = {};

    if (autoMarkPresentFromLatestSession && latestSession) {
      targetStudents.forEach((stu) => {
        const sessRec = latestSession.records?.[stu.id];
        if (sessRec && (sessRec.attendance === 'present' || sessRec.attendance === 'late')) {
          initialReceivedIds.push(stu.id);
          initialStatuses[stu.id] = {
            status: 'received',
            receivedAt: Date.now(),
          };
        } else if (sessRec && sessRec.attendance === 'absent') {
          initialStatuses[stu.id] = {
            status: 'absent_needs_handout',
            remarks: `Absent on ${latestSession.date}`,
          };
        }
      });
    }

    const newSheet: LectureSheet = {
      id: sheetId,
      batchId: selectedBatchId,
      sheetNumber: newSheetNum.trim() || `Sheet #${sheets.length + 1}`,
      title: newTitle.trim(),
      sheetType: newSheetType,
      relatedTopic: allTopics[0] || undefined,
      relatedTopics: allTopics,
      outOfSyllabusTopics: newCustomTopicsList,
      schemeId: newSelectedSchemeId || undefined,
      distributedDate: newDistDate,
      receivedByStudentIds: initialReceivedIds,
      targetStudentIds: targetStudents.map((s) => s.id),
      targetType: newTargetType,
      targetSchoolIds: newTargetType === 'specific_schools' ? newTargetSchoolIds : undefined,
      totalCopiesPrinted: Number(newTotalPrinted) || targetStudents.length,
      studentStatuses: initialStatuses,
      createdAt: Date.now(),
    };

    await saveLectureSheet(newSheet);
    setSelectedSheetId(sheetId);
    setIsCreateModalOpen(false);

    // Reset Form
    setNewSheetNum('');
    setNewTitle('');
    setNewSelectedTopics([]);
    setNewCustomTopicsList([]);
    setNewCustomTopic('');
    setNewTargetSchoolIds([]);
  };

  // Bulk: Mark All Displayed/Filtered as Received
  const handleBulkMarkFilteredReceived = async () => {
    if (!activeSheet || displayedStudents.length === 0) return;
    const studentIds = displayedStudents.map((s) => s.id);
    await bulkUpdateSheetDistribution(activeSheet.id, studentIds, 'received');
  };

  // Bulk: Mark All Present in Latest Session as Received
  const handleBulkMarkPresentFromLatestSession = async () => {
    if (!activeSheet) return;
    if (!latestSession) {
      await alert({
        title: 'No Session Found',
        message: 'No recorded class sessions found for this batch yet. Conduct a live class first.',
      });
      return;
    }

    const presentStudentIds = eligibleStudents
      .filter((stu) => {
        const rec = latestSession.records?.[stu.id];
        return rec && (rec.attendance === 'present' || rec.attendance === 'late');
      })
      .map((stu) => stu.id);

    if (presentStudentIds.length === 0) {
      await alert({
        title: 'No Attendees Found',
        message: `No students were recorded as present in the session on ${latestSession.date}.`,
      });
      return;
    }

    await bulkUpdateSheetDistribution(activeSheet.id, presentStudentIds, 'received');
  };

  // Bulk: Reset Filtered
  const handleBulkResetFiltered = async () => {
    if (!activeSheet || displayedStudents.length === 0) return;
    const ok = await confirm({
      title: 'Reset Distribution Status',
      message: `Reset handout status for ${displayedStudents.length} displayed students to Uncollected?`,
      confirmText: 'Yes, Reset',
      variant: 'warning',
    });
    if (ok) {
      const studentIds = displayedStudents.map((s) => s.id);
      await bulkUpdateSheetDistribution(activeSheet.id, studentIds, 'pending');
    }
  };

  // 1-Click WhatsApp Uncollected Sheet List
  const handleCopyWhatsAppUncollected = () => {
    if (!activeSheet) return;

    const uncollected: Student[] = [];
    eligibleStudents.forEach((stu) => {
      if (!activeSheet.receivedByStudentIds?.includes(stu.id)) {
        uncollected.push(stu);
      }
    });

    let msg = `📄 *LECTURE SHEET HANDOUT REMINDER — ${activeBatch.name}*\n`;
    msg += `📌 *${activeSheet.sheetNumber}: ${activeSheet.title}*\n`;
    msg += `📅 *Distribution Date:* ${activeSheet.distributedDate}\n\n`;

    if (uncollected.length === 0) {
      msg += `🎉 *All ${eligibleStudents.length} students have collected their lecture sheet!*`;
    } else {
      msg += `⚠️ The following *${uncollected.length} students* have NOT yet collected this lecture sheet. Please collect it from the desk in next class:\n\n`;

      // Group by school
      const schoolGroups = new Map<string, Student[]>();
      uncollected.forEach((s) => {
        const sc = s.schoolName || 'School';
        if (!schoolGroups.has(sc)) schoolGroups.set(sc, []);
        schoolGroups.get(sc)!.push(s);
      });

      schoolGroups.forEach((stus, scName) => {
        msg += `🏫 *${scName}:*\n`;
        stus.forEach((s) => {
          msg += `  • [Roll ${s.publicRollNo}] ${s.name}\n`;
        });
        msg += `\n`;
      });

      msg += `⏱️ Total Distributed: ${activeSheet.receivedByStudentIds?.length || 0} / ${eligibleStudents.length}\n`;
      msg += `NPB Academic Tracking System`;
    }

    navigator.clipboard.writeText(msg);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 2500);
  };

  // Delete Sheet
  const handleDeleteSheet = async () => {
    if (!activeSheet) return;
    const ok = await confirm({
      title: 'Delete Lecture Sheet Record',
      message: `Permanently delete "${activeSheet.sheetNumber} - ${activeSheet.title}" and its distribution logs?`,
      confirmText: 'Yes, Delete',
      variant: 'danger',
    });
    if (ok) {
      await deleteLectureSheet(activeSheet.id);
      setSelectedSheetId('');
    }
  };

  const getSheetTypeLabel = (type?: LectureSheetType) => {
    switch (type) {
      case 'practice_sheet':
        return 'Practice Sheet';
      case 'solution_sheet':
        return 'Solution Guide';
      case 'exam_paper':
        return 'Exam Question';
      case 'formula_sheet':
        return 'Formula & Summary';
      default:
        return 'Lecture Note';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-400">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Lecture Sheet & Handout Distribution Tracker
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {batchSheets.length} Sheets Logged
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Track physical lecture notes, practice sets, and solutions. Filter by School within batches, monitor printed stock inventory, and send 1-click WhatsApp alerts for uncollected handouts.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-md shadow-light-indigo/25 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log New Lecture Sheet</span>
        </button>
      </div>

      {/* Multi-Level Batch & Sheet Navigation Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Batch Selector */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Active Batch
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => {
              setSelectedBatchId(e.target.value);
              setSelectedSheetId('');
              setSelectedSchoolId('all');
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

        {/* Sheet Selector */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs md:col-span-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Active Lecture Sheet Handout
            </label>
            {activeSheet && (
              <span className="text-[11px] font-semibold text-slate-400">
                Distributed on: {activeSheet.distributedDate}
              </span>
            )}
          </div>
          <select
            value={activeSheet?.id || ''}
            onChange={(e) => setSelectedSheetId(e.target.value)}
            disabled={batchSheets.length === 0}
            className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
          >
            {batchSheets.length === 0 ? (
              <option value="">No lecture sheets logged for this batch</option>
            ) : (
              batchSheets.map((sh) => (
                <option key={sh.id} value={sh.id}>
                  {sh.sheetNumber}: {sh.title} ({sh.receivedByStudentIds?.length || 0} received)
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Active Sheet Card with Inventory & Action Toolbar */}
      {activeSheet ? (
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs overflow-hidden space-y-4 p-5">
          {/* Sheet Details & Inventory Strip */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-500/15 text-teal-800 dark:text-teal-300">
                  {activeSheet.sheetNumber}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {getSheetTypeLabel(activeSheet.sheetType)}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {activeSheet.distributedDate}
                </span>
                {activeSheet.targetType === 'specific_schools' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    School Targeted ({activeSheet.targetSchoolIds?.length || 0} schools)
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {activeSheet.title}
              </h2>

              {/* Topics Tags */}
              {activeSheet.relatedTopics && activeSheet.relatedTopics.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {activeSheet.relatedTopics.map((top, idx) => {
                    const isOutOfSyllabus = activeSheet.outOfSyllabusTopics?.includes(top);
                    return (
                      <span
                        key={idx}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          isOutOfSyllabus
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        {isOutOfSyllabus ? `⚡ ${top} (Out of Syllabus)` : top}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Inventory Stock Dashboard Widget */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 min-w-[280px]">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Physical Stock Inventory</span>
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-black">
                  {sheetStats.percent}% Handed Out
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, sheetStats.percent)}%` }}
                />
              </div>

              {/* Counts */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-bold">Printed</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {sheetStats.totalPrinted}
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">
                    Given
                  </span>
                  <span className="font-black text-emerald-700 dark:text-emerald-300">
                    {sheetStats.receivedCount}
                  </span>
                </div>
                <div
                  className={`p-1.5 rounded-lg border ${
                    sheetStats.remainingStock < 0
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 block font-bold">In Stock</span>
                  <span
                    className={`font-black ${
                      sheetStats.remainingStock < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {sheetStats.remainingStock}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Bulk Action Strip & Export */}
          <div className="pt-3 border-t border-slate-100 dark:border-dark-border flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleBulkMarkFilteredReceived}
                disabled={displayedStudents.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Filtered Received ({displayedStudents.length})</span>
              </button>

              {latestSession && (
                <button
                  type="button"
                  onClick={handleBulkMarkPresentFromLatestSession}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-spiro-disco-ball/10 text-cyan-800 dark:text-cyan-300 hover:bg-spiro-disco-ball/20 border border-spiro-disco-ball/30 transition-all"
                  title={`Auto-distribute to all students who attended class on ${latestSession.date}`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Sync Present Attendees ({latestSession.date})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleBulkResetFiltered}
                disabled={displayedStudents.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50"
              >
                <span>Reset Status</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* WhatsApp Uncollected Copy */}
              <button
                type="button"
                onClick={handleCopyWhatsAppUncollected}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-weird-green text-slate-950 hover:bg-wintergreen shadow-xs transition-transform active:scale-95"
              >
                {copiedWhatsapp ? <Check className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                <span>{copiedWhatsapp ? 'Copied Alert!' : 'Copy WA Uncollected Alert'}</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteSheet}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                title="Delete Lecture Sheet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-surface p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
          <h3 className="font-extrabold text-slate-800 dark:text-slate-200">
            No Lecture Sheet Selected
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Log your first lecture sheet or pick an existing sheet above to manage handouts.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sheet Now</span>
          </button>
        </div>
      )}

      {/* FILTER & SEARCH CONTROL TOOLBAR */}
      {activeSheet && (
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student by name, roll # or school..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* School Filter Dropdown */}
            <div className="flex items-center gap-2 min-w-[220px]">
              <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">All Schools in Batch ({batchStudents.length})</option>
                {batchSchools.map((sc) => {
                  const count = batchStudents.filter((s) => s.schoolId === sc.id).length;
                  return (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Group by School Toggle */}
            <button
              type="button"
              onClick={() => setGroupBySchool(!groupBySchool)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                groupBySchool
                  ? 'bg-light-indigo text-white border-light-indigo shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Group by School</span>
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold transition-all border ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              All Students ({eligibleStudents.length})
            </button>

            <button
              onClick={() => setStatusFilter('received')}
              className={`px-3 py-1 rounded-xl font-bold transition-all border ${
                statusFilter === 'received'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
              }`}
            >
              Received ({sheetStats.receivedCount})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-xl font-bold transition-all border ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
              }`}
            >
              Needs Handout ({sheetStats.pendingCount})
            </button>

            <button
              onClick={() => setStatusFilter('absent_needs_handout')}
              className={`px-3 py-1 rounded-xl font-bold transition-all border ${
                statusFilter === 'absent_needs_handout'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-purple-50/60 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/40'
              }`}
            >
              Absent (Needs Pickup)
            </button>

            <button
              onClick={() => setStatusFilter('extra_copy')}
              className={`px-3 py-1 rounded-xl font-bold transition-all border ${
                statusFilter === 'extra_copy'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-blue-50/60 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40'
              }`}
            >
              Extra Copies Given
            </button>
          </div>
        </div>
      )}

      {/* STUDENT DISTRIBUTION ROSTER */}
      {activeSheet && (
        <div className="space-y-4">
          {displayedStudents.length === 0 ? (
            <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-400 text-xs">
              No students match the current filter criteria.
            </div>
          ) : groupBySchool ? (
            /* GROUPED BY SCHOOL VIEW */
            studentsBySchool.map(([schoolName, schoolStudents]) => {
              const schoolReceived = schoolStudents.filter((s) =>
                activeSheet.receivedByStudentIds?.includes(s.id)
              ).length;
              const schoolPct =
                schoolStudents.length > 0 ? Math.round((schoolReceived / schoolStudents.length) * 100) : 0;

              return (
                <div
                  key={schoolName}
                  className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs overflow-hidden"
                >
                  {/* School Group Header */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-dark-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {schoolName}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {schoolReceived} / {schoolStudents.length} Received ({schoolPct}%)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const ids = schoolStudents.map((s) => s.id);
                        bulkUpdateSheetDistribution(activeSheet.id, ids, 'received');
                      }}
                      className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline"
                    >
                      + Mark All in School Received
                    </button>
                  </div>

                  {/* Student Cards in this School */}
                  <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {schoolStudents.map((stu) => {
                      const isReceived = activeSheet.receivedByStudentIds?.includes(stu.id);
                      const detailed = activeSheet.studentStatuses?.[stu.id];
                      const status = detailed?.status || (isReceived ? 'received' : 'pending');

                      return (
                        <div
                          key={stu.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                            isReceived
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : status === 'absent_needs_handout'
                              ? 'bg-purple-500/10 border-purple-500/30'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                {stu.publicRollNo}
                              </span>
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                {stu.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                              {detailed?.remarks || (isReceived ? 'Handed out in class' : 'Pending pickup')}
                            </div>
                          </div>

                          {/* Quick Toggle Button */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => toggleSheetDistributed(activeSheet.id, stu.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                                isReceived
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-emerald-500'
                              }`}
                            >
                              {isReceived ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Given</span>
                                </>
                              ) : (
                                <span>Needs</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            /* FLAT GRID VIEW */
            <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {displayedStudents.map((stu) => {
                  const isReceived = activeSheet.receivedByStudentIds?.includes(stu.id);

                  return (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => toggleSheetDistributed(activeSheet.id, stu.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all text-left ${
                        isReceived
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-emerald-500'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {stu.publicRollNo}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {stu.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                          {stu.schoolName}
                        </span>
                      </div>

                      {isReceived ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">
                          Needs
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW LECTURE SHEET MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-lg border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Log New Lecture Sheet Handout
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSheet} className="p-6 space-y-4">
              {/* Sheet Code and Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sheet Code / Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newSheetNum}
                    onChange={(e) => setNewSheetNum(e.target.value)}
                    placeholder="e.g. Sheet #06"
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Handout Type
                  </label>
                  <select
                    value={newSheetType}
                    onChange={(e) => setNewSheetType(e.target.value as LectureSheetType)}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="lecture_note">Lecture Note / Rule Sheet</option>
                    <option value="practice_sheet">Practice Exercise Set</option>
                    <option value="solution_sheet">Board Solves / Solution</option>
                    <option value="exam_paper">Exam Question Paper</option>
                    <option value="formula_sheet">Formula & Vocab Sheet</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sheet Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Modifiers Advanced Mastery & Board Questions Solves"
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Stock and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Physical Copies Printed
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newTotalPrinted}
                    onChange={(e) => setNewTotalPrinted(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
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
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Syllabus Scheme Linkage */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-light-indigo" />
                  <span>Link to Syllabus Scheme (Optional)</span>
                </span>

                <select
                  value={newSelectedSchemeId}
                  onChange={(e) => setNewSelectedSchemeId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">No Scheme Link / Independent Sheet</option>
                  {batchSchemes.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.title} ({sch.termType.replace('_', ' ').toUpperCase()})
                    </option>
                  ))}
                </select>

                {/* Topics from selected scheme */}
                {newSelectedSchemeId && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Select Topics covered by this sheet:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                      {batchSchemes
                        .find((s) => s.id === newSelectedSchemeId)
                        ?.topics.map((top) => {
                          const isSelected = newSelectedTopics.includes(top.title);
                          return (
                            <button
                              key={top.id}
                              type="button"
                              onClick={() => {
                                setNewSelectedTopics((prev) =>
                                  isSelected ? prev.filter((t) => t !== top.title) : [...prev, top.title]
                                );
                              }}
                              className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${
                                isSelected
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {top.title}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Out of Syllabus Custom Topic Input */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    + Add Out-of-Syllabus Custom Topic Tag:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newCustomTopic}
                      onChange={(e) => setNewCustomTopic(e.target.value)}
                      placeholder="e.g. Special Extra Exercise"
                      className="flex-1 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCustomTopic.trim() && !newCustomTopicsList.includes(newCustomTopic.trim())) {
                          setNewCustomTopicsList((prev) => [...prev, newCustomTopic.trim()]);
                          setNewCustomTopic('');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-2xs"
                    >
                      Add
                    </button>
                  </div>

                  {newCustomTopicsList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {newCustomTopicsList.map((ct, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        >
                          <span>{ct}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setNewCustomTopicsList((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="hover:text-red-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Target Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Distribution Scope
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setNewTargetType('whole_batch')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      newTargetType === 'whole_batch'
                        ? 'bg-light-indigo text-white border-light-indigo shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Entire Batch ({batchStudents.length} Students)
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTargetType('specific_schools')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      newTargetType === 'specific_schools'
                        ? 'bg-light-indigo text-white border-light-indigo shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Specific Schools in Batch
                  </button>
                </div>

                {newTargetType === 'specific_schools' && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Select Target Schools:
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {batchSchools.map((sc) => {
                        const isChecked = newTargetSchoolIds.includes(sc.id);
                        return (
                          <label key={sc.id} className="inline-flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setNewTargetSchoolIds((prev) =>
                                  isChecked ? prev.filter((id) => id !== sc.id) : [...prev, sc.id]
                                );
                              }}
                              className="rounded text-light-indigo focus:ring-light-indigo w-3.5 h-3.5"
                            />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {sc.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Auto Mark Present Attendees */}
              {latestSession && (
                <label className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoMarkPresentFromLatestSession}
                    onChange={(e) => setAutoMarkPresentFromLatestSession(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-600 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Auto-mark present students from session on {latestSession.date}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Instantly marks students who attended that class as received!
                    </span>
                  </div>
                </label>
              )}

              {/* Modal Buttons */}
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
                  Save & Log Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
