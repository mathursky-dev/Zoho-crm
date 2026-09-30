import React, { useState } from 'react';
import { Lead } from '../../types/crm';
import { db } from '../../lib/database';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Phone,
  UserCheck,
  CheckSquare,
  Square,
  Calendar,
  X,
  RefreshCw,
} from 'lucide-react';

interface Props {
  onViewLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onBulkAssignRequest?: (selectedIds: string[]) => void;
}

export const AllLeads: React.FC<Props> = ({
  onViewLead,
  onUpdateLead,
  onBulkAssignRequest,
}) => {
  const departments = db.getDepartments();
  const telecallers = db.getUsers(false).filter(u => u.role === 'telecaller');
  const statuses = db.getStatuses();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState('');
  const [product, setProduct] = useState('');
  const [source, setSource] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [assignMessage, setAssignMessage] = useState<string | null>(null);

  // Fetch leads based on filters
  const leads = db.getLeads({
    search,
    department_id: departmentId || undefined,
    user_id: userId || undefined,
    status: status || undefined,
    product: product || undefined,
    source: source || undefined,
    dateRange,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const allSelected = leads.length > 0 && selectedIds.length === leads.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setSearch('');
    setDepartmentId('');
    setUserId('');
    setStatus('');
    setProduct('');
    setSource('');
    setDateRange('all');
    setStartDate('');
    setEndDate('');
    setSelectedIds([]);
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    const exportData = leads.map(l => ({
      'Lead Code': l.lead_code,
      'Customer Name': l.customer_name,
      'Mobile': l.mobile,
      'Alt Mobile': l.alt_mobile || '',
      'City': l.city || '',
      'State': l.state || '',
      'Department': l.department_name || '',
      'Product': l.product,
      'Amount': l.amount,
      'Source': l.source,
      'Status': l.status,
      'Assigned To': l.assigned_to_name || 'Unassigned',
      'Latest Remark': l.remark || '',
      'Follow-up Date': l.followup_date ? new Date(l.followup_date).toLocaleString() : '',
      'Created Date': new Date(l.created_at).toLocaleDateString(),
    }));

    db.exportData(exportData, `Leads_Export_${new Date().toISOString().slice(0, 10)}`, format);
  };

  const handleBulkAssign = () => {
    if (!targetUserId || selectedIds.length === 0) return;
    const res = db.assignLeads(selectedIds, targetUserId);
    setAssignMessage(res.message);
    setSelectedIds([]);
    setIsAssignModalOpen(false);
    setTimeout(() => setAssignMessage(null), 3500);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Untouched': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Contacted': return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Follow-up': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Call Back': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Interested': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Hot Lead': return 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse';
      case 'Order Placed':
      case 'Converted': return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'Money Problem': return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'No Answer':
      case 'Busy': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Not Interested':
      case 'Wrong Number': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">All Leads Master</h1>
          <p className="text-xs text-slate-500">
            Showing {leads.length} lead(s) · Search, filter, select and assign leads in bulk
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign Selected ({selectedIds.length})</span>
            </button>
          )}

          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white text-xs font-semibold">
            <button
              onClick={() => handleExport('xlsx')}
              className="px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center space-x-1 border-r border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-2 hover:bg-slate-50 text-slate-700"
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      {assignMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center justify-between">
          <span>{assignMessage}</span>
          <button onClick={() => setAssignMessage(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Row 1: Search + Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Customer Name, Mobile, or Lead ID..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past 7 Days</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        {/* Custom date range inputs */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded bg-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded bg-white"
              />
            </div>
          </div>
        )}

        {/* Row 2: Secondary Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* Department */}
          <select
            value={departmentId}
            onChange={e => setDepartmentId(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* User / Telecaller */}
          <select
            value={userId}
            onChange={e => setUserId(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Assigned Users</option>
            <option value="unassigned">⚠️ Unassigned Only</option>
            {telecallers.map(u => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.department_name || 'General'})</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs px-3 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium flex items-center justify-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* LEADS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
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
                <th className="p-3">Lead ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Product</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned User</th>
                <th className="p-3">Follow-up</th>
                <th className="p-3">Last Remark</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 text-xs">
                    No leads match the specified search or filter criteria.
                  </td>
                </tr>
              ) : (
                leads.map(lead => {
                  const isSelected = selectedIds.includes(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isSelected ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleSelectLead(lead.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-600">
                        {lead.lead_code}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {lead.customer_name}
                      </td>
                      <td className="p-3">
                        <a
                          href={`tel:${lead.mobile}`}
                          className="text-slate-700 hover:text-blue-600 font-medium"
                        >
                          {lead.mobile}
                        </a>
                      </td>
                      <td className="p-3 text-slate-800 font-medium">
                        {lead.product}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {lead.department_name}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {lead.assigned_to_name ? (
                          <span className="text-slate-800 font-medium">{lead.assigned_to_name}</span>
                        ) : (
                          <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">
                        {lead.followup_date ? (
                          <span className="text-[11px] font-medium text-amber-800">
                            {new Date(lead.followup_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate" title={lead.remark}>
                        {lead.remark || '-'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <a
                            href={`tel:${lead.mobile}`}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => onViewLead(lead)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onUpdateLead(lead)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Update Status"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Bulk Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Bulk Assign {selectedIds.length} Lead(s)</h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Select a telecaller to assign or reassign the {selectedIds.length} chosen lead(s):
              </p>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Assign To Telecaller
                </label>
                <select
                  value={targetUserId}
                  onChange={e => setTargetUserId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Active Telecaller --</option>
                  {telecallers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.department_name || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!targetUserId}
                  onClick={handleBulkAssign}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
