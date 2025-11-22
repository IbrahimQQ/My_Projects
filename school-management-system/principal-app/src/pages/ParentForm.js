import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parentService, studentService } from '../services/api';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

const ParentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const { data: parent } = useQuery({ queryKey: ['parent', id], queryFn: () => parentService.getById(id), enabled: isEdit });
  const { data: students } = useQuery({ queryKey: ['students-all'], queryFn: () => studentService.getAll({ limit: 1000 }) });

  useEffect(() => {
    if (parent?.data?.data) {
      const p = parent.data.data;
      setValue('firstName', p.firstName);
      setValue('lastName', p.lastName);
      setValue('email', p.email);
      setValue('phone', p.phone);
      setValue('relationship', p.parentProfile?.relationship);
      setValue('occupation', p.parentProfile?.occupation);
      setValue('address', p.parentProfile?.address);
      setValue('studentIds', p.parentProfile?.children?.map(c => c.id) || []);
      setValue('canViewGrades', p.parentProfile?.canViewGrades);
      setValue('canViewAttendance', p.parentProfile?.canViewAttendance);
      setValue('canViewAssessments', p.parentProfile?.canViewAssessments);
      setValue('canMessageTeachers', p.parentProfile?.canMessageTeachers);
    }
  }, [parent, setValue]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? parentService.update(id, data) : parentService.create(data),
    onSuccess: (res) => {
      toast.success(isEdit ? 'Parent updated' : 'Parent created');
      if (!isEdit && res.data.data.temporaryPassword) {
        toast.info(`Password: ${res.data.data.temporaryPassword}`, { autoClose: false });
      }
      queryClient.invalidateQueries(['parents']);
      navigate('/parents');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/parents')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Parent' : 'Add Parent'}</h1>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium mb-2">First Name *</label><input {...register('firstName', { required: true })} className="input" /></div>
          <div><label className="block text-sm font-medium mb-2">Last Name *</label><input {...register('lastName', { required: true })} className="input" /></div>
          <div><label className="block text-sm font-medium mb-2">Email *</label><input {...register('email', { required: true })} type="email" className="input" disabled={isEdit} /></div>
          <div><label className="block text-sm font-medium mb-2">Phone</label><input {...register('phone')} className="input" /></div>
          <div>
            <label className="block text-sm font-medium mb-2">Relationship *</label>
            <select {...register('relationship', { required: true })} className="input">
              <option value="">Select</option>
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Guardian</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-2">Occupation</label><input {...register('occupation')} className="input" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">Address</label><textarea {...register('address')} className="input" rows={2} /></div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Link Children</label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {students?.data?.data?.map(s => (
                <label key={s.id} className="flex items-center gap-2">
                  <input type="checkbox" value={s.id} {...register('studentIds')} className="rounded" />
                  <span className="text-sm">{s.firstName} {s.lastName}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Permissions</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" {...register('canViewGrades')} defaultChecked className="rounded" /><span className="text-sm">View Grades</span></label>
              <label className="flex items-center gap-2"><input type="checkbox" {...register('canViewAttendance')} defaultChecked className="rounded" /><span className="text-sm">View Attendance</span></label>
              <label className="flex items-center gap-2"><input type="checkbox" {...register('canViewAssessments')} defaultChecked className="rounded" /><span className="text-sm">View Assessments</span></label>
              <label className="flex items-center gap-2"><input type="checkbox" {...register('canMessageTeachers')} defaultChecked className="rounded" /><span className="text-sm">Message Teachers</span></label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button type="button" onClick={() => navigate('/parents')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
};

export default ParentForm;
