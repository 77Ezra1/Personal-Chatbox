import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Check, ArrowLeft, Globe } from 'lucide-react';
import { getAuthLanguage, setAuthLanguage, getAuthTranslation } from '../lib/authTranslations';

import { createLogger } from '../lib/logger'
const logger = createLogger('LoginPage')


export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // 语言状态（独立于主应用）
  const [language, setLanguage] = useState(() => getAuthLanguage());

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

  // 切换语言
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    setAuthLanguage(newLang);
  };

  // 翻译函数
  const t = (key) => getAuthTranslation(language, key);

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

    try {
      // 验证邮箱
      const email = formData.email.trim();
      if (!email) {
        throw new Error(t('errors.emailRequired'));
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error(t('errors.invalidEmail'));
      }

      setLoading(true);

      // 调用后端API检查邮箱是否已注册
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      logger.log('[Auth] Email check response:', data);

      if (!response.ok) {
        throw new Error(data.message || t('errors.networkError'));
      }

      // 更新状态前同步存储email
      setFormData(prev => ({
        ...prev,
        email: email
      }));

      // 根据后端返回判断是新用户还是老用户
      setIsNewUser(!data.exists);
      setStep(2);
    } catch (err) {
      logger.error('[Auth] Email submit error:', err);
      setError(err.message || t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const password = formData.password;
      if (!password) {
        throw new Error(t('errors.passwordRequired'));
      }

      // 验证密码强度
      const allValid = Object.values(passwordStrength).every(v => v);
      if (isNewUser && !allValid) {
        throw new Error(t('errors.passwordRequirements.summary'));
      }

      setLoading(true);

      if (isNewUser) {
        // 新用户注册 - 进入邀请码步骤
        logger.log('[Auth] New user, proceeding to invite code step');
        setStep(3);
      } else {
        // 老用户登录
        logger.log('[Auth] Existing user, attempting login');
        const result = await login(formData.email, password);
        if (!result.success) {
          throw new Error(result.error || t('errors.loginFailed'));
        }
        navigate('/');
      }
    } catch (err) {
      logger.error('[Auth] Password submit error:', err);
      setError(err.message || t('errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleInviteCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { email, password, inviteCode } = formData;

      // 再次验证所有字段
      if (!email || !email.trim()) {
        throw new Error(t('errors.emailRequired'));
      }

      if (!password) {
        throw new Error(t('errors.passwordRequired'));
      }

      if (!inviteCode || !inviteCode.trim()) {
        throw new Error(t('errors.inviteCodeRequired'));
      }

      setLoading(true);

      // 尝试注册
      logger.log('[Auth] Attempting registration...');
      const result = await register(
        email.trim(),
        password,
        inviteCode.trim()
      );

      if (!result.success) {
        logger.error('[Auth] Registration failed:', result.error);

        // 如果是邮箱已存在错误，提供更友好的处理
        if (result.error && (result.error.includes('已被注册') || result.error.includes('already exists'))) {
          // 邮箱已存在，重置到登录流程
          setIsNewUser(false);
          setStep(2);
          setFormData({ ...formData, inviteCode: '' });
          throw new Error(t('errors.emailExists') + ' ' + t('errors.pleaseLogin'));
        }

        throw new Error(result.error);
      }

      logger.log('[Auth] Registration successful');
      navigate('/');
    } catch (err) {
      logger.error('[Auth] Registration error:', err);
      setError(err.message || t('errors.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
      setFormData({ ...formData, password: '', inviteCode: '' });
      setPasswordStrength({
        hasLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
      });
    }
  };

  return (
    <div className="auth-page">
      {/* 顶部Logo */}
      <div className="auth-page-header">
        <a href="/" className="auth-logo-text">Personal Chatbox</a>
      </div>

      {/* 语言切换按钮 */}
      <button
        onClick={toggleLanguage}
        className="auth-language-btn"
        type="button"
        title={language === 'en' ? '切换到中文' : 'Switch to English'}
      >
        <Globe size={20} />
        <span>{language === 'en' ? '中文' : 'EN'}</span>
      </button>

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
              <h1 className="auth-title">{t('loginTitle')}</h1>
              <p className="auth-subtitle">
                {t('loginSubtitle')}
              </p>

              {error && (
                <div className="auth-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">{t('emailLabel')}</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('emailPlaceholder')}
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
                    <span className="btn-spinner"></span>
                  ) : (
                    <span>{t('continueButton')}</span>
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>{t('divider')}</span>
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
                  <span>{t('googleButton')}</span>
                </button>

                <button
                  className="oauth-btn oauth-btn-github"
                  onClick={() => alert('GitHub登录功能开发中')}
                  disabled
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"/>
                  </svg>
                  <span>{t('githubButton')}</span>
                </button>
              </div>

              <div className="auth-terms">
                <a href="/terms">{t('termsOfUse')}</a>
                <span>|</span>
                <a href="/privacy">{t('privacyPolicy')}</a>
              </div>
            </>
          )}

          {/* 步骤2: 密码输入 */}
          {step === 2 && (
            <>
              <h1 className="auth-title">
                {isNewUser ? t('createAccountTitle') : t('enterPasswordTitle')}
              </h1>
              <p className="auth-subtitle">
                <span className="auth-email-display">{formData.email}</span>
              </p>

              {error && (
                <div className="auth-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="password">{t('passwordLabel')}</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t('passwordPlaceholder')}
                    disabled={loading}
                    className="form-input"
                    autoComplete={isNewUser ? 'new-password' : 'current-password'}
                    autoFocus
                  />
                </div>

                {isNewUser && (
                  <div className="password-requirements">
                    <div className={`requirement ${passwordStrength.hasLength ? 'valid' : ''}`}>
                      {passwordStrength.hasLength ? <Check size={14} /> : <div className="requirement-dot" />}
                      <span>{t('passwordRequirements.length')}</span>
                    </div>
                    <div className={`requirement ${passwordStrength.hasUpperCase ? 'valid' : ''}`}>
                      {passwordStrength.hasUpperCase ? <Check size={14} /> : <div className="requirement-dot" />}
                      <span>{t('passwordRequirements.uppercase')}</span>
                    </div>
                    <div className={`requirement ${passwordStrength.hasLowerCase ? 'valid' : ''}`}>
                      {passwordStrength.hasLowerCase ? <Check size={14} /> : <div className="requirement-dot" />}
                      <span>{t('passwordRequirements.lowercase')}</span>
                    </div>
                    <div className={`requirement ${passwordStrength.hasNumber ? 'valid' : ''}`}>
                      {passwordStrength.hasNumber ? <Check size={14} /> : <div className="requirement-dot" />}
                      <span>{t('passwordRequirements.number')}</span>
                    </div>
                    <div className={`requirement ${passwordStrength.hasSpecialChar ? 'valid' : ''}`}>
                      {passwordStrength.hasSpecialChar ? <Check size={14} /> : <div className="requirement-dot" />}
                      <span>{t('passwordRequirements.special')}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-btn auth-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-spinner"></span>
                  ) : (
                    <span>{t('continueButton')}</span>
                  )}
                </button>
              </form>
            </>
          )}

          {/* 步骤3: 邀请码输入（仅新用户） */}
          {step === 3 && (
            <>
              {/* 返回按钮 */}
              <button onClick={handleBack} className="auth-back-btn">
                <ArrowLeft size={20} />
              </button>

              <h1 className="auth-title">{t('inviteCodeTitle')}</h1>
              <p className="auth-subtitle">
                {t('inviteCodeSubtitle')}
              </p>

              {error && (
                <div className="auth-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleInviteCodeSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="inviteCode">{t('inviteCodeLabel')}</label>
                  <input
                    id="inviteCode"
                    name="inviteCode"
                    type="text"
                    required
                    value={formData.inviteCode}
                    onChange={handleChange}
                    placeholder={t('inviteCodePlaceholder')}
                    disabled={loading}
                    className="form-input"
                    autoComplete="off"
                    autoFocus
                  />
                  <p className="form-hint">
                    {t('inviteCodeHint')}
                  </p>
                </div>

                <button
                  type="submit"
                  className="auth-btn auth-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-spinner"></span>
                  ) : (
                    <span>{t('continueButton')}</span>
                  )}
                </button>
              </form>
            </>
          )}
      </div>
    </div>
  );
}
