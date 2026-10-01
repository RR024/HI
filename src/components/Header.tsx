import React from 'react';
import { Building2, Calendar, UserPlus, DollarSign, LogOut, ShieldCheck, User } from 'lucide-react';
import { CompanySettings, User as UserType } from '../types';

interface HeaderProps {
  settings: CompanySettings | null;
  currentUser: UserType | null;
  onLogout: () => void;
  onOpenStaffModal: () => void;
  onOpenWageModal: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  onLogout,
  onOpenStaffModal,
  onOpenWageModal,
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Supervisor':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Accountant':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Worker':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  const isWorker = currentUser?.role === 'Worker';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Company info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  {settings?.company_name || 'Daily Business & Staff Tracker'}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md hidden sm:block">
                {settings?.tagline || 'Staff Master • Attendance • Piece-Rate Wages • RBAC'}
              </p>
            </div>
          </div>

          {/* Right actions, User Profile & Date */}
          <div className="flex items-center space-x-3">
            
            <div className="hidden lg:flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 text-xs font-medium border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{todayFormatted}</span>
            </div>

            {!isWorker && (
              <>
                <button
                  onClick={onOpenStaffModal}
                  className="hidden sm:inline-flex items-center px-3 py-1.5 border border-indigo-200 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Add Staff
                </button>

                <button
                  onClick={onOpenWageModal}
                  className="inline-flex items-center px-3.5 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5 mr-1" />
                  Record Wage
                </button>
              </>
            )}

            {/* Logged in User Badge & Logout */}
            {currentUser && (
              <div className="flex items-center pl-2 sm:pl-3 border-l border-slate-200 space-x-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${getRoleColor(currentUser.role)} mt-0.5`}>
                    {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Log out of system"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
