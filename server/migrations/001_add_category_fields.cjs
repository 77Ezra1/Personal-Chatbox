/**
 * 数据库迁移：为 note_categories 表添加新字段
 * 添加字段：description, icon, sort_order, updated_at
 */

const logger = require('../utils/logger.cjs');

async function up(db) {
  try {
    logger.info('[Migration] Adding new fields to note_categories table...');

    // 检查表是否存在
    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='note_categories'"
    );

    if (!tableExists) {
      // 如果表不存在，创建完整的表结构
      await db.run(`
        CREATE TABLE IF NOT EXISTS note_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          color TEXT DEFAULT '#6366f1',
          description TEXT DEFAULT '',
          icon TEXT DEFAULT '',
          sort_order INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(user_id, name),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      logger.info('[Migration] Created note_categories table with all fields');
    } else {
      // 检查是否已有新字段
      const columns = await db.all("PRAGMA table_info(note_categories)");
      const columnNames = columns.map(col => col.name);

      // 添加缺失的字段
      if (!columnNames.includes('description')) {
        await db.run("ALTER TABLE note_categories ADD COLUMN description TEXT DEFAULT ''");
        logger.info('[Migration] Added description column');
      }

      if (!columnNames.includes('icon')) {
        await db.run("ALTER TABLE note_categories ADD COLUMN icon TEXT DEFAULT ''");
        logger.info('[Migration] Added icon column');
      }

      if (!columnNames.includes('sort_order')) {
        await db.run("ALTER TABLE note_categories ADD COLUMN sort_order INTEGER DEFAULT 0");
        logger.info('[Migration] Added sort_order column');
      }

      if (!columnNames.includes('updated_at')) {
        await db.run("ALTER TABLE note_categories ADD COLUMN updated_at TEXT");
        // 为现有记录设置 updated_at = created_at
        await db.run("UPDATE note_categories SET updated_at = created_at WHERE updated_at IS NULL");
        logger.info('[Migration] Added updated_at column');
      }
    }

    // 为现有分类设置默认排序顺序
    await db.run(`
      UPDATE note_categories 
      SET sort_order = id 
      WHERE sort_order = 0 OR sort_order IS NULL
    `);

    logger.info('[Migration] Successfully added new fields to note_categories table');
    return true;
  } catch (error) {
    logger.error('[Migration] Error adding fields to note_categories:', error);
    throw error;
  }
}

async function down(db) {
  try {
    logger.info('[Migration] Reverting note_categories table changes...');
    
    // SQLite 不支持直接删除列，需要重建表
    // 这里提供回滚逻辑的占位符
    logger.warn('[Migration] SQLite does not support DROP COLUMN. Manual intervention required for rollback.');
    
    return true;
  } catch (error) {
    logger.error('[Migration] Error reverting note_categories changes:', error);
    throw error;
  }
}

module.exports = { up, down };
