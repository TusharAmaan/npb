import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NPBLogo } from '../common/NPBLogo';
import { ShieldCheck, ShieldAlert, Lock, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const {
    signInGoogle,
    isAdmin,
    accessDeniedMessage,
    clearAccessDeniedMessage,
  } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in with authorized admin account, redirect to dashboard
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleGoogleLogin = async () => {
    setError('');
    clearAccessDeniedMessage();
    setIsLoading(true);
    try {
      await signInGoogle();
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-dark-surface rounded-3xl border border-slate-200 dark:border-dark-border shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <NPBLogo size={56} className="mx-auto" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <Lock className="w-3.5 h-3.5 text-light-indigo" />
            <span>Authorized Tutor Only</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Admin Authentication
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Sign in with your authorized Google account to manage batches, attendance, syllabus, and assessments.
          </p>
        </div>

        {/* Access Denied Banner */}
        {accessDeniedMessage && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 space-y-2 text-center animate-shake">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-red-700 dark:text-red-300">
              Admin Access Denied
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {accessDeniedMessage}
            </p>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 underline hover:text-red-800 pt-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Switch Google Account</span>
            </button>
          </div>
        )}

        {/* Generic Error Notice */}
        {error && !accessDeniedMessage && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Sole Login Action: Continue with Google */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold border-2 border-slate-200 dark:border-slate-700 hover:border-light-indigo/60 dark:hover:border-light-indigo/60 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-light-indigo border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.64v3.02h3.9c2.28-2.1 3.645-5.2 3.645-9.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.02c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.11-6.68-4.96H1.21v3.12C3.26 21.46 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.61H1.21C.44 8.16 0 9.97 0 12c0 2.03.44 3.84 1.21 5.39l4.11-3.12z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.54 1.21 6.61l4.11 3.12c.94-2.85 3.58-4.96 6.68-4.96z"
                />
              </svg>
            )}
            <span>{isLoading ? 'Verifying Authorization...' : 'Sign in with Google'}</span>
          </button>

          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
            Only authorized administrator accounts will be granted access.
          </p>
        </div>

        {/* Security Indicator */}
        <div className="pt-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-weird-green" />
          <span>Protected by Firebase Auth & Google Identity Services</span>
        </div>

        {/* Return to Public Portal */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-light-indigo dark:hover:text-neon-blue transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
