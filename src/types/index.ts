export type UserRole = 'Admin' | 'Supervisor' | 'Accountant' | 'Worker';

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  staff_id?: number | null;
  status: 'Active' | 'Inactive';
  created_at?: string;
  linked_staff_name?: string;
  linked_staff_code?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type MaritalStatus = 'Married' | 'Single' | 'Divorced' | 'Widowed';
export type Gender = 'Male' | 'Female' | 'Other';
export type StaffStatus = 'Active' | 'Inactive' | 'On Leave';
export type WageType = 'Piece Rate' | 'Daily Wage' | 'Monthly';
export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Overtime' | 'Paid Leave';
export type PaymentStatus = 'Pending' | 'Paid' | 'Partially Paid';
export type PaymentMode = 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';

export interface Staff {
  id: number;
  staff_code: string;
  name: string;
  gender: Gender;
  age: number;
  dob: string;
  address: string;
  phone: string;
  aadhaar_num: string;
  marital_status: MaritalStatus;
  
  // Married details
  spouse_name?: string | null;
  spouse_phone?: string | null;
  spouse_occupation?: string | null;
  
  // Single/Unmarried details
  father_name?: string | null;
  mother_name?: string | null;
  parent_phone?: string | null;
  parent_address?: string | null;
  
  doj: string; // Date of Joining
  role: string;
  wage_type: WageType;
  daily_rate: number;
  
  bank_name: string;
  account_num: string;
  ifsc_code: string;
  branch_name: string;
  
  esi_num?: string | null;
  pf_num?: string | null;
  status: StaffStatus;
  created_at: string;
  updated_at: string;
}

export interface JobType {
  id: number;
  code: string;
  title: string;
  description?: string;
  category: string;
  rate_amount: number;
  unit_quantity: number;
  unit_name: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
}

export interface AttendanceRecord {
  staff_id: number;
  staff_code: string;
  name: string;
  role: string;
  staff_status: StaffStatus;
  attendance_id?: number | null;
  date: string;
  attendance_status: AttendanceStatus | null;
  overtime_hours: number;
  shift: string;
  notes: string;
}

export interface DailyWage {
  id: number;
  wage_date: string;
  staff_id: number;
  staff_name?: string;
  staff_code?: string;
  staff_phone?: string;
  staff_role?: string;
  bank_name?: string;
  account_num?: string;
  ifsc_code?: string;
  esi_num?: string;
  job_type_id?: number | null;
  job_title?: string;
  job_category?: string;
  unit_name?: string;
  work_description: string;
  units_completed: number;
  rate_snapshot: string;
  rate_per_single_unit: number;
  base_amount: number;
  overtime_amount: number;
  bonus_amount: number;
  deductions: number;
  net_wage: number;
  payment_status: PaymentStatus;
  payment_mode: PaymentMode;
  payment_date?: string | null;
  notes?: string;
  created_at?: string;
}

export interface Advance {
  id: number;
  staff_id: number;
  staff_name?: string;
  staff_code?: string;
  phone?: string;
  request_date: string;
  amount: number;
  reason?: string;
  status: 'Active' | 'Recovered' | 'Partially Recovered';
  recovered_amount: number;
}

export interface CompanySettings {
  id: number;
  company_name: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  esi_code?: string;
  currency_symbol: string;
  standard_working_hours: number;
}

export interface DashboardStats {
  today: string;
  totalStaff: number;
  attendance: {
    present_count: number;
    half_day_count: number;
    absent_count: number;
    overtime_count: number;
  };
  wages: {
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    total_units_completed: number;
    total_entries: number;
  };
  trend: Array<{
    wage_date: string;
    total_wage: number;
    total_units: number;
    active_workers: number;
  }>;
  jobDistribution: Array<{
    category: string;
    title: string;
    total_wages: number;
    total_units: number;
    task_count: number;
  }>;
  recentActivity: DailyWage[];
}
