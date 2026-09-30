import React, { useState } from 'react';
import { db } from '../../lib/database';
import { AlertTriangle, Trash2, CheckCircle2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WipeDataModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [resetMasters, setResetMasters] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const handleConfirmWipe = () => {
    setIsDeleting(true);
    setTimeout(() => {
      db.clearAllData({ resetMasters });
      setIsDeleting(false);
      setIsCompleted(true);
      setTimeout(() => {
        setIsCompleted(false);
        onSuccess();
        onClose();
      }, 1000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Remove All CRM Data</h3>
              <p className="text-xs text-rose-700">Permanent data wipe & reset</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isCompleted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">All CRM Data Removed!</h4>
              <p className="text-xs text-slate-500">
                The database has been cleaned. All leads and records have been cleared.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Warning:</span> This will permanently remove all leads from the Admin Lead Pool, telecaller queues, call activity logs, follow-ups, and assignment history.
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="font-semibold text-slate-800 mb-1">What will be removed:</div>
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>All leads in the Admin Pool and Telecaller queues</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>All call history, timeline updates & remarks</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>All lead assignment logs & audit trails</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>All follow-up & callback schedules</span>
                </div>
              </div>

              <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={resetMasters}
                  onChange={e => setResetMasters(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span>Also reset custom departments and field mappings to default</span>
              </label>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWipe}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Removing All Data...' : 'Yes, Remove All Data'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
