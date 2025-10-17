/**
 * 密码保险库 API 路由
 * 提供密码存储、检索、加密、解密等功能
 */

const express = require('express');
const router = express.Router();
const encryptionService = require('../services/encryptionService.cjs');
const logger = require('../lib/logger.cjs');

/**
 * 获取数据库适配器
 */
function getDb(req) {
  return req.app.locals.db;
}

/**
 * 检查用户是否设置了主密码
 */
router.get('/master-password/check', async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDb(req);

    const masterPassword = await db.get(
      'SELECT id FROM master_password WHERE user_id = ?',
      [userId]
    );

    res.json({
      hasMainPassword: !!masterPassword
    });
  } catch (error) {
    logger.error('检查主密码失败:', error);
    res.status(500).json({ error: '检查主密码失败' });
  }
});

/**
 * 设置主密码
 */
router.post('/master-password/setup', async (req, res) => {
  try {
    const userId = req.user.id;
    const { masterPassword } = req.body;

    if (!masterPassword || masterPassword.length < 8) {
      return res.status(400).json({ error: '主密码长度至少为8个字符' });
    }

    const db = getDb(req);

    // 检查是否已设置主密码
    const existing = await db.get(
      'SELECT id FROM master_password WHERE user_id = ?',
      [userId]
    );

    if (existing) {
      return res.status(400).json({ error: '主密码已设置，请使用修改功能' });
    }

    // 生成盐值和哈希
    const salt = encryptionService.generateSalt();
    const hash = encryptionService.hashPassword(masterPassword, salt);

    // 保存主密码
    await db.run(
      `INSERT INTO master_password (user_id, password_hash, salt)
       VALUES (?, ?, ?)`,
      [userId, hash, salt]
    );

    res.json({ success: true, message: '主密码设置成功' });
  } catch (error) {
    logger.error('设置主密码失败:', error);
    res.status(500).json({ error: '设置主密码失败' });
  }
});

/**
 * 验证主密码
 */
router.post('/master-password/verify', async (req, res) => {
  try {
    const userId = req.user.id;
    const { masterPassword } = req.body;

    if (!masterPassword) {
      return res.status(400).json({ error: '请输入主密码' });
    }

    const db = getDb(req);

    const record = await db.get(
      'SELECT password_hash, salt FROM master_password WHERE user_id = ?',
      [userId]
    );

    if (!record) {
      return res.status(404).json({ error: '未设置主密码' });
    }

    const isValid = encryptionService.verifyPassword(
      masterPassword,
      record.password_hash,
      record.salt
    );

    if (!isValid) {
      return res.status(401).json({ error: '主密码错误' });
    }

    res.json({ success: true, salt: record.salt });
  } catch (error) {
    logger.error('验证主密码失败:', error);
    res.status(500).json({ error: '验证主密码失败' });
  }
});

/**
 * 修改主密码
 */
router.put('/master-password/change', async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请提供旧密码和新密码' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: '新密码长度至少为8个字符' });
    }

    const db = getDb(req);

    // 验证旧密码
    const record = await db.get(
      'SELECT password_hash, salt FROM master_password WHERE user_id = ?',
      [userId]
    );

    if (!record) {
      return res.status(404).json({ error: '未设置主密码' });
    }

    const isValid = encryptionService.verifyPassword(
      oldPassword,
      record.password_hash,
      record.salt
    );

    if (!isValid) {
      return res.status(401).json({ error: '旧密码错误' });
    }

    // 获取所有密码条目
    const entries = await db.all(
      'SELECT * FROM password_vault WHERE user_id = ?',
      [userId]
    );

    // 使用旧密码解密，然后用新密码重新加密
    const newSalt = encryptionService.generateSalt();
    const newHash = encryptionService.hashPassword(newPassword, newSalt);

    // 开始事务
    await db.run('BEGIN TRANSACTION');

    try {
      // 更新主密码
      await db.run(
        'UPDATE master_password SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [newHash, newSalt, userId]
      );

      // 重新加密所有密码
      for (const entry of entries) {
        const decrypted = encryptionService.decrypt(
          entry.encrypted_password,
          oldPassword,
          record.salt
        );
        const reencrypted = encryptionService.encrypt(
          decrypted,
          newPassword,
          newSalt
        );

        await db.run(
          'UPDATE password_vault SET encrypted_password = ? WHERE id = ?',
          [reencrypted, entry.id]
        );
      }

      await db.run('COMMIT');
      res.json({ success: true, message: '主密码修改成功' });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('修改主密码失败:', error);
    res.status(500).json({ error: '修改主密码失败' });
  }
});

