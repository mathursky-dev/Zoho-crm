import React, { useState } from 'react';
import { db } from '../../lib/database';
import { Download, Calendar, TrendingUp, CheckCircle, BarChart2, Lock } from 'lucide-react';

export const TelecallerReports: React.FC = () => {
  const user = db.getCurrentUser();
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch leads filtered by date range and restricted to user
  const leads = db.getLeads({
    dateRange,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const totalAssigned = leads.length;
  let untouched = 0;
  let contacted = 0;
  let followup = 0;
  let callback = 0;
  let interested = 0;
  let hot = 0;
  let orderPlaced = 0;
  let moneyProblem = 0;
  let noAnswer = 0;
  let notInterested = 0;
  let converted = 0;

  leads.forEach(l => {
    if (!l.last_activity_at || l.status === 'Untouched') untouched++;

    switch (l.status) {
      case 'Contacted': contacted++; break;
      case 'Follow-up': followup++; break;
      case 'Call Back': callback++; break;
      case 'Interested': interested++; break;
      case 'Hot Lead': hot++; break;
      case 'Order Placed': orderPlaced++; break;
      case 'Money Problem': moneyProblem++; break;
      case 'No Answer': noAnswer++; break;
      case 'Not Interested': notInterested++; break;
      case 'Converted': converted++; break;
    }
  });

  const worked = totalAssigned - untouched;
  const totalOrders = orderPlaced + converted;
  const conversionRate = totalAssigned > 0 ? ((totalOrders / totalAssigned) * 100).toFixed(1) : '0.0';

  const reportItems = [
    { label: 'Assigned', count: totalAssigned, color: 'text-slate-800 bg-slate-100 border-slate-200' },
    { label: 'Worked', count: worked, color: 'text-blue-800 bg-blue-50 border-blue-200' },
    { label: 'Untouched', count: untouched, color: 'text-slate-700 bg-slate-50 border-slate-200' },
    { label: 'Contacted', count: contacted, color: 'text-sky-800 bg-sky-50 border-sky-200' },
    { label: 'Follow-up', count: followup, color: 'text-amber-800 bg-amber-50 border-amber-200' },
    { label: 'Call Back', count: callback, color: 'text-orange-800 bg-orange-50 border-orange-200' },
    { label: 'Interested', count: interested, color: 'text-purple-800 bg-purple-50 border-purple-200' },
    { label: 'Hot', count: hot, color: 'text-rose-800 bg-rose-50 border-rose-200 font-bold' },
    { label: 'Order Placed', count: orderPlaced, color: 'text-emerald-800 bg-emerald-50 border-emerald-200 font-bold' },
    { label: 'Money Problem', count: moneyProblem, color: 'text-amber-900 bg-amber-50 border-amber-200' },
    { label: 'No Answer', count: noAnswer, color: 'text-gray-700 bg-gray-50 border-gray-200' },
    { label: 'Not Interested', count: notInterested, color: 'text-red-700 bg-red-50 border-red-200' },
    { label: 'Conversion %', count: `${conversionRate}%`, color: 'text-emerald-900 bg-emerald-100 border-emerald-300 font-extrabold' },
  ];

  const handleExport = (format: 'xlsx' | 'csv') => {
    const exportData = reportItems.map(item => ({
      Metric: item.label,
      Count: item.count,
    }));

    const userName = user?.full_name ? user.full_name.replace(/\s+/g, '_') : 'Telecaller';
    db.exportData(exportData, `Telecaller_Performance_${userName}_${new Date().toISOString().slice(0, 10)}`, format);
  };

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Performance Report</h1>
          <p className="text-xs text-slate-500">
            Personal lead conversion breakdown, dispositions, and productivity metrics.
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Past 7 Days</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {dateRange === 'custom' && (
            <div className="flex items-center space-x-1.5 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-2 py-1.5 border border-slate-300 rounded bg-white"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-2 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
          )}

          {/* Export disabled for telecallers */}
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

      {/* Grid of 13 Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {reportItems.map(item => (
          <div
            key={item.label}
            className={`p-4 rounded-xl border ${item.color} shadow-2xs flex flex-col justify-between`}
          >
            <span className="text-xs font-bold uppercase tracking-wider block opacity-80">{item.label}</span>
            <span className="text-2xl font-black mt-2 block">{item.count}</span>
          </div>
        ))}
      </div>

      {/* Leads Table Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          <span>Detailed Record Breakdown in Period ({leads.length} Leads)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-2.5">Lead Code</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Product</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Deal Value</th>
                <th className="p-2.5">Follow-up</th>
                <th className="p-2.5">Last Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map(l => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-mono font-bold text-blue-600">{l.lead_code}</td>
                  <td className="p-2.5 font-bold text-slate-900">{l.customer_name}</td>
                  <td className="p-2.5 text-slate-700">{l.product}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {l.status}
                    </span>
                  </td>
                  <td className="p-2.5 font-mono text-emerald-700 font-semibold">
                    ${(l.amount || 0).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-slate-600">
                    {l.followup_date ? new Date(l.followup_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-2.5 text-slate-500 max-w-xs truncate">{l.remark || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
