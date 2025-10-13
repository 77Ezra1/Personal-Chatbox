import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || '登录失败');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L4 10V15C4 22 9 27.5 16 28C23 27.5 28 22 28 15V10L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* 标题 */}
          <h1 className="auth-title">登录</h1>
          <p className="auth-subtitle">使用您的账号继续</p>

          {/* 错误提示 */}
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <span>邮箱</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <span>密码</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="输入您的密码"
                disabled={loading}
                className="form-input"
              />
            </div>

            <button 
              type="submit" 
              className="auth-btn auth-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>登录中...</span>
                </>
              ) : (
                <span>登录</span>
              )}
            </button>
          </form>

          {/* 分隔线 */}
          <div className="auth-divider">
            <span>或</span>
          </div>

          {/* OAuth按钮 */}
          <div className="oauth-buttons">
            <button 
              className="oauth-btn oauth-btn-google"
              onClick={() => alert('Google登录功能开发中')}
              disabled
            >
              <span>使用 Google 登录</span>
            </button>
            <button 
              className="oauth-btn oauth-btn-github"
              onClick={() => alert('GitHub登录功能开发中')}
              disabled
            >
              <span>使用 GitHub 登录</span>
            </button>
          </div>

          {/* 底部链接 */}
          <div className="auth-footer">
            <p>
              还没有账号？
              <Link to="/register" className="auth-link">创建账号</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

