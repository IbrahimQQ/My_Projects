import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { studentService } from '../services/api';
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['student-performance', id],
    queryFn: () => studentService.getPerformance(id),
  });

  const studentData = data?.data?.data;

  if (isLoading) {
    return <div className="card animate-pulse"><div className="h-96 bg-gray-200 rounded" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/students')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
        </div>
        <button onClick={() => navigate(`/students/${id}/edit`)} className="btn-primary flex items-center gap-2">
          <Edit size={20} /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-600 text-3xl font-bold">
                {studentData?.student?.firstName?.[0]}{studentData?.student?.lastName?.[0]}
              </span>
            </div>
            <h2 className="text-xl font-bold">{studentData?.student?.firstName} {studentData?.student?.lastName}</h2>
            <p className="text-gray-500">{studentData?.student?.studentId}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              {studentData?.student?.status}
            </span>
          </div>
          <div className="space-y-4">
            {studentData?.student?.email && (
              <div className="flex items-center gap-3 text-gray-600">
                <Mail size={18} /> <span>{studentData.student.email}</span>
              </div>
            )}
            {studentData?.student?.phone && (
              <div className="flex items-center gap-3 text-gray-600">
                <Phone size={18} /> <span>{studentData.student.phone}</span>
              </div>
            )}
            {studentData?.student?.dateOfBirth && (
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar size={18} /> <span>{studentData.student.dateOfBirth}</span>
              </div>
            )}
            {studentData?.student?.address && (
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin size={18} /> <span>{studentData.student.address}</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
            {studentData?.subjectAverages?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={studentData.subjectAverages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No performance data available</p>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Attendance Statistics</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{studentData?.attendanceStats?.present || 0}</p>
                <p className="text-sm text-gray-600">Present</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{studentData?.attendanceStats?.absent || 0}</p>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{studentData?.attendanceStats?.late || 0}</p>
                <p className="text-sm text-gray-600">Late</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{studentData?.attendanceStats?.percentage || 0}%</p>
                <p className="text-sm text-gray-600">Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
