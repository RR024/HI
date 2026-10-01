import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Calculator,
  Edit2,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { JobType } from '../types';

interface JobTypesViewProps {
  jobTypes: JobType[];
  onCreateJob: (job: Partial<JobType>) => Promise<void>;
  onUpdateJob: (id: number, job: Partial<JobType>) => Promise<void>;
  onDeleteJob: (id: number) => Promise<void>;
}

export const JobTypesView: React.FC<JobTypesViewProps> = ({
  jobTypes,
  onCreateJob,
  onUpdateJob,
  onDeleteJob,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobType | null>(null);

  // Live Calculator State
  const [calcSelectedJobId, setCalcSelectedJobId] = useState<number | null>(
    jobTypes.length > 0 ? jobTypes[0].id : null
  );
  const [calcQuantity, setCalcQuantity] = useState<number>(250);

  // Form State
  const [formData, setFormData] = useState<Partial<JobType>>({
    title: '',
    description: '',
    category: 'Loading',
    rate_amount: 100,
    unit_quantity: 100,
    unit_name: 'kg',
    status: 'Active',
  });

  const categories = ['All', 'Loading', 'Packaging', 'Processing', 'Sorting', 'Maintenance', 'General'];

  const filteredJobs = jobTypes.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.description && j.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      j.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || j.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const openCreateModal = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      description: '',
      category: 'Loading',
      rate_amount: 100,
      unit_quantity: 100,
      unit_name: 'kg',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (job: JobType) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description || '',
      category: job.category,
      rate_amount: job.rate_amount,
      unit_quantity: job.unit_quantity,
      unit_name: job.unit_name,
      status: job.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.rate_amount || !formData.unit_quantity || !formData.unit_name) return;

    if (editingJob) {
      await onUpdateJob(editingJob.id, formData);
    } else {
      await onCreateJob(formData);
    }
    setIsModalOpen(false);
  };

  // Find currently selected job for calculator
  const activeCalcJob = jobTypes.find((j) => j.id === (calcSelectedJobId || (jobTypes[0] ? jobTypes[0].id : 0)));
  const calculatedWage = activeCalcJob
    ? (calcQuantity * activeCalcJob.rate_amount) / activeCalcJob.unit_quantity
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Title & Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Work & Job Rates Master (Piece-Rate Scheme)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              {jobTypes.length} Job Schemes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Define specific piece-rate jobs and wages (e.g. <strong>₹100 per 100 kg</strong>, <strong>₹12 per bag</strong>, <strong>₹450 per shift</strong>).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New Job Scheme
        </button>
      </div>

      {/* Interactive Rate Simulator Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Calculator className="w-4 h-4 text-amber-400" />
          <span>Interactive Rate Calculator & Test Simulator</span>
        </div>

        <p className="text-xs text-indigo-200 mb-4 max-w-xl">
          Quickly test and verify daily wage calculation for any job scheme and quantity before assigning tasks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
          
          {/* Select Job */}
          <div>
            <label className="block text-[11px] font-bold text-indigo-200 mb-1">Select Job Type</label>
            <select
              value={calcSelectedJobId || ''}
              onChange={(e) => setCalcSelectedJobId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900/90 text-white border border-indigo-400/40 focus:ring-2 focus:ring-amber-400 outline-none font-medium"
            >
              {jobTypes.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} (₹{j.rate_amount} / {j.unit_quantity} {j.unit_name})
                </option>
              ))}
            </select>
          </div>

          {/* Enter Volume */}
          <div>
            <label className="block text-[11px] font-bold text-indigo-200 mb-1">
              Quantity / Volume ({activeCalcJob?.unit_name || 'units'})
            </label>
            <input
              type="number"
              min="1"
              value={calcQuantity}
              onChange={(e) => setCalcQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900/90 text-white border border-indigo-400/40 focus:ring-2 focus:ring-amber-400 outline-none font-bold"
            />
          </div>

          {/* Calculated Output */}
          <div className="bg-white/10 rounded-lg p-3 border border-white/20 text-center sm:text-right">
            <span className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Calculated Wage</span>
            <div className="text-2xl font-black text-amber-300 mt-0.5">
              ₹{calculatedWage.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-indigo-200 mt-0.5">
              Formula: ({calcQuantity} × ₹{activeCalcJob?.rate_amount}) ÷ {activeCalcJob?.unit_quantity} {activeCalcJob?.unit_name}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Job Cards */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {categories.map((cat) => {
            const isSel = selectedCategory === (cat === 'All' ? 'all' : cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'All' ? 'all' : cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  isSel
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search job title or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          />
        </div>
      </div>

      {/* Grid of Job Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map((job) => {
          const singleUnitRate = (job.rate_amount / job.unit_quantity).toFixed(2);
          return (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {job.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {job.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3 group-hover:text-indigo-600 transition-colors">
                  {job.title}
                </h3>

                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {job.description || 'Standard piece-rate task description.'}
                </p>

                {/* Rate Badge Box */}
                <div className="mt-4 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Rate Scheme</span>
                    <div className="text-lg font-black text-emerald-900 mt-0.5">
                      ₹{job.rate_amount} <span className="text-xs font-semibold text-emerald-700">/ {job.unit_quantity} {job.unit_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-emerald-700 font-medium">Single Unit</span>
                    <div className="text-xs font-mono font-bold text-emerald-800">
                      ₹{singleUnitRate} / {job.unit_name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setCalcSelectedJobId(job.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Simulate in Calc</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(job)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove job scheme "${job.title}"?`)) {
                        onDeleteJob(job.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  {editingJob ? `Edit Job Scheme: ${editingJob.code}` : 'Create New Job Scheme'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job / Work Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raw Material Unloading & Stacking"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category || 'General'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Loading">Loading & Unloading</option>
                  <option value="Packaging">Packaging & Bagging</option>
                  <option value="Processing">Processing & Milling</option>
                  <option value="Sorting">Sorting & Grading</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="General">General Daily Tasks</option>
                </select>
              </div>

              {/* Piece-rate calculation rules: e.g. 100 Rs per 100 kg */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Piece-Rate Rule Formula</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Rate Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      required
                      placeholder="100"
                      value={formData.rate_amount || ''}
                      onChange={(e) => setFormData({ ...formData, rate_amount: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Per Quantity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="100"
                      value={formData.unit_quantity || ''}
                      onChange={(e) => setFormData({ ...formData, unit_quantity: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Unit Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="kg, bags, tons, boxes"
                      value={formData.unit_name || ''}
                      onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-indigo-50/80 rounded-lg text-xs text-indigo-900 flex items-center justify-between border border-indigo-100">
                  <span className="font-semibold">Formula preview:</span>
                  <span className="font-mono font-bold text-indigo-700">
                    ₹{formData.rate_amount || 0} per {formData.unit_quantity || 1} {formData.unit_name || 'units'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Description & Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Manual unloading from trucks and pallet stacking in warehouse block 3"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {editingJob ? 'Update Scheme' : 'Save Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
