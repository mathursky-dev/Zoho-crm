import React, { useState, useEffect } from 'react';
import { db } from '../../lib/database';
import {
  Users2,
  UserCheck,
  UserX,
  Flame,
  ShoppingBag,
  DollarSign,
  Calendar,
  Building2,
  ArrowUpRight,
  FileSpreadsheet,
  Plus,
  Sliders,
  TableProperties,
  Trash2,
} from 'lucide-react';
import { AdminView } from '../layout/Sidebar';

interface Props {
  onNavigate: (view: AdminView) => void;
  onSelectLead: (leadId: string) => void;
  onOpenWipeData?: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onNavigate, onSelectLead, onOpenWipeData }) => {
  const [, setVersion] = useState<number>(0);

  useEffect(() => {
    const unsub = db.subscribeToChanges(() => {
      setVersion((v: number) => v + 1);
    });
    return () => unsub();
  }, []);

  const metrics = db.getAdminDashboardMetrics();
  const unassignedLeads = db.getLeads({ onlyUnassigned: true }).slice(0, 5);
  const departments = db.getDepartments();
  const users = db.getUsers(false).filter(u => u.role === 'telecaller');

  // Department distribution
  const deptStats = departments.map(d => {
    const deptLeads = db.getLeads({ department_id: d.id });
    const assigned = deptLeads.filter(l => Boolean(l.assigned_to)).length;
    const orders = deptLeads.filter(l => l.status === 'Order Placed' || l.status === 'Converted').length;
    return {
      department: d,
      total: deptLeads.length,
      assigned,
      unassigned: deptLeads.length - assigned,
      orders,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-blue-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Admin Overview Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time lead assignment, department quotas, and telecaller pipeline performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('field-master')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-bold transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Field Master</span>
          </button>
          <button
            onClick={() => onNavigate('import-field-master')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-bold transition-colors"
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>Import Field Master</span>
          </button>
          <button
            onClick={() => onNavigate('import')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import Leads</span>
          </button>
          <button
            onClick={() => onNavigate('assign')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-bold transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Manual Assignment</span>
          </button>
          {onOpenWipeData && (
            <button
              onClick={onOpenWipeData}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500 rounded-lg text-xs font-bold transition-colors shadow-xs"
              title="Permanently remove all CRM data and leads"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove All Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div
          onClick={() => onNavigate('leads')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Total Leads</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{metrics.totalLeads}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>In CRM Database</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </div>

        {/* Unassigned Leads */}
        <div
          onClick={() => onNavigate('assign')}
          className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs hover:border-amber-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-800">Unassigned Leads</span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-700">{metrics.unassignedLeads}</div>
          <div className="text-[11px] text-amber-700/80 mt-1 flex items-center justify-between">
            <span>Awaiting allocation</span>
            <span className="font-bold underline text-amber-800">Assign Now</span>
          </div>
        </div>

        {/* Hot Leads */}
        <div
          onClick={() => onNavigate('leads')}
          className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs hover:border-rose-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-800">Hot Leads</span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-rose-700">{metrics.hotLeads}</div>
          <div className="text-[11px] text-rose-600 mt-1">High conversion priority</div>
        </div>

        {/* Orders Placed / Value */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs hover:border-emerald-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-800">Orders Converted</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-800">{metrics.ordersPlaced}</span>
            <span className="text-xs font-bold text-emerald-600">
              (${metrics.totalValue.toLocaleString()})
            </span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">Confirmed deal revenue</div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <span className="text-xs text-slate-500 block">Assigned Leads</span>
          <span className="text-lg font-black text-slate-800">{metrics.assignedLeads}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <span className="text-xs text-slate-500 block">Today's Follow-ups</span>
          <span className="text-lg font-black text-blue-700">{metrics.followupsToday}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <span className="text-xs text-slate-500 block">Active Telecallers</span>
          <span className="text-lg font-black text-slate-800">{metrics.activeTelecallers}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <span className="text-xs text-slate-500 block">Active Departments</span>
          <span className="text-lg font-black text-slate-800">{metrics.activeDepartments}</span>
        </div>
      </div>

      {/* Two Column Grid: Unassigned Leads Action Table + Department Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned Leads Awaiting Assignment */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Unassigned Leads Queue</h3>
              <p className="text-xs text-slate-500">Newly imported leads pending telecaller allocation</p>
            </div>
            <button
              onClick={() => onNavigate('assign')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Bulk Assign ({metrics.unassignedLeads}) →
            </button>
          </div>

          {unassignedLeads.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              All leads are currently assigned! Import new CSV/Excel files to add more.
            </div>
          ) : (
            <div className="space-y-2.5">
              {unassignedLeads.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead.id)}
                  className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50/70 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {lead.lead_code}
                      </span>
                      <span className="font-bold text-xs text-slate-800">{lead.customer_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                      <span>{lead.mobile}</span>
                      <span>·</span>
                      <span>{lead.product}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {lead.department_name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department-wise Lead Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Department Pipeline</h3>
              <p className="text-xs text-slate-500">Distribution across active business units</p>
            </div>
            <button
              onClick={() => onNavigate('departments')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Manage Depts →
            </button>
          </div>

          <div className="space-y-3">
            {deptStats.map(item => (
              <div key={item.department.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.department.name}</span>
                    <span className="text-[10px] font-mono bg-slate-200 px-1.5 rounded">{item.department.code}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.total} Leads</span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${item.total > 0 ? (item.assigned / item.total) * 100 : 0}%` }}
                    className="bg-blue-600 h-full"
                    title={`Assigned: ${item.assigned}`}
                  />
                  <div
                    style={{ width: `${item.total > 0 ? (item.unassigned / item.total) * 100 : 0}%` }}
                    className="bg-amber-400 h-full"
                    title={`Unassigned: ${item.unassigned}`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Assigned: <strong className="text-slate-700">{item.assigned}</strong></span>
                  <span>Unassigned: <strong className="text-amber-700">{item.unassigned}</strong></span>
                  <span>Orders: <strong className="text-emerald-700">{item.orders}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
