import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { invoiceService } from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Eye, FileText, Filter } from 'lucide-react';
import { format } from 'date-fns';

const Invoices = () => {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: searchParams.get('status') || '', search: '' });
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({ classId: '', feeStructureId: '', dueDate: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['invoices', page, filters], queryFn: () => invoiceService.getAll({ page, limit: 10, ...filters }) });

  const bulkMutation = useMutation({
    mutationFn: (data) => invoiceService.generateBulk(data),
    onSuccess: () => { queryClient.invalidateQueries(['invoices']); setShowBulkModal(false); }
  });

  const invoices = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const getStatusBadge = (status) => {
    const styles = { paid: 'bg-green-100 text-green-700', partial: 'bg-yellow-100 text-yellow-700', pending: 'bg-orange-100 text-orange-700', overdue: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-600' };
    return <span className={`px-2 py-1 text-xs rounded-full capitalize ${styles[status] || styles.pending}`}>{status}</span>;
  };

  const columns = [
    { header: 'Invoice #', render: (row) => <span className="font-mono text-sm">{row.invoiceNumber}</span> },
    { header: 'Student', render: (row) => <div><p className="font-medium">{row.Student?.firstName} {row.Student?.lastName}</p><p className="text-xs text-gray-500">{row.Student?.Class?.name}</p></div> },
    { header: 'Amount', render: (row) => <span className="font-semibold">{formatCurrency(row.totalAmount)}</span> },
    { header: 'Balance', render: (row) => <span className={parseFloat(row.balanceAmount) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>{formatCurrency(row.balanceAmount)}</span> },
    { header: 'Due Date', render: (row) => format(new Date(row.dueDate), 'MMM dd, yyyy') },
    { header: 'Status', render: (row) => getStatusBadge(row.status) },
    { header: 'Actions', render: (row) => (
      <Link to={`/invoices/${row.id}`} className="p-2 hover:bg-gray-100 rounded-lg text-primary-600 inline-flex"><Eye size={16} /></Link>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowBulkModal(true)} className="btn-secondary flex items-center gap-2"><FileText size={18} /> Generate Bulk</button>
          <Link to="/invoices/new" className="btn-primary flex items-center gap-2"><Plus size={18} /> New Invoice</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter size={18} className="text-gray-400" />
          <input type="text" placeholder="Search student..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="input w-48" />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="select w-40">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={invoices} loading={isLoading} pagination={pagination} onPageChange={setPage} />

      {/* Bulk Generate Modal */}
      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Generate Bulk Invoices">
        <form onSubmit={(e) => { e.preventDefault(); bulkMutation.mutate(bulkForm); }} className="space-y-4">
          <div>
            <label className="label">Class</label>
            <select value={bulkForm.classId} onChange={(e) => setBulkForm({ ...bulkForm, classId: e.target.value })} className="select" required>
              <option value="">Select Class</option>
            </select>
          </div>
          <div>
            <label className="label">Fee Structure</label>
            <select value={bulkForm.feeStructureId} onChange={(e) => setBulkForm({ ...bulkForm, feeStructureId: e.target.value })} className="select" required>
              <option value="">Select Fee</option>
            </select>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" value={bulkForm.dueDate} onChange={(e) => setBulkForm({ ...bulkForm, dueDate: e.target.value })} className="input" required />
          </div>
          {bulkMutation.error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{bulkMutation.error.response?.data?.message || 'Error generating invoices'}</div>}
          <div className="flex gap-3">
            <button type="submit" disabled={bulkMutation.isPending} className="btn-primary">{bulkMutation.isPending ? 'Generating...' : 'Generate Invoices'}</button>
            <button type="button" onClick={() => setShowBulkModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Invoices;
