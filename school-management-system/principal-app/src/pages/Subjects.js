import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { subjectService } from '../services/api';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';

const Subjects = () => {
  const [deleteModal, setDeleteModal] = useState({ open: false, subject: null });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectService.getAll() });

  const deleteMutation = useMutation({
    mutationFn: (id) => subjectService.delete(id),
    onSuccess: () => { toast.success('Subject deleted'); queryClient.invalidateQueries(['subjects']); setDeleteModal({ open: false, subject: null }); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Code', accessor: 'code', render: (c) => c || '-' },
    { header: 'Credit Hours', accessor: 'creditHours' },
    { header: 'Teachers', accessor: 'teachers', render: (t) => t?.length || 0 },
    { header: 'Classes', accessor: 'classes', render: (c) => c?.length || 0 },
    {
      header: 'Actions', accessor: 'id',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/subjects/${id}/edit`)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit size={16} /></button>
          <button onClick={() => setDeleteModal({ open: true, subject: row })} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Subjects</h1><p className="text-gray-500">Manage subjects and curriculum</p></div>
        <button onClick={() => navigate('/subjects/new')} className="btn-primary flex items-center gap-2"><Plus size={20} /> Add Subject</button>
      </div>
      <DataTable columns={columns} data={data?.data?.data || []} loading={isLoading} emptyMessage="No subjects found" />
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, subject: null })} title="Delete Subject">
        <p className="mb-6">Delete subject {deleteModal.subject?.name}?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteModal({ open: false, subject: null })} className="btn-secondary">Cancel</button>
          <button onClick={() => deleteMutation.mutate(deleteModal.subject?.id)} className="btn-danger">{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Subjects;
