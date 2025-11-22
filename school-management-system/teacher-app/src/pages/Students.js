import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentService, classService } from '../services/api';
import { Users, Search } from 'lucide-react';

const Students = () => {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: () => classService.getAll() });
  const { data: students, isLoading } = useQuery({ queryKey: ['students', search, classFilter], queryFn: () => studentService.getAll({ search, classId: classFilter || undefined }) });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Students</h1><p className="text-gray-500">View student information and performance</p></div>
      <div className="card">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" /></div>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input max-w-xs"><option value="">All Classes</option>{classes?.data?.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
        {isLoading && <div className="animate-pulse space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded" />)}</div>}
        <div className="space-y-3">
          {students?.data?.data?.map(student => (
            <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center"><span className="text-primary-600 font-medium">{student.firstName?.[0]}{student.lastName?.[0]}</span></div>
                <div><p className="font-medium">{student.firstName} {student.lastName}</p><p className="text-sm text-gray-500">{student.studentId} | {student.Class?.name || 'Unassigned'}</p></div>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{student.status}</span>
            </div>
          ))}
        </div>
        {!isLoading && (!students?.data?.data || students.data.data.length === 0) && <div className="text-center py-12"><Users size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No students found</p></div>}
      </div>
    </div>
  );
};

export default Students;
