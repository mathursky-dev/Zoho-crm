import React, { useState, useEffect } from 'react';
import { db } from './lib/database';
import { Lead, Profile } from './types/crm';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, AdminView, TelecallerView } from './components/layout/Sidebar';
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => db.getCurrentUser());
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

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

  const handleUserChanged = (newUser: Profile) => {
    setCurrentUser(newUser);
    setCurrentView('dashboard');
    setLeadsStatusFilter('');
    setIsLoginModalOpen(false);
    refreshData();
  };

  const handleLogout = () => {
    db.signOut();
    setCurrentUser(null);
    setIsLoginModalOpen(true);
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
    // if detail modal is open for this lead, update it
    if (selectedLeadForDetail?.id === updatedLead.id) {
      setSelectedLeadForDetail(updatedLead);
    }
  };

  const handleTelecallerNavigate = (view: TelecallerView, statusFilter?: string) => {
    setCurrentView(view);
    if (statusFilter !== undefined) {
      setLeadsStatusFilter(statusFilter);
    }
  };

  // If no user is logged in, show mandatory login screen (No login without password)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <LoginModal
          isOpen={true}
          onClose={() => {}}
          canClose={false}
          onLoginSuccess={handleUserChanged}
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
          onSelectView={view => {
            setCurrentView(view);
            setLeadsStatusFilter('');
          }}
          onLogout={handleLogout}
          isOpenMobile={sidebarOpenMobile}
          onCloseMobile={() => setSidebarOpenMobile(false)}
        />

        {/* Workspace Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentUser.role === 'admin' ? (
              // ================= ADMIN VIEWS =================
              <>
                {currentView === 'dashboard' && (
                  <AdminDashboard
                    key={refreshKey}
                    onNavigate={view => {
                      setCurrentView(view);
                      setLeadsStatusFilter('');
                    }}
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
                    onNavigate={view => setCurrentView(view)}
                  />
                )}
                {currentView === 'assign' && (
                  <ManualAssignment
                    key={refreshKey}
                    onNavigate={view => setCurrentView(view)}
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
                    onNavigate={view => setCurrentView(view)}
                  />
                )}
                {currentView === 'import-field-master' && (
                  <ImportFieldMaster
                    key={refreshKey}
                    onNavigate={view => setCurrentView(view)}
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

      {/* 5. User Login / Role Switcher Modal */}
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
