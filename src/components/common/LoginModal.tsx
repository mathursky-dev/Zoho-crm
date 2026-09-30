import React, { useState } from 'react';
import { db } from '../../lib/database';
import { Profile } from '../../types/crm';
import { LogIn, Shield, User, Key, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: Profile) => void;
}

export const LoginModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess }) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState('admin@leadflow.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await db.signIn(email, password);
    setLoading(false);

    if (res.user) {
      onLoginSuccess(res.user);
      onClose();
    } else {
      setError(res.error || 'Failed to sign in.');
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    db.signIn(demoEmail, demoPass).then(res => {
      if (res.user) {
        onLoginSuccess(res.user);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold">Sign In to LeadFlow CRM</h2>
          <p className="text-xs text-slate-400 mt-1">Select role or enter your credentials</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Switchers */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Instant 1-Click Role Switch
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@leadflow.com', 'admin123')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-left transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-blue-600 text-white rounded-md">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Sarah Jenkins (Admin)</div>
                    <div className="text-[11px] text-slate-500">Full Access · Assign Leads · Masters · Reports</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('alex@leadflow.com', 'alex123')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-left transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-md">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Alex Rivera (Telecaller)</div>
                    <div className="text-[11px] text-slate-500">Dept: Home Loans · 7 Assigned Leads</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  User
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('priya@leadflow.com', 'priya123')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 text-left transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-purple-600 text-white rounded-md">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Priya Sharma (Telecaller)</div>
                    <div className="text-[11px] text-slate-500">Dept: Health Insurance · 3 Assigned Leads</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                  User
                </span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <hr className="w-full border-slate-200" />
            <span className="absolute bg-white px-2 text-[11px] font-semibold text-slate-400">
              OR LOGIN WITH CREDENTIALS
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="name@leadflow.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
