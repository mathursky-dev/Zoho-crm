import React from 'react';
import { Lead, LeadActivity } from '../../types/crm';
import { db } from '../../lib/database';
import { X, Phone, Calendar, Clock, User, Tag, MapPin, DollarSign, History, AlertCircle } from 'lucide-react';

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onOpenUpdate?: (lead: Lead) => void;
}

export const LeadDetailModal: React.FC<Props> = ({ lead, onClose, onOpenUpdate }) => {
  if (!lead) return null;

  const activities: LeadActivity[] = db.getLeadActivities(lead.id);
  const assignments = db.getLeadAssignments(lead.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Untouched': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Contacted': return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Follow-up': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Call Back': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Interested': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Hot Lead': return 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
      case 'Order Placed':
      case 'Converted': return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
      case 'Money Problem': return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'No Answer':
      case 'Busy': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Not Interested':
      case 'Wrong Number': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="bg-blue-600 text-white font-mono text-xs px-2.5 py-1 rounded font-bold tracking-wide">
              {lead.lead_code}
            </span>
            <div>
              <h2 className="text-xl font-bold">{lead.customer_name}</h2>
              <p className="text-xs text-slate-400">Created: {new Date(lead.created_at).toLocaleDateString()} · Source: {lead.source}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status & Key Stats Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-3">
              <span className="text-xs uppercase font-bold text-slate-500">Current Status:</span>
              <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getStatusBadge(lead.status)}`}>
                {lead.status}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-1.5">
                <User className="w-4 h-4 text-slate-400" />
                <span>Assigned: <strong className="text-slate-800">{lead.assigned_to_name || 'Unassigned'}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Tag className="w-4 h-4 text-slate-400" />
                <span>Dept: <strong className="text-slate-800">{lead.department_name || 'General'}</strong></span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Info */}
            <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Contact Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Primary Mobile:</span>
                  </span>
                  <a href={`tel:${lead.mobile}`} className="font-semibold text-blue-600 hover:underline">
                    {lead.mobile}
                  </a>
                </div>
                {lead.alt_mobile && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Alternate Mobile:</span>
                    <a href={`tel:${lead.alt_mobile}`} className="font-medium text-slate-700 hover:underline">
                      {lead.alt_mobile}
                    </a>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Location:</span>
                  </span>
                  <span className="font-medium text-slate-800">
                    {[lead.city, lead.state].filter(Boolean).join(', ') || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Product & Deal Info */}
            <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Product & Deal</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Product / Service:</span>
                  <span className="font-semibold text-slate-800">{lead.product}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Deal Amount:</span>
                  </span>
                  <span className="font-bold text-emerald-700">
                    ${(lead.amount || 0).toLocaleString()}
                  </span>
                </div>
                {lead.followup_date && (
                  <div className="flex items-center justify-between text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    <span className="flex items-center space-x-1 text-xs font-medium">
                      <Calendar className="w-3 h-3" />
                      <span>Next Follow-up:</span>
                    </span>
                    <span className="text-xs font-bold">
                      {new Date(lead.followup_date).toLocaleString()}
                    </span>
                  </div>
                )}
                {lead.callback_date && (
                  <div className="flex items-center justify-between text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                    <span className="flex items-center space-x-1 text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      <span>Call Back:</span>
                    </span>
                    <span className="text-xs font-bold">
                      {new Date(lead.callback_date).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Details (if Order Placed) */}
          {(lead.status === 'Order Placed' || lead.order_amount) && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <h3 className="text-xs font-bold uppercase text-emerald-900 tracking-wider mb-2">Order Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-xs text-emerald-700 block">Order Amount</span>
                  <span className="font-bold text-emerald-900">${(lead.order_amount || lead.amount || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs text-emerald-700 block">Product</span>
                  <span className="font-semibold text-emerald-900">{lead.order_product || lead.product}</span>
                </div>
                <div>
                  <span className="text-xs text-emerald-700 block">Quantity</span>
                  <span className="font-semibold text-emerald-900">{lead.order_quantity || 1}</span>
                </div>
                <div>
                  <span className="text-xs text-emerald-700 block">Payment Status</span>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-200 text-emerald-900">
                    {lead.payment_status || 'Paid'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Custom Fields (from Field Master) */}
          {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 && (
            <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-200">
              <h3 className="text-xs font-bold uppercase text-purple-900 tracking-wider mb-2">
                Custom Lead Attributes (Field Master)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {Object.entries(lead.custom_fields).map(([key, val]) => {
                  const fld = db.getFieldByKey(key);
                  const label = fld ? fld.field_label : key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  return (
                    <div key={key} className="bg-white p-2.5 rounded-lg border border-purple-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {label}
                      </span>
                      <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">
                        {String(val || '—')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Last Remark */}
          {lead.remark && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">Latest Remark</h3>
              <p className="text-sm text-slate-700 italic">&quot;{lead.remark}&quot;</p>
            </div>
          )}

          {/* ASSIGNMENT HISTORY (AUDIT TRAIL) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Assignment & Reassignment History</h3>
              </div>
              <span className="text-xs text-slate-500">{assignments.length} record(s)</span>
            </div>

            {assignments.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-400 text-center border border-dashed">
                No assignment changes recorded.
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map(asgn => (
                  <div key={asgn.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 font-medium">Transferred from:</span>
                        <span className="font-semibold text-slate-700 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          {asgn.previous_user_name || 'Unassigned'}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {asgn.assigned_to_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Assigned by: <strong>{asgn.assigned_by_name}</strong>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 text-right">
                      {new Date(asgn.assigned_at || asgn.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIVITY HISTORY TIMELINE */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Activity History (Audit Trail)</h3>
              </div>
              <span className="text-xs text-slate-500">{activities.length} record(s)</span>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg text-slate-400 text-xs">
                No activity history logged yet. Updates will appear here.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {activities.map(act => (
                  <div key={act.id} className="relative group">
                    {/* Dot */}
                    <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{act.user_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadge(act.status)}`}>
                            {act.status}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(act.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700 mt-1 whitespace-pre-wrap">{act.remark}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <a
            href={`tel:${lead.mobile}`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Customer</span>
          </a>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
            {onOpenUpdate && (
              <button
                onClick={() => {
                  onClose();
                  onOpenUpdate(lead);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
              >
                Update Status
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
