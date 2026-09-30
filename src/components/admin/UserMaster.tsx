import React, { useState } from 'react';
import { Profile, UserRole } from '../../types/crm';
import { db } from '../../lib/database';
import { UserCog, Plus, Edit2, Shield, User, Key, Power, X, Phone, Mail, Building2 } from 'lucide-react';

export const UserMaster: React.FC = () => {
  const [users, setUsers] = useState<(Profile & { password?: string })[]>(db.getUsers(true) as any);
  const departments = db.getDepartments();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<(Profile & { password?: string }) | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('telecaller');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshList = () => {
    setUsers(db.getUsers(true) as any);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('telecaller');
    setDepartmentId(departments[0]?.id || '');
    setPhone('');
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: Profile & { password?: string }) => {
    setEditingUser(u);
    setFullName(u.full_name);
    setEmail(u.email);
    setPassword(u.password || '');
    setRole(u.role);
    setDepartmentId(u.department_id || departments[0]?.id || '');
    setPhone(u.phone || '');
    setIsActive(u.is_active);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Full Name and Email are required.');
      return;
    }

    if (!editingUser && !password.trim()) {
      setError('Password is required for new users.');
      return;
    }

    const dept = departments.find(d => d.id === departmentId);

    if (editingUser) {
      db.updateUser(editingUser.id, {
        full_name: fullName.trim(),
        email: email.trim(),
        role,
        department_id: departmentId,
        department_name: dept?.name,
        phone: phone.trim(),
        password: password.trim() ? password.trim() : editingUser.password,
        is_active: isActive,
      });
    } else {
      db.addUser({
        full_name: fullName.trim(),
        email: email.trim(),
        role,
        department_id: departmentId,
        department_name: dept?.name,
        phone: phone.trim(),
        password: password.trim(),
        is_active: isActive,
      });
    }

    setIsModalOpen(false);
    refreshList();
  };

  const toggleStatus = (u: Profile) => {
    db.updateUser(u.id, { is_active: !u.is_active });
    refreshList();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Master & Authentication</h1>
          <p className="text-xs text-slate-500">
            Manage system administrators and telecaller staff with logins, passwords and department mapping.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3">User</th>
              <th className="p-3">Role</th>
              <th className="p-3">Assigned Department</th>
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
                      <div className="text-[11px] text-slate-400">{u.email}</div>
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
                <td className="p-3">
                  <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {u.department_name || 'General'}
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
                  Password {editingUser ? '(leave blank to keep current)' : '<span className="text-red-500">*</span>'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 555-0101"
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
