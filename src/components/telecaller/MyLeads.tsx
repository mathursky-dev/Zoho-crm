import React, { useState, useEffect } from 'react';
import { Lead } from '../../types/crm';
import { db } from '../../lib/database';
import {
  Search,
  Filter,
  Phone,
  Eye,
  Edit,
  Download,
  Calendar,
  X,
  RefreshCw,
  PhoneCall,
  Lock,
  Unlock,
} from 'lucide-react';

interface Props {
  initialStatusFilter?: string;
  onViewLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onStartQueue: () => void;
}

export const MyLeads: React.FC<Props> = ({
  initialStatusFilter = '',
  onViewLead,
  onUpdateLead,
  onStartQueue,
}) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(initialStatusFilter);
  const [product, setProduct] = useState('');
  const [source, setSource] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'yesterday' | 'week' | '7days' | '30days' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [unlockedMap, setUnlockedMap] = useState<Record<string, boolean>>({});
  const [, setVersion] = useState(0);

  const handleUnlockMobile = (leadId: string) => {
    db.unlockLeadMobile(leadId);
    setUnlockedMap(prev => ({ ...prev, [leadId]: true }));
    setVersion(v => v + 1);
  };

  // Update status when initialStatusFilter changes (e.g. from KPI card click)
  useEffect(() => {
    setStatus(initialStatusFilter);
  }, [initialStatusFilter]);

  const statuses = db.getStatuses();

  // Strict RLS: db.getLeads() automatically restricts to assigned_to === currentUser.id for telecaller role!
  const leads = db.getLeads({
    search,
    status: status || undefined,
    product: product || undefined,
    source: source || undefined,
    dateRange,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setProduct('');
    setSource('');
    setDateRange('all');
    setStartDate('');
    setEndDate('');
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    const exportData = leads.map(l => ({
      'Lead ID': l.lead_code,
      'Customer': l.customer_name,
      'Mobile': l.mobile,
      'Product': l.product,
      'Department': l.department_name || '',
      'Status': l.status,
      'Follow-up': l.followup_date ? new Date(l.followup_date).toLocaleString() : '',
      'Last Remark': l.remark || '',
      'Assigned Date': l.assigned_at ? new Date(l.assigned_at).toLocaleDateString() : '',
    }));

    db.exportData(exportData, `My_Leads_${new Date().toISOString().slice(0, 10)}`, format);
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
          <h1 className="text-xl font-bold text-slate-900">My Assigned Leads</h1>
          <p className="text-xs text-slate-500">
            Showing {leads.length} lead(s) assigned to you · Strictly isolated by Row-Level Security
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onStartQueue}
            disabled={leads.length === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Start Calling Queue</span>
          </button>

          {/* Export Buttons: Explicitly disabled for telecallers */}
          <div
            className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-100 text-xs font-semibold cursor-not-allowed opacity-75 shadow-2xs"
            title="Export disabled for Telecallers by Administrator Policy"
          >
            <button
              type="button"
              disabled
              className="px-3 py-2 text-slate-400 cursor-not-allowed flex items-center space-x-1.5 border-r border-slate-200"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Excel (Disabled)</span>
            </button>
            <button
              type="button"
              disabled
              className="px-3 py-2 text-slate-400 cursor-not-allowed"
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Row 1: Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Customer Name, Mobile, or Lead ID..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date Range Selector with Quick Pills */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lead Date Range:</span>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs px-2 py-0.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded font-medium flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { label: 'All Dates', value: 'all' },
                { label: 'Today', value: 'today' },
                { label: 'Yesterday', value: 'yesterday' },
                { label: 'Last 7 Days', value: '7days' },
                { label: 'Last 30 Days', value: '30days' },
                { label: 'This Month', value: 'month' },
                { label: 'Custom Range', value: 'custom' },
              ] as const
            ).map(preset => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setDateRange(preset.value);
                  if (preset.value !== 'custom') {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  dateRange === preset.value
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom date range inputs */}
          {dateRange === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200 text-xs mt-1 animate-in fade-in">
              <span className="font-bold text-emerald-900">Custom Date Range:</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-600 font-medium">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded bg-white shadow-2xs"
                />
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-600 font-medium">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded bg-white shadow-2xs"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-emerald-700 hover:text-emerald-900 underline font-semibold text-[11px]"
                >
                  Clear dates
                </button>
              )}
            </div>
          )}
        </div>

        {/* Row 2: Secondary Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
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

          {/* Product */}
          <input
            type="text"
            value={product}
            onChange={e => setProduct(e.target.value)}
            placeholder="Filter Product..."
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
          />

          {/* Source */}
          <select
            value={source}
            onChange={e => setSource(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
          >
            <option value="">All Sources</option>
            <option value="Website Landing Page">Website Landing Page</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Facebook Ad">Facebook Ad</option>
            <option value="Referral">Referral</option>
            <option value="Excel Import">Excel Import</option>
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

      {/* MY LEADS TABLE */}
      {/* Spec: Lead ID | Customer | Mobile | Product | Department | Status | Follow-up | Last Remark | Action */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3">Lead ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Product</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
                <th className="p-3">Follow-up</th>
                <th className="p-3">Last Remark</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                    No leads found in your assigned queue matching current filters.
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-blue-50/40 transition-colors">
                    {/* Lead ID */}
                    <td className="p-3 font-mono font-bold text-blue-600">
                      {lead.lead_code}
                    </td>

                    {/* Customer */}
                    <td className="p-3 font-bold text-slate-900">
                      <div>{lead.customer_name}</div>
                      {lead.city && (
                        <div className="text-[10px] text-slate-400 font-normal">{lead.city}</div>
                      )}
                    </td>

                    {/* Mobile with Unblock button and count */}
                    <td className="p-3">
                      {unlockedMap[lead.id] ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <a
                              href={`tel:${lead.mobile}`}
                              className="font-mono font-bold text-slate-900 hover:text-blue-600 hover:underline flex items-center space-x-1 text-xs"
                            >
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{lead.mobile}</span>
                            </a>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <Eye className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Unlocked: {lead.mobile_unlock_count || 1} {(lead.mobile_unlock_count || 1) === 1 ? 'time' : 'times'}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUnlockMobile(lead.id)}
                              title="Unlock again to count view"
                              className="text-[10px] text-blue-600 hover:text-blue-800 underline font-medium"
                            >
                              +1
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => handleUnlockMobile(lead.id)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-b from-white via-slate-50 to-slate-100 hover:from-slate-50 hover:to-slate-200 border-2 border-slate-400 active:border-slate-600 rounded text-blue-700 hover:text-blue-800 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                            title="Click to unblock and view customer mobile number"
                          >
                            <Unlock className="w-3.5 h-3.5 text-blue-600" />
                            <span>Unblock</span>
                          </button>
                          {lead.mobile_unlock_count && lead.mobile_unlock_count > 0 ? (
                            <div className="text-[10px] text-amber-700 font-semibold flex items-center space-x-1">
                              <Eye className="w-2.5 h-2.5 text-amber-600" />
                              <span>Unlocked {lead.mobile_unlock_count}x</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">Locked</div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Product */}
                    <td className="p-3 text-slate-800 font-medium">
                      <div>{lead.product}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        ${(lead.amount || 0).toLocaleString()}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {lead.department_name}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${getStatusBadge(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>

                    {/* Follow-up */}
                    <td className="p-3 text-slate-600">
                      {lead.followup_date ? (
                        <span className="text-[11px] font-semibold text-amber-800">
                          {new Date(lead.followup_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Last Remark */}
                    <td className="p-3 text-slate-500 max-w-xs truncate" title={lead.remark}>
                      {lead.remark || '-'}
                    </td>

                    {/* Actions: View | Update (No Call button per requirement) */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onViewLead(lead)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center space-x-1"
                          title="View Lead Details & History"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => onUpdateLead(lead)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold flex items-center space-x-1"
                          title="Update Lead Status & Notes"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Update</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
