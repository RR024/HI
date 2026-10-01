import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Heart,
  Users2,
  Building,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Staff, MaritalStatus, Gender, WageType, StaffStatus } from '../types';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staffData: Partial<Staff>) => Promise<void>;
  initialData?: Staff | null;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [activeFormTab, setActiveFormTab] = useState<'personal' | 'family' | 'employment' | 'bank'>('personal');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Staff>>({
    name: '',
    gender: 'Male' as Gender,
    age: 25,
    dob: '1999-01-01',
    address: '',
    phone: '',
    aadhaar_num: '',
    marital_status: 'Single' as MaritalStatus,
    
    // Spouse (if Married)
    spouse_name: '',
    spouse_phone: '',
    spouse_occupation: '',
    
    // Parents (if Single/Other)
    father_name: '',
    mother_name: '',
    parent_phone: '',
    parent_address: '',
    
    // Employment
    doj: new Date().toISOString().split('T')[0],
    role: 'General Worker',
    wage_type: 'Piece Rate' as WageType,
    daily_rate: 400,
    
    // Bank
    bank_name: '',
    account_num: '',
    ifsc_code: '',
    branch_name: '',
    
    // Regulatory
    esi_num: '',
    pf_num: '',
    status: 'Active' as StaffStatus,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Ensure values are not null
        spouse_name: initialData.spouse_name || '',
        spouse_phone: initialData.spouse_phone || '',
        spouse_occupation: initialData.spouse_occupation || '',
        father_name: initialData.father_name || '',
        mother_name: initialData.mother_name || '',
        parent_phone: initialData.parent_phone || '',
        parent_address: initialData.parent_address || '',
        esi_num: initialData.esi_num || '',
        pf_num: initialData.pf_num || '',
      });
    } else {
      setFormData({
        name: '',
        gender: 'Male',
        age: 25,
        dob: '1999-01-01',
        address: '',
        phone: '',
        aadhaar_num: '',
        marital_status: 'Single',
        spouse_name: '',
        spouse_phone: '',
        spouse_occupation: '',
        father_name: '',
        mother_name: '',
        parent_phone: '',
        parent_address: '',
        doj: new Date().toISOString().split('T')[0],
        role: 'General Worker',
        wage_type: 'Piece Rate',
        daily_rate: 400,
        bank_name: '',
        account_num: '',
        ifsc_code: '',
        branch_name: '',
        esi_num: '',
        pf_num: '',
        status: 'Active',
      });
    }
    setErrorMessage('');
    setActiveFormTab('personal');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Auto-calculate Age on DOB change
  const handleDobChange = (dobValue: string) => {
    let calculatedAge = formData.age || 25;
    if (dobValue) {
      const birth = new Date(dobValue);
      const diff = Date.now() - birth.getTime();
      calculatedAge = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      if (isNaN(calculatedAge) || calculatedAge < 0) calculatedAge = 18;
    }
    setFormData((prev) => ({
      ...prev,
      dob: dobValue,
      age: calculatedAge,
    }));
  };

  // Format Aadhaar: XXXX XXXX XXXX
  const handleAadhaarChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setFormData((prev) => ({ ...prev, aadhaar_num: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Basic Validation
    if (!formData.name?.trim()) {
      setErrorMessage('Staff Name is required');
      setActiveFormTab('personal');
      return;
    }
    if (!formData.phone?.trim() || formData.phone.length < 10) {
      setErrorMessage('Valid 10-digit Phone Number is required');
      setActiveFormTab('personal');
      return;
    }
    if (!formData.aadhaar_num?.trim() || formData.aadhaar_num.replace(/\s/g, '').length < 12) {
      setErrorMessage('Valid 12-digit Aadhaar Number is required (Format: 1234 5678 9012)');
      setActiveFormTab('personal');
      return;
    }
    if (formData.marital_status === 'Married' && !formData.spouse_name?.trim()) {
      setErrorMessage('Spouse Name is required when Marital Status is Married');
      setActiveFormTab('family');
      return;
    }
    if (formData.marital_status !== 'Married' && (!formData.father_name?.trim() && !formData.mother_name?.trim())) {
      setErrorMessage('Parent (Father or Mother) details are required for unmarried staff');
      setActiveFormTab('family');
      return;
    }
    if (!formData.bank_name?.trim() || !formData.account_num?.trim() || !formData.ifsc_code?.trim()) {
      setErrorMessage('Bank Name, Account Number, and IFSC Code are required');
      setActiveFormTab('bank');
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving staff record');
    } finally {
      setLoading(false);
    }
  };

  const isMarried = formData.marital_status === 'Married';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {initialData ? `Edit Staff: ${initialData.name}` : 'Register New Staff Member'}
              </h2>
              <p className="text-xs text-indigo-200/80">
                Mandatory worker profile, KYC Aadhaar, conditional family, bank & ESI details
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

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-slate-50/80 px-6 pt-2 flex space-x-3 overflow-x-auto">
          {[
            { id: 'personal', label: '1. Personal & KYC', icon: User },
            { id: 'family', label: isMarried ? '2. Spouse Details' : '2. Parents Details', icon: isMarried ? Heart : Users2 },
            { id: 'employment', label: '3. Job & Wages', icon: Building },
            { id: 'bank', label: '4. Bank & ESI', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFormTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFormTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: PERSONAL & KYC */}
          {activeFormTab === 'personal' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" /> Personal Identity & Contact
                </h3>
                <span className="text-[11px] text-amber-600 font-medium">* Required for compliance</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gender || 'Male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth (DOB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob || ''}
                    onChange={(e) => handleDobChange(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  />
                </div>

                {/* Age (Auto calculated) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age (Years) <span className="text-slate-400 font-normal">(Auto-calculated)</span>
                  </label>
                  <input
                    type="number"
                    min="14"
                    max="80"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (10 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9845012345"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                      className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Aadhaar Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aadhaar Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="4521 8890 1234"
                    maxLength={14}
                    value={formData.aadhaar_num || ''}
                    onChange={(e) => handleAadhaarChange(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono tracking-wider"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">12-digit UIDAI number</p>
                </div>

                {/* Marital Status Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marital Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.marital_status || 'Single'}
                    onChange={(e) => setFormData({ ...formData, marital_status: e.target.value as MaritalStatus })}
                    className="w-full px-3.5 py-2 text-sm font-semibold text-indigo-900 border-2 border-indigo-200 bg-indigo-50/50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Single">Single (Unmarried) ➔ Parents details</option>
                    <option value="Married">Married ➔ Spouse details</option>
                    <option value="Divorced">Divorced ➔ Parents details</option>
                    <option value="Widowed">Widowed ➔ Parents details</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Worker Status
                  </label>
                  <select
                    value={formData.status || 'Active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffStatus })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Full Address */}
                <div className="col-span-full">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Residential Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="House/Door No, Street name, Area, City/Town, Pincode"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONDITIONAL FAMILY DETAILS */}
          {activeFormTab === 'family' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {isMarried ? (
                /* SPOUSE DETAILS */
                <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-4.5 space-y-4">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm pb-2 border-b border-rose-200">
                    <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                    <span>Spouse Details (Married Worker)</span>
                  </div>
                  <p className="text-xs text-rose-700">
                    Because this worker is marked as <strong>Married</strong>, please provide their spouse contact & occupation details.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Spouse Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sunita Devi"
                        value={formData.spouse_name || ''}
                        onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Spouse Phone Number
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9845098765"
                        value={formData.spouse_phone || ''}
                        onChange={(e) => setFormData({ ...formData, spouse_phone: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Spouse Occupation
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Tailor / Homemaker / Self-employed"
                        value={formData.spouse_occupation || ''}
                        onChange={(e) => setFormData({ ...formData, spouse_occupation: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* PARENTS DETAILS */
                <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-4.5 space-y-4">
                  <div className="flex items-center space-x-2 text-sky-900 font-bold text-sm pb-2 border-b border-sky-200">
                    <Users2 className="w-4 h-4 text-sky-600" />
                    <span>Parents Details (Unmarried / Single Worker)</span>
                  </div>
                  <p className="text-xs text-sky-800">
                    Because this worker is marked as <strong>Single / Unmarried</strong>, please provide their parents contact & address details.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Father's Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Velusamy K."
                        value={formData.father_name || ''}
                        onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mother's Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kamalam V."
                        value={formData.mother_name || ''}
                        onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Parent Contact Phone
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9789054320"
                        value={formData.parent_phone || ''}
                        onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>

                    <div className="col-span-full">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Parent / Native Address
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Village / Town, Native District"
                        value={formData.parent_address || ''}
                        onChange={(e) => setFormData({ ...formData, parent_address: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EMPLOYMENT & WAGE SCHEME */}
          {activeFormTab === 'employment' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-indigo-600" /> Job Role & Wage Settings
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Date of Joining (DOJ) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Joining (DOJ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.doj || ''}
                    onChange={(e) => setFormData({ ...formData, doj: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  />
                </div>

                {/* Role / Designation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation / Role <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Loader, Packer, Sorter, Supervisor"
                    value={formData.role || ''}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Wage Calculation Scheme */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Wage Scheme <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.wage_type || 'Piece Rate'}
                    onChange={(e) => setFormData({ ...formData, wage_type: e.target.value as WageType })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="Piece Rate">Piece Rate (Based on Weight / Bags / Units)</option>
                    <option value="Daily Wage">Daily Fixed Wage</option>
                    <option value="Monthly">Monthly Salary</option>
                  </select>
                </div>

                {/* Daily Fixed Base Rate (if applicable) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Base / Shift Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="400"
                    value={formData.daily_rate ?? 0}
                    onChange={(e) => setFormData({ ...formData, daily_rate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Fallback rate when piece-rate isn't logged</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BANK DETAILS & ESI / PF */}
          {activeFormTab === 'bank' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-600" /> Bank Account & Statutory Numbers
                </h3>
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> For direct wage credit
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Bank Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. State Bank of India"
                    value={formData.bank_name || ''}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 30981245678"
                    value={formData.account_num || ''}
                    onChange={(e) => setFormData({ ...formData, account_num: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>

                {/* IFSC Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IFSC Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SBIN0001234"
                    maxLength={11}
                    value={formData.ifsc_code || ''}
                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase"
                  />
                </div>

                {/* Branch Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Branch Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pollachi Main Branch"
                    value={formData.branch_name || ''}
                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* ESI Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ESI Number (Employee State Insurance)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ESI-310045678912"
                    value={formData.esi_num || ''}
                    onChange={(e) => setFormData({ ...formData, esi_num: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">17-digit or company ESI IP number</p>
                </div>

                {/* PF Number (Provident Fund) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PF / UAN Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PF-TN/CBE/0045612/01"
                    value={formData.pf_num || ''}
                    onChange={(e) => setFormData({ ...formData, pf_num: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex space-x-2">
              {activeFormTab !== 'personal' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs: any = ['personal', 'family', 'employment', 'bank'];
                    const idx = tabs.indexOf(activeFormTab);
                    if (idx > 0) setActiveFormTab(tabs[idx - 1]);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Previous Step
                </button>
              )}
              {activeFormTab !== 'bank' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs: any = ['personal', 'family', 'employment', 'bank'];
                    const idx = tabs.indexOf(activeFormTab);
                    if (idx < tabs.length - 1) setActiveFormTab(tabs[idx + 1]);
                  }}
                  className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Next Step ➔
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
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
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Saving...' : initialData ? 'Save Changes' : 'Register Staff'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
