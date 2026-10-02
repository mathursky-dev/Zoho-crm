import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../../lib/database';
import { Lead } from '../../types/crm';
import { SUPABASE_FIX_RLS_SQL } from '../../lib/supabase';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Building2,
  Check,
  RefreshCw,
  HelpCircle,
  Sliders,
  TableProperties,
  Sparkles,
  Copy,
  Wrench,
} from 'lucide-react';
import { AdminView } from '../layout/Sidebar';

interface Props {
  onNavigate: (view: AdminView) => void;
}

export const LeadImport: React.FC<Props> = ({ onNavigate }) => {
  const departments = db.getDepartments();
  const activeFields = db.getFieldMaster(false);

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || '');

  React.useEffect(() => {
    if ((!selectedDeptId || selectedDeptId === 'dept-1' || selectedDeptId.startsWith('dept-')) && departments.length > 0) {
      setSelectedDeptId(departments[0].id);
    }
  }, [departments, selectedDeptId]);

  // Dynamic Column Mapping: field_key -> selected Excel column name
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const [duplicateMobiles, setDuplicateMobiles] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{
    totalRows: number;
    importedCount: number;
    duplicateMobiles: string[];
    skippedRows: number;
    createdLeads?: Lead[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Map & Preview, 3: Completed
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [copiedRls, setCopiedRls] = useState(false);

  const handleCopyRlsFix = () => {
    navigator.clipboard.writeText(SUPABASE_FIX_RLS_SQL);
    setCopiedRls(true);
    setTimeout(() => setCopiedRls(false), 2500);
  };

  // Handle file upload & parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorBanner(null);
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (data.length > 0) {
          const headerRow = data[0].map((h: any) => String(h || '').trim());
          const rows = data.slice(1).map(row => {
            const obj: any = {};
            headerRow.forEach((colName: string, idx: number) => {
              obj[colName] = row[idx] !== undefined ? row[idx] : '';
            });
            return obj;
          }).filter(r => Object.values(r).some(v => v !== ''));

          if (rows.length === 0) {
            setErrorBanner('Uploaded file contains headers but no data rows.');
            setLoading(false);
            return;
          }

          setColumns(headerRow);
          setParsedData(rows);

          // Smart auto-mapping using Import File Field Master rules!
          const initialMap: Record<string, string> = {};
          headerRow.forEach(col => {
            const matchedKey = db.autoMatchColumnHeader(col);
            if (matchedKey && !initialMap[matchedKey]) {
              initialMap[matchedKey] = col;
            }
          });

          setMapping(initialMap);

          // Pre-check duplicate mobiles if mobile column detected
          if (initialMap.mobile) {
            checkDuplicates(rows, initialMap.mobile);
          }

          setStep(2);
        } else {
          setErrorBanner('The uploaded spreadsheet is empty.');
        }
      } catch (err) {
        console.error('File parsing error', err);
        setErrorBanner('Could not parse file. Please upload a valid CSV or Excel file.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const checkDuplicates = (rows: any[], mobileCol: string) => {
    const existingLeads = db.getLeads();
    const existingMobiles = new Set(existingLeads.map(l => l.mobile.replace(/\D/g, '')));
    const foundDupes: string[] = [];

    rows.forEach(r => {
      const mob = String(r[mobileCol] || '').replace(/\D/g, '').trim();
      if (mob && existingMobiles.has(mob)) {
        foundDupes.push(mob);
      }
    });

    setDuplicateMobiles([...new Set(foundDupes)]);
  };

  const handleMobileColChange = (col: string) => {
    setMapping(prev => ({ ...prev, mobile: col }));
    if (col && parsedData.length > 0) {
      checkDuplicates(parsedData, col);
    }
  };

  const handleConfirmImport = async () => {
    setErrorBanner(null);
    if (!mapping.customer_name || !mapping.mobile) {
      setErrorBanner('Please map both Customer Name and Mobile columns before proceeding.');
      return;
    }

    if (!selectedDeptId) {
      setErrorBanner('Please select a target Department.');
      return;
    }

    setLoading(true);
    try {
      const result = await db.importLeads(parsedData, selectedDeptId, mapping);
      setImportResult(result);
      setStep(3);
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorBanner(err?.message || 'Failed to import leads. Please check your data format.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = () => {
    db.generateDynamicSampleTemplate('csv');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Import Leads from Excel / CSV</h1>
          <p className="text-xs text-slate-500">
            Upload file → Preview → Select Department → Map Columns → Detect Duplicates → Import as Unassigned Leads
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('field-master')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-300 shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Field Master</span>
          </button>
          <button
            onClick={() => onNavigate('import-field-master')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-300 shadow-2xs"
          >
            <TableProperties className="w-3.5 h-3.5 text-indigo-600" />
            <span>Import Field Master</span>
          </button>
          <button
            onClick={handleDownloadSample}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample CSV</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button onClick={() => setErrorBanner(null)} className="text-rose-500 hover:text-rose-800 px-1 py-0.5">
              <span className="sr-only">Dismiss</span>
              ✕
            </button>
          </div>

          {/* Special 1-Click Fix Box for Row-Level Security Policy Error */}
          {(errorBanner.toLowerCase().includes('row-level security') || errorBanner.toLowerCase().includes('rls')) && (
            <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-900 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold text-slate-900">How to Fix in 10 Seconds:</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRlsFix}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
                >
                  {copiedRls ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRls ? 'Copied RLS Fix SQL!' : 'Copy 1-Click RLS Fix SQL'}</span>
                </button>
              </div>

              <p className="text-amber-800">
                Your Supabase project's <code className="bg-amber-100 font-mono px-1 py-0.5 rounded font-bold">leads</code> table has Row-Level Security enabled without a public insert policy.
              </p>

              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[11px] overflow-x-auto max-h-36 border border-slate-800">
                {`-- Run this once in your Supabase Dashboard > SQL Editor:
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on leads" ON public.leads;
CREATE POLICY "Allow all on leads" ON public.leads FOR ALL TO public USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.leads TO anon, authenticated, service_role;`}
              </div>

              <div className="text-[11px] text-amber-900/90 flex flex-wrap items-center gap-1.5">
                <span>1. Click <strong>"Copy 1-Click RLS Fix SQL"</strong> above.</span>
                <span>→ 2. In Supabase Dashboard, go to <strong>SQL Editor</strong> &gt; <strong>New Query</strong>.</span>
                <span>→ 3. Paste and click <strong>Run</strong>.</span>
                <span>→ 4. Click <strong>"Import Leads Now"</strong> again.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-2xs text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Select XLSX or CSV File</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Upload your raw leads spreadsheet. Our engine will parse rows, check column headers, and screen for duplicate contacts.
            </p>
          </div>

          <label className="inline-flex items-center space-x-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors">
            <Upload className="w-4 h-4" />
            <span>Choose Spreadsheet File</span>
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <div className="pt-4 text-xs text-slate-400 flex items-center justify-center space-x-4">
            <span>Supports .csv, .xlsx, .xls</span>
            <span>•</span>
            <span>Imports as Unassigned Leads</span>
          </div>
        </div>
      )}

      {/* STEP 2: PREVIEW & MAP COLUMNS */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Step 2: Configuration</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Preview & Map Columns ({parsedData.length} rows loaded from {file?.name})
              </h2>
            </div>
            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setParsedData([]);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Choose different file
            </button>
          </div>

          {/* Department Selection */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Target Department for this Batch <span className="text-red-500">*</span></span>
            </label>
            <p className="text-xs text-slate-500 mb-2">
              All imported leads will be categorized under this department:
            </p>
            <select
              value={selectedDeptId}
              onChange={e => setSelectedDeptId(e.target.value)}
              className="w-full sm:w-80 text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Duplicate Mobile Detection Warning */}
          {duplicateMobiles.length > 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center space-x-2 text-amber-800 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Duplicate Mobile Numbers Detected ({duplicateMobiles.length})</span>
              </div>
              <p className="text-amber-700">
                The following numbers already exist in the CRM database and will be automatically skipped to prevent double entry:
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {duplicateMobiles.map(mob => (
                  <span key={mob} className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-900 text-[11px]">
                    {mob}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero duplicate mobile numbers found in this batch! Clean dataset.</span>
            </div>
          )}

          {/* Column Mapping Form */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Map Spreadsheet Columns ({activeFields.length} CRM Fields)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Headers have been auto-matched using rules from the Import File Field Master.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onNavigate('import-field-master')}
                  className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  <TableProperties className="w-3.5 h-3.5" />
                  <span>Configure Aliases</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => onNavigate('field-master')}
                  className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Field Master</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activeFields.map(field => {
                const isMapped = Boolean(mapping[field.field_key]);
                return (
                  <div
                    key={field.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isMapped
                        ? 'bg-blue-50/40 border-blue-200'
                        : field.is_required
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-slate-50/50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                        <span>{field.field_label}</span>
                        {field.is_required && <span className="text-red-500">*</span>}
                      </label>
                      {isMapped ? (
                        <span className="inline-flex items-center space-x-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                          <Check className="w-2.5 h-2.5" />
                          <span>Matched</span>
                        </span>
                      ) : field.is_required ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full">
                          Required
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Optional</span>
                      )}
                    </div>

                    <select
                      value={mapping[field.field_key] || ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (field.field_key === 'mobile') {
                          handleMobileColChange(val);
                        } else {
                          setMapping(prev => ({ ...prev, [field.field_key]: val }));
                        }
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                    >
                      <option value="">-- {field.is_required ? 'Select Required Column' : 'Not Mapped'} --</option>
                      {columns.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sample Preview Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
              File Data Preview (First 5 Rows)
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                    {columns.slice(0, 6).map(c => (
                      <th key={c} className="p-2.5">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {columns.slice(0, 6).map(c => (
                        <td key={c} className="p-2.5 text-slate-700 truncate max-w-xs">
                          {String(row[c] || '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmImport}
              disabled={loading || !mapping.customer_name || !mapping.mobile}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <span>Import as Unassigned Leads</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: COMPLETED REPORT */}
      {step === 3 && importResult && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">Import Completed Successfully!</h2>
            <p className="text-xs text-slate-500 mt-1">
              New leads have been added to the unassigned queue ready for telecaller distribution.
            </p>
          </div>

          {/* Result stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-left">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-xs text-slate-500 block">Total Rows</span>
              <span className="text-lg font-bold text-slate-800">{importResult.totalRows}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <span className="text-xs text-emerald-700 block">Imported</span>
              <span className="text-lg font-bold text-emerald-900">{importResult.importedCount}</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span className="text-xs text-amber-700 block">Duplicates Skipped</span>
              <span className="text-lg font-bold text-amber-900">{importResult.duplicateMobiles.length}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-xs text-slate-500 block">Blank/Skipped</span>
              <span className="text-lg font-bold text-slate-800">{importResult.skippedRows - importResult.duplicateMobiles.length}</span>
            </div>
          </div>

          {/* Newly Imported Leads Preview Table */}
          {importResult.createdLeads && importResult.createdLeads.length > 0 && (
            <div className="max-w-2xl mx-auto text-left space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Newly Created Leads ({importResult.createdLeads.length})
                </span>
                <span className="text-[11px] text-slate-400">All registered as Unassigned</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Lead Code</th>
                      <th className="p-2.5">Customer Name</th>
                      <th className="p-2.5">Mobile</th>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {importResult.createdLeads.slice(0, 5).map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-blue-600">{lead.lead_code}</td>
                        <td className="p-2.5 font-bold text-slate-800">{lead.customer_name}</td>
                        <td className="p-2.5 font-mono text-slate-700">{lead.mobile}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {lead.department_name || 'General'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium">
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importResult.createdLeads.length > 5 && (
                  <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 border-t border-slate-100">
                    + {importResult.createdLeads.length - 5} more lead(s) imported
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('assign')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              Proceed to Manual Assignment →
            </button>
            <button
              onClick={() => onNavigate('leads')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
            >
              View in All Leads
            </button>
            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setParsedData([]);
                setImportResult(null);
              }}
              className="px-4 py-2.5 text-xs text-slate-500 hover:text-slate-800"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
