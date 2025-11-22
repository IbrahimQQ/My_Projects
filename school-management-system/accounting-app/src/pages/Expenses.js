import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { expenseService } from '../services/api';
import DataTable from '../components/DataTable';
import { Plus, Edit, Trash2, Filter, Receipt } from 'lucide-react';
import { format } from 'date-fns';

const Expenses = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ category: '', startDate: '', endDate: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['expenses', page, filters], queryFn: () => expenseService.getAll({ page, limit: 10, ...filters }) });

  const deleteMutation = useMutation({
    mutationFn: (id) => expenseService.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['expenses'])
  });

  const expenses = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const getCategoryBadge = (category) => {
    const colors = { utilities: 'bg-blue-100 text-blue-700', supplies: 'bg-green-100 text-green-700', maintenance: 'bg-orange-100 text-orange-700', transport: 'bg-purple-100 text-purple-700', other: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-1 text-xs rounded-full capitalize ${colors[category] || colors.other}`}>{category}</span>;
  };

  const columns = [
    { header: 'Date', render: (row) => format(new Date(row.expenseDate), 'MMM dd, yyyy') },
    { header: 'Description', render: (row) => <div><p className="font-medium">{row.description}</p>{row.vendor && <p className="text-xs text-gray-500">Vendor: {row.vendor}</p>}</div> },
    { header: 'Category', render: (row) => getCategoryBadge(row.category) },
    { header: 'Amount', render: (row) => <span className="font-semibold text-red-600">{formatCurrency(row.amount)}</span> },
    { header: 'Approved By', render: (row) => row.ApprovedBy?.firstName || '-' },
    { header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Link to={`/expenses/${row.id}/edit`} className="p-2 hover:bg-gray-100 rounded-lg text-blue-600"><Edit size={16} /></Link>
        <button onClick={() => { if (window.confirm('Delete this expense?')) deleteMutation.mutate(row.id); }} className="p-2 hover:bg-gray-100 rounded-lg text-red-600"><Trash2 size={16} /></button>
      </div>
    )}
  ];

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Link to="/expenses/new" className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Expense</Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter size={18} className="text-gray-400" />
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="select w-40">
            <option value="">All Categories</option>
            <option value="utilities">Utilities</option>
            <option value="supplies">Supplies</option>
            <option value="maintenance">Maintenance</option>
            <option value="transport">Transport</option>
            <option value="other">Other</option>
          </select>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="input w-40" />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="input w-40" />
        </div>
      </div>

      {/* Summary */}
      <div className="card bg-red-50">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-red-100"><Receipt className="text-red-600" size={20} /></div>
          <div><p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p><p className="text-sm text-red-600">Total Expenses (Current View)</p></div>
        </div>
      </div>

      <DataTable columns={columns} data={expenses} loading={isLoading} pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export default Expenses;
