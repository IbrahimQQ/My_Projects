import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { parentService } from '../services/api';
import { ArrowLeft, BookOpen, Award, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const ChildDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['child', id], queryFn: () => parentService.getChildData(id) });
  const childData = data?.data?.data;

  if (isLoading) return <div className="card animate-pulse"><div className="h-64 bg-gray-200 rounded" /></div>;

  const performanceData = childData?.assessments?.slice(0, 5).map(a => ({ name: a.Assessment?.title?.slice(0, 10), score: parseFloat(a.percentage) })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/children')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div><h1 className="text-2xl font-bold">{childData?.student?.firstName} {childData?.student?.lastName}</h1><p className="text-gray-500">{childData?.student?.Class?.name}</p></div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center"><BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-600" /><p className="text-xl font-bold">{childData?.student?.subjects?.length || 0}</p><p className="text-xs text-gray-500">Subjects</p></div>
        <div className="card text-center"><Award className="w-6 h-6 mx-auto mb-2 text-green-600" /><p className="text-xl font-bold">{childData?.assessments?.length || 0}</p><p className="text-xs text-gray-500">Assessments</p></div>
        <div className="card text-center"><Calendar className="w-6 h-6 mx-auto mb-2 text-orange-600" /><p className="text-xl font-bold">{childData?.attendance?.length || 0}</p><p className="text-xs text-gray-500">Days Tracked</p></div>
      </div>

      {/* Performance Chart */}
      {performanceData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Recent Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={performanceData}><XAxis dataKey="name" fontSize={10} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="score" fill="#9333ea" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Grades */}
      <div className="card">
        <h3 className="font-semibold mb-4">Recent Grades</h3>
        {childData?.assessments?.length > 0 ? (
          <div className="space-y-3">
            {childData.assessments.slice(0, 5).map(result => (
              <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div><p className="font-medium">{result.Assessment?.title}</p><p className="text-sm text-gray-500">{result.Assessment?.Subject?.name}</p></div>
                <div className="text-right"><p className="font-bold text-primary-600">{result.grade}</p><p className="text-xs text-gray-500">{result.percentage}%</p></div>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500 text-center py-4">No grades available</p>}
      </div>
    </div>
  );
};

export default ChildDetails;
