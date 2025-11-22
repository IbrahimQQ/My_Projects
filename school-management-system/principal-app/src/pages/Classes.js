import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { classService } from '../services/api';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import Modal from '../components/Modal';

const Classes = () => {
  const [deleteModal, setDeleteModal] = useState({ open: false, cls: null });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['classes'], queryFn: () => classService.getAll() });

  const deleteMutation = useMutation({
    mutationFn: (id) => classService.delete(id),
    onSuccess: () => { toast.success('Class deleted'); queryClient.invalidateQueries(['classes']); setDeleteModal({ open: false, cls: null }); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Grade', accessor: 'grade' },
    { header: 'Section', accessor: 'section', render: (s) => s || '-' },
    { header: 'Room', accessor: 'room', render: (r) => r || '-' },
    { header: 'Capacity', accessor: 'capacity' },
    { header: 'Students', accessor: 'students', render: (s) => <span className="flex items-center gap-1"><Users size={14} />{s?.length || 0}</span> },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/classes/${id}/edit`)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit size={16} /></button>
          <button onClick={() => setDeleteModal({ open: true, cls: row })} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Classes</h1><p className="text-gray-500">Manage classes and grades</p></div>
        <button onClick={() => navigate('/classes/new')} className="btn-primary flex items-center gap-2"><Plus size={20} /> Add Class</button>
      </div>
      <DataTable columns={columns} data={data?.data?.data || []} loading={isLoading} emptyMessage="No classes found" />
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, cls: null })} title="Delete Class">
        <p className="text-gray-600 mb-6">Delete class {deleteModal.cls?.name}?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteModal({ open: false, cls: null })} className="btn-secondary">Cancel</button>
          <button onClick={() => deleteMutation.mutate(deleteModal.cls?.id)} className="btn-danger">{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Classes;
