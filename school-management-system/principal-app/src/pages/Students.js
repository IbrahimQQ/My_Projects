import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { studentService, classService } from '../services/api';
import DataTable from '../components/DataTable';
import { toast } from 'react-toastify';
import { Plus, Search, Edit, Eye, Archive, Upload, Download } from 'lucide-react';
import Modal from '../components/Modal';

const Students = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [classFilter, setClassFilter] = useState('');
  const [archiveModal, setArchiveModal] = useState({ open: false, student: null });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search, classFilter],
    queryFn: () => studentService.getAll({ page, limit: 20, search, classId: classFilter || undefined }),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.getAll(),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => studentService.archive(id),
    onSuccess: () => {
      toast.success('Student archived successfully');
      queryClient.invalidateQueries(['students']);
      setArchiveModal({ open: false, student: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to archive student');
    },
  });

  const importMutation = useMutation({
    mutationFn: (file) => studentService.import(file),
    onSuccess: (response) => {
      const { success, failed } = response.data.data;
      toast.success(`Import complete: ${success} succeeded, ${failed} failed`);
      queryClient.invalidateQueries(['students']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Import failed');
    },
  });

  const handleExport = async () => {
    try {
      const response = await studentService.export({ classId: classFilter || undefined, format: 'xlsx' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  const columns = [
    {
      header: 'Student',
      accessor: 'firstName',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {row.firstName?.[0]}{row.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium">{row.firstName} {row.lastName}</p>
            <p className="text-sm text-gray-500">{row.studentId}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Class',
      accessor: 'Class',
      render: (cls) => cls?.name || 'Unassigned',
    },
    {
      header: 'Gender',
      accessor: 'gender',
      render: (gender) => gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'N/A',
    },
    {
      header: 'Parents',
      accessor: 'parents',
      render: (parents) => parents?.length || 0,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (status) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'active' ? 'bg-green-100 text-green-700' :
            status === 'graduated' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/students/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => navigate(`/students/${id}/edit`)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => setArchiveModal({ open: true, student: row })}
            className="p-2 hover:bg-orange-50 rounded-lg text-orange-600"
            title="Archive"
          >
            <Archive size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500">Manage student profiles and enrollments</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload size={20} />
            Import
          </button>
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={20} />
            Export
          </button>
          <button
            onClick={() => navigate('/students/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Student
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">All Classes</option>
            {classes?.data?.data?.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          columns={columns}
          data={data?.data?.data || []}
          loading={isLoading}
          pagination={data?.data?.pagination}
          onPageChange={setPage}
          emptyMessage="No students found"
        />
      </div>

      <Modal
        isOpen={archiveModal.open}
        onClose={() => setArchiveModal({ open: false, student: null })}
        title="Archive Student"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to archive{' '}
          <span className="font-medium">
            {archiveModal.student?.firstName} {archiveModal.student?.lastName}
          </span>
          ?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setArchiveModal({ open: false, student: null })}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => archiveMutation.mutate(archiveModal.student?.id)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            disabled={archiveMutation.isPending}
          >
            {archiveMutation.isPending ? 'Archiving...' : 'Archive'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Students;
