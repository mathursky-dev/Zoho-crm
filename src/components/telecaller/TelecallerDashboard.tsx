import React from 'react';
import { db } from '../../lib/database';
import {
  PhoneCall,
  Flame,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Eye,
  CalendarClock,
  Sparkles,
} from 'lucide-react';
import { TelecallerView } from '../layout/Sidebar';

interface Props {
  onNavigate: (view: TelecallerView, statusFilter?: string) => void;
  onStartCallingQueue: () => void;
}

export const TelecallerDashboard: React.FC<Props> = ({
  onNavigate,
  onStartCallingQueue,
}) => {
  const user = db.getCurrentUser();
  const metrics = db.getTelecallerMetrics(user.id);
  const myLeads = db.getLeads(); // strictly filtered to current user

  // KPI card configs (12 clickable cards)
  const kpiCards = [
    { label: 'Total Assigned', count: metrics.totalAssigned, status: '', color: 'border-slate-300 text-slate-800 bg-slate-50' },
    { label: 'Untouched', count: metrics.untouched, status: 'Untouched', color: 'border-blue-300 text-blue-700 bg-blue-50/60' },
    { label: 'Contacted', count: metrics.contacted, status: 'Contacted', color: 'border-sky-300 text-sky-700 bg-sky-50/60' },
    { label: 'Follow-up', count: metrics.followup, status: 'Follow-up', color: 'border-amber-300 text-amber-700 bg-amber-50/60' },
    { label: 'Call Back', count: metrics.callback, status: 'Call Back', color: 'border-orange-300 text-orange-700 bg-orange-50/60' },
    { label: 'Interested', count: metrics.interested, status: 'Interested', color: 'border-purple-300 text-purple-700 bg-purple-50/60' },
    { label: 'Hot Lead', count: metrics.hotLead, status: 'Hot Lead', color: 'border-rose-400 text-rose-700 bg-rose-50/80 font-bold' },
    { label: 'Order Placed', count: metrics.orderPlaced, status: 'Order Placed', color: 'border-emerald-400 text-emerald-800 bg-emerald-50 font-bold' },
    { label: 'Payment Pending', count: metrics.paymentPending, status: 'Payment Pending', color: 'border-yellow-300 text-yellow-800 bg-yellow-50/60' },
    { label: 'Money Problem', count: metrics.moneyProblem, status: 'Money Problem', color: 'border-orange-200 text-orange-900 bg-orange-50/40' },
    { label: 'No Answer', count: metrics.noAnswer, status: 'No Answer', color: 'border-gray-300 text-gray-700 bg-gray-50' },
    { label: 'Not Interested', count: metrics.notInterested, status: 'Not Interested', color: 'border-red-200 text-red-700 bg-red-50/40' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with "Start Calling" CTA */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-semibold mb-2 border border-blue-400/30">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Telecaller Calling Station · {user.department_name || 'General'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Welcome back, {user.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            You have <strong className="text-white font-bold">{metrics.untouched} untouched leads</strong> and{' '}
            <strong className="text-amber-300 font-bold">{metrics.followupsToday + metrics.callbacksToday} schedules</strong> today.
          </p>
        </div>

        {/* Start Calling queue button */}
        <button
          onClick={onStartCallingQueue}
          disabled={myLeads.length === 0}
          className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all transform hover:scale-102 shadow-lg disabled:opacity-50"
        >
          <PhoneCall className="w-5 h-5 text-slate-950 animate-bounce" />
          <span>START CALLING QUEUE</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>

      {/* TODAY'S WORK SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Today's Work Agenda</span>
            </h2>
            <p className="text-xs text-slate-500">Priority action items and scheduled client engagements</p>
          </div>
          <button
            onClick={() => onNavigate('my-followups')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center space-x-1"
          >
            <span>View Full Schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* New / Untouched */}
          <div
            onClick={() => onNavigate('my-leads', 'Untouched')}
            className="p-3 rounded-lg border border-blue-200 bg-blue-50/40 hover:bg-blue-100/50 cursor-pointer transition-colors"
          >
            <span className="text-[11px] font-bold uppercase text-blue-800 block">New / Untouched</span>
            <span className="text-2xl font-black text-blue-900 mt-1 block">{metrics.untouched}</span>
            <span className="text-[10px] text-blue-700/80">Pending first call</span>
          </div>

          {/* Follow-ups Today */}
          <div
            onClick={() => onNavigate('my-followups')}
            className="p-3 rounded-lg border border-amber-200 bg-amber-50/40 hover:bg-amber-100/50 cursor-pointer transition-colors"
          >
            <span className="text-[11px] font-bold uppercase text-amber-800 block">Follow-ups Today</span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">{metrics.followupsToday}</span>
            <span className="text-[10px] text-amber-700/80">Scheduled follow-ups</span>
          </div>

          {/* Call Backs Today */}
          <div
            onClick={() => onNavigate('my-followups')}
            className="p-3 rounded-lg border border-orange-200 bg-orange-50/40 hover:bg-orange-100/50 cursor-pointer transition-colors"
          >
            <span className="text-[11px] font-bold uppercase text-orange-800 block">Call Backs Today</span>
            <span className="text-2xl font-black text-orange-900 mt-1 block">{metrics.callbacksToday}</span>
            <span className="text-[10px] text-orange-700/80">Requested callbacks</span>
          </div>

          {/* Overdue Follow-ups */}
          <div
            onClick={() => onNavigate('my-followups')}
            className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 cursor-pointer transition-colors"
          >
            <span className="text-[11px] font-bold uppercase text-rose-800 block">Overdue Follow-ups</span>
            <span className="text-2xl font-black text-rose-900 mt-1 block">{metrics.overdueFollowups}</span>
            <span className="text-[10px] text-rose-700 font-semibold">Immediate attention</span>
          </div>

          {/* Hot Leads */}
          <div
            onClick={() => onNavigate('my-leads', 'Hot Lead')}
            className="p-3 rounded-lg border border-rose-300 bg-rose-100/60 hover:bg-rose-200/60 cursor-pointer transition-colors"
          >
            <span className="text-[11px] font-bold uppercase text-rose-900 block flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>Hot Leads</span>
            </span>
            <span className="text-2xl font-black text-rose-900 mt-1 block">{metrics.hotLead}</span>
            <span className="text-[10px] text-rose-800 font-semibold">Ready to close</span>
          </div>

          {/* Orders Today */}
          <div
            onClick={() => onNavigate('my-leads', 'Order Placed')}
            className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 cursor-pointer transition-colors"
          >
            <span className="text-[11px] font-bold uppercase text-emerald-800 block flex items-center space-x-1">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Orders Today</span>
            </span>
            <span className="text-2xl font-black text-emerald-900 mt-1 block">{metrics.ordersToday}</span>
            <span className="text-[10px] text-emerald-700">Closed today</span>
          </div>
        </div>
      </div>

      {/* 12 CLICKABLE KPI CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Pipeline KPI Metrics (Click any card to filter My Leads)
          </h2>
          <span className="text-xs text-slate-400">Total Assigned: {metrics.totalAssigned}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {kpiCards.map(card => (
            <div
              key={card.label}
              onClick={() => onNavigate('my-leads', card.status)}
              className={`p-3.5 rounded-xl border ${card.color} shadow-2xs hover:shadow-xs hover:scale-102 cursor-pointer transition-all flex flex-col justify-between`}
            >
              <div className="text-[11px] uppercase tracking-wider font-bold truncate" title={card.label}>
                {card.label}
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight">{card.count}</div>
              <div className="mt-1 text-[10px] opacity-75 flex items-center justify-between">
                <span>Filter Table</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <span className="text-xs text-slate-500 block">Worked Leads</span>
          <span className="text-lg font-black text-slate-800">{metrics.worked}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <span className="text-xs text-slate-500 block">Untouched Leads</span>
          <span className="text-lg font-black text-blue-700">{metrics.untouched}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <span className="text-xs text-slate-500 block">Orders / Converted</span>
          <span className="text-lg font-black text-emerald-700">{metrics.orderPlaced + metrics.converted}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <span className="text-xs text-slate-500 block">Conversion Rate</span>
          <span className="text-lg font-black text-emerald-800">{metrics.conversionRate}%</span>
        </div>
      </div>
    </div>
  );
};
