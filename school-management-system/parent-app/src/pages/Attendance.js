import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/api';
import { Calendar, Check, X, Clock } from 'lucide-react';

const Attendance = () => {
  const { data, isLoading } = useQuery({ queryKey: ['parent-dashboard'], queryFn: () => dashboardService.getParentDashboard() });

  if (isLoading) return <div className="card animate-pulse"><div className="h-64 bg-gray-200 rounded" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>
      {data?.data?.data?.children?.map(({ student, attendance }) => (
        <div key={student.id} className="space-y-4">
          <h2 className="font-semibold text-lg">{student.firstName} {student.lastName}</h2>
          {attendance ? (
            <div className="card">
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg"><Check className="w-6 h-6 text-green-600 mx-auto mb-1" /><p className="text-xl font-bold text-green-700">{attendance.present}</p><p className="text-xs text-green-600">Present</p></div>
                <div className="text-center p-3 bg-red-50 rounded-lg"><X className="w-6 h-6 text-red-600 mx-auto mb-1" /><p className="text-xl font-bold text-red-700">{attendance.absent}</p><p className="text-xs text-red-600">Absent</p></div>
                <div className="text-center p-3 bg-orange-50 rounded-lg"><Clock className="w-6 h-6 text-orange-600 mx-auto mb-1" /><p className="text-xl font-bold text-orange-700">{attendance.late}</p><p className="text-xs text-orange-600">Late</p></div>
                <div className="text-center p-3 bg-primary-50 rounded-lg"><Calendar className="w-6 h-6 text-primary-600 mx-auto mb-1" /><p className="text-xl font-bold text-primary-700">{attendance.percentage}%</p><p className="text-xs text-primary-600">Rate</p></div>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-primary-600 rounded-full" style={{ width: `${attendance.percentage}%` }} /></div>
            </div>
          ) : <div className="card text-center py-8"><Calendar size={40} className="mx-auto mb-2 text-gray-300" /><p className="text-gray-500">No attendance data</p></div>}
        </div>
      ))}
    </div>
  );
};

export default Attendance;
