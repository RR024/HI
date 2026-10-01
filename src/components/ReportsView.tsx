import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  User,
  Building,
  CreditCard,
  ShieldCheck,
  DollarSign,
  ChevronRight,
  Receipt,
  FileText,
} from 'lucide-react';
import { DailyWage, Staff, CompanySettings } from '../types';
import * as XLSX from 'xlsx';

interface ReportsViewProps {
  wages: DailyWage[];
  staffList: Staff[];
  settings: CompanySettings | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  wages,
  staffList,
  settings,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'payslip' | 'bank' | 'esi' | 'summary'>('payslip');
  
  // Filter state for payslip
  const [selectedStaffId, setSelectedStaffId] = useState<number>(staffList.length > 0 ? staffList[0].id : 0);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

  // Filter wages for selected staff and month
  const staffMonthWages = wages.filter(
    (w) => w.staff_id === selectedStaffId && w.wage_date.startsWith(selectedMonth)
  );

  const totalBase = staffMonthWages.reduce((acc, curr) => acc + curr.base_amount, 0);
  const totalOvertime = staffMonthWages.reduce((acc, curr) => acc + curr.overtime_amount, 0);
  const totalBonus = staffMonthWages.reduce((acc, curr) => acc + curr.bonus_amount, 0);
  const totalDeductions = staffMonthWages.reduce((acc, curr) => acc + curr.deductions, 0);
  const totalNetWage = staffMonthWages.reduce((acc, curr) => acc + curr.net_wage, 0);
  const totalUnitsHandled = staffMonthWages.reduce((acc, curr) => acc + curr.units_completed, 0);
  const workingDays = new Set(staffMonthWages.map((w) => w.wage_date)).size;

  // Print Slip
  const handlePrint = () => {
    window.print();
  };

