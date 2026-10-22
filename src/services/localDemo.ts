import {
  Advance,
  AttendanceRecord,
  CompanySettings,
  DashboardStats,
  DailyWage,
  JobType,
  Staff,
  User,
  UserRole,
  AuthResponse,
} from '../types';

const STORAGE_KEY = 'workpulse_demo_data';
const TOKEN_KEY = 'workpulse_auth_token';
const USER_KEY = 'workpulse_user';

type DemoState = {
  users: Array<User & { password: string }>;
  staff: Staff[];
  jobs: JobType[];
  attendance: AttendanceRecord[];
  wages: DailyWage[];
  advances: Advance[];
  settings: CompanySettings;
  nextIds: { user: number; staff: number; job: number; wage: number; advance: number };
};

const defaultState = (): DemoState => ({
  users: [
    { id: 1, username: 'admin', email: 'admin@apexindustries.in', password: 'admin123', name: 'Rajesh V. (System Admin)', role: 'Admin', staff_id: null, status: 'Active' },
    { id: 2, username: 'supervisor', email: 'supervisor@apexindustries.in', password: 'super123', name: 'Senthil Nathan (Floor Lead)', role: 'Supervisor', staff_id: null, status: 'Active' },
    { id: 3, username: 'accountant', email: 'accounts@apexindustries.in', password: 'account123', name: 'Pooja Sharma (Accounts)', role: 'Accountant', staff_id: null, status: 'Active' },
    { id: 4, username: 'ramesh', email: 'ramesh@apexindustries.in', password: 'ramesh123', name: 'Ramesh Kumar (Worker)', role: 'Worker', staff_id: 1, status: 'Active' },
  ],
  staff: [
    { id: 1, staff_code: 'STF-001', name: 'Ramesh Kumar', gender: 'Male', age: 34, dob: '1992-05-14', address: 'Coimbatore', phone: '9842112345', aadhaar_num: '4521 8890 1234', marital_status: 'Married', spouse_name: 'Sunita Devi', spouse_phone: '9842112346', spouse_occupation: 'Homemaker', doj: '2022-03-15', role: 'Senior Loader', wage_type: 'Piece Rate', daily_rate: 450, bank_name: 'State Bank of India', account_num: '30981245678', ifsc_code: 'SBIN0001234', branch_name: 'Pollachi Main Branch', esi_num: 'ESI-310045678912', pf_num: 'PF-TN/CBE/0045612/01', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, staff_code: 'STF-002', name: 'Murugan V.', gender: 'Male', age: 24, dob: '2002-09-20', address: 'Coimbatore', phone: '9789054321', aadhaar_num: '6734 9912 8765', marital_status: 'Single', father_name: 'Velusamy K.', mother_name: 'Kamalam V.', parent_phone: '9789054320', parent_address: 'Coimbatore', doj: '2023-06-01', role: 'Sorting Worker', wage_type: 'Piece Rate', daily_rate: 400, bank_name: 'Canara Bank', account_num: '12450100087654', ifsc_code: 'CNRB0001245', branch_name: 'Singanallur Branch', esi_num: 'ESI-310045678913', pf_num: 'PF-TN/CBE/0045612/02', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, staff_code: 'STF-003', name: 'Lakshmi Priya', gender: 'Female', age: 29, dob: '1997-11-08', address: 'Coimbatore', phone: '9443219876', aadhaar_num: '8912 3456 7890', marital_status: 'Married', spouse_name: 'Karthik Raja', spouse_phone: '9443219875', spouse_occupation: 'Electrician', doj: '2021-08-10', role: 'Packaging Operator', wage_type: 'Piece Rate', daily_rate: 420, bank_name: 'HDFC Bank', account_num: '50100234567891', ifsc_code: 'HDFC0000456', branch_name: 'Peelamedu Branch', esi_num: 'ESI-310045678914', pf_num: 'PF-TN/CBE/0045612/03', status: 'Active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  jobs: [
    { id: 1, code: 'JOB-101', title: 'Raw Material Unloading & Stacking', description: 'Manual unloading and pallet stacking', category: 'Loading', rate_amount: 100, unit_quantity: 100, unit_name: 'kg', status: 'Active' },
    { id: 2, code: 'JOB-102', title: 'Cotton Bale Sorting & Grading', description: 'Inspecting and sorting bales', category: 'Processing', rate_amount: 150, unit_quantity: 100, unit_name: 'kg', status: 'Active' },
    { id: 3, code: 'JOB-103', title: '50kg Bag Stitching & Sealing', description: 'Stitching packaging bags', category: 'Packaging', rate_amount: 12, unit_quantity: 1, unit_name: 'bags', status: 'Active' },
  ],
  attendance: [],
  wages: [],
  advances: [],
  settings: { id: 1, company_name: 'Apex Agro & Industrial Works Pvt Ltd', tagline: 'Daily Production, Piece-Rate & Payroll System', address: 'Coimbatore, Tamil Nadu', phone: '+91 98450 12345', email: 'operations@apexindustries.in', gstin: '33AAAAA0000A1Z5', esi_code: 'ESI-54000987650001001', currency_symbol: '₹', standard_working_hours: 8 },
  nextIds: { user: 5, staff: 4, job: 4, wage: 1, advance: 1 },
});

function load(): DemoState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultState();
  } catch (error) {
    console.error('Failed to load local demo data:', error);
    return defaultState();
  }
}

