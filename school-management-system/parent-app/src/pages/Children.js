import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/api';
import { useAuthStore } from '../context/authStore';
import { ChevronRight, GraduationCap } from 'lucide-react';

const Children = () => {
  const navigate = useNavigate();
  const { setSelectedChild } = useAuthStore();
  const { data, isLoading } = useQuery({ queryKey: ['parent-dashboard'], queryFn: () => dashboardService.getParentDashboard() });

  if (isLoading) return <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="card animate-pulse"><div className="h-20 bg-gray-200 rounded" /></div>)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Children</h1>
      <div className="space-y-4">
        {data?.data?.data?.children?.map(({ student }) => (
          <div key={student.id} className="card flex items-center justify-between cursor-pointer hover:border-primary-200" onClick={() => { setSelectedChild(student); navigate(`/children/${student.id}`); }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center"><span className="text-primary-600 text-xl font-bold">{student.firstName?.[0]}{student.lastName?.[0]}</span></div>
              <div><p className="font-semibold text-lg">{student.firstName} {student.lastName}</p><p className="text-gray-500">{student.Class?.name} | {student.studentId}</p></div>
            </div>
            <ChevronRight className="text-gray-400" />
          </div>
        ))}
      </div>
      {(!data?.data?.data?.children || data.data.data.children.length === 0) && <div className="card text-center py-12"><GraduationCap size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No children linked</p></div>}
    </div>
  );
};

export default Children;
