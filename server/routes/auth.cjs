const express = require('express');
const router = express.Router();
const { db } = require('../db/init.cjs');
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
    const inviteCodeResult = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM invite_codes 
         WHERE code = ? AND is_active = 1 
         AND (expires_at IS NULL OR expires_at > datetime('now'))
         AND (max_uses = -1 OR used_count < max_uses)`,
        [inviteCode.toUpperCase()],
        (err, row) => {
          if (err) {
            console.error('[Auth] 邀请码查询错误:', err);
            reject(err);
          } else {
            console.log('[Auth] 邀请码查询结果:', row);
            resolve(row);
          }
        }
      );
    });

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
    db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()], async (err, existingUser) => {
      if (err) {
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
        db.run(
          `INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)`,
          [email.toLowerCase(), passwordHash, username || null],
          function(err) {
            if (err) {
              console.error('[Auth] Error creating user:', err);
              return res.status(500).json({
                success: false,
                error: 'Database error',
                message: '创建用户失败'
              });
            }

            const userId = this.lastID;

            // 生成Token
            const token = generateToken(userId, email);

            // 创建Session（有效期7天）
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            db.run(
              `INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)`,
              [userId, token, expiresAt.toISOString(), req.ip, req.get('user-agent')],
              (err) => {
                if (err) {
                  console.error('[Auth] Error creating session:', err);
                  return res.status(500).json({
                    success: false,
                    error: 'Database error',
                    message: '创建会话失败'
                  });
                }

                // 记录登录历史
                db.run(
                  `INSERT INTO login_history (user_id, ip_address, user_agent, success) VALUES (?, ?, ?, 1)`,
                  [userId, req.ip, req.get('user-agent')]
                );

                // 更新邀请码使用次数
                db.run(
                  `UPDATE invite_codes SET used_count = used_count + 1 WHERE code = ?`,
                  [inviteCode.toUpperCase()],
                  (err) => {
                    if (err) {
                      console.error('[Auth] Error updating invite code:', err);
                    }
                  }
                );

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
              }
            );
          }
        );
      } catch (error) {
        console.error('[Auth] Error hashing password:', error);
        return res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: '服务器错误'
        });
      }
    });
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
    db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, user) => {
      if (err) {
        console.error('[Auth] Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: '服务器错误'
        });
      }

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
          db.run('UPDATE users SET is_locked = 0, locked_until = NULL, failed_login_attempts = 0 WHERE id = ?', [user.id]);
        }
      }

      try {
        // 验证密码
        const isValid = await verifyPassword(password, user.password_hash);

        if (!isValid) {
          // 登录失败，增加失败次数
          const newAttempts = (user.failed_login_attempts || 0) + 1;
          
          if (newAttempts >= 5) {
            // 锁定账号15分钟
            const lockedUntil = new Date();
            lockedUntil.setMinutes(lockedUntil.getMinutes() + 15);
            
            db.run(
              'UPDATE users SET failed_login_attempts = ?, is_locked = 1, locked_until = ? WHERE id = ?',
              [newAttempts, lockedUntil.toISOString(), user.id]
            );

            // 记录失败的登录历史
            db.run(
              `INSERT INTO login_history (user_id, ip_address, user_agent, success, failure_reason) VALUES (?, ?, ?, 0, ?)`,
              [user.id, req.ip, req.get('user-agent'), 'Account locked due to multiple failed attempts']
            );

            return res.status(423).json({
              success: false,
              error: 'Account locked',
              message: '登录失败次数过多，账号已被锁定15分钟'
            });
          } else {
            db.run('UPDATE users SET failed_login_attempts = ? WHERE id = ?', [newAttempts, user.id]);

            // 记录失败的登录历史
            db.run(
              `INSERT INTO login_history (user_id, ip_address, user_agent, success, failure_reason) VALUES (?, ?, ?, 0, ?)`,
              [user.id, req.ip, req.get('user-agent'), 'Invalid password']
            );

            return res.status(401).json({
              success: false,
              error: 'Invalid credentials',
              message: `邮箱或密码错误（剩余${5 - newAttempts}次尝试机会）`
            });
          }
        }

        // 登录成功，重置失败次数
        db.run('UPDATE users SET failed_login_attempts = 0, last_login_at = datetime("now") WHERE id = ?', [user.id]);

        // 生成Token
        const token = generateToken(user.id, user.email);

        // 创建Session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        db.run(
          `INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)`,
          [user.id, token, expiresAt.toISOString(), req.ip, req.get('user-agent')],
          (err) => {
            if (err) {
              console.error('[Auth] Error creating session:', err);
              return res.status(500).json({
                success: false,
                error: 'Database error',
                message: '创建会话失败'
              });
            }

            // 记录成功的登录历史
            db.run(
              `INSERT INTO login_history (user_id, ip_address, user_agent, success) VALUES (?, ?, ?, 1)`,
              [user.id, req.ip, req.get('user-agent')]
            );

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
          }
        );
      } catch (error) {
        console.error('[Auth] Error verifying password:', error);
        return res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: '服务器错误'
        });
      }
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
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
router.post('/logout', authMiddleware, (req, res) => {
  try {
    const token = req.session.token;

    // 删除Session
    db.run('DELETE FROM sessions WHERE token = ?', [token], (err) => {
      if (err) {
        console.error('[Auth] Error deleting session:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: '登出失败'
        });
      }

      // 清除Cookie
      res.clearCookie('token');

      res.json({
        success: true,
        message: '登出成功'
      });
    });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: '服务器错误'
    });
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
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

    // 查询邮箱是否存在
    db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()], (err, user) => {
      if (err) {
        console.error('[Auth] Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: '服务器错误'
        });
      }

      res.json({
        success: true,
        exists: !!user
      });
    });
  } catch (error) {
    console.error('[Auth] Check email error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: '服务器错误'
    });
  }
});

module.exports = router;