/**
 * 获取所有密码条目（不包含实际密码）
 */
router.get('/entries', async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, search, favorite } = req.query;
    const db = getDb(req);

    let query = `
      SELECT id, user_id, title, username, url, category, notes, tags,
             favorite, created_at, updated_at, last_accessed
      FROM password_vault
      WHERE user_id = ?
    `;
    const params = [userId];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (title LIKE ? OR username LIKE ? OR url LIKE ? OR notes LIKE ? OR tags LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (favorite === 'true') {
      query += ' AND favorite = 1';
    }

    query += ' ORDER BY created_at DESC';

    const entries = await db.all(query, params);
    res.json(entries);
  } catch (error) {
    logger.error('获取密码条目失败:', error);
    res.status(500).json({ error: '获取密码条目失败' });
  }
});

/**
 * 获取单个密码条目（包含解密后的密码）
 */
router.post('/entries/:id/decrypt', async (req, res) => {
  try {
    const userId = req.user.id;
    const entryId = req.params.id;
    const { masterPassword } = req.body;

    if (!masterPassword) {
      return res.status(400).json({ error: '请提供主密码' });
    }

    const db = getDb(req);

    // 获取主密码盐值
    const masterRecord = await db.get(
      'SELECT password_hash, salt FROM master_password WHERE user_id = ?',
      [userId]
    );

    if (!masterRecord) {
      return res.status(404).json({ error: '未设置主密码' });
    }

    // 验证主密码
    const isValid = encryptionService.verifyPassword(
      masterPassword,
      masterRecord.password_hash,
      masterRecord.salt
    );

    if (!isValid) {
      return res.status(401).json({ error: '主密码错误' });
    }

    // 获取密码条目
    const entry = await db.get(
      'SELECT * FROM password_vault WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    if (!entry) {
      return res.status(404).json({ error: '密码条目不存在' });
    }

    // 解密密码
    const decryptedPassword = encryptionService.decrypt(
      entry.encrypted_password,
      masterPassword,
      masterRecord.salt
    );

    // 更新最后访问时间
    await db.run(
      'UPDATE password_vault SET last_accessed = CURRENT_TIMESTAMP WHERE id = ?',
      [entryId]
    );

    res.json({
      ...entry,
      password: decryptedPassword
    });
  } catch (error) {
    logger.error('解密密码失败:', error);
    res.status(500).json({ error: '解密密码失败' });
  }
});

/**
 * 创建新的密码条目
 */
