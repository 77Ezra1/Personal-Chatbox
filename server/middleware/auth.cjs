const { verifyToken, extractToken } = require('../lib/auth-utils.cjs');
const { db } = require('../db/init.cjs');

/**
 * 认证中间件
 * 验证用户是否已登录
 */
function authMiddleware(req, res, next) {
  try {
    // 提取Token
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '未登录或登录已过期'
      });
    }

    // 验证Token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token无效或已过期'
      });
    }

    // 检查Session是否存在且未过期
    db.get(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')",
      [token],
      (err, session) => {
        if (err) {
          console.error('[Auth Middleware] Database error:', err);
          return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: '服务器错误'
          });
        }

        if (!session) {
          return res.status(401).json({
            success: false,
            error: 'Session expired',
            message: '登录已过期，请重新登录'
          });
        }

        // 获取用户信息
        db.get(
          'SELECT id, email, username, avatar_url, created_at FROM users WHERE id = ?',
          [decoded.userId],
          (err, user) => {
            if (err) {
              console.error('[Auth Middleware] Database error:', err);
              return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: '服务器错误'
              });
            }

            if (!user) {
              return res.status(401).json({
                success: false,
                error: 'User not found',
                message: '用户不存在'
              });
            }

            // 将用户信息附加到请求对象
            req.user = user;
            req.session = session;
            next();
          }
        );
      }
    );
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: '服务器错误'
    });
  }
}

/**
 * 可选认证中间件
 * 如果有Token则验证，没有则继续
 */
function optionalAuthMiddleware(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return next();
  }

  db.get(
    'SELECT id, email, username, avatar_url, created_at FROM users WHERE id = ?',
    [decoded.userId],
    (err, user) => {
      if (!err && user) {
        req.user = user;
      }
      next();
    }
  );
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};

