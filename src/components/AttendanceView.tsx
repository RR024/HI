import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Calendar,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../types';

interface AttendanceViewProps {
  date: string;
  onDateChange: (newDate: string) => void;
  records: AttendanceRecord[];
  onSaveAttendance: (date: string, records: any[]) => Promise<void>;
  loading: boolean;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  date,
  onDateChange,
  records,
  onSaveAttendance,
  loading,
}) => {
  const [localRecords, setLocalRecords] = useState<AttendanceRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const formatted = records.map((r) => ({
      ...r,
      attendance_status: r.attendance_status || 'Present',
      overtime_hours: r.overtime_hours || 0,
      shift: r.shift || 'Day Shift',
      notes: r.notes || '',
    }));
    setLocalRecords(formatted);
  }, [records]);

  const handleStatusChange = (staffId: number, status: AttendanceStatus) => {
    setLocalRecords((prev) =>
      prev.map((r) => (r.staff_id === staffId ? { ...r, attendance_status: status } : r))
    );
  };

  const handleOvertimeChange = (staffId: number, ot: number) => {
    setLocalRecords((prev) =>
      prev.map((r) => (r.staff_id === staffId ? { ...r, overtime_hours: Math.max(0, ot) } : r))
    );
  };

  const handleShiftChange = (staffId: number, shift: string) => {
    setLocalRecords((prev) =>
      prev.map((r) => (r.staff_id === staffId ? { ...r, shift } : r))
    );
  };

  const handleNotesChange = (staffId: number, notes: string) => {
    setLocalRecords((prev) =>
      prev.map((r) => (r.staff_id === staffId ? { ...r, notes } : r))
    );
  };

  const markAll = (status: AttendanceStatus) => {
    setLocalRecords((prev) => prev.map((r) => ({ ...r, attendance_status: status })));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = localRecords.map((r) => ({
        staff_id: r.staff_id,
        status: r.attendance_status || 'Present',
        overtime_hours: Number(r.overtime_hours) || 0,
        shift: r.shift || 'Day Shift',
        notes: r.notes || '',
      }));
      await onSaveAttendance(date, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = localRecords.filter((r) => r.attendance_status === 'Present').length;
  const halfDayCount = localRecords.filter((r) => r.attendance_status === 'Half Day').length;
  const absentCount = localRecords.filter((r) => r.attendance_status === 'Absent').length;
  const overtimeCount = localRecords.filter((r) => Number(r.overtime_hours) > 0).length;
  const totalStaff = localRecords.length;
  const attendanceRate = totalStaff > 0 ? Math.round(((presentCount + halfDayCount * 0.5) / totalStaff) * 100) : 0;

  const changeDateByDays = (days: number) => {
    const current = new Date(date);
    current.setDate(current.getDate() + days);
    onDateChange(current.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Daily Attendance & Shift Register
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              {totalStaff} Staff
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mark worker presence, overtime hours, and shifts for accurate payroll calculation.
          </p>
        </div>

        {/* Date Selector & Save Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl border border-slate-300/80 p-1">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 px-1.5 py-1 outline-none cursor-pointer"
            />
            <button
              onClick={() => changeDateByDays(1)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800">Present</span>
            <div className="text-xl font-extrabold text-emerald-900">{presentCount}</div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
            {attendanceRate}%
          </span>
        </div>

        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-800">Half Day</span>
            <div className="text-xl font-extrabold text-amber-900">{halfDayCount}</div>
          </div>
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>

        <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-800">Absent</span>
            <div className="text-xl font-extrabold text-rose-900">{absentCount}</div>
          </div>
          <XCircle className="w-4 h-4 text-rose-600" />
        </div>

        <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-800">Overtime</span>
            <div className="text-xl font-extrabold text-indigo-900">{overtimeCount}</div>
          </div>
          <Clock className="w-4 h-4 text-indigo-600" />
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-white border border-slate-200 rounded-xl p-2 flex flex-col justify-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 text-center">Quick Fill</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => markAll('Present')}
              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded cursor-pointer transition-colors"
            >
              All Present
            </button>
            <button
              onClick={() => markAll('Absent')}
              className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold rounded cursor-pointer transition-colors"
            >
              All Absent
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE VIEW: Cards for Small Screens */}
      <div className="grid grid-cols-1 gap-3.5 md:hidden">
        {localRecords.map((r) => {
          return (
            <div key={r.staff_id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              
              {/* Worker Info */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">{r.name}</div>
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mt-0.5">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded font-bold text-slate-700">
                      {r.staff_code}
                    </span>
                    <span>•</span>
                    <span>{r.role}</span>
                  </div>
                </div>
              </div>

              {/* Status Select Buttons */}
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Status</span>
                <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {[
                    { id: 'Present', label: 'Present', color: 'bg-emerald-600 text-white' },
                    { id: 'Half Day', label: 'Half Day', color: 'bg-amber-500 text-white' },
                    { id: 'Absent', label: 'Absent', color: 'bg-rose-600 text-white' },
                    { id: 'Paid Leave', label: 'Leave', color: 'bg-sky-600 text-white' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => handleStatusChange(r.staff_id, btn.id as any)}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                        r.attendance_status === btn.id
                          ? `${btn.color} shadow-xs`
                          : 'text-slate-600 hover:bg-white/60'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overtime & Shift Inputs */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Overtime (Hrs)</label>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOvertimeChange(r.staff_id, (Number(r.overtime_hours) || 0) - 0.5)}
                      className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={r.overtime_hours}
                      onChange={(e) => handleOvertimeChange(r.staff_id, Number(e.target.value))}
                      className="w-full text-center py-1 text-xs font-bold border border-slate-300 rounded-lg outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleOvertimeChange(r.staff_id, (Number(r.overtime_hours) || 0) + 0.5)}
                      className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Shift</label>
                  <select
                    value={r.shift || 'Day Shift'}
                    onChange={(e) => handleShiftChange(r.staff_id, e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Day Shift">Day Shift</option>
                    <option value="Night Shift">Night Shift</option>
                    <option value="General Shift">General Shift</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <input
                  type="text"
                  placeholder="Notes / Remarks..."
                  value={r.notes || ''}
                  onChange={(e) => handleNotesChange(r.staff_id, e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW: Full Attendance Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Staff Worker</th>
                <th className="py-3.5 px-4 text-center">Attendance Status</th>
                <th className="py-3.5 px-4">Overtime (Hrs)</th>
                <th className="py-3.5 px-4">Shift</th>
                <th className="py-3.5 px-4">Notes / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localRecords.map((r) => (
                <tr key={r.staff_id} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="flex items-center space-x-1.5 mt-0.5 text-[10px] text-slate-500">
                          <span className="font-mono bg-slate-100 px-1 py-0.2 rounded font-semibold text-slate-700">
                            {r.staff_code}
                          </span>
                          <span>•</span>
                          <span>{r.role}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-1 bg-slate-100 p-1 rounded-xl w-max mx-auto border border-slate-200">
                      {[
                        { id: 'Present', label: 'Present', color: 'bg-emerald-600 text-white' },
                        { id: 'Half Day', label: 'Half Day', color: 'bg-amber-500 text-white' },
                        { id: 'Absent', label: 'Absent', color: 'bg-rose-600 text-white' },
                        { id: 'Paid Leave', label: 'Leave', color: 'bg-sky-600 text-white' },
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => handleStatusChange(r.staff_id, btn.id as any)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            r.attendance_status === btn.id
                              ? `${btn.color} shadow-xs`
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        min="0"
                        max="12"
                        step="0.5"
                        value={r.overtime_hours}
                        onChange={(e) => handleOvertimeChange(r.staff_id, Number(e.target.value))}
                        className="w-16 px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-center"
                      />
                      <span className="text-[11px] text-slate-500">hrs</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={r.shift || 'Day Shift'}
                      onChange={(e) => handleShiftChange(r.staff_id, e.target.value)}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="Day Shift">Day Shift</option>
                      <option value="Night Shift">Night Shift</option>
                      <option value="General Shift">General Shift</option>
                    </select>
                  </td>

                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="Notes / Remarks..."
                      value={r.notes || ''}
                      onChange={(e) => handleNotesChange(r.staff_id, e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating / Sticky Mobile Save Button */}
      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-xl shadow-indigo-300/40 flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Daily Attendance'}</span>
        </button>
      </div>
    </div>
  );
};
