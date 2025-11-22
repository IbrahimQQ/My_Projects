import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/api';
import StatCard from '../components/StatCard';
import { Users, GraduationCap, UserCircle, School, DollarSign, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getPrincipalDashboard(),
  });

  const dashboardData = data?.data?.data;

  const attendanceData = dashboardData?.todayAttendance ? [
    { name: 'Present', value: dashboardData.todayAttendance.present, color: '#22c55e' },
    { name: 'Absent', value: dashboardData.todayAttendance.absent, color: '#ef4444' },
    { name: 'Late', value: dashboardData.todayAttendance.late, color: '#f97316' },
  ] : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome to School Management System</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Current Academic Year</p>
          <p className="font-medium">{dashboardData?.currentAcademicYear?.name || 'Not set'}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={dashboardData?.counts?.students || 0}
          icon={GraduationCap}
          color="primary"
        />
        <StatCard
          title="Total Teachers"
          value={dashboardData?.counts?.teachers || 0}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Total Parents"
          value={dashboardData?.counts?.parents || 0}
          icon={UserCircle}
          color="blue"
        />
        <StatCard
          title="Active Classes"
          value={dashboardData?.counts?.classes || 0}
          icon={School}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Attendance */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Today's Attendance</h3>
          {attendanceData.length > 0 && attendanceData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No attendance data for today
            </div>
          )}
        </div>

        {/* Financial Overview */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  ${dashboardData?.financialOverview?.totalRevenue?.toLocaleString() || 0}
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Pending Invoices</p>
                <p className="text-xl font-bold text-orange-600">
                  {dashboardData?.financialOverview?.pendingInvoices || 0}
                </p>
              </div>
              <ClipboardList className="text-orange-600" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assessments */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Assessments</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Subject</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Class</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData?.recentAssessments?.length > 0 ? (
                dashboardData.recentAssessments.map((assessment) => (
                  <tr key={assessment.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">{assessment.title}</td>
                    <td className="py-3 px-4">{assessment.Subject?.name}</td>
                    <td className="py-3 px-4">{assessment.Class?.name}</td>
                    <td className="py-3 px-4 capitalize">{assessment.type}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        assessment.status === 'graded' ? 'bg-green-100 text-green-700' :
                        assessment.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {assessment.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    No recent assessments
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
