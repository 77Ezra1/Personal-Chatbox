const express = require('express');
const router = express.Router();
const { db } = require('../db/init.cjs');
const logger = require('../utils/logger.cjs');
const {
  validateInviteCode,
  validatePassword,
  validateEmail,
  hashPassword,
  verifyPassword,
  generateToken
} = require('../lib/auth-utils.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, inviteCode, username } = req.body;

    // 验证必填字段
    if (!email || !password || !inviteCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: '请填写所有必填字段'
      });
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email',
        message: '邮箱格式不正确'
      });
    }

    // 验证邀请码（从数据库查询）
    console.log('[Auth] 验证邀请码:', inviteCode, '-> 转换为大写:', inviteCode.toUpperCase());
    let inviteCodeResult;
    try {
      inviteCodeResult = await db.prepare(
        `SELECT * FROM invite_codes
         WHERE code = ? AND is_active = true
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
         AND (max_uses = -1 OR used_count < max_uses)`
      ).get(inviteCode.toUpperCase());
      console.log('[Auth] 邀请码查询结果:', inviteCodeResult);
    } catch (err) {
      console.error('[Auth] 邀请码查询错误:', err);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: '数据库查询错误'
      });
    }

    if (!inviteCodeResult) {
      console.log('[Auth] 邀请码验证失败');
      return res.status(400).json({
        success: false,
        error: 'Invalid invite code',
        message: '邀请码无效或已过期'
      });
    }

    console.log('[Auth] 邀请码验证成功:', inviteCodeResult);

    // 验证密码强度
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Weak password',
        message: passwordValidation.message
      });
    }

    // 检查邮箱是否已存在
    let existingUser;
    try {
      existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    } catch (err) {
      console.error('[Auth] Database error:', err);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: '服务器错误'
      });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
        message: '该邮箱已被注册'
      });
    }

    try {
      // 加密密码
      const passwordHash = await hashPassword(password);

      // 创建用户
      const result = await db.prepare(
        `INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?) RETURNING id`
      ).run(email.toLowerCase(), passwordHash, username || null);

      const userId = result.lastID || result.rows?.[0]?.id;

      if (!userId) {
        throw new Error('Failed to get user ID after registration');
      }

      // 生成Token
      const token = generateToken(userId, email);

      // 创建Session（有效期7天）
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // 使用事务确保所有操作成功或全部回滚
      await db.prepare(
        `INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)`
      ).run(userId, token, expiresAt.toISOString(), req.ip, req.get('user-agent'));

      // 记录登录历史
      await db.prepare(
        `INSERT INTO login_history (user_id, ip_address, user_agent, success) VALUES (?, ?, ?, ?)`
      ).run(userId, req.ip, req.get('user-agent'), 1);

      // 更新邀请码使用次数
      try {
        await db.prepare(
          `UPDATE invite_codes SET used_count = used_count + 1 WHERE code = ?`
        ).run(inviteCode.toUpperCase());
      } catch (err) {
        logger.error('[Auth] Error updating invite code:', err);
        // 不阻断注册流程
      }

      // 设置Cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
      });

      // 返回成功响应
      res.json({
        success: true,
        message: '注册成功',
        user: {
          id: userId,
          email: email.toLowerCase(),
          username: username || null
        },
        token
      });
    } catch (error) {
      console.error('[Auth] Error hashing password:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: '服务器错误'
      });
    }
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: '服务器错误'
    });
  }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: '请填写邮箱和密码'
      });
    }

    // 查找用户
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: '邮箱或密码错误'
      });
    }

    // 检查账号是否被锁定
    if (user.is_locked && user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      if (lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil((lockedUntil - new Date()) / 60000);
        return res.status(423).json({
          success: false,
          error: 'Account locked',
          message: `账号已被锁定，请在${remainingMinutes}分钟后重试`
        });
      } else {
        // 锁定期已过，解锁账号
        await db.prepare('UPDATE users SET is_locked = 0, locked_until = NULL, failed_login_attempts = 0 WHERE id = ?').run(user.id);
      }
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      // 登录失败，增加失败次数
      const newAttempts = (user.failed_login_attempts || 0) + 1;

      if (newAttempts >= 5) {
        // 锁定账号15分钟
        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + 15);

        await db.prepare(
          'UPDATE users SET failed_login_attempts = ?, is_locked = 1, locked_until = ? WHERE id = ?'
        ).run(newAttempts, lockedUntil.toISOString(), user.id);

        // 记录失败的登录历史
        await db.prepare(
          `INSERT INTO login_history (user_id, ip_address, user_agent, success, failure_reason) VALUES (?, ?, ?, ?, ?)`
        ).run(user.id, req.ip, req.get('user-agent'), 0, 'Account locked due to multiple failed attempts');

        return res.status(423).json({
          success: false,
          error: 'Account locked',
          message: '登录失败次数过多，账号已被锁定15分钟'
        });
      } else {
        await db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?').run(newAttempts, user.id);

        // 记录失败的登录历史
        await db.prepare(
          `INSERT INTO login_history (user_id, ip_address, user_agent, success, failure_reason) VALUES (?, ?, ?, ?, ?)`
        ).run(user.id, req.ip, req.get('user-agent'), 0, 'Invalid password');

        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: `邮箱或密码错误（剩余${5 - newAttempts}次尝试机会）`
        });
      }
    }

    // 登录成功，重置失败次数
    const now = new Date().toISOString();
    await db.prepare("UPDATE users SET failed_login_attempts = 0, last_login_at = ? WHERE id = ?").run(now, user.id);

    // 生成Token
    const token = generateToken(user.id, user.email);

    // 创建Session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.prepare(
      `INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)`
    ).run(user.id, token, expiresAt.toISOString(), req.ip, req.get('user-agent'));

    // 记录成功的登录历史
    await db.prepare(
      `INSERT INTO login_history (user_id, ip_address, user_agent, success) VALUES (?, ?, ?, ?)`
    ).run(user.id, req.ip, req.get('user-agent'), 1);

    // 设置Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 返回成功响应
    res.json({
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url
      },
      token
    });
  } catch (error) {
    logger.error('[Auth] Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: '服务器错误'
    });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.session.token;

    // 删除Session
    await db.prepare('DELETE FROM sessions WHERE token = ?').run(token);

    // 清除Cookie
    res.clearCookie('token');

    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    logger.error('[Auth] Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: '服务器错误'
    });
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息（使用可选认证，避免401错误）
 */
