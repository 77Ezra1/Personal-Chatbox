/**
 * 数据库迁移运行脚本
 */

const fs = require('fs');
const path = require('path');
const { openDb, DB_PATH } = require('./adapter.cjs');

// 打开数据库连接
const db = openDb();

if (!db) {
  console.error('❌ 错误: 无法打开数据库');
  console.error('   请确保已安装 better-sqlite3 或 sqlite3:');
  console.error('   npm install better-sqlite3');
  process.exit(1);
}

console.log(`✅ 数据库连接成功: ${DB_PATH}`);
console.log(`   驱动: ${db._driver}\n`);

// 创建迁移历史表
const createMigrationsTable = () => {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// 获取已执行的迁移
const getExecutedMigrations = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT version FROM migrations ORDER BY version', (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(row => row.version));
    });
  });
};

// 记录迁移执行
const recordMigration = (version, name) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO migrations (version, name) VALUES (?, ?)',
      [version, name],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

// 执行 SQL 文件
const executeSqlFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const sql = fs.readFileSync(filePath, 'utf-8');

    // 分割多个 SQL 语句
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    // 使用事务执行
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      try {
        statements.forEach(statement => {
          if (statement) {
            db.run(statement);
          }
        });

        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      } catch (error) {
        db.run('ROLLBACK');
        reject(error);
      }
    });
  });
};

// 运行所有待执行的迁移
const runMigrations = async () => {
  try {
    console.log('🚀 开始数据库迁移...\n');

    // 创建迁移历史表
    createMigrationsTable();

    // 获取已执行的迁移
    const executed = await getExecutedMigrations();
    console.log(`已执行的迁移: ${executed.length} 个\n`);

    // 读取迁移文件夹
    const migrationsDir = path.join(__dirname, 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  迁移文件夹不存在，创建中...');
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log('✅ 迁移文件夹已创建\n');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('ℹ️  没有找到迁移文件\n');
      return;
    }

    console.log(`找到 ${files.length} 个迁移文件:\n`);

    let newMigrations = 0;

    // 执行每个未执行的迁移
    for (const file of files) {
      const version = file.replace('.sql', '');

      if (executed.includes(version)) {
        console.log(`⏭️  跳过已执行的迁移: ${file}`);
        continue;
      }

      console.log(`▶️  执行迁移: ${file}`);

      const filePath = path.join(migrationsDir, file);

      try {
        await executeSqlFile(filePath);
        await recordMigration(version, file);
        console.log(`✅ 迁移成功: ${file}\n`);
        newMigrations++;
      } catch (error) {
        console.error(`❌ 迁移失败: ${file}`);
        console.error(`   错误: ${error.message}\n`);
        throw error;
      }
    }

    if (newMigrations === 0) {
      console.log('✅ 所有迁移都已是最新状态\n');
    } else {
      console.log(`✅ 成功执行 ${newMigrations} 个新迁移\n`);
    }

  } catch (error) {
    console.error('❌ 迁移过程出错:', error);
    throw error;
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('🎉 数据库迁移完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 迁移失败:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };

