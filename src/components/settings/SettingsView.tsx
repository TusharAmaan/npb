import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import { useAuth, PRIMARY_ADMIN_EMAIL, isAuthorizedAdmin } from '../../context/AuthContext';
import { isFirebaseConfigured } from '../../lib/firebase';
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
  Cloud,
  UploadCloud,
  ShieldCheck,
  Copy,
  ExternalLink,
  AlertCircle,
  Database,
  Code,
  X,
  LogIn,
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
    pushAllDataToFirestore,
    lastCloudSyncStatus,
    batches,
    schools,
    students,
    syllabusSchemes,
  } = useData();

  const { currentUser, signInGoogle } = useAuth();
  const { confirm, alert } = useModal();

  // Branding states
  const [platformName, setPlatformName] = useState(settings.platformName || 'NPB');
  const [tutorName, setTutorName] = useState(settings.tutorName || 'Abdullah All Masum');
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber || '01619663933');
  const [savedBranding, setSavedBranding] = useState(false);

  // Cloud Sync state
  const [isPushing, setIsPushing] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

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

  // Push all local data into Cloud Firestore
  const handlePushToFirestore = async () => {
    const isGoogleAdmin =
      currentUser &&
      !currentUser.isDevAdmin &&
      currentUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();

    if (!isGoogleAdmin) {
      const confirmLogin = await confirm({
        title: 'Google Sign-In Required for Firestore Write',
        message: `Your Cloud Firestore security rules require write operations to come from your authenticated Google account (${PRIMARY_ADMIN_EMAIL}).\n\nWould you like to sign in with Google now?`,
        confirmText: 'Sign in with Google',
        cancelText: 'Cancel',
        variant: 'info',
      });
      if (confirmLogin) {
        try {
          await signInGoogle();
        } catch (err: any) {
          await alert({
            title: 'Google Authentication Failed',
            message: err?.message || 'Failed to authenticate with Google.',
            variant: 'danger',
          });
          return;
        }
      } else {
        return;
      }
    }

    setIsPushing(true);
    const res = await pushAllDataToFirestore();
    setIsPushing(false);

    if (res.success) {
      await alert({
        title: 'Cloud Database Synchronized!',
        message: `Successfully uploaded ${res.count} records across all 11 collections into Google Cloud Firestore (batchmgt-6f7ad). You can now refresh your Firebase Console to see all database tables populated!`,
        variant: 'success',
      });
    } else {
      await alert({
        title: 'Cloud Synchronization Failed',
        message: `${res.error}\n\nTo resolve this:\n1. Ensure you have pasted the security rules in Firebase Console (Rules tab).\n2. Ensure your domain (${window.location.hostname}) is listed under Firebase Console -> Authentication -> Settings -> Authorized Domains.\n3. Make sure you are signed in with Google as ${PRIMARY_ADMIN_EMAIL}.`,
        variant: 'danger',
      });
    }
  };

  const firestoreRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // STRICT ADMIN ACCESS: Only ${PRIMARY_ADMIN_EMAIL} can write
    function isTusharAdmin() {
      return request.auth != null && 
        request.auth.token.email.lower() == "${PRIMARY_ADMIN_EMAIL}";
    }

    // Public read for platform branding & portals, admin-only write
    match /{document=**} {
      allow read: if true;
      allow write: if isTusharAdmin();
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(firestoreRulesText);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
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
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Settings className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              System Settings, Cloud Firestore & Database Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live Google Cloud Firestore synchronization, security rules, CSV onboarding, and database backups.
            </p>
          </div>
        </div>
      </div>

      {/* Cloud Firestore Live Database Sync & Status Card */}
      <div className="bg-white dark:bg-dark-surface p-5 sm:p-6 rounded-2xl border border-light-indigo/30 dark:border-light-indigo/20 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-light-indigo/10 text-light-indigo dark:text-neon-blue">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Google Cloud Firestore Database
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-weird-green/20 text-emerald-800 dark:text-wintergreen">
                  batchmgt-6f7ad
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synchronizes batches, schools, students, syllabi, class sessions, and exams in real-time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(!currentUser || currentUser.isDevAdmin || currentUser.email?.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase()) && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInGoogle();
                  } catch (err: any) {
                    await alert({
                      title: 'Google Sign-In Error',
                      message: err?.message || 'Failed to authenticate with Google.',
                      variant: 'danger',
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-900 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-300 dark:border-slate-600 shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-light-indigo" />
                <span>Sign in with Google ({PRIMARY_ADMIN_EMAIL})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowRulesModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Copy Security Rules</span>
            </button>

            <button
              type="button"
              onClick={handlePushToFirestore}
              disabled={isPushing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-weird-green text-slate-950 hover:bg-wintergreen shadow-md shadow-weird-green/20 transition-transform active:scale-95 disabled:opacity-50"
            >
              <UploadCloud className={`w-4 h-4 ${isPushing ? 'animate-bounce' : ''}`} />
              <span>{isPushing ? 'Uploading to Cloud...' : 'Push All Data to Cloud Firestore'}</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Status Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Firebase Cloud Engine</span>
            <span className="font-bold text-xs flex items-center gap-1 mt-0.5 text-slate-800 dark:text-white">
              {isFirebaseConfigured ? (
                <span className="text-emerald-600 dark:text-wintergreen flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Connected
                </span>
              ) : (
                <span className="text-amber-600 dark:text-radiant-yellow flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Local Storage Mode
                </span>
              )}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Firebase Auth State</span>
            <span className="font-bold text-xs text-slate-800 dark:text-white truncate block mt-0.5">
              {currentUser?.email ? (currentUser.isDevAdmin ? 'Dev Local Session' : currentUser.email) : 'Not Signed In'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cloud Write Authorization</span>
            <span className={`font-bold text-xs flex items-center gap-1 mt-0.5 ${currentUser?.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() && !currentUser.isDevAdmin ? 'text-emerald-600 dark:text-wintergreen' : 'text-radiant-yellow'}`}>
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {currentUser?.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() && !currentUser.isDevAdmin
                  ? 'Owner Authorized'
                  : 'Sign in to Google'}
              </span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Local Records Ready</span>
            <span className="font-bold text-xs text-slate-800 dark:text-white block mt-0.5 truncate">
              {batches.length}B • {schools.length}Sch • {students.length}Stu • {syllabusSchemes.length}Syl
            </span>
          </div>
        </div>

        {/* Sync Log Message Banner */}
        {lastCloudSyncStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
              lastCloudSyncStatus.status === 'success'
                ? 'bg-weird-green/10 border-weird-green/30 text-emerald-900 dark:text-wintergreen'
                : lastCloudSyncStatus.status === 'error'
                ? 'bg-light-red/10 border-light-red/30 text-red-800 dark:text-light-red'
                : 'bg-light-indigo/10 border-light-indigo/30 text-light-indigo dark:text-neon-blue'
            }`}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Cloud Sync Status: </span>
              <span>{lastCloudSyncStatus.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* Security Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-weird-green" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Firestore Rules & Domain Authorization
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-300 space-y-1">
              <p className="font-bold">Important 2-Step Setup Checklist:</p>
              <p><strong>Step 1 (Security Rules):</strong> Paste the rules below into Firebase Console &gt; Cloud Firestore &gt; Rules tab and click <strong>Publish</strong>.</p>
              <p><strong>Step 2 (Authorized Domains):</strong> Open Firebase Console &gt; Authentication &gt; Settings tab &gt; Authorized Domains. Ensure <code>{window.location.hostname}</code> is listed so Google Sign-in works on your live website!</p>
            </div>

            <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto max-h-52">
              {firestoreRulesText}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Project ID: <code>batchmgt-6f7ad</code>
              </span>
              <button
                type="button"
                onClick={handleCopyRules}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-xs"
              >
                {copiedRules ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRules ? 'Copied to Clipboard!' : 'Copy Rules to Clipboard'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutor Profile & Identity Settings */}
      <div className="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Tutor Branding & Contact Configuration
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Used across Guardian Report Cards, PDF exports, and headers.
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
              Populate with realistic batches, Dhaka schools, syllabi & exam analytics for instant testing.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Load Realistic Demo Data',
                  message: 'Load realistic demo data (Batches, Dhaka schools, curriculum syllabi, and sample student records)?',
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
              <span>Load Realistic Demo Data</span>
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