router.get('/me', async (req, res) => {
  try {
    const { extractToken, verifyToken } = require('../lib/auth-utils.cjs');

    // 提取Token
    const token = extractToken(req);

    if (!token) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null
      });
    }

    // 验证Token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null
      });
    }

    // 检查Session是否存在且未过期
    const session = await db.prepare(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')"
    ).get(token);

    if (!session) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null
      });
    }

    // 获取用户信息
    const user = await db.prepare(
      'SELECT id, email, username, avatar_url, created_at FROM users WHERE id = ?'
    ).get(decoded.userId);

    if (!user) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null
      });
    }

    // 返回用户信息
    res.json({
      success: true,
      authenticated: true,
      user
    });
  } catch (error) {
    logger.error('[Auth] /me error:', error);
    res.status(200).json({
      success: true,
      authenticated: false,
      user: null
    });
  }
});

/**
 * POST /api/auth/check-email
 * 检查邮箱是否已注册
 */
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Missing email',
        message: '请提供邮箱地址'
      });
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email',
        message: '邮箱格式不正确'
      });
    }

    // 数据库不可用时的降级响应（避免前端解析空响应导致 JSON 错误）
    if (!db) {
      return res.status(503).json({
        success: false,
        error: 'Service unavailable',
        message: '本地数据库未初始化，请稍后重试或重建 sqlite3 绑定'
      });
    }

    // 查询邮箱是否存在
    const user = await db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());

    res.json({
      success: true,
      exists: !!user
    });
  } catch (error) {
    logger.error('[Auth] Check email error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: '服务器错误'
    });
  }
});

module.exports = router;

