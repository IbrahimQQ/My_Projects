import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { LayoutDashboard, FileText, CreditCard, DollarSign, Receipt, PieChart, Settings, LogOut, Menu, X, Building } from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/fee-structures', icon: Building, label: 'Fee Structures' },
    { to: '/invoices', icon: FileText, label: 'Invoices' },
    { to: '/payments', icon: CreditCard, label: 'Payments' },
    { to: '/salaries', icon: DollarSign, label: 'Salaries' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/reports', icon: PieChart, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`} onClick={() => setSidebarOpen(false)}>
      <Icon size={20} /><span>{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-30 flex items-center px-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg"><Menu size={24} /></button>
        <span className="ml-4 font-semibold text-primary-700">Accounting</span>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center"><DollarSign className="text-white" size={18} /></div>
            <span className="font-bold text-primary-700">Accounting</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <nav className="p-4 space-y-1">{navItems.map(item => <NavItem key={item.to} {...item} />)}</nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center"><span className="text-primary-600 font-semibold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span></div>
            <div className="flex-1 min-w-0"><p className="font-medium truncate">{user?.firstName} {user?.lastName}</p><p className="text-xs text-gray-500 capitalize">{user?.role}</p></div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"><LogOut size={18} /><span>Logout</span></button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6"><Outlet /></div>
      </main>
    </div>
  );
};

export default Layout;
