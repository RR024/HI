import React from 'react';
import {
  X,
  Printer,
  User,
  Heart,
  Users2,
  Building,
  CreditCard,
  ShieldCheck,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Staff, DailyWage, Advance } from '../types';

interface StaffDetailModalProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
  recentWages?: DailyWage[];
  onEdit: (staff: Staff) => void;
}

export const StaffDetailModal: React.FC<StaffDetailModalProps> = ({
  staff,
  isOpen,
  onClose,
  recentWages = [],
  onEdit,
}) => {
  if (!isOpen || !staff) return null;

  const isMarried = staff.marital_status === 'Married';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono bg-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-md font-semibold border border-indigo-500/40">
              {staff.staff_code}
            </span>
            <h2 className="text-base font-bold text-white">Staff Member Profile & KYC Record</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Content / Printable Bio-Data Sheet */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 printable-area">
          
          {/* Top Identity Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/20">
                  {staff.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-extrabold tracking-tight">{staff.name}</h1>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      staff.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-500/20 text-slate-300'
                    }`}>
                      {staff.status}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-0.5 flex items-center gap-2">
                    <span className="font-semibold text-white">{staff.role}</span>
                    <span>•</span>
                    <span>DOJ: {staff.doj}</span>
                    <span>•</span>
                    <span className="bg-indigo-700/50 px-2 py-0.5 rounded text-[11px] font-mono">{staff.wage_type}</span>
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-right sm:text-left">
                <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Aadhaar UID</p>
                <p className="text-sm font-mono font-bold tracking-wider text-amber-300">{staff.aadhaar_num}</p>
                <p className="text-[10px] text-indigo-200 mt-1">Phone: <span className="text-white font-medium">+91 {staff.phone}</span></p>
              </div>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Personal & KYC */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <User className="w-3.5 h-3.5 text-indigo-600" /> Personal Identity
              </h3>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Gender & Age:</dt>
                  <dd className="font-semibold text-slate-800">{staff.gender}, {staff.age} Years</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Date of Birth:</dt>
                  <dd className="font-medium text-slate-800">{staff.dob}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Marital Status:</dt>
                  <dd className="font-semibold text-indigo-700">{staff.marital_status}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 mb-0.5">Address:</dt>
                  <dd className="font-medium text-slate-800 bg-white p-2 rounded border border-slate-200 text-[11px] leading-relaxed">
                    {staff.address}
                  </dd>
                </div>
              </dl>
            </div>

            {/* 2. Conditional Family Details */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                {isMarried ? <Heart className="w-3.5 h-3.5 text-rose-500" /> : <Users2 className="w-3.5 h-3.5 text-sky-600" />}
                {isMarried ? 'Spouse Information' : 'Parents Information'}
              </h3>
              
              {isMarried ? (
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Spouse Name:</dt>
                    <dd className="font-semibold text-slate-800">{staff.spouse_name || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Spouse Contact:</dt>
                    <dd className="font-medium text-slate-800">{staff.spouse_phone ? `+91 ${staff.spouse_phone}` : 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Occupation:</dt>
                    <dd className="font-medium text-slate-800">{staff.spouse_occupation || 'N/A'}</dd>
                  </div>
                </dl>
              ) : (
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Father's Name:</dt>
                    <dd className="font-semibold text-slate-800">{staff.father_name || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Mother's Name:</dt>
                    <dd className="font-semibold text-slate-800">{staff.mother_name || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Parent Phone:</dt>
                    <dd className="font-medium text-slate-800">{staff.parent_phone ? `+91 ${staff.parent_phone}` : 'N/A'}</dd>
                  </div>
                  {staff.parent_address && (
                    <div>
                      <dt className="text-slate-500 mb-0.5">Parent / Native Address:</dt>
                      <dd className="font-medium text-slate-800 bg-white p-2 rounded border border-slate-200 text-[11px]">
                        {staff.parent_address}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>

            {/* 3. Bank Account Information */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Bank Account Details
              </h3>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Bank Name:</dt>
                  <dd className="font-semibold text-slate-800">{staff.bank_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Account No:</dt>
                  <dd className="font-mono font-bold text-slate-900 bg-slate-200/60 px-1.5 py-0.5 rounded">{staff.account_num}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">IFSC Code:</dt>
                  <dd className="font-mono font-bold text-indigo-700">{staff.ifsc_code}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Branch Name:</dt>
                  <dd className="font-medium text-slate-800">{staff.branch_name}</dd>
                </div>
              </dl>
            </div>

            {/* 4. Statutory & Wage Rules */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ESI, PF & Wages
              </h3>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">ESI Insurance No:</dt>
                  <dd className="font-mono font-medium text-slate-800">{staff.esi_num || 'Not Enrolled'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">PF Number:</dt>
                  <dd className="font-mono font-medium text-slate-800">{staff.pf_num || 'Not Enrolled'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Base Shift Rate:</dt>
                  <dd className="font-bold text-emerald-700">₹{staff.daily_rate} / Day</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Registered On:</dt>
                  <dd className="text-slate-600">{new Date(staff.created_at).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Recent Daily Wage Entries for this Worker */}
          {recentWages.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Recent Wage Logs
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Work Description</th>
                      <th className="p-2.5">Volume</th>
                      <th className="p-2.5">Net Wage</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentWages.slice(0, 5).map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-slate-700">{w.wage_date}</td>
                        <td className="p-2.5 text-slate-800 max-w-[200px] truncate">{w.work_description}</td>
                        <td className="p-2.5 text-slate-600">{w.units_completed} {w.unit_name || 'units'}</td>
                        <td className="p-2.5 font-bold text-slate-900">₹{w.net_wage}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            w.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {w.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 no-print">
          <button
            onClick={() => {
              onClose();
              onEdit(staff);
            }}
            className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
