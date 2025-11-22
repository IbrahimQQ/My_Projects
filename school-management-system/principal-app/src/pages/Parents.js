import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { parentService } from '../services/api';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';
import { Plus, Search, Edit, Trash2, Key } from 'lucide-react';
import Modal from '../components/Modal';

const Parents = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, parent: null });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['parents', page, search],
    queryFn: () => parentService.getAll({ page, limit: 20, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => parentService.delete(id),
    onSuccess: () => {
      toast.success('Parent deactivated');
      queryClient.invalidateQueries(['parents']);
      setDeleteModal({ open: false, parent: null });
    },
  });

  const columns = [
    {
      header: 'Parent',
      accessor: 'firstName',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-medium">{row.firstName?.[0]}{row.lastName?.[0]}</span>
          </div>
          <div>
            <p className="font-medium">{row.firstName} {row.lastName}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Phone', accessor: 'phone', render: (phone) => phone || 'N/A' },
    {
      header: 'Children',
      accessor: 'parentProfile',
      render: (profile) => profile?.children?.length || 0,
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (isActive) => (
        <span className={`px-2 py-1 rounded-full text-xs ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/parents/${id}/edit`)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit size={16} /></button>
          <button onClick={() => setDeleteModal({ open: true, parent: row })} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parents</h1>
          <p className="text-gray-500">Manage parent accounts</p>
        </div>
        <button onClick={() => navigate('/parents/new')} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> Add Parent
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search parents..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
          </div>
        </div>
        <DataTable columns={columns} data={data?.data?.data || []} loading={isLoading} pagination={data?.data?.pagination} onPageChange={setPage} />
      </div>

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, parent: null })} title="Deactivate Parent">
        <p className="text-gray-600 mb-6">Deactivate {deleteModal.parent?.firstName} {deleteModal.parent?.lastName}?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteModal({ open: false, parent: null })} className="btn-secondary">Cancel</button>
          <button onClick={() => deleteMutation.mutate(deleteModal.parent?.id)} className="btn-danger">{deleteMutation.isPending ? 'Deactivating...' : 'Deactivate'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Parents;
