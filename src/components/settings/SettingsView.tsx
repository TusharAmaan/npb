import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import {
  Download,
  Upload,
  RefreshCw,
  Trash2,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  Sparkles,
  Check,
  Save,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    loadDemoData,
    clearAllData,
    exportDatabaseJson,
    importDatabaseJson,
    importStudentsCsv,
    batches,
  } = useData();
  const { confirm, alert } = useModal();

  // Branding states
  const [platformName, setPlatformName] = useState(settings.platformName || 'NPB');
  const [tutorName, setTutorName] = useState(settings.tutorName || 'Abdullah All Masum');
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber || '01619663933');
  const [savedBranding, setSavedBranding] = useState(false);

  // CSV Import state
  const [csvText, setCsvText] = useState('');
  const [csvBatchId, setCsvBatchId] = useState(batches[0]?.id || '');
  const [csvSuccessMessage, setCsvSuccessMessage] = useState('');

  // Save branding
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      platformName: platformName.trim(),
      tutorName: tutorName.trim(),
      whatsappNumber: whatsappNumber.trim(),
    });
    setSavedBranding(true);
    setTimeout(() => setSavedBranding(false), 2000);
  };

  // 1-Click Full Database JSON Backup
  const handleExportJson = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NPB_Full_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Restore JSON File
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDatabaseJson(content);
        if (success) {
          await alert({
            title: 'Backup Restored',
            message: 'Database restored successfully from JSON backup snapshot!',
            variant: 'success',
          });
        } else {
          await alert({
            title: 'Restore Failed',
            message: 'Failed to parse backup JSON file. Ensure it is a valid NPB database export.',
            variant: 'danger',
          });
        }
      }
    };
    reader.readAsText(file);
  };

  // Bulk Student CSV Import
  const handleImportCsv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    const count = importStudentsCsv(csvText, csvBatchId);
    setCsvSuccessMessage(`Successfully imported and enrolled ${count} students!`);
    setCsvText('');
    setTimeout(() => setCsvSuccessMessage(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Settings className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              System Settings, CSV Import & Full Database Backups
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage tutor identity, bulk CSV onboarding, JSON offline snapshots, and demo reset.
            </p>
          </div>
        </div>
      </div>

      {/* Tutor Profile & Identity Settings */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Tutor Branding & Contact Configuration
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Used across Guardian Report Cards, PDF exports, and headers. (Tagline is disabled per domain rule).
          </p>
        </div>

        <form onSubmit={handleSaveBranding} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tutor Full Name
              </label>
              <input
                type="text"
                value={tutorName}
                onChange={(e) => setTutorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Contact Number
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm"
            >
              {savedBranding ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedBranding ? 'Branding Saved!' : 'Save Branding Details'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Bulk Student CSV Import */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-weird-green" />
            <span>Bulk Student CSV Onboarding</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paste CSV rows with format: <code>Name, PublicRollNo, School, Class, GuardianPhone, BatchName</code>
          </p>
        </div>

        <form onSubmit={handleImportCsv} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Default Batch Assignment
              </label>
              <select
                value={csvBatchId}
                onChange={(e) => setCsvBatchId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Paste CSV Rows
              </label>
              <textarea
                rows={4}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Tahmid Rahman, HSC-01, Notre Dame College, HSC 1st Year, 01711223344, Batch 1
Nuzhat Tabassum, HSC-02, Holy Cross College, HSC 1st Year, 01819876543, Batch 1"
                className="w-full font-mono px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-light-indigo"
              />
            </div>
          </div>

          {csvSuccessMessage && (
            <div className="p-2.5 rounded-xl bg-weird-green/20 text-emerald-800 dark:text-wintergreen text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{csvSuccessMessage}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Process & Enroll CSV Students</span>
            </button>
          </div>
        </form>
      </div>

      {/* 1-Click JSON Backup & Restore + Demo Data Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Database JSON Export / Import */}
        <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-spiro-disco-ball" />
              <span>Full Database JSON Backup & Restore</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download complete database snapshot (batches, students, syllabi, sessions, exams, sheets) or restore anytime.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-spiro-disco-ball/20 text-sky-800 dark:text-spiro-disco-ball hover:bg-spiro-disco-ball/30 border border-spiro-disco-ball/30"
            >
              <Download className="w-4 h-4" />
              <span>Export Full Database JSON</span>
            </button>

            <label className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer border border-slate-200 dark:border-slate-700">
              <Upload className="w-4 h-4" />
              <span>Restore from JSON File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Demo Seed Data & Reset */}
        <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-bright-lilac" />
              <span>Demo Seed Data & Data Reset</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Populate with 4 realistic batches, prestigious Dhaka schools, syllabi & exam analytics for instant testing.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Load Realistic Demo Data',
                  message: 'Load realistic demo data (4 Batches, Dhaka schools, curriculum syllabi, and sample student records)?',
                  confirmText: 'Yes, Load Demo Data',
                  cancelText: 'Cancel',
                  variant: 'info',
                });
                if (ok) {
                  loadDemoData();
                  await alert({
                    title: 'Demo Data Loaded',
                    message: 'Realistic demo data loaded successfully! Batches and students are ready for inspection.',
                    variant: 'success',
                  });
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-bright-lilac/20 text-purple-900 dark:text-bright-lilac hover:bg-bright-lilac/30 border border-bright-lilac/30"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Load Realistic Demo Data (4 Batches)</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Clear All Database Collections',
                  message: '⚠️ WARNING: Clear all data? This will empty all batches, students, sessions, exams, and lecture sheets.',
                  confirmText: 'Yes, Clear All Data',
                  cancelText: 'Cancel',
                  variant: 'danger',
                });
                if (ok) {
                  clearAllData();
                  await alert({
                    title: 'Database Reset',
                    message: 'All local and cloud database collections have been cleared.',
                    variant: 'warning',
                  });
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-light-red/10 text-red-700 dark:text-light-red hover:bg-light-red/20 border border-light-red/20"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
