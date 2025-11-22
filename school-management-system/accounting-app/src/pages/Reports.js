import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/api';
import { FileText, Download, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, PieChart as RechartsPie, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [activeReport, setActiveReport] = useState('summary');

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['financial-summary', dateRange],
    queryFn: () => reportService.getFinancialSummary(dateRange)
  });

  const summary = summaryData?.data?.data;

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const COLORS = ['#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'];

  const reportTypes = [
    { id: 'summary', label: 'Financial Summary', icon: DollarSign },
    { id: 'income', label: 'Income Statement', icon: TrendingUp },
    { id: 'collections', label: 'Fee Collections', icon: FileText },
    { id: 'expenses', label: 'Expense Report', icon: TrendingDown },
  ];

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse"><div className="h-24 bg-gray-200 rounded" /></div>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <div className="flex items-center gap-4">
          <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="input w-40" />
          <span className="text-gray-400">to</span>
          <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} className="input w-40" />
          <button className="btn-secondary flex items-center gap-2"><Download size={18} /> Export PDF</button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {reportTypes.map(report => (
          <button key={report.id} onClick={() => setActiveReport(report.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeReport === report.id ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <report.icon size={18} />{report.label}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100"><TrendingUp className="text-green-600" size={20} /></div>
            <div><p className="text-xl font-bold text-green-700">{formatCurrency(summary?.totalIncome)}</p><p className="text-sm text-gray-500">Total Income</p></div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-100"><TrendingDown className="text-red-600" size={20} /></div>
            <div><p className="text-xl font-bold text-red-700">{formatCurrency(summary?.totalExpenses)}</p><p className="text-sm text-gray-500">Total Expenses</p></div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-100"><DollarSign className="text-primary-600" size={20} /></div>
            <div><p className="text-xl font-bold text-primary-700">{formatCurrency(summary?.netIncome)}</p><p className="text-sm text-gray-500">Net Income</p></div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-100"><PieChart className="text-purple-600" size={20} /></div>
            <div><p className="text-xl font-bold text-purple-700">{summary?.collectionRate || 0}%</p><p className="text-sm text-gray-500">Collection Rate</p></div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses */}
        <div className="card">
          <h3 className="font-semibold mb-4">Income vs Expenses Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summary?.monthlyData || []}>
              <XAxis dataKey="month" fontSize={12} tickLine={false} />
              <YAxis fontSize={12} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="income" fill="#0d9488" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Net Income Trend */}
        <div className="card">
          <h3 className="font-semibold mb-4">Net Income Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={summary?.monthlyData || []}>
              <XAxis dataKey="month" fontSize={12} tickLine={false} />
              <YAxis fontSize={12} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="netIncome" stroke="#0d9488" strokeWidth={3} dot={{ fill: '#0d9488' }} name="Net Income" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="card">
          <h3 className="font-semibold mb-4">Expense Breakdown by Category</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={250}>
              <RechartsPie>
                <Pie data={summary?.expensesByCategory || []} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                  {(summary?.expensesByCategory || []).map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {(summary?.expensesByCategory || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="capitalize">{item.category}</span></div>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Income Sources */}
        <div className="card">
          <h3 className="font-semibold mb-4">Income by Source</h3>
          <div className="space-y-4">
            {(summary?.incomeBySource || []).map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1"><span className="capitalize">{item.source}</span><span className="font-medium">{formatCurrency(item.amount)}</span></div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(item.amount / (summary?.totalIncome || 1)) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="card">
        <h3 className="font-semibold mb-4">Profit & Loss Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr><th className="text-left p-3">Category</th><th className="text-right p-3">Amount</th><th className="text-right p-3">% of Total</th></tr>
            </thead>
            <tbody>
              <tr className="bg-green-50 font-semibold"><td className="p-3">Total Revenue</td><td className="text-right p-3 text-green-700">{formatCurrency(summary?.totalIncome)}</td><td className="text-right p-3">100%</td></tr>
              {(summary?.incomeBySource || []).map((item, i) => (
                <tr key={i} className="border-b"><td className="p-3 pl-8 capitalize">{item.source}</td><td className="text-right p-3">{formatCurrency(item.amount)}</td><td className="text-right p-3">{((item.amount / (summary?.totalIncome || 1)) * 100).toFixed(1)}%</td></tr>
              ))}
              <tr className="bg-red-50 font-semibold"><td className="p-3">Total Expenses</td><td className="text-right p-3 text-red-700">({formatCurrency(summary?.totalExpenses)})</td><td className="text-right p-3">-</td></tr>
              {(summary?.expensesByCategory || []).map((item, i) => (
                <tr key={i} className="border-b"><td className="p-3 pl-8 capitalize">{item.category}</td><td className="text-right p-3">({formatCurrency(item.amount)})</td><td className="text-right p-3">-</td></tr>
              ))}
              <tr className="bg-primary-50 font-bold text-lg"><td className="p-3">Net Income</td><td className={`text-right p-3 ${(summary?.netIncome || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(summary?.netIncome)}</td><td className="text-right p-3">-</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
