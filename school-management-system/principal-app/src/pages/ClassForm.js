import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classService, subjectService, academicYearService } from '../services/api';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

const ClassForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const { data: cls } = useQuery({ queryKey: ['class', id], queryFn: () => classService.getById(id), enabled: isEdit });
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectService.getAll() });
  const { data: academicYears } = useQuery({ queryKey: ['academic-years'], queryFn: () => academicYearService.getAll() });

  useEffect(() => {
    if (cls?.data?.data) {
      const c = cls.data.data;
      setValue('name', c.name);
      setValue('grade', c.grade);
      setValue('section', c.section);
      setValue('capacity', c.capacity);
      setValue('room', c.room);
      setValue('academicYearId', c.academicYearId);
      setValue('subjectIds', c.subjects?.map(s => s.id) || []);
    }
  }, [cls, setValue]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? classService.update(id, data) : classService.create(data),
    onSuccess: () => { toast.success(isEdit ? 'Class updated' : 'Class created'); queryClient.invalidateQueries(['classes']); navigate('/classes'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/classes')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Class' : 'Add Class'}</h1>
      </div>
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium mb-2">Name *</label><input {...register('name', { required: true })} className="input" placeholder="Grade 10A" /></div>
          <div><label className="block text-sm font-medium mb-2">Grade *</label><input {...register('grade', { required: true })} className="input" placeholder="10" /></div>
          <div><label className="block text-sm font-medium mb-2">Section</label><input {...register('section')} className="input" placeholder="A" /></div>
          <div><label className="block text-sm font-medium mb-2">Room</label><input {...register('room')} className="input" placeholder="Room 101" /></div>
          <div><label className="block text-sm font-medium mb-2">Capacity</label><input {...register('capacity', { valueAsNumber: true })} type="number" className="input" defaultValue={30} /></div>
          <div>
            <label className="block text-sm font-medium mb-2">Academic Year</label>
            <select {...register('academicYearId')} className="input">
              <option value="">Select</option>
              {academicYears?.data?.data?.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Subjects</label>
            <div className="grid grid-cols-4 gap-2">
              {subjects?.data?.data?.map(s => (
                <label key={s.id} className="flex items-center gap-2"><input type="checkbox" value={s.id} {...register('subjectIds')} className="rounded" /><span className="text-sm">{s.name}</span></label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button type="button" onClick={() => navigate('/classes')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
};

export default ClassForm;
