/**
 * 登录页面专用翻译
 * 独立于主应用的语言设置
 */

export const AUTH_LANGUAGE_KEY = 'auth-language.v1'

export const AUTH_TRANSLATIONS = {
  en: {
    // 步骤1 - 邮箱输入
    loginTitle: 'Log in or sign up',
    loginSubtitle: "You'll get smarter responses and can upload files, images, and more.",
    emailLabel: 'Email address',
    emailPlaceholder: 'Email address',
    continueButton: 'Continue',
    divider: 'OR',
    googleButton: 'Continue with Google',
    githubButton: 'Continue with GitHub',
    termsOfUse: 'Terms of Use',
    privacyPolicy: 'Privacy Policy',
    
    // 步骤2 - 密码输入
    enterPasswordTitle: 'Enter your password',
    createAccountTitle: 'Create your account',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Password',
    
    // 密码强度提示
    passwordRequirements: {
      length: 'At least 8 characters',
      uppercase: 'Contains uppercase letter',
      lowercase: 'Contains lowercase letter',
      number: 'Contains number',
      special: 'Contains special character'
    },
    
    // 步骤3 - 邀请码
    inviteCodeTitle: 'Enter invite code',
    inviteCodeSubtitle: 'An invite code is required to create an account',
    inviteCodeLabel: 'Invite code',
    inviteCodePlaceholder: 'Invite code',
    inviteCodeHint: "Don't have an invite code? Contact the administrator",
    
    // 错误提示
    errors: {
      invalidEmail: 'Please enter a valid email address',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      passwordTooShort: 'Password must be at least 8 characters',
      inviteCodeRequired: 'Invite code is required',
      loginFailed: 'Login failed. Please check your credentials.',
      registrationFailed: 'Registration failed. Please try again.',
      networkError: 'Network error. Please try again.'
    }
  },
  zh: {
    // 步骤1 - 邮箱输入
    loginTitle: '登录或注册',
    loginSubtitle: '您将获得更智能的响应，并可以上传文件、图片等内容。',
    emailLabel: '电子邮箱',
    emailPlaceholder: '电子邮箱',
    continueButton: '继续',
    divider: '或',
    googleButton: '使用 Google 登录',
    githubButton: '使用 GitHub 登录',
    termsOfUse: '使用条款',
    privacyPolicy: '隐私政策',
    
    // 步骤2 - 密码输入
    enterPasswordTitle: '输入您的密码',
    createAccountTitle: '创建您的账户',
    passwordLabel: '密码',
    passwordPlaceholder: '密码',
    
    // 密码强度提示
    passwordRequirements: {
      length: '至少 8 个字符',
      uppercase: '包含大写字母',
      lowercase: '包含小写字母',
      number: '包含数字',
      special: '包含特殊字符'
    },
    
    // 步骤3 - 邀请码
    inviteCodeTitle: '输入邀请码',
    inviteCodeSubtitle: '创建账户需要邀请码',
    inviteCodeLabel: '邀请码',
    inviteCodePlaceholder: '邀请码',
    inviteCodeHint: '没有邀请码？请联系管理员',
    
    // 错误提示
    errors: {
      invalidEmail: '请输入有效的电子邮箱地址',
      emailRequired: '电子邮箱不能为空',
      passwordRequired: '密码不能为空',
      passwordTooShort: '密码至少需要 8 个字符',
      inviteCodeRequired: '邀请码不能为空',
      loginFailed: '登录失败，请检查您的凭据。',
      registrationFailed: '注册失败，请重试。',
      networkError: '网络错误，请重试。'
    }
  }
}

/**
 * 获取认证页面的语言设置
 */
export function getAuthLanguage() {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(AUTH_LANGUAGE_KEY)
  return stored === 'zh' ? 'zh' : 'en'
}

/**
 * 设置认证页面的语言
 */
export function setAuthLanguage(language) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(AUTH_LANGUAGE_KEY, language)
  }
}

/**
 * 获取翻译文本
 */
export function getAuthTranslation(language, key) {
  const keys = key.split('.')
  let value = AUTH_TRANSLATIONS[language]
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k]
    } else {
      return key
    }
  }
  
  return value || key
}

