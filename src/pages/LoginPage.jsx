import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Check, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  const [step, setStep] = useState(1); // 1: email, 2: password, 3: invite code
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    inviteCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 检查邮箱是否已注册（这里需要调用API检查）
      // 暂时模拟：如果邮箱包含'new'就当作新用户
      const checkEmail = formData.email.toLowerCase().includes('new');
      setIsNewUser(checkEmail);
      setStep(2);
    } catch {
      setError('Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 如果是新用户，检查密码强度
    if (isNewUser) {
      const allValid = Object.values(passwordStrength).every(v => v);
      if (!allValid) {
        setError('Password does not meet all requirements');
        return;
      }
      // 新用户需要输入邀请码
      setStep(3);
      return;
    }

    // 老用户直接登录
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('Login failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await register(
        formData.email,
        formData.password,
        formData.inviteCode,
        null
      );
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch {
      setError('Registration failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 2) {
      setStep(1);
      setFormData({ ...formData, password: '' });
    } else if (step === 3) {
      setStep(2);
      setFormData({ ...formData, inviteCode: '' });
    }
  };

  return (
    <div className="auth-page">
      {/* 顶部Logo */}
      <div className="auth-page-header">
        <a href="/" className="auth-logo-text">Personal Chatbox</a>
      </div>

      {/* 返回按钮 */}
      {step > 1 && (
        <button 
          onClick={handleBack}
          className="auth-back-btn"
          type="button"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      <div className="auth-content">

          {/* 步骤1: 邮箱输入 */}
          {step === 1 && (
            <>
              <h1 className="auth-title">Log in or sign up</h1>
              <p className="auth-subtitle">
                You'll get smarter responses and can upload files, images, and more.
              </p>

              {error && (
                <div className="auth-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    disabled={loading}
                    className="form-input"
                    autoComplete="email"
                    autoFocus
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
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Continue</span>
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <div className="oauth-buttons">
                <button 
                  className="oauth-btn oauth-btn-google"
                  onClick={() => alert('Google登录功能开发中')}
                  disabled
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
                    <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
                    <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
                    <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
                
                <button 
                  className="oauth-btn oauth-btn-github"
                  onClick={() => alert('GitHub登录功能开发中')}
                  disabled
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"/>
                  </svg>
                  <span>Continue with GitHub</span>
                </button>
              </div>

              <div className="auth-terms">
                <a href="#" onClick={(e) => e.preventDefault()}>Terms of Use</a>
                <span>|</span>
                <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              </div>
            </>
          )}

          {/* 步骤2: 密码输入 */}
          {step === 2 && (
            <>
              <h1 className="auth-title">{isNewUser ? 'Create your account' : 'Enter your password'}</h1>
              <p className="auth-subtitle auth-email-display">
                {formData.email}
              </p>

              {error && (
                <div className="auth-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    disabled={loading}
                    className="form-input"
                    autoComplete={isNewUser ? "new-password" : "current-password"}
                    autoFocus
                  />
                  
                  {/* 密码要求（仅新用户） */}
                  {isNewUser && formData.password && (
                    <div className="password-requirements">
                      <div className={`requirement ${passwordStrength.hasLength ? 'valid' : ''}`}>
                        {passwordStrength.hasLength ? (
                          <Check size={14} />
                        ) : (
                          <div className="requirement-dot"></div>
                        )}
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`requirement ${passwordStrength.hasUpperCase ? 'valid' : ''}`}>
                        {passwordStrength.hasUpperCase ? (
                          <Check size={14} />
                        ) : (
                          <div className="requirement-dot"></div>
                        )}
                        <span>Contains uppercase letter</span>
                      </div>
                      <div className={`requirement ${passwordStrength.hasLowerCase ? 'valid' : ''}`}>
                        {passwordStrength.hasLowerCase ? (
                          <Check size={14} />
                        ) : (
                          <div className="requirement-dot"></div>
                        )}
                        <span>Contains lowercase letter</span>
                      </div>
                      <div className={`requirement ${passwordStrength.hasNumber ? 'valid' : ''}`}>
                        {passwordStrength.hasNumber ? (
                          <Check size={14} />
                        ) : (
                          <div className="requirement-dot"></div>
                        )}
                        <span>Contains number</span>
                      </div>
                      <div className={`requirement ${passwordStrength.hasSpecialChar ? 'valid' : ''}`}>
                        {passwordStrength.hasSpecialChar ? (
                          <Check size={14} />
                        ) : (
                          <div className="requirement-dot"></div>
                        )}
                        <span>Contains special character</span>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="auth-btn auth-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="btn-spinner"></span>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Continue</span>
                  )}
                </button>
              </form>
            </>
          )}

          {/* 步骤3: 邀请码输入（仅新用户） */}
          {step === 3 && (
            <>
              <h1 className="auth-title">Enter invite code</h1>
              <p className="auth-subtitle">
                An invite code is required to create an account
              </p>

              {error && (
                <div className="auth-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleInviteCodeSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="inviteCode">Invite code</label>
                  <input
                    id="inviteCode"
                    name="inviteCode"
                    type="text"
                    required
                    value={formData.inviteCode}
                    onChange={handleChange}
                    placeholder="Invite code"
                    disabled={loading}
                    className="form-input"
                    autoComplete="off"
                    autoFocus
                  />
                  <p className="form-hint">
                    Don't have an invite code? Contact the administrator
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
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Continue</span>
                  )}
                </button>
              </form>
            </>
          )}
      </div>
    </div>
  );
}

