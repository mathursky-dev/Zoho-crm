import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../../lib/database';
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
} from 'lucide-react';
import { AdminView } from '../layout/Sidebar';

interface Props {
  onNavigate: (view: AdminView) => void;
}

export const LeadImport: React.FC<Props> = ({ onNavigate }) => {
  const departments = db.getDepartments();

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || '');

  // Column Mapping
  const [mapping, setMapping] = useState({
    customer_name: '',
    mobile: '',
    alt_mobile: '',
    city: '',
    state: '',
    product: '',
    amount: '',
    source: '',
    remark: '',
  });

  const [duplicateMobiles, setDuplicateMobiles] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{
    totalRows: number;
    importedCount: number;
    duplicateMobiles: string[];
    skippedRows: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Map & Preview, 3: Completed

  // Handle file upload & parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

          setColumns(headerRow);
          setParsedData(rows);

          // Auto-mapping heuristics
          const initialMap: any = {
            customer_name: '',
            mobile: '',
            alt_mobile: '',
            city: '',
            state: '',
            product: '',
            amount: '',
            source: '',
            remark: '',
          };

          headerRow.forEach(col => {
            const lower = col.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (lower.includes('name') || lower.includes('customer') || lower.includes('client')) {
              if (!initialMap.customer_name) initialMap.customer_name = col;
            } else if (lower.includes('altphone') || lower.includes('altmobile') || lower.includes('secondary')) {
              if (!initialMap.alt_mobile) initialMap.alt_mobile = col;
            } else if (lower.includes('mobile') || lower.includes('phone') || lower.includes('contact') || lower.includes('cell')) {
              if (!initialMap.mobile) initialMap.mobile = col;
            } else if (lower.includes('city') || lower.includes('location')) {
              if (!initialMap.city) initialMap.city = col;
            } else if (lower.includes('state') || lower.includes('province')) {
              if (!initialMap.state) initialMap.state = col;
            } else if (lower.includes('product') || lower.includes('plan') || lower.includes('service') || lower.includes('loan')) {
              if (!initialMap.product) initialMap.product = col;
            } else if (lower.includes('amount') || lower.includes('value') || lower.includes('price')) {
              if (!initialMap.amount) initialMap.amount = col;
            } else if (lower.includes('source') || lower.includes('campaign') || lower.includes('channel')) {
              if (!initialMap.source) initialMap.source = col;
            } else if (lower.includes('remark') || lower.includes('note') || lower.includes('comment')) {
              if (!initialMap.remark) initialMap.remark = col;
            }
          });

          setMapping(initialMap);

          // Pre-check duplicate mobiles if mobile column detected
          if (initialMap.mobile) {
            checkDuplicates(rows, initialMap.mobile);
          }

          setStep(2);
        }
      } catch (err) {
        console.error('File parsing error', err);
        alert('Could not parse file. Please upload a valid CSV or Excel file.');
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

  const handleConfirmImport = () => {
    if (!mapping.customer_name || !mapping.mobile) {
      alert('Please map both Customer Name and Mobile columns.');
      return;
    }

    if (!selectedDeptId) {
      alert('Please select a target Department.');
      return;
    }

    setLoading(true);
    const result = db.importLeads(parsedData, selectedDeptId, mapping);
    setImportResult(result);
    setLoading(false);
    setStep(3);
  };

  const handleDownloadSample = () => {
    const sample = [
      {
        'Customer Name': 'Jonathan Doe',
        'Mobile Number': '9811223344',
        'Alternate Mobile': '9811223345',
        'City': 'Miami',
        'State': 'FL',
        'Product': 'Home Purchase Loan',
        'Deal Amount': 320000,
        'Source': 'Web Portal',
        'Remark': 'Interested in low down-payment options',
      },
      {
        'Customer Name': 'Maria Gonzalez',
        'Mobile Number': '9822334455',
        'Alternate Mobile': '',
        'City': 'Orlando',
        'State': 'FL',
        'Product': 'Health Shield Plan',
        'Deal Amount': 22000,
        'Source': 'Facebook Ad',
        'Remark': 'Requested brochure on family floater',
      },
      {
        'Customer Name': 'David Beckham',
        'Mobile Number': '9833445566',
        'Alternate Mobile': '',
        'City': 'Tampa',
        'State': 'FL',
        'Product': 'Platinum Cashback Card',
        'Deal Amount': 5000,
        'Source': 'Google Search',
        'Remark': 'Credit score verified 750+',
      },
    ];

    db.exportData(sample, 'Sample_Leads_Template', 'csv');
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
        <button
          onClick={handleDownloadSample}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-300"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Sample CSV</span>
        </button>
      </div>

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
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
              Map Spreadsheet Columns
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={mapping.customer_name}
                  onChange={e => setMapping({ ...mapping, customer_name: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Select Column --</option>
                  {columns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <select
                  value={mapping.mobile}
                  onChange={e => handleMobileColChange(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Select Column --</option>
                  {columns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Alt Mobile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alternate Mobile
                </label>
                <select
                  value={mapping.alt_mobile}
                  onChange={e => setMapping({ ...mapping, alt_mobile: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Optional --</option>
                  {columns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <select
                  value={mapping.city}
                  onChange={e => setMapping({ ...mapping, city: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Optional --</option>
                  {columns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <select
                  value={mapping.state}
                  onChange={e => setMapping({ ...mapping, state: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Optional --</option>
                  {columns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Product */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product</label>
                <select
                  value={mapping.product}
                  onChange={e => setMapping({ ...mapping, product: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Optional (Uses Dept Name) --</option>
                  {columns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Amount</label>
                <select
                  value={mapping.amount}
                  onChange={e => setMapping({ ...mapping, amount: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Optional --</option>
                  {columns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
                <select
                  value={mapping.source}
                  onChange={e => setMapping({ ...mapping, source: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Optional (Default: Excel Import) --</option>
                  {columns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Remark */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Remark</label>
                <select
                  value={mapping.remark}
                  onChange={e => setMapping({ ...mapping, remark: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">-- Optional --</option>
                  {columns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
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
