import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Calendar,
  User,
  Briefcase,
  DollarSign,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { DailyWage, Staff, JobType, PaymentStatus, PaymentMode } from '../types';

interface WageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (wageData: Partial<DailyWage>) => Promise<void>;
  initialData?: DailyWage | null;
  staffList: Staff[];
  jobTypes: JobType[];
}

export const WageModal: React.FC<WageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  staffList,
  jobTypes,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [wageDate, setWageDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffId, setStaffId] = useState<number>(staffList.length > 0 ? staffList[0].id : 0);
  const [jobTypeId, setJobTypeId] = useState<number | null>(jobTypes.length > 0 ? jobTypes[0].id : null);
  const [workDescription, setWorkDescription] = useState('');
  const [unitsCompleted, setUnitsCompleted] = useState<number>(100);
  const [customBaseAmount, setCustomBaseAmount] = useState<number>(400);
  const [overtimeAmount, setOvertimeAmount] = useState<number>(0);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setWageDate(initialData.wage_date);
      setStaffId(initialData.staff_id);
      setJobTypeId(initialData.job_type_id || null);
      setWorkDescription(initialData.work_description);
      setUnitsCompleted(initialData.units_completed);
      setCustomBaseAmount(initialData.base_amount);
      setOvertimeAmount(initialData.overtime_amount);
      setBonusAmount(initialData.bonus_amount);
      setDeductions(initialData.deductions);
      setPaymentStatus(initialData.payment_status);
      setPaymentMode(initialData.payment_mode || 'Cash');
      setNotes(initialData.notes || '');
    } else {
      setWageDate(new Date().toISOString().split('T')[0]);
      if (staffList.length > 0) setStaffId(staffList[0].id);
      if (jobTypes.length > 0) {
        setJobTypeId(jobTypes[0].id);
        setWorkDescription(jobTypes[0].description || jobTypes[0].title);
        setUnitsCompleted(jobTypes[0].unit_quantity);
      }
      setOvertimeAmount(0);
      setBonusAmount(0);
      setDeductions(0);
      setPaymentStatus('Pending');
      setPaymentMode('Cash');
      setNotes('');
    }
    setErrorMessage('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const selectedStaff = staffList.find((s) => s.id === staffId);
  const selectedJob = jobTypes.find((j) => j.id === jobTypeId);

  // Auto update description if switching job type in new record mode
  const handleJobChange = (newJobId: number | null) => {
    setJobTypeId(newJobId);
    if (!initialData && newJobId) {
      const job = jobTypes.find((j) => j.id === newJobId);
      if (job) {
        setWorkDescription(job.description || job.title);
        setUnitsCompleted(job.unit_quantity);
      }
    }
  };

  // Calculate Base Wage
  let calculatedBase = 0;
  let formulaText = '';
  if (selectedJob) {
    const ratePerSingle = selectedJob.rate_amount / selectedJob.unit_quantity;
    calculatedBase = unitsCompleted * ratePerSingle;
    formulaText = `${unitsCompleted} ${selectedJob.unit_name} × (₹${selectedJob.rate_amount} ÷ ${selectedJob.unit_quantity} ${selectedJob.unit_name}) = ₹${calculatedBase.toFixed(2)}`;
  } else {
    calculatedBase = customBaseAmount;
    formulaText = `Fixed daily base rate: ₹${calculatedBase.toFixed(2)}`;
  }

  const netWage = Math.max(0, calculatedBase + Number(overtimeAmount || 0) + Number(bonusAmount || 0) - Number(deductions || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!staffId) {
      setErrorMessage('Please select a staff worker');
      return;
    }
    if (!workDescription.trim()) {
      setErrorMessage('Please provide work description');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        wage_date: wageDate,
        staff_id: staffId,
        job_type_id: jobTypeId,
        work_description: workDescription.trim(),
        units_completed: Number(unitsCompleted) || 0,
        base_amount: calculatedBase,
        overtime_amount: Number(overtimeAmount) || 0,
        bonus_amount: Number(bonusAmount) || 0,
        deductions: Number(deductions) || 0,
        net_wage: netWage,
        payment_status: paymentStatus,
        payment_mode: paymentMode,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error recording wage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {initialData ? 'Edit Daily Wage & Work Entry' : 'Record Daily Work & Piece-Rate Wage'}
              </h2>
              <p className="text-xs text-indigo-200/80">
                Log completed units, automatic piece-rate math, overtime, and deductions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={wageDate}
                onChange={(e) => setWageDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
              />
            </div>

            {/* Select Staff */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Worker <span className="text-rose-500">*</span>
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold text-slate-800"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.staff_code}) - {s.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Worker Info Chip */}
          {selectedStaff && (
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-indigo-950">{selectedStaff.name}</span>
                <span className="text-indigo-600 font-mono">({selectedStaff.staff_code})</span>
              </div>
              <div className="text-[11px] text-slate-600">
                Bank: <span className="font-semibold">{selectedStaff.bank_name}</span> | A/C: <span className="font-mono">{selectedStaff.account_num.slice(-4)}</span>
              </div>
            </div>
          )}

          {/* Job Scheme Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Job / Piece-Rate Scheme <span className="text-rose-500">*</span>
            </label>
            <select
              value={jobTypeId || ''}
              onChange={(e) => handleJobChange(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3.5 py-2 text-xs border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50/30 font-semibold text-indigo-950"
            >
              <option value="">-- Custom Fixed Daily Wage --</option>
              {jobTypes.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ➔ (₹{j.rate_amount} per {j.unit_quantity} {j.unit_name})
                </option>
              ))}
            </select>
          </div>

          {/* Units completed & Piece-Rate live math box */}
          {selectedJob ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Units / Quantity Completed ({selectedJob.unit_name})
                </label>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  Rate: ₹{selectedJob.rate_amount} / {selectedJob.unit_quantity} {selectedJob.unit_name}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={unitsCompleted}
                  onChange={(e) => setUnitsCompleted(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-base font-extrabold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                />
                <span className="font-bold text-slate-600 text-sm">{selectedJob.unit_name}</span>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center justify-between">
                <span className="text-emerald-900 font-medium">{formulaText}</span>
                <span className="text-emerald-900 font-extrabold text-sm">
                  ₹{calculatedBase.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Daily Base Wage Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={customBaseAmount}
                onChange={(e) => setCustomBaseAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          {/* Work Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Description & Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Unloaded 250kg bags in Godown 2 and stacked on pallets"
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Overtime, Bonus, Advance Deductions */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <PlusCircle className="w-3 h-3 text-emerald-600" /> Overtime (₹)
              </label>
              <input
                type="number"
                min="0"
                value={overtimeAmount}
                onChange={(e) => setOvertimeAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-bold text-emerald-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <PlusCircle className="w-3 h-3 text-indigo-600" /> Bonus / Tip (₹)
              </label>
              <input
                type="number"
                min="0"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-bold text-indigo-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MinusCircle className="w-3 h-3 text-rose-600" /> Deductions (₹)
              </label>
              <input
                type="number"
                min="0"
                value={deductions}
                onChange={(e) => setDeductions(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-bold text-rose-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          {/* Net Wage Payout Summary Box */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-4 text-white flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Total Net Daily Wage</span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Base ₹{calculatedBase.toFixed(2)} + OT ₹{overtimeAmount} + Bonus ₹{bonusAmount} - Ded ₹{deductions}
              </p>
            </div>
            <div className="text-2xl font-black text-amber-300">
              ₹{netWage.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Payment Status & Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold text-slate-800"
              >
                <option value="Pending">Pending (Unpaid)</option>
                <option value="Paid">Paid (Completed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Transaction Ref</label>
            <input
              type="text"
              placeholder="e.g. Cleared by cash voucher #401 or UPI Ref ID"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Saving...' : initialData ? 'Update Wage' : 'Record & Save Wage'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
