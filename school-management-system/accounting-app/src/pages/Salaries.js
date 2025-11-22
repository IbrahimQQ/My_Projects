import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { salaryService } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, DollarSign, Check, Filter, FileText } from 'lucide-react';
import { format } from 'date-fns';

const Salaries = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', month: '' });
  const [payModal, setPayModal] = useState({ open: false, salary: null });
  const [payForm, setPayForm] = useState({ paymentDate: format(new Date(), 'yyyy-MM-dd'), method: 'bank_transfer', reference: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['salaries', page, filters], queryFn: () => salaryService.getAll({ page, limit: 10, ...filters }) });

  const payMutation = useMutation({
    mutationFn: ({ id, data }) => salaryService.markPaid(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['salaries']); setPayModal({ open: false, salary: null }); }
  });

  const salaries = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const columns = [
    { header: 'Employee', render: (row) => <div><p className="font-medium">{row.User?.firstName} {row.User?.lastName}</p><p className="text-xs text-gray-500 capitalize">{row.User?.role}</p></div> },
    { header: 'Period', render: (row) => `${row.month}/${row.year}` },
    { header: 'Base Salary', render: (row) => formatCurrency(row.baseSalary) },
    { header: 'Deductions', render: (row) => <span className="text-red-600">-{formatCurrency(row.deductions)}</span> },
    { header: 'Bonuses', render: (row) => <span className="text-green-600">+{formatCurrency(row.bonuses)}</span> },
    { header: 'Net Pay', render: (row) => <span className="font-semibold">{formatCurrency(row.netSalary)}</span> },
    { header: 'Status', render: (row) => <span className={`px-2 py-1 text-xs rounded-full ${row.isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{row.isPaid ? 'Paid' : 'Pending'}</span> },
    { header: 'Actions', render: (row) => !row.isPaid && (
      <button onClick={() => { setPayModal({ open: true, salary: row }); setPayForm({ paymentDate: format(new Date(), 'yyyy-MM-dd'), method: 'bank_transfer', reference: '' }); }} className="p-2 hover:bg-gray-100 rounded-lg text-green-600"><Check size={16} /></button>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Salary Management</h1>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2"><FileText size={18} /> Generate Payroll</button>
          <Link to="/salaries/new" className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Salary</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter size={18} className="text-gray-400" />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="select w-40">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
          <input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="input w-48" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-orange-50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-100"><DollarSign className="text-orange-600" size={20} /></div>
            <div><p className="text-2xl font-bold text-orange-700">{formatCurrency(salaries.filter(s => !s.isPaid).reduce((sum, s) => sum + parseFloat(s.netSalary || 0), 0))}</p><p className="text-sm text-orange-600">Pending Payments</p></div>
          </div>
        </div>
        <div className="card bg-green-50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100"><Check className="text-green-600" size={20} /></div>
            <div><p className="text-2xl font-bold text-green-700">{formatCurrency(salaries.filter(s => s.isPaid).reduce((sum, s) => sum + parseFloat(s.netSalary || 0), 0))}</p><p className="text-sm text-green-600">Paid This Period</p></div>
          </div>
        </div>
        <div className="card bg-primary-50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-100"><DollarSign className="text-primary-600" size={20} /></div>
            <div><p className="text-2xl font-bold text-primary-700">{salaries.length}</p><p className="text-sm text-primary-600">Total Records</p></div>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={salaries} loading={isLoading} pagination={pagination} onPageChange={setPage} />

      {/* Pay Salary Modal */}
      <Modal isOpen={payModal.open} onClose={() => setPayModal({ open: false, salary: null })} title="Mark Salary as Paid">
        {payModal.salary && (
          <form onSubmit={(e) => { e.preventDefault(); payMutation.mutate({ id: payModal.salary.id, data: payForm }); }} className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{payModal.salary.User?.firstName} {payModal.salary.User?.lastName}</p>
              <p className="text-sm text-gray-500">{payModal.salary.month}/{payModal.salary.year}</p>
              <p className="text-xl font-bold text-primary-600 mt-2">{formatCurrency(payModal.salary.netSalary)}</p>
            </div>
            <div>
              <label className="label">Payment Date *</label>
              <input type="date" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Payment Method *</label>
              <select value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} className="select">
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
              </select>
            </div>
            <div>
              <label className="label">Reference</label>
              <input type="text" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} className="input" placeholder="Transaction ID, Check #" />
            </div>
            {payMutation.error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{payMutation.error.response?.data?.message || 'Error processing payment'}</div>}
            <div className="flex gap-3">
              <button type="submit" disabled={payMutation.isPending} className="btn-success flex-1">{payMutation.isPending ? 'Processing...' : 'Confirm Payment'}</button>
              <button type="button" onClick={() => setPayModal({ open: false, salary: null })} className="btn-secondary">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Salaries;
