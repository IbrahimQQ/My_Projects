import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { paymentService } from '../services/api';
import DataTable from '../components/DataTable';
import { Plus, Receipt, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';

const Payments = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ method: '', startDate: '', endDate: '' });

  const { data, isLoading } = useQuery({ queryKey: ['payments', page, filters], queryFn: () => paymentService.getAll({ page, limit: 10, ...filters }) });

  const payments = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const getMethodBadge = (method) => {
    const styles = { cash: 'bg-green-100 text-green-700', card: 'bg-blue-100 text-blue-700', bank_transfer: 'bg-purple-100 text-purple-700', check: 'bg-orange-100 text-orange-700', mobile: 'bg-teal-100 text-teal-700' };
    return <span className={`px-2 py-1 text-xs rounded-full capitalize ${styles[method] || 'bg-gray-100'}`}>{method?.replace('_', ' ')}</span>;
  };

  const columns = [
    { header: 'Receipt #', render: (row) => <span className="font-mono text-sm">{row.receiptNumber}</span> },
    { header: 'Student', render: (row) => <div><p className="font-medium">{row.Invoice?.Student?.firstName} {row.Invoice?.Student?.lastName}</p><p className="text-xs text-gray-500">Invoice #{row.Invoice?.invoiceNumber}</p></div> },
    { header: 'Amount', render: (row) => <span className="font-semibold text-green-600">{formatCurrency(row.amount)}</span> },
    { header: 'Method', render: (row) => getMethodBadge(row.method) },
    { header: 'Date', render: (row) => format(new Date(row.paymentDate), 'MMM dd, yyyy') },
    { header: 'Received By', render: (row) => row.ReceivedBy?.firstName || '-' },
    { header: 'Actions', render: (row) => (
      <button onClick={() => window.open(`/api/accounting/payments/${row.id}/receipt`)} className="p-2 hover:bg-gray-100 rounded-lg text-primary-600"><Receipt size={16} /></button>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Payments</h1>
        <Link to="/payments/new" className="btn-primary flex items-center gap-2"><Plus size={18} /> Record Payment</Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter size={18} className="text-gray-400" />
          <select value={filters.method} onChange={(e) => setFilters({ ...filters, method: e.target.value })} className="select w-40">
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="check">Check</option>
            <option value="mobile">Mobile</option>
          </select>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="input w-40" placeholder="Start Date" />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="input w-40" placeholder="End Date" />
          <button className="btn-secondary flex items-center gap-2 ml-auto"><Download size={18} /> Export</button>
        </div>
      </div>

      <DataTable columns={columns} data={payments} loading={isLoading} pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export default Payments;
