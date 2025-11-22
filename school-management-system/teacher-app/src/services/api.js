import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && error.response?.data?.code === 'TOKEN_EXPIRED') {
      originalRequest._retry = true;
      const { useAuthStore } = await import('../context/authStore');
      const refreshed = await useAuthStore.getState().refreshAccessToken();
      if (refreshed) {
        originalRequest.headers['Authorization'] = `Bearer ${useAuthStore.getState().accessToken}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const dashboardService = { getTeacherDashboard: () => api.get('/dashboard/teacher') };
export const classService = { getAll: (params) => api.get('/classes', { params }), getById: (id) => api.get(`/classes/${id}`), getStudents: (id) => api.get(`/classes/${id}/students`) };
export const attendanceService = {
  mark: (data) => api.post('/attendance', data),
  getClassAttendance: (params) => api.get('/attendance/class', { params }),
  getToday: () => api.get('/attendance/today'),
};
export const assessmentService = {
  getAll: (params) => api.get('/assessments', { params }), getById: (id) => api.get(`/assessments/${id}`),
  create: (data) => api.post('/assessments', data), update: (id, data) => api.put(`/assessments/${id}`, data),
  delete: (id) => api.delete(`/assessments/${id}`), recordScores: (id, data) => api.post(`/assessments/${id}/scores`, data),
  getResults: (id) => api.get(`/assessments/${id}/results`),
};
export const questionService = {
  getAll: (params) => api.get('/question-bank', { params }), getById: (id) => api.get(`/question-bank/${id}`),
  create: (data) => api.post('/question-bank', data), update: (id, data) => api.put(`/question-bank/${id}`, data),
  delete: (id) => api.delete(`/question-bank/${id}`), bulkCreate: (data) => api.post('/question-bank/bulk', data),
  getTopics: (subjectId) => api.get(`/question-bank/subject/${subjectId}/topics`),
};
export const studentService = { getAll: (params) => api.get('/students', { params }), getPerformance: (id) => api.get(`/students/${id}/performance`) };
export const subjectService = { getAll: (params) => api.get('/subjects', { params }) };