router.post('/entries', async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, username, password, url, category, notes, tags, masterPassword } = req.body;

    if (!title || !password || !masterPassword) {
      return res.status(400).json({ error: '标题、密码和主密码为必填项' });
    }

    const db = getDb(req);

    // 获取主密码盐值并验证
    const masterRecord = await db.get(
      'SELECT password_hash, salt FROM master_password WHERE user_id = ?',
      [userId]
    );

    if (!masterRecord) {
      return res.status(404).json({ error: '未设置主密码' });
    }

    const isValid = encryptionService.verifyPassword(
      masterPassword,
      masterRecord.password_hash,
      masterRecord.salt
    );

    if (!isValid) {
      return res.status(401).json({ error: '主密码错误' });
    }

    // 加密密码
    const encryptedPassword = encryptionService.encrypt(
      password,
      masterPassword,
      masterRecord.salt
    );

    // 保存密码条目
    const result = await db.run(
      `INSERT INTO password_vault (user_id, title, username, encrypted_password, url, category, notes, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, username || null, encryptedPassword, url || null, category || 'general', notes || null, tags || null]
    );

    res.json({
      success: true,
      id: result.lastID,
      message: '密码保存成功'
    });
  } catch (error) {
    logger.error('创建密码条目失败:', error);
    res.status(500).json({ error: '创建密码条目失败' });
  }
});

/**
 * 更新密码条目
 */
router.put('/entries/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const entryId = req.params.id;
    const { title, username, password, url, category, notes, tags, masterPassword } = req.body;

    if (!masterPassword) {
      return res.status(400).json({ error: '请提供主密码' });
    }

    const db = getDb(req);

    // 获取主密码盐值并验证
    const masterRecord = await db.get(
      'SELECT password_hash, salt FROM master_password WHERE user_id = ?',
      [userId]
    );

    if (!masterRecord) {
      return res.status(404).json({ error: '未设置主密码' });
    }

    const isValid = encryptionService.verifyPassword(
      masterPassword,
      masterRecord.password_hash,
      masterRecord.salt
    );

    if (!isValid) {
      return res.status(401).json({ error: '主密码错误' });
    }

    // 获取旧的密码条目
    const oldEntry = await db.get(
      'SELECT * FROM password_vault WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    if (!oldEntry) {
      return res.status(404).json({ error: '密码条目不存在' });
    }

    // 如果密码有变化，保存历史记录
    if (password) {
      await db.run(
        'INSERT INTO password_history (vault_id, encrypted_password) VALUES (?, ?)',
        [entryId, oldEntry.encrypted_password]
      );

      // 加密新密码
      const encryptedPassword = encryptionService.encrypt(
        password,
        masterPassword,
        masterRecord.salt
      );

      await db.run(
        `UPDATE password_vault
         SET title = ?, username = ?, encrypted_password = ?, url = ?,
             category = ?, notes = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [title, username || null, encryptedPassword, url || null, category || 'general', notes || null, tags || null, entryId, userId]
      );
    } else {
      // 只更新其他字段
      await db.run(
        `UPDATE password_vault
         SET title = ?, username = ?, url = ?, category = ?, notes = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [title, username || null, url || null, category || 'general', notes || null, tags || null, entryId, userId]
      );
    }

    res.json({ success: true, message: '密码更新成功' });
  } catch (error) {
    logger.error('更新密码条目失败:', error);
    res.status(500).json({ error: '更新密码条目失败' });
  }
});

/**
 * 删除密码条目
 */
router.delete('/entries/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const entryId = req.params.id;

    const db = getDb(req);

    const result = await db.run(
      'DELETE FROM password_vault WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: '密码条目不存在' });
    }

    res.json({ success: true, message: '密码删除成功' });
  } catch (error) {
    logger.error('删除密码条目失败:', error);
    res.status(500).json({ error: '删除密码条目失败' });
  }
});

/**
 * 切换收藏状态
 */
router.patch('/entries/:id/favorite', async (req, res) => {
  try {
    const userId = req.user.id;
    const entryId = req.params.id;
    const { favorite } = req.body;

    const db = getDb(req);

    await db.run(
      'UPDATE password_vault SET favorite = ? WHERE id = ? AND user_id = ?',
      [favorite ? 1 : 0, entryId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    logger.error('更新收藏状态失败:', error);
    res.status(500).json({ error: '更新收藏状态失败' });
  }
});

/**
 * 生成随机密码
 */
router.post('/generate-password', (req, res) => {
  try {
    const { length = 16, options = {} } = req.body;

    const password = encryptionService.generatePassword(length, options);
    const strength = encryptionService.checkPasswordStrength(password);

    res.json({ password, strength });
  } catch (error) {
    logger.error('生成密码失败:', error);
    res.status(500).json({ error: '生成密码失败' });
  }
});

/**
 * 检查密码强度
 */
router.post('/check-strength', (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: '请提供密码' });
    }

    const strength = encryptionService.checkPasswordStrength(password);
    res.json(strength);
  } catch (error) {
    logger.error('检查密码强度失败:', error);
    res.status(500).json({ error: '检查密码强度失败' });
  }
});

/**
 * 获取密码分类统计
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDb(req);

    const stats = await db.all(
      `SELECT category, COUNT(*) as count
       FROM password_vault
       WHERE user_id = ?
       GROUP BY category`,
      [userId]
    );

    const totalCount = await db.get(
      'SELECT COUNT(*) as total FROM password_vault WHERE user_id = ?',
      [userId]
    );

    const favoriteCount = await db.get(
      'SELECT COUNT(*) as total FROM password_vault WHERE user_id = ? AND favorite = 1',
      [userId]
    );

    res.json({
      byCategory: stats,
      total: totalCount.total,
      favorites: favoriteCount.total
    });
  } catch (error) {
    logger.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

/**
 * 导出密码（加密格式）
 */
router.post('/export', async (req, res) => {
  try {
    const userId = req.user.id;
    const { masterPassword } = req.body;

    if (!masterPassword) {
      return res.status(400).json({ error: '请提供主密码' });
    }

    const db = getDb(req);

    // 验证主密码
    const masterRecord = await db.get(
      'SELECT password_hash, salt FROM master_password WHERE user_id = ?',
      [userId]
    );

    if (!masterRecord) {
      return res.status(404).json({ error: '未设置主密码' });
    }

    const isValid = encryptionService.verifyPassword(
      masterPassword,
      masterRecord.password_hash,
      masterRecord.salt
    );

    if (!isValid) {
      return res.status(401).json({ error: '主密码错误' });
    }

    // 获取所有密码条目
    const entries = await db.all(
      'SELECT * FROM password_vault WHERE user_id = ?',
      [userId]
    );

    // 解密所有密码
    const decryptedEntries = entries.map(entry => {
      const password = encryptionService.decrypt(
        entry.encrypted_password,
        masterPassword,
        masterRecord.salt
      );

      return {
        title: entry.title,
        username: entry.username,
        password: password,
        url: entry.url,
        category: entry.category,
        notes: entry.notes,
        tags: entry.tags,
        created_at: entry.created_at
      };
    });

    // 加密导出数据
    const exportData = JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      entries: decryptedEntries
    });

    // 使用用户的主密码加密导出数据
    const encryptedExport = encryptionService.encrypt(
      exportData,
      masterPassword,
      masterRecord.salt
    );

    res.json({
      data: encryptedExport,
      salt: masterRecord.salt,
      filename: `password-vault-export-${Date.now()}.encrypted`
    });
  } catch (error) {
    logger.error('导出密码失败:', error);
    res.status(500).json({ error: '导出密码失败' });
  }
});

/**
 * 导入密码
 */
router.post('/import', async (req, res) => {
  try {
    const userId = req.user.id;
    const { encryptedData, salt, masterPassword } = req.body;

    if (!encryptedData || !salt || !masterPassword) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const db = getDb(req);

    // 验证主密码
    const masterRecord = await db.get(
      'SELECT password_hash, salt FROM master_password WHERE user_id = ?',
      [userId]
    );

    if (!masterRecord) {
      return res.status(404).json({ error: '未设置主密码' });
    }

    const isValid = encryptionService.verifyPassword(
      masterPassword,
      masterRecord.password_hash,
      masterRecord.salt
    );

    if (!isValid) {
      return res.status(401).json({ error: '主密码错误' });
    }

    // 解密导入数据
    const decryptedData = encryptionService.decrypt(
      encryptedData,
      masterPassword,
      salt
    );

    const importData = JSON.parse(decryptedData);

    if (!importData.entries || !Array.isArray(importData.entries)) {
      return res.status(400).json({ error: '导入数据格式错误' });
    }

    // 导入条目
    let successCount = 0;
    let errorCount = 0;

    for (const entry of importData.entries) {
      try {
        // 加密密码
        const encryptedPassword = encryptionService.encrypt(
          entry.password,
          masterPassword,
          masterRecord.salt
        );

        await db.run(
          `INSERT INTO password_vault (user_id, title, username, encrypted_password, url, category, notes, tags)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            entry.title,
            entry.username || null,
            encryptedPassword,
            entry.url || null,
            entry.category || 'general',
            entry.notes || null,
            entry.tags || null
          ]
        );
        successCount++;
      } catch (error) {
        logger.error('导入单条密码失败:', error);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `导入完成：成功 ${successCount} 条，失败 ${errorCount} 条`,
      successCount,
      errorCount
    });
  } catch (error) {
    logger.error('导入密码失败:', error);
    res.status(500).json({ error: '导入密码失败' });
  }
});

module.exports = router;
