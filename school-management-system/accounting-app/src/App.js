import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './context/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeeStructures from './pages/FeeStructures';
import FeeStructureForm from './pages/FeeStructureForm';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceDetails from './pages/InvoiceDetails';
import Payments from './pages/Payments';
import PaymentForm from './pages/PaymentForm';
import Salaries from './pages/Salaries';
import SalaryForm from './pages/SalaryForm';
import Expenses from './pages/Expenses';
import ExpenseForm from './pages/ExpenseForm';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!['admin', 'accountant', 'principal'].includes(user?.role)) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="fee-structures" element={<FeeStructures />} />
            <Route path="fee-structures/new" element={<FeeStructureForm />} />
            <Route path="fee-structures/:id/edit" element={<FeeStructureForm />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/new" element={<InvoiceForm />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payments/new" element={<PaymentForm />} />
            <Route path="salaries" element={<Salaries />} />
            <Route path="salaries/new" element={<SalaryForm />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="expenses/new" element={<ExpenseForm />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
