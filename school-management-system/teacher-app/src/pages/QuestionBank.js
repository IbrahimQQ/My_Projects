import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionService, subjectService } from '../services/api';
import { useAuthStore } from '../context/authStore';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, FileQuestion } from 'lucide-react';
import { useForm } from 'react-hook-form';

const BLOOMS_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const QUESTION_TYPES = ['mcq', 'theory', 'essay', 'short_answer', 'true_false'];

const QuestionBank = () => {
  const { user } = useAuthStore();
  const [modal, setModal] = useState({ open: false, question: null });
  const [filters, setFilters] = useState({ subjectId: '', type: '', difficulty: '' });
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: subjects } = useQuery({ queryKey: ['my-subjects'], queryFn: () => subjectService.getAll({ teacherId: user?.id }) });
  const { data: questions, isLoading } = useQuery({ queryKey: ['questions', filters], queryFn: () => questionService.getAll(filters) });

  const createMutation = useMutation({
    mutationFn: (data) => modal.question ? questionService.update(modal.question.id, data) : questionService.create(data),
    onSuccess: () => { toast.success(modal.question ? 'Question updated' : 'Question created'); queryClient.invalidateQueries(['questions']); setModal({ open: false, question: null }); reset(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => questionService.delete(id),
    onSuccess: () => { toast.success('Question deleted'); queryClient.invalidateQueries(['questions']); },
  });

  const openModal = (question = null) => {
    if (question) Object.keys(question).forEach(key => setValue(key, question[key]));
    else reset();
    setModal({ open: true, question });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Question Bank</h1><p className="text-gray-500">Create and manage questions</p></div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2"><Plus size={20} /> Add Question</button>
      </div>

      <div className="card">
        <div className="flex gap-4 mb-6">
          <select value={filters.subjectId} onChange={(e) => setFilters(f => ({ ...f, subjectId: e.target.value }))} className="input max-w-xs">
            <option value="">All Subjects</option>
            {subjects?.data?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))} className="input max-w-xs">
            <option value="">All Types</option>
            {QUESTION_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
          <select value={filters.difficulty} onChange={(e) => setFilters(f => ({ ...f, difficulty: e.target.value }))} className="input max-w-xs">
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {isLoading && <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded" />)}</div>}

        <div className="space-y-3">
          {questions?.data?.data?.map(q => (
            <div key={q.id} className="p-4 border rounded-lg hover:border-primary-200 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium">{q.question.slice(0, 150)}{q.question.length > 150 ? '...' : ''}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{q.type}</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded">{q.difficulty}</span>
                    <span>{q.marks} marks</span>
                    {q.bloomsLevel && <span className="capitalize">{q.bloomsLevel}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openModal(q)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit size={16} /></button>
                  <button onClick={() => deleteMutation.mutate(q.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isLoading && (!questions?.data?.data || questions.data.data.length === 0) && <div className="text-center py-12"><FileQuestion size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No questions yet</p></div>}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b"><h2 className="text-lg font-semibold">{modal.question ? 'Edit Question' : 'Add Question'}</h2></div>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-2">Question *</label><textarea {...register('question', { required: true })} className="input" rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2">Type *</label><select {...register('type', { required: true })} className="input">{QUESTION_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-2">Subject *</label><select {...register('subjectId', { required: true })} className="input">{subjects?.data?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-2">Difficulty</label><select {...register('difficulty')} className="input">{DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-2">Bloom's Level</label><select {...register('bloomsLevel')} className="input"><option value="">Select</option>{BLOOMS_LEVELS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-2">Marks</label><input {...register('marks', { valueAsNumber: true })} type="number" className="input" defaultValue={1} /></div>
                <div><label className="block text-sm font-medium mb-2">Expected Time (min)</label><input {...register('expectedTime', { valueAsNumber: true })} type="number" className="input" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-2">Topic</label><input {...register('topic')} className="input" /></div>
              <div><label className="block text-sm font-medium mb-2">Explanation</label><textarea {...register('explanation')} className="input" rows={2} /></div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setModal({ open: false, question: null })} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
