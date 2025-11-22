import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { salaryService, teacherService } from '../services/api';
import { ArrowLeft } from 'lucide-react';

const SalaryForm = () => {
  const navigate = useNavigate();
  const currentDate = new Date();

  const [form, setForm] = useState({
    userId: '',
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    baseSalary: '',
    bonuses: '0',
    deductions: '0',
    bonusReason: '',
    deductionReason: ''
  });

  const { data: teachersData } = useQuery({ queryKey: ['teachers'], queryFn: () => teacherService.getAll({ limit: 1000 }) });
  const teachers = teachersData?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (data) => salaryService.create(data),
    onSuccess: () => navigate('/salaries'),
  });

  const baseSalary = parseFloat(form.baseSalary) || 0;
  const bonuses = parseFloat(form.bonuses) || 0;
  const deductions = parseFloat(form.deductions) || 0;
  const netSalary = baseSalary + bonuses - deductions;

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      baseSalary,
      bonuses,
      deductions,
      netSalary
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/salaries')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">Add Salary Record</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card space-y-4">
          <div>
            <label className="label">Employee *</label>
            <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="select" required>
              <option value="">Select Employee</option>
              {teachers.map(t => <option key={t.id} value={t.userId}>{t.User?.firstName} {t.User?.lastName} - {t.employeeId}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Month *</label>
              <select value={form.month} onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })} className="select">
                {[...Array(12)].map((_, i) => <option key={i} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year *</label>
              <select value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} className="select">
                {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Base Salary *</label>
            <input type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} className="input" placeholder="0.00" step="0.01" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Bonuses</label>
              <input type="number" value={form.bonuses} onChange={(e) => setForm({ ...form, bonuses: e.target.value })} className="input" placeholder="0.00" step="0.01" />
              <input type="text" value={form.bonusReason} onChange={(e) => setForm({ ...form, bonusReason: e.target.value })} className="input mt-2" placeholder="Reason for bonus (optional)" />
            </div>
            <div>
              <label className="label">Deductions</label>
              <input type="number" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} className="input" placeholder="0.00" step="0.01" />
              <input type="text" value={form.deductionReason} onChange={(e) => setForm({ ...form, deductionReason: e.target.value })} className="input mt-2" placeholder="Reason for deduction (optional)" />
            </div>
          </div>

          {mutation.error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{mutation.error.response?.data?.message || 'Error creating salary record'}</div>}

          <div className="flex gap-3">
            <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Saving...' : 'Save Salary Record'}</button>
            <button type="button" onClick={() => navigate('/salaries')} className="btn-secondary">Cancel</button>
          </div>
        </div>

        {/* Summary */}
        <div className="card h-fit">
          <h3 className="font-semibold mb-4">Salary Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Base Salary</span><span>{formatCurrency(baseSalary)}</span></div>
            <div className="flex justify-between text-green-600"><span>+ Bonuses</span><span>{formatCurrency(bonuses)}</span></div>
            <div className="flex justify-between text-red-600"><span>- Deductions</span><span>{formatCurrency(deductions)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-3"><span>Net Salary</span><span className="text-primary-600">{formatCurrency(netSalary)}</span></div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SalaryForm;
