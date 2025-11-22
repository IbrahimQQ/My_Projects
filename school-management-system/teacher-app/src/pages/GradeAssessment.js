import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentService, classService } from '../services/api';
import { toast } from 'react-toastify';
import { ArrowLeft, Save } from 'lucide-react';

const FAILURE_REASONS = [
  { value: 'conceptual_misunderstanding', label: 'Conceptual Misunderstanding' },
  { value: 'calculation_error', label: 'Calculation Error' },
  { value: 'incomplete_answer', label: 'Incomplete Answer' },
  { value: 'time_management', label: 'Time Management' },
  { value: 'careless_mistake', label: 'Careless Mistake' },
  { value: 'not_attempted', label: 'Not Attempted' },
];

const GradeAssessment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scores, setScores] = useState({});

  const { data: assessment } = useQuery({ queryKey: ['assessment', id], queryFn: () => assessmentService.getById(id) });
  const { data: students } = useQuery({
    queryKey: ['class-students', assessment?.data?.data?.classId],
    queryFn: () => classService.getStudents(assessment.data.data.classId),
    enabled: !!assessment?.data?.data?.classId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => assessmentService.recordScores(id, data),
    onSuccess: () => { toast.success('Scores saved!'); queryClient.invalidateQueries(['assessments']); navigate('/assessments'); },
    onError: () => toast.error('Failed to save scores'),
  });

  const handleScoreChange = (studentId, field, value) => setScores(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));

  const handleSubmit = () => {
    const results = Object.entries(scores).map(([studentId, data]) => ({
      studentId,
      marksObtained: parseFloat(data.marks) || 0,
      comments: data.comments,
      questionResults: data.questionResults,
    }));
    saveMutation.mutate({ results });
  };

  const assessmentData = assessment?.data?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/assessments')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold">Grade: {assessmentData?.title}</h1><p className="text-gray-500">Total Marks: {assessmentData?.totalMarks}</p></div>
        </div>
        <button onClick={handleSubmit} disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2"><Save size={20} /> {saveMutation.isPending ? 'Saving...' : 'Save All'}</button>
      </div>

      <div className="space-y-4">
        {students?.data?.data?.map(student => (
          <div key={student.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center"><span className="text-primary-600 font-medium">{student.firstName?.[0]}{student.lastName?.[0]}</span></div>
                <div><p className="font-medium">{student.firstName} {student.lastName}</p><p className="text-sm text-gray-500">{student.studentId}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm text-gray-500">Marks</label>
                  <input type="number" max={assessmentData?.totalMarks} value={scores[student.id]?.marks || ''} onChange={(e) => handleScoreChange(student.id, 'marks', e.target.value)} className="input w-24 text-center" placeholder="0" />
                </div>
                <div className="text-sm text-gray-500">/ {assessmentData?.totalMarks}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-gray-500">If Failed - Reason</label>
                <select value={scores[student.id]?.failureReason || ''} onChange={(e) => handleScoreChange(student.id, 'failureReason', e.target.value)} className="input text-sm">
                  <option value="">Select reason</option>
                  {FAILURE_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div><label className="text-sm text-gray-500">Comments</label><input type="text" value={scores[student.id]?.comments || ''} onChange={(e) => handleScoreChange(student.id, 'comments', e.target.value)} className="input text-sm" placeholder="Optional comments" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradeAssessment;
