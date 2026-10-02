import React, { useState } from 'react';
import { Profile, UserRole } from '../../types/crm';
import { db } from '../../lib/database';
import { UserCog, Plus, Edit2, Shield, User, Key, Power, X, Phone, Mail, Database, RefreshCw, CheckCircle, Headphones } from 'lucide-react';

export const UserMaster: React.FC = () => {
  const [users, setUsers] = useState<(Profile & { password?: string })[]>(db.getUsers(true) as any);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<(Profile & { password?: string }) | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('telecaller');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const refreshList = async () => {
    await db.syncFromSupabase();
    setUsers(db.getUsers(true) as any);
  };

  React.useEffect(() => {
    refreshList();
    const unsub = db.subscribeToChanges(() => {
      setUsers(db.getUsers(true) as any);
    });
    return unsub;
  }, []);

  const handleSyncToSupabase = async () => {
    setSyncingSupabase(true);
    setSyncFeedback(null);
    try {
      const res = await db.syncDefaultUsersToSupabase();
      setSyncFeedback(res.message);
      await refreshList();
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Failed to sync users to Supabase');
    } finally {
      setSyncingSupabase(false);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('telecaller');
    setPhone('');
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: Profile & { password?: string }) => {
    setEditingUser(u);
    setFullName(u.full_name);
    setUsername(u.username || u.email.split('@')[0]);
    setEmail(u.email);
    setPassword(u.password || '');
    setRole(u.role);
    setPhone(u.phone || '');
    setIsActive(u.is_active);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Full Name and Email are required.');
      return;
    }

    if (!editingUser && !password.trim()) {
      setError('Password is required for new users.');
      return;
    }

    const cleanUsername = username.trim() || email.trim().split('@')[0].toLowerCase();

    setSaving(true);
    setError(null);

    try {
      if (editingUser) {
        const res = await db.updateUser(editingUser.id, {
          full_name: fullName.trim(),
          username: cleanUsername,
          role,
          phone: phone.trim(),
          password: password.trim() ? password.trim() : undefined,
          is_active: isActive,
        });

        if (res.error) {
          setError(res.error);
          setSaving(false);
          return;
        }
      } else {
        const res = await db.addUser({
          full_name: fullName.trim(),
          username: cleanUsername,
          email: email.trim(),
          role,
          phone: phone.trim(),
          password: password.trim(),
          is_active: isActive,
        });

        if (res.error) {
          setError(res.error);
          setSaving(false);
          return;
        }
      }

      setIsModalOpen(false);
      await refreshList();
    } catch (err: any) {
      setError(err?.message || 'Failed to save user in database.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u: Profile) => {
    const newActiveState = !u.is_active;
    const res = await db.updateUser(u.id, { is_active: newActiveState });
    if (!res.error) {
      setUsers(prev =>
        prev.map(item => (item.id === u.id ? { ...item, is_active: newActiveState } : item))
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Master & Authentication</h1>
          <p className="text-xs text-slate-500">
            Manage system administrators and telecaller staff with logins and passwords. Same users are supported on Vercel and Supabase.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSyncToSupabase}
            disabled={syncingSupabase}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            title="Push & synchronize all pre-configured administrator and telecaller accounts to Supabase"
          >
            {syncingSupabase ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            <span>{syncingSupabase ? 'Syncing to Supabase...' : 'Sync Accounts to Supabase'}</span>
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Pre-configured System Accounts Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Administrator Accounts Box */}
        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center space-x-2 mb-2.5">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                🛡️ Administrator Accounts (Full CRM Access)
              </h3>
              <p className="text-[11px] text-slate-500">
                Full system control, User Master, Department Master, Status Master, Global Lead Pool, Bulk Assignment
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            <div className="bg-white/90 p-2.5 rounded-lg border border-blue-100 text-[11px] space-y-1">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Super Administrator</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">admin</span>
              </div>
              <div className="text-slate-600 font-mono">User ID: <span className="font-bold text-blue-700">superadmin</span></div>
              <div className="text-slate-500 text-[10px]">superadmin@leadflow.com</div>
              <div className="text-slate-600 font-mono">Password: <span className="font-bold text-slate-800 bg-slate-100 px-1 rounded">superadmin123</span></div>
            </div>
            <div className="bg-white/90 p-2.5 rounded-lg border border-blue-100 text-[11px] space-y-1">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Administrator</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">admin</span>
              </div>
              <div className="text-slate-600 font-mono">User ID: <span className="font-bold text-blue-700">admin</span></div>
              <div className="text-slate-500 text-[10px]">admin@leadflow.com</div>
              <div className="text-slate-600 font-mono">Password: <span className="font-bold text-slate-800 bg-slate-100 px-1 rounded">admin123</span></div>
            </div>
          </div>
        </div>

        {/* Telecaller Accounts Box */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center space-x-2 mb-2.5">
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                🎧 Telecaller Accounts (Calling Station Access)
              </h3>
              <p className="text-[11px] text-slate-500">
                Access to assigned leads, calling queue, follow-up scheduling, phone unlock with strict isolation
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <div className="bg-white/90 p-2 rounded-lg border border-emerald-100 text-[11px] space-y-1">
              <div className="font-bold text-slate-900">Manoj</div>
              <div className="text-slate-600 font-mono">User ID: <span className="font-bold text-emerald-700">manoj</span></div>
              <div className="text-slate-500 text-[10px] truncate">manoj@leadflow.com</div>
              <div className="text-slate-600 font-mono">Pass: <span className="font-bold text-slate-800 bg-slate-100 px-1 rounded">manoj123</span></div>
            </div>
            <div className="bg-white/90 p-2 rounded-lg border border-emerald-100 text-[11px] space-y-1">
              <div className="font-bold text-slate-900">Suraj</div>
              <div className="text-slate-600 font-mono">User ID: <span className="font-bold text-emerald-700">suraj</span></div>
              <div className="text-slate-500 text-[10px] truncate">suraj@leadflow.com</div>
              <div className="text-slate-600 font-mono">Pass: <span className="font-bold text-slate-800 bg-slate-100 px-1 rounded">suraj123</span></div>
            </div>
            <div className="bg-white/90 p-2 rounded-lg border border-emerald-100 text-[11px] space-y-1">
              <div className="font-bold text-slate-900">Jeetu</div>
              <div className="text-slate-600 font-mono">User ID: <span className="font-bold text-emerald-700">jeetu</span></div>
              <div className="text-slate-500 text-[10px] truncate">jeetu@leadflow.com</div>
              <div className="text-slate-600 font-mono">Pass: <span className="font-bold text-slate-800 bg-slate-100 px-1 rounded">jeetu123</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3">User</th>
              <th className="p-3">Role</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Login Password</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-3">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        u.role === 'admin' ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}
                    >
                      {u.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        User ID: <span className="font-bold text-blue-700 bg-blue-50 px-1 py-0.5 rounded">{u.username || u.email.split('@')[0]}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      u.role === 'admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-slate-600 font-mono text-[11px]">
                  {u.phone || '-'}
                </td>
                <td className="p-3 font-mono text-slate-500 text-[11px]">
                  {u.password ? '••••••••' : 'Managed in Auth'}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toggleStatus(u)}
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                      u.is_active
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{u.is_active ? 'Active' : 'Deactivated'}</span>
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => openEditModal(u)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit User"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingUser ? `Edit User: ${editingUser.full_name}` : 'Create New User Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              {error && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  User ID (Login Username)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="e.g. admin or alex"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <span className="text-[10px] text-slate-400">Can be used to sign in instead of full email.</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Email Address (Login) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@leadflow.com"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Password {editingUser ? '(leave blank to keep current)' : ''} {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="telecaller">Telecaller / User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 9876543201"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="userActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="userActive" className="text-xs font-semibold text-slate-700">
                  Account Active (Able to sign in and receive leads)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  {editingUser ? 'Save User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
