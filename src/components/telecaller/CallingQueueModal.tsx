import React, { useState } from 'react';
import { Lead, StandardLeadStatus } from '../../types/crm';
import { db } from '../../lib/database';
import {
  X,
  Phone,
  PhoneCall,
  PhoneOff,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Calendar,
  Clock,
  DollarSign,
  Package,
  CreditCard,
  AlertCircle,
  Tag,
  MapPin,
  Unlock,
  Eye,
} from 'lucide-react';

interface Props {
  leads: Lead[];
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
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

export const CallingQueueModal: React.FC<Props> = ({
  leads,
  isOpen,
  onClose,
  onLeadUpdated,
}) => {
  if (!isOpen || leads.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentLead = leads[currentIndex] || leads[0];

  const [status, setStatus] = useState<StandardLeadStatus | string>(currentLead?.status || 'Contacted');
  const [remark, setRemark] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [callbackDate, setCallbackDate] = useState('');
  const [orderAmount, setOrderAmount] = useState<number | string>(currentLead?.amount || '');
  const [orderProduct, setOrderProduct] = useState(currentLead?.product || '');
  const [orderQuantity, setOrderQuantity] = useState<number | string>(1);
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Paid' | 'Partial' | 'COD'>('Paid');

  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when currentIndex changes
  const switchLead = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < leads.length) {
      setCurrentIndex(newIndex);
      const l = leads[newIndex];
      setStatus(l.status === 'Untouched' ? 'Contacted' : l.status);
      setRemark('');
      setFollowupDate('');
      setCallbackDate('');
      setOrderAmount(l.amount || '');
      setOrderProduct(l.product || '');
      setOrderQuantity(1);
      setPaymentStatus('Paid');
      setCallActive(false);
      setCallDuration(0);
      setError(null);
      setSuccessMsg(null);
    }
  };

  const handleCallToggle = () => {
    if (!callActive) {
      setCallActive(true);
      if (status === 'Untouched') {
        setStatus('Contacted');
      }
    } else {
      setCallActive(false);
    }
  };

