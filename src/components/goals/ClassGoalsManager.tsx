import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import {
  BatchMonthlyGoal,
  MonthlyClassSlot,
  ClassSlotStatus,
  WeeklySlot,
  WeeklyDay,
} from '../../types/models';
import {
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileSpreadsheet,
  X,
  Trash2,
  Layers,
  ArrowRight,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ClassGoalsManager: React.FC = () => {
  const {
    batches,
    classGoals,
    sessions,
    saveBatchMonthlyGoal,
    deleteBatchMonthlyGoal,
    updateClassSlotStatus,
  } = useData();

  const { confirm, alert } = useModal();

  // Selected Batch
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');

  // Selected Year & Month (Default to current month, e.g. 2026-10)
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // Filter for class slot list
  const [slotStatusFilter, setSlotStatusFilter] = useState<'all' | ClassSlotStatus>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
  const [slotToCancel, setSlotToCancel] = useState<MonthlyClassSlot | null>(null);
  const [slotToReschedule, setSlotToReschedule] = useState<MonthlyClassSlot | null>(null);

  // Generation Modal State
  const [genPreset, setGenPreset] = useState<'full_month' | 'from_today' | 'custom'>('from_today');
  const [genCustomStartDate, setGenCustomStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Cancellation Modal State
  const [cancelReason, setCancelReason] = useState<string>('');
  const [addMakeupForCancel, setAddMakeupForCancel] = useState<boolean>(true);
  const [makeupDate, setMakeupDate] = useState<string>('');
  const [makeupStartTime, setMakeupStartTime] = useState<string>('16:00');
  const [makeupEndTime, setMakeupEndTime] = useState<string>('17:30');

  // Reschedule Modal State
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState<string>('16:00');
  const [rescheduleEndTime, setRescheduleEndTime] = useState<string>('17:30');

  // Add Custom / Extra Slot Modal State
  const [newSlotDate, setNewSlotDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newSlotStartTime, setNewSlotStartTime] = useState<string>('16:00');
  const [newSlotEndTime, setNewSlotEndTime] = useState<string>('17:30');
  const [newSlotType, setNewSlotType] = useState<'extra' | 'makeup'>('extra');
  const [newSlotTopic, setNewSlotTopic] = useState<string>('');

  // Active Batch
  const activeBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  // Active Monthly Goal for selected batch and yearMonth
  const activeGoal = useMemo(() => {
    return classGoals.find(
      (g) => g.batchId === selectedBatchId && g.yearMonth === currentYearMonth
    );
  }, [classGoals, selectedBatchId, currentYearMonth]);

  // Parse Month Details
  const [year, month] = currentYearMonth.split('-').map(Number);
  const monthDate = new Date(year, month - 1, 1);
  const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  // Navigate months
  const handlePrevMonth = () => {
    const prev = new Date(year, month - 2, 1);
    const y = prev.getFullYear();
    const m = String(prev.getMonth() + 1).padStart(2, '0');
    setCurrentYearMonth(`${y}-${m}`);
  };

  const handleNextMonth = () => {
    const next = new Date(year, month, 1);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, '0');
    setCurrentYearMonth(`${y}-${m}`);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setCurrentYearMonth(`${y}-${m}`);
  };

  // Generate / Apply Routine Schedule
  const handleGenerateRoutineGoal = async () => {
    if (!activeBatch) return;

    if (!activeBatch.weeklyRoutine || activeBatch.weeklyRoutine.length === 0) {
      await alert({
        title: 'Weekly Routine Missing',
        message: `Batch "${activeBatch.name}" does not have any routine days set yet. Please configure the weekly routine in "Batches & Routine" first.`,
        variant: 'warning',
      });
      return;
    }

    // Determine start date
    let startDayNum = 1;
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;

    if (genPreset === 'from_today') {
      startDayNum = isCurrentMonth ? now.getDate() : 1;
    } else if (genPreset === 'custom' && genCustomStartDate) {
      const parsed = new Date(genCustomStartDate);
      if (parsed.getFullYear() === year && parsed.getMonth() + 1 === month) {
        startDayNum = parsed.getDate();
      }
    }

    // Preserve any slots from earlier dates if already existing
    const existingSlots = activeGoal?.slots || [];
    const preservedSlots = existingSlots.filter((s) => {
      const slotDay = Number(s.date.split('-')[2]);
      return slotDay < startDayNum;
    });

    const newGeneratedSlots: MonthlyClassSlot[] = [];

    // Map routine by dayOfWeek
    const routineMap = new Map<WeeklyDay, WeeklySlot>();
    activeBatch.weeklyRoutine.forEach((r) => routineMap.set(r.dayOfWeek, r));

    for (let day = startDayNum; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      const dayOfWeek = d.getDay() as WeeklyDay;

      if (routineMap.has(dayOfWeek)) {
        const slot = routineMap.get(dayOfWeek)!;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Auto-check if a ClassSession was already recorded for this batch on this date
        const matchedSession = sessions.find(
          (s) => s.batchId === activeBatch.id && s.date === dateStr
        );

        newGeneratedSlots.push({
          id: `slot-${activeBatch.id}-${dateStr}`,
          date: dateStr,
          dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotType: 'routine',
          status: matchedSession ? 'completed' : 'scheduled',
          sessionId: matchedSession?.id,
          customTopicTitle: matchedSession?.topicsTaught?.join(', ') || undefined,
          createdAt: Date.now(),
        });
      }
    }

    const allSlots = [...preservedSlots, ...newGeneratedSlots].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const goalId = `goal-${activeBatch.id}-${currentYearMonth}`;
    const newGoal: BatchMonthlyGoal = {
      id: goalId,
      batchId: activeBatch.id,
      yearMonth: currentYearMonth,
      monthName,
      targetClassCount: allSlots.length,
      startFromDate: `${year}-${String(month).padStart(2, '0')}-${String(startDayNum).padStart(2, '0')}`,
      weeklyRoutineSnapshot: activeBatch.weeklyRoutine,
      slots: allSlots,
      createdAt: activeGoal?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await saveBatchMonthlyGoal(newGoal);
    setIsGenerateModalOpen(false);
  };

  // Add Custom / Extra / Makeup Slot
  const handleAddCustomSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotDate) return;

    const d = new Date(newSlotDate);
    const dayOfWeek = d.getDay() as WeeklyDay;
    const slotId = `slot-${selectedBatchId}-${newSlotDate}-${Date.now().toString(36)}`;

    // Auto-check if session exists
    const matchedSession = sessions.find(
      (s) => s.batchId === selectedBatchId && s.date === newSlotDate
    );

    const newSlot: MonthlyClassSlot = {
      id: slotId,
      date: newSlotDate,
      dayOfWeek,
      startTime: newSlotStartTime,
      endTime: newSlotEndTime,
      slotType: newSlotType,
      status: matchedSession ? 'completed' : 'scheduled',
      sessionId: matchedSession?.id,
      customTopicTitle: newSlotTopic.trim() || undefined,
      createdAt: Date.now(),
    };

    const currentSlots = activeGoal?.slots || [];
    const updatedSlots = [...currentSlots, newSlot].sort((a, b) => a.date.localeCompare(b.date));

    const goalId = activeGoal?.id || `goal-${selectedBatchId}-${currentYearMonth}`;
    const updatedGoal: BatchMonthlyGoal = {
      id: goalId,
      batchId: selectedBatchId,
      yearMonth: currentYearMonth,
      monthName,
      targetClassCount: updatedSlots.length,
      startFromDate: activeGoal?.startFromDate || `${currentYearMonth}-01`,
      weeklyRoutineSnapshot: activeGoal?.weeklyRoutineSnapshot || activeBatch?.weeklyRoutine || [],
      slots: updatedSlots,
      createdAt: activeGoal?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await saveBatchMonthlyGoal(updatedGoal);
    setIsAddSlotModalOpen(false);
    setNewSlotTopic('');
  };

  // Confirm Cancellation
  const handleConfirmCancel = async () => {
    if (!activeGoal || !slotToCancel) return;

    // Update canceled slot
    const updates: Partial<MonthlyClassSlot> = {
      cancellationReason: cancelReason.trim() || 'Canceled by tutor',
      notes: addMakeupForCancel && makeupDate ? `Makeup arranged on ${makeupDate}` : undefined,
    };

    let updatedSlots = activeGoal.slots.map((s) => {
      if (s.id === slotToCancel.id) {
        return { ...s, status: 'canceled' as const, ...updates };
      }
      return s;
    });

    // If tutor opted to add makeup class
    if (addMakeupForCancel && makeupDate) {
      const d = new Date(makeupDate);
      const dayOfWeek = d.getDay() as WeeklyDay;
      const makeupSlot: MonthlyClassSlot = {
        id: `slot-makeup-${Date.now().toString(36)}`,
        date: makeupDate,
        dayOfWeek,
        startTime: makeupStartTime,
        endTime: makeupEndTime,
        slotType: 'makeup',
        status: 'scheduled',
        customTopicTitle: `Makeup for ${slotToCancel.date} (${slotToCancel.customTopicTitle || 'Regular Class'})`,
        notes: `Makeup for canceled class on ${slotToCancel.date}`,
        createdAt: Date.now(),
      };
      updatedSlots.push(makeupSlot);
      updatedSlots.sort((a, b) => a.date.localeCompare(b.date));
    }

    const updatedGoal: BatchMonthlyGoal = {
      ...activeGoal,
      targetClassCount: updatedSlots.length,
      slots: updatedSlots,
      updatedAt: Date.now(),
    };

    await saveBatchMonthlyGoal(updatedGoal);
    setSlotToCancel(null);
    setCancelReason('');
  };

  // Confirm Reschedule
  const handleConfirmReschedule = async () => {
    if (!activeGoal || !slotToReschedule || !rescheduleDate) return;

    const updates: Partial<MonthlyClassSlot> = {
      rescheduledToDate: rescheduleDate,
      rescheduledToTime: `${rescheduleStartTime} - ${rescheduleEndTime}`,
      notes: `Rescheduled to ${rescheduleDate} at ${rescheduleStartTime}`,
    };

    // Update original slot to rescheduled
    let updatedSlots = activeGoal.slots.map((s) => {
      if (s.id === slotToReschedule.id) {
        return { ...s, status: 'rescheduled' as const, ...updates };
      }
      return s;
    });

    // Add replacement slot on new date
    const d = new Date(rescheduleDate);
    const dayOfWeek = d.getDay() as WeeklyDay;
    const replacementSlot: MonthlyClassSlot = {
      id: `slot-rescheduled-${Date.now().toString(36)}`,
      date: rescheduleDate,
      dayOfWeek,
      startTime: rescheduleStartTime,
      endTime: rescheduleEndTime,
      slotType: 'makeup',
      status: 'scheduled',
      customTopicTitle: `${slotToReschedule.customTopicTitle || 'Class'} (Moved from ${slotToReschedule.date})`,
      notes: `Moved from original routine date ${slotToReschedule.date}`,
      createdAt: Date.now(),
    };

    updatedSlots.push(replacementSlot);
    updatedSlots.sort((a, b) => a.date.localeCompare(b.date));

    const updatedGoal: BatchMonthlyGoal = {
      ...activeGoal,
      slots: updatedSlots,
      updatedAt: Date.now(),
    };

    await saveBatchMonthlyGoal(updatedGoal);
    setSlotToReschedule(null);
    setRescheduleDate('');
  };

  // Delete Slot
  const handleDeleteSlot = async (slotId: string, date: string) => {
    if (!activeGoal) return;
    const ok = await confirm({
      title: 'Remove Scheduled Slot',
      message: `Remove class slot for ${date}? This will adjust your monthly schedule.`,
      confirmText: 'Remove Slot',
      variant: 'danger',
    });

    if (ok) {
      const updatedSlots = activeGoal.slots.filter((s) => s.id !== slotId);
      const updatedGoal: BatchMonthlyGoal = {
        ...activeGoal,
        targetClassCount: updatedSlots.length,
        slots: updatedSlots,
        updatedAt: Date.now(),
      };
      await saveBatchMonthlyGoal(updatedGoal);
    }
  };

  // Copy WhatsApp Monthly Class Schedule Notice
  const handleCopyScheduleNotice = () => {
    if (!activeBatch || !activeGoal) return;

    const completed = activeGoal.slots.filter((s) => s.status === 'completed').length;
    const scheduled = activeGoal.slots.filter((s) => s.status === 'scheduled').length;

    let scheduleListText = '';
    activeGoal.slots.forEach((s) => {
      const statusIcon =
        s.status === 'completed'
          ? '✅ Held'
          : s.status === 'canceled'
          ? '❌ Canceled'
          : s.status === 'postponed'
          ? '⏸️ Postponed'
          : '📅 Upcoming';

      scheduleListText += `\n• *${s.date}* (${DAY_SHORT_NAMES[s.dayOfWeek]} ${s.startTime}): ${statusIcon}${s.customTopicTitle ? ` — ${s.customTopicTitle}` : ''}`;
    });

    const text = `📢 *MONTHLY CLASS ROUTINE & TARGET PROGRESS*
🏛️ *Batch:* ${activeBatch.name} (${activeBatch.courseTag})
🗓️ *Month:* ${activeGoal.monthName}
🎯 *Monthly Target:* ${activeGoal.targetClassCount} Classes (${completed} Completed, ${scheduled} Remaining)

📝 *Class Schedule:*${scheduleListText}

_Please be on time and come prepared with lecture notes and homework._`;

    navigator.clipboard.writeText(text);
    setCopiedText('schedule');
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Copy WhatsApp Cancellation Notice
  const handleCopyCancellationNotice = (slot: MonthlyClassSlot) => {
    const text = `⚠️ *CLASS CANCELLATION NOTICE*
🏛️ *Batch:* ${activeBatch?.name}
📅 *Date:* ${slot.date} (${DAY_NAMES[slot.dayOfWeek]})
⏰ *Routine Time:* ${slot.startTime} - ${slot.endTime}

Reason: ${slot.cancellationReason || 'Due to unavoidable circumstances.'}
${slot.notes ? `📌 *Makeup Plan:* ${slot.notes}` : 'A makeup session will be scheduled soon.'}

Thank you for your understanding.`;

    navigator.clipboard.writeText(text);
    setCopiedText(`cancel-${slot.id}`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Statistics calculation
  const slots = activeGoal?.slots || [];
  const targetCount = activeGoal?.targetClassCount || slots.length;
  const completedSlots = slots.filter((s) => s.status === 'completed');
  const completedCount = completedSlots.length;
  const scheduledCount = slots.filter((s) => s.status === 'scheduled').length;
  const canceledCount = slots.filter((s) => s.status === 'canceled').length;
  const postponedCount = slots.filter((s) => s.status === 'postponed').length;
  const rescheduledCount = slots.filter((s) => s.status === 'rescheduled').length;
  const makeupCount = slots.filter((s) => s.slotType === 'makeup').length;

  const progressPct = targetCount > 0 ? Math.min(100, Math.round((completedCount / targetCount) * 100)) : 0;

  // Filtered Slots
  const filteredSlots = useMemo(() => {
    if (slotStatusFilter === 'all') return slots;
    return slots.filter((s) => s.status === slotStatusFilter);
  }, [slots, slotStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Target className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Class Goals & Routine Progress
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Calculate month-wise class targets, track completed sessions, handle cancellations & reschedules, and monitor pacing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeGoal && (
            <button
              onClick={handleCopyScheduleNotice}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface hover:bg-slate-50 text-slate-700 dark:text-slate-300 shadow-2xs transition-all"
            >
              {copiedText === 'schedule' ? (
                <>
                  <Check className="w-4 h-4 text-weird-green" />
                  <span className="text-weird-green">Copied Notice</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Share Schedule</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setIsAddSlotModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-dark-surface border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-800 dark:text-slate-200 shadow-2xs transition-all"
          >
            <Plus className="w-4 h-4 text-amber-500" />
            <span>+ Add Extra / Makeup Class</span>
          </button>

          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/25 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{activeGoal ? 'Re-calculate Routine Goal' : '⚡ Set Monthly Routine Goal'}</span>
          </button>
        </div>
      </div>

      {/* Control Strip: Batch Selector & Month Navigator */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Batch Selector */}
          <div className="flex-1 max-w-md">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Selected Batch</span>
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

          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center min-w-[150px]">
              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                <span>{monthName}</span>
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleCurrentMonth}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface hover:bg-slate-50 text-slate-700 dark:text-slate-300"
            >
              This Month
            </button>
          </div>
        </div>

        {/* Weekly Routine Pills Display */}
        {activeBatch && (
          <div className="pt-2 border-t border-slate-100 dark:border-dark-border flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
              Weekly Routine Schedule:
            </span>
            {activeBatch.weeklyRoutine && activeBatch.weeklyRoutine.length > 0 ? (
              activeBatch.weeklyRoutine.map((slot, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-[11px]"
                >
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>
                    <strong>{DAY_NAMES[slot.dayOfWeek]}</strong>: {slot.startTime} - {slot.endTime}
                  </span>
                </span>
              ))
            ) : (
              <span className="text-slate-400 italic text-[11px]">No weekly routine configured for this batch</span>
            )}
          </div>
        )}
      </div>

      {/* Batch-Wise Clean KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Planned Target */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Monthly Goal Target
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {targetCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">classes</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {activeGoal ? `Set from ${activeGoal.startFromDate}` : 'No goal generated'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Conducted / Completed */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Completed Classes
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-wintergreen">
                {completedCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">of {targetCount}</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-wintergreen font-bold block mt-0.5">
              {progressPct}% completion rate
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-wintergreen flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Remaining to Conduct */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Remaining to Conduct
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-sky-600 dark:text-spiro-disco-ball">
                {scheduledCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">ahead</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Scheduled on routine
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-spiro-disco-ball flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Adjustments & Pace */}
        <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pacing & Adjustments
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                {canceledCount > 0 ? `${canceledCount} Canceled` : '100% On Routine'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {makeupCount > 0
                ? `${makeupCount} makeup class added`
                : canceledCount > 0
                ? 'Suggest adding makeup class'
                : 'No disruptions'}
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              canceledCount > 0
                ? 'bg-red-500/10 text-red-600 dark:text-light-red'
                : 'bg-indigo-500/10 text-light-indigo'
            }`}
          >
            {canceledCount > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* Visual Progress Bar Strip */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-amber-500" />
            <span>Monthly Pacing:</span>
            <strong className="text-slate-900 dark:text-white">
              {completedCount} of {targetCount} classes completed
            </strong>
          </span>
          <span className="text-xs font-black text-amber-600 dark:text-amber-400">
            {progressPct}% Target Achieved
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Class Schedule Slots Section */}
      <div className="space-y-3">
        {/* Filter Tabs */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSlotStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                slotStatusFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-dark-surface text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              All Slots ({slots.length})
            </button>
            <button
              onClick={() => setSlotStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                slotStatusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 hover:bg-emerald-100'
              }`}
            >
              <span>Completed ({completedCount})</span>
            </button>
            <button
              onClick={() => setSlotStatusFilter('scheduled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                slotStatusFilter === 'scheduled'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 hover:bg-sky-100'
              }`}
            >
              <span>Upcoming ({scheduledCount})</span>
            </button>
            {canceledCount > 0 && (
              <button
                onClick={() => setSlotStatusFilter('canceled')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                  slotStatusFilter === 'canceled'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200/60 hover:bg-red-100'
                }`}
              >
                <span>Canceled ({canceledCount})</span>
              </button>
            )}
            {makeupCount > 0 && (
              <button
                onClick={() => setSlotStatusFilter('makeup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                  slotStatusFilter === 'makeup'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 hover:bg-purple-100'
                }`}
              >
                <span>Makeup / Extra ({makeupCount})</span>
              </button>
            )}
          </div>

          <span className="text-xs text-slate-400 font-semibold">
            {filteredSlots.length} slot{filteredSlots.length === 1 ? '' : 's'} displayed
          </span>
        </div>

        {/* Slots List */}
        {filteredSlots.length === 0 ? (
          <div className="bg-white dark:bg-dark-surface p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <CalendarDays className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No class slots scheduled for {monthName} yet.
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Click &quot;⚡ Set Monthly Routine Goal&quot; above to automatically count and generate slots from your weekly routine.
            </p>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-600 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply Schedule & Set Goal</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredSlots.map((slot) => {
              const [sY, sM, sD] = slot.date.split('-');
              const isToday =
                new Date().toISOString().split('T')[0] === slot.date;

              const getStatusBadge = () => {
                switch (slot.status) {
                  case 'completed':
                    return {
                      label: 'Completed',
                      bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-wintergreen border-emerald-300/60',
                      icon: CheckCircle2,
                    };
                  case 'canceled':
                    return {
                      label: 'Canceled',
                      bg: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-light-red border-red-300/60',
                      icon: AlertTriangle,
                    };
                  case 'postponed':
                    return {
                      label: 'Postponed',
                      bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300/60',
                      icon: Clock,
                    };
                  case 'rescheduled':
                    return {
                      label: 'Rescheduled',
                      bg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300/60',
                      icon: RotateCcw,
                    };
                  default:
                    return {
                      label: 'Scheduled',
                      bg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300/60',
                      icon: Calendar,
                    };
                }
              };

              const statusBadge = getStatusBadge();
              const StatusIcon = statusBadge.icon;

              return (
                <div
                  key={slot.id}
                  className={`bg-white dark:bg-dark-surface rounded-2xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isToday
                      ? 'border-amber-500 shadow-md ring-1 ring-amber-500/20'
                      : slot.status === 'completed'
                      ? 'border-emerald-200/80 dark:border-emerald-900/40 shadow-xs'
                      : slot.status === 'canceled'
                      ? 'border-red-200/80 dark:border-red-900/40 opacity-80'
                      : 'border-slate-200/80 dark:border-dark-border shadow-xs'
                  }`}
                >
                  {/* Left: Date, Time & Topic */}
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Date Block */}
                    <div
                      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                        isToday
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                          : slot.status === 'completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                        {DAY_SHORT_NAMES[slot.dayOfWeek]}
                      </span>
                      <span className="text-lg font-black leading-tight mt-0.5">{sD}</span>
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </span>

                        {isToday && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-full bg-amber-500 text-slate-950">
                            Today
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-md border ${
                            slot.slotType === 'makeup'
                              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200'
                              : slot.slotType === 'extra'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200'
                          }`}
                        >
                          {slot.slotType === 'makeup'
                            ? 'Makeup Slot'
                            : slot.slotType === 'extra'
                            ? 'Extra Class'
                            : 'Routine Class'}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full border ${statusBadge.bg}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusBadge.label}</span>
                        </span>
                      </div>

                      {/* Topic or Cancellation Notice */}
                      <div className="mt-1">
                        {slot.status === 'canceled' ? (
                          <p className="text-xs text-red-600 dark:text-light-red font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Reason: {slot.cancellationReason || 'Canceled by tutor'}</span>
                            {slot.notes && (
                              <span className="text-slate-500 text-[11px] font-normal">
                                ({slot.notes})
                              </span>
                            )}
                          </p>
                        ) : slot.status === 'rescheduled' ? (
                          <p className="text-xs text-purple-600 dark:text-purple-300 font-semibold flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                            <span>Moved to: {slot.rescheduledToDate} ({slot.rescheduledToTime})</span>
                          </p>
                        ) : slot.customTopicTitle ? (
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {slot.customTopicTitle}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Regular routine session
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions Menu */}
                  <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                    {/* Mark Completed Toggle */}
                    {slot.status !== 'completed' ? (
                      <button
                        onClick={() =>
                          activeGoal &&
                          updateClassSlotStatus(activeGoal.id, slot.id, 'completed')
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
                        title="Mark session as held & completed"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Held</span>
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          activeGoal &&
                          updateClassSlotStatus(activeGoal.id, slot.id, 'scheduled')
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700"
                        title="Reset to Scheduled"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}

                    {/* Cancel Action */}
                    {slot.status !== 'canceled' && slot.status !== 'completed' && (
                      <button
                        onClick={() => {
                          setSlotToCancel(slot);
                          setCancelReason('');
                          setMakeupDate('');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-light-red hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/60"
                        title="Cancel this class session"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}

                    {/* Reschedule Action */}
                    {slot.status !== 'completed' && slot.status !== 'rescheduled' && (
                      <button
                        onClick={() => {
                          setSlotToReschedule(slot);
                          setRescheduleDate('');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60"
                        title="Reschedule to another day"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reschedule</span>
                      </button>
                    )}

                    {/* Copy WhatsApp cancellation notice if canceled */}
                    {slot.status === 'canceled' && (
                      <button
                        onClick={() => handleCopyCancellationNotice(slot)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100"
                        title="Copy WhatsApp cancellation notice"
                      >
                        {copiedText === `cancel-${slot.id}` ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Remove button if custom/extra slot */}
                    {slot.slotType !== 'routine' && (
                      <button
                        onClick={() => handleDeleteSlot(slot.id, slot.date)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Remove extra slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generation / Apply Routine Goal Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-3xl w-full max-w-lg border border-slate-200 dark:border-dark-border shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Set Monthly Routine Goal
                </h3>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Automatically calculates all class dates in <strong>{monthName}</strong> for{' '}
                <strong>{activeBatch?.name}</strong> matching its weekly routine:
              </p>

              {/* Weekly routine reminder */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 text-xs">
                {activeBatch?.weeklyRoutine?.map((slot, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-dark-surface border text-slate-700 dark:text-slate-300 font-bold"
                  >
                    {DAY_NAMES[slot.dayOfWeek]} ({slot.startTime})
                  </span>
                ))}
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Apply Schedule Range:
                </label>

                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <input
                      type="radio"
                      name="genPreset"
                      checked={genPreset === 'from_today'}
                      onChange={() => setGenPreset('from_today')}
                      className="mt-0.5 text-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Apply from Today to End of Month (Recommended)
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Schedules upcoming routine days from today through the rest of the month, preserving previously completed classes.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <input
                      type="radio"
                      name="genPreset"
                      checked={genPreset === 'full_month'}
                      onChange={() => setGenPreset('full_month')}
                      className="mt-0.5 text-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Full Month (1st of {monthName} to End)
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Generates all routine days for the entire calendar month.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <input
                      type="radio"
                      name="genPreset"
                      checked={genPreset === 'custom'}
                      onChange={() => setGenPreset('custom')}
                      className="mt-0.5 text-amber-500"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Custom Start Date
                      </span>
                      {genPreset === 'custom' && (
                        <input
                          type="date"
                          value={genCustomStartDate}
                          onChange={(e) => setGenCustomStartDate(e.target.value)}
                          className="mt-2 w-full px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                        />
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Note on sync */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-200">
                Any class session already conducted in Live Class Mode on those dates will automatically link and be marked as <strong>Completed</strong>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-border">
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateRoutineGoal}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm"
              >
                Calculate & Set Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {slotToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-3xl w-full max-w-md border border-slate-200 dark:border-dark-border shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Cancel Class Session
                </h3>
              </div>
              <button
                onClick={() => setSlotToCancel(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Cancel scheduled class on <strong>{slotToCancel.date}</strong> (
              {DAY_NAMES[slotToCancel.dayOfWeek]} {slotToCancel.startTime}).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Cancellation:
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Severe Rain & Waterlogging, Tutor Ill, Exam Week..."
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />

                {/* Quick chip reasons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'Severe Weather / Rain',
                    'Tutor Unwell',
                    'School Exam Week',
                    'National Holiday',
                    'Student Request',
                  ].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setCancelReason(r)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-medium"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option to schedule makeup class right away to preserve target */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={addMakeupForCancel}
                    onChange={(e) => setAddMakeupForCancel(e.target.checked)}
                    className="text-amber-500 rounded"
                  />
                  <span>Add a Makeup class slot to keep monthly target goal?</span>
                </label>

                {addMakeupForCancel && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                        Makeup Class Date:
                      </label>
                      <input
                        type="date"
                        value={makeupDate}
                        onChange={(e) => setMakeupDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                        Start Time:
                      </label>
                      <input
                        type="time"
                        value={makeupStartTime}
                        onChange={(e) => setMakeupStartTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                        End Time:
                      </label>
                      <input
                        type="time"
                        value={makeupEndTime}
                        onChange={(e) => setMakeupEndTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-border">
              <button
                type="button"
                onClick={() => setSlotToCancel(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {slotToReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-3xl w-full max-w-md border border-slate-200 dark:border-dark-border shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600">
                  <RotateCcw className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Reschedule Class Session
                </h3>
              </div>
              <button
                onClick={() => setSlotToReschedule(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Reschedule class of <strong>{slotToReschedule.date}</strong> to a new date and time.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Class Date:
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time:
                  </label>
                  <input
                    type="time"
                    value={rescheduleStartTime}
                    onChange={(e) => setRescheduleStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Time:
                  </label>
                  <input
                    type="time"
                    value={rescheduleEndTime}
                    onChange={(e) => setRescheduleEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-border">
              <button
                type="button"
                onClick={() => setSlotToReschedule(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!rescheduleDate}
                onClick={handleConfirmReschedule}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm disabled:opacity-50"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom / Extra Class Modal */}
      {isAddSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-3xl w-full max-w-md border border-slate-200 dark:border-dark-border shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600">
                  <Plus className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Add Extra / Makeup Class
                </h3>
              </div>
              <button
                onClick={() => setIsAddSlotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomSlot} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Class Date *
                </label>
                <input
                  type="date"
                  required
                  value={newSlotDate}
                  onChange={(e) => setNewSlotDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newSlotStartTime}
                    onChange={(e) => setNewSlotStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newSlotEndTime}
                    onChange={(e) => setNewSlotEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Slot Type
                </label>
                <select
                  value={newSlotType}
                  onChange={(e) => setNewSlotType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="extra">Extra Special Class (Marathon / Revision)</option>
                  <option value="makeup">Makeup Class (Replacement for canceled)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Planned Lesson Topic / Focus (Optional)
                </label>
                <input
                  type="text"
                  value={newSlotTopic}
                  onChange={(e) => setNewSlotTopic(e.target.value)}
                  placeholder="e.g. Board Questions Solves Marathon..."
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsAddSlotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm"
                >
                  Add Class Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
