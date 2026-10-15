import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NPBLogo } from '../common/NPBLogo';
import { ShieldCheck, LogIn, Lock, Mail, Sparkles, CheckCircle2 } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { signInGoogle, signInEmail, devLoginAsAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('tushar.aman05@gmail.com');
  const [password, setPassword] = useState('admin2026');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signInEmail(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check credentials or use Instant Access.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInGoogle();
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = () => {
    devLoginAsAdmin();
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-dark-surface rounded-3xl border border-slate-200 dark:border-dark-border shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <NPBLogo size={52} className="mx-auto" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            NPB Tutor Admin Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Secure admin access for <strong className="text-light-indigo dark:text-neon-blue">tushar.aman05@gmail.com</strong>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-light-red/10 border border-light-red/30 text-xs font-semibold text-red-700 dark:text-light-red">
            {error}
          </div>
        )}

        {/* 1-Click Fast Instant Login Button */}
        <button
          type="button"
          onClick={handleDevLogin}
          className="w-full py-3 px-4 rounded-xl text-xs font-black bg-weird-green text-slate-950 hover:bg-wintergreen shadow-md shadow-weird-green/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-emerald-950" />
          <span>Instant Tutor Access (1-Click Login)</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-slate-200 dark:border-dark-border" />
          <span className="text-[10px] font-bold uppercase text-slate-400">or sign in with</span>
          <div className="flex-1 border-t border-slate-200 dark:border-dark-border" />
        </div>

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>Continue with Google</span>
        </button>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-light-indigo text-white hover:bg-light-slate-blue shadow-md shadow-light-indigo/25 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Sign In with Email'}
          </button>
        </form>
      </div>
    </div>
  );
};
