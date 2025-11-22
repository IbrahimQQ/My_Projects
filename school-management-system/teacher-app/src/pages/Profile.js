import React from 'react';
import { useAuthStore } from '../context/authStore';
import { User, Mail, Phone, Briefcase } from 'lucide-react';

const Profile = () => {
  const { user } = useAuthStore();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <div className="card">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center"><span className="text-primary-600 text-2xl font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span></div>
          <div><p className="text-xl font-semibold">{user?.firstName} {user?.lastName}</p><p className="text-gray-500">Teacher</p></div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-gray-600"><Mail size={20} /><span>{user?.email}</span></div>
          {user?.phone && <div className="flex items-center gap-3 text-gray-600"><Phone size={20} /><span>{user?.phone}</span></div>}
          {user?.teacherProfile?.employeeId && <div className="flex items-center gap-3 text-gray-600"><Briefcase size={20} /><span>Employee ID: {user.teacherProfile.employeeId}</span></div>}
        </div>
      </div>
    </div>
  );
};

export default Profile;
