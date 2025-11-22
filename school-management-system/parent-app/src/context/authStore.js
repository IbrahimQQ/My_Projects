import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null, accessToken: null, refreshToken: null, isAuthenticated: false, selectedChild: null,
      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = response.data.data;
          if (user.role !== 'parent') return { success: false, error: 'Access denied. Parents only.' };
          set({ user, accessToken, refreshToken, isAuthenticated: true });
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.error || 'Login failed' };
        }
      },
      logout: async () => {
        try { await api.post('/auth/logout'); } catch {}
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, selectedChild: null });
        delete api.defaults.headers.common['Authorization'];
      },
      setSelectedChild: (child) => set({ selectedChild: child }),
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        try {
          const response = await api.post('/auth/refresh-token', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          set({ accessToken, refreshToken: newRefreshToken });
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return true;
        } catch { get().logout(); return false; }
      },
    }),
    { name: 'parent-auth-storage' }
  )
);

const state = useAuthStore.getState();
if (state.accessToken) api.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
