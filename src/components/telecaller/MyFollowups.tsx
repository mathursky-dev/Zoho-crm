import React, { useState, useEffect } from 'react';
import { db } from '../../lib/database';
import { Followup, Lead } from '../../types/crm';
import {
  CalendarClock,
  Phone,
  Eye,
  Edit,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface Props {
  onViewLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
}

export const MyFollowups: React.FC<Props> = ({ onViewLead, onUpdateLead }) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'callback'>('all');
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = db.subscribeToChanges(() => {
      setTick(t => t + 1);
    });
    return unsub;
  }, []);

  const followups = db.getFollowups(filter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Follow-ups & Call Backs</h1>
          <p className="text-xs text-slate-500">
            Manage your scheduled phone appointments, overdue follow-ups and requested callbacks.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Scheduled
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'today'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today's Schedule
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'overdue'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-rose-600 hover:text-rose-800'
            }`}
          >
            Overdue
          </button>
          <button
            onClick={() => setFilter('callback')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'callback'
                ? 'bg-orange-600 text-white font-semibold'
                : 'text-orange-600 hover:text-orange-800'
            }`}
          >
            Call Backs
          </button>
        </div>
      </div>

      {/* Follow-up Cards / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3">Type</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Mobile</th>
              <th className="p-3">Scheduled Date & Time</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last Remark / Notes</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {followups.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                  No scheduled follow-ups or callbacks found for the "{filter}" view.
                </td>
              </tr>
            ) : (
              followups.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        f.followup_type === 'Call Back'
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {f.followup_type === 'Call Back' ? (
                        <Clock className="w-3 h-3 text-orange-600" />
                      ) : (
                        <CalendarClock className="w-3 h-3 text-amber-600" />
                      )}
                      <span>{f.followup_type}</span>
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    <div>{f.customer_name || 'Customer'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{f.lead_code}</div>
                  </td>
                  <td className="p-3 font-mono font-medium text-slate-700">
                    <a href={`tel:${f.mobile}`} className="hover:text-blue-600">
                      {f.mobile}
                    </a>
                  </td>
                  <td className="p-3 text-slate-800 font-medium">
                    <div className="font-semibold">{new Date(f.scheduled_at).toLocaleDateString()}</div>
                    <div className="text-[11px] text-slate-500">{new Date(f.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        f.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : f.status === 'Overdue'
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 max-w-xs truncate" title={f.remarks}>
                    {f.remarks || '-'}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <a
                        href={`tel:${f.mobile}`}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      {f.lead && (
                        <>
                          <button
                            onClick={() => onViewLead(f.lead!)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Lead"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onUpdateLead(f.lead!)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Update Status"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
