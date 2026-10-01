import React, { useState } from 'react';
import { db } from '../../lib/database';
import { Profile } from '../../types/crm';
import { LogIn, Lock, User, AlertCircle, Eye, EyeOff, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: Profile) => void;
  canClose?: boolean;
}

export const LoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  canClose = true,
}) => {
  if (!isOpen) return null;

  // Clean empty state - NO pre-filled credentials or suggestions
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

          {/* Quick Demo Credentials */}
          <div className="mt-4 pt-3.5 border-t border-slate-200">
            <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>Quick Login (Click to Fill):</span>
              <span className="text-[10px] text-blue-600 font-normal">Tap to auto-fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('admin');
                  setPassword('admin123');
                  setError(null);
                }}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                  <span>Admin</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">Full CRM</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">admin / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('alex');
                  setPassword('alex123');
                  setError(null);
                }}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                  <span>Telecaller</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">Calling</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">alex / alex123</div>
              </button>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 text-center">
              Also supports <span className="font-mono text-slate-600">superadmin/superadmin123</span> & <span className="font-mono text-slate-600">priya/priya123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
