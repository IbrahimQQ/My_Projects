import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('platformToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('platformToken');
      localStorage.removeItem('platformUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Platform Admin API services
export const schoolService = {
  getAll: (params) => api.get('/schools', { params }),
  getById: (id) => api.get(`/schools/${id}`),
  create: (data) => api.post('/schools', data),
  update: (id, data) => api.put(`/schools/${id}`, data),
  delete: (id) => api.delete(`/schools/${id}`),
  toggleStatus: (id) => api.patch(`/schools/${id}/toggle-status`),
  extendSubscription: (id, data) => api.patch(`/schools/${id}/extend-subscription`, data),
  getDashboard: (id) => api.get(`/schools/${id}/dashboard`),
  getPlatformStats: () => api.get('/schools/platform/stats')
};

export const userService = {
  getAll: (params) => api.get('/platform/users', { params }),
  getById: (id) => api.get(`/platform/users/${id}`),
  create: (data) => api.post('/platform/users', data),
  update: (id, data) => api.put(`/platform/users/${id}`, data),
  delete: (id) => api.delete(`/platform/users/${id}`),
  resetPassword: (id) => api.post(`/platform/users/${id}/reset-password`),
  toggleStatus: (id) => api.patch(`/platform/users/${id}/toggle-status`)
};

export const billingService = {
  getAll: (params) => api.get('/platform/billing', { params }),
  getInvoices: (schoolId) => api.get(`/platform/billing/invoices/${schoolId}`),
  createInvoice: (data) => api.post('/platform/billing/invoices', data),
  recordPayment: (invoiceId, data) => api.post(`/platform/billing/invoices/${invoiceId}/payment`, data),
  getRevenueStats: () => api.get('/platform/billing/stats')
};

export const systemService = {
  getSettings: () => api.get('/platform/settings'),
  updateSettings: (data) => api.put('/platform/settings', data),
  getLogs: (params) => api.get('/platform/logs', { params }),
  getBackups: () => api.get('/platform/backups'),
  createBackup: (schoolId) => api.post('/platform/backups', { schoolId }),
  getStorageStats: () => api.get('/platform/storage')
};

export default api;
