import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('platformToken');
    const userData = localStorage.getItem('platformUser');

    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      // Only allow superadmin access to platform admin
      if (parsedUser.role === 'superadmin') {
        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        localStorage.removeItem('platformToken');
        localStorage.removeItem('platformUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      // Only allow superadmin to login to platform admin
      if (userData.role !== 'superadmin') {
        throw new Error('Access denied. Only platform administrators can access this portal.');
      }

      localStorage.setItem('platformToken', token);
      localStorage.setItem('platformUser', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('platformToken');
    localStorage.removeItem('platformUser');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
