import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { feeStructureService, classService, academicYearService } from '../services/api';
import { ArrowLeft } from 'lucide-react';

const FeeStructureForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ name: '', description: '', amount: '', frequency: 'term', classId: '', academicYearId: '', dueDay: '15', isActive: true });

  const { data: existing } = useQuery({ queryKey: ['fee-structure', id], queryFn: () => feeStructureService.getById(id), enabled: isEdit });
  const { data: classesData } = useQuery({ queryKey: ['classes'], queryFn: () => classService.getAll() });
  const { data: yearsData } = useQuery({ queryKey: ['academic-years'], queryFn: () => academicYearService.getAll() });

  const classes = classesData?.data?.data || [];
  const years = yearsData?.data?.data || [];

  useEffect(() => {
    if (existing?.data?.data) {
      const fs = existing.data.data;
      setForm({ name: fs.name, description: fs.description || '', amount: fs.amount, frequency: fs.frequency, classId: fs.classId || '', academicYearId: fs.academicYearId || '', dueDay: fs.dueDay || '15', isActive: fs.isActive });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? feeStructureService.update(id, data) : feeStructureService.create(data),
    onSuccess: () => navigate('/fee-structures'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, amount: parseFloat(form.amount), dueDay: parseInt(form.dueDay), classId: form.classId || null, academicYearId: form.academicYearId || null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/fee-structures')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit' : 'New'} Fee Structure</h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g., Tuition Fee" required />
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} placeholder="Optional description" />
          </div>
          <div>
            <label className="label">Amount *</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" placeholder="0.00" step="0.01" required />
          </div>
          <div>
            <label className="label">Frequency *</label>
            <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="select">
              <option value="once">One Time</option>
              <option value="monthly">Monthly</option>
              <option value="term">Per Term</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="label">Class (Optional)</label>
            <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="select">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Academic Year</label>
            <select value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })} className="select">
              <option value="">Select Year</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Due Day of Month</label>
            <input type="number" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} className="input" min="1" max="28" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>
        </div>

        {mutation.error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{mutation.error.response?.data?.message || 'An error occurred'}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Saving...' : 'Save Fee Structure'}</button>
          <button type="button" onClick={() => navigate('/fee-structures')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default FeeStructureForm;
