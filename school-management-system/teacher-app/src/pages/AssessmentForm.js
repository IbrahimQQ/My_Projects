import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentService, classService, subjectService, questionService } from '../services/api';
import { useAuthStore } from '../context/authStore';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';

const AssessmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const { register, handleSubmit, setValue, watch } = useForm();

  const { data: assessment } = useQuery({ queryKey: ['assessment', id], queryFn: () => assessmentService.getById(id), enabled: isEdit });
  const { data: subjects } = useQuery({ queryKey: ['my-subjects'], queryFn: () => subjectService.getAll({ teacherId: user?.id }) });
  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: () => classService.getAll() });
  const selectedSubject = watch('subjectId');
  const { data: questions } = useQuery({ queryKey: ['questions', selectedSubject], queryFn: () => questionService.getAll({ subjectId: selectedSubject }), enabled: !!selectedSubject });

  useEffect(() => {
    if (assessment?.data?.data) {
      const a = assessment.data.data;
      Object.keys(a).forEach(key => { if (key !== 'questions') setValue(key, a[key]); });
      setValue('questionIds', a.questions || []);
    }
  }, [assessment, setValue]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? assessmentService.update(id, data) : assessmentService.create(data),
    onSuccess: () => { toast.success(isEdit ? 'Assessment updated' : 'Assessment created'); queryClient.invalidateQueries(['assessments']); navigate('/assessments'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/assessments')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Assessment' : 'Create Assessment'}</h1>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium mb-2">Title *</label><input {...register('title', { required: true })} className="input" placeholder="Midterm Exam" /></div>
          <div><label className="block text-sm font-medium mb-2">Type *</label>
            <select {...register('type', { required: true })} className="input">
              <option value="">Select</option>
              <option value="quiz">Quiz</option>
              <option value="test">Test</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-2">Subject *</label>
            <select {...register('subjectId', { required: true })} className="input">
              <option value="">Select</option>
              {subjects?.data?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-2">Class *</label>
            <select {...register('classId', { required: true })} className="input">
              <option value="">Select</option>
              {classes?.data?.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-2">Total Marks *</label><input {...register('totalMarks', { required: true, valueAsNumber: true })} type="number" className="input" /></div>
          <div><label className="block text-sm font-medium mb-2">Passing Marks</label><input {...register('passingMarks', { valueAsNumber: true })} type="number" className="input" /></div>
          <div><label className="block text-sm font-medium mb-2">Duration (minutes)</label><input {...register('duration', { valueAsNumber: true })} type="number" className="input" /></div>
          <div><label className="block text-sm font-medium mb-2">Scheduled Date</label><input {...register('scheduledDate')} type="datetime-local" className="input" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">Instructions</label><textarea {...register('instructions')} className="input" rows={3} /></div>
          {questions?.data?.data?.length > 0 && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Select Questions from Bank</label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                {questions.data.data.map(q => (
                  <label key={q.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded">
                    <input type="checkbox" value={q.id} {...register('questionIds')} className="mt-1 rounded" />
                    <div><p className="text-sm">{q.question.slice(0, 100)}...</p><p className="text-xs text-gray-500">{q.type} | {q.marks} marks | {q.difficulty}</p></div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button type="button" onClick={() => navigate('/assessments')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
};

export default AssessmentForm;
