import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardService, invoiceService } from '../services/api';
import StatCard from '../components/StatCard';
import { DollarSign, CreditCard, FileText, Receipt, TrendingUp, TrendingDown, AlertCircle, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';

const Dashboard = () => {
  const { data, isLoading } = useQuery({ queryKey: ['accounting-dashboard'], queryFn: () => dashboardService.getAccountingDashboard() });
  const { data: overdueData } = useQuery({ queryKey: ['overdue-invoices'], queryFn: () => invoiceService.getOverdue() });

  const stats = data?.data?.data;
  const overdue = overdueData?.data?.data || [];

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const COLORS = ['#0d9488', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse"><div className="h-24 bg-gray-200 rounded" /></div>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Financial Dashboard</h1>
        <p className="text-sm text-gray-500">{format(new Date(), 'MMMM yyyy')}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={TrendingUp} label="Total Revenue" value={formatCurrency(stats?.totalRevenue)} color="green" subtext="This month" />
        <StatCard icon={TrendingDown} label="Total Expenses" value={formatCurrency(stats?.totalExpenses)} color="red" subtext="This month" />
        <StatCard icon={DollarSign} label="Net Income" value={formatCurrency(stats?.netIncome)} color="primary" subtext="This month" />
        <StatCard icon={FileText} label="Pending Invoices" value={stats?.pendingInvoices || 0} color="orange" subtext={formatCurrency(stats?.pendingAmount)} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card">
          <h3 className="font-semibold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stats?.monthlyRevenue || []}>
              <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/><stop offset="95%" stopColor="#0d9488" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Area type="monotone" dataKey="amount" stroke="#0d9488" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="card">
          <h3 className="font-semibold mb-4">Expense Breakdown</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={stats?.expensesByCategory || []} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                  {(stats?.expensesByCategory || []).map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {(stats?.expensesByCategory || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span>{item.category}</span></div>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={CreditCard} label="Payments Received" value={stats?.paymentsReceived || 0} color="blue" subtext="This month" />
        <StatCard icon={Receipt} label="Salaries Paid" value={formatCurrency(stats?.salariesPaid)} color="purple" subtext="This month" />
        <StatCard icon={AlertCircle} label="Overdue Invoices" value={overdue.length} color="red" subtext={formatCurrency(overdue.reduce((sum, i) => sum + parseFloat(i.balanceAmount || 0), 0))} />
      </div>

      {/* Collection Rate */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Fee Collection by Class</h3>
          <Link to="/reports" className="text-sm text-primary-600 flex items-center gap-1">View Report <ArrowRight size={14} /></Link>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats?.collectionByClass || []}>
            <XAxis dataKey="class" fontSize={12} tickLine={false} />
            <YAxis fontSize={12} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="collected" fill="#0d9488" radius={[4, 4, 0, 0]} name="Collected %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Overdue Invoices */}
      {overdue.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-red-600 flex items-center gap-2"><AlertCircle size={18} /> Overdue Invoices</h3>
            <Link to="/invoices?status=overdue" className="text-sm text-primary-600">View All</Link>
          </div>
          <div className="space-y-3">
            {overdue.slice(0, 5).map(invoice => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium">{invoice.Student?.firstName} {invoice.Student?.lastName}</p>
                  <p className="text-sm text-gray-500">Invoice #{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">{formatCurrency(invoice.balanceAmount)}</p>
                  <p className="text-xs text-gray-500">Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
