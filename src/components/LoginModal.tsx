import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types';

interface LoginModalProps {
  onLogin: (username: string, password: string) => Promise<void>;
  loading: boolean;
  error: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLogin,
  loading,
  error,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  const demoAccounts = [
    {
      role: 'Admin',
      badge: '👑 Full Access',
      username: 'admin',
      pass: 'admin123',
      name: 'Rajesh V. (System Admin)',
      desc: 'Full CRUD, Settings & User Management',
      color: 'border-indigo-500/50 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900',
    },
    {
      role: 'Supervisor',
      badge: '👔 Floor Operations',
      username: 'supervisor',
      pass: 'super123',
      name: 'Senthil Nathan (Floor Lead)',
      desc: 'Attendance & Daily Piece-Rate Logging',
      color: 'border-emerald-500/50 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900',
    },
    {
      role: 'Accountant',
      badge: '💼 Payroll & Finance',
      username: 'accountant',
      pass: 'account123',
      name: 'Pooja Sharma (Accounts)',
      desc: 'Wage Settlement, Payslips & Bank Statements',
      color: 'border-amber-500/50 bg-amber-50/70 hover:bg-amber-100 text-amber-900',
    },
    {
      role: 'Worker',
      badge: '👷 Self-Service',
      username: 'ramesh',
      pass: 'ramesh123',
      name: 'Ramesh Kumar (Worker)',
      desc: 'Personal Wages & Bio-Data Portal',
      color: 'border-sky-500/50 bg-sky-50/70 hover:bg-sky-100 text-sky-900',
    },
  ];

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    onLogin(u, p);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    onLogin(username, password);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white relative">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">WorkPulse Pro</h1>
              <p className="text-xs text-indigo-200">Enterprise Daily Business, Staff & Piece-Rate Wages</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2">
            Secure Role-Based Access Control (RBAC) authentication. Please sign in with your enterprise credentials.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* 1-Click Demo Logins */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Select Demo Role & Quick Login
              </span>
              <span className="text-[10px] text-slate-400">Click any role to autofill & log in</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc.username, acc.pass)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${acc.color} hover:shadow-xs`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{acc.name}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white/80 shadow-2xs">
                      {acc.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">{acc.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Or Sign In With Credentials
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="admin or email address"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
