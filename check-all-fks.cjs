const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.db');
const db = new Database(dbPath);

console.log('检查所有引用 conversations 的外键...\n');

try {
  // 获取所有表
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();

  console.log(`检查 ${tables.length} 个表...\n`);

  let found = [];

  tables.forEach(t => {
    const fks = db.prepare(`PRAGMA foreign_key_list(${t.name})`).all();

    fks.forEach(fk => {
      if (fk.table === 'conversations') {
        found.push({
          table: t.name,
          from: fk.from,
          to: fk.to,
          onDelete: fk.on_delete
        });
        console.log(`✓ ${t.name}.${fk.from} -> conversations.${fk.to} [ON DELETE ${fk.on_delete}]`);
      }
    });
  });

  if (found.length === 0) {
    console.log('没有找到引用 conversations 的外键\n');
  } else {
    console.log(`\n找到 ${found.length} 个引用 conversations 的外键\n`);
  }

  // 检查是否有表引用了不存在的表
  console.log('检查是否有引用不存在的表...\n');

  const allTableNames = new Set(tables.map(t => t.name));
  let hasProblems = false;

  tables.forEach(t => {
    const fks = db.prepare(`PRAGMA foreign_key_list(${t.name})`).all();

    fks.forEach(fk => {
      if (!allTableNames.has(fk.table)) {
        console.log(`⚠️  ${t.name} 引用了不存在的表: ${fk.table}`);
        hasProblems = true;
      }
    });
  });

  if (!hasProblems) {
    console.log('✅ 所有外键引用的表都存在\n');
  }

} catch (error) {
  console.error('❌ 错误:', error);
} finally {
  db.close();
}

