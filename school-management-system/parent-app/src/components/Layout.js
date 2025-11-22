import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { Home, Users, Award, Calendar, Bell, User, LogOut } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/children', icon: Users, label: 'Children' },
    { path: '/grades', icon: Award, label: 'Grades' },
    { path: '/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/notifications', icon: Bell, label: 'Alerts' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary-600">Parent Portal</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.firstName}</span>
          <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><LogOut size={20} /></button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4"><Outlet /></main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t px-2 py-2 flex justify-around">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <item.icon size={20} /><span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
