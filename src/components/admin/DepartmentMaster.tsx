import React, { useState } from 'react';
import { Department } from '../../types/crm';
import { db } from '../../lib/database';
import { Building2, Plus, Edit2, Check, X, Shield, Power } from 'lucide-react';

export const DepartmentMaster: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>(db.getDepartments(true));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshList = () => {
    setDepartments(db.getDepartments(true));
  };

  const openAddModal = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setDescription('');
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description || '');
    setIsActive(dept.is_active);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Name and Code are required fields.');
      return;
    }

    if (editingDept) {
      db.updateDepartment(editingDept.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        is_active: isActive,
      });
    } else {
      db.addDepartment({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        is_active: isActive,
      });
    }

    setIsModalOpen(false);
    refreshList();
  };

  const toggleStatus = (dept: Department) => {
    db.updateDepartment(dept.id, { is_active: !dept.is_active });
    refreshList();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Department Master</h1>
          <p className="text-xs text-slate-500">
            Add, edit, activate or deactivate departments. Each user and lead is mapped to a department.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3">Department Name</th>
              <th className="p-3">Code</th>
              <th className="p-3">Description</th>
              <th className="p-3">Total Leads</th>
              <th className="p-3">Active Users</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map(dept => {
              const leadCount = db.getLeads({ department_id: dept.id }).length;
              const userCount = db.getTelecallersByDepartment(dept.id).length;
              return (
                <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>{dept.name}</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-blue-700">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">{dept.code}</span>
                  </td>
                  <td className="p-3 text-slate-500 max-w-xs truncate">{dept.description || '-'}</td>
                  <td className="p-3 font-semibold text-slate-700">{leadCount}</td>
                  <td className="p-3 font-semibold text-slate-700">{userCount}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleStatus(dept)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                        dept.is_active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{dept.is_active ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => openEditModal(dept)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Department"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingDept ? 'Edit Department' : 'Create New Department'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Mortgages & Home Refinance"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Department Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="e.g. MKT, HL, INS"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 uppercase font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Operational scope or summary..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="deptActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="deptActive" className="text-xs font-semibold text-slate-700">
                  Active Department
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
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
