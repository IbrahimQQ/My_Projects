import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { subjectService } from '../services/api';
import { ArrowLeft, Users } from 'lucide-react';

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['subject', id], queryFn: () => subjectService.getById?.(id) });
  const subject = data?.data?.data;

  if (isLoading) return <div className="card animate-pulse"><div className="h-64 bg-gray-200 rounded" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/classes')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div><h1 className="text-2xl font-bold">{subject?.name}</h1><p className="text-gray-500">{subject?.code}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Subject Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500">Code</span><span>{subject?.code}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Credit Hours</span><span>{subject?.creditHours}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Enrolled Students</span><span>{subject?.students?.length || 0}</span></div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Assigned Classes</h3>
          {subject?.classes?.length > 0 ? (
            <div className="space-y-2">
              {subject.classes.map(cls => (
                <div key={cls.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{cls.name}</span>
                  <span className="flex items-center gap-1 text-sm text-gray-500"><Users size={14} />{cls.students?.length || 0}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-center py-4">No classes assigned</p>}
        </div>
      </div>

      {subject?.description && (
        <div className="card">
          <h3 className="font-semibold mb-4">Description</h3>
          <p className="text-gray-600">{subject.description}</p>
        </div>
      )}
    </div>
  );
};

export default ClassDetails;
