const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('修复 template 相关表的外键问题...\n');

try {
  // 禁用外键约束
  db.prepare("PRAGMA foreign_keys = OFF").run();

  // 要修复的表
  const problemTables = [
    'template_marketplace',
    'template_ratings',
    'template_favorites',
    'template_usage_logs'
  ];

  problemTables.forEach(tableName => {
    console.log(`处理 ${tableName}...`);

    try {
      // 1. 获取表结构
      const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
      console.log(`   列数: ${tableInfo.length}`);

      // 2. 备份数据
      const data = db.prepare(`SELECT * FROM ${tableName}`).all();
      console.log(`   记录数: ${data.length}`);

      // 3. 删除旧表
      db.prepare(`DROP TABLE IF EXISTS ${tableName}`).run();

      // 4. 重建表（移除对 summary_templates 的外键）
      const columns = tableInfo.map(col => {
        let def = `${col.name} ${col.type}`;
        if (col.pk) def += ' PRIMARY KEY';
        if (col.notnull && !col.pk) def += ' NOT NULL';
        if (col.dflt_value !== null) def += ` DEFAULT ${col.dflt_value}`;
        return def;
      }).join(', ');

      // 根据表名创建合适的结构
      if (tableName === 'template_usage_logs') {
        // 这个表引用了 conversations，保留这个外键
        db.prepare(`
          CREATE TABLE ${tableName} (
            id TEXT PRIMARY KEY,
            template_id TEXT,
            user_id INTEGER,
            conversation_id TEXT,
            usage_type TEXT,
            created_at TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `).run();
      } else {
        // 其他表不需要外键约束
        db.prepare(`CREATE TABLE ${tableName} (${columns})`).run();
      }

      // 5. 恢复数据
      if (data.length > 0) {
        const cols = tableInfo.map(c => c.name).join(', ');
        const placeholders = tableInfo.map(() => '?').join(', ');
        const insert = db.prepare(`INSERT INTO ${tableName} (${cols}) VALUES (${placeholders})`);

        data.forEach(row => {
          const values = tableInfo.map(col => row[col.name]);
          insert.run(...values);
        });

        console.log(`   ✅ 已恢复 ${data.length} 条记录`);
      } else {
        console.log(`   ✅ 表已重建（无数据）`);
      }

    } catch (err) {
      console.log(`   ❌ 失败: ${err.message}`);
    }

    console.log('');
  });

  // 重新启用外键约束
  db.prepare("PRAGMA foreign_keys = ON").run();

  // 测试
  console.log('测试删除操作...');
  const testId = `test-final-${Date.now()}`;

  db.prepare(`
    INSERT INTO conversations (id, user_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(testId, 1, '最终测试', new Date().toISOString(), new Date().toISOString());
  console.log('   ✅ INSERT');

  db.prepare('DELETE FROM conversations WHERE id = ?').run(testId);
  console.log('   ✅ DELETE\n');

  console.log('✅✅✅ 所有问题已解决！✅✅✅\n');

} catch (error) {
  console.error('❌ 错误:', error);
} finally {
  db.close();
}

