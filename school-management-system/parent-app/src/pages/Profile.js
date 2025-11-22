import React from 'react';
import { useAuthStore } from '../context/authStore';
import { User, Mail, Phone, Users } from 'lucide-react';

const Profile = () => {
  const { user } = useAuthStore();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center"><span className="text-primary-600 text-2xl font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span></div>
          <div><p className="text-xl font-semibold">{user?.firstName} {user?.lastName}</p><p className="text-gray-500 capitalize">{user?.parentProfile?.relationship || 'Parent'}</p></div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Mail className="text-gray-400" size={20} /><span>{user?.email}</span></div>
          {user?.phone && <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Phone className="text-gray-400" size={20} /><span>{user?.phone}</span></div>}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Users className="text-gray-400" size={20} /><span>{user?.parentProfile?.children?.length || 0} Children linked</span></div>
        </div>
      </div>

      {user?.parentProfile && (
        <div className="card">
          <h3 className="font-semibold mb-4">Access Permissions</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2"><span>View Grades</span><span className={user.parentProfile.canViewGrades ? 'text-green-600' : 'text-red-600'}>{user.parentProfile.canViewGrades ? 'Yes' : 'No'}</span></div>
            <div className="flex items-center justify-between p-2"><span>View Attendance</span><span className={user.parentProfile.canViewAttendance ? 'text-green-600' : 'text-red-600'}>{user.parentProfile.canViewAttendance ? 'Yes' : 'No'}</span></div>
            <div className="flex items-center justify-between p-2"><span>View Assessments</span><span className={user.parentProfile.canViewAssessments ? 'text-green-600' : 'text-red-600'}>{user.parentProfile.canViewAssessments ? 'Yes' : 'No'}</span></div>
            <div className="flex items-center justify-between p-2"><span>Message Teachers</span><span className={user.parentProfile.canMessageTeachers ? 'text-green-600' : 'text-red-600'}>{user.parentProfile.canMessageTeachers ? 'Yes' : 'No'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
