import React, { useState, useEffect } from 'react';
import { db } from './lib/database';
import { getSupabase } from './lib/supabase';
import { Lead, Profile } from './types/crm';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AllLeads } from './components/admin/AllLeads';
import { LeadImport } from './components/admin/LeadImport';
import { ManualAssignment } from './components/admin/ManualAssignment';
import { DepartmentMaster } from './components/admin/DepartmentMaster';
import { UserMaster } from './components/admin/UserMaster';
import { StatusMaster } from './components/admin/StatusMaster';
import { FieldMaster } from './components/admin/FieldMaster';
import { ImportFieldMaster } from './components/admin/ImportFieldMaster';
import { AdminReports } from './components/admin/AdminReports';
import { TelecallerDashboard } from './components/telecaller/TelecallerDashboard';
import { MyLeads } from './components/telecaller/MyLeads';
import { MyFollowups } from './components/telecaller/MyFollowups';
import { TelecallerReports } from './components/telecaller/TelecallerReports';
import { CallingQueueModal } from './components/telecaller/CallingQueueModal';
import { LeadDetailModal } from './components/common/LeadDetailModal';
import { LeadUpdateModal } from './components/common/LeadUpdateModal';
import { SupabaseModal } from './components/common/SupabaseModal';
import { LoginModal } from './components/common/LoginModal';
import { WipeDataModal } from './components/common/WipeDataModal';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

const pathToView: Record<string, string> = {
  '/login': 'login',
  '/dashboard': 'dashboard',
  '/leads': 'leads',
  '/import-leads': 'import',
  '/import': 'import',
  '/assign-leads': 'assign',
  '/assign': 'assign',
  '/departments': 'departments',
  '/users': 'users',
  '/status-master': 'statuses',
  '/statuses': 'statuses',
  '/admin-reports': 'reports',
  '/reports': 'reports',
  '/my-leads': 'my-leads',
  '/my-followups': 'my-followups',
  '/followups': 'my-followups',
  '/field-master': 'field-master',
  '/import-field-master': 'import-field-master',
};

const viewToPath = (view: string, role?: string): string => {
  if (view === 'login') return '/login';
  if (view === 'dashboard') return '/dashboard';
  if (view === 'leads') return '/leads';
  if (view === 'import') return '/import-leads';
  if (view === 'assign') return '/assign-leads';
  if (view === 'departments') return '/departments';
  if (view === 'users') return '/users';
  if (view === 'statuses') return '/status-master';
  if (view === 'field-master') return '/field-master';
  if (view === 'import-field-master') return '/import-field-master';
  if (view === 'reports') return role === 'admin' ? '/admin-reports' : '/reports';
  if (view === 'my-leads') return '/my-leads';
  if (view === 'my-followups') return '/followups';
  return '/dashboard';
};

const ADMIN_VIEWS = ['leads', 'import', 'assign', 'departments', 'users', 'statuses', 'field-master', 'import-field-master'];

