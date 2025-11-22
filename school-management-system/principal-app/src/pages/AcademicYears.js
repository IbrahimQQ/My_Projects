import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicYearService } from '../services/api';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';

const AcademicYears = () => {
  const [expanded, setExpanded] = useState({});
  const [modal, setModal] = useState({ open: false, type: null, data: null });
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data, isLoading } = useQuery({ queryKey: ['academic-years'], queryFn: () => academicYearService.getAll() });

  const createYearMutation = useMutation({
    mutationFn: (data) => academicYearService.create(data),
    onSuccess: () => { toast.success('Academic year created'); queryClient.invalidateQueries(['academic-years']); setModal({ open: false, type: null, data: null }); reset(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const createTermMutation = useMutation({
    mutationFn: ({ yearId, data }) => academicYearService.createTerm(yearId, data),
    onSuccess: () => { toast.success('Term created'); queryClient.invalidateQueries(['academic-years']); setModal({ open: false, type: null, data: null }); reset(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => academicYearService.delete(id),
    onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries(['academic-years']); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const openCreateYear = () => { reset(); setModal({ open: true, type: 'year', data: null }); };
  const openCreateTerm = (yearId) => { reset(); setModal({ open: true, type: 'term', data: { yearId } }); };

  const onSubmit = (formData) => {
    if (modal.type === 'year') {
      createYearMutation.mutate(formData);
    } else if (modal.type === 'term') {
      createTermMutation.mutate({ yearId: modal.data.yearId, data: { ...formData, academicYearId: modal.data.yearId } });
    }
  };

  if (isLoading) return <div className="card animate-pulse"><div className="h-64 bg-gray-200 rounded" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Academic Years</h1><p className="text-gray-500">Manage academic years and terms</p></div>
        <button onClick={openCreateYear} className="btn-primary flex items-center gap-2"><Plus size={20} /> Add Academic Year</button>
      </div>

      <div className="space-y-4">
        {data?.data?.data?.map(year => (
          <div key={year.id} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(e => ({ ...e, [year.id]: !e[year.id] }))}>
                {expanded[year.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <Calendar size={20} className="text-primary-600" />
                <div>
                  <h3 className="font-semibold">{year.name}</h3>
                  <p className="text-sm text-gray-500">{year.startDate} - {year.endDate}</p>
                </div>
                {year.isCurrent && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full ml-2">Current</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openCreateTerm(year.id)} className="btn-secondary text-sm">Add Term</button>
                <button onClick={() => deleteMutation.mutate(year.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
            {expanded[year.id] && year.terms?.length > 0 && (
              <div className="mt-4 pl-10 space-y-2">
                {year.terms.map(term => (
                  <div key={term.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{term.name}</p>
                      <p className="text-sm text-gray-500">{term.startDate} - {term.endDate}</p>
                    </div>
                    {term.isCurrent && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Current</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, type: null, data: null })} title={modal.type === 'year' ? 'Add Academic Year' : 'Add Term'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="block text-sm font-medium mb-2">Name *</label><input {...register('name', { required: true })} className="input" placeholder={modal.type === 'year' ? '2024-2025' : 'Term 1'} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-2">Start Date *</label><input {...register('startDate', { required: true })} type="date" className="input" /></div>
            <div><label className="block text-sm font-medium mb-2">End Date *</label><input {...register('endDate', { required: true })} type="date" className="input" /></div>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" {...register('isCurrent')} className="rounded" /><span className="text-sm">Set as current</span></label>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModal({ open: false, type: null, data: null })} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AcademicYears;
