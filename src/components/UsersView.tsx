import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  User,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Eye,
  Shield,
  Layers,
} from 'lucide-react';
import { User as UserType, UserRole, Staff } from '../types';

interface UsersViewProps {
  users: UserType[];
  staffList: Staff[];
  currentUser: UserType | null;
  onCreateUser: (userData: any) => Promise<void>;
  onUpdateUser: (id: number, userData: any) => Promise<void>;
  onDeleteUser: (id: number) => Promise<void>;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  staffList,
  currentUser,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'Supervisor' as UserRole,
    staff_id: '' as string | number,
    status: 'Active',
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      name: '',
      role: 'Supervisor',
      staff_id: '',
      status: 'Active',
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserType) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      email: u.email,
      password: '',
      name: u.name,
      role: u.role,
      staff_id: u.staff_id || '',
      status: u.status,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name || !formData.email || !formData.role) {
      setErrorMessage('Please fill in all mandatory fields');
      return;
    }
    if (!editingUser && (!formData.username || !formData.password)) {
      setErrorMessage('Username and Password are required for new accounts');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        staff_id: formData.staff_id ? Number(formData.staff_id) : null,
      };

      if (editingUser) {
        await onUpdateUser(editingUser.id, payload);
      } else {
        await onCreateUser(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving user');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Supervisor':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Accountant':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Worker':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              User Accounts & Role-Based Access Control (RBAC)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              {users.length} Users
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage system users, assign role permissions (Admin, Supervisor, Accountant, Worker), and bind worker logins to staff master records.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New User Account
        </button>
      </div>

      {/* RBAC Role Permissions Reference Table */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role Permissions Matrix</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <span className="font-extrabold text-purple-300">👑 Admin</span>
            <ul className="mt-2 space-y-1 text-slate-300 text-[11px]">
              <li>✓ Full Staff CRUD & Delete</li>
              <li>✓ Piece-Rate Job Setup</li>
              <li>✓ Attendance & Wage Logging</li>
              <li>✓ Payroll Settlement & Reports</li>
              <li>✓ Company Settings & Users</li>
            </ul>
          </div>

          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <span className="font-extrabold text-emerald-300">👔 Supervisor</span>
            <ul className="mt-2 space-y-1 text-slate-300 text-[11px]">
              <li>✓ View Staff & Add Staff</li>
              <li>✓ Mark Daily Attendance & OT</li>
              <li>✓ Log Daily Piece-Rate Wages</li>
              <li>✓ Rate Simulator</li>
              <li>✗ Cannot delete staff/settings</li>
            </ul>
          </div>

          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <span className="font-extrabold text-amber-300">💼 Accountant</span>
            <ul className="mt-2 space-y-1 text-slate-300 text-[11px]">
              <li>✓ View Staff & Attendance</li>
              <li>✓ Daily Wages Settlement (Paid)</li>
              <li>✓ Generate Worker Payslips</li>
              <li>✓ Bank NEFT & ESI Statements</li>
              <li>✗ Cannot modify job rules</li>
            </ul>
          </div>

          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <span className="font-extrabold text-sky-300">👷 Worker (Self-Service)</span>
            <ul className="mt-2 space-y-1 text-slate-300 text-[11px]">
              <li>✓ View Own Bio-Data & ID Card</li>
              <li>✓ View Own Attendance History</li>
              <li>✓ View Own Piece-Rate Wages</li>
              <li>✓ Download Own Payslips</li>
              <li>✗ Restricted from company data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter and User List */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700"
          >
            <option value="all">Role: All</option>
            <option value="Admin">Admin</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Accountant">Accountant</option>
            <option value="Worker">Worker</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">User & Username</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Linked Staff Record</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isSelf = currentUser && currentUser.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-indigo-50/20 transition-colors">
                    
                    {/* Name & Username */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">@{u.username}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 font-medium text-slate-700">{u.email}</td>

                    {/* Assigned Role */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Linked Staff */}
                    <td className="py-3 px-4">
                      {u.linked_staff_name ? (
                        <div className="font-semibold text-slate-800">
                          {u.linked_staff_name} <span className="text-[10px] text-indigo-600 font-mono">({u.linked_staff_code})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">System Account (Not bound)</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit User"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete user account "${u.name}" (@${u.username})?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            title="Delete User"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  {editingUser ? `Edit User: ${editingUser.name}` : 'Create New User & Assign Role'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senthil Nathan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username {!editingUser && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!!editingUser}
                    required={!editingUser}
                    placeholder="e.g. senthil"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="senthil@apex.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingUser ? 'Reset Password (Leave blank to keep current)' : 'Password'} {!editingUser && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RBAC Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold text-slate-800"
                  >
                    <option value="Admin">Admin (Full Access)</option>
                    <option value="Supervisor">Supervisor (Operations)</option>
                    <option value="Accountant">Accountant (Payroll)</option>
                    <option value="Worker">Worker (Self-Service)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Optional Staff Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link to Staff Record <span className="text-slate-400 font-normal">(Required if role is Worker)</span>
                </label>
                <select
                  value={formData.staff_id}
                  onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                >
                  <option value="">-- No Linked Staff (System User) --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.staff_code}) - {s.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {loading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
