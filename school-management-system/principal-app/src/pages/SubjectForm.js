import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectService, teacherService, classService } from '../services/api';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

const SubjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const { register, handleSubmit, setValue } = useForm();

  const { data: subject } = useQuery({ queryKey: ['subject', id], queryFn: () => subjectService.getById(id), enabled: isEdit });
  const { data: teachers } = useQuery({ queryKey: ['teachers'], queryFn: () => teacherService.getAll({ limit: 100 }) });
  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: () => classService.getAll() });

  useEffect(() => {
    if (subject?.data?.data) {
      const s = subject.data.data;
      setValue('name', s.name);
      setValue('code', s.code);
      setValue('description', s.description);
      setValue('creditHours', s.creditHours);
      setValue('teacherIds', s.teachers?.map(t => t.userId) || []);
      setValue('classIds', s.classes?.map(c => c.id) || []);
    }
  }, [subject, setValue]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? subjectService.update(id, data) : subjectService.create(data),
    onSuccess: () => { toast.success(isEdit ? 'Subject updated' : 'Subject created'); queryClient.invalidateQueries(['subjects']); navigate('/subjects'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/subjects')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Subject' : 'Add Subject'}</h1>
      </div>
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium mb-2">Name *</label><input {...register('name', { required: true })} className="input" placeholder="Mathematics" /></div>
          <div><label className="block text-sm font-medium mb-2">Code</label><input {...register('code')} className="input" placeholder="MATH101" /></div>
          <div><label className="block text-sm font-medium mb-2">Credit Hours</label><input {...register('creditHours', { valueAsNumber: true })} type="number" className="input" defaultValue={1} /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">Description</label><textarea {...register('description')} className="input" rows={3} /></div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Assign Teachers</label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {teachers?.data?.data?.map(t => (
                <label key={t.id} className="flex items-center gap-2"><input type="checkbox" value={t.id} {...register('teacherIds')} className="rounded" /><span className="text-sm">{t.firstName} {t.lastName}</span></label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Assign to Classes</label>
            <div className="grid grid-cols-4 gap-2">
              {classes?.data?.data?.map(c => (
                <label key={c.id} className="flex items-center gap-2"><input type="checkbox" value={c.id} {...register('classIds')} className="rounded" /><span className="text-sm">{c.name}</span></label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button type="button" onClick={() => navigate('/subjects')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
};

export default SubjectForm;
