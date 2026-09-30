import React, { useState } from 'react';
import { db } from '../../lib/database';
import { ImportFieldMappingItem, TransformRule } from '../../types/crm';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  RefreshCw,
  Download,
  ArrowRight,
  Sparkles,
  Sliders,
  Check,
  Tag,
  Wand2,
  HelpCircle,
  AlertCircle,
  FileCheck2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { AdminView } from '../layout/Sidebar';

interface Props {
  onNavigate?: (view: AdminView) => void;
}

const TRANSFORM_LABELS: Record<TransformRule, { label: string; desc: string; color: string }> = {
  none: { label: 'None', desc: 'As-is from file', color: 'text-slate-600 bg-slate-100' },
  trim: { label: 'Trim Whitespace', desc: 'Removes leading/trailing spaces', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  digits_only: { label: 'Digits Only (0-9)', desc: 'Strips +91, dashes, spaces for mobile', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  currency_to_number: { label: 'Currency to Number', desc: 'Strips ₹, $, commas and converts to float', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  titlecase: { label: 'Title Case (Capitalize)', desc: 'Capitalizes each word (e.g. John Doe)', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  uppercase: { label: 'UPPERCASE', desc: 'All capital letters (e.g. PAN, GSTIN)', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  lowercase: { label: 'lowercase', desc: 'All small letters (e.g. email addresses)', color: 'text-sky-700 bg-sky-50 border-sky-200' },
};

export const ImportFieldMaster: React.FC<Props> = ({ onNavigate }) => {
  const [mappings, setMappings] = useState<ImportFieldMappingItem[]>(db.getImportFieldMappings(true));
  const [searchTerm, setSearchTerm] = useState('');
  const [newAliasInputs, setNewAliasInputs] = useState<Record<string, string>>({});

  // Interactive Live Tester
  const [showTester, setShowTester] = useState(true);
  const [testHeadersInput, setTestHeadersInput] = useState(
    'Full Name, WhatsApp Number, Alternate Phone, District, State, Requirement, Budget, Ad Channel, Remarks, PIN Code'
  );

  // Sync Notification
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const refreshMappings = () => {
    setMappings(db.getImportFieldMappings(true));
  };

  const handleSyncWithFieldMaster = () => {
    const result = db.syncImportMappingsWithFieldMaster();
    refreshMappings();
    setSyncMessage(`Synced successfully! ${result.added} new mapping(s) added. Total: ${result.total}.`);
    setTimeout(() => setSyncMessage(null), 4000);
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset all import column aliases to standard defaults? Custom added aliases will be restored.')) {
      db.resetMappingsToDefault();
      refreshMappings();
      setSyncMessage('Import column aliases have been reset to verified standard defaults.');
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleAddAlias = (mappingId: string, currentAliases: string[]) => {
    const aliasText = (newAliasInputs[mappingId] || '').trim();
    if (!aliasText) return;

    if (currentAliases.map(a => a.toLowerCase()).includes(aliasText.toLowerCase())) {
      alert(`Alias "${aliasText}" is already registered for this field.`);
      return;
    }

    const updated = [...currentAliases, aliasText];
    db.updateImportFieldMapping(mappingId, { aliases: updated });
    setNewAliasInputs(prev => ({ ...prev, [mappingId]: '' }));
    refreshMappings();
  };

  const handleRemoveAlias = (mappingId: string, aliasToRemove: string, currentAliases: string[]) => {
    const updated = currentAliases.filter(a => a !== aliasToRemove);
    db.updateImportFieldMapping(mappingId, { aliases: updated });
    refreshMappings();
  };

  const handleTransformChange = (mappingId: string, rule: TransformRule) => {
    db.updateImportFieldMapping(mappingId, { transform_rule: rule });
    refreshMappings();
  };

  const handleDefaultValueChange = (mappingId: string, val: string) => {
    db.updateImportFieldMapping(mappingId, { default_value: val });
    refreshMappings();
  };

  const handleToggleActive = (mapping: ImportFieldMappingItem) => {
    const newActive = !mapping.is_active;
    db.updateImportFieldMapping(mapping.id, { is_active: newActive });
    setMappings(prev =>
      prev.map(item => (item.id === mapping.id ? { ...item, is_active: newActive } : item))
    );
  };

  // Test Matcher Evaluation
  const testHeaderList = testHeadersInput
    .split(',')
    .map(h => h.trim())
    .filter(Boolean);

  const testResults = testHeaderList.map(header => {
    const matchedKey = db.autoMatchColumnHeader(header);
    const target = matchedKey ? mappings.find(m => m.field_key === matchedKey) : null;
    return {
      header,
      matchedKey,
      targetLabel: target ? target.target_field_label : null,
      transformRule: target ? target.transform_rule : null,
    };
  });

  const matchedCount = testResults.filter(r => r.matchedKey).length;
  const unmatchedCount = testResults.length - matchedCount;

  // Filtered mappings
  const filteredMappings = mappings.filter(m => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const matchLabel = m.target_field_label.toLowerCase().includes(q);
    const matchKey = m.field_key.toLowerCase().includes(q);
    const matchAlias = m.aliases.some(a => a.toLowerCase().includes(q));
    return matchLabel || matchKey || matchAlias;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-blue-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Smart Excel / CSV Column Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">Import File Field Master</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Configure header aliases and transformation rules so leads exported from IndiaMART, Justdial, TradeIndia,
            Facebook Ads, or vendor sheets map seamlessly without manual re-typing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('field-master')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors border border-white/20"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Field Master</span>
            </button>
          )}
          <button
            onClick={() => db.generateDynamicSampleTemplate('csv')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors border border-white/20"
            title="Download verified CSV sample"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample Template</span>
          </button>
          <button
            onClick={handleSyncWithFieldMaster}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync with Field Master</span>
          </button>
        </div>
      </div>

      {/* Sync Message Alert */}
      {syncMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{syncMessage}</span>
          </div>
          <button onClick={() => setSyncMessage(null)} className="text-emerald-700 hover:text-emerald-900 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Live Interactive Column Header Matcher Tester */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-2xs">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">Live Header Matcher & Tester</h3>
              <p className="text-[11px] text-slate-500">
                Paste raw headers from your vendor spreadsheet to see how the system auto-detects them.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowTester(!showTester)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>{showTester ? 'Hide Tester' : 'Show Tester'}</span>
          </button>
        </div>

        {showTester && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sample Excel / CSV Header Row (comma-separated):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testHeadersInput}
                  onChange={e => setTestHeadersInput(e.target.value)}
                  placeholder="e.g. Name, Phone, District, Price, Ad Source..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono bg-slate-50"
                />
                <button
                  onClick={() =>
                    setTestHeadersInput(
                      'Customer Name, Mobile No, Alternate No, City, State, Product, Deal Amount, Campaign, Previous Status, Remarks'
                    )
                  }
                  className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 transition-colors shrink-0"
                >
                  Load Verified Sample
                </button>
              </div>
            </div>

            {/* Evaluation Results */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 uppercase tracking-wider text-[10px]">Auto-Detection Preview</span>
                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    ✓ {matchedCount} Matched
                  </span>
                  {unmatchedCount > 0 && (
                    <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                      ⚠ {unmatchedCount} Unmatched
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {testResults.map((r, i) => (
                  <div
                    key={i}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      r.matchedKey
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <span className="font-mono text-[11px] font-bold">&quot;{r.header}&quot;</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    {r.matchedKey ? (
                      <span className="font-bold text-emerald-700 flex items-center space-x-1">
                        <span>{r.targetLabel}</span>
                        <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1 rounded font-mono">
                          {r.transformRule}
                        </span>
                      </span>
                    ) : (
                      <span className="text-amber-700 italic text-[11px]">Unmapped</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Reset Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search mappings by target field, code, or alias..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetToDefaults}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Aliases</span>
          </button>
        </div>
      </div>

      {/* Mappings Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMappings.map(mapping => {
          const transCfg = TRANSFORM_LABELS[mapping.transform_rule] || TRANSFORM_LABELS.none;
          const currentInputVal = newAliasInputs[mapping.id] || '';

          return (
            <div
              key={mapping.id}
              className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
                mapping.is_active ? 'border-slate-200 hover:border-blue-400' : 'border-slate-200 opacity-60 bg-slate-50/50'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-slate-900">{mapping.target_field_label}</h4>
                      {mapping.is_required && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                          Required *
                        </span>
                      )}
                    </div>
                    <code className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                      Target Key: {mapping.field_key}
                    </code>
                  </div>

                  <button
                    onClick={() => handleToggleActive(mapping)}
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                      mapping.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {mapping.is_active ? (
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
                </div>

                {/* Configuration Bar: Transform Rule & Default Value */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Data Cleaning Rule
                    </label>
                    <select
                      value={mapping.transform_rule}
                      onChange={e => handleTransformChange(mapping.id, e.target.value as TransformRule)}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      {Object.entries(TRANSFORM_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Default Fallback
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0, N/A"
                      value={mapping.default_value || ''}
                      onChange={e => handleDefaultValueChange(mapping.id, e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Recognized Aliases */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>Recognized Column Headers ({mapping.aliases.length})</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {mapping.aliases.map((alias, aIdx) => (
                      <span
                        key={aIdx}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium group hover:bg-slate-200 transition-colors"
                      >
                        <span>{alias}</span>
                        {mapping.aliases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAlias(mapping.id, alias, mapping.aliases)}
                            className="text-slate-400 hover:text-red-600 transition-colors ml-0.5"
                            title={`Remove alias "${alias}"`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add New Alias Input */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex gap-1.5">
                <input
                  type="text"
                  placeholder="Type new header alias (e.g. WhatsApp, Client)..."
                  value={currentInputVal}
                  onChange={e =>
                    setNewAliasInputs(prev => ({
                      ...prev,
                      [mapping.id]: e.target.value,
                    }))
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAlias(mapping.id, mapping.aliases);
                    }
                  }}
                  className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddAlias(mapping.id, mapping.aliases)}
                  disabled={!currentInputVal.trim()}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-md text-xs font-bold transition-colors shrink-0"
                >
                  + Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
