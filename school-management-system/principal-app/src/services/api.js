import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        originalRequest._retry = true;

        const { useAuthStore } = await import('../context/authStore');
        const refreshed = await useAuthStore.getState().refreshAccessToken();

        if (refreshed) {
          const { accessToken } = useAuthStore.getState();
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API service functions
export const authService = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const teacherService = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
  assignSubjects: (id, subjectIds) => api.post(`/teachers/${id}/subjects`, { subjectIds }),
  getWorkload: (id) => api.get(`/teachers/${id}/workload`),
};

export const studentService = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  archive: (id) => api.post(`/students/${id}/archive`),
  getPerformance: (id) => api.get(`/students/${id}/performance`),
  assignParent: (id, parentId) => api.post(`/students/${id}/parent`, { parentId }),
  enrollInSubjects: (id, subjectIds) => api.post(`/students/${id}/subjects`, { subjectIds }),
  export: (params) => api.get('/students/export', { params, responseType: 'blob' }),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const parentService = {
  getAll: (params) => api.get('/parents', { params }),
  getById: (id) => api.get(`/parents/${id}`),
  create: (data) => api.post('/parents', data),
  update: (id, data) => api.put(`/parents/${id}`, data),
  delete: (id) => api.delete(`/parents/${id}`),
  updatePermissions: (id, permissions) => api.patch(`/parents/${id}/permissions`, permissions),
  linkStudents: (id, studentIds) => api.post(`/parents/${id}/students`, { studentIds }),
};

export const classService = {
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  getSchedule: (id) => api.get(`/classes/${id}/schedule`),
  getStudents: (id) => api.get(`/classes/${id}/students`),
};

export const subjectService = {
  getAll: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
  updateCurriculum: (id, curriculum) => api.patch(`/subjects/${id}/curriculum`, { curriculum }),
};

export const academicYearService = {
  getAll: () => api.get('/academic-years'),
  getCurrent: () => api.get('/academic-years/current'),
  getById: (id) => api.get(`/academic-years/${id}`),
  create: (data) => api.post('/academic-years', data),
  update: (id, data) => api.put(`/academic-years/${id}`, data),
  delete: (id) => api.delete(`/academic-years/${id}`),
  createTerm: (id, data) => api.post(`/academic-years/${id}/terms`, data),
  updateTerm: (id, termId, data) => api.put(`/academic-years/${id}/terms/${termId}`, data),
  deleteTerm: (id, termId) => api.delete(`/academic-years/${id}/terms/${termId}`),
};

export const assessmentService = {
  getAll: (params) => api.get('/assessments', { params }),
  getById: (id) => api.get(`/assessments/${id}`),
  create: (data) => api.post('/assessments', data),
  update: (id, data) => api.put(`/assessments/${id}`, data),
  delete: (id) => api.delete(`/assessments/${id}`),
  getResults: (id) => api.get(`/assessments/${id}/results`),
};

export const notificationService = {
  getAll: (params) => api.get('/notifications/all', { params }),
  getUserNotifications: (params) => api.get('/notifications', { params }),
  create: (data) => api.post('/notifications', data),
  send: (id) => api.post(`/notifications/${id}/send`),
  update: (id, data) => api.put(`/notifications/${id}`, data),
  delete: (id) => api.delete(`/notifications/${id}`),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const reportService = {
  getStudentReport: (params) => api.get('/reports/student', { params }),
  getClassReport: (params) => api.get('/reports/class', { params }),
  getAttendanceReport: (params) => api.get('/reports/attendance', { params }),
  generateCustomReport: (data) => api.post('/reports/custom', data),
  generateReportCard: (params) => api.get('/reports/report-card', { params }),
  generateClassReportCards: (params) => api.get('/reports/report-cards/class', { params }),
};

export const dashboardService = {
  getPrincipalDashboard: () => api.get('/dashboard/principal'),
  getQuickStats: () => api.get('/dashboard/stats'),
};

export const accountingService = {
  getFeeStructures: (params) => api.get('/accounting/fee-structures', { params }),
  createFeeStructure: (data) => api.post('/accounting/fee-structures', data),
  getInvoices: (params) => api.get('/accounting/invoices', { params }),
  createInvoice: (data) => api.post('/accounting/invoices', data),
  getPayments: (params) => api.get('/accounting/payments', { params }),
  recordPayment: (data) => api.post('/accounting/payments', data),
  getExpenses: (params) => api.get('/accounting/expenses', { params }),
  createExpense: (data) => api.post('/accounting/expenses', data),
  getSalaries: (params) => api.get('/accounting/salaries', { params }),
  getFinancialSummary: (params) => api.get('/accounting/summary', { params }),
};

export const auditService = {
  getLogs: (params) => api.get('/audit', { params }),
  getStats: (params) => api.get('/audit/stats', { params }),
};
