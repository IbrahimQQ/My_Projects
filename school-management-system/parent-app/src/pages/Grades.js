import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/api';
import { Award } from 'lucide-react';

const Grades = () => {
  const { data, isLoading } = useQuery({ queryKey: ['parent-dashboard'], queryFn: () => dashboardService.getParentDashboard() });

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse"><div className="h-20 bg-gray-200 rounded" /></div>)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Grades & Performance</h1>
      {data?.data?.data?.children?.map(({ student, recentGrades }) => (
        <div key={student.id} className="space-y-4">
          <h2 className="font-semibold text-lg">{student.firstName} {student.lastName}</h2>
          {recentGrades?.length > 0 ? (
            <div className="space-y-3">
              {recentGrades.map(result => (
                <div key={result.id} className="card flex items-center justify-between">
                  <div><p className="font-medium">{result.Assessment?.title}</p><p className="text-sm text-gray-500">{result.Assessment?.Subject?.name} | {result.Assessment?.type}</p></div>
                  <div className="text-right"><span className={`px-3 py-1 rounded-full text-sm font-medium ${parseFloat(result.percentage) >= 70 ? 'bg-green-100 text-green-700' : parseFloat(result.percentage) >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{result.grade}</span><p className="text-xs text-gray-500 mt-1">{result.marksObtained}/{result.Assessment?.totalMarks}</p></div>
                </div>
              ))}
            </div>
          ) : <div className="card text-center py-8"><Award size={40} className="mx-auto mb-2 text-gray-300" /><p className="text-gray-500">No grades available yet</p></div>}
        </div>
      ))}
    </div>
  );
};

export default Grades;
