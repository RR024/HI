import { Staff, JobType, AttendanceRecord, DailyWage, Advance, CompanySettings, DashboardStats, User, AuthResponse } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('workpulse_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login failed');
    localStorage.setItem('workpulse_auth_token', result.token);
    localStorage.setItem('workpulse_user', JSON.stringify(result.user));
    return result;
  },

  async getCurrentUser(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  logout() {
    localStorage.removeItem('workpulse_auth_token');
    localStorage.removeItem('workpulse_user');
  },

  getStoredUser(): User | null {
    const user = localStorage.getItem('workpulse_user');
    return user ? JSON.parse(user) : null;
  },

  // User Management (Admin only)
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createUser(data: Partial<User> & { password?: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create user');
    return result;
  },

  async updateUser(id: number, data: Partial<User> & { password?: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update user');
    return result;
  },

  async deleteUser(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/auth/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Staff
  async getStaff(params?: { search?: string; status?: string; marital_status?: string; role?: string }): Promise<Staff[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.marital_status) query.append('marital_status', params.marital_status);
    if (params?.role) query.append('role', params.role);
    
    const res = await fetch(`${API_BASE}/staff?${query.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getStaffById(id: number): Promise<{
    staff: Staff;
    recentWages: DailyWage[];
    recentAttendance: any[];
    activeAdvances: Advance[];
    stats: { total_earned: number; total_pending: number };
  }> {
    const res = await fetch(`${API_BASE}/staff/${id}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createStaff(data: Partial<Staff>): Promise<Staff> {
    const res = await fetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create staff');
    return result;
  },

  async updateStaff(id: number, data: Partial<Staff>): Promise<Staff> {
    const res = await fetch(`${API_BASE}/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update staff');
    return result;
  },

  async deleteStaff(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/staff/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Job Types
  async getJobs(): Promise<JobType[]> {
    const res = await fetch(`${API_BASE}/jobs`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createJob(data: Partial<JobType>): Promise<JobType> {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create job type');
    return result;
  },

  async updateJob(id: number, data: Partial<JobType>): Promise<JobType> {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update job type');
    return result;
  },

  async deleteJob(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Attendance
  async getAttendance(date: string): Promise<{ date: string; records: AttendanceRecord[] }> {
    const res = await fetch(`${API_BASE}/attendance?date=${date}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async saveBulkAttendance(date: string, records: Array<{
    staff_id: number;
    status: string;
    overtime_hours: number;
    shift: string;
    notes: string;
  }>): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/attendance/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ date, records }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to save attendance');
    return result;
  },

  // Daily Wages
  async getWages(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    staff_id?: string | number;
    status?: string;
    job_type_id?: string | number;
  }): Promise<DailyWage[]> {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.staff_id) query.append('staff_id', String(params.staff_id));
    if (params?.status) query.append('status', params.status);
    if (params?.job_type_id) query.append('job_type_id', String(params.job_type_id));

    const res = await fetch(`${API_BASE}/wages?${query.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createWage(data: Partial<DailyWage>): Promise<DailyWage> {
    const res = await fetch(`${API_BASE}/wages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to record wage');
    return result;
  },

  async updateWage(id: number, data: Partial<DailyWage>): Promise<DailyWage> {
    const res = await fetch(`${API_BASE}/wages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update wage');
    return result;
  },

  async updateWageStatus(id: number, payment_status: string, payment_mode?: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/wages/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ payment_status, payment_mode }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update payment status');
    return result;
  },

  async deleteWage(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/wages/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Advances
  async getAdvances(): Promise<Advance[]> {
    const res = await fetch(`${API_BASE}/advances`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createAdvance(data: Partial<Advance>): Promise<Advance> {
    const res = await fetch(`${API_BASE}/advances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to record advance');
    return result;
  },

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Company Settings
  async getSettings(): Promise<CompanySettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateSettings(data: Partial<CompanySettings>): Promise<CompanySettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update settings');
    return result;
  }
};
