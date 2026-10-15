import React, { useState } from 'react';
import { WeeklyDay, WeeklySlot } from '../../types/models';
import {
  CalendarDays,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface ModernWeeklySchedulePickerProps {
  value: WeeklySlot[];
  onChange: (slots: WeeklySlot[]) => void;
}

const DAYS_CONFIG: { id: WeeklyDay; label: string; short: string }[] = [
  { id: 0, label: 'Sunday', short: 'Sun' },
  { id: 1, label: 'Monday', short: 'Mon' },
  { id: 2, label: 'Tuesday', short: 'Tue' },
  { id: 3, label: 'Wednesday', short: 'Wed' },
  { id: 4, label: 'Thursday', short: 'Thu' },
  { id: 5, label: 'Friday', short: 'Fri' },
  { id: 6, label: 'Saturday', short: 'Sat' },
];

// Popular Bangladesh / Tuition batch standard times
const POPULAR_TIME_PRESETS = [
  { label: '04:00 PM – 05:30 PM (Evening)', start: '16:00', end: '17:30' },
  { label: '05:30 PM – 07:00 PM (Late Eve)', start: '17:30', end: '19:00' },
  { label: '03:00 PM – 04:30 PM (Afternoon)', start: '15:00', end: '16:30' },
  { label: '07:00 PM – 08:30 PM (Night)', start: '19:00', end: '20:30' },
  { label: '10:00 AM – 11:30 AM (Morning)', start: '10:00', end: '11:30' },
  { label: '11:30 AM – 01:00 PM (Mid-day)', start: '11:30', end: '13:00' },
];

const ROUTINE_PRESETS: {
  name: string;
  days: WeeklyDay[];
  start: string;
  end: string;
  desc: string;
}[] = [
  {
    name: 'Sun - Tue - Thu',
    days: [0, 2, 4],
    start: '16:00',
    end: '17:30',
    desc: '3 Days (4:00 - 5:30 PM)',
  },
  {
    name: 'Mon - Wed - Fri',
    days: [1, 3, 5],
    start: '16:00',
    end: '17:30',
    desc: '3 Days (4:00 - 5:30 PM)',
  },
  {
    name: 'Fri - Sat (Weekend)',
    days: [5, 6],
    start: '10:00',
    end: '11:30',
    desc: '2 Days (10:00 - 11:30 AM)',
  },
];

// 24hr string to 12hr display
export const formatTime12h = (time24: string): string => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const minuteDisplay = m < 10 ? `0${m}` : `${m}`;
  const hourDisplay = h < 10 ? `0${h}` : `${h}`;
  return `${hourDisplay}:${minuteDisplay} ${period}`;
};

// 12hr components to 24hr string
const formatTime24h = (hour12: number, minute: number, period: 'AM' | 'PM'): string => {
  let h = hour12 % 12;
  if (period === 'PM') h += 12;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  const mStr = minute < 10 ? `0${minute}` : `${minute}`;
  return `${hStr}:${mStr}`;
};

