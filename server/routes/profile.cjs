const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../db/init.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');
const logger = require('../utils/logger.cjs');

// 配置头像上传
const uploadDir = path.join(__dirname, '../../data/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user.id;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片格式: jpeg, jpg, png, gif, webp'));
    }
  }
});

/**
 * 获取用户资料
 * GET /api/profile
 */
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await db.prepare(
      `SELECT id, email, username, avatar_url, signature, theme, language,
              timezone, currency, date_format, created_at, last_login_at
       FROM users WHERE id = ?`
    ).get(userId);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ profile: user });
  } catch (err) {
    logger.error('[Profile] Error fetching profile:', err);
    res.status(500).json({ message: '获取用户资料失败' });
  }
});

/**
 * 更新用户资料
 * PUT /api/profile
 */
router.put('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { username, signature, theme, language, timezone, currency, dateFormat } = req.body;

  try {
    // 构建更新字段
    const updates = [];
    const params = [];

    if (username !== undefined) {
      updates.push('username = ?');
      params.push(username);
    }
    if (signature !== undefined) {
      updates.push('signature = ?');
      params.push(signature);
    }
    if (theme !== undefined) {
      updates.push('theme = ?');
      params.push(theme);
    }
    if (language !== undefined) {
      updates.push('language = ?');
      params.push(language);
    }
    if (timezone !== undefined) {
      updates.push('timezone = ?');
      params.push(timezone);
    }
    if (currency !== undefined) {
      updates.push('currency = ?');
      params.push(currency);
    }
    if (dateFormat !== undefined) {
      updates.push('date_format = ?');
      params.push(dateFormat);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有需要更新的字段' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await db.prepare(sql).run(...params);

    // 获取更新后的用户信息
    const updatedUser = await db.prepare(
      `SELECT id, email, username, avatar_url, signature, theme, language,
              timezone, currency, date_format, created_at, last_login_at
       FROM users WHERE id = ?`
    ).get(userId);

    logger.info('[Profile] User profile updated:', userId);
    res.json({ message: '用户资料已更新', profile: updatedUser });
  } catch (err) {
    logger.error('[Profile] Error updating profile:', err);
    res.status(500).json({ message: '更新用户资料失败' });
  }
});

/**
 * 上传头像
 * POST /api/profile/avatar
 */
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: '未上传文件' });
  }

  try {
    // 获取旧头像路径
    const user = await db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(userId);
    const oldAvatarUrl = user?.avatar_url;

    // 生成新头像URL
    const avatarUrl = `/avatars/${req.file.filename}`;

    // 更新数据库
    await db.prepare(
      'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(avatarUrl, userId);

    // 删除旧头像文件（如果存在且不是默认头像）
    if (oldAvatarUrl && oldAvatarUrl.startsWith('/avatars/')) {
      const oldAvatarPath = path.join(__dirname, '../../data', oldAvatarUrl);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    logger.info('[Profile] Avatar uploaded for user:', userId);
    res.json({ message: '头像上传成功', avatarUrl });
  } catch (err) {
    logger.error('[Profile] Error uploading avatar:', err);

    // 删除已上传的文件
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: '头像上传失败' });
  }
});

/**
 * 删除头像
 * DELETE /api/profile/avatar
 */
router.delete('/avatar', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // 获取旧头像路径
    const user = await db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(userId);
    const oldAvatarUrl = user?.avatar_url;

    // 更新数据库（设置为null）
    await db.prepare(
      'UPDATE users SET avatar_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(userId);

    // 删除头像文件（如果存在）
    if (oldAvatarUrl && oldAvatarUrl.startsWith('/avatars/')) {
      const oldAvatarPath = path.join(__dirname, '../../data', oldAvatarUrl);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    logger.info('[Profile] Avatar deleted for user:', userId);
    res.json({ message: '头像已删除' });
  } catch (err) {
    logger.error('[Profile] Error deleting avatar:', err);
    res.status(500).json({ message: '删除头像失败' });
  }
});

module.exports = router;
