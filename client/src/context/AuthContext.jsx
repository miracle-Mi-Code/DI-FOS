import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('dfos_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('dfos_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('dfos_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('dfos_token', newToken);
    localStorage.setItem('dfos_user', JSON.stringify(newUser));
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  };

  const verifyOtp = async (phoneOrEmail, code) => {
    const payload = phoneOrEmail.includes('@')
      ? { email: phoneOrEmail, code }
      : { phone: phoneOrEmail, code };

    const res = await api.post('/auth/verify-otp', payload);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('dfos_token', newToken);
    localStorage.setItem('dfos_user', JSON.stringify(newUser));
    return res.data;
  };

  const resendOtp = async (phoneOrEmail) => {
    const payload = phoneOrEmail.includes('@')
      ? { email: phoneOrEmail }
      : { phone: phoneOrEmail };
    const res = await api.post('/auth/resend-otp', payload);
    return res.data;
  };

  const forgotPassword = async (identifier) => {
    const res = await api.post('/auth/forgot-password', { identifier });
    return res.data;
  };

  const resetPassword = async (identifier, code, newPassword) => {
    const res = await api.post('/auth/reset-password', { identifier, code, newPassword });
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('dfos_token');
    localStorage.removeItem('dfos_user');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    logout,
    isAuthenticated: !!user && !!token,
    isStudent: user?.role === 'STUDENT',
    isStaff: user?.role === 'STAFF' || user?.role === 'SUPER_ADMIN',
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
