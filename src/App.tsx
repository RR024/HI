import React, { useState, useEffect, useCallback } from 'react';
import { todayLocal } from './utils';
import { api } from './services/api';
import { Staff, JobType, AttendanceRecord, DailyWage, CompanySettings, DashboardStats, User as UserType } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { StaffView } from './components/StaffView';
import { StaffModal } from './components/StaffModal';
import { StaffDetailModal } from './components/StaffDetailModal';
import { JobTypesView } from './components/JobTypesView';
import { AttendanceView } from './components/AttendanceView';
import { DailyWagesView } from './components/DailyWagesView';
import { WageModal } from './components/WageModal';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { UsersView } from './components/UsersView';
import { LoginModal } from './components/LoginModal';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(api.getStoredUser());
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Core Data States
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [wages, setWages] = useState<DailyWage[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<string>(todayLocal());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [usersList, setUsersList] = useState<UserType[]>([]);

  // Selected Date for Wages
  const [wageFilterDate, setWageFilterDate] = useState<string>(todayLocal());

  // Modals State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [viewingStaff, setViewingStaff] = useState<Staff | null>(null);
  const [viewingStaffWages, setViewingStaffWages] = useState<DailyWage[]>([]);

  const [isWageModalOpen, setIsWageModalOpen] = useState<boolean>(false);
  const [editingWage, setEditingWage] = useState<DailyWage | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [sessionCount, setSessionCount] = useState(0);

  // Auth Handlers
  const handleLogin = async (username: string, pass: string) => {
    try {
      setAuthLoading(true);
      setAuthError('');
      const authRes = await api.login(username, pass);
      setCurrentUser(authRes.user);
      setSessionCount((prev) => prev + 1);
      showToast(`Welcome back, ${authRes.user.name} (${authRes.user.role})!`);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    showToast('Logged out successfully.');
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      showToast('Session expired or unauthorized. Please sign in again.', 'error');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Data Fetching with explicit parameter defaults to avoid stale closures
  const fetchAllData = useCallback(async (user = currentUser, wDate = wageFilterDate, aDate = attendanceDate) => {
    if (!user) return;
    try {
      setLoading(true);
      const promises: Promise<any>[] = [
        api.getStaff(),
        api.getJobs(),
        api.getWages({ date: wDate }),
        api.getAttendance(aDate),
        api.getDashboardStats(),
        api.getSettings(),
      ];

      if (user.role === 'Admin') {
        promises.push(api.getUsers());
      }

      const results = await Promise.all(promises);

      setStaffList(results[0]);
      setJobTypes(results[1]);
      setWages(results[2]);
      setAttendanceRecords(results[3].records);
      setDashboardStats(results[4]);
      setSettings(results[5]);

      if (user.role === 'Admin' && results[6]) {
        setUsersList(results[6]);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      showToast(err.message || 'Failed to load system data', 'error');
    } finally {
      setLoading(false);
    }
  }, [wageFilterDate, attendanceDate, currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchAllData(currentUser, wageFilterDate, attendanceDate);
    }
  }, [currentUser?.id, sessionCount]);

  // Reload Attendance when date changes
  useEffect(() => {
    if (!currentUser) return;
    const loadAtt = async () => {
      try {
        const data = await api.getAttendance(attendanceDate);
        setAttendanceRecords(data.records);
      } catch (err) {
        console.error(err);
      }
    };
    loadAtt();
  }, [attendanceDate]);

  // Reload Wages when filter date changes
  useEffect(() => {
    if (!currentUser) return;
    const loadW = async () => {
      try {
        const data = await api.getWages({ date: wageFilterDate });
        setWages(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadW();
  }, [wageFilterDate]);

  // -------------------------------------------------------------
  // Staff Handlers
  // -------------------------------------------------------------
  const handleOpenStaffModal = (staff?: Staff) => {
    setEditingStaff(staff || null);
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (staffData: Partial<Staff>) => {
    try {
      if (editingStaff) {
        const updated = await api.updateStaff(editingStaff.id, staffData);
        setStaffList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        showToast(`Staff member "${updated.name}" updated successfully!`);
      } else {
        const created = await api.createStaff(staffData);
        setStaffList((prev) => [created, ...prev]);
        showToast(`New staff "${created.name}" (${created.staff_code}) registered!`);
      }
      const stats = await api.getDashboardStats();
      setDashboardStats(stats);
    } catch (err: any) {
      showToast(err.message || 'Failed to save staff record', 'error');
      throw err;
    }
  };

  const handleDeleteStaff = async (id: number) => {
    try {
      const result = await api.deleteStaff(id);
      if (result.deactivated) {
        // Staff with payroll history are kept (marked Inactive) rather than erased.
        setStaffList((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'Inactive' } : s)));
      } else {
        setStaffList((prev) => prev.filter((s) => s.id !== id));
      }
      showToast(result.message || 'Staff record removed.');
      const stats = await api.getDashboardStats();
      setDashboardStats(stats);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete staff record', 'error');
    }
  };

  const handleViewStaffDetail = async (staff: Staff) => {
    try {
      const full = await api.getStaffById(staff.id);
      setViewingStaff(full.staff);
      setViewingStaffWages(full.recentWages || []);
      setIsDetailModalOpen(true);
    } catch (err) {
      setViewingStaff(staff);
      setViewingStaffWages([]);
      setIsDetailModalOpen(true);
    }
  };

  // -------------------------------------------------------------
  // Job Type Handlers
  // -------------------------------------------------------------
  const handleCreateJob = async (data: Partial<JobType>) => {
    try {
      const created = await api.createJob(data);
      setJobTypes((prev) => [...prev, created]);
      showToast(`Job Scheme "${created.title}" added!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create job scheme', 'error');
    }
  };

  const handleUpdateJob = async (id: number, data: Partial<JobType>) => {
    try {
      const updated = await api.updateJob(id, data);
      setJobTypes((prev) => prev.map((j) => (j.id === id ? updated : j)));
      showToast(`Job Scheme "${updated.title}" updated!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update job scheme', 'error');
    }
  };

  const handleDeleteJob = async (id: number) => {
    try {
      await api.deleteJob(id);
      setJobTypes((prev) => prev.filter((j) => j.id !== id));
      showToast('Job scheme removed.');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove job scheme', 'error');
    }
  };

  // -------------------------------------------------------------
  // Attendance Handlers
  // -------------------------------------------------------------
  const handleSaveAttendance = async (date: string, records: any[]) => {
    try {
      await api.saveBulkAttendance(date, records);
      const refreshed = await api.getAttendance(date);
      setAttendanceRecords(refreshed.records);
      const stats = await api.getDashboardStats();
      setDashboardStats(stats);
      showToast(`Attendance for ${records.length} staff members saved!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to save attendance', 'error');
    }
  };

  // -------------------------------------------------------------
  // Wage Handlers
  // -------------------------------------------------------------
  const handleOpenWageModal = (wage?: DailyWage) => {
    setEditingWage(wage || null);
    setIsWageModalOpen(true);
  };

  const handleSaveWage = async (wageData: Partial<DailyWage>) => {
    try {
      if (editingWage) {
        const updated = await api.updateWage(editingWage.id, wageData);
        setWages((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
        showToast('Daily wage record updated!');
      } else {
        const created = await api.createWage(wageData);
        setWages((prev) => [created, ...prev]);
        showToast(`Daily wage of ₹${created.net_wage} logged for ${created.staff_name}!`);
      }
      const stats = await api.getDashboardStats();
      setDashboardStats(stats);
    } catch (err: any) {
      showToast(err.message || 'Failed to save wage entry', 'error');
      throw err;
    }
  };

  const handleUpdateWageStatus = async (id: number, status: string, mode?: string) => {
    try {
      await api.updateWageStatus(id, status, mode);
      setWages((prev) =>
        prev.map((w) => (w.id === id ? { ...w, payment_status: status as any, payment_mode: (mode as any) || w.payment_mode } : w))
      );
      const stats = await api.getDashboardStats();
      setDashboardStats(stats);
      showToast(`Wage payment status changed to "${status}"`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment status', 'error');
    }
  };

  const handleDeleteWage = async (id: number) => {
    try {
      await api.deleteWage(id);
      setWages((prev) => prev.filter((w) => w.id !== id));
      const stats = await api.getDashboardStats();
      setDashboardStats(stats);
      showToast('Wage record deleted.');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete wage entry', 'error');
    }
  };

  // -------------------------------------------------------------
  // Users Handlers (Admin only)
  // -------------------------------------------------------------
  const handleCreateUser = async (data: any) => {
    try {
      const created = await api.createUser(data);
      const users = await api.getUsers();
      setUsersList(users);
      showToast(`User account "${created.name}" created with role "${created.role}"!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create user account', 'error');
      throw err;
    }
  };

  const handleUpdateUser = async (id: number, data: any) => {
    try {
      const updated = await api.updateUser(id, data);
      const users = await api.getUsers();
      setUsersList(users);
      showToast(`User account "${updated.name}" updated!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update user account', 'error');
      throw err;
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await api.deleteUser(id);
      setUsersList((prev) => prev.filter((u) => u.id !== id));
      showToast('User account removed.');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove user account', 'error');
    }
  };

  // -------------------------------------------------------------
  // Settings Handler
  // -------------------------------------------------------------
  const handleSaveSettings = async (settingsData: Partial<CompanySettings>) => {
    try {
      const updated = await api.updateSettings(settingsData);
      setSettings(updated);
      showToast('Company settings updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to save company settings', 'error');
      throw err;
    }
  };

  // If not logged in, render the Login Screen
  if (!currentUser) {
    return (
      <LoginModal
        onLogin={handleLogin}
        loading={authLoading}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white ${
              toastMessage.type === 'success' ? 'bg-slate-900 border border-slate-700' : 'bg-rose-600'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        settings={settings}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenStaffModal={() => handleOpenStaffModal()}
        onOpenWageModal={() => handleOpenWageModal()}
      />

      {/* Navigation Tab Bar with Role Filtering */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        staffCount={staffList.length}
        currentUser={currentUser}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Loading authorized business data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={dashboardStats}
                staffList={staffList}
                jobTypes={jobTypes}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenStaffModal={() => handleOpenStaffModal()}
                onOpenWageModal={() => handleOpenWageModal()}
                onUpdateWageStatus={handleUpdateWageStatus}
              />
            )}

            {activeTab === 'staff' && (
              <StaffView
                staffList={staffList}
                onOpenModal={handleOpenStaffModal}
                onDeleteStaff={handleDeleteStaff}
                onViewStaffDetail={handleViewStaffDetail}
              />
            )}

            {activeTab === 'jobs' && (
              <JobTypesView
                jobTypes={jobTypes}
                onCreateJob={handleCreateJob}
                onUpdateJob={handleUpdateJob}
                onDeleteJob={handleDeleteJob}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceView
                date={attendanceDate}
                onDateChange={setAttendanceDate}
                records={attendanceRecords}
                onSaveAttendance={handleSaveAttendance}
                loading={false}
              />
            )}

            {activeTab === 'wages' && (
              <DailyWagesView
                wages={wages}
                staffList={staffList}
                jobTypes={jobTypes}
                onOpenWageModal={handleOpenWageModal}
                onUpdateStatus={handleUpdateWageStatus}
                onDeleteWage={handleDeleteWage}
                selectedDate={wageFilterDate}
                onDateChange={setWageFilterDate}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                wages={wages}
                staffList={staffList}
                settings={settings}
              />
            )}

            {activeTab === 'users' && currentUser.role === 'Admin' && (
              <UsersView
                users={usersList}
                staffList={staffList}
                currentUser={currentUser}
                onCreateUser={handleCreateUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
              />
            )}

            {activeTab === 'settings' && currentUser.role === 'Admin' && (
              <SettingsView
                settings={settings}
                onSaveSettings={handleSaveSettings}
              />
            )}
          </>
        )}
      </main>

      {/* Staff Registration / Edit Modal */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSave={handleSaveStaff}
        initialData={editingStaff}
      />

      {/* Staff Profile Card & Bio-Data Modal */}
      <StaffDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        staff={viewingStaff}
        recentWages={viewingStaffWages}
        onEdit={(staff) => {
          setIsDetailModalOpen(false);
          handleOpenStaffModal(staff);
        }}
      />

      {/* Daily Wage / Piece-rate Work Entry Modal */}
      <WageModal
        isOpen={isWageModalOpen}
        onClose={() => setIsWageModalOpen(false)}
        onSave={handleSaveWage}
        initialData={editingWage}
        staffList={staffList}
        jobTypes={jobTypes}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {settings?.company_name || 'Apex Agro & Industrial Works'}. All rights reserved.
          </p>
          <p className="flex items-center space-x-2">
            <span className="font-semibold text-indigo-600">Logged in as: {currentUser.name} ({currentUser.role})</span>
            <span>•</span>
            <span>RBAC Authenticated</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
