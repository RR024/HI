import { Staff, JobType, AttendanceRecord, DailyWage, Advance, CompanySettings, DashboardStats, User, AuthResponse } from '../types';
import { localDemo } from './localDemo';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

/** Turn an error response ({"error": "..."} JSON or plain text) into a readable message. */
async function errorMessage(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.error === 'string') return parsed.error;
  } catch {
    /* not JSON */
  }
  return text || `Request failed (${res.status})`;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('workpulse_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && !url.includes('/auth/login')) {
    api.logout();
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  return res;
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<AuthResponse> {
    if (DEMO_MODE) return localDemo.login(username, password);
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
    if (DEMO_MODE) {
      const user = localDemo.getStoredUser();
      if (!user) throw new Error('Authentication required. Please login.');
      return user;
    }
    const res = await authFetch(`${API_BASE}/auth/me`);
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  logout() {
    if (DEMO_MODE) {
      localDemo.logout();
      return;
    }
    localStorage.removeItem('workpulse_auth_token');
    localStorage.removeItem('workpulse_user');
  },

  getStoredUser(): User | null {
    if (DEMO_MODE) return localDemo.getStoredUser();
    try {
      const user = localStorage.getItem('workpulse_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error('Failed to parse stored user from localStorage:', e);
      localStorage.removeItem('workpulse_user');
      return null;
    }
  },

  // User Management (Admin only)
  async getUsers(): Promise<User[]> {
    if (DEMO_MODE) return localDemo.getUsers();
    const res = await authFetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  async createUser(data: Partial<User> & { password?: string }): Promise<User> {
    if (DEMO_MODE) return localDemo.createUser(data);
    const res = await authFetch(`${API_BASE}/auth/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create user');
    return result;
  },

  async updateUser(id: number, data: Partial<User> & { password?: string }): Promise<User> {
    if (DEMO_MODE) return localDemo.updateUser(id, data);
    const res = await authFetch(`${API_BASE}/auth/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update user');
    return result;
  },

  async deleteUser(id: number): Promise<{ success: boolean }> {
    if (DEMO_MODE) return localDemo.deleteUser(id);
    const res = await authFetch(`${API_BASE}/auth/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  // Staff
  async getStaff(params?: { search?: string; status?: string; marital_status?: string; role?: string }): Promise<Staff[]> {
    if (DEMO_MODE) return localDemo.getStaff(params);
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.marital_status) query.append('marital_status', params.marital_status);
    if (params?.role) query.append('role', params.role);
    
    const res = await authFetch(`${API_BASE}/staff?${query.toString()}`);
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  async getStaffById(id: number): Promise<{
    staff: Staff;
    recentWages: DailyWage[];
    recentAttendance: any[];
    activeAdvances: Advance[];
    stats: { total_earned: number; total_pending: number };
  }> {
    if (DEMO_MODE) return localDemo.getStaffById(id);
    const res = await authFetch(`${API_BASE}/staff/${id}`);
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  async createStaff(data: Partial<Staff>): Promise<Staff> {
    if (DEMO_MODE) return localDemo.createStaff(data);
    const res = await authFetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create staff');
    return result;
  },

  async updateStaff(id: number, data: Partial<Staff>): Promise<Staff> {
    if (DEMO_MODE) return localDemo.updateStaff(id, data);
    const res = await authFetch(`${API_BASE}/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update staff');
    return result;
  },

  async deleteStaff(id: number): Promise<{ success: boolean; deactivated?: boolean; message?: string }> {
    if (DEMO_MODE) return localDemo.deleteStaff(id);
    const res = await authFetch(`${API_BASE}/staff/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  // Job Types
  async getJobs(): Promise<JobType[]> {
    if (DEMO_MODE) return localDemo.getJobs();
    const res = await authFetch(`${API_BASE}/jobs`);
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  async createJob(data: Partial<JobType>): Promise<JobType> {
    if (DEMO_MODE) return localDemo.createJob(data);
    const res = await authFetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create job type');
    return result;
  },

  async updateJob(id: number, data: Partial<JobType>): Promise<JobType> {
    if (DEMO_MODE) return localDemo.updateJob(id, data);
    const res = await authFetch(`${API_BASE}/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update job type');
    return result;
  },

  async deleteJob(id: number): Promise<{ success: boolean }> {
    if (DEMO_MODE) return localDemo.deleteJob(id);
    const res = await authFetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  // Attendance
  async getAttendance(date: string): Promise<{ date: string; records: AttendanceRecord[] }> {
    if (DEMO_MODE) return localDemo.getAttendance(date);
    const res = await authFetch(`${API_BASE}/attendance?date=${date}`);
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  async saveBulkAttendance(date: string, records: Array<{
    staff_id: number;
    status: string;
    overtime_hours: number;
    shift: string;
    notes: string;
  }>): Promise<{ success: boolean; message: string }> {
    if (DEMO_MODE) return localDemo.saveBulkAttendance(date, records);
    const res = await authFetch(`${API_BASE}/attendance/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    if (DEMO_MODE) return localDemo.getWages(params);
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.staff_id) query.append('staff_id', String(params.staff_id));
    if (params?.status) query.append('status', params.status);
    if (params?.job_type_id) query.append('job_type_id', String(params.job_type_id));

    const res = await authFetch(`${API_BASE}/wages?${query.toString()}`);
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  async createWage(data: Partial<DailyWage>): Promise<DailyWage> {
    if (DEMO_MODE) return localDemo.createWage(data);
    const res = await authFetch(`${API_BASE}/wages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to record wage');
    return result;
  },

  async updateWage(id: number, data: Partial<DailyWage>): Promise<DailyWage> {
    if (DEMO_MODE) return localDemo.updateWage(id, data);
    const res = await authFetch(`${API_BASE}/wages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update wage');
    return result;
  },

  async updateWageStatus(id: number, payment_status: string, payment_mode?: string): Promise<{ success: boolean }> {
    if (DEMO_MODE) return localDemo.updateWageStatus(id, payment_status, payment_mode);
    const res = await authFetch(`${API_BASE}/wages/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status, payment_mode }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update payment status');
    return result;
  },

  async deleteWage(id: number): Promise<{ success: boolean }> {
    if (DEMO_MODE) return localDemo.deleteWage(id);
    const res = await authFetch(`${API_BASE}/wages/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  // Advances
  async getAdvances(): Promise<Advance[]> {
    if (DEMO_MODE) return localDemo.getAdvances();
    const res = await authFetch(`${API_BASE}/advances`);
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  async createAdvance(data: Partial<Advance>): Promise<Advance> {
    if (DEMO_MODE) return localDemo.createAdvance(data);
    const res = await authFetch(`${API_BASE}/advances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to record advance');
    return result;
  },

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    if (DEMO_MODE) return localDemo.getDashboardStats();
    const res = await authFetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  // Company Settings
  async getSettings(): Promise<CompanySettings> {
    if (DEMO_MODE) return localDemo.getSettings();
    const res = await authFetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  async updateSettings(data: Partial<CompanySettings>): Promise<CompanySettings> {
    if (DEMO_MODE) return localDemo.updateSettings(data);
    const res = await authFetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update settings');
    return result;
  }
};
