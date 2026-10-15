import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import { School } from '../../types/models';
import {
  Landmark,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  MapPin,
  Sparkles,
  X,
  Check,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SchoolDirectory: React.FC = () => {
  const { schools, students, saveSchool, deleteSchool } = useData();
  const { confirm, alert } = useModal();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [address, setAddress] = useState('');

  const handleOpenAdd = () => {
    setSelectedSchool(null);
    setName('');
    setShortCode('');
    setAddress('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sch: School) => {
    setSelectedSchool(sch);
    setName(sch.name);
    setShortCode(sch.shortCode);
    setAddress(sch.address || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortCode.trim()) return;

    const schoolObj: School = {
      id: selectedSchool?.id || `sch-${Date.now().toString(36)}`,
      name: name.trim(),
      shortCode: shortCode.trim().toUpperCase(),
      address: address.trim() || undefined,
      createdAt: selectedSchool?.createdAt || Date.now(),
    };

    await saveSchool(schoolObj);
    setIsModalOpen(false);

    await alert({
      title: selectedSchool ? 'Institution Updated' : 'Institution Added',
      message: `"${schoolObj.name}" (${schoolObj.shortCode}) has been successfully saved to your institution directory.`,
      variant: 'success',
    });
  };

  const handleDelete = async (sch: School) => {
    const linkedStudents = students.filter((s) => s.schoolId === sch.id);
    const count = linkedStudents.length;

    const ok = await confirm({
      title: 'Remove Institution',
      message:
        count > 0
          ? `Are you sure you want to remove "${sch.name}"? Note: ${count} student(s) currently belong to this institution.`
          : `Are you sure you want to remove "${sch.name}" (${sch.shortCode}) from your institutions directory?`,
      confirmText: 'Yes, Remove Institution',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (ok) {
      await deleteSchool(sch.id);
      await alert({
        title: 'Institution Removed',
        message: `"${sch.name}" has been removed from the directory.`,
        variant: 'info',
      });
    }
  };

  // Filtered schools
  const filteredSchools = schools.filter((sch) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      sch.name.toLowerCase().includes(q) ||
      sch.shortCode.toLowerCase().includes(q) ||
      (sch.address && sch.address.toLowerCase().includes(q))
    );
  });

  // Calculate top school
  const studentCountMap: Record<string, number> = {};
  students.forEach((s) => {
    studentCountMap[s.schoolId] = (studentCountMap[s.schoolId] || 0) + 1;
  });

  const topSchool: { school: School; count: number } | null = schools.reduce<
    { school: School; count: number } | null
  >((best, sch) => {
    const c = studentCountMap[sch.id] || 0;
    if (!best || c > best.count) {
      return { school: sch, count: c };
    }
    return best;
  }, null);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-hammam-blue/20 text-teal-800 dark:text-hammam-blue">
              <Landmark className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Schools & Institutions Directory
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage student affiliated high schools, colleges, short codes, and institution representations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-light-indigo hover:bg-light-slate-blue text-white shadow-md shadow-light-indigo/25 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Institution</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Institutions
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {schools.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-light-indigo/10 text-light-indigo dark:text-neon-blue flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Enrolled Students
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {students.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-bright-lilac/15 text-bright-lilac flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Top Representation
            </span>
            <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 truncate max-w-[170px]">
              {topSchool && topSchool.count > 0 ? (
                <span>
                  {topSchool.school.shortCode}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({topSchool.count} students)
                  </span>
                </span>
              ) : (
                'None'
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-weird-green/15 text-weird-green flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search institutions by name, short code (e.g. DRMC, NDC), or address..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-surface text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-light-indigo shadow-2xs"
        />
      </div>

      {/* Institutions Grid */}
      {filteredSchools.length === 0 ? (
        <div className="bg-white dark:bg-dark-surface p-12 text-center rounded-2xl border border-slate-200/80 dark:border-dark-border">
          <Landmark className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No institutions found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No institutions match "${searchQuery}". Clear your search or add a new school.`
              : 'Your institution directory is empty. Click "+ Add New Institution" to get started.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Institution</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchools.map((sch) => {
            const count = studentCountMap[sch.id] || 0;
            return (
              <div
                key={sch.id}
                className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200/90 dark:border-dark-border p-5 flex flex-col justify-between space-y-4 hover:border-light-indigo/50 dark:hover:border-spiro-disco-ball/50 transition-all shadow-xs group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-light-indigo/15 text-light-indigo dark:text-spiro-disco-ball border border-light-indigo/25 tracking-wide uppercase">
                      {sch.shortCode}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sch)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Institution"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sch)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-light-red hover:bg-light-red/10 transition-colors"
                        title="Delete Institution"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mt-3 line-clamp-2">
                    {sch.name}
                  </h3>

                  {sch.address ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{sch.address}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic mt-1.5">
                      Dhaka, Bangladesh
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <Users className="w-3.5 h-3.5 text-spiro-disco-ball" />
                    <span>
                      {count} {count === 1 ? 'student' : 'students'} enrolled
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/admin/students`)}
                    className="text-[11px] font-bold text-light-indigo dark:text-spiro-disco-ball hover:underline flex items-center gap-0.5"
                  >
                    <span>View Students</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Institution Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-md border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {selectedSchool ? 'Edit Institution' : 'Add New Institution'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure school name, short acronym code, and campus location
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Institution / College Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dhaka Residential Model College"
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-light-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Short Code / Acronym *
                </label>
                <input
                  type="text"
                  required
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DRMC, NDC, VNSC, ACC"
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-light-indigo font-bold tracking-wider uppercase"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Displayed on leaderboards, attendance tables, and student cards.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Location / Address (Optional)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Mirpur Road, Mohammadpur, Dhaka"
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-light-indigo"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-light-indigo hover:bg-light-slate-blue text-white shadow-md shadow-light-indigo/20 transition-transform active:scale-95"
                >
                  {selectedSchool ? 'Save Changes' : 'Add Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
