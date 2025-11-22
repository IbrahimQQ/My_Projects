import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherService, subjectService } from '../services/api';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

const TeacherForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

  const { data: teacher } = useQuery({
    queryKey: ['teacher', id],
    queryFn: () => teacherService.getById(id),
    enabled: isEdit,
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectService.getAll(),
  });

  useEffect(() => {
    if (teacher?.data?.data) {
      const t = teacher.data.data;
      setValue('firstName', t.firstName);
      setValue('lastName', t.lastName);
      setValue('email', t.email);
      setValue('phone', t.phone);
      setValue('employeeId', t.teacherProfile?.employeeId);
      setValue('qualification', t.teacherProfile?.qualification);
      setValue('specialization', t.teacherProfile?.specialization);
      setValue('experience', t.teacherProfile?.experience);
      setValue('salary', t.teacherProfile?.salary);
      setValue('address', t.teacherProfile?.address);
      setValue('subjectIds', t.teacherProfile?.subjects?.map(s => s.id) || []);
    }
  }, [teacher, setValue]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? teacherService.update(id, data) : teacherService.create(data),
    onSuccess: (response) => {
      toast.success(isEdit ? 'Teacher updated successfully' : 'Teacher created successfully');
      if (!isEdit && response.data.data.temporaryPassword) {
        toast.info(`Temporary password: ${response.data.data.temporaryPassword}`, { autoClose: false });
      }
      queryClient.invalidateQueries(['teachers']);
      navigate('/teachers');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to save teacher');
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/teachers')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Teacher' : 'Add New Teacher'}
          </h1>
          <p className="text-gray-500">
            {isEdit ? 'Update teacher information' : 'Create a new teacher account'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              {...register('firstName', { required: 'First name is required' })}
              className="input"
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              {...register('lastName', { required: 'Last name is required' })}
              className="input"
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
              })}
              type="email"
              className="input"
              placeholder="john.doe@school.com"
              disabled={isEdit}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              {...register('phone')}
              className="input"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID
            </label>
            <input
              {...register('employeeId')}
              className="input"
              placeholder="EMP001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qualification
            </label>
            <input
              {...register('qualification')}
              className="input"
              placeholder="M.Ed, B.Sc"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialization
            </label>
            <input
              {...register('specialization')}
              className="input"
              placeholder="Mathematics"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience (years)
            </label>
            <input
              {...register('experience', { valueAsNumber: true })}
              type="number"
              className="input"
              placeholder="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salary
            </label>
            <input
              {...register('salary', { valueAsNumber: true })}
              type="number"
              className="input"
              placeholder="50000"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              {...register('address')}
              className="input"
              rows={3}
              placeholder="123 Main St, City, State"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Subjects
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {subjects?.data?.data?.map((subject) => (
                <label key={subject.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={subject.id}
                    {...register('subjectIds')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{subject.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/teachers')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Teacher' : 'Create Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherForm;