  // Bank Advice Export
  const handleExportBankAdvice = () => {
    // Group all wages by worker for selected month
    const staffMap = new Map<number, { staff: Staff; totalWage: number; count: number }>();
    wages
      .filter((w) => w.wage_date.startsWith(selectedMonth))
      .forEach((w) => {
        const s = staffList.find((st) => st.id === w.staff_id);
        if (s) {
          const prev = staffMap.get(s.id) || { staff: s, totalWage: 0, count: 0 };
          prev.totalWage += w.net_wage;
          prev.count += 1;
          staffMap.set(s.id, prev);
        }
      });

    const rows = Array.from(staffMap.values()).map((item, idx) => ({
      'SL No': idx + 1,
      'Staff Code': item.staff.staff_code,
      'Beneficiary Name': item.staff.name,
      'Bank Name': item.staff.bank_name,
      'Account Number': item.staff.account_num,
      'IFSC Code': item.staff.ifsc_code,
      'Branch': item.staff.branch_name,
      'Net Wage Amount (₹)': item.totalWage,
      'Payment Type': 'NEFT/RTGS/IMPS',
      'Narration': `Wage Payout ${selectedMonth}`,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bank Transfer Statement');
    XLSX.writeFile(wb, `Bank_Transfer_Advice_${selectedMonth}.xlsx`);
  };

  // ESI Register Export
  const handleExportEsi = () => {
    const rows = staffList.map((s, idx) => {
      const staffWages = wages.filter((w) => w.staff_id === s.id && w.wage_date.startsWith(selectedMonth));
      const gross = staffWages.reduce((acc, curr) => acc + curr.net_wage, 0);
      const employeeEsi = Math.round(gross * 0.0075); // 0.75% standard employee ESI
      const employerEsi = Math.round(gross * 0.0325); // 3.25% standard employer ESI

      return {
        'SL No': idx + 1,
        'Staff Code': s.staff_code,
        'Employee Name': s.name,
        'ESI IP Number': s.esi_num || 'N/A',
        'Aadhaar Number': s.aadhaar_num,
        'Days Worked': new Set(staffWages.map((w) => w.wage_date)).size,
        'Gross Wages (₹)': gross,
        'Employee ESI (0.75%)': employeeEsi,
        'Employer ESI (3.25%)': employerEsi,
        'Total ESI Remittance (₹)': employeeEsi + employerEsi,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ESI Statement');
    XLSX.writeFile(wb, `ESI_Contribution_Report_${selectedMonth}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Navigation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Payroll Reports, Payslips & Statutory Statements
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate formal worker payslips, bank NEFT transfer statements, and ESI contribution records.
          </p>
        </div>

        {/* Report Sub-Tabs */}
        <div className="flex items-center space-x-2">
          {[
            { id: 'payslip', label: 'Worker Wage Slip', icon: Receipt },
            { id: 'bank', label: 'Bank Transfer Advice', icon: CreditCard },
            { id: 'esi', label: 'ESI Statement', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeReportTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. WORKER PAYSLIP GENERATOR */}
      {activeReportTab === 'payslip' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Select Worker</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-300 rounded-lg outline-none bg-white"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.staff_code}) - {s.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Select Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-300 rounded-lg outline-none bg-white"
                />
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Official Payslip
            </button>
          </div>

          {/* Printable Formal Payslip Template */}
          <div className="bg-white rounded-2xl border border-slate-300 p-8 shadow-sm max-w-4xl mx-auto printable-area">
            
            {/* Payslip Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  {settings?.company_name || 'Apex Agro & Industrial Works Pvt Ltd'}
                </h1>
                <p className="text-xs text-slate-600 mt-0.5 max-w-md">
                  {settings?.address || 'Plot 42, Industrial Growth Center, Phase 2, Coimbatore, Tamil Nadu - 641001'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  GSTIN: <span className="font-mono font-semibold text-slate-700">{settings?.gstin || '33AAAAA0000A1Z5'}</span> | ESI Reg: <span className="font-mono font-semibold text-slate-700">{settings?.esi_code || 'ESI-54000987650001001'}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="bg-slate-900 text-white px-3 py-1 rounded-md text-xs font-black tracking-wider uppercase">
                  WAGE SLIP / PAYSLIP
                </span>
                <p className="text-xs font-bold text-slate-800 mt-2">
                  Month: {new Date(`${selectedMonth}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
                <p className="text-[10px] text-slate-500">Generated: {new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {/* Worker Details Grid */}
            {selectedStaff && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-200 text-xs bg-slate-50/60 p-4 rounded-xl mt-4">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Worker Name</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedStaff.name}</div>
                  <div className="text-[10px] text-indigo-700 font-mono font-bold">{selectedStaff.staff_code}</div>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Role & Wage Scheme</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedStaff.role}</div>
                  <div className="text-[10px] text-slate-600">{selectedStaff.wage_type}</div>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Aadhaar & ESI</span>
                  <div className="font-mono font-semibold text-slate-800 mt-0.5">{selectedStaff.aadhaar_num}</div>
                  <div className="font-mono text-[10px] text-emerald-700">{selectedStaff.esi_num || 'ESI: N/A'}</div>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Bank Account</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedStaff.bank_name}</div>
                  <div className="font-mono text-[10px] text-slate-700">A/C: {selectedStaff.account_num}</div>
                  <div className="font-mono text-[9px] text-slate-500">IFSC: {selectedStaff.ifsc_code}</div>
                </div>
              </div>
            )}

            {/* Daily Logs Table */}
            <div className="mt-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Itemized Daily Piece-Rate & Work Logs ({staffMonthWages.length} Entries)
              </h3>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Work Description</th>
                      <th className="p-2.5">Volume</th>
                      <th className="p-2.5">Rate Applied</th>
                      <th className="p-2.5">Base (₹)</th>
                      <th className="p-2.5">OT / Bonus</th>
                      <th className="p-2.5">Ded. (₹)</th>
                      <th className="p-2.5 font-black text-right">Net (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffMonthWages.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-400 italic">
                          No wage records logged for this worker in {selectedMonth}.
                        </td>
                      </tr>
                    ) : (
                      staffMonthWages.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-800">{w.wage_date}</td>
                          <td className="p-2.5 text-slate-700">{w.work_description}</td>
                          <td className="p-2.5 font-semibold text-slate-800">
                            {w.units_completed} {w.unit_name || ''}
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-600">{w.rate_snapshot}</td>
                          <td className="p-2.5 font-medium">₹{w.base_amount.toFixed(0)}</td>
                          <td className="p-2.5 text-emerald-700 font-medium">
                            +₹{w.overtime_amount + w.bonus_amount}
                          </td>
                          <td className="p-2.5 text-rose-700 font-medium">
                            {w.deductions > 0 ? `-₹${w.deductions}` : '₹0'}
                          </td>
                          <td className="p-2.5 font-black text-slate-900 text-right">
                            ₹{w.net_wage.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & Total */}
            <div className="mt-6 grid grid-cols-2 gap-6 items-end">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Days Worked:</span>
                  <span className="font-bold text-slate-800">{workingDays} Days</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Output Volume Handled:</span>
                  <span className="font-bold text-slate-800">{totalUnitsHandled} units</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gross Base Wage:</span>
                  <span className="font-medium text-slate-800">₹{totalBase.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Overtime & Bonus:</span>
                  <span>+₹{(totalOvertime + totalBonus).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-medium">
                  <span>Advance / Loan Recoveries:</span>
                  <span>-₹{totalDeductions.toFixed(2)}</span>
                </div>
              </div>

              {/* Net Payout Banner */}
              <div className="bg-slate-900 text-white p-5 rounded-xl text-right">
                <span className="text-xs uppercase font-bold text-indigo-300 tracking-wider">
                  Total Net Payable Amount
                </span>
                <div className="text-3xl font-black text-amber-300 mt-1">
                  ₹{totalNetWage.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Transferred / Disbursed to {selectedStaff?.bank_name}
                </p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-b border-slate-400 w-48 mx-auto pb-6"></div>
                <p className="font-bold text-slate-800 mt-2">Worker / Employee Signature</p>
                <p className="text-[10px] text-slate-500">I confirm receipt of full daily wages</p>
              </div>
              <div>
                <div className="border-b border-slate-400 w-48 mx-auto pb-6"></div>
                <p className="font-bold text-slate-800 mt-2">Authorized Signatory / Manager</p>
                <p className="text-[10px] text-slate-500">For {settings?.company_name}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BANK TRANSFER ADVICE */}
      {activeReportTab === 'bank' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">Bank NEFT / Direct Wage Credit Advice</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ready-to-upload payroll statement with beneficiary account numbers, IFSC codes, and net wage totals.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-300 rounded-lg outline-none bg-white"
              />
              <button
                onClick={handleExportBankAdvice}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download Bank Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Staff Code</th>
                  <th className="p-3">Worker Name</th>
                  <th className="p-3">Bank Name</th>
                  <th className="p-3">Account Number</th>
                  <th className="p-3">IFSC Code</th>
                  <th className="p-3 font-bold text-right">Net Payable (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((s) => {
                  const staffWages = wages.filter((w) => w.staff_id === s.id && w.wage_date.startsWith(selectedMonth));
                  const net = staffWages.reduce((acc, curr) => acc + curr.net_wage, 0);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-700">{s.staff_code}</td>
                      <td className="p-3 font-bold text-slate-900">{s.name}</td>
                      <td className="p-3 text-slate-800">{s.bank_name}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{s.account_num}</td>
                      <td className="p-3 font-mono font-semibold text-slate-700">{s.ifsc_code}</td>
                      <td className="p-3 font-black text-slate-900 text-right">
                        ₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ESI STATEMENT */}
      {activeReportTab === 'esi' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly ESI Compliance Register</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory Employee State Insurance (ESI) monthly contribution breakdown for workers.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-300 rounded-lg outline-none bg-white"
              />
              <button
                onClick={handleExportEsi}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download ESI Register (Excel)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Staff Code</th>
                  <th className="p-3">Worker Name</th>
                  <th className="p-3">ESI IP Number</th>
                  <th className="p-3">Aadhaar</th>
                  <th className="p-3">Gross Wages (₹)</th>
                  <th className="p-3">Employee ESI (0.75%)</th>
                  <th className="p-3">Employer ESI (3.25%)</th>
                  <th className="p-3 text-right">Total Remittance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((s) => {
                  const staffWages = wages.filter((w) => w.staff_id === s.id && w.wage_date.startsWith(selectedMonth));
                  const gross = staffWages.reduce((acc, curr) => acc + curr.net_wage, 0);
                  const employeeEsi = Math.round(gross * 0.0075);
                  const employerEsi = Math.round(gross * 0.0325);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-700">{s.staff_code}</td>
                      <td className="p-3 font-bold text-slate-900">{s.name}</td>
                      <td className="p-3 font-mono text-emerald-700">{s.esi_num || 'N/A'}</td>
                      <td className="p-3 font-mono text-slate-600">{s.aadhaar_num}</td>
                      <td className="p-3 font-semibold text-slate-900">₹{gross.toFixed(2)}</td>
                      <td className="p-3 text-slate-700">₹{employeeEsi}</td>
                      <td className="p-3 text-slate-700">₹{employerEsi}</td>
                      <td className="p-3 font-black text-slate-900 text-right">₹{employeeEsi + employerEsi}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
