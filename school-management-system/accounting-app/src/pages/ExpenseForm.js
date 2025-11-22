import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { expenseService } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const ExpenseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'other',
    expenseDate: format(new Date(), 'yyyy-MM-dd'),
    vendor: '',
    receiptNumber: '',
    notes: ''
  });

  const { data: existing } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => expenseService.getById(id),
    enabled: isEdit
  });

  useEffect(() => {
    if (existing?.data?.data) {
      const e = existing.data.data;
      setForm({
        description: e.description,
        amount: e.amount,
        category: e.category,
        expenseDate: format(new Date(e.expenseDate), 'yyyy-MM-dd'),
        vendor: e.vendor || '',
        receiptNumber: e.receiptNumber || '',
        notes: e.notes || ''
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? expenseService.update(id, data) : expenseService.create(data),
    onSuccess: () => navigate('/expenses'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/expenses')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit' : 'Add'} Expense</h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4">
        <div>
          <label className="label">Description *</label>
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="What was this expense for?" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Amount *</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" placeholder="0.00" step="0.01" required />
          </div>
          <div>
            <label className="label">Category *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="select">
              <option value="utilities">Utilities</option>
              <option value="supplies">Supplies</option>
              <option value="maintenance">Maintenance</option>
              <option value="transport">Transport</option>
              <option value="salaries">Salaries</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Expense Date *</label>
            <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="label">Vendor</label>
            <input type="text" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="input" placeholder="Vendor or supplier name" />
          </div>
        </div>

        <div>
          <label className="label">Receipt Number</label>
          <input type="text" value={form.receiptNumber} onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })} className="input" placeholder="Invoice or receipt number" />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" rows={3} placeholder="Additional details" />
        </div>

        {mutation.error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{mutation.error.response?.data?.message || 'An error occurred'}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Saving...' : 'Save Expense'}</button>
          <button type="button" onClick={() => navigate('/expenses')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