export default function App() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [accessDeniedNotice, setAccessDeniedNotice] = useState<string | null>(null);

  // Status filter passed from KPI card click
  const [leadsStatusFilter, setLeadsStatusFilter] = useState<string>('');

  // Modals state
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);
  const [selectedLeadForUpdate, setSelectedLeadForUpdate] = useState<Lead | null>(null);
  const [isCallingQueueOpen, setIsCallingQueueOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);

  // Force re-render key
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => {
    setRefreshKey(k => k + 1);
  };

  // 1. Initial Application Startup & Session Check
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const res = await db.checkSession();
        if (!isMounted) return;

        if (res.user) {
          setCurrentUser(res.user);
          const initialPath = window.location.pathname;
          const targetView = pathToView[initialPath] || 'dashboard';

          // Role-based protection: Telecaller must not access Admin routes
          if (res.user.role === 'telecaller' && ADMIN_VIEWS.includes(targetView)) {
            setAccessDeniedNotice('Access Denied: Administrator role required.');
            window.history.replaceState(null, '', '/dashboard');
            setCurrentView('dashboard');
          } else if (initialPath === '/login' || initialPath === '/') {
            window.history.replaceState(null, '', '/dashboard');
            setCurrentView('dashboard');
          } else {
            setCurrentView(targetView);
          }
        } else {
          // No valid session -> redirect immediately to /login
          setCurrentUser(null);
          setCurrentView('login');
          if (window.location.pathname !== '/login') {
            window.history.replaceState(null, '', '/login');
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          setCurrentUser(null);
          setCurrentView('login');
          window.history.replaceState(null, '', '/login');
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    initAuth();

    // 2. Synchronize Supabase onAuthStateChange
    const supabase = getSupabase();
    let authSubscription: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          setCurrentUser(null);
          setCurrentView('login');
          window.history.replaceState(null, '', '/login');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const fresh = await db.checkSession();
          if (fresh.user && isMounted) {
            setCurrentUser(fresh.user);
          }
        }
      });
      authSubscription = data?.subscription;
    }

    // 3. Browser Back / Forward (popstate) Route Synchronization
    const handlePopState = () => {
      const path = window.location.pathname;
      const user = db.getCurrentUser();

      if (!user) {
        window.history.replaceState(null, '', '/login');
        setCurrentView('login');
        return;
      }

      const view = pathToView[path] || 'dashboard';
      if (user.role === 'telecaller' && ADMIN_VIEWS.includes(view)) {
        setAccessDeniedNotice('Access Denied: Administrator role required.');
        window.history.replaceState(null, '', '/dashboard');
        setCurrentView('dashboard');
      } else {
        setAccessDeniedNotice(null);
        setCurrentView(view);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      isMounted = false;
      if (authSubscription) authSubscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Navigation Handler with Protected Route Checks
  const navigateTo = (view: string, updateHistory = true) => {
    if (!currentUser) {
      setCurrentView('login');
      window.history.replaceState(null, '', '/login');
      return;
    }

    // Role-based route guard
    if (currentUser.role === 'telecaller' && ADMIN_VIEWS.includes(view)) {
      setAccessDeniedNotice('Access Denied: Administrator role required.');
      setTimeout(() => setAccessDeniedNotice(null), 4000);
      return;
    }

    setAccessDeniedNotice(null);
    setCurrentView(view);
    setLeadsStatusFilter('');

    if (updateHistory) {
      const path = viewToPath(view, currentUser.role);
      window.history.pushState(null, '', path);
    }
  };

  const handleUserChanged = (newUser: Profile) => {
    setCurrentUser(newUser);
    window.history.replaceState(null, '', '/dashboard');
    setCurrentView('dashboard');
    setLeadsStatusFilter('');
    setIsLoginModalOpen(false);
    refreshData();
  };

  const handleLogout = async () => {
    await db.signOut();
    setCurrentUser(null);
    window.history.replaceState(null, '', '/login');
    setCurrentView('login');
    setIsLoginModalOpen(false);
  };

  const handleGlobalSearchSelect = (leadId: string) => {
    const lead = db.getLeadById(leadId);
    if (lead) {
      setSelectedLeadForDetail(lead);
    }
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLeadForDetail(lead);
  };

  const handleOpenUpdate = (lead: Lead) => {
    setSelectedLeadForUpdate(lead);
  };

  const handleLeadUpdateSuccess = (updatedLead: Lead) => {
    refreshData();
    if (selectedLeadForDetail?.id === updatedLead.id) {
      setSelectedLeadForDetail(updatedLead);
    }
  };

  const handleTelecallerNavigate = (view: string, statusFilter?: string) => {
    navigateTo(view);
    if (statusFilter !== undefined) {
      setLeadsStatusFilter(statusFilter);
    }
  };

  // 1. Startup Authentication Check Screen (Do NOT render dashboard before auth check completes)
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-lg font-bold tracking-wide">LeadFlow CRM</div>
        <div className="text-xs text-slate-400 mt-1">Verifying secure Supabase authentication & permissions...</div>
      </div>
    );
  }

  // 2. Protected Route: If no authenticated user, render Login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <LoginModal
          isOpen={true}
          onClose={() => {}}
          canClose={false}
          onLoginSuccess={handleUserChanged}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        />

        {/* Allow Supabase configuration and 1-click RLS fix from Login view */}
        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          onConfigChanged={refreshData}
        />
      </div>
    );
  }

  // Calling queue leads: leads assigned to telecaller that are not converted yet
  const queueLeads = db.getLeads().filter(l => l.status !== 'Converted' && l.status !== 'Not Interested');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onUserChanged={handleUserChanged}
        onOpenLogin={handleLogout}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
        onGlobalSearchSelect={handleGlobalSearchSelect}
        onToggleSidebar={() => setSidebarOpenMobile(!sidebarOpenMobile)}
        sidebarOpen={sidebarOpenMobile}
        onOpenWipeData={() => setIsWipeModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          role={currentUser.role}
          currentView={currentView}
          onSelectView={view => navigateTo(view)}
          onLogout={handleLogout}
          isOpenMobile={sidebarOpenMobile}
          onCloseMobile={() => setSidebarOpenMobile(false)}
        />

        {/* Workspace Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Access Denied Banner */}
            {accessDeniedNotice && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-800 text-xs font-semibold animate-in fade-in duration-150">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <span>{accessDeniedNotice}</span>
              </div>
            )}

            {currentUser.role === 'admin' ? (
              // ================= ADMIN VIEWS =================
              <>
                {currentView === 'dashboard' && (
                  <AdminDashboard
                    key={refreshKey}
                    onNavigate={view => navigateTo(view)}
                    onSelectLead={id => handleGlobalSearchSelect(id)}
                    onOpenWipeData={() => setIsWipeModalOpen(true)}
                  />
                )}
                {currentView === 'leads' && (
                  <AllLeads
                    key={refreshKey}
                    onViewLead={handleViewLead}
                    onUpdateLead={handleOpenUpdate}
                    onOpenWipeData={() => setIsWipeModalOpen(true)}
                  />
                )}
                {currentView === 'import' && (
                  <LeadImport
                    key={refreshKey}
                    onNavigate={view => {
                      refreshData();
                      navigateTo(view);
                    }}
                  />
                )}
                {currentView === 'assign' && (
                  <ManualAssignment
                    key={refreshKey}
                    onNavigate={view => {
                      refreshData();
                      navigateTo(view);
                    }}
                  />
                )}
                {currentView === 'departments' && (
                  <DepartmentMaster key={refreshKey} />
                )}
                {currentView === 'users' && (
                  <UserMaster key={refreshKey} />
                )}
                {currentView === 'statuses' && (
                  <StatusMaster key={refreshKey} />
                )}
                {currentView === 'field-master' && (
                  <FieldMaster
                    key={refreshKey}
                    onNavigate={view => navigateTo(view)}
                  />
                )}
                {currentView === 'import-field-master' && (
                  <ImportFieldMaster
                    key={refreshKey}
                    onNavigate={view => navigateTo(view)}
                  />
                )}
                {currentView === 'reports' && (
                  <AdminReports key={refreshKey} />
                )}
              </>
            ) : (
              // ================= TELECALLER VIEWS =================
              <>
                {currentView === 'dashboard' && (
                  <TelecallerDashboard
                    key={refreshKey}
                    onNavigate={handleTelecallerNavigate}
                    onStartCallingQueue={() => setIsCallingQueueOpen(true)}
                  />
                )}
                {currentView === 'my-leads' && (
                  <MyLeads
                    key={refreshKey}
                    initialStatusFilter={leadsStatusFilter}
                    onViewLead={handleViewLead}
                    onUpdateLead={handleOpenUpdate}
                    onStartQueue={() => setIsCallingQueueOpen(true)}
                  />
                )}
                {currentView === 'my-followups' && (
                  <MyFollowups
                    key={refreshKey}
                    onViewLead={handleViewLead}
                    onUpdateLead={handleOpenUpdate}
                  />
                )}
                {currentView === 'reports' && (
                  <TelecallerReports key={refreshKey} />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      {/* 1. Lead Details Modal */}
      {selectedLeadForDetail && (
        <LeadDetailModal
          lead={selectedLeadForDetail}
          onClose={() => setSelectedLeadForDetail(null)}
          onOpenUpdate={lead => {
            setSelectedLeadForDetail(null);
            setSelectedLeadForUpdate(lead);
          }}
        />
      )}

      {/* 2. Lead Update Modal */}
      {selectedLeadForUpdate && (
        <LeadUpdateModal
          lead={selectedLeadForUpdate}
          onClose={() => setSelectedLeadForUpdate(null)}
          onSuccess={handleLeadUpdateSuccess}
        />
      )}

      {/* 3. Calling Queue Focus Mode */}
      {isCallingQueueOpen && (
        <CallingQueueModal
          leads={queueLeads}
          isOpen={isCallingQueueOpen}
          onClose={() => setIsCallingQueueOpen(false)}
          onLeadUpdated={refreshData}
        />
      )}

      {/* 4. Supabase Setup & SQL Schema Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigChanged={refreshData}
      />

      {/* 5. User Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleUserChanged}
      />

      {/* 6. Wipe All CRM Data Modal */}
      <WipeDataModal
        isOpen={isWipeModalOpen}
        onClose={() => setIsWipeModalOpen(false)}
        onSuccess={refreshData}
      />
    </div>
  );
}
