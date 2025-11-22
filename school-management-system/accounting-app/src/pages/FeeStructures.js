import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { feeStructureService } from '../services/api';
import DataTable from '../components/DataTable';
import { Plus, Edit, Trash2, Building } from 'lucide-react';

const FeeStructures = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['fee-structures', page], queryFn: () => feeStructureService.getAll({ page, limit: 10 }) });
  const deleteMutation = useMutation({ mutationFn: (id) => feeStructureService.delete(id), onSuccess: () => queryClient.invalidateQueries(['fee-structures']) });

  const feeStructures = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const columns = [
    { header: 'Name', render: (row) => <div><p className="font-medium">{row.name}</p><p className="text-xs text-gray-500">{row.description}</p></div> },
    { header: 'Class', render: (row) => row.Class?.name || 'All Classes' },
    { header: 'Amount', render: (row) => <span className="font-semibold text-primary-600">{formatCurrency(row.amount)}</span> },
    { header: 'Frequency', render: (row) => <span className="px-2 py-1 text-xs rounded-full bg-gray-100 capitalize">{row.frequency}</span> },
    { header: 'Status', render: (row) => <span className={`px-2 py-1 text-xs rounded-full ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{row.isActive ? 'Active' : 'Inactive'}</span> },
    { header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Link to={`/fee-structures/${row.id}/edit`} className="p-2 hover:bg-gray-100 rounded-lg text-blue-600"><Edit size={16} /></Link>
        <button onClick={() => { if (window.confirm('Delete this fee structure?')) deleteMutation.mutate(row.id); }} className="p-2 hover:bg-gray-100 rounded-lg text-red-600"><Trash2 size={16} /></button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fee Structures</h1>
        <Link to="/fee-structures/new" className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Fee Structure</Link>
      </div>

      {feeStructures.length === 0 && !isLoading ? (
        <div className="card text-center py-12">
          <Building size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">No fee structures defined yet</p>
          <Link to="/fee-structures/new" className="btn-primary">Create Fee Structure</Link>
        </div>
      ) : (
        <DataTable columns={columns} data={feeStructures} loading={isLoading} pagination={pagination} onPageChange={setPage} />
      )}
    </div>
  );
};

export default FeeStructures;
