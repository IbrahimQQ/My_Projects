import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { LayoutDashboard, BookOpen, Users, ClipboardCheck, FileQuestion, PenTool, User, LogOut, Menu, X } from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/classes', icon: BookOpen, label: 'My Classes' },
    { path: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
    { path: '/assessments', icon: PenTool, label: 'Assessments' },
    { path: '/question-bank', icon: FileQuestion, label: 'Question Bank' },
    { path: '/students', icon: Users, label: 'Students' },
    { path: '/daily-records', icon: PenTool, label: 'Daily Records' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold text-primary-600">Teacher Portal</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} end={item.path === '/'} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <item.icon size={20} />{sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-medium">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            </div>
            {sidebarOpen && <div><p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p><p className="text-xs text-gray-500">Teacher</p></div>}
          </div>
          <button onClick={handleLogout} className="sidebar-link w-full text-red-600 hover:bg-red-50"><LogOut size={20} />{sidebarOpen && <span>Logout</span>}</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><div className="p-6"><Outlet /></div></main>
    </div>
  );
};

export default Layout;
