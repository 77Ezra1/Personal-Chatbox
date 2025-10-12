import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Key, AlertCircle, CheckCircle, UserPlus, MessageSquare } from 'lucide-react';

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
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
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
    } catch (err) {
      setError('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const validCount = Object.values(passwordStrength).filter(v => v).length;
    if (validCount === 0) return 'transparent';
    if (validCount <= 2) return '#ef4444';
    if (validCount <= 4) return '#f59e0b';
    return '#10b981';
  };

  const getPasswordStrengthText = () => {
    const validCount = Object.values(passwordStrength).filter(v => v).length;
    if (validCount === 0) return '';
    if (validCount <= 2) return '弱';
    if (validCount <= 4) return '中';
    return '强';
  };

  return (
    <div className="auth-page">
      {/* 背景装饰 */}
      <div className="auth-bg-decoration">
        <div className="auth-bg-circle auth-bg-circle-1"></div>
        <div className="auth-bg-circle auth-bg-circle-2"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card auth-card-wide">
          {/* Logo */}
          <div className="auth-logo">
            <MessageSquare size={40} strokeWidth={2} />
          </div>

          {/* 标题 */}
          <h1 className="auth-title">创建账号</h1>
          <p className="auth-subtitle">加入Personal Chatbox，开启智能对话之旅</p>

          {/* 错误提示 */}
          {error && (
            <div className="auth-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* 注册表单 */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={16} />
                  <span>邮箱地址</span>
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
                  <User size={16} />
                  <span>用户名 (可选)</span>
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
                <Lock size={16} />
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
                        width: `${(Object.values(passwordStrength).filter(v => v).length / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    ></div>
                  </div>
                  <span className="password-strength-text" style={{ color: getPasswordStrengthColor() }}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
              )}
              
              {/* 密码要求 */}
              <div className="password-requirements">
                <div className={`requirement ${passwordStrength.hasLength ? 'valid' : ''}`}>
                  {passwordStrength.hasLength ? <CheckCircle size={14} /> : <div className="requirement-dot"></div>}
                  <span>至少8个字符</span>
                </div>
                <div className={`requirement ${passwordStrength.hasUpperCase ? 'valid' : ''}`}>
                  {passwordStrength.hasUpperCase ? <CheckCircle size={14} /> : <div className="requirement-dot"></div>}
                  <span>包含大写字母</span>
                </div>
                <div className={`requirement ${passwordStrength.hasLowerCase ? 'valid' : ''}`}>
                  {passwordStrength.hasLowerCase ? <CheckCircle size={14} /> : <div className="requirement-dot"></div>}
                  <span>包含小写字母</span>
                </div>
                <div className={`requirement ${passwordStrength.hasNumber ? 'valid' : ''}`}>
                  {passwordStrength.hasNumber ? <CheckCircle size={14} /> : <div className="requirement-dot"></div>}
                  <span>包含数字</span>
                </div>
                <div className={`requirement ${passwordStrength.hasSpecialChar ? 'valid' : ''}`}>
                  {passwordStrength.hasSpecialChar ? <CheckCircle size={14} /> : <div className="requirement-dot"></div>}
                  <span>包含特殊字符</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <Lock size={16} />
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
                <Key size={16} />
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
                <>
                  <UserPlus size={20} />
                  <span>注册</span>
                </>
              )}
            </button>
          </form>

          {/* 分隔线 */}
          <div className="auth-divider">
            <span>或使用其他方式注册</span>
          </div>

          {/* OAuth按钮 */}
          <div className="oauth-buttons">
            <button 
              className="oauth-btn oauth-btn-google"
              onClick={() => alert('Google注册功能开发中')}
              disabled
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              <span>使用 Google 注册</span>
            </button>
            <button 
              className="oauth-btn oauth-btn-github"
              onClick={() => alert('GitHub注册功能开发中')}
              disabled
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
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

