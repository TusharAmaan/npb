import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Student } from '../../types/models';
import { StudentProfileView } from './StudentProfileView';
import { getReportShareUrl } from '../../lib/whatsappTemplates';
import {
  Users,
  Search,
  Plus,
  PhoneCall,
  Share2,
  Trash2,
  ExternalLink,
  Flame,
  Award,
  X,
  Copy,
  Check,
} from 'lucide-react';

export const StudentDirectory: React.FC = () => {
  const { students, batches, schools, saveStudent, deleteStudent } = useData();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatchId, setFilterBatchId] = useState('all');
  const [filterSchoolId, setFilterSchoolId] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(searchParams.get('action') === 'new');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Student Form State
  const [newName, setNewName] = useState('');
  const [newRoll, setNewRoll] = useState('');
  const [newSchoolId, setNewSchoolId] = useState(schools[0]?.id || 'sch-1');
  const [newClassLevel, setNewClassLevel] = useState('HSC 1st Year');
  const [newSection, setNewSection] = useState('');
  const [newShift, setNewShift] = useState<'Morning' | 'Day' | 'N/A'>('Day');
  const [newBatchIds, setNewBatchIds] = useState<string[]>([batches[0]?.id || 'batch-1']);
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Handle Add Student Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const matchedSchool = schools.find((s) => s.id === newSchoolId);

    const newStudent: Student = {
      id: `stu-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      publicRollNo: newRoll.trim() || `R-${100 + students.length + 1}`,
      name: newName.trim(),
      schoolId: newSchoolId,
      schoolName: matchedSchool?.name || 'Dhaka College',
      classLevel: newClassLevel,
      section: newSection.trim() || undefined,
      shift: newShift,
      batchIds: newBatchIds,
      guardianName: newGuardianName.trim() || undefined,
      guardianPhone: newGuardianPhone.trim() || '01700000000',
      studentPhone: newStudentPhone.trim() || undefined,
      notes: newNotes.trim() || undefined,
      shareToken: `npb-${Math.random().toString(36).substring(2, 10)}`,
      joinedAt: Date.now(),
      isActive: true,
      streakCount: 0,
      manualBonusPoints: 0,
    };

    await saveStudent(newStudent);
    setIsAddModalOpen(false);
    // Reset
    setNewName('');
    setNewRoll('');
    setNewGuardianPhone('');
    setNewNotes('');
  };

  const handleDelete = async (studentId: string, studentName: string) => {
    if (confirm(`Are you sure you want to remove "${studentName}" from the student directory?`)) {
      await deleteStudent(studentId);
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(null);
      }
    }
  };

  const handleCopySecretLink = (token: string, stuId: string) => {
    const url = getReportShareUrl(token);
    navigator.clipboard.writeText(url);
    setCopiedId(stuId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (!s.isActive) return false;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.publicRollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.schoolName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBatch = filterBatchId === 'all' || s.batchIds?.includes(filterBatchId);
    const matchesSchool = filterSchoolId === 'all' || s.schoolId === filterSchoolId;

    return matchesSearch && matchesBatch && matchesSchool;
  });

  if (selectedStudent) {
    return (
      <StudentProfileView
        student={selectedStudent}
        onBack={() => setSelectedStudent(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-light-indigo/15 text-light-indigo">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Student Directory & Academic Profiles
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total {students.length} students enrolled across {batches.length} batches from {schools.length} institutions.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-md shadow-light-indigo/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Enroll New Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student by name, manual roll no, or school..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-light-indigo"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterBatchId}
            onChange={(e) => setFilterBatchId(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Batches ({batches.length})</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={filterSchoolId}
            onChange={(e) => setFilterSchoolId(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Schools ({schools.length})</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.shortCode} - {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-dark-border bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Roll</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">School & Class</th>
                <th className="py-3 px-4">Enrolled Batches</th>
                <th className="py-3 px-4">Guardian Contact</th>
                <th className="py-3 px-4">Streak & Bonus</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-800 dark:text-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No matching students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => {
                  const enrolledBatchNames = batches
                    .filter((b) => stu.batchIds?.includes(b.id))
                    .map((b) => b.name);

                  return (
                    <tr
                      key={stu.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Public Roll No */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold px-2 py-0.5 rounded-md bg-radiant-yellow/20 text-amber-800 dark:text-radiant-yellow">
                          {stu.publicRollNo}
                        </span>
                      </td>

                      {/* Name & System ID */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedStudent(stu)}
                          className="font-bold text-slate-900 dark:text-white hover:text-light-indigo dark:hover:text-neon-blue transition-colors text-left block"
                        >
                          {stu.name}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {stu.id}</span>
                      </td>

                      {/* School & Class */}
                      <td className="py-3 px-4">
                        <span className="font-semibold block">{stu.schoolName}</span>
                        <span className="text-[11px] text-slate-400">
                          {stu.classLevel} {stu.section ? `• Sec ${stu.section}` : ''}
                        </span>
                      </td>

                      {/* Enrolled Batches */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {enrolledBatchNames.map((bName, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-spiro-disco-ball/15 text-sky-800 dark:text-spiro-disco-ball font-semibold truncate max-w-[140px]"
                            >
                              {bName}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Guardian WhatsApp */}
                      <td className="py-3 px-4">
                        <a
                          href={`https://wa.me/880${stu.guardianPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-wintergreen hover:underline"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{stu.guardianPhone}</span>
                        </a>
                      </td>

                      {/* Streak & Bonus */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {stu.streakCount > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-weird-green/20 text-emerald-700 dark:text-wintergreen">
                              <Flame className="w-3 h-3 fill-current" />
                              {stu.streakCount}d
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {(stu.manualBonusPoints || 0) !== 0 && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-light-purple/20 text-light-purple">
                              +{stu.manualBonusPoints}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopySecretLink(stu.shareToken, stu.id)}
                            title="Copy Live Guardian Link"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-light-indigo hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {copiedId === stu.id ? (
                              <Check className="w-4 h-4 text-weird-green" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => setSelectedStudent(stu)}
                            title="View Full Academic Profile"
                            className="px-2.5 py-1 rounded-lg font-bold bg-light-indigo/10 text-light-indigo dark:text-neon-blue hover:bg-light-indigo hover:text-white transition-all text-[11px]"
                          >
                            Profile
                          </button>

                          <button
                            onClick={() => handleDelete(stu.id, stu.name)}
                            title="Delete Student"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-xl border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Enroll New Student
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assign public roll number, school, and batch enrollments
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Tanvir Hasan"
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Manual Public Roll No *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoll}
                    onChange={(e) => setNewRoll(e.target.value)}
                    placeholder="e.g. HSC-05 or 105"
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    School / Institution
                  </label>
                  <select
                    value={newSchoolId}
                    onChange={(e) => setNewSchoolId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {schools.map((sch) => (
                      <option key={sch.id} value={sch.id}>
                        {sch.shortCode} - {sch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Class Level
                  </label>
                  <select
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="HSC 1st Year">HSC 1st Year</option>
                    <option value="HSC 2nd Year">HSC 2nd Year</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Guardian Mobile (for WhatsApp Reports) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newGuardianPhone}
                    onChange={(e) => setNewGuardianPhone(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Guardian Name
                  </label>
                  <input
                    type="text"
                    value={newGuardianName}
                    onChange={(e) => setNewGuardianName(e.target.value)}
                    placeholder="e.g. Mr. M. Rahman"
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Multi-Batch Enrollment Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Batch Enrollment (Can select multiple)
                </label>
                <div className="space-y-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  {batches.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newBatchIds.includes(b.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewBatchIds([...newBatchIds, b.id]);
                          } else {
                            setNewBatchIds(newBatchIds.filter((id) => id !== b.id));
                          }
                        }}
                        className="rounded text-light-indigo focus:ring-light-indigo"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {b.name} ({b.courseTag})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Private Tutor Notes
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Strong in writing, needs extra support with Narration & Modifiers"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-dark-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
