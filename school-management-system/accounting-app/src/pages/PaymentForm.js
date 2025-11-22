import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { paymentService, invoiceService } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const PaymentForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceIdParam = searchParams.get('invoiceId');

  const [form, setForm] = useState({ invoiceId: invoiceIdParam || '', amount: '', method: 'cash', reference: '', paymentDate: format(new Date(), 'yyyy-MM-dd'), notes: '' });
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { data: invoicesData } = useQuery({ queryKey: ['pending-invoices'], queryFn: () => invoiceService.getAll({ status: 'pending,partial', limit: 100 }) });

  const { data: invoiceData } = useQuery({ queryKey: ['invoice', form.invoiceId], queryFn: () => invoiceService.getById(form.invoiceId), enabled: !!form.invoiceId });

  const invoices = invoicesData?.data?.data || [];

  useEffect(() => {
    if (invoiceData?.data?.data) {
      setSelectedInvoice(invoiceData.data.data);
      if (!form.amount) setForm(f => ({ ...f, amount: invoiceData.data.data.balanceAmount }));
    }
  }, [invoiceData, form.amount]);

  const mutation = useMutation({
    mutationFn: (data) => paymentService.create(data),
    onSuccess: () => navigate('/payments'),
  });

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/payments')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">Record Payment</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card space-y-4">
          <div>
            <label className="label">Invoice *</label>
            <select value={form.invoiceId} onChange={(e) => { setForm({ ...form, invoiceId: e.target.value, amount: '' }); setSelectedInvoice(null); }} className="select" required>
              <option value="">Select Invoice</option>
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>#{inv.invoiceNumber} - {inv.Student?.firstName} {inv.Student?.lastName} - Balance: {formatCurrency(inv.balanceAmount)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Amount *</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" placeholder="0.00" step="0.01" max={selectedInvoice?.balanceAmount} required />
              {selectedInvoice && <p className="text-xs text-gray-500 mt-1">Max: {formatCurrency(selectedInvoice.balanceAmount)}</p>}
            </div>
            <div>
              <label className="label">Payment Method *</label>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="select" required>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="mobile">Mobile Payment</option>
              </select>
            </div>
            <div>
              <label className="label">Payment Date *</label>
              <input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Reference Number</label>
              <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="input" placeholder="e.g., Check #, Transaction ID" />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" rows={2} placeholder="Optional notes" />
          </div>

          {mutation.error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{mutation.error.response?.data?.message || 'Error recording payment'}</div>}

          <div className="flex gap-3">
            <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Recording...' : 'Record Payment'}</button>
            <button type="button" onClick={() => navigate('/payments')} className="btn-secondary">Cancel</button>
          </div>
        </div>

        {/* Invoice Summary */}
        {selectedInvoice && (
          <div className="card h-fit">
            <h3 className="font-semibold mb-4">Invoice Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Invoice #</span><span className="font-mono">{selectedInvoice.invoiceNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Student</span><span>{selectedInvoice.Student?.firstName} {selectedInvoice.Student?.lastName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Amount</span><span>{formatCurrency(selectedInvoice.totalAmount)}</span></div>
              <div className="flex justify-between text-green-600"><span>Paid</span><span>{formatCurrency(selectedInvoice.paidAmount)}</span></div>
              <div className="flex justify-between font-semibold border-t pt-2"><span>Balance Due</span><span className="text-red-600">{formatCurrency(selectedInvoice.balanceAmount)}</span></div>
              {form.amount && (
                <>
                  <div className="flex justify-between text-primary-600"><span>This Payment</span><span>-{formatCurrency(form.amount)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-2"><span>New Balance</span><span className={parseFloat(selectedInvoice.balanceAmount) - parseFloat(form.amount || 0) <= 0 ? 'text-green-600' : 'text-orange-600'}>{formatCurrency(parseFloat(selectedInvoice.balanceAmount) - parseFloat(form.amount || 0))}</span></div>
                </>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PaymentForm;
