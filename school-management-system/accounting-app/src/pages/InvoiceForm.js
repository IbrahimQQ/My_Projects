import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { invoiceService, studentService, feeStructureService } from '../services/api';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const InvoiceForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ studentId: '', dueDate: '', items: [{ description: '', amount: '' }], notes: '' });

  const { data: studentsData } = useQuery({ queryKey: ['students'], queryFn: () => studentService.getAll({ limit: 1000 }) });
  const { data: feeData } = useQuery({ queryKey: ['fee-structures'], queryFn: () => feeStructureService.getAll({ isActive: true }) });

  const students = studentsData?.data?.data || [];
  const feeStructures = feeData?.data?.data || [];

  const mutation = useMutation({
    mutationFn: (data) => invoiceService.create(data),
    onSuccess: () => navigate('/invoices'),
  });

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', amount: '' }] });
  const removeItem = (index) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index][field] = value;
    setForm({ ...form, items });
  };

  const applyFeeStructure = (feeId) => {
    const fee = feeStructures.find(f => f.id === feeId);
    if (fee) setForm({ ...form, items: [...form.items, { description: fee.name, amount: fee.amount }] });
  };

  const totalAmount = form.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const items = form.items.filter(i => i.description && i.amount);
    mutation.mutate({ ...form, items, totalAmount });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-4">
            <h3 className="font-semibold">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Student *</label>
                <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="select" required>
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} - {s.Class?.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Due Date *</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" required />
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Line Items</h3>
              <div className="flex gap-2">
                <select onChange={(e) => { if (e.target.value) applyFeeStructure(e.target.value); e.target.value = ''; }} className="select w-48 text-sm">
                  <option value="">Add from Fee Structure</option>
                  {feeStructures.map(f => <option key={f.id} value={f.id}>{f.name} - ${f.amount}</option>)}
                </select>
                <button type="button" onClick={addItem} className="btn-secondary text-sm flex items-center gap-1"><Plus size={16} /> Add Item</button>
              </div>
            </div>
            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input type="text" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} className="input" placeholder="Description" />
                  </div>
                  <div className="w-32">
                    <input type="number" value={item.amount} onChange={(e) => updateItem(index, 'amount', e.target.value)} className="input" placeholder="Amount" step="0.01" />
                  </div>
                  {form.items.length > 1 && <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" rows={3} placeholder="Optional notes for the invoice" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-4">Summary</h3>
            <div className="space-y-2 text-sm">
              {form.items.filter(i => i.description && i.amount).map((item, i) => (
                <div key={i} className="flex justify-between"><span className="text-gray-600">{item.description}</span><span>${parseFloat(item.amount || 0).toFixed(2)}</span></div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-lg"><span>Total</span><span className="text-primary-600">${totalAmount.toFixed(2)}</span></div>
            </div>
          </div>

          {mutation.error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{mutation.error.response?.data?.message || 'Error creating invoice'}</div>}

          <button type="submit" disabled={mutation.isPending || !form.studentId || totalAmount === 0} className="btn-primary w-full">{mutation.isPending ? 'Creating...' : 'Create Invoice'}</button>
          <button type="button" onClick={() => navigate('/invoices')} className="btn-secondary w-full">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