// Compute end time given start time + duration minutes
const addMinutesToTime = (time24: string, durationMinutes: number): string => {
  const [hStr, mStr] = time24.split(':');
  const totalMin = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + durationMinutes;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${endH < 10 ? '0' : ''}${endH}:${endM < 10 ? '0' : ''}${endM}`;
};

export const ModernWeeklySchedulePicker: React.FC<ModernWeeklySchedulePickerProps> = ({
  value,
  onChange,
}) => {
  const [selectedDayForEdit, setSelectedDayForEdit] = useState<WeeklyDay | null>(null);
  const [customStartHour, setCustomStartHour] = useState<number>(4);
  const [customStartMinute, setCustomStartMinute] = useState<number>(0);
  const [customStartPeriod, setCustomStartPeriod] = useState<'AM' | 'PM'>('PM');
  const [customDuration, setCustomDuration] = useState<number>(90); // 90 mins = 1.5 hrs
  const [showCustomTimeBuilder, setShowCustomTimeBuilder] = useState(false);

  // Check if a day is currently scheduled
  const getSlotForDay = (day: WeeklyDay): WeeklySlot | undefined => {
    return value.find((s) => s.dayOfWeek === day);
  };

  // Toggle a day on/off with 1 click
  const handleToggleDay = (day: WeeklyDay) => {
    const existing = getSlotForDay(day);
    if (existing) {
      // Remove day
      onChange(value.filter((s) => s.dayOfWeek !== day));
      if (selectedDayForEdit === day) setSelectedDayForEdit(null);
    } else {
      // Add day with default or last used time
      const referenceSlot = value[0] || { startTime: '16:00', endTime: '17:30' };
      const newSlot: WeeklySlot = {
        dayOfWeek: day,
        startTime: referenceSlot.startTime,
        endTime: referenceSlot.endTime,
      };
      // Keep sorted by day of week
      const updated = [...value, newSlot].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      onChange(updated);
      setSelectedDayForEdit(day);
    }
  };

  // Apply one-click preset routine (e.g., Mon-Wed-Fri)
  const handleApplyPreset = (preset: (typeof ROUTINE_PRESETS)[0]) => {
    const newSlots: WeeklySlot[] = preset.days.map((d) => ({
      dayOfWeek: d,
      startTime: preset.start,
      endTime: preset.end,
    }));
    onChange(newSlots);
    setSelectedDayForEdit(preset.days[0]);
  };

  // Apply a time preset to the currently selected day or all active days
  const handleApplyTimePreset = (
    start: string,
    end: string,
    applyToAll: boolean = false
  ) => {
    if (applyToAll || selectedDayForEdit === null) {
      // Apply to all active days
      const updated = value.map((s) => ({
        ...s,
        startTime: start,
        endTime: end,
      }));
      onChange(updated);
    } else {
      // Apply to specific day
      const updated = value.map((s) =>
        s.dayOfWeek === selectedDayForEdit ? { ...s, startTime: start, endTime: end } : s
      );
      onChange(updated);
    }
  };

  // Apply custom built time
  const handleApplyCustomTime = (applyToAll: boolean = false) => {
    const start24 = formatTime24h(customStartHour, customStartMinute, customStartPeriod);
    const end24 = addMinutesToTime(start24, customDuration);
    handleApplyTimePreset(start24, end24, applyToAll);
    setShowCustomTimeBuilder(false);
  };

  // Remove a single slot
  const handleRemoveSlot = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const activeDaysCount = value.length;

  return (
    <div className="border border-slate-200/90 dark:border-dark-border rounded-2xl p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-900/50 space-y-4">
      {/* Header & Quick Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200/60 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-light-indigo/15 text-light-indigo dark:text-spiro-disco-ball flex items-center justify-center font-bold">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>Weekly Routine Schedule</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-light-indigo/10 text-light-indigo dark:text-neon-blue border border-light-indigo/20">
                {activeDaysCount} {activeDaysCount === 1 ? 'day' : 'days'} / week
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Click any day on the calendar to toggle classes, or select popular time presets with 1 click.
            </p>
          </div>
        </div>

        {/* 1-Click Routine Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ROUTINE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs flex items-center gap-1"
            >
              <Sparkles className="w-2.5 h-2.5 text-radiant-yellow" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 7-Day Visual Calendar Strip */}
      <div>
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
          Interactive Weekly Calendar (Click Day to Toggle)
        </label>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAYS_CONFIG.map((day) => {
            const slot = getSlotForDay(day.id);
            const isSelected = selectedDayForEdit === day.id;
            const isActive = !!slot;

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => handleToggleDay(day.id)}
                className={`flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer relative min-h-[72px] ${
                  isActive
                    ? 'bg-light-indigo/10 dark:bg-light-indigo/20 border-light-indigo dark:border-spiro-disco-ball shadow-xs'
                    : 'bg-white dark:bg-dark-surface border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-75 hover:opacity-100'
                } ${isSelected ? 'ring-2 ring-light-indigo ring-offset-1 dark:ring-offset-dark-base' : ''}`}
              >
                {/* Day Tag */}
                <div className="flex items-center justify-center gap-1 w-full">
                  <span
                    className={`text-xs font-black uppercase ${
                      isActive
                        ? 'text-light-indigo dark:text-spiro-disco-ball'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {day.short}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-weird-green animate-pulse" />
                  )}
                </div>

                {/* Scheduled Time or Off indicator */}
                <div className="mt-1 w-full text-center">
                  {slot ? (
                    <div className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      <div>{formatTime12h(slot.startTime)}</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400">
                        to {formatTime12h(slot.endTime)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      Off
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1-Click Fast Time Slot Selection */}
      <div className="bg-white dark:bg-dark-surface p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Clock className="w-3.5 h-3.5 text-spiro-disco-ball" />
            <span>1-Click Time Selection</span>
            {selectedDayForEdit !== null && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-light-slate-blue/15 text-light-slate-blue font-bold">
                Applying to {DAYS_CONFIG.find((d) => d.id === selectedDayForEdit)?.label}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowCustomTimeBuilder(!showCustomTimeBuilder)}
            className="text-[11px] font-bold text-light-indigo dark:text-spiro-disco-ball hover:underline"
          >
            {showCustomTimeBuilder ? 'Hide Custom Time' : 'Custom Time Picker...'}
          </button>
        </div>

        {/* Popular Preset Time Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {POPULAR_TIME_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyTimePreset(preset.start, preset.end, false)}
              className="p-2 rounded-xl text-left border border-slate-200/90 dark:border-slate-700/80 bg-slate-50 hover:bg-light-indigo/10 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors group"
            >
              <div className="text-[11px] font-black group-hover:text-light-indigo dark:group-hover:text-spiro-disco-ball flex items-center justify-between">
                <span>{preset.label.split(' ')[0]} – {preset.label.split(' ')[2]} {preset.label.split(' ')[3]}</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {preset.label.includes('(') ? preset.label.substring(preset.label.indexOf('(')) : ''}
              </div>
            </button>
          ))}
        </div>

        {/* Sync across all days button */}
        {value.length > 1 && (
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                if (value.length > 0) {
                  const ref = value[0];
                  handleApplyTimePreset(ref.startTime, ref.endTime, true);
                }
              }}
              className="text-[10px] font-bold text-slate-500 hover:text-light-indigo dark:hover:text-spiro-disco-ball flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Apply {value[0] ? `${formatTime12h(value[0].startTime)}–${formatTime12h(value[0].endTime)}` : ''} to all scheduled days</span>
            </button>
          </div>
        )}

        {/* Custom Modern Time Builder Popover/Accordion */}
        {showCustomTimeBuilder && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Start Time & Class Duration:
            </div>

            {/* Hours */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Hour</span>
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setCustomStartHour(h)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      customStartHour === h
                        ? 'bg-light-indigo text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes & Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Minutes</span>
                <div className="flex gap-1.5">
                  {[0, 15, 30, 45].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCustomStartMinute(m)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        customStartMinute === m
                          ? 'bg-light-indigo text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      :{m < 10 ? `0${m}` : m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Period</span>
                <div className="flex gap-1.5">
                  {(['AM', 'PM'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCustomStartPeriod(p)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        customStartPeriod === p
                          ? 'bg-spiro-disco-ball text-slate-950 font-black shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Class Duration (Automatically sets End Time)
              </span>
              <div className="flex gap-1.5">
                {[
                  { label: '1 Hour (60m)', min: 60 },
                  { label: '1.5 Hours (90m)', min: 90 },
                  { label: '2 Hours (120m)', min: 120 },
                ].map((d) => (
                  <button
                    key={d.min}
                    type="button"
                    onClick={() => setCustomDuration(d.min)}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      customDuration === d.min
                        ? 'bg-weird-green text-slate-950 font-black shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Result preview & Apply button */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Calculated Time:{' '}
                <strong className="text-slate-900 dark:text-white font-black">
                  {formatTime12h(formatTime24h(customStartHour, customStartMinute, customStartPeriod))} –{' '}
                  {formatTime12h(
                    addMinutesToTime(
                      formatTime24h(customStartHour, customStartMinute, customStartPeriod),
                      customDuration
                    )
                  )}
                </strong>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyCustomTime(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-xs"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyCustomTime(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-spiro-disco-ball text-slate-950 hover:bg-neon-blue shadow-xs"
                >
                  Apply to All Days
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Routine Slots Summary Cards */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
          Scheduled Class Slots ({value.length})
        </label>

        {value.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
            No routine slots selected yet. Click any day on the calendar above to schedule a class.
          </div>
        ) : (
          <div className="space-y-1.5">
            {value.map((slot, index) => {
              const dayObj = DAYS_CONFIG.find((d) => d.id === slot.dayOfWeek);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-24 px-2 py-1 rounded-lg text-center font-black text-xs bg-light-indigo/15 text-light-indigo dark:text-neon-blue border border-light-indigo/20">
                      {dayObj?.label}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatTime12h(slot.startTime)}</span>
                      <span className="text-slate-400">to</span>
                      <span>{formatTime12h(slot.endTime)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-light-red hover:bg-light-red/10 transition-colors"
                    title="Remove slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