  const handleSave = (goToNext: boolean = false) => {
    if (!remark.trim()) {
      setError('Please add a call note or remark before saving.');
      return;
    }

    if (status === 'Follow-up' && !followupDate) {
      setError('Please select a Follow-up Date/Time.');
      return;
    }
    if (status === 'Call Back' && !callbackDate) {
      setError('Please select a Call Back Date/Time.');
      return;
    }

    const res = db.updateLead(currentLead.id, {
      status,
      remark: remark.trim(),
      followup_date: followupDate ? new Date(followupDate).toISOString() : null,
      callback_date: callbackDate ? new Date(callbackDate).toISOString() : null,
      order_amount: status === 'Order Placed' ? Number(orderAmount) : undefined,
      order_product: status === 'Order Placed' ? orderProduct.trim() : undefined,
      order_quantity: status === 'Order Placed' ? Number(orderQuantity) : undefined,
      payment_status: status === 'Order Placed' ? paymentStatus : undefined,
    });

    if (res.success) {
      onLeadUpdated();
      setSuccessMsg('Updated successfully!');
      setTimeout(() => setSuccessMsg(null), 2000);

      if (goToNext) {
        if (currentIndex < leads.length - 1) {
          switchLead(currentIndex + 1);
        } else {
          setSuccessMsg('Reached the end of current calling queue!');
        }
      }
    } else {
      setError(res.error || 'Failed to update lead.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 my-4 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <PhoneCall className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold">Calling Queue Dialer</h2>
                <span className="bg-blue-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Lead {currentIndex + 1} of {leads.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">Streamlined telecaller workflow: call, log & next</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Prev/Next buttons */}
            <button
              onClick={() => switchLead(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
              title="Previous Lead"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => switchLead(currentIndex + 1)}
              disabled={currentIndex === leads.length - 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
              title="Next Lead"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 flex-1 overflow-y-auto">
          {/* Left Column: Customer Profile & Calling Station */}
          <div className="md:col-span-2 p-5 bg-slate-50 border-r border-slate-200 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {currentLead.lead_code}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {currentLead.department_name}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">{currentLead.customer_name}</h3>
                <div className="flex items-center text-xs text-slate-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>{[currentLead.city, currentLead.state].filter(Boolean).join(', ') || 'Location N/A'}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg space-y-1">
                <div className="text-xs text-slate-500">Product Inquired</div>
                <div className="text-sm font-bold text-slate-800">{currentLead.product}</div>
                <div className="text-xs font-semibold text-emerald-700">
                  Deal Value: ${(currentLead.amount || 0).toLocaleString()}
                </div>
              </div>

              {/* Call Control Card */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Primary Mobile</span>
                  {currentLead.mobile_unlock_count && currentLead.mobile_unlock_count > 0 ? (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center space-x-1">
                      <Eye className="w-2.5 h-2.5 text-amber-600" />
                      <span>Unlocked {currentLead.mobile_unlock_count}x</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">0 unlocks</span>
                  )}
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 flex items-center justify-between">
                  <span>{currentLead.mobile}</span>
                  <a
                    href={`tel:${currentLead.mobile}`}
                    onClick={() => {
                      db.unlockLeadMobile(currentLead.id);
                      if (!callActive) setCallActive(true);
                    }}
                    className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-full transition-colors"
                    title="Direct Dial"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>

                {currentLead.alt_mobile && (
                  <div className="text-xs text-slate-600 flex justify-between pt-1">
                    <span>Alt: {currentLead.alt_mobile}</span>
                    <a href={`tel:${currentLead.alt_mobile}`} className="text-blue-600 hover:underline">
                      Dial Alt
                    </a>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCallToggle}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs ${
                    callActive
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {callActive ? (
                    <>
                      <PhoneOff className="w-4 h-4" />
                      <span>End Simulated Call (Connected)</span>
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-4 h-4" />
                      <span>Start Call</span>
                    </>
                  )}
                </button>
              </div>

              {currentLead.remark && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-600 block mb-0.5">Previous Note:</span>
                  <p className="text-slate-600 italic">"{currentLead.remark}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Update Status & Log Note */}
          <div className="md:col-span-3 p-5 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Select Status */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                Disposition / Call Status <span className="text-red-500">*</span>
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
                        if (st === 'Follow-up' && !followupDate) {
                          const tom = new Date(Date.now() + 86400000);
                          tom.setHours(11, 0, 0, 0);
                          setFollowupDate(tom.toISOString().slice(0, 16));
                        }
                        if (st === 'Call Back' && !callbackDate) {
                          const later = new Date(Date.now() + 3 * 3600000);
                          setCallbackDate(later.toISOString().slice(0, 16));
                        }
                      }}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border text-left truncate transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Pickers */}
            {(status === 'Follow-up' || status === 'Call Back' || status === 'Interested') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Follow-up Date & Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={followupDate}
                    onChange={e => setFollowupDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Call Back Date & Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={callbackDate}
                    onChange={e => setCallbackDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Order Placed Details */}
            {status === 'Order Placed' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 uppercase">Order Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-emerald-700 block mb-0.5">Order Amount ($)</span>
                    <input
                      type="number"
                      value={orderAmount}
                      onChange={e => setOrderAmount(e.target.value)}
                      className="w-full px-2 py-1.5 border border-emerald-300 rounded bg-white"
                      placeholder="Amount"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-700 block mb-0.5">Product</span>
                    <input
                      type="text"
                      value={orderProduct}
                      onChange={e => setOrderProduct(e.target.value)}
                      className="w-full px-2 py-1.5 border border-emerald-300 rounded bg-white"
                      placeholder="Product name"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-700 block mb-0.5">Quantity</span>
                    <input
                      type="number"
                      value={orderQuantity}
                      onChange={e => setOrderQuantity(e.target.value)}
                      className="w-full px-2 py-1.5 border border-emerald-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-700 block mb-0.5">Payment</span>
                    <select
                      value={paymentStatus}
                      onChange={e => setPaymentStatus(e.target.value as any)}
                      className="w-full px-2 py-1.5 border border-emerald-300 rounded bg-white"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Partial">Partial</option>
                      <option value="COD">COD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Remark */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Call Interaction Note / Remark <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={remark}
                onChange={e => setRemark(e.target.value)}
                placeholder="Spoke with customer, verified interest, shared quote..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Exit Queue
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSave(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>

            <button
              onClick={() => handleSave(true)}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <span>Save & Next Lead</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
