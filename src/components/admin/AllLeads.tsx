import React, { useState } from 'react';
import { Lead } from '../../types/crm';
import { db } from '../../lib/database';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  UserCheck,
  CheckSquare,
  Square,
  Calendar,
  X,
  RefreshCw,
  Users2,
  UserX,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

interface Props {
  onViewLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onBulkAssignRequest?: (selectedIds: string[]) => void;
  onOpenWipeData?: () => void;
}

export const AllLeads: React.FC<Props> = ({
  onViewLead,
  onUpdateLead,
  onOpenWipeData,
}) => {
  const departments = db.getDepartments();
  const telecallers = db.getUsers(false).filter(u => u.role === 'telecaller');
  const statuses = db.getStatuses();

  // Summary Metrics
  const summary = db.getAdminLeadPoolSummary();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState('');
  const [assignmentStatus, setAssignmentStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [product, setProduct] = useState('');
  const [source, setSource] = useState('');

  // Date filters
  const [importDateRange, setImportDateRange] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [importStartDate, setImportStartDate] = useState('');
  const [importEndDate, setImportEndDate] = useState('');

  const [assignedDateRange, setAssignedDateRange] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [assignedStartDate, setAssignedStartDate] = useState('');
  const [assignedEndDate, setAssignedEndDate] = useState('');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [assignMessage, setAssignMessage] = useState<string | null>(null);

  // Fetch leads based on filters
  const leads = db.getLeads({
    search: search.trim() || undefined,
    department_id: departmentId || undefined,
    user_id: userId || undefined,
    status: status || undefined,
    product: product || undefined,
    source: source || undefined,
    assignment_status: assignmentStatus,
    dateRange: importDateRange,
    startDate: importStartDate || undefined,
    endDate: importEndDate || undefined,
    assigned_date_range: assignedDateRange,
    assigned_start_date: assignedStartDate || undefined,
    assigned_end_date: assignedEndDate || undefined,
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
    setAssignmentStatus('all');
    setProduct('');
    setSource('');
    setImportDateRange('all');
    setImportStartDate('');
    setImportEndDate('');
    setAssignedDateRange('all');
    setAssignedStartDate('');
    setAssignedEndDate('');
    setSelectedIds([]);
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    const exportData = leads.map(l => ({
      'Lead ID': l.lead_code,
      'Customer Name': l.customer_name,
      'Mobile': l.mobile,
      'Alt Mobile': l.alt_mobile || '',
      'Department': l.department_name || '',
      'Product': l.product,
      'Amount': l.amount,
      'Source': l.source,
      'Lead Status': l.status,
      'Assignment Status': l.assigned_to ? 'Assigned' : 'Unassigned',
      'Assigned User': l.assigned_to_name || 'Unassigned',
      'Assigned Date': l.assigned_at ? new Date(l.assigned_at).toLocaleString() : '',
      'Import Date': new Date(l.created_at).toLocaleString(),
      'Latest Remark': l.remark || '',
    }));

    db.exportData(exportData, `Admin_Lead_Pool_${new Date().toISOString().slice(0, 10)}`, format);
  };

  // Inspect selected leads for reassignment warnings
  const selectedLeads = leads.filter(l => selectedIds.includes(l.id));
  const alreadyAssignedCount = selectedLeads.filter(l => Boolean(l.assigned_to)).length;
  const singleAssignedLead = selectedLeads.length === 1 && selectedLeads[0].assigned_to ? selectedLeads[0] : null;
  const targetUserObj = telecallers.find(u => u.id === targetUserId);

  const handleBulkAssign = () => {
    if (!targetUserId || selectedIds.length === 0) return;
    const res = db.assignLeads(selectedIds, targetUserId);
    setAssignMessage(res.message);
    setSelectedIds([]);
    setIsAssignModalOpen(false);
    setTargetUserId('');
    setTimeout(() => setAssignMessage(null), 4500);
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
      case 'Payment Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
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
      {/* 11. ADMIN SUMMARY AT TOP OF LEAD POOL */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Leads */}
        <div
          onClick={() => {
            setAssignmentStatus('all');
            setUserId('');
          }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-blue-400 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Leads</span>
            <Users2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{summary.totalLeads}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">All CRM pool records</div>
        </div>

        {/* Unassigned Leads */}
        <div
          onClick={() => {
            setAssignmentStatus('unassigned');
            setUserId('unassigned');
          }}
          className={`p-4 rounded-xl border shadow-2xs cursor-pointer transition-all ${
            assignmentStatus === 'unassigned' || userId === 'unassigned'
              ? 'bg-amber-100/70 border-amber-400'
              : 'bg-white border-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span>Unassigned</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{summary.unassignedLeads}</div>
          <div className="text-[11px] text-amber-600 mt-0.5 font-medium">Ready for allocation</div>
        </div>

        {/* Assigned Leads */}
        <div
          onClick={() => {
            setAssignmentStatus('assigned');
            if (userId === 'unassigned') setUserId('');
          }}
          className={`p-4 rounded-xl border shadow-2xs cursor-pointer transition-all ${
            assignmentStatus === 'assigned'
              ? 'bg-blue-100/60 border-blue-400'
              : 'bg-white border-slate-200 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wider">
            <span>Assigned</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-800">{summary.assignedLeads}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Allocated to telecallers</div>
        </div>

        {/* Assigned Today */}
        <div
          onClick={() => {
            setAssignedDateRange('today');
          }}
          className={`p-4 rounded-xl border shadow-2xs cursor-pointer transition-all ${
            assignedDateRange === 'today'
              ? 'bg-emerald-100/70 border-emerald-400'
              : 'bg-white border-emerald-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span>Assigned Today</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{summary.assignedToday}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">Assigned on today's date</div>
        </div>
      </div>

      {/* USER-WISE WORKLOAD SUMMARY */}
      {summary.userStats.length > 0 && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            <span>User Lead Distribution & Workload</span>
            <span className="text-[11px] font-normal text-slate-400">Click a user to filter their leads</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {summary.userStats.map(s => {
              const isSelected = userId === s.user.id;
              return (
                <button
                  key={s.user.id}
                  onClick={() => setUserId(isSelected ? '' : s.user.id)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-slate-800">{s.user.full_name}</div>
                    <div className="text-[10px] text-slate-400">Telecaller</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-700 block">{s.assignedCount} Leads</span>
                    <span className="text-[10px] text-emerald-600 font-semibold block">+{s.assignedTodayCount} Today</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Header & Bulk Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin Lead Pool</h1>
          <p className="text-xs text-slate-500">
            Showing {leads.length} lead(s) · Filter, select, and assign or reassign leads to any active telecaller.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              <UserCheck className="w-4 h-4" />
              <span>Assign Selected Leads ({selectedIds.length})</span>
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

          {onOpenWipeData && (
            <button
              onClick={onOpenWipeData}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors"
              title="Permanently remove all leads and CRM data"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Remove All Data</span>
            </button>
          )}
        </div>
      </div>

      {assignMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{assignMessage}</span>
          </div>
          <button onClick={() => setAssignMessage(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* 3 & 4. ADMIN LEAD FILTERS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Row 1: Search & Assignment Status Filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

          {/* Assignment Status Filter */}
          <div>
            <select
              value={assignmentStatus}
              onChange={e => setAssignmentStatus(e.target.value as any)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-semibold bg-white"
            >
              <option value="all">Assignment: All Statuses</option>
              <option value="unassigned">⚠️ Unassigned Only</option>
              <option value="assigned">✓ Assigned Only</option>
            </select>
          </div>

          {/* Assigned User Filter */}
          <div>
            <select
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Assigned User: All Users</option>
              <option value="unassigned">⚠️ Unassigned Leads</option>
              {telecallers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Secondary Dropdowns & Date Pickers */}
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

          {/* Product */}
          <input
            type="text"
            value={product}
            onChange={e => setProduct(e.target.value)}
            placeholder="Filter Product..."
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
          />

          {/* Status */}
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Lead Statuses</option>
            {statuses.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>

          {/* Source */}
          <select
            value={source}
            onChange={e => setSource(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Sources</option>
            <option value="Excel Import">Excel Import</option>
            <option value="Website Landing Page">Website Landing Page</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Facebook Ad">Facebook Ad</option>
            <option value="Referral">Referral</option>
          </select>
        </div>

        {/* Row 3: Quick Date Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <span className="font-semibold">Import Date:</span>
              <select
                value={importDateRange}
                onChange={e => setImportDateRange(e.target.value as any)}
                className="text-xs px-2 py-1 rounded border border-slate-300 bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <span className="font-semibold">Assigned Date:</span>
              <select
                value={assignedDateRange}
                onChange={e => setAssignedDateRange(e.target.value as any)}
                className="text-xs px-2 py-1 rounded border border-slate-300 bg-white"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-xs px-3 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium flex items-center space-x-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Custom date range pickers if selected */}
        {(importDateRange === 'custom' || assignedDateRange === 'custom') && (
          <div className="flex flex-wrap items-center gap-4 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            {importDateRange === 'custom' && (
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-600">Import:</span>
                <input
                  type="date"
                  value={importStartDate}
                  onChange={e => setImportStartDate(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded bg-white"
                />
                <span>to</span>
                <input
                  type="date"
                  value={importEndDate}
                  onChange={e => setImportEndDate(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded bg-white"
                />
              </div>
            )}
            {assignedDateRange === 'custom' && (
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-600">Assigned:</span>
                <input
                  type="date"
                  value={assignedStartDate}
                  onChange={e => setAssignedStartDate(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded bg-white"
                />
                <span>to</span>
                <input
                  type="date"
                  value={assignedEndDate}
                  onChange={e => setAssignedEndDate(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded bg-white"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. ADMIN LEAD POOL TABLE */}
      {/* Required Columns: Checkbox | Lead ID | Customer Name | Mobile | Department | Product | Source | Lead Status | Assignment Status | Assigned User | Assigned Date | Import Date | Action */}
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
                <th className="p-3">Customer Name</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Department</th>
                <th className="p-3">Product</th>
                <th className="p-3">Source</th>
                <th className="p-3">Lead Status</th>
                <th className="p-3">Assignment Status</th>
                <th className="p-3">Assigned User</th>
                <th className="p-3">Assigned Date</th>
                <th className="p-3">Import Date</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-400 text-xs">
                    No leads match the specified search or filter criteria in the Admin Lead Pool.
                  </td>
                </tr>
              ) : (
                leads.map(lead => {
                  const isSelected = selectedIds.includes(lead.id);
                  const isAssigned = Boolean(lead.assigned_to);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isSelected ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      {/* Checkbox */}
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

                      {/* Lead ID */}
                      <td className="p-3 font-mono font-bold text-blue-600">
                        {lead.lead_code}
                      </td>

                      {/* Customer Name */}
                      <td className="p-3 font-bold text-slate-900">
                        <div>{lead.customer_name}</div>
                        {lead.city && (
                          <div className="text-[10px] text-slate-400 font-normal">{lead.city}</div>
                        )}
                      </td>

                      {/* Mobile */}
                      <td className="p-3">
                        <span className="font-mono text-slate-800 font-medium">{lead.mobile}</span>
                      </td>

                      {/* Department */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {lead.department_name}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="p-3 text-slate-800 font-medium">
                        {lead.product}
                      </td>

                      {/* Source */}
                      <td className="p-3 text-slate-600 text-[11px]">
                        {lead.source}
                      </td>

                      {/* Lead Status */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>

                      {/* 2. Assignment Status */}
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

                      {/* Assigned User */}
                      <td className="p-3">
                        {isAssigned ? (
                          <span className="font-bold text-slate-900">{lead.assigned_to_name}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Assigned Date */}
                      <td className="p-3 text-slate-600">
                        {lead.assigned_at ? (
                          <span className="text-[11px] font-medium text-slate-700">
                            {new Date(lead.assigned_at).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Import Date */}
                      <td className="p-3 text-slate-500 text-[11px]">
                        {new Date(lead.created_at).toLocaleString()}
                      </td>

                      {/* Actions: View Details | Update Status */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onViewLead(lead)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Lead Details & Assignment History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onUpdateLead(lead)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Update Status / Note"
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

      {/* 4, 5, 7 & 8. MANUAL BULK ASSIGNMENT & REASSIGNMENT MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                Assign {selectedIds.length} Lead(s) to User
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Reassignment Warning Banner */}
              {alreadyAssignedCount > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1.5 text-amber-900">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Reassignment Notice</span>
                  </div>
                  {singleAssignedLead ? (
                    <p>
                      This lead is currently assigned to <strong>{singleAssignedLead.assigned_to_name}</strong>.
                      Assigning it will update the user and record the transfer in the permanent Assignment History.
                    </p>
                  ) : (
                    <p>
                      <strong>{alreadyAssignedCount}</strong> of the <strong>{selectedIds.length}</strong> selected lead(s) are already assigned to active telecallers.
                      Proceeding will reassign them and record the transfer in each lead's audit trail.
                    </p>
                  )}
                </div>
              )}

              {/* 5. USER SELECTION WITH CURRENTLY ASSIGNED COUNT */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Select Active Telecaller <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Users are independent of departments; you may assign these leads to any active user.
                </p>
                <select
                  value={targetUserId}
                  onChange={e => setTargetUserId(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Active Telecaller --</option>
                  {telecallers.map(u => {
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

              {/* Confirmation preview before assignment */}
              {targetUserObj && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <span className="font-semibold text-slate-700 block">Assignment Confirmation:</span>
                  <p className="text-slate-600">
                    Assigning <strong>{selectedIds.length} lead(s)</strong> to <strong>{targetUserObj.full_name}</strong>.
                    The telecaller will immediately see them inside <em>My Leads</em>.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!targetUserId}
                  onClick={handleBulkAssign}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  Confirm & Assign Leads
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
