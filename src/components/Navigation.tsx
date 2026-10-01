import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarCheck,
  Calculator,
  FileSpreadsheet,
  Settings as SettingsIcon,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { User as UserType } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  staffCount: number;
  currentUser: UserType | null;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  staffCount,
  currentUser,
}) => {
  const role = currentUser?.role || 'Admin';

  const allTabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Supervisor', 'Accountant', 'Worker'],
    },
    {
      id: 'staff',
      label: role === 'Worker' ? 'My Worker Profile' : 'Staff Master',
      icon: Users,
      badge: role !== 'Worker' && staffCount > 0 ? staffCount : undefined,
      roles: ['Admin', 'Supervisor', 'Accountant', 'Worker'],
    },
    {
      id: 'jobs',
      label: 'Work & Job Rates',
      icon: Briefcase,
      roles: ['Admin', 'Supervisor'],
    },
    {
      id: 'attendance',
      label: role === 'Worker' ? 'My Attendance' : 'Daily Attendance',
      icon: CalendarCheck,
      roles: ['Admin', 'Supervisor', 'Accountant', 'Worker'],
    },
    {
      id: 'wages',
      label: role === 'Worker' ? 'My Wage Logs' : 'Daily Wages Tracker',
      icon: Calculator,
      roles: ['Admin', 'Supervisor', 'Accountant', 'Worker'],
    },
    {
      id: 'reports',
      label: role === 'Worker' ? 'My Payslips' : 'Payslips & Reports',
      icon: FileSpreadsheet,
      roles: ['Admin', 'Supervisor', 'Accountant', 'Worker'],
    },
    {
      id: 'users',
      label: 'RBAC User Management',
      icon: ShieldCheck,
      roles: ['Admin'],
    },
    {
      id: 'settings',
      label: 'Company Settings',
      icon: SettingsIcon,
      roles: ['Admin'],
    },
  ];

  const visibleTabs = allTabs.filter((tab) => tab.roles.includes(role));

  return (
    <div className="bg-white border-b border-slate-200 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 scrollbar-none">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      isActive
                        ? 'bg-indigo-200/60 text-indigo-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
