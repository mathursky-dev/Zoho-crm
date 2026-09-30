import React, { useState } from 'react';
import { Profile } from '../../types/crm';
import { db } from '../../lib/database';
import { getSupabaseConfig } from '../../lib/supabase';
import {
  Search,
  Database,
  User,
  Shield,
  LogOut,
  LogIn,
  ChevronDown,
  Menu,
  X,
  Phone,
  Tag,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface Props {
  currentUser: Profile;
  onUserChanged: (user: Profile) => void;
  onOpenLogin: () => void;
  onOpenSupabase: () => void;
  onGlobalSearchSelect: (leadId: string) => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  onOpenWipeData?: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  onUserChanged,
  onOpenLogin,
  onOpenSupabase,
  onGlobalSearchSelect,
  onToggleSidebar,
  sidebarOpen,
  onOpenWipeData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const supabaseConfig = getSupabaseConfig();

  // Search results
  const searchResults = searchTerm.trim()
    ? db.getLeads({ search: searchTerm }).slice(0, 6)
    : [];

  const handleSelectSearchResult = (leadId: string) => {
    setSearchTerm('');
    setShowSearchResults(false);
    onGlobalSearchSelect(leadId);
  };

  const handleLogout = () => {
    db.signOut();
    setShowUserDropdown(false);
    onOpenLogin();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              LF
            </div>
            <div>
              <div className="font-extrabold text-slate-900 tracking-tight leading-none text-base">
                LeadFlow <span className="text-blue-600 font-semibold text-xs">CRM</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Fast Lead Assignment System</div>
            </div>
          </div>
        </div>

        {/* Middle: Global Search */}
        <div className="flex-1 max-w-md relative hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search by Customer Name, Mobile or Lead ID..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setShowSearchResults(false);
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchResults && searchTerm.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="p-2 border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                <span>Matching Leads ({searchResults.length})</span>
                <span className="text-slate-400 font-normal">ESC to close</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No matching leads found for "{searchTerm}".
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {searchResults.map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => handleSelectSearchResult(lead.id)}
                      className="w-full p-2.5 text-left hover:bg-blue-50/70 transition-colors flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {lead.lead_code}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{lead.customer_name}</span>
                          <span className="text-[11px] text-slate-500">· {lead.mobile}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                          <span>{lead.product}</span>
                          <span>•</span>
                          <span>Dept: {lead.department_name}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {lead.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Supabase status & User profile / switch */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSupabase}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              supabaseConfig.isConfigured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Configure Supabase Database & View SQL Schema"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline font-medium">
              {supabaseConfig.isConfigured ? 'Supabase Active' : 'Supabase SQL'}
            </span>
          </button>

          {/* User Account & Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white transition-colors"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  currentUser.role === 'admin' ? 'bg-blue-600' : 'bg-emerald-600'
                }`}
              >
                {currentUser.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.full_name}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {currentUser.role === 'admin' ? 'Administrator' : 'Telecaller / Staff'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="p-3 bg-slate-50 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{currentUser.full_name}</div>
                  <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                  <div className="mt-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        currentUser.role === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  {onOpenWipeData && currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenWipeData();
                      }}
                      className="w-full p-2 text-left text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center space-x-2 font-medium transition-colors"
                      title="Permanently remove all CRM data and leads"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove All CRM Data</span>
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full p-2 text-left text-xs text-slate-600 hover:bg-slate-50 rounded-lg flex items-center space-x-2 font-medium transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out / Switch Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
