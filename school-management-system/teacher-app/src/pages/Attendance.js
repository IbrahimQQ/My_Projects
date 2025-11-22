import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService, classService, subjectService } from '../services/api';
import { useAuthStore } from '../context/authStore';
import { toast } from 'react-toastify';
import { Check, X, Clock } from 'lucide-react';

const Attendance = () => {
  const { user } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const queryClient = useQueryClient();

  const { data: subjects } = useQuery({ queryKey: ['my-subjects'], queryFn: () => subjectService.getAll({ teacherId: user?.id }) });
  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: () => classService.getAll() });
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['class-students', selectedClass], queryFn: () => classService.getStudents(selectedClass), enabled: !!selectedClass,
  });

  const markMutation = useMutation({
    mutationFn: (data) => attendanceService.mark(data),
    onSuccess: () => { toast.success('Attendance saved!'); queryClient.invalidateQueries(['attendance']); },
    onError: () => toast.error('Failed to save attendance'),
  });

  const handleStatusChange = (studentId, status) => setAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  const handleRemarksChange = (studentId, remarks) => setAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], remarks } }));

  const handleSubmit = () => {
    if (!selectedClass || !selectedSubject || !date) { toast.error('Please select class, subject, and date'); return; }
    const records = Object.entries(attendance).map(([studentId, data]) => ({ studentId, status: data.status || 'present', remarks: data.remarks }));
    if (records.length === 0) { toast.error('Please mark attendance'); return; }
    markMutation.mutate({ classId: selectedClass, subjectId: selectedSubject, date, records });
  };

  const statusButtons = [
    { status: 'present', icon: Check, color: 'green', label: 'Present' },
    { status: 'absent', icon: X, color: 'red', label: 'Absent' },
    { status: 'late', icon: Clock, color: 'orange', label: 'Late' },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Mark Attendance</h1><p className="text-gray-500">Record daily attendance for your classes</p></div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="input">
            <option value="">Select Subject</option>
            {subjects?.data?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input">
            <option value="">Select Class</option>
            {classes?.data?.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          <button onClick={handleSubmit} disabled={markMutation.isPending} className="btn-primary">{markMutation.isPending ? 'Saving...' : 'Save Attendance'}</button>
        </div>

        {studentsLoading && <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded" />)}</div>}

        {students?.data?.data?.length > 0 && (
          <div className="space-y-3">
            {students.data.data.map(student => (
              <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-medium">{student.firstName?.[0]}{student.lastName?.[0]}</span>
                  </div>
                  <div><p className="font-medium">{student.firstName} {student.lastName}</p><p className="text-sm text-gray-500">{student.studentId}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  {statusButtons.map(btn => (
                    <button key={btn.status} onClick={() => handleStatusChange(student.id, btn.status)}
                      className={`p-2 rounded-lg transition-colors ${attendance[student.id]?.status === btn.status ? `bg-${btn.color}-100 text-${btn.color}-600` : 'hover:bg-gray-200'}`}>
                      <btn.icon size={20} />
                    </button>
                  ))}
                  <input type="text" placeholder="Remarks" value={attendance[student.id]?.remarks || ''} onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                    className="input w-32 text-sm" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!selectedClass && <p className="text-gray-500 text-center py-8">Select a class to mark attendance</p>}
      </div>
    </div>
  );
};

export default Attendance;
