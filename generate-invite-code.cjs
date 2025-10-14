/**
 * 生成邀请码工具
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'app.db');

// 生成随机邀请码
function generateCode() {
  const prefix = 'WELCOME';
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}`;
}

// 连接数据库
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err);
    process.exit(1);
  }
});

// 生成并插入邀请码
const code = generateCode();
const maxUses = 100; // 可使用100次
const description = '管理员生成的邀请码';

db.run(
  'INSERT INTO invite_codes (code, max_uses, description, is_active) VALUES (?, ?, ?, 1)',
  [code, maxUses, description],
  function(err) {
    if (err) {
      console.error('❌ 生成邀请码失败:', err.message);
      process.exit(1);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ 邀请码生成成功！');
    console.log('='.repeat(60));
    console.log('\n📋 邀请码信息:\n');
    console.log(`   邀请码: ${code}`);
    console.log(`   最大使用次数: ${maxUses}`);
    console.log(`   描述: ${description}`);
    console.log(`   状态: 已激活`);
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 提示: 请将此邀请码提供给需要注册的用户\n');

    db.close();
  }
);
