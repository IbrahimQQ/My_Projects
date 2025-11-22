import React, { useState } from 'react';
import { useAuthStore } from '../context/authStore';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/api';
import { toast } from 'react-toastify';
import { User, Lock, Bell, Database } from 'lucide-react';

const Settings = () => {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const { register, handleSubmit, reset } = useForm();

  const passwordMutation = useMutation({
    mutationFn: (data) => authService.changePassword(data),
    onSuccess: () => { toast.success('Password changed successfully'); reset(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to change password'),
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-500">Manage your account and system settings</p></div>

      <div className="flex gap-6">
        <div className="w-64 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${tab === t.id ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50'}`}>
              <t.icon size={20} /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 card">
          {tab === 'profile' && (
            <div>
              <h3 className="font-semibold mb-6">Profile Information</h3>
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 text-2xl font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-lg">{user?.firstName} {user?.lastName}</p>
                  <p className="text-gray-500">{user?.email}</p>
                  <p className="text-sm text-gray-400 capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2">First Name</label><input defaultValue={user?.firstName} className="input" disabled /></div>
                <div><label className="block text-sm font-medium mb-2">Last Name</label><input defaultValue={user?.lastName} className="input" disabled /></div>
                <div><label className="block text-sm font-medium mb-2">Email</label><input defaultValue={user?.email} className="input" disabled /></div>
                <div><label className="block text-sm font-medium mb-2">Phone</label><input defaultValue={user?.phone || ''} className="input" disabled /></div>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div>
              <h3 className="font-semibold mb-6">Change Password</h3>
              <form onSubmit={handleSubmit(d => passwordMutation.mutate(d))} className="max-w-md space-y-4">
                <div><label className="block text-sm font-medium mb-2">Current Password</label><input {...register('currentPassword', { required: true })} type="password" className="input" /></div>
                <div><label className="block text-sm font-medium mb-2">New Password</label><input {...register('newPassword', { required: true, minLength: 8 })} type="password" className="input" /></div>
                <div><label className="block text-sm font-medium mb-2">Confirm New Password</label><input {...register('confirmPassword', { required: true })} type="password" className="input" /></div>
                <button type="submit" className="btn-primary" disabled={passwordMutation.isPending}>{passwordMutation.isPending ? 'Changing...' : 'Change Password'}</button>
              </form>
            </div>
          )}

          {tab === 'notifications' && (
            <div>
              <h3 className="font-semibold mb-6">Notification Preferences</h3>
              <div className="space-y-4">
                {['Email notifications', 'Push notifications', 'SMS notifications', 'Weekly reports'].map(item => (
                  <label key={item} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span>{item}</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === 'system' && (
            <div>
              <h3 className="font-semibold mb-6">System Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-gray-50 rounded-lg"><span>Version</span><span className="font-mono">1.0.0</span></div>
                <div className="flex justify-between p-4 bg-gray-50 rounded-lg"><span>Environment</span><span className="font-mono">Production</span></div>
                <div className="flex justify-between p-4 bg-gray-50 rounded-lg"><span>Last Backup</span><span>Today at 3:00 AM</span></div>
              </div>
              <div className="mt-6">
                <button className="btn-secondary">Backup Data</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
