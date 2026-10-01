import React from 'react';
import {
  Users,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Briefcase,
  Layers,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { DashboardStats, Staff, JobType, DailyWage } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DashboardViewProps {
  stats: DashboardStats | null;
  staffList: Staff[];
  jobTypes: JobType[];
  onNavigateTab: (tab: string) => void;
  onOpenStaffModal: () => void;
  onOpenWageModal: () => void;
  onUpdateWageStatus: (id: number, status: string) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  staffList,
  jobTypes,
  onNavigateTab,
  onOpenStaffModal,
  onOpenWageModal,
  onUpdateWageStatus,
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const totalStaff = stats?.totalStaff || staffList.length;
  const presentCount = stats?.attendance?.present_count || 0;
  const absentCount = stats?.attendance?.absent_count || 0;
  const halfDayCount = stats?.attendance?.half_day_count || 0;
  const attendanceRate = totalStaff > 0 ? Math.round(((presentCount + halfDayCount * 0.5) / totalStaff) * 100) : 0;

  const todayTotalWages = stats?.wages?.total_amount || 0;
  const todayPaidWages = stats?.wages?.paid_amount || 0;
  const todayPendingWages = stats?.wages?.pending_amount || 0;
  const todayUnits = stats?.wages?.total_units_completed || 0;

  return (
    <div className="space-y-6">
      
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>{todayFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Daily Business & Staff Pulse
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-2xl">
              Track worker attendance, log piece-rate tasks (e.g. ₹100/100kg), calculate net wages, and disburse daily payroll seamlessly.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={onOpenWageModal}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>Record Daily Wage</span>
            </button>

            <button
              onClick={() => onNavigateTab('attendance')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Mark Attendance</span>
            </button>

            <button
              onClick={onOpenStaffModal}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Active Staff */}
        <div
          onClick={() => onNavigateTab('staff')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Staff</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{totalStaff}</div>
          <div className="text-xs text-indigo-600 font-semibold mt-1 flex items-center gap-1">
            <span>Manage workers & KYC</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Today's Attendance Rate */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Attendance</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-emerald-900">{presentCount}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {attendanceRate}% Present
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {absentCount} Absent • {halfDayCount} Half-day
          </div>
        </div>

        {/* Today's Daily Wages */}
        <div
          onClick={() => onNavigateTab('wages')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Wages</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            ₹{todayTotalWages.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs mt-1 flex items-center gap-2">
            <span className="text-emerald-700 font-semibold">Paid: ₹{todayPaidWages}</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-700 font-semibold">Pending: ₹{todayPendingWages}</span>
          </div>
        </div>

        {/* Piece-rate Production Volume */}
        <div
          onClick={() => onNavigateTab('wages')}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Output Volume</span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {todayUnits.toLocaleString('en-IN')} <span className="text-sm font-semibold text-slate-500">units</span>
          </div>
          <div className="text-xs text-violet-700 font-semibold mt-1">
            Processed across shifts today
          </div>
        </div>
      </div>

      {/* Analytics Charts & Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 7-Day Wage Payout Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Wage Payout & Volume Trend</h3>
              <p className="text-xs text-slate-500">Daily total wage disbursements and piece-rate volume</p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
              Past Week
            </span>
          </div>

          <div className="h-64 w-full">
            {stats?.trend && stats.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="wage_date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      name === 'total_wage' ? `₹${value}` : `${value} units`,
                      name === 'total_wage' ? 'Wages (₹)' : 'Output Units',
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="total_wage" name="Wages (₹)" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="total_units" name="Output Units" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Log wage records to view trends
              </div>
            )}
          </div>
        </div>

        {/* Work Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Top Work Categories</h3>
              <button
                onClick={() => onNavigateTab('jobs')}
                className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                View Jobs
              </button>
            </div>

            <div className="space-y-3">
              {stats?.jobDistribution && stats.jobDistribution.length > 0 ? (
                stats.jobDistribution.map((j, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs truncate max-w-[150px]">{j.title}</div>
                      <span className="text-[10px] text-slate-500 font-medium">{j.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-indigo-950">₹{j.total_wages}</div>
                      <span className="text-[10px] text-slate-500">{j.total_units} units</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-8">No tasks recorded yet</div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('jobs')}
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
          >
            Configure Piece-Rate Schemes ➔
          </button>
        </div>
      </div>

      {/* Recent Wage Logs & Fast Settlement */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Wage Logs & Quick Settlement</h3>
            <p className="text-xs text-slate-500">Latest recorded piece-rate tasks and payment status</p>
          </div>
          <button
            onClick={() => onNavigateTab('wages')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Wages</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Worker</th>
                <th className="p-3">Date</th>
                <th className="p-3">Work Description</th>
                <th className="p-3">Volume & Rate</th>
                <th className="p-3">Net Wage</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((w) => {
                  const isPaid = w.payment_status === 'Paid';
                  return (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-bold text-slate-900">{w.staff_name}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({w.staff_code})</span>
                      </td>
                      <td className="p-3 text-slate-600">{w.wage_date}</td>
                      <td className="p-3 text-slate-800 font-medium max-w-[200px] truncate">{w.work_description}</td>
                      <td className="p-3 text-slate-600">
                        <span className="font-bold text-slate-800">{w.units_completed} {w.unit_name || 'units'}</span>
                        <span className="text-[10px] text-slate-400 block">{w.rate_snapshot}</span>
                      </td>
                      <td className="p-3 font-black text-slate-900">₹{w.net_wage}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onUpdateWageStatus(w.id, isPaid ? 'Pending' : 'Paid')}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {isPaid ? 'Paid' : 'Pending (Pay)'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                    No wage records logged yet. Click "Record Daily Wage" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
