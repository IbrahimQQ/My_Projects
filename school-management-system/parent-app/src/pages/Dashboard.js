import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/api';
import { useAuthStore } from '../context/authStore';
import { Award, Calendar, Bell, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { setSelectedChild } = useAuthStore();
  const { data, isLoading } = useQuery({ queryKey: ['parent-dashboard'], queryFn: () => dashboardService.getParentDashboard() });
  const dashboard = data?.data?.data;

  if (isLoading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse"><div className="h-24 bg-gray-200 rounded" /></div>)}</div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Welcome!</h1><p className="text-gray-500">Track your children's progress</p></div>

      {/* Children Cards */}
      <div className="space-y-4">
        {dashboard?.children?.map(({ student, recentGrades, attendance, upcomingAssessments }) => (
          <div key={student.id} className="card" onClick={() => { setSelectedChild(student); navigate(`/children/${student.id}`); }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center"><span className="text-primary-600 font-bold">{student.firstName?.[0]}{student.lastName?.[0]}</span></div>
                <div><p className="font-semibold">{student.firstName} {student.lastName}</p><p className="text-sm text-gray-500">{student.Class?.name}</p></div>
              </div>
              <ChevronRight className="text-gray-400" />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              {recentGrades && recentGrades.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Award className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-blue-900">{recentGrades[0]?.grade || 'N/A'}</p>
                  <p className="text-xs text-blue-600">Latest Grade</p>
                </div>
              )}
              {attendance && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-green-900">{attendance.percentage}%</p>
                  <p className="text-xs text-green-600">Attendance</p>
                </div>
              )}
              {upcomingAssessments && upcomingAssessments.length > 0 && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Bell className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-orange-900">{upcomingAssessments.length}</p>
                  <p className="text-xs text-orange-600">Upcoming Tests</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {(!dashboard?.children || dashboard.children.length === 0) && (
        <div className="card text-center py-8"><p className="text-gray-500">No children linked to your account</p></div>
      )}
    </div>
  );
};

export default Dashboard;
