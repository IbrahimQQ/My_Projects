import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService, classService, subjectService } from '../services/api';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

const StudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const { data: student } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentService.getById(id),
    enabled: isEdit,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.getAll(),
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectService.getAll(),
  });

  useEffect(() => {
    if (student?.data?.data) {
      const s = student.data.data;
      Object.keys(s).forEach(key => {
        if (key !== 'subjects' && key !== 'parents') {
          setValue(key, s[key]);
        }
      });
      setValue('subjectIds', s.subjects?.map(sub => sub.id) || []);
    }
  }, [student, setValue]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? studentService.update(id, data) : studentService.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Student updated' : 'Student created');
      queryClient.invalidateQueries(['students']);
      navigate('/students');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to save student');
    },
  });

  const onSubmit = (data) => mutation.mutate(data);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/students')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Student' : 'Add Student'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            <input {...register('firstName', { required: 'Required' })} className="input" />
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <input {...register('lastName', { required: 'Required' })} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input {...register('email')} type="email" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input {...register('phone')} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input {...register('dateOfBirth')} type="date" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select {...register('gender')} className="input">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select {...register('classId')} className="input">
              <option value="">Select Class</option>
              {classes?.data?.data?.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea {...register('address')} className="input" rows={2} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
            <div className="grid grid-cols-3 gap-2">
              {subjects?.data?.data?.map(subject => (
                <label key={subject.id} className="flex items-center gap-2">
                  <input type="checkbox" value={subject.id} {...register('subjectIds')} className="rounded" />
                  <span className="text-sm">{subject.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button type="button" onClick={() => navigate('/students')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;
