import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { assessmentService } from '../services/api';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, FileCheck } from 'lucide-react';

const Assessments = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['assessments'], queryFn: () => assessmentService.getAll() });

  const deleteMutation = useMutation({
    mutationFn: (id) => assessmentService.delete(id),
    onSuccess: () => { toast.success('Assessment deleted'); queryClient.invalidateQueries(['assessments']); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Assessments</h1><p className="text-gray-500">Create and manage tests</p></div>
        <button onClick={() => navigate('/assessments/new')} className="btn-primary flex items-center gap-2"><Plus size={20} /> Create Assessment</button>
      </div>

      {isLoading && <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse"><div className="h-20 bg-gray-200 rounded" /></div>)}</div>}

      <div className="space-y-4">
        {data?.data?.data?.map(assessment => (
          <div key={assessment.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{assessment.title}</h3>
                <p className="text-sm text-gray-500">{assessment.Subject?.name} - {assessment.Class?.name}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span>Total: {assessment.totalMarks} marks</span>
                  <span>Duration: {assessment.duration} min</span>
                  <span className={`px-2 py-0.5 rounded ${assessment.status === 'graded' ? 'bg-green-100 text-green-700' : assessment.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{assessment.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {assessment.status === 'active' && <button onClick={() => navigate(`/assessments/${assessment.id}/grade`)} className="btn-primary text-sm flex items-center gap-1"><FileCheck size={16} /> Grade</button>}
                <button onClick={() => navigate(`/assessments/${assessment.id}/edit`)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit size={16} /></button>
                <button onClick={() => deleteMutation.mutate(assessment.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && (!data?.data?.data || data.data.data.length === 0) && <div className="card text-center py-12"><FileCheck size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No assessments yet</p></div>}
    </div>
  );
};

export default Assessments;
