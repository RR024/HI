import React, { useState } from 'react';
import {
  Calculator,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  Edit2,
  Trash2,
  DollarSign,
  ArrowUpRight,
  CreditCard,
  Building,
  User,
} from 'lucide-react';
import { DailyWage, Staff, JobType } from '../types';
import * as XLSX from 'xlsx';

interface DailyWagesViewProps {
  wages: DailyWage[];
  staffList: Staff[];
  jobTypes: JobType[];
  onOpenWageModal: (wage?: DailyWage) => void;
  onUpdateStatus: (id: number, status: string, mode?: string) => Promise<void>;
  onDeleteWage: (id: number) => Promise<void>;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const DailyWagesView: React.FC<DailyWagesViewProps> = ({
  wages,
  staffList,
  jobTypes,
  onOpenWageModal,
  onUpdateStatus,
  onDeleteWage,
  selectedDate,
  onDateChange,
}) => {
  const [staffFilter, setStaffFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter wages
  const filteredWages = wages.filter((w) => {
    const matchesSearch =
      (w.staff_name && w.staff_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.staff_code && w.staff_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.work_description && w.work_description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStaff = staffFilter === 'all' || String(w.staff_id) === staffFilter;
    const matchesStatus = statusFilter === 'all' || w.payment_status === statusFilter;
    const matchesJob = jobFilter === 'all' || String(w.job_type_id) === jobFilter;

    return matchesSearch && matchesStaff && matchesStatus && matchesJob;
  });

  // Calculate Aggregates
  const totalAmount = filteredWages.reduce((acc, curr) => acc + curr.net_wage, 0);
  const paidAmount = filteredWages.filter((w) => w.payment_status === 'Paid').reduce((acc, curr) => acc + curr.net_wage, 0);
  const pendingAmount = filteredWages.filter((w) => w.payment_status === 'Pending').reduce((acc, curr) => acc + curr.net_wage, 0);
  const totalUnits = filteredWages.reduce((acc, curr) => acc + curr.units_completed, 0);

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredWages.map((w) => ({
      'Date': w.wage_date,
      'Staff Code': w.staff_code,
      'Worker Name': w.staff_name,
      'Work Description': w.work_description,
      'Job Type': w.job_title || 'Custom Task',
      'Units Completed': `${w.units_completed} ${w.unit_name || ''}`,
      'Rate Applied': w.rate_snapshot,
      'Base Wage (₹)': w.base_amount,
      'Overtime (₹)': w.overtime_amount,
      'Bonus (₹)': w.bonus_amount,
      'Deductions (₹)': w.deductions,
      'Net Wage (₹)': w.net_wage,
      'Payment Status': w.payment_status,
      'Payment Mode': w.payment_mode,
      'Bank Name': w.bank_name || '',
      'Account No': w.account_num || '',
      'IFSC Code': w.ifsc_code || '',
      'Notes': w.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Wages Register');
    XLSX.writeFile(wb, `Daily_Wages_${selectedDate || 'Report'}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Daily Wages & Work Tracker
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              {filteredWages.length} Entries
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Piece-rate work logs, volume calculations, overtime additions, and disbursement status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl border border-slate-300/80 px-2 py-1">
            <span className="text-[11px] text-slate-500 font-medium mr-1">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            />
            {selectedDate && (
              <button
                onClick={() => onDateChange('')}
                className="text-[10px] text-indigo-600 font-bold ml-1.5 hover:underline cursor-pointer"
              >
                All
              </button>
            )}
          </div>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center px-3 py-2 border border-slate-300 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
            <span>Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-2 border border-slate-300 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-slate-500" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={() => onOpenWageModal()}
            className="inline-flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Record Wage</span>
          </button>
        </div>
      </div>

      {/* Aggregate Financial Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 no-print">
        {/* Total Wages */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-500 tracking-wider">Total Daily Wages</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1">
            ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{filteredWages.length} tasks</div>
        </div>

        {/* Paid Wages */}
        <div className="bg-emerald-50/80 rounded-2xl border border-emerald-200 p-3.5 sm:p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-bold text-emerald-800 tracking-wider">Paid</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-0.5 sm:mt-1">
            ₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">Disbursed</div>
        </div>

        {/* Pending Payout */}
        <div className="bg-amber-50/80 rounded-2xl border border-amber-200 p-3.5 sm:p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] uppercase font-bold text-amber-800 tracking-wider">Pending</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 mt-0.5 sm:mt-1">
            ₹{pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5 font-medium">Unpaid</div>
        </div>

        {/* Total Volume */}
        <div className="bg-indigo-50/80 rounded-2xl border border-indigo-200 p-3.5 sm:p-4.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] uppercase font-bold text-indigo-800 tracking-wider">Total Volume</span>
          <div className="text-xl sm:text-2xl font-black text-indigo-950 mt-0.5 sm:mt-1">
            {totalUnits.toLocaleString('en-IN')} <span className="text-xs font-semibold text-indigo-700">units</span>
          </div>
          <div className="text-[10px] text-indigo-700 mt-0.5 font-medium">Production</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search worker or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Filter by Worker */}
          <div>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">Worker: All ({staffList.length})</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.staff_code})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Job Type */}
          <div>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">Job Scheme: All ({jobTypes.length})</option>
              {jobTypes.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Payment Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">Payment Status: All</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Wages View */}
      {filteredWages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <Calculator className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No wage logs found</h3>
          <p className="text-xs text-slate-500 mt-1">Tap "Record Wage" to log daily worker output.</p>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Cards for Small Screens */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredWages.map((w) => {
              const isPaid = w.payment_status === 'Paid';
              return (
                <div key={w.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{w.staff_name}</div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono bg-slate-100 font-bold px-1.5 py-0.2 rounded text-slate-700">
                          {w.staff_code}
                        </span>
                        <span>•</span>
                        <span>{w.wage_date}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Net Wage</span>
                      <div className="text-lg font-black text-slate-900">
                        ₹{w.net_wage.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Task & Rate Description */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 space-y-1">
                    <p className="text-xs font-semibold text-slate-800">{w.work_description}</p>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-700">{w.units_completed} {w.unit_name || 'units'}</span>
                      <span className="font-mono text-slate-600 font-medium">{w.rate_snapshot}</span>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                    <span>Base: ₹{w.base_amount.toFixed(0)}</span>
                    {w.overtime_amount > 0 && <span className="text-emerald-700 font-semibold">+₹{w.overtime_amount} OT</span>}
                    {w.bonus_amount > 0 && <span className="text-indigo-700 font-semibold">+₹{w.bonus_amount} Bonus</span>}
                    {w.deductions > 0 && <span className="text-rose-700 font-semibold">-₹{w.deductions} Ded</span>}
                    <span className="text-slate-500">({w.payment_mode || 'Cash'})</span>
                  </div>

                  {/* Mobile Quick Pay & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <button
                      onClick={() => onUpdateStatus(w.id, isPaid ? 'Pending' : 'Paid', w.payment_mode)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending (Tap to Pay)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onOpenWageModal(w)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete wage record for ${w.staff_name} on ${w.wage_date}?`)) {
                          onDeleteWage(w.id);
                        }
                      }}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW: Full Data Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden printable-area">
            
            <div className="hidden print-only p-6 border-b border-slate-300">
              <h1 className="text-xl font-bold">Daily Wage Disbursement & Production Sheet</h1>
              <p className="text-xs text-slate-600">Date: {selectedDate || 'All Dates'} | Apex Agro & Industrial Works Pvt Ltd</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Date & Worker</th>
                    <th className="py-3.5 px-4">Work Description & Scheme</th>
                    <th className="py-3.5 px-4">Output / Units</th>
                    <th className="py-3.5 px-4">Rate Snapshot</th>
                    <th className="py-3.5 px-4">Base + OT - Ded</th>
                    <th className="py-3.5 px-4 font-black">Net Wage</th>
                    <th className="py-3.5 px-4">Bank / Pay Mode</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWages.map((w) => {
                    const isPaid = w.payment_status === 'Paid';

                    return (
                      <tr key={w.id} className="hover:bg-indigo-50/20 transition-colors">
                        
                        {/* Date & Worker */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{w.staff_name}</div>
                          <div className="flex items-center space-x-1.5 mt-0.5 text-[10px] text-slate-500">
                            <span className="font-mono bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-semibold">
                              {w.staff_code}
                            </span>
                            <span>•</span>
                            <span>{w.wage_date}</span>
                          </div>
                        </td>

                        {/* Work Description & Scheme */}
                        <td className="py-3 px-4 max-w-[220px]">
                          <div className="font-semibold text-slate-800 line-clamp-1">{w.work_description}</div>
                          {w.job_title && (
                            <div className="text-[10px] text-indigo-700 font-medium truncate mt-0.5">
                              {w.job_title}
                            </div>
                          )}
                        </td>

                        {/* Output / Units */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {w.units_completed} <span className="text-xs font-normal text-slate-500">{w.unit_name || 'units'}</span>
                          </div>
                        </td>

                        {/* Rate Snapshot */}
                        <td className="py-3 px-4">
                          <div className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono text-slate-800 font-semibold inline-block">
                            {w.rate_snapshot || `₹${w.base_amount}`}
                          </div>
                        </td>

                        {/* Breakdown */}
                        <td className="py-3 px-4 text-[11px]">
                          <div className="text-slate-700">
                            ₹{w.base_amount.toFixed(0)}
                            {w.overtime_amount > 0 && <span className="text-emerald-700 font-semibold"> + ₹{w.overtime_amount} OT</span>}
                            {w.bonus_amount > 0 && <span className="text-indigo-700 font-semibold"> + ₹{w.bonus_amount} Bonus</span>}
                            {w.deductions > 0 && <span className="text-rose-700 font-semibold"> - ₹{w.deductions} Ded</span>}
                          </div>
                        </td>

                        {/* Net Wage */}
                        <td className="py-3 px-4">
                          <div className="text-base font-black text-slate-900">
                            ₹{w.net_wage.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>

                        {/* Bank / Pay Mode */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 text-[11px]">{w.payment_mode || 'Cash'}</div>
                          {w.bank_name && (
                            <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                              {w.bank_name}
                            </div>
                          )}
                        </td>

                        {/* Status with 1-click Quick Pay Toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onUpdateStatus(w.id, isPaid ? 'Pending' : 'Paid', w.payment_mode)}
                            title="Click to toggle Paid/Pending"
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Paid
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Pending (Click to Pay)
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right no-print">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => onOpenWageModal(w)}
                              title="Edit Wage Entry"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete wage record for ${w.staff_name} on ${w.wage_date}?`)) {
                                  onDeleteWage(w.id);
                                }
                              }}
                              title="Delete Record"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
