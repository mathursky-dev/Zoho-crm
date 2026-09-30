import React, { useState } from 'react';
import { db } from '../../lib/database';
import {
  UserCheck,
  Building2,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  Users,
  Search,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { AdminView } from '../layout/Sidebar';

interface Props {
  onNavigate: (view: AdminView) => void;
}

export const ManualAssignment: React.FC<Props> = ({ onNavigate }) => {
  const departments = db.getDepartments();
  // Requirement 2: Users must NOT belong to departments. Users are independent.
  // Admin can assign leads to ANY Active User.
  const activeTelecallers = db.getUsers(false).filter(u => u.role === 'telecaller');
  const summary = db.getAdminLeadPoolSummary();

  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [filterMode, setFilterMode] = useState<'unassigned' | 'all'>('unassigned');
  const [search, setSearch] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Leads for the chosen department or all departments
  const leads = db.getLeads({
    department_id: selectedDeptId || undefined,
    onlyUnassigned: filterMode === 'unassigned',
    search: search.trim() || undefined,
  });

  const allSelected = leads.length > 0 && selectedLeadIds.length === leads.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map(l => l.id));
    }
  };

  const toggleLead = (id: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
  const alreadyAssignedCount = selectedLeads.filter(l => Boolean(l.assigned_to)).length;
  const singleAssignedLead = selectedLeads.length === 1 && selectedLeads[0].assigned_to ? selectedLeads[0] : null;
  const targetUserObj = activeTelecallers.find(u => u.id === targetUserId);

  const executeAssignment = () => {
    if (!targetUserId) {
      setFeedback({ type: 'error', message: 'Please select a telecaller to assign the leads to.' });
      return;
    }
    if (selectedLeadIds.length === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one lead from the table.' });
      return;
    }

    const res = db.assignLeads(selectedLeadIds, targetUserId);
    setFeedback({ type: 'success', message: res.message });
    setSelectedLeadIds([]);
    setTargetUserId('');
    setShowConfirmModal(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAssignClick = () => {
    if (!targetUserId) {
      setFeedback({ type: 'error', message: 'Please select a telecaller to assign the leads to.' });
      return;
    }
    if (selectedLeadIds.length === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one lead from the table.' });
      return;
    }

    // If any lead is already assigned, show confirmation prompt
    if (alreadyAssignedCount > 0) {
      setShowConfirmModal(true);
    } else {
      executeAssignment();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Manual Lead Assignment & Reassignment</h1>
        <p className="text-xs text-slate-500">
          Admin selects leads (optionally filtered by Department) → Selects ANY active telecaller → Assigns in bulk.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Control Station Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* 1. Department Selection (Optional Lead Filter) */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Filter by Department</span>
            </label>
            <select
              value={selectedDeptId}
              onChange={e => {
                setSelectedDeptId(e.target.value);
                setSelectedLeadIds([]);
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Target Telecaller (ANY active user) */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Assign To Telecaller ({activeTelecallers.length} Active)</span>
            </label>
            <select
              value={targetUserId}
              onChange={e => setTargetUserId(e.target.value)}
              disabled={activeTelecallers.length === 0}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            >
              <option value="">-- Choose Active Telecaller --</option>
              {activeTelecallers.map(u => {
                const stats = summary.userStats.find(s => s.user.id === u.id);
                const leadCount = stats ? stats.assignedCount : 0;
                return (
                  <option key={u.id} value={u.id}>
                    {u.full_name} | {leadCount} Leads Assigned
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3. Assign Button */}
          <div>
            <button
              onClick={handleAssignClick}
              disabled={selectedLeadIds.length === 0 || !targetUserId}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Assign Selected ({selectedLeadIds.length}) Leads</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leads Selection Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-3">
        {/* Table Filters & Counters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700">Filter Leads:</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium">
              <button
                onClick={() => {
                  setFilterMode('unassigned');
                  setSelectedLeadIds([]);
                }}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterMode === 'unassigned'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unassigned Only
              </button>
              <button
                onClick={() => {
                  setFilterMode('all');
                  setSelectedLeadIds([]);
                }}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filterMode === 'all'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Leads (Reassignment)
              </button>
            </div>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by customer, phone, code..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">Lead Code</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Department</th>
                <th className="p-3">Product</th>
                <th className="p-3">Assignment Status</th>
                <th className="p-3">Currently Assigned To</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 text-xs">
                    No leads found matching "{filterMode === 'unassigned' ? 'Unassigned' : 'All'}".
                  </td>
                </tr>
              ) : (
                leads.map(lead => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  const isAssigned = Boolean(lead.assigned_to);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => toggleLead(lead.id)}
                      className={`cursor-pointer hover:bg-blue-50/40 transition-colors ${
                        isSelected ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => toggleLead(lead.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-600">{lead.lead_code}</td>
                      <td className="p-3 font-bold text-slate-900">{lead.customer_name}</td>
                      <td className="p-3 font-mono text-slate-700">{lead.mobile}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {lead.department_name}
                        </span>
                      </td>
                      <td className="p-3 text-slate-800">{lead.product}</td>
                      <td className="p-3">
                        {isAssigned ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold text-[11px]">
                            <span>Assigned ✓</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-semibold text-[11px]">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {lead.assigned_to_name ? (
                          <span className="font-semibold text-slate-800">{lead.assigned_to_name}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium">
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reassignment Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Confirm Reassignment</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start space-x-3 text-amber-800 bg-amber-50 p-3.5 rounded-lg border border-amber-200 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  {singleAssignedLead ? (
                    <p>
                      This lead is currently assigned to <strong>{singleAssignedLead.assigned_to_name}</strong>.
                      Do you want to reassign it to <strong>{targetUserObj?.full_name}</strong>?
                    </p>
                  ) : (
                    <p>
                      <strong>{alreadyAssignedCount}</strong> of the selected leads are currently assigned to other users.
                      Do you want to reassign them to <strong>{targetUserObj?.full_name}</strong>?
                    </p>
                  )}
                  <p className="mt-1.5 text-[11px] text-amber-700">
                    The previous assignment will remain permanently recorded in the Assignment History audit log.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeAssignment}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Confirm & Reassign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
