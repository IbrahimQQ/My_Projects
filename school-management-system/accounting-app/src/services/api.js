import axios from 'axios';
import { useAuthStore } from '../context/authStore';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          useAuthStore.getState().setToken(data.token);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        } catch { useAuthStore.getState().logout(); }
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const dashboardService = {
  getAccountingDashboard: () => api.get('/dashboard/accounting'),
};

export const feeStructureService = {
  getAll: (params) => api.get('/accounting/fee-structures', { params }),
  getById: (id) => api.get(`/accounting/fee-structures/${id}`),
  create: (data) => api.post('/accounting/fee-structures', data),
  update: (id, data) => api.put(`/accounting/fee-structures/${id}`, data),
  delete: (id) => api.delete(`/accounting/fee-structures/${id}`),
};

export const invoiceService = {
  getAll: (params) => api.get('/accounting/invoices', { params }),
  getById: (id) => api.get(`/accounting/invoices/${id}`),
  create: (data) => api.post('/accounting/invoices', data),
  generateBulk: (data) => api.post('/accounting/invoices/bulk', data),
  update: (id, data) => api.put(`/accounting/invoices/${id}`, data),
  delete: (id) => api.delete(`/accounting/invoices/${id}`),
  getOverdue: () => api.get('/accounting/invoices/overdue'),
};

export const paymentService = {
  getAll: (params) => api.get('/accounting/payments', { params }),
  getById: (id) => api.get(`/accounting/payments/${id}`),
  create: (data) => api.post('/accounting/payments', data),
  update: (id, data) => api.put(`/accounting/payments/${id}`, data),
  getReceipt: (id) => api.get(`/accounting/payments/${id}/receipt`),
};

export const salaryService = {
  getAll: (params) => api.get('/accounting/salaries', { params }),
  getById: (id) => api.get(`/accounting/salaries/${id}`),
  create: (data) => api.post('/accounting/salaries', data),
  generateBulk: (data) => api.post('/accounting/salaries/bulk', data),
  update: (id, data) => api.put(`/accounting/salaries/${id}`, data),
  markPaid: (id, data) => api.put(`/accounting/salaries/${id}/pay`, data),
};

export const expenseService = {
  getAll: (params) => api.get('/accounting/expenses', { params }),
  getById: (id) => api.get(`/accounting/expenses/${id}`),
  create: (data) => api.post('/accounting/expenses', data),
  update: (id, data) => api.put(`/accounting/expenses/${id}`, data),
  delete: (id) => api.delete(`/accounting/expenses/${id}`),
  getCategories: () => api.get('/accounting/expenses/categories'),
};

export const reportService = {
  getFinancialSummary: (params) => api.get('/accounting/reports/summary', { params }),
  getIncomeStatement: (params) => api.get('/accounting/reports/income-statement', { params }),
  getCollectionReport: (params) => api.get('/accounting/reports/collections', { params }),
  getExpenseReport: (params) => api.get('/accounting/reports/expenses', { params }),
  getSalaryReport: (params) => api.get('/accounting/reports/salaries', { params }),
};

export const studentService = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
};

export const classService = {
  getAll: (params) => api.get('/classes', { params }),
};

export const teacherService = {
  getAll: (params) => api.get('/teachers', { params }),
};

export const academicYearService = {
  getAll: () => api.get('/academic-years'),
  getActive: () => api.get('/academic-years/active'),
};

export default api;
