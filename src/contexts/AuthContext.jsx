import React, { createContext, useContext, useState, useEffect } from 'react';

import { createLogger } from '../lib/logger'
const logger = createLogger('AuthProvider')


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 检查用户登录状态
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // 完全依赖httpOnly cookie，不使用localStorage
      // 浏览器会自动发送cookie
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // 新的响应格式包含 authenticated 标志
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        // Session无效或已过期
        setUser(null);
      }
    } catch (error) {
      logger.error('Check auth failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      logger.log('[AuthContext] Attempting login for:', email);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      logger.log('[AuthContext] Login response:', { status: response.status, data });

      if (!response.ok) {
        logger.error('[AuthContext] Login failed:', data);
        throw data;
      }

      // Token通过httpOnly cookie自动保存，前端不存储
      setUser(data.user);
      logger.log('[AuthContext] Login successful, user set:', data.user);

      return { success: true };
    } catch (error) {
      logger.error('[AuthContext] Login error:', error);
      return { success: false, error: error.message || error.error || '登录失败' };
    }
  };

  const register = async (email, password, inviteCode, username) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, inviteCode, username })
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      // Token通过httpOnly cookie自动保存，前端不存储
      setUser(data.user);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      logger.error('Logout failed:', error);
    } finally {
      // 无论是否成功，都清除本地状态
      // Cookie会被服务器清除
      setUser(null);
    }
  };

  const updateUserProfile = (updates) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updates
    }));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUserProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

