import React, { useState, useEffect } from 'react';
import { db } from '../../lib/database';
import { Profile } from '../../types/crm';
import {
  getSupabaseConfig,
  getSupabaseHost,
  testSupabaseConnection,
} from '../../lib/supabase';
import {
  LogIn,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  Database,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: Profile) => void;
  canClose?: boolean;
  onOpenSupabaseModal?: () => void;
}

export const LoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  canClose = true,
  onOpenSupabaseModal,
}) => {
  if (!isOpen) return null;

  // Clean empty state - NO pre-filled credentials or suggestions
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Live Supabase status detection
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [connectionHost, setConnectionHost] = useState<string>('');
  const [connectionMessage, setConnectionMessage] = useState<string>('');

  const checkConnectivity = async () => {
    const config = getSupabaseConfig();
    const host = getSupabaseHost();
    setConnectionHost(host);

    if (!config.isConfigured) {
      setConnectionStatus('disconnected');
      setConnectionMessage('Supabase URL & Anon Key not configured in this browser or environment.');
      return;
    }

    setConnectionStatus('checking');
    try {
      const res = await testSupabaseConnection();
      if (res.success) {
        setConnectionStatus('connected');
        setConnectionMessage(res.message);
      } else {
        setConnectionStatus('error');
        setConnectionMessage(res.message);
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionMessage(err?.message || 'Failed to ping Supabase database.');
    }
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setError('Please enter your User ID or Email address.');
      return;
    }

    // Strict validation: password MUST NOT be empty
    if (!cleanPass) {
      setError('Password is required. Login is not allowed without a password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await db.signIn(cleanId, cleanPass);
      if (res.user) {
        onLoginSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Invalid credentials. Please verify your User ID and password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 text-center relative">
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2.5 shadow-md text-white">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Secure CRM Sign In</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter your authorized User ID and password to access the system
          </p>
        </div>

        {/* Database Status Strip */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 truncate">
              {connectionStatus === 'checking' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                  <span className="text-slate-600 font-medium truncate">Verifying database...</span>
                </>
              )}
              {connectionStatus === 'connected' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <span className="text-emerald-800 font-semibold truncate" title={connectionHost}>
                    Database Online: {connectionHost}
                  </span>
                </>
              )}
              {connectionStatus === 'disconnected' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-amber-800 font-semibold truncate">
                    Supabase: Not Configured in Browser
                  </span>
                </>
              )}
              {connectionStatus === 'error' && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="text-rose-800 font-semibold truncate" title={connectionMessage}>
                    Database Unreachable
                  </span>
                </>
              )}
            </div>

            {onOpenSupabaseModal && (
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0 flex items-center space-x-1"
                title="Configure Supabase Project URL & Anon Key"
              >
                <Database className="w-3 h-3" />
                <span>{connectionStatus === 'connected' ? 'Config' : 'Connect'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Secure Login Form - Auto-complete and suggestions hidden */}
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            className="space-y-4"
          >
            {/* User ID / Email Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                User ID / Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => {
                    setIdentifier(e.target.value);
                    if (error) setError(null);
                  }}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  name="crm_user_identifier"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
                  placeholder="Enter User ID or Email"
                />
              </div>
            </div>

            {/* Password Input (Required) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Required</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  name="crm_user_password"
                  className="w-full text-xs pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password.trim()}
              className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center space-x-2"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{loading ? 'Verifying Password...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Quick Pre-configured Accounts Selector */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2 flex items-center justify-between">
              <span>Pre-configured Accounts (Click to Fill)</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('superadmin');
                  setPassword('superadmin123');
                  setError(null);
                }}
                className="p-1.5 text-left rounded-lg bg-blue-50/80 hover:bg-blue-100 border border-blue-200/60 transition-colors"
              >
                <div className="font-bold text-blue-900 flex items-center justify-between">
                  <span>Super Admin</span>
                  <span className="text-[9px] bg-blue-200 text-blue-800 px-1 rounded">Admin</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">superadmin123</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('admin');
                  setPassword('admin123');
                  setError(null);
                }}
                className="p-1.5 text-left rounded-lg bg-blue-50/80 hover:bg-blue-100 border border-blue-200/60 transition-colors"
              >
                <div className="font-bold text-blue-900 flex items-center justify-between">
                  <span>Admin</span>
                  <span className="text-[9px] bg-blue-200 text-blue-800 px-1 rounded">Admin</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">admin123</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('manoj');
                  setPassword('manoj123');
                  setError(null);
                }}
                className="p-1.5 text-left rounded-lg bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
              >
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>Manoj</span>
                  <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1 rounded">Caller</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">manoj123</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('suraj');
                  setPassword('suraj123');
                  setError(null);
                }}
                className="p-1.5 text-left rounded-lg bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
              >
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>Suraj</span>
                  <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1 rounded">Caller</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">suraj123</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('jeetu');
                  setPassword('jeetu123');
                  setError(null);
                }}
                className="col-span-2 p-1.5 text-left rounded-lg bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
              >
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>Jeetu</span>
                  <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1 rounded">Telecaller</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">jeetu123</div>
              </button>
            </div>
          </div>

          <div className="mt-3 pt-2 text-center">
            <span className="text-[10px] text-slate-400">
              Same users supported across Vercel and Supabase environments.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
