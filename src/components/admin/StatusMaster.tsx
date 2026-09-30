import React, { useState } from 'react';
import { LeadStatus } from '../../types/crm';
import { db } from '../../lib/database';
import { Tags, Plus, Edit2, Power, X } from 'lucide-react';

export const StatusMaster: React.FC = () => {
  const [statuses, setStatuses] = useState<LeadStatus[]>(db.getStatuses(true));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<LeadStatus | null>(null);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    setStatuses(db.getStatuses(true));
  };

  const openAdd = () => {
    setEditingStatus(null);
    setName('');
    setColor('#2563eb');
    setDisplayOrder(statuses.length + 1);
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (s: LeadStatus) => {
    setEditingStatus(s);
    setName(s.name);
    setColor(s.color);
    setDisplayOrder(s.display_order);
    setIsActive(s.is_active);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Status Name is required.');
      return;
    }

    if (editingStatus) {
      db.updateStatus(editingStatus.id, {
        name: name.trim(),
        color,
        display_order: Number(displayOrder),
        is_active: isActive,
      });
    } else {
      db.addStatus({
        name: name.trim(),
        color,
        display_order: Number(displayOrder),
        is_active: isActive,
      });
    }

    setIsModalOpen(false);
    refresh();
  };

  const toggleStatus = (s: LeadStatus) => {
    db.updateStatus(s.id, { is_active: !s.is_active });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Status Master</h1>
          <p className="text-xs text-slate-500">
            Define call dispositions, lead milestones, and color coding across telecaller dashboards.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Status</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3 w-16">Order</th>
              <th className="p-3">Status Name</th>
              <th className="p-3">Badge Preview</th>
              <th className="p-3">Active Leads Count</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {statuses.map(s => {
              const count = db.getLeads({ status: s.name }).length;
              return (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-mono text-slate-400 font-bold text-center">
                    {s.display_order}
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    {s.name}
                  </td>
                  <td className="p-3">
                    <span
                      style={{ backgroundColor: `${s.color}20`, color: s.color, borderColor: `${s.color}50` }}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-flex items-center space-x-1.5"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span>{s.name}</span>
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-700">{count}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleStatus(s)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                        s.is_active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{s.is_active ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Status"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingStatus ? 'Edit Status' : 'Add New Status'}
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
                  Status Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Appointment Booked"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Color Code</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={e => setDisplayOrder(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="statusActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="statusActive" className="text-xs font-semibold text-slate-700">
                  Status Active (Available in Update dropdown)
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
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
