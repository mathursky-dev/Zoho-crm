import React, { useState, useEffect } from 'react';
import { Lead, StandardLeadStatus } from '../../types/crm';
import { db } from '../../lib/database';
import { X, Check, ArrowRight, Calendar, Clock, DollarSign, Package, CreditCard, AlertCircle } from 'lucide-react';

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onSuccess: (updatedLead: Lead, next?: boolean) => void;
  onNextLead?: () => void;
  hasNext?: boolean;
}

const ALL_STATUSES: StandardLeadStatus[] = [
  'Untouched',
  'Contacted',
  'Follow-up',
  'Call Back',
  'Interested',
  'Hot Lead',
  'Order Placed',
  'Payment Pending',
  'Money Problem',
  'No Answer',
  'Busy',
  'Not Interested',
  'Wrong Number',
  'Converted',
];

export const LeadUpdateModal: React.FC<Props> = ({
  lead,
  onClose,
  onSuccess,
  onNextLead,
  hasNext = false,
}) => {
  if (!lead) return null;

  const [status, setStatus] = useState<StandardLeadStatus | string>(lead.status);
  const [remark, setRemark] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [callbackDate, setCallbackDate] = useState('');

  // Order placed extra fields
  const [orderAmount, setOrderAmount] = useState<number | string>(lead.order_amount || lead.amount || '');
  const [orderProduct, setOrderProduct] = useState(lead.order_product || lead.product || '');
  const [orderQuantity, setOrderQuantity] = useState<number | string>(lead.order_quantity || 1);
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Paid' | 'Partial' | 'COD'>(lead.payment_status || 'Paid');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setStatus(lead.status);
    setRemark('');
    // Format existing dates to YYYY-MM-DDTHH:mm for datetime-local
    if (lead.followup_date) {
      try {
        const d = new Date(lead.followup_date);
        setFollowupDate(d.toISOString().slice(0, 16));
      } catch {
        setFollowupDate('');
      }
    } else {
      setFollowupDate('');
    }

    if (lead.callback_date) {
      try {
        const d = new Date(lead.callback_date);
        setCallbackDate(d.toISOString().slice(0, 16));
      } catch {
        setCallbackDate('');
      }
    } else {
      setCallbackDate('');
    }

    setOrderAmount(lead.order_amount || lead.amount || '');
    setOrderProduct(lead.order_product || lead.product || '');
    setOrderQuantity(lead.order_quantity || 1);
    setPaymentStatus(lead.payment_status || 'Paid');
    setError(null);
  }, [lead]);

  const handleSubmit = (triggerNext: boolean = false) => {
    if (!remark.trim()) {
      setError('Please add a remark describing the update or call interaction.');
      return;
    }

    if (status === 'Follow-up' && !followupDate) {
      setError('Please choose a Follow-up Date/Time.');
      return;
    }

    if (status === 'Call Back' && !callbackDate) {
      setError('Please choose a Call Back Date/Time.');
      return;
    }

    if (status === 'Order Placed') {
      if (!orderAmount || Number(orderAmount) <= 0) {
        setError('Please enter a valid order amount.');
        return;
      }
      if (!orderProduct.trim()) {
        setError('Please enter the order product name.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    const result = db.updateLead(lead.id, {
      status,
      remark: remark.trim(),
      followup_date: followupDate ? new Date(followupDate).toISOString() : null,
      callback_date: callbackDate ? new Date(callbackDate).toISOString() : null,
      order_amount: status === 'Order Placed' ? Number(orderAmount) : undefined,
      order_product: status === 'Order Placed' ? orderProduct.trim() : undefined,
      order_quantity: status === 'Order Placed' ? Number(orderQuantity) : undefined,
      payment_status: status === 'Order Placed' ? paymentStatus : undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.lead) {
      onSuccess(result.lead, triggerNext);
      if (triggerNext && onNextLead) {
        onNextLead();
      } else {
        onClose();
      }
    } else {
      setError(result.error || 'Failed to update lead.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Update Lead: {lead.customer_name}</h2>
            <p className="text-xs text-slate-400">
              Code: <span className="font-mono text-blue-400 font-bold">{lead.lead_code}</span> · {lead.mobile}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">
              Select New Status <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_STATUSES.map(st => {
                const isSelected = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatus(st);
                      // Auto-fill dates if needed
                      if (st === 'Follow-up' && !followupDate) {
                        const tomorrow = new Date(Date.now() + 86400000);
                        tomorrow.setHours(11, 0, 0, 0);
                        setFollowupDate(tomorrow.toISOString().slice(0, 16));
                      }
                      if (st === 'Call Back' && !callbackDate) {
                        const later = new Date(Date.now() + 4 * 3600000);
                        setCallbackDate(later.toISOString().slice(0, 16));
                      }
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{st}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Follow-up / Callback Date & Time Pickers */}
          {(status === 'Follow-up' || status === 'Call Back' || status === 'Interested') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50/70 border border-amber-200 rounded-lg">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Follow-up Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={followupDate}
                  onChange={e => setFollowupDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Call Back Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={callbackDate}
                  onChange={e => setCallbackDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Order Details (Required when Order Placed) */}
          {status === 'Order Placed' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center space-x-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Order Placement Details</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">
                    Order Amount ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-2.5" />
                    <input
                      type="number"
                      value={orderAmount}
                      onChange={e => setOrderAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-emerald-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">
                    Product / Plan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={orderProduct}
                    onChange={e => setOrderProduct(e.target.value)}
                    placeholder="Product name"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-emerald-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={orderQuantity}
                    onChange={e => setOrderQuantity(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-emerald-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1 flex items-center space-x-1">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Payment Status</span>
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-emerald-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Payment Pending</option>
                    <option value="Partial">Partial Payment</option>
                    <option value="COD">Cash On Delivery / Cheque</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Remark */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1">
              Remark / Call Note <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder="e.g. Spoke with customer. Discussed pricing options, will confirm tomorrow."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              * This update will be permanently recorded in the immutable activity audit log.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
            >
              Save Update
            </button>

            {hasNext && (
              <button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
              >
                <span>Save & Next Lead</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
