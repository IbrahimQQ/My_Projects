import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/api';
import { BookOpen, Users, ClipboardCheck, PenTool, Clock, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { data, isLoading } = useQuery({ queryKey: ['teacher-dashboard'], queryFn: () => dashboardService.getTeacherDashboard() });
  const dashboard = data?.data?.data;

  if (isLoading) return <div className="space-y-6">{[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse"><div className="h-20 bg-gray-200 rounded" /></div>)}</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Welcome Back!</h1><p className="text-gray-500">Here's your overview for today</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card"><div className="flex items-center gap-4"><div className="p-3 bg-primary-100 rounded-lg"><BookOpen className="text-primary-600" size={24} /></div><div><p className="text-sm text-gray-500">My Subjects</p><p className="text-2xl font-bold">{dashboard?.subjects?.length || 0}</p></div></div></div>
        <div className="card"><div className="flex items-center gap-4"><div className="p-3 bg-blue-100 rounded-lg"><Users className="text-blue-600" size={24} /></div><div><p className="text-sm text-gray-500">Total Students</p><p className="text-2xl font-bold">{dashboard?.studentCount || 0}</p></div></div></div>
        <div className="card"><div className="flex items-center gap-4"><div className="p-3 bg-orange-100 rounded-lg"><PenTool className="text-orange-600" size={24} /></div><div><p className="text-sm text-gray-500">Pending Grading</p><p className="text-2xl font-bold">{dashboard?.pendingGrading?.length || 0}</p></div></div></div>
        <div className="card"><div className="flex items-center gap-4"><div className="p-3 bg-green-100 rounded-lg"><ClipboardCheck className="text-green-600" size={24} /></div><div><p className="text-sm text-gray-500">Attendance Today</p><p className="text-2xl font-bold">{dashboard?.recentAttendance?.length || 0}</p></div></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock size={20} /> Today's Schedule</h3>
          {dashboard?.todaySchedule?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.todaySchedule.map((schedule, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div><p className="font-medium">{schedule.Subject?.name}</p><p className="text-sm text-gray-500">{schedule.Class?.name}</p></div>
                  <div className="text-right"><p className="font-mono text-sm">{schedule.startTime} - {schedule.endTime}</p><p className="text-xs text-gray-500">{schedule.room}</p></div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-center py-4">No classes scheduled today</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><PenTool size={20} /> Pending Assessments</h3>
          {dashboard?.pendingGrading?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.pendingGrading.map((assessment, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div><p className="font-medium">{assessment.title}</p><p className="text-sm text-gray-500">{assessment.Subject?.name} - {assessment.Class?.name}</p></div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">{assessment.status}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-center py-4">No pending assessments</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
