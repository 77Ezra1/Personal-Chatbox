import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Check } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    inviteCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');

    // 检查密码强度
    if (name === 'password') {
      setPasswordStrength({
        hasLength: value.length >= 8,
        hasUpperCase: /[A-Z]/.test(value),
        hasLowerCase: /[a-z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 验证密码匹配
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    // 验证密码强度
    const allValid = Object.values(passwordStrength).every(v => v);
    if (!allValid) {
      setError('密码不符合要求，请满足所有条件');
      return;
    }

    setLoading(true);

    try {
      const result = await register(
        formData.email,
        formData.password,
        formData.inviteCode,
        formData.username || null
      );
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || '注册失败');
      }
    } catch {
      setError('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthPercentage = () => {
    const validCount = Object.values(passwordStrength).filter(v => v).length;
    return (validCount / 5) * 100;
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card auth-card-wide">
          {/* Logo */}
          <div className="auth-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L4 10V15C4 22 9 27.5 16 28C23 27.5 28 22 28 15V10L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* 标题 */}
          <h1 className="auth-title">创建账号</h1>
          <p className="auth-subtitle">开始使用 Personal Chatbox</p>

          {/* 错误提示 */}
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 注册表单 */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
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
                <label htmlFor="username">
                  <span>用户名（可选）</span>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="您的昵称"
                  disabled={loading}
                  className="form-input"
                />
              </div>
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
                placeholder="设置您的密码"
                disabled={loading}
                className="form-input"
              />
              
              {/* 密码强度指示器 */}
              {formData.password && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div 
                      className="password-strength-fill"
                      style={{ 
                        width: `${getPasswordStrengthPercentage()}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* 密码要求 */}
              <div className="password-requirements">
                <div className={`requirement ${passwordStrength.hasLength ? 'valid' : ''}`}>
                  {passwordStrength.hasLength ? <Check size={14} /> : <div className="requirement-dot"></div>}
                  <span>至少8个字符</span>
                </div>
                <div className={`requirement ${passwordStrength.hasUpperCase ? 'valid' : ''}`}>
                  {passwordStrength.hasUpperCase ? <Check size={14} /> : <div className="requirement-dot"></div>}
                  <span>包含大写字母</span>
                </div>
                <div className={`requirement ${passwordStrength.hasLowerCase ? 'valid' : ''}`}>
                  {passwordStrength.hasLowerCase ? <Check size={14} /> : <div className="requirement-dot"></div>}
                  <span>包含小写字母</span>
                </div>
                <div className={`requirement ${passwordStrength.hasNumber ? 'valid' : ''}`}>
                  {passwordStrength.hasNumber ? <Check size={14} /> : <div className="requirement-dot"></div>}
                  <span>包含数字</span>
                </div>
                <div className={`requirement ${passwordStrength.hasSpecialChar ? 'valid' : ''}`}>
                  {passwordStrength.hasSpecialChar ? <Check size={14} /> : <div className="requirement-dot"></div>}
                  <span>包含特殊字符</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <span>确认密码</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="再次输入密码"
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="inviteCode">
                <span>邀请码</span>
              </label>
              <input
                id="inviteCode"
                name="inviteCode"
                type="text"
                required
                value={formData.inviteCode}
                onChange={handleChange}
                placeholder="请输入邀请码"
                disabled={loading}
                className="form-input"
              />
              <p className="form-hint">
                没有邀请码？请联系管理员获取
              </p>
            </div>

            <button 
              type="submit" 
              className="auth-btn auth-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>注册中...</span>
                </>
              ) : (
                <span>注册</span>
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
              onClick={() => alert('Google注册功能开发中')}
              disabled
            >
              <span>使用 Google 注册</span>
            </button>
            <button 
              className="oauth-btn oauth-btn-github"
              onClick={() => alert('GitHub注册功能开发中')}
              disabled
            >
              <span>使用 GitHub 注册</span>
            </button>
          </div>

          {/* 底部链接 */}
          <div className="auth-footer">
            <p>
              已有账号？
              <Link to="/login" className="auth-link">立即登录</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

