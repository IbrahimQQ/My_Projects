import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { teacherService } from '../services/api';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';
import { Plus, Search, Edit, Trash2, Key } from 'lucide-react';
import Modal from '../components/Modal';

const Teachers = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, teacher: null });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', page, search],
    queryFn: () => teacherService.getAll({ page, limit: 20, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => teacherService.delete(id),
    onSuccess: () => {
      toast.success('Teacher deactivated successfully');
      queryClient.invalidateQueries(['teachers']);
      setDeleteModal({ open: false, teacher: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to deactivate teacher');
    },
  });

  const generateCredsMutation = useMutation({
    mutationFn: (id) => teacherService.generateCredentials?.(id),
    onSuccess: (response) => {
      const { email, temporaryPassword } = response.data.data;
      toast.success(`New credentials generated! Password: ${temporaryPassword}`);
    },
    onError: () => {
      toast.error('Failed to generate credentials');
    },
  });

  const columns = [
    {
      header: 'Name',
      accessor: 'firstName',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-600 font-medium">
              {row.firstName?.[0]}{row.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium">{row.firstName} {row.lastName}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Employee ID',
      accessor: 'teacherProfile',
      render: (profile) => profile?.employeeId || 'N/A',
    },
    {
      header: 'Subjects',
      accessor: 'teacherProfile',
      render: (profile) => (
        <div className="flex flex-wrap gap-1">
          {profile?.subjects?.slice(0, 2).map((subject) => (
            <span
              key={subject.id}
              className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
            >
              {subject.name}
            </span>
          ))}
          {profile?.subjects?.length > 2 && (
            <span className="text-xs text-gray-500">
              +{profile.subjects.length - 2} more
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (isActive) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/teachers/${id}/edit`)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => generateCredsMutation.mutate(id)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Generate Credentials"
          >
            <Key size={16} />
          </button>
          <button
            onClick={() => setDeleteModal({ open: true, teacher: row })}
            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500">Manage teacher accounts and assignments</p>
        </div>
        <button
          onClick={() => navigate('/teachers/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Teacher
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.data?.data || []}
          loading={isLoading}
          pagination={data?.data?.pagination}
          onPageChange={setPage}
          emptyMessage="No teachers found"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, teacher: null })}
        title="Deactivate Teacher"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to deactivate{' '}
          <span className="font-medium">
            {deleteModal.teacher?.firstName} {deleteModal.teacher?.lastName}
          </span>
          ? They will no longer be able to access the system.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteModal({ open: false, teacher: null })}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteMutation.mutate(deleteModal.teacher?.id)}
            className="btn-danger"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Teachers;
