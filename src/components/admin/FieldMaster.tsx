import React, { useState } from 'react';
import { db } from '../../lib/database';
import { FieldMasterItem, FieldDataType } from '../../types/crm';
import {
  Sliders,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  Eye,
  EyeOff,
  Hash,
  Type,
  Phone,
  Mail,
  ListFilter,
  Calendar,
  IndianRupee,
  AlignLeft,
  ToggleLeft,
  ToggleRight,
  Download,
  AlertCircle,
  HelpCircle,
  Check,
  Building2,
  Layers,
} from 'lucide-react';
import { AdminView } from '../layout/Sidebar';

interface Props {
  onNavigate?: (view: AdminView) => void;
}

const DATA_TYPE_CONFIG: Record<
  FieldDataType,
  { label: string; icon: React.FC<{ className?: string }>; color: string; bg: string }
> = {
  text: { label: 'Single-line Text', icon: Type, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  phone: { label: 'Phone / Mobile', icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  number: { label: 'Numeric Value', icon: Hash, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  email: { label: 'Email Address', icon: Mail, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
  currency: { label: 'Currency (₹)', icon: IndianRupee, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  select: { label: 'Dropdown / Select', icon: ListFilter, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  date: { label: 'Date Picker', icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
  textarea: { label: 'Multi-line Notes', icon: AlignLeft, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
  boolean: { label: 'Yes / No Toggle', icon: ToggleRight, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
};

export const FieldMaster: React.FC<Props> = ({ onNavigate }) => {
  const [fields, setFields] = useState<FieldMasterItem[]>(db.getFieldMaster(true));
  const departments = db.getDepartments();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'custom'>('all');
  const [dataTypeFilter, setDataTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldMasterItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    field_label: string;
    field_key: string;
    data_type: FieldDataType;
    is_required: boolean;
    is_active: boolean;
    department_id: string;
    placeholder: string;
    default_value: string;
    options: string;
    show_in_table: boolean;
    show_in_form: boolean;
    show_in_template: boolean;
  }>({
    field_label: '',
    field_key: '',
    data_type: 'text',
    is_required: false,
    is_active: true,
    department_id: '',
    placeholder: '',
    default_value: '',
    options: '',
    show_in_table: true,
    show_in_form: true,
    show_in_template: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  const refreshFields = () => {
    setFields(db.getFieldMaster(true));
  };

  const handleOpenAddModal = () => {
    setEditingField(null);
    setFormData({
      field_label: '',
      field_key: '',
      data_type: 'text',
      is_required: false,
      is_active: true,
      department_id: '',
      placeholder: '',
      default_value: '',
      options: '',
      show_in_table: true,
      show_in_form: true,
      show_in_template: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (field: FieldMasterItem) => {
    setEditingField(field);
    setFormData({
      field_label: field.field_label,
      field_key: field.field_key,
      data_type: field.data_type,
      is_required: field.is_required,
      is_active: field.is_active,
      department_id: field.department_id || '',
      placeholder: field.placeholder || '',
      default_value: field.default_value || '',
      options: (field.options || []).join(', '),
      show_in_table: field.show_in_table,
      show_in_form: field.show_in_form,
      show_in_template: field.show_in_template,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleLabelChange = (val: string) => {
    setFormData(prev => {
      // Auto-generate field key only when adding new field
      if (!editingField) {
        const slug = val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        return { ...prev, field_label: val, field_key: slug };
      }
      return { ...prev, field_label: val };
    });
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanLabel = formData.field_label.trim();
    const cleanKey = formData.field_key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (!cleanLabel) {
      setFormError('Field label is required.');
      return;
    }

    if (!cleanKey) {
      setFormError('Field key / code is required.');
      return;
    }

    // Check duplicate key
    const existing = fields.find(
      f => f.field_key.toLowerCase() === cleanKey && (!editingField || f.id !== editingField.id)
    );
    if (existing) {
      setFormError(`A field with key "${cleanKey}" already exists.`);
      return;
    }

    const parsedOptions =
      formData.data_type === 'select'
        ? formData.options
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : undefined;

    const deptObj = departments.find(d => d.id === formData.department_id);

    if (editingField) {
      // Update
      db.updateField(editingField.id, {
        field_label: cleanLabel,
        field_key: editingField.is_system ? editingField.field_key : cleanKey,
        data_type: formData.data_type,
        is_required: formData.is_required,
        is_active: formData.is_active,
        department_id: formData.department_id || undefined,
        department_name: deptObj ? deptObj.name : undefined,
        placeholder: formData.placeholder.trim() || undefined,
        default_value: formData.default_value.trim() || undefined,
        options: parsedOptions,
        show_in_table: formData.show_in_table,
        show_in_form: formData.show_in_form,
        show_in_template: formData.show_in_template,
      });
    } else {
      // Add new custom field
      db.addField({
        field_label: cleanLabel,
        field_key: cleanKey,
        data_type: formData.data_type,
        is_required: formData.is_required,
        is_system: false,
        is_active: formData.is_active,
        department_id: formData.department_id || undefined,
        department_name: deptObj ? deptObj.name : undefined,
        placeholder: formData.placeholder.trim() || undefined,
        default_value: formData.default_value.trim() || undefined,
        options: parsedOptions,
        show_in_table: formData.show_in_table,
        show_in_form: formData.show_in_form,
        show_in_template: formData.show_in_template,
        display_order: fields.length + 1,
      });
    }

    refreshFields();
    setIsModalOpen(false);
  };

  const handleToggleActive = (field: FieldMasterItem) => {
    db.updateField(field.id, { is_active: !field.is_active });
    refreshFields();
  };

  const handleToggleTable = (field: FieldMasterItem) => {
    db.updateField(field.id, { show_in_table: !field.show_in_table });
    refreshFields();
  };

  const handleToggleTemplate = (field: FieldMasterItem) => {
    db.updateField(field.id, { show_in_template: !field.show_in_template });
    refreshFields();
  };

  const handleDeleteField = (field: FieldMasterItem) => {
    if (field.is_system) {
      alert('Standard system fields cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete the custom field "${field.field_label}"?`)) {
      const res = db.deleteField(field.id);
      if (res.success) {
        refreshFields();
      } else {
        alert(res.message || 'Could not delete field.');
      }
    }
  };

  // Filtered fields
  const filteredFields = fields.filter(f => {
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchLabel = f.field_label.toLowerCase().includes(q);
      const matchKey = f.field_key.toLowerCase().includes(q);
      if (!matchLabel && !matchKey) return false;
    }
    // Type
    if (typeFilter === 'system' && !f.is_system) return false;
    if (typeFilter === 'custom' && f.is_system) return false;
    // Data type
    if (dataTypeFilter !== 'all' && f.data_type !== dataTypeFilter) return false;
    // Status
    if (statusFilter === 'active' && !f.is_active) return false;
    if (statusFilter === 'inactive' && f.is_active) return false;

    return true;
  });

  const totalFields = fields.length;
  const standardCount = fields.filter(f => f.is_system).length;
  const customCount = fields.filter(f => !f.is_system).length;
  const activeCount = fields.filter(f => f.is_active).length;
  const templateCount = fields.filter(f => f.show_in_template && f.is_active).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>CRM Schema & Field Architecture</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">Lead Field Master</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Define standard & custom fields for your leads. Control data types, required constraints, table columns,
            and export template inclusion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('import-field-master')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600/60 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors border border-indigo-400/40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Import File Field Master</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          )}
          <button
            onClick={() => db.generateDynamicSampleTemplate('csv')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors border border-white/20"
            title="Download verified CSV sample with all active template fields"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample Template</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Field</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Fields</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalFields}</div>
          <span className="text-[10px] text-slate-500">{activeCount} active in CRM</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Standard Fields</span>
          <div className="text-2xl font-black text-blue-700 mt-1">{standardCount}</div>
          <span className="text-[10px] text-slate-500">Core CRM columns</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">Custom Fields</span>
          <div className="text-2xl font-black text-purple-700 mt-1">{customCount}</div>
          <span className="text-[10px] text-slate-500">User-defined attributes</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">In Sample Template</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{templateCount}</div>
          <span className="text-[10px] text-slate-500">Exported in CSV headers</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Required Fields</span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {fields.filter(f => f.is_required && f.is_active).length}
          </div>
          <span className="text-[10px] text-slate-500">Mandatory validation</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by field label or system code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                  typeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('system')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                  typeFilter === 'system' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setTypeFilter('custom')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                  typeFilter === 'custom' ? 'bg-white text-purple-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom
              </button>
            </div>

            {/* Data Type selector */}
            <select
              value={dataTypeFilter}
              onChange={e => setDataTypeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
            >
              <option value="all">All Data Types</option>
              {Object.entries(DATA_TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>

            {/* Status selector */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fields Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Field Label & Key</th>
                <th className="py-3 px-4">Data Type</th>
                <th className="py-3 px-4 text-center">Required</th>
                <th className="py-3 px-4">Scope</th>
                <th className="py-3 px-4 text-center">Table View</th>
                <th className="py-3 px-4 text-center">Form View</th>
                <th className="py-3 px-4 text-center">Template</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFields.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    <Sliders className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No CRM fields match your filter.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try resetting search keywords or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredFields.map((field, idx) => {
                  const typeCfg = DATA_TYPE_CONFIG[field.data_type] || DATA_TYPE_CONFIG.text;
                  const TypeIcon = typeCfg.icon;

                  return (
                    <tr
                      key={field.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !field.is_active ? 'opacity-60 bg-slate-50/40' : ''
                      }`}
                    >
                      {/* # Order */}
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Label & Key */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800 text-xs">{field.field_label}</span>
                          {field.is_system ? (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              <span>Standard</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">
                              <span>Custom</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <code className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 rounded">
                            {field.field_key}
                          </code>
                          {field.placeholder && (
                            <span className="text-[10px] text-slate-400 truncate max-w-xs">
                              • &quot;{field.placeholder}&quot;
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Data Type */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${typeCfg.bg} ${typeCfg.color}`}
                        >
                          <TypeIcon className="w-3 h-3" />
                          <span>{typeCfg.label}</span>
                        </span>
                        {field.data_type === 'select' && field.options && field.options.length > 0 && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[160px]">
                            {field.options.join(', ')}
                          </div>
                        )}
                      </td>

                      {/* Required */}
                      <td className="py-3 px-4 text-center">
                        {field.is_required ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Required *
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                        )}
                      </td>

                      {/* Department Scope */}
                      <td className="py-3 px-4">
                        {field.department_id ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] text-slate-700 font-medium">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{field.department_name || 'Specific Dept'}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">All Departments</span>
                        )}
                      </td>

                      {/* Show in Lead Table */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleTable(field)}
                          className={`p-1 rounded-md transition-colors ${
                            field.show_in_table
                              ? 'text-blue-600 hover:bg-blue-50'
                              : 'text-slate-300 hover:bg-slate-100'
                          }`}
                          title="Toggle visibility in All Leads / Lead Pool table"
                        >
                          {field.show_in_table ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Show in Form */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            field.show_in_form ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={field.show_in_form ? 'Visible in calling form' : 'Hidden from form'}
                        />
                      </td>

                      {/* Show in Template */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleTemplate(field)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                            field.show_in_template
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                          title="Click to toggle inclusion in Download Sample Template"
                        >
                          {field.show_in_template ? 'Included' : 'Excluded'}
                        </button>
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(field)}
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                            field.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {field.is_active ? (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-2.5 h-2.5" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(field)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit field settings"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!field.is_system ? (
                            <button
                              onClick={() => handleDeleteField(field)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete custom field"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 text-slate-300 cursor-not-allowed"
                              title="Standard system fields cannot be deleted"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Field Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingField ? `Edit Field: ${editingField.field_label}` : 'Create New Custom Field'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {editingField
                      ? editingField.is_system
                        ? 'Standard system field properties can be customized'
                        : 'Configure custom field rules and visibility'
                      : 'Define label, data type, and CRM table behavior'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveField} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Field Label */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Field Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PAN Card Number, GSTIN, Pincode"
                  value={formData.field_label}
                  onChange={e => handleLabelChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Field Key (Code) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Field Code / Key <span className="text-red-500">*</span>
                  </label>
                  {editingField?.is_system && (
                    <span className="text-[10px] text-slate-400 font-mono">System Key (Locked)</span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingField?.is_system)}
                  placeholder="e.g. pan_card_number"
                  value={formData.field_key}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                    }))
                  }
                  className={`w-full px-3 py-2 text-xs font-mono border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                    editingField?.is_system ? 'bg-slate-100 text-slate-500 border-slate-200' : 'border-slate-300'
                  }`}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Unique internal column identifier (lowercase letters, numbers, and underscores).
                </p>
              </div>

              {/* Data Type & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.data_type}
                    onChange={e => setFormData(prev => ({ ...prev, data_type: e.target.value as FieldDataType }))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {Object.entries(DATA_TYPE_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department Scope</label>
                  <select
                    value={formData.department_id}
                    onChange={e => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Options for Select */}
              {formData.data_type === 'select' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dropdown Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Option 1, Option 2, Option 3"
                    value={formData.options}
                    onChange={e => setFormData(prev => ({ ...prev, options: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Separate dropdown choices using commas.</p>
                </div>
              )}

              {/* Placeholder & Default Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Placeholder Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Enter PAN or KYC number"
                    value={formData.placeholder}
                    onChange={e => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Default Fallback Value</label>
                  <input
                    type="text"
                    placeholder="e.g. N/A or 0"
                    value={formData.default_value}
                    onChange={e => setFormData(prev => ({ ...prev, default_value: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Checkboxes & Switches */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Constraints & Visibility Toggles
                </span>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_required}
                    onChange={e => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Mark as Required Field (Mandatory in CRM)</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_in_table}
                    onChange={e => setFormData(prev => ({ ...prev, show_in_table: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Show as Column in All Leads / Admin Lead Pool Table</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_in_form}
                    onChange={e => setFormData(prev => ({ ...prev, show_in_form: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Show in Calling Form & Lead Details Modal</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_in_template}
                    onChange={e => setFormData(prev => ({ ...prev, show_in_template: e.target.checked }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Include Column in Sample Excel / CSV Download Template</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Field is Active in CRM</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  {editingField ? 'Save Changes' : 'Create Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
