import React, { useState } from 'react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  SUPABASE_SQL_SCHEMA,
  SUPABASE_FIX_RLS_SQL,
  getSupabase,
} from '../../lib/supabase';
import { X, Database, Check, Copy, AlertCircle, RefreshCw, Key, ShieldCheck, Wrench } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
  initialTab?: 'config' | 'sql' | 'fix-rls';
}

export const SupabaseModal: React.FC<Props> = ({ isOpen, onClose, onConfigChanged, initialTab = 'config' }) => {
  if (!isOpen) return null;

  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'fix-rls'>(initialTab);
  const [copied, setCopied] = useState(false);
  const [copiedRls, setCopiedRls] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const getDetectedProjectUrl = (targetKey: string): string | null => {
    if (!targetKey) return null;
    try {
      const parts = targetKey.trim().split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload?.ref) return `https://${payload.ref}.supabase.co`;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const detectedProjectUrl = getDetectedProjectUrl(key) || getDetectedProjectUrl(url);

  const handleSave = () => {
    // If user accidentally put publishable key in URL and we know the real project URL, use it
    let cleanUrl = url.trim();
    if ((cleanUrl.startsWith('sb_') || cleanUrl.startsWith('eyJ')) && detectedProjectUrl) {
      cleanUrl = detectedProjectUrl;
      setUrl(cleanUrl);
    }
    saveSupabaseConfig(cleanUrl, key);
    onConfigChanged();
    handleTestConnection();
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setKey('');
    setTestStatus('idle');
    setTestMessage('');
    onConfigChanged();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRlsSql = () => {
    navigator.clipboard.writeText(SUPABASE_FIX_RLS_SQL);
    setCopiedRls(true);
    setTimeout(() => setCopiedRls(false), 2000);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Verifying connection to Supabase...');

    try {
      const client = getSupabase();
      if (!client) {
        setTestStatus('error');
        setTestMessage('Invalid Supabase configuration. Please enter a valid URL and Anon Key.');
        return;
      }

      // Try selecting departments
      const { error } = await client.from('departments').select('count').limit(1);

      if (error) {
        if (error.code === '42P01') {
          setTestStatus('success');
          setTestMessage('Connected to Supabase! (Tables not found yet - please run the SQL Schema from the "Full SQL Schema" tab in Supabase SQL editor).');
        } else if (error.code === '42501' || String(error.message).toLowerCase().includes('permission denied')) {
          setTestStatus('error');
          setTestMessage('Supabase error: permission denied for table departments. Public "anon" role needs schema & table grants.');
        } else {
          setTestStatus('error');
          setTestMessage(`Supabase error: ${error.message}`);
        }
      } else {
        setTestStatus('success');
        setTestMessage('Connection successful! Supabase tables, permissions, and RLS are active and reachable.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err?.message || 'Failed to connect. Check your Supabase URL and network.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Supabase Integration & RLS</h2>
              <p className="text-xs text-slate-400">PostgreSQL Database, Auth, and Row-Level Security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Connection Settings
          </button>
          <button
            onClick={() => setActiveTab('fix-rls')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'fix-rls'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Fix Permissions & RLS ⚡</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'sql'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Full SQL Schema</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                <p className="font-semibold mb-1">Dual-Mode Architecture:</p>
                LeadFlow CRM runs seamlessly with high-fidelity local state and demo data out-of-the-box. When you enter your Supabase URL & Anon Key, it connects directly with your live PostgreSQL tables and Row-Level Security!
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-slate-700">
                <div className="font-bold flex items-center gap-1.5 text-slate-900">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Vercel Multi-Browser & Deployment Settings:</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  To ensure Supabase connects automatically on <strong>every browser, device, and Preview URL</strong> without entering keys again, configure in Vercel Dashboard:
                </p>
                <div className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[11px] space-y-1">
                  <div>VITE_SUPABASE_URL = https://&lt;project-ref&gt;.supabase.co</div>
                  <div>VITE_SUPABASE_ANON_KEY = &lt;your-anon-public-key&gt;</div>
                </div>
                <p className="text-[10px] text-slate-500">
                  * In Vercel Settings → Environment Variables, check all 3 scopes: <strong>Production</strong>, <strong>Preview</strong>, and <strong>Development</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Supabase Project URL
                </label>
                <div className="relative">
                  <Database className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* Warning if user pasted API key instead of Project URL */}
                {(url.startsWith('sb_') || url.startsWith('eyJ')) && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>API Key entered in URL box:</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      You entered an API Key (<code className="bg-amber-100 font-mono px-1 py-0.5 rounded">{url.slice(0, 24)}...</code>) instead of your Supabase Project URL. Project URLs always start with <code className="bg-amber-100 font-mono px-1 py-0.5 rounded font-bold">https://</code>.
                    </p>
                    {detectedProjectUrl && (
                      <button
                        type="button"
                        onClick={() => setUrl(detectedProjectUrl)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs transition-colors shadow-2xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Auto-Fix: Use {detectedProjectUrl}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Supabase Anon / Public Key
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  * Found in Supabase Dashboard → Settings → API → Project API keys (anon public). Never use service_role key here.
                </p>
              </div>

              {testMessage && (
                <div className="space-y-2">
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                      testStatus === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : testStatus === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {testStatus === 'success' && <Check className="w-4 h-4 shrink-0 text-emerald-600" />}
                    {testStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                    {testStatus === 'testing' && <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-blue-600" />}
                    <span>{testMessage}</span>
                  </div>

                  {/* 1-Click Fix Helper Box for Permission Denied or RLS Error */}
                  {testStatus === 'error' && (testMessage.toLowerCase().includes('permission denied') || testMessage.toLowerCase().includes('rls') || testMessage.toLowerCase().includes('departments')) && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 space-y-2 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2">
                        <span className="font-bold flex items-center gap-1.5 text-slate-900">
                          <Wrench className="w-3.5 h-3.5 text-amber-600" />
                          Fix PostgreSQL Permissions & RLS (10 Seconds)
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyRlsSql}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs transition-colors shadow-2xs self-start sm:self-auto"
                        >
                          {copiedRls ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedRls ? 'Copied SQL!' : 'Copy 1-Click Fix SQL'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Your Supabase project's <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">public.departments</code> table has not been granted permissions to the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">anon</code> role. Run the 1-Click SQL fix in your <strong>Supabase SQL Editor</strong> to grant full access immediately.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={handleClear}
                  type="button"
                  className="text-xs text-rose-600 hover:text-rose-700 hover:underline"
                >
                  Clear Saved Keys (Use Local Store)
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={!url || !key || testStatus === 'testing'}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>Test Connection</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!url || !key}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    Save & Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fix-rls' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Fixing "permission denied for table departments" & RLS Errors:</strong>
                    <span className="leading-relaxed block mt-0.5">
                      PostgreSQL role <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">anon</code> requires schema grants (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">GRANT ALL ON TABLE</code>) and permissive Row-Level Security policies on <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">departments</code>, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">leads</code>, and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">profiles</code>. Run the SQL script below in your Supabase SQL Editor to unblock all tables in 10 seconds.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-700">1-Click SQL Permissions & RLS Fix</h3>
                  <p className="text-xs text-slate-500">
                    Grants full read/write access to public.departments, leads, profiles, and activities.
                  </p>
                </div>
                <button
                  onClick={handleCopyRlsSql}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  {copiedRls ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRls ? 'Copied SQL!' : 'Copy 1-Click Fix SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto max-h-[300px] border border-slate-800">
                  {SUPABASE_FIX_RLS_SQL}
                </pre>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                <p><strong>Instructions:</strong></p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Click <strong>Copy RLS Fix SQL</strong> above.</li>
                  <li>In your Supabase Dashboard, open <strong>SQL Editor</strong> &gt; <strong>New Query</strong>.</li>
                  <li>Paste the SQL script and click <strong>Run</strong>.</li>
                  <li>Return here and re-import or add your leads!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-700">Ready-To-Run SQL Migration</h3>
                  <p className="text-xs text-slate-500">
                    Includes tables: profiles, departments, lead_statuses, leads, activities, assignments, followups, RLS, and 5 pre-configured accounts (superadmin, admin, manoj, suraj, jeetu).
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied SQL!' : 'Copy SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto max-h-[380px] border border-slate-800">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                <strong>How to run:</strong> In your Supabase Project dashboard, navigate to <strong>SQL Editor</strong>, click <strong>"New Query"</strong>, paste the copied SQL, and click <strong>"Run"</strong>.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
