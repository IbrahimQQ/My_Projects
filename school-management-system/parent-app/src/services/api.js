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
      if (refreshed) { originalRequest.headers['Authorization'] = `Bearer ${useAuthStore.getState().accessToken}`; return api(originalRequest); }
    }
    return Promise.reject(error);
  }
);

export default api;

export const dashboardService = { getParentDashboard: () => api.get('/dashboard/parent') };
export const parentService = { getChildData: (childId) => api.get(`/parents/children/${childId}`) };
export const notificationService = {
  getUserNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};
