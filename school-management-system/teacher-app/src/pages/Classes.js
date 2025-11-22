import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { classService, subjectService } from '../services/api';
import { useAuthStore } from '../context/authStore';
import { Users, BookOpen, ChevronRight } from 'lucide-react';

const Classes = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: subjects, isLoading } = useQuery({ queryKey: ['my-subjects'], queryFn: () => subjectService.getAll({ teacherId: user?.id }) });

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse"><div className="h-24 bg-gray-200 rounded" /></div>)}</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">My Classes</h1><p className="text-gray-500">View and manage your assigned classes</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects?.data?.data?.map(subject => (
          <div key={subject.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/classes/${subject.id}`)}>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-primary-100 rounded-lg"><BookOpen className="text-primary-600" size={24} /></div>
              <ChevronRight className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{subject.name}</h3>
            <p className="text-gray-500 text-sm mb-4">{subject.code}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Users size={16} />{subject.classes?.length || 0} Classes</span>
            </div>
          </div>
        ))}
      </div>

      {(!subjects?.data?.data || subjects.data.data.length === 0) && (
        <div className="card text-center py-12"><BookOpen size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No subjects assigned yet</p></div>
      )}
    </div>
  );
};

export default Classes;
