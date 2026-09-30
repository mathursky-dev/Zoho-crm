import React, { useState } from 'react';
import { db } from '../../lib/database';
import {
  BarChart3,
  Download,
  Users2,
  Building2,
  Calendar,
  DollarSign,
  PieChart,
  Clock,
  ShoppingBag,
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [reportType, setReportType] = useState<
    'overview' | 'user' | 'department' | 'status' | 'followup' | 'order'
  >('overview');

  const [dateRange, setDateRange] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Get filtered leads for this date range
  const filteredLeads = db.getLeads({
    dateRange,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const departments = db.getDepartments();
  const telecallers = db.getUsers(false).filter(u => u.role === 'telecaller');
  const statuses = db.getStatuses();

  // Export handlers
  const handleExport = (format: 'xlsx' | 'csv') => {
    let exportData: any[] = [];
    let fileName = `Report_${reportType}_${new Date().toISOString().slice(0, 10)}`;

    if (reportType === 'overview') {
      const total = filteredLeads.length;
      const assigned = filteredLeads.filter(l => Boolean(l.assigned_to)).length;
      const unassigned = total - assigned;
      exportData = [
        { Metric: 'Total Leads in Period', Value: total },
        { Metric: 'Assigned Leads', Value: assigned },
        { Metric: 'Unassigned Leads', Value: unassigned },
        { Metric: 'Orders Converted', Value: filteredLeads.filter(l => l.status === 'Order Placed' || l.status === 'Converted').length },
        { Metric: 'Total Deal Value', Value: `$${filteredLeads.reduce((s, l) => s + (l.order_amount || l.amount || 0), 0).toLocaleString()}` },
      ];
    } else if (reportType === 'user') {
      exportData = telecallers.map(u => {
        const userLeads = filteredLeads.filter(l => l.assigned_to === u.id);
        const worked = userLeads.filter(l => l.last_activity_at && l.status !== 'Untouched').length;
        const untouched = userLeads.length - worked;
        const converted = userLeads.filter(l => l.status === 'Order Placed' || l.status === 'Converted').length;
        const revenue = userLeads
          .filter(l => l.status === 'Order Placed' || l.status === 'Converted')
          .reduce((sum, l) => sum + (l.order_amount || l.amount || 0), 0);

        return {
          'Telecaller Name': u.full_name,
          'Role': 'Telecaller',
          'Assigned Leads': userLeads.length,
          'Worked Leads': worked,
          'Untouched Leads': untouched,
          'Orders Converted': converted,
          'Conversion %': userLeads.length > 0 ? `${((converted / userLeads.length) * 100).toFixed(1)}%` : '0.0%',
          'Total Revenue ($)': revenue,
        };
      });
    } else if (reportType === 'department') {
      exportData = departments.map(d => {
        const dLeads = filteredLeads.filter(l => l.department_id === d.id);
        const assigned = dLeads.filter(l => Boolean(l.assigned_to)).length;
        const orders = dLeads.filter(l => l.status === 'Order Placed' || l.status === 'Converted').length;
        const revenue = dLeads
          .filter(l => l.status === 'Order Placed' || l.status === 'Converted')
          .reduce((sum, l) => sum + (l.order_amount || l.amount || 0), 0);

        return {
          'Department': d.name,
          'Code': d.code,
          'Total Leads': dLeads.length,
          'Assigned': assigned,
          'Unassigned': dLeads.length - assigned,
          'Orders': orders,
          'Revenue ($)': revenue,
        };
      });
    } else if (reportType === 'status') {
      exportData = statuses.map(s => {
        const count = filteredLeads.filter(l => l.status.toLowerCase() === s.name.toLowerCase()).length;
        return {
          'Status Name': s.name,
          'Count': count,
          'Percentage of Total': filteredLeads.length > 0 ? `${((count / filteredLeads.length) * 100).toFixed(1)}%` : '0%',
        };
      });
    } else if (reportType === 'followup') {
      const followups = db.getFollowups();
      exportData = followups.map(f => ({
        'Lead Code': f.lead_code || '-',
        'Customer': f.customer_name || '-',
        'Contact': f.mobile || '-',
        'Type': f.followup_type,
        'Scheduled At': new Date(f.scheduled_at).toLocaleString(),
        'Status': f.status,
        'Remarks': f.remarks || '',
      }));
    } else if (reportType === 'order') {
      const orders = filteredLeads.filter(l => l.status === 'Order Placed' || l.status === 'Converted');
      exportData = orders.map(o => ({
        'Lead Code': o.lead_code,
        'Customer Name': o.customer_name,
        'Mobile': o.mobile,
        'Product': o.order_product || o.product,
        'Amount ($)': o.order_amount || o.amount,
        'Quantity': o.order_quantity || 1,
        'Payment Status': o.payment_status || 'Paid',
        'Telecaller': o.assigned_to_name || 'Direct',
        'Date': new Date(o.last_activity_at || o.created_at).toLocaleDateString(),
      }));
    }

    db.exportData(exportData, fileName, format);
  };

  return (
    <div className="space-y-6">
      {/* Title & Date Range Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Executive Management Reports</h1>
          <p className="text-xs text-slate-500">
            Performance analytics, team conversions, follow-up accountability, and financial summaries.
          </p>
        </div>

        {/* Date Filters & Export */}
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

          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white text-xs font-semibold">
            <button
              onClick={() => handleExport('xlsx')}
              className="px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center space-x-1 border-r border-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel (.xlsx)</span>
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

      {/* Report Type Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'overview', label: 'Total/Assigned/Unassigned', icon: BarChart3 },
          { id: 'user', label: 'User-wise Performance', icon: Users2 },
          { id: 'department', label: 'Department-wise Performance', icon: Building2 },
          { id: 'status', label: 'Status-wise Breakdown', icon: PieChart },
          { id: 'followup', label: 'Follow-up Report', icon: Clock },
          { id: 'order', label: 'Order & Revenue Report', icon: ShoppingBag },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT TABLES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* 1. Overview */}
        {reportType === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs text-slate-500 uppercase font-bold block">Total Leads in Period</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{filteredLeads.length}</span>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-xs text-blue-700 uppercase font-bold block">Assigned Leads</span>
                <span className="text-2xl font-black text-blue-900 mt-1 block">
                  {filteredLeads.filter(l => Boolean(l.assigned_to)).length}
                </span>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-xs text-amber-700 uppercase font-bold block">Unassigned Leads</span>
                <span className="text-2xl font-black text-amber-900 mt-1 block">
                  {filteredLeads.filter(l => !l.assigned_to).length}
                </span>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-xs text-emerald-700 uppercase font-bold block">Converted Revenue</span>
                <span className="text-2xl font-black text-emerald-900 mt-1 block">
                  ${filteredLeads
                    .filter(l => l.status === 'Order Placed' || l.status === 'Converted')
                    .reduce((sum, l) => sum + (l.order_amount || l.amount || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              * Showing data filtered by the selected date range. Click "Excel (.xlsx)" or "CSV" above to download the raw report.
            </p>
          </div>
        )}

        {/* 2. User-wise Performance */}
        {reportType === 'user' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3">Telecaller Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Assigned Leads</th>
                <th className="p-3">Worked</th>
                <th className="p-3">Untouched</th>
                <th className="p-3">Orders Converted</th>
                <th className="p-3">Conversion Rate</th>
                <th className="p-3 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {telecallers.map(u => {
                const uLeads = filteredLeads.filter(l => l.assigned_to === u.id);
                const worked = uLeads.filter(l => l.last_activity_at && l.status !== 'Untouched').length;
                const untouched = uLeads.length - worked;
                const converted = uLeads.filter(l => l.status === 'Order Placed' || l.status === 'Converted').length;
                const revenue = uLeads
                  .filter(l => l.status === 'Order Placed' || l.status === 'Converted')
                  .reduce((sum, l) => sum + (l.order_amount || l.amount || 0), 0);
                const convRate = uLeads.length > 0 ? ((converted / uLeads.length) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-900">{u.full_name}</td>
                    <td className="p-3 text-slate-600">Telecaller</td>
                    <td className="p-3 font-bold text-slate-800">{uLeads.length}</td>
                    <td className="p-3 text-blue-700 font-semibold">{worked}</td>
                    <td className="p-3 text-amber-700 font-semibold">{untouched}</td>
                    <td className="p-3 text-emerald-700 font-bold">{converted}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 font-semibold px-2 py-0.5 rounded text-[11px]">
                        {convRate}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      ${revenue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 3. Department-wise Performance */}
        {reportType === 'department' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3">Department</th>
                <th className="p-3">Code</th>
                <th className="p-3">Total Leads</th>
                <th className="p-3">Assigned</th>
                <th className="p-3">Unassigned</th>
                <th className="p-3">Converted Orders</th>
                <th className="p-3 text-right">Total Deal Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map(d => {
                const dLeads = filteredLeads.filter(l => l.department_id === d.id);
                const assigned = dLeads.filter(l => Boolean(l.assigned_to)).length;
                const orders = dLeads.filter(l => l.status === 'Order Placed' || l.status === 'Converted').length;
                const revenue = dLeads
                  .filter(l => l.status === 'Order Placed' || l.status === 'Converted')
                  .reduce((sum, l) => sum + (l.order_amount || l.amount || 0), 0);

                return (
                  <tr key={d.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-900">{d.name}</td>
                    <td className="p-3 font-mono font-bold text-blue-600">{d.code}</td>
                    <td className="p-3 font-bold text-slate-800">{dLeads.length}</td>
                    <td className="p-3 text-blue-700 font-semibold">{assigned}</td>
                    <td className="p-3 text-amber-700 font-semibold">{dLeads.length - assigned}</td>
                    <td className="p-3 text-emerald-700 font-bold">{orders}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      ${revenue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 4. Status-wise Report */}
        {reportType === 'status' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3">Status Name</th>
                <th className="p-3">Count</th>
                <th className="p-3">Share of Total Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {statuses.map(s => {
                const count = filteredLeads.filter(l => l.status.toLowerCase() === s.name.toLowerCase()).length;
                const pct = filteredLeads.length > 0 ? ((count / filteredLeads.length) * 100).toFixed(1) : '0';
                return (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span>{s.name}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-800">{count}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div style={{ width: `${pct}%`, backgroundColor: s.color }} className="h-full" />
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 5. Follow-up Report */}
        {reportType === 'followup' && (
          <div className="p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Follow-up & Callback Log</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="p-2.5">Lead Code</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Mobile</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Scheduled Time</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.getFollowups().map(f => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-600">{f.lead_code || '-'}</td>
                    <td className="p-2.5 font-bold text-slate-900">{f.customer_name || '-'}</td>
                    <td className="p-2.5 font-mono text-slate-700">{f.mobile || '-'}</td>
                    <td className="p-2.5 font-medium">{f.followup_type}</td>
                    <td className="p-2.5 text-slate-700 font-mono">
                      {new Date(f.scheduled_at).toLocaleString()}
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        f.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        f.status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-500 max-w-xs truncate">{f.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Order Report */}
        {reportType === 'order' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3">Lead Code</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Product Ordered</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Telecaller</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads
                .filter(l => l.status === 'Order Placed' || l.status === 'Converted')
                .map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-blue-600">{o.lead_code}</td>
                    <td className="p-3 font-bold text-slate-900">{o.customer_name}</td>
                    <td className="p-3 font-mono text-slate-700">{o.mobile}</td>
                    <td className="p-3 font-semibold text-slate-800">{o.order_product || o.product}</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">
                      ${(o.order_amount || o.amount).toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-600">{o.order_quantity || 1}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {o.payment_status || 'Paid'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{o.assigned_to_name || 'Direct'}</td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {new Date(o.last_activity_at || o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
