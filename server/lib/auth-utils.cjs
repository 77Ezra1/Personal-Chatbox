const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT密钥（生产环境应该从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token有效期7天

// 邀请码列表（从环境变量读取，逗号分隔）
const INVITE_CODES = process.env.INVITE_CODES 
  ? process.env.INVITE_CODES.split(',').map(code => code.trim())
  : ['TEST123', 'WELCOME2024', 'BETA2024'];

/**
 * 验证邀请码
 */
function validateInviteCode(code) {
  if (!code || typeof code !== 'string') {
    return false;
  }
  return INVITE_CODES.includes(code.trim().toUpperCase());
}

/**
 * 验证密码强度
 * 要求：至少8位，包含大小写字母、数字和特殊字符
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: '密码不能为空' };
  }

  if (password.length < 8) {
    return { valid: false, message: '密码至少需要8个字符' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpperCase) {
    return { valid: false, message: '密码必须包含至少一个大写字母' };
  }

  if (!hasLowerCase) {
    return { valid: false, message: '密码必须包含至少一个小写字母' };
  }

  if (!hasNumber) {
    return { valid: false, message: '密码必须包含至少一个数字' };
  }

  if (!hasSpecialChar) {
    return { valid: false, message: '密码必须包含至少一个特殊字符' };
  }

  return { valid: true };
}

/**
 * 验证邮箱格式
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 加密密码
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * 验证密码
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * 生成JWT Token
 */
function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * 验证JWT Token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * 从请求中提取Token
 */
function extractToken(req) {
  // 优先从Cookie中获取
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // 其次从Authorization header获取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  if (req.query && req.query.token) {
    return req.query.token;
  }

  return null;
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  INVITE_CODES,
  validateInviteCode,
  validatePassword,
  validateEmail,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  extractToken
};
