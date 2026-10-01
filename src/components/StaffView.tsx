import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Download,
  FileSpreadsheet,
  Heart,
  Users2,
  Building,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { Staff, MaritalStatus } from '../types';
import * as XLSX from 'xlsx';

interface StaffViewProps {
  staffList: Staff[];
  onOpenModal: (staff?: Staff) => void;
  onDeleteStaff: (id: number) => Promise<void>;
  onViewStaffDetail: (staff: Staff) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staffList,
  onOpenModal,
  onDeleteStaff,
  onViewStaffDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [maritalFilter, setMaritalFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filter staff based on criteria
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staff_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      s.aadhaar_num.includes(searchQuery) ||
      (s.role && s.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.esi_num && s.esi_num.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesMarital = maritalFilter === 'all' || s.marital_status === maritalFilter;
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;

    return matchesSearch && matchesStatus && matchesMarital && matchesRole;
  });

  // Unique roles for filter dropdown
  const uniqueRoles = Array.from(new Set(staffList.map((s) => s.role).filter(Boolean)));

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredStaff.map((s) => ({
      'Staff Code': s.staff_code,
      'Full Name': s.name,
      'Gender': s.gender,
      'Age': s.age,
      'DOB': s.dob,
      'Phone': s.phone,
      'Aadhaar Number': s.aadhaar_num,
      'Marital Status': s.marital_status,
      'Spouse Name': s.spouse_name || '',
      'Spouse Phone': s.spouse_phone || '',
      'Spouse Occupation': s.spouse_occupation || '',
      'Father Name': s.father_name || '',
      'Mother Name': s.mother_name || '',
      'Parent Phone': s.parent_phone || '',
      'Residential Address': s.address,
      'Date of Joining': s.doj,
      'Role / Designation': s.role,
      'Wage Scheme': s.wage_type,
      'Daily Rate (₹)': s.daily_rate,
      'Bank Name': s.bank_name,
      'Account Number': s.account_num,
      'IFSC Code': s.ifsc_code,
      'Branch Name': s.branch_name,
      'ESI Number': s.esi_num || '',
      'PF Number': s.pf_num || '',
      'Status': s.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff Directory');
    XLSX.writeFile(wb, `Staff_Directory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Staff & Worker Master Directory
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              {filteredStaff.length} Workers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete database of workers with KYC Aadhaar, conditional family details (Spouse/Parents), bank accounts, and ESI registrations.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center px-3.5 py-2 border border-slate-300 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            Export Excel
          </button>

          <button
            onClick={() => onOpenModal()}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Staff
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, Code, Phone, Aadhaar, ESI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Marital Status Filter */}
          <div>
            <select
              value={maritalFilter}
              onChange={(e) => setMaritalFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">Marital: All</option>
              <option value="Married">Married (Spouse info)</option>
              <option value="Single">Single (Parent info)</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">Role: All ({uniqueRoles.length})</option>
              {uniqueRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">Status: All</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table / Cards View */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No staff members found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or click "Add New Staff" to register worker details.
          </p>
          <button
            onClick={() => onOpenModal()}
            className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add First Staff
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Code & Staff</th>
                  <th className="py-3.5 px-4">Age / Gender / DOB</th>
                  <th className="py-3.5 px-4">Aadhaar & Contact</th>
                  <th className="py-3.5 px-4">Family Details</th>
                  <th className="py-3.5 px-4">Bank Account</th>
                  <th className="py-3.5 px-4">Role & Wages</th>
                  <th className="py-3.5 px-4">ESI Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff) => {
                  const isMarried = staff.marital_status === 'Married';
                  return (
                    <tr key={staff.id} className="hover:bg-indigo-50/30 transition-colors group">
                      
                      {/* Code & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <button
                              onClick={() => onViewStaffDetail(staff)}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left flex items-center gap-1 cursor-pointer"
                            >
                              <span>{staff.name}</span>
                              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                            </button>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                                {staff.staff_code}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                staff.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {staff.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Age / Gender / DOB */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {staff.gender}, <span className="font-bold text-indigo-700">{staff.age} yrs</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">DOB: {staff.dob}</div>
                      </td>

                      {/* Aadhaar & Phone */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 tracking-wide text-[11px]">
                          {staff.aadhaar_num}
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          <span>+91 {staff.phone}</span>
                        </div>
                      </td>

                      {/* Conditional Family Details */}
                      <td className="py-3 px-4 max-w-[200px]">
                        {isMarried ? (
                          <div className="bg-rose-50/80 border border-rose-200/60 rounded-lg p-1.5 text-[10px] text-rose-900">
                            <div className="flex items-center gap-1 font-bold text-rose-700">
                              <Heart className="w-3 h-3 fill-rose-500 text-rose-500 shrink-0" />
                              <span className="truncate">Spouse: {staff.spouse_name || 'Married'}</span>
                            </div>
                            {staff.spouse_phone && (
                              <div className="text-slate-600 mt-0.5 truncate">Ph: {staff.spouse_phone}</div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-sky-50/80 border border-sky-200/60 rounded-lg p-1.5 text-[10px] text-sky-900">
                            <div className="flex items-center gap-1 font-bold text-sky-700">
                              <Users2 className="w-3 h-3 text-sky-600 shrink-0" />
                              <span className="truncate">Father: {staff.father_name || 'Single'}</span>
                            </div>
                            {staff.parent_phone && (
                              <div className="text-slate-600 mt-0.5 truncate">Ph: {staff.parent_phone}</div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Bank Account */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 truncate max-w-[150px]">{staff.bank_name}</div>
                        <div className="font-mono text-[10px] text-slate-600">
                          A/C: <span className="font-bold">{staff.account_num}</span>
                        </div>
                        <div className="font-mono text-[9px] text-indigo-700 font-semibold">{staff.ifsc_code}</div>
                      </td>

                      {/* Role & Wages */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{staff.role}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Scheme: <span className="font-medium text-indigo-700">{staff.wage_type}</span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold">
                          Base: ₹{staff.daily_rate}/day
                        </div>
                      </td>

                      {/* ESI Status */}
                      <td className="py-3 px-4">
                        {staff.esi_num ? (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-1 rounded text-[10px] font-mono font-medium">
                            {staff.esi_num}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onViewStaffDetail(staff)}
                            title="View Profile & Print ID"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenModal(staff)}
                            title="Edit Staff"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete staff "${staff.name}" (${staff.staff_code})?`)) {
                                onDeleteStaff(staff.id);
                              }
                            }}
                            title="Delete Staff"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}
    </div>
  );
};
