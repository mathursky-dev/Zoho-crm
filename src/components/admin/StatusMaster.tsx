import React, { useState } from 'react';
import { LeadStatus } from '../../types/crm';
import { db } from '../../lib/database';
import {
  Tags,
  Plus,
  Edit2,
  Power,
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
  ListOrdered,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const StatusMaster: React.FC = () => {
  const [statuses, setStatuses] = useState<LeadStatus[]>(db.getStatuses(true));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<LeadStatus | null>(null);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderToast, setOrderToast] = useState<string | null>(null);
  const [syncingSupabase, setSyncingSupabase] = useState(false);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setOrderToast(msg);
    setTimeout(() => {
      setOrderToast(null);
    }, 2500);
  };

  const refresh = async () => {
    await db.syncFromSupabase();
    setStatuses(db.getStatuses(true));
  };

  React.useEffect(() => {
    refresh();
    const unsub = db.subscribeToChanges(() => {
      setStatuses(db.getStatuses(true));
    });
    return unsub;
  }, []);

  const handleSyncToSupabase = async () => {
    setSyncingSupabase(true);
    try {
      const res = await db.ensureStatusesInSupabase();
      showToast(res.message);
      await refresh();
    } catch (err: any) {
      showToast(err?.message || 'Failed to sync statuses to Supabase');
    } finally {
      setSyncingSupabase(false);
    }
  };

  const openAdd = () => {
    setEditingStatus(null);
    setName('');
    setColor('#2563eb');
    setDisplayOrder(statuses.length + 1);
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (s: LeadStatus) => {
    setEditingStatus(s);
    setName(s.name);
    setColor(s.color);
    setDisplayOrder(s.display_order);
    setIsActive(s.is_active);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Status Name is required.');
      return;
    }

    try {
      if (editingStatus) {
        const res = await db.updateStatus(editingStatus.id, {
          name: name.trim(),
          color,
          display_order: Number(displayOrder),
          is_active: isActive,
        });
        if (res.error) {
          setError(res.error);
          return;
        }
      } else {
        const res = await db.addStatus({
          name: name.trim(),
          color,
          display_order: Number(displayOrder),
          is_active: isActive,
        });
        if (res.error) {
          setError(res.error);
          return;
        }
      }

      setIsModalOpen(false);
      await refresh();
      showToast(editingStatus ? 'Status updated' : 'New status added');
    } catch (err: any) {
      setError(err?.message || 'Failed to save status.');
    }
  };

  // Toggle active/inactive in 1 single click
  const toggleStatus = async (s: LeadStatus) => {
    try {
      const newActiveState = !s.is_active;
      setStatuses(prev =>
        prev.map(item => (item.id === s.id ? { ...item, is_active: newActiveState } : item))
      );
      await db.updateStatus(s.id, { is_active: newActiveState });
    } catch (err) {
      console.warn('Error toggling status active state:', err);
    }
  };

  // Move status up or down
  const handleMove = async (statusId: string, direction: 'up' | 'down') => {
    const updated = await db.moveStatus(statusId, direction);
    setStatuses(updated);
    showToast(`Status moved ${direction}`);
  };

  // Clean re-sequence all statuses to 1..N
  const handleAutoSequence = async () => {
    const orderedIds = statuses.map(s => s.id);
    const updated = await db.reorderStatuses(orderedIds);
    setStatuses(updated);
    showToast('Statuses sequenced 1 to ' + updated.length);
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newStatuses = [...statuses];
    const [movedItem] = newStatuses.splice(draggedIndex, 1);
    newStatuses.splice(targetIndex, 0, movedItem);

    const updated = await db.reorderStatuses(newStatuses.map(s => s.id));
    setStatuses(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
    showToast(`Reordered "${movedItem.name}" to position #${targetIndex + 1}`);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Tags className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Status Master</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Arrange display order, manage call dispositions, and configure pipeline milestones.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSyncToSupabase}
            disabled={syncingSupabase}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            title="Push default statuses to Supabase database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingSupabase ? 'animate-spin' : ''}`} />
            <span>{syncingSupabase ? 'Syncing...' : 'Sync to Supabase'}</span>
          </button>

          <button
            type="button"
            onClick={handleAutoSequence}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
            title="Cleanly re-index display orders from 1 to N without gaps"
          >
            <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
            <span>Auto-Index 1..N</span>
          </button>

          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Status</span>
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {orderToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{orderToast}</span>
        </div>
      )}

      {/* Info card */}
      <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">Arrange Order:</span>
          <span>Use the <span className="font-bold">▲ Up</span> and <span className="font-bold">▼ Down</span> arrow buttons, or drag and drop any row using the handle to rearrange sequence.</span>
        </div>
        <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full shrink-0 ml-2">
          {statuses.length} Dispositions
        </span>
      </div>

      {/* Status Table with Order Controls & Drag and Drop */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3 w-28 text-center">Arrange Order</th>
              <th className="p-3">Status Name</th>
              <th className="p-3">Badge Preview</th>
              <th className="p-3 text-center">Active Leads</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {statuses.map((s, index) => {
              const count = db.getLeads({ status: s.name }).length;
              const isFirst = index === 0;
              const isLast = index === statuses.length - 1;
              const isBeingDragged = draggedIndex === index;
              const isOver = dragOverIndex === index;

              return (
                <tr
                  key={s.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDrop={e => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`transition-colors select-none ${
                    isBeingDragged
                      ? 'opacity-40 bg-blue-50'
                      : isOver
                      ? 'bg-blue-100/70 ring-2 ring-blue-400 ring-inset'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Arrange Order Column: Drag Handle + Order Badge + Up/Down Buttons */}
                  <td className="p-2.5">
                    <div className="flex items-center justify-center space-x-1.5">
                      {/* Drag Grip Handle */}
                      <span
                        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 p-0.5 transition-colors"
                        title="Click and drag to reorder"
                      >
                        <GripVertical className="w-4 h-4" />
                      </span>

                      {/* Display Order Number */}
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 min-w-8 text-center shadow-2xs">
                        #{s.display_order}
                      </span>

                      {/* Move Up / Down Buttons */}
                      <div className="flex flex-col space-y-0.5">
                        <button
                          type="button"
                          onClick={() => handleMove(s.id, 'up')}
                          disabled={isFirst}
                          className={`p-1 rounded transition-colors ${
                            isFirst
                              ? 'text-slate-200 cursor-not-allowed'
                              : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer active:scale-90'
                          }`}
                          title={isFirst ? 'Already at top' : `Move "${s.name}" Up`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(s.id, 'down')}
                          disabled={isLast}
                          className={`p-1 rounded transition-colors ${
                            isLast
                              ? 'text-slate-200 cursor-not-allowed'
                              : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer active:scale-90'
                          }`}
                          title={isLast ? 'Already at bottom' : `Move "${s.name}" Down`}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Status Name */}
                  <td className="p-3 font-bold text-slate-900">
                    <div>{s.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono font-normal">ID: {s.id}</div>
                  </td>

                  {/* Badge Preview */}
                  <td className="p-3">
                    <span
                      style={{
                        backgroundColor: `${s.color}20`,
                        color: s.color,
                        borderColor: `${s.color}50`,
                      }}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center space-x-1.5 shadow-2xs"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span>{s.name}</span>
                    </span>
                  </td>

                  {/* Active Leads Count */}
                  <td className="p-3 font-bold text-slate-700 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">
                      {count}
                    </span>
                  </td>

                  {/* Active / Inactive Status Toggle */}
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleStatus(s)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer active:scale-95 select-none ${
                        s.is_active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 shadow-2xs'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title={s.is_active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      <Power className="w-3 h-3" />
                      <span>{s.is_active ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>

                  {/* Edit Action */}
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="inline-flex items-center space-x-1 px-2 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                      title="Edit Status"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">Edit</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingStatus ? 'Edit Status' : 'Add New Status'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              {error && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Status Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Appointment Booked"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Color Code</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={e => setDisplayOrder(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="statusActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="statusActive" className="text-xs font-semibold text-slate-700">
                  Status Active (Available in Update dropdown)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
