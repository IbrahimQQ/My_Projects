import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../context/authStore';
import { authService } from '../services/api';
import { User, Lock, Building, Bell } from 'lucide-react';

const Settings = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [successMessage, setSuccessMessage] = useState('');

  const passwordMutation = useMutation({
    mutationFn: (data) => authService.changePassword(data),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('Password changed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    passwordMutation.mutate({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'organization', label: 'Organization', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="card p-2 space-y-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}>
                <tab.icon size={18} />{tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {successMessage && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">{successMessage}</div>}

          {activeTab === 'profile' && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold">Profile Information</h2>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 text-2xl font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                </div>
                <div>
                  <p className="text-xl font-semibold">{user?.firstName} {user?.lastName}</p>
                  <p className="text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">First Name</label><input type="text" value={user?.firstName || ''} className="input" readOnly /></div>
                <div><label className="label">Last Name</label><input type="text" value={user?.lastName || ''} className="input" readOnly /></div>
                <div><label className="label">Email</label><input type="email" value={user?.email || ''} className="input" readOnly /></div>
                <div><label className="label">Role</label><input type="text" value={user?.role || ''} className="input capitalize" readOnly /></div>
              </div>
              <p className="text-sm text-gray-500">Contact administrator to update profile information.</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold">Change Password</h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="label">Current Password</label>
                  <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="input" minLength={8} required />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="input" minLength={8} required />
                </div>
                {passwordMutation.error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{passwordMutation.error.response?.data?.message || 'Error changing password'}</div>}
                <button type="submit" disabled={passwordMutation.isPending} className="btn-primary">{passwordMutation.isPending ? 'Changing...' : 'Change Password'}</button>
              </form>
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold">Organization Settings</h2>
              <div className="space-y-4">
                <div><label className="label">School Name</label><input type="text" defaultValue="Demo School" className="input" readOnly /></div>
                <div><label className="label">Currency</label><select className="select" defaultValue="USD"><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option></select></div>
                <div><label className="label">Fiscal Year Start</label><select className="select" defaultValue="1"><option value="1">January</option><option value="4">April</option><option value="7">July</option><option value="9">September</option></select></div>
                <div><label className="label">Default Payment Terms (Days)</label><input type="number" defaultValue="30" className="input" /></div>
              </div>
              <p className="text-sm text-gray-500">These settings affect financial reports and invoicing.</p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div><p className="font-medium">Payment Received</p><p className="text-sm text-gray-500">Get notified when payments are recorded</p></div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div><p className="font-medium">Overdue Invoices</p><p className="text-sm text-gray-500">Daily reminder of overdue invoices</p></div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div><p className="font-medium">Salary Due</p><p className="text-sm text-gray-500">Reminder before salary payment dates</p></div>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div><p className="font-medium">Budget Alerts</p><p className="text-sm text-gray-500">Alert when expenses exceed budget</p></div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
