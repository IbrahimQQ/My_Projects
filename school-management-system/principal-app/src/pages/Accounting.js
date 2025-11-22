import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountingService } from '../services/api';
import { DollarSign, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import StatCard from '../components/StatCard';

const Accounting = () => {
  const [tab, setTab] = useState('overview');

  const { data: summary } = useQuery({ queryKey: ['financial-summary'], queryFn: () => accountingService.getFinancialSummary() });
  const { data: invoices } = useQuery({ queryKey: ['invoices'], queryFn: () => accountingService.getInvoices({ limit: 10 }) });
  const { data: expenses } = useQuery({ queryKey: ['expenses'], queryFn: () => accountingService.getExpenses({ limit: 10 }) });

  const summaryData = summary?.data?.data;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Accounting</h1><p className="text-gray-500">Financial overview and management</p></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`$${(summaryData?.totalRevenue || 0).toLocaleString()}`} icon={TrendingUp} color="green" />
        <StatCard title="Total Expenses" value={`$${(summaryData?.totalExpenses || 0).toLocaleString()}`} icon={TrendingDown} color="red" />
        <StatCard title="Total Salaries" value={`$${(summaryData?.totalSalaries || 0).toLocaleString()}`} icon={DollarSign} color="blue" />
        <StatCard title="Pending Fees" value={`$${(summaryData?.pendingFees || 0).toLocaleString()}`} icon={FileText} color="orange" />
      </div>

      <div className="flex gap-4 border-b">
        {['overview', 'invoices', 'expenses'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 font-medium border-b-2 -mb-px ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="card">
          <h3 className="font-semibold mb-4">Net Income</h3>
          <div className={`text-3xl font-bold ${(summaryData?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${(summaryData?.netIncome || 0).toLocaleString()}
          </div>
          <p className="text-gray-500 text-sm mt-2">Revenue - Expenses - Salaries</p>

          {summaryData?.expensesByCategory && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Expenses by Category</h4>
              <div className="space-y-2">
                {summaryData.expensesByCategory.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="capitalize">{cat.category}</span>
                    <span className="font-medium">${parseFloat(cat.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'invoices' && (
        <div className="card">
          <h3 className="font-semibold mb-4">Recent Invoices</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">Invoice #</th><th className="text-left py-2">Student</th><th className="text-left py-2">Amount</th><th className="text-left py-2">Status</th><th className="text-left py-2">Due Date</th></tr></thead>
            <tbody>
              {invoices?.data?.data?.map(inv => (
                <tr key={inv.id} className="border-b">
                  <td className="py-2">{inv.invoiceNumber}</td>
                  <td className="py-2">{inv.Student?.firstName} {inv.Student?.lastName}</td>
                  <td className="py-2">${parseFloat(inv.totalAmount).toLocaleString()}</td>
                  <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span></td>
                  <td className="py-2">{inv.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="card">
          <h3 className="font-semibold mb-4">Recent Expenses</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">Description</th><th className="text-left py-2">Category</th><th className="text-left py-2">Amount</th><th className="text-left py-2">Status</th><th className="text-left py-2">Date</th></tr></thead>
            <tbody>
              {expenses?.data?.data?.map(exp => (
                <tr key={exp.id} className="border-b">
                  <td className="py-2">{exp.description}</td>
                  <td className="py-2 capitalize">{exp.category}</td>
                  <td className="py-2">${parseFloat(exp.amount).toLocaleString()}</td>
                  <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs ${exp.status === 'paid' ? 'bg-green-100 text-green-700' : exp.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{exp.status}</span></td>
                  <td className="py-2">{exp.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Accounting;