function save(state: DemoState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentUser(state: DemoState): User | null {
  const id = Number(localStorage.getItem(TOKEN_KEY)?.replace('demo-', ''));
  return state.users.find((user) => user.id === id) || null;
}

function scopedStaff(state: DemoState): Staff[] {
  const user = currentUser(state);
  return user?.role === 'Worker' && user.staff_id ? state.staff.filter((staff) => staff.id === user.staff_id) : state.staff;
}

function withWageDetails(state: DemoState, wage: DailyWage): DailyWage {
  const staff = state.staff.find((item) => item.id === wage.staff_id);
  const job = state.jobs.find((item) => item.id === wage.job_type_id);
  return { ...wage, staff_name: staff?.name, staff_code: staff?.staff_code, staff_phone: staff?.phone, staff_role: staff?.role, bank_name: staff?.bank_name, account_num: staff?.account_num, ifsc_code: staff?.ifsc_code, esi_num: staff?.esi_num, job_title: job?.title, job_category: job?.category, unit_name: job?.unit_name };
}

function today() { return new Date().toISOString().slice(0, 10); }

export const localDemo = {
  login(username: string, password: string): AuthResponse {
    const state = load();
    const user = state.users.find((item) => (item.username === username.trim() || item.email === username.trim()) && item.status === 'Active' && item.password === password);
    if (!user) throw new Error('Invalid username or password, or account is inactive');
    const { password: _password, ...safeUser } = user;
    localStorage.setItem(TOKEN_KEY, `demo-${user.id}`);
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    return { token: `demo-${user.id}`, user: safeUser };
  },
  getStoredUser(): User | null {
    try { const user = localStorage.getItem(USER_KEY); return user ? JSON.parse(user) : null; } catch { return null; }
  },
  logout() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
  getUsers(): User[] { return load().users.map(({ password: _password, ...user }) => user); },
  createUser(data: Partial<User> & { password?: string }): User {
    const state = load();
    if (!data.username || !data.email || !data.password || !data.name) throw new Error('Name, username, email, and password are required');
    const user = { id: state.nextIds.user++, username: data.username, email: data.email, password: data.password, name: data.name, role: (data.role || 'Worker') as UserRole, staff_id: data.staff_id || null, status: data.status || 'Active' };
    state.users.push(user); save(state); const { password: _password, ...safeUser } = user; return safeUser;
  },
  updateUser(id: number, data: Partial<User> & { password?: string }): User {
    const state = load(); const user = state.users.find((item) => item.id === id); if (!user) throw new Error('User not found');
    Object.assign(user, data); if (data.password) user.password = data.password; save(state); const { password: _password, ...safeUser } = user; return safeUser;
  },
  deleteUser(id: number) { const state = load(); state.users = state.users.filter((user) => user.id !== id); save(state); return { success: true }; },
  getStaff(params?: { search?: string; status?: string; marital_status?: string; role?: string }): Staff[] {
    let result = scopedStaff(load()); const search = params?.search?.toLowerCase();
    return result.filter((staff) => (!search || [staff.name, staff.staff_code, staff.phone].some((value) => value.toLowerCase().includes(search))) && (!params?.status || params.status === 'all' || staff.status === params.status) && (!params?.marital_status || params.marital_status === 'all' || staff.marital_status === params.marital_status) && (!params?.role || params.role === 'all' || staff.role === params.role)).sort((a, b) => b.id - a.id);
  },
  getStaffById(id: number) {
    const state = load(); const staff = scopedStaff(state).find((item) => item.id === id); if (!staff) throw new Error('Staff member not found');
    const recentWages = state.wages.filter((wage) => wage.staff_id === id).map((wage) => withWageDetails(state, wage)).slice(-10).reverse();
    return { staff, recentWages, recentAttendance: state.attendance.filter((item) => item.staff_id === id).slice(-15).reverse(), activeAdvances: state.advances.filter((item) => item.staff_id === id && item.status !== 'Recovered'), stats: { total_earned: recentWages.reduce((sum, wage) => sum + wage.net_wage, 0), total_pending: recentWages.filter((wage) => wage.payment_status === 'Pending').reduce((sum, wage) => sum + wage.net_wage, 0) } };
  },
  createStaff(data: Partial<Staff>) { const state = load(); const now = new Date().toISOString(); const staff = { ...data, id: state.nextIds.staff++, created_at: now, updated_at: now, status: data.status || 'Active' } as Staff; state.staff.unshift(staff); save(state); return staff; },
  updateStaff(id: number, data: Partial<Staff>) { const state = load(); const index = state.staff.findIndex((item) => item.id === id); if (index < 0) throw new Error('Staff member not found'); state.staff[index] = { ...state.staff[index], ...data, updated_at: new Date().toISOString() }; save(state); return state.staff[index]; },
  deleteStaff(id: number) { const state = load(); state.staff = state.staff.filter((staff) => staff.id !== id); save(state); return { success: true }; },
  getJobs(): JobType[] { return load().jobs; },
  createJob(data: Partial<JobType>) { const state = load(); const job = { ...data, id: state.nextIds.job++, code: `JOB-${100 + state.nextIds.job}`, status: 'Active' } as JobType; state.jobs.push(job); save(state); return job; },
  updateJob(id: number, data: Partial<JobType>) { const state = load(); const index = state.jobs.findIndex((job) => job.id === id); if (index < 0) throw new Error('Job type not found'); state.jobs[index] = { ...state.jobs[index], ...data }; save(state); return state.jobs[index]; },
  deleteJob(id: number) { const state = load(); state.jobs = state.jobs.filter((job) => job.id !== id); save(state); return { success: true }; },
  getAttendance(date: string) { const state = load(); const records = scopedStaff(state).map((staff) => state.attendance.find((item) => item.staff_id === staff.id && item.date === date) || { staff_id: staff.id, staff_code: staff.staff_code, name: staff.name, role: staff.role, staff_status: staff.status, date, attendance_status: null, overtime_hours: 0, shift: 'Day Shift', notes: '' }); return { date, records }; },
  saveBulkAttendance(date: string, records: Array<{ staff_id: number; status: string; overtime_hours: number; shift: string; notes: string }>) { const state = load(); state.attendance = state.attendance.filter((item) => item.date !== date); state.attendance.push(...records.map((record) => { const staff = state.staff.find((item) => item.id === record.staff_id)!; return { ...record, staff_id: record.staff_id, staff_code: staff.staff_code, name: staff.name, role: staff.role, staff_status: staff.status, date, attendance_status: record.status as AttendanceRecord['attendance_status'] }; })); save(state); return { success: true, message: `Attendance saved for ${records.length} staff members on ${date}` }; },
  getWages(params?: { date?: string; startDate?: string; endDate?: string; staff_id?: string | number; status?: string; job_type_id?: string | number }) {
    const state = load(); const user = currentUser(state); let wages = state.wages.filter((wage) => user?.role !== 'Worker' || wage.staff_id === user.staff_id);
    return wages.filter((wage) => (!params?.date || wage.wage_date === params.date) && (!params?.startDate || !params?.endDate || (wage.wage_date >= params.startDate && wage.wage_date <= params.endDate)) && (!params?.staff_id || params.staff_id === 'all' || wage.staff_id === Number(params.staff_id)) && (!params?.status || params.status === 'all' || wage.payment_status === params.status) && (!params?.job_type_id || params.job_type_id === 'all' || wage.job_type_id === Number(params.job_type_id))).map((wage) => withWageDetails(state, wage)).sort((a, b) => b.wage_date.localeCompare(a.wage_date) || b.id - a.id);
  },
  createWage(data: Partial<DailyWage>) { const state = load(); const wage = { ...data, id: state.nextIds.wage++, payment_status: data.payment_status || 'Pending', payment_mode: data.payment_mode || 'Cash', net_wage: Number(data.base_amount || 0) + Number(data.overtime_amount || 0) + Number(data.bonus_amount || 0) - Number(data.deductions || 0), created_at: new Date().toISOString() } as DailyWage; state.wages.push(wage); save(state); return withWageDetails(state, wage); },
  updateWage(id: number, data: Partial<DailyWage>) { const state = load(); const index = state.wages.findIndex((wage) => wage.id === id); if (index < 0) throw new Error('Wage record not found'); state.wages[index] = { ...state.wages[index], ...data }; save(state); return withWageDetails(state, state.wages[index]); },
  updateWageStatus(id: number, payment_status: string, payment_mode?: string) { const state = load(); const wage = state.wages.find((item) => item.id === id); if (!wage) throw new Error('Wage record not found'); wage.payment_status = payment_status as DailyWage['payment_status']; if (payment_mode) wage.payment_mode = payment_mode as DailyWage['payment_mode']; wage.payment_date = payment_status === 'Paid' ? today() : null; save(state); return { success: true }; },
  deleteWage(id: number) { const state = load(); state.wages = state.wages.filter((wage) => wage.id !== id); save(state); return { success: true }; },
  getAdvances(): Advance[] { return load().advances; },
  createAdvance(data: Partial<Advance>) { const state = load(); const advance = { ...data, id: state.nextIds.advance++, status: 'Active', recovered_amount: 0 } as Advance; state.advances.push(advance); save(state); return advance; },
  getDashboardStats(): DashboardStats {
    const state = load(); const wages = this.getWages(); const attendance = this.getAttendance(today()).records;
    return { today: today(), totalStaff: scopedStaff(state).filter((staff) => staff.status === 'Active').length, attendance: { present_count: attendance.filter((item) => item.attendance_status === 'Present').length, half_day_count: attendance.filter((item) => item.attendance_status === 'Half Day').length, absent_count: attendance.filter((item) => item.attendance_status === 'Absent').length, overtime_count: attendance.filter((item) => item.overtime_hours > 0).length }, wages: { total_amount: wages.reduce((sum, wage) => sum + wage.net_wage, 0), paid_amount: wages.filter((wage) => wage.payment_status === 'Paid').reduce((sum, wage) => sum + wage.net_wage, 0), pending_amount: wages.filter((wage) => wage.payment_status !== 'Paid').reduce((sum, wage) => sum + wage.net_wage, 0), total_units_completed: wages.reduce((sum, wage) => sum + Number(wage.units_completed || 0), 0), total_entries: wages.length }, trend: [], jobDistribution: [], recentActivity: wages.slice(0, 6) };
  },
  getSettings(): CompanySettings { return load().settings; },
  updateSettings(data: Partial<CompanySettings>) { const state = load(); state.settings = { ...state.settings, ...data }; save(state); return state.settings; },
};
