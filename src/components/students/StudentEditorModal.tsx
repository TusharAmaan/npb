import React, { useState, useEffect } from 'react';
import { Student } from '../../types/models';
import { useData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import { getReportShareUrl } from '../../lib/whatsappTemplates';
import {
  User,
  Building2,
  GraduationCap,
  Phone,
  Flame,
  Award,
  Plus,
  X,
  Check,
  RotateCw,
  Trash2,
  Share2,
  FileText,
  Layers,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface StudentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null; // null = create new student, object = editing existing
  defaultBatchId?: string;
  onSaved?: (savedStudent: Student) => void;
}

export const StudentEditorModal: React.FC<StudentEditorModalProps> = ({
  isOpen,
  onClose,
  student,
  defaultBatchId,
  onSaved,
}) => {
  const { students, batches, schools, saveStudent, deleteStudent, saveSchool } = useData();
  const { confirm, alert } = useModal();

  const isEditing = Boolean(student);

  // Form states
  const [name, setName] = useState('');
  const [publicRollNo, setPublicRollNo] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [classLevel, setClassLevel] = useState('HSC 1st Year');
  const [customClassLevel, setCustomClassLevel] = useState('');
  const [isCustomClass, setIsCustomClass] = useState(false);
  const [section, setSection] = useState('');
  const [shift, setShift] = useState<'Morning' | 'Day' | 'N/A'>('Day');
  const [admissionDate, setAdmissionDate] = useState<string>('');
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [streakCount, setStreakCount] = useState(0);
  const [manualBonusPoints, setManualBonusPoints] = useState(0);
  const [shareToken, setShareToken] = useState('');

  // Quick Add School inline
  const [isQuickAddSchoolOpen, setIsQuickAddSchoolOpen] = useState(false);
  const [quickSchoolName, setQuickSchoolName] = useState('');
  const [quickSchoolCode, setQuickSchoolCode] = useState('');

  // UI state
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Standard class level presets
  const classPresets = [
    'HSC 1st Year',
    'HSC 2nd Year',
    'HSC 2026',
    'HSC 2027',
    'Class 10',
    'Class 9',
    'SSC 2026',
    'SSC 2027',
    'Admission English',
    'Spoken & Foundation',
  ];

  // Initialize or reset form when modal opens or student changes
  useEffect(() => {
    if (student) {
      setName(student.name || '');
      setPublicRollNo(student.publicRollNo || '');
      setSchoolId(student.schoolId || schools[0]?.id || '');
      
      const isPreset = classPresets.includes(student.classLevel);
      if (isPreset) {
        setClassLevel(student.classLevel);
        setIsCustomClass(false);
        setCustomClassLevel('');
      } else {
        setClassLevel('custom');
        setIsCustomClass(true);
        setCustomClassLevel(student.classLevel || '');
      }

      setSection(student.section || '');
      setShift(student.shift || 'Day');
      setAdmissionDate(
        student.joinedAt
          ? new Date(student.joinedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setBatchIds(student.batchIds?.length ? [...student.batchIds] : [batches[0]?.id || '']);
      setGuardianName(student.guardianName || '');
      setGuardianPhone(student.guardianPhone || '');
      setStudentPhone(student.studentPhone || '');
      setNotes(student.notes || '');
      setIsActive(student.isActive ?? true);
      setStreakCount(student.streakCount || 0);
      setManualBonusPoints(student.manualBonusPoints || 0);
      setShareToken(student.shareToken || '');
    } else {
      // New student defaults
      setName('');
      setPublicRollNo(`R-${100 + students.length + 1}`);
      setSchoolId(schools[0]?.id || '');
      setClassLevel('HSC 1st Year');
      setIsCustomClass(false);
      setCustomClassLevel('');
      setSection('');
      setShift('Day');
      setAdmissionDate(new Date().toISOString().split('T')[0]);
      setBatchIds(defaultBatchId ? [defaultBatchId] : batches[0] ? [batches[0].id] : []);
      setGuardianName('');
      setGuardianPhone('');
      setStudentPhone('');
      setNotes('');
      setIsActive(true);
      setStreakCount(0);
      setManualBonusPoints(0);
      setShareToken(`npb-${Math.random().toString(36).substring(2, 10)}`);
    }
    setIsQuickAddSchoolOpen(false);
  }, [student, isOpen]);

  if (!isOpen) return null;

  // Handle Quick Add School
  const handleSaveQuickSchool = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!quickSchoolName.trim() || !quickSchoolCode.trim()) return;

    const newSch = {
      id: `sch-${Date.now().toString(36)}`,
      name: quickSchoolName.trim(),
      shortCode: quickSchoolCode.trim().toUpperCase(),
      createdAt: Date.now(),
    };

    await saveSchool(newSch);
    setSchoolId(newSch.id);
    setIsQuickAddSchoolOpen(false);
    setQuickSchoolName('');
    setQuickSchoolCode('');
  };

  // Regenerate Share Token
  const handleRegenerateToken = () => {
    const newToken = `npb-${Math.random().toString(36).substring(2, 10)}`;
    setShareToken(newToken);
  };

  // Copy share link
  const handleCopyShareLink = () => {
    const url = getReportShareUrl(shareToken);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      await alert({
        title: 'Missing Required Field',
        message: 'Please provide the student’s full name.',
        variant: 'warning',
      });
      return;
    }

    if (!publicRollNo.trim()) {
      await alert({
        title: 'Missing Public Roll',
        message: 'Please provide a public roll number for report identification.',
        variant: 'warning',
      });
      return;
    }

    if (batchIds.length === 0) {
      await alert({
        title: 'Select at least one Batch',
        message: 'Please enroll this student in at least one active batch.',
        variant: 'warning',
      });
      return;
    }

    setIsSaving(true);

    const matchedSchool = schools.find((s) => s.id === schoolId);
    const resolvedClass = isCustomClass ? (customClassLevel.trim() || 'HSC 1st Year') : classLevel;

    const resolvedJoinedAt = admissionDate
      ? new Date(admissionDate + 'T12:00:00').getTime()
      : student?.joinedAt || Date.now();

    const studentToSave: Student = {
      id: student?.id || `stu-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      publicRollNo: publicRollNo.trim(),
      name: name.trim(),
      schoolId: schoolId || (schools[0]?.id || 'sch-1'),
      schoolName: matchedSchool?.name || 'Dhaka College',
      classLevel: resolvedClass,
      section: section.trim() || undefined,
      shift,
      batchIds,
      guardianName: guardianName.trim() || undefined,
      guardianPhone: guardianPhone.trim() || '01700000000',
      studentPhone: studentPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      shareToken: shareToken || `npb-${Math.random().toString(36).substring(2, 10)}`,
      joinedAt: resolvedJoinedAt,
      isActive,
      streakCount: Number(streakCount) || 0,
      manualBonusPoints: Number(manualBonusPoints) || 0,
    };

    try {
      await saveStudent(studentToSave);
      setIsSaving(false);
      onSaved?.(studentToSave);
      onClose();

      await alert({
        title: isEditing ? 'Student Profile Updated!' : 'Student Enrolled Successfully!',
        message: isEditing
          ? `Changes to ${studentToSave.name} (Roll ${studentToSave.publicRollNo}) have been saved and synchronized.`
          : `${studentToSave.name} has been enrolled in ${studentToSave.schoolName}.`,
        variant: 'success',
      });
    } catch (err: any) {
      setIsSaving(false);
      await alert({
        title: 'Error Saving Student',
        message: err?.message || 'Failed to update student profile.',
        variant: 'danger',
      });
    }
  };

  // Handle Delete Student from Editor
  const handleDeleteStudent = async () => {
    if (!student) return;

    const ok = await confirm({
      title: 'Delete Student Profile',
      message: `Are you sure you want to permanently delete "${student.name}" (Roll: ${student.publicRollNo})?\n\nThis will remove their enrolled profile from all batches, attendance records, and syllabus trackers.`,
      confirmText: 'Yes, Delete Student',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (ok) {
      await deleteStudent(student.id);
      onClose();
      await alert({
        title: 'Student Removed',
        message: `${student.name} was successfully removed from the system.`,
        variant: 'info',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-dark-surface rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-light-indigo/15 text-light-indigo dark:text-neon-blue flex items-center justify-center font-black">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isEditing ? `Edit Profile: ${student?.name}` : 'Enroll New Student'}
                </h2>
                {isEditing && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    ID: {student?.id}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? 'Update academic information, contact numbers, institution, and batch enrollments'
                  : 'Register student identity, school affiliation, and initial batch enrollments'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Section 1: Core Personal & Academic Identity */}
          <div className="bg-slate-50/70 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-light-indigo" />
                <span>Student Identity & Academic Placement</span>
              </h3>

              {/* Active / Inactive Status Toggle */}
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                <span className={isActive ? 'text-emerald-600 dark:text-wintergreen' : 'text-slate-400'}>
                  {isActive ? 'Active Student' : 'Archived / Inactive'}
                </span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-light-indigo focus:ring-light-indigo w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Hasan"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo/20 focus:border-light-indigo"
                />
              </div>

              {/* Public Roll No */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Manual Public Roll No <span className="text-red-500">*</span>
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    (Visible on leaderboards & reports)
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={publicRollNo}
                  onChange={(e) => setPublicRollNo(e.target.value)}
                  placeholder="e.g. 101 or HSC-05"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo/20 focus:border-light-indigo"
                />
              </div>
            </div>

            {/* School & Class Level */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              {/* School / College Selector */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>School / Institution</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQuickAddSchoolOpen(!isQuickAddSchoolOpen)}
                    className="text-[11px] font-bold text-light-indigo dark:text-spiro-disco-ball hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isQuickAddSchoolOpen ? 'Cancel' : 'Add New Institution'}</span>
                  </button>
                </div>

                <select
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.shortCode} — {sch.name}
                    </option>
                  ))}
                </select>

                {/* Inline Quick Add Institution */}
                {isQuickAddSchoolOpen && (
                  <div className="mt-2.5 p-3 rounded-xl border border-light-indigo/30 bg-light-indigo/5 dark:bg-slate-900/90 space-y-2.5 animate-in fade-in duration-150">
                    <div className="text-[11px] font-black text-light-indigo dark:text-neon-blue flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Quick Add New College or School to Directory</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Institution Name (e.g. Notre Dame College)"
                        value={quickSchoolName}
                        onChange={(e) => setQuickSchoolName(e.target.value)}
                        className="sm:col-span-2 px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Acronym (NDC)"
                        value={quickSchoolCode}
                        onChange={(e) => setQuickSchoolCode(e.target.value.toUpperCase())}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveQuickSchool}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-black bg-light-indigo text-white hover:bg-light-slate-blue transition-colors shadow-xs"
                    >
                      Save & Select Institution
                    </button>
                  </div>
                )}
              </div>

              {/* Class Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Class / Academic Level
                </label>
                <select
                  value={isCustomClass ? 'custom' : classLevel}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomClass(true);
                    } else {
                      setIsCustomClass(false);
                      setClassLevel(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {classPresets.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                  <option value="custom">✏️ Custom Class Level...</option>
                </select>

                {isCustomClass && (
                  <input
                    type="text"
                    value={customClassLevel}
                    onChange={(e) => setCustomClassLevel(e.target.value)}
                    placeholder="Enter custom class"
                    className="mt-2 w-full px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                )}
              </div>
            </div>

            {/* Admission Date, Section & Shift */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-light-indigo" />
                  <span>Admission Date / ভর্তির তারিখ</span>
                </label>
                <input
                  type="date"
                  required
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Classes prior to this date default to Absent
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Section / Group (Optional)
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. Sec A, Padma, Science"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  School Shift
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Day', 'Morning', 'N/A'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setShift(s)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        shift === s
                          ? 'bg-light-indigo text-white border-light-indigo shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Batch Enrolment (Multi-Select) */}
          <div className="bg-slate-50/70 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-spiro-disco-ball" />
                <span>Batch Enrollment (Multi-Batch Supported)</span>
              </label>
              <span className="text-[11px] font-bold text-light-indigo dark:text-neon-blue">
                {batchIds.length} batch(es) selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {batches.map((b) => {
                const isSelected = batchIds.includes(b.id);
                return (
                  <label
                    key={b.id}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-spiro-disco-ball/10 dark:bg-spiro-disco-ball/15 border-spiro-disco-ball/40 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBatchIds([...batchIds, b.id]);
                        } else {
                          setBatchIds(batchIds.filter((id) => id !== b.id));
                        }
                      }}
                      className="mt-0.5 rounded text-light-indigo focus:ring-light-indigo w-4 h-4"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">{b.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                          {b.courseTag}
                        </span>
                        <span>• {b.classLevel}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 3: Contact & Guardian Details */}
          <div className="bg-slate-50/70 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>Contact Numbers & WhatsApp Dispatch</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Guardian Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Guardian Mobile (for WhatsApp Reports) *</span>
                  {guardianPhone && (
                    <a
                      href={`https://wa.me/880${guardianPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-emerald-600 dark:text-wintergreen hover:underline"
                    >
                      Test WhatsApp Link ↗
                    </a>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                    +880
                  </span>
                  <input
                    type="tel"
                    required
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value.replace(/^(\+880|880)/, ''))}
                    placeholder="17xxxxxxxx"
                    className="w-full pl-14 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Guardian Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Guardian Name
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Mr. M. Rahman (Father / Mother)"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Student Personal Phone */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Student's Personal Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  placeholder="e.g. 018xxxxxxxx (For direct SMS / study group notifications)"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Gamification, Streaks & Performance Corrections */}
          <div className="bg-slate-50/70 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-bright-lilac" />
              <span>Streaks, Bonus Points & Tutor Observations</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Streak Count Adjustment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Consecutive Attendance Streak (Days)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={streakCount}
                  onChange={(e) => setStreakCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Auto-increments during live class attendance. Can be adjusted here if a streak was missed due to medical leave.
                </p>
              </div>

              {/* Bonus Points */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-light-purple" />
                  <span>Cumulative Bonus / Merit Points</span>
                </label>
                <input
                  type="number"
                  value={manualBonusPoints}
                  onChange={(e) => setManualBonusPoints(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Adds directly to leaderboard rank and presentation report cards.
                </p>
              </div>

              {/* Private Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Private Tutor Notes & Learning Plan</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Strong in Grammar. Needs revision in Modifiers and Right Form of Verbs before Board Test."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Live Secret Guardian Portal Link */}
          {isEditing && (
            <div className="p-3.5 rounded-2xl border border-light-indigo/20 bg-light-indigo/5 dark:bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-light-indigo" />
                  <span>Secret Guardian Report Token & URL</span>
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateToken}
                  className="text-[11px] text-slate-400 hover:text-red-500 flex items-center gap-1 font-semibold transition-colors"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Regenerate Token</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getReportShareUrl(shareToken)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-surface text-slate-600 dark:text-slate-300 flex-1 truncate font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue transition-colors flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-slate-100 dark:border-dark-border flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDeleteStudent}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-light-red hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border border-red-200/50 dark:border-red-900/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Student</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-black bg-light-indigo text-white hover:bg-light-slate-blue shadow-md shadow-light-indigo/25 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <span>Saving Changes...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isEditing ? 'Save Profile Changes' : 'Enroll Student'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
