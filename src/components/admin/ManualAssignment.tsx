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
} from 'lucide-react';
import { AdminView } from '../layout/Sidebar';

interface Props {
  onNavigate: (view: AdminView) => void;
}

export const ManualAssignment: React.FC<Props> = ({ onNavigate }) => {
  const departments = db.getDepartments();

  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || '');
  const [filterMode, setFilterMode] = useState<'unassigned' | 'all'>('unassigned');
  const [search, setSearch] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Relevant telecallers: ONLY ACTIVE USERS FROM THE RELEVANT DEPARTMENT
  const activeTelecallers = db.getTelecallersByDepartment(selectedDeptId);

  // Leads for the chosen department
  const deptLeads = db.getLeads({
    department_id: selectedDeptId,
    onlyUnassigned: filterMode === 'unassigned',
    search: search.trim() || undefined,
  });

  const allSelected = deptLeads.length > 0 && selectedLeadIds.length === deptLeads.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(deptLeads.map(l => l.id));
    }
  };

  const toggleLead = (id: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAssign = () => {
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
    setTimeout(() => setFeedback(null), 4000);
  };

  const currentDept = departments.find(d => d.id === selectedDeptId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Manual Lead Assignment & Reassignment</h1>
        <p className="text-xs text-slate-500">
          Admin selects Department → Selects leads → Selects Telecaller from that department → Assigns in bulk.
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
          {/* 1. Department Selection */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Select Department</span>
            </label>
            <select
              value={selectedDeptId}
              onChange={e => {
                setSelectedDeptId(e.target.value);
                setSelectedLeadIds([]);
                setTargetUserId('');
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Target Telecaller from Relevant Department */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Assign To Telecaller ({activeTelecallers.length} Available)</span>
            </label>
            <select
              value={targetUserId}
              onChange={e => setTargetUserId(e.target.value)}
              disabled={activeTelecallers.length === 0}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            >
              <option value="">
                {activeTelecallers.length === 0
                  ? 'No telecallers in this department'
                  : '-- Choose Telecaller --'}
              </option>
              {activeTelecallers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.phone || u.email})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Assign Button */}
          <div>
            <button
              onClick={handleAssign}
              disabled={selectedLeadIds.length === 0 || !targetUserId}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Assign Selected ({selectedLeadIds.length}) Leads</span>
            </button>
          </div>
        </div>

        {activeTelecallers.length === 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
            <span>
              No active telecallers are currently assigned to the <strong>{currentDept?.name}</strong> department.
            </span>
            <button
              onClick={() => onNavigate('users')}
              className="text-xs font-bold text-amber-900 underline hover:text-black"
            >
              Assign Users in User Master →
            </button>
          </div>
        )}
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
                All Department Leads (Reassignment)
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
                <th className="p-3">Product</th>
                <th className="p-3">Deal Value</th>
                <th className="p-3">Currently Assigned To</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                    No leads found matching "{filterMode === 'unassigned' ? 'Unassigned' : 'All'}" in {currentDept?.name}.
                  </td>
                </tr>
              ) : (
                deptLeads.map(lead => {
                  const isSelected = selectedLeadIds.includes(lead.id);
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
                      <td className="p-3 text-slate-800">{lead.product}</td>
                      <td className="p-3 font-semibold text-emerald-700">
                        ${(lead.amount || 0).toLocaleString()}
                      </td>
                      <td className="p-3">
                        {lead.assigned_to_name ? (
                          <span className="font-semibold text-slate-800">{lead.assigned_to_name}</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Unassigned
                          </span>
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
    </div>
  );
};
