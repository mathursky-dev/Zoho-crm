import React from 'react';
import { UserRole } from '../../types/crm';
import {
  LayoutDashboard,
  Users2,
  FileSpreadsheet,
  UserCheck,
  Building2,
  UserCog,
  Tags,
  BarChart3,
  LogOut,
  PhoneCall,
  CalendarClock,
  Briefcase,
  Sliders,
  TableProperties,
} from 'lucide-react';

export type AdminView =
  | 'dashboard'
  | 'leads'
  | 'import'
  | 'assign'
  | 'departments'
  | 'users'
  | 'statuses'
  | 'field-master'
  | 'import-field-master'
  | 'reports';

export type TelecallerView =
  | 'dashboard'
  | 'my-leads'
  | 'my-followups'
  | 'reports';

interface Props {
  role: UserRole;
  currentView: string;
  onSelectView: (view: any) => void;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<Props> = ({
  role,
  currentView,
  onSelectView,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}) => {
  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users2 },
    { id: 'import', label: 'Import Leads', icon: FileSpreadsheet },
    { id: 'assign', label: 'Assign Leads', icon: UserCheck },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'users', label: 'Users', icon: UserCog },
    { id: 'statuses', label: 'Status Master', icon: Tags },
    { id: 'field-master', label: 'Field Master', icon: Sliders },
    { id: 'import-field-master', label: 'Import Field Master', icon: TableProperties },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const userMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-leads', label: 'My Leads', icon: Briefcase },
    { id: 'my-followups', label: 'My Follow-ups', icon: CalendarClock },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-2xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 md:top-14 h-screen md:h-[calc(100vh-3.5rem)] w-64 bg-slate-900 text-slate-300 flex flex-col justify-between z-40 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Navigation list */}
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Role header indicator */}
          <div className="px-3 py-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Workspace Role
            </span>
            <span className="text-xs font-bold text-white uppercase flex items-center space-x-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  role === 'admin' ? 'bg-blue-400' : 'bg-emerald-400'
                }`}
              />
              <span>{role === 'admin' ? 'Admin Portal' : 'Telecaller Portal'}</span>
            </span>
          </div>

          <nav className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Menu Navigation
            </div>
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onLogout();
            }}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
