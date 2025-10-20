/**
 * 批量生成测试账号和邀请码
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'app.db');

// 生成随机邀请码
function generateInviteCode() {
  const prefix = 'TEST';
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}`;
}

// 生成随机密码
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// 生成邮箱
function generateEmail(index) {
  const domains = ['test.com', 'example.com', 'demo.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const timestamp = Date.now();
  return `testuser${index}_${timestamp}@${domain}`;
}

// 主函数
function generateAccounts(count = 10) {
  const db = new Database(DB_PATH);
  const accounts = [];

  console.log('\n' + '='.repeat(80));
  console.log('🚀 开始生成测试账号...');
  console.log('='.repeat(80) + '\n');

  const insertStmt = db.prepare('INSERT INTO invite_codes (code, max_uses, description, is_active) VALUES (?, ?, ?, 1)');

  for (let i = 1; i <= count; i++) {
    const code = generateInviteCode();
    const email = generateEmail(i);
    const password = generatePassword();
    const maxUses = 1; // 每个邀请码只能使用1次
    const description = `测试账号 #${i} 专用邀请码`;

    try {
      insertStmt.run(code, maxUses, description);
      
      accounts.push({
        序号: i,
        邮箱: email,
        密码: password,
        邀请码: code,
        状态: '未注册'
      });

      console.log(`✅ 账号 #${i} 生成成功`);
      console.log(`   📧 邮箱: ${email}`);
      console.log(`   🔑 密码: ${password}`);
      console.log(`   🎫 邀请码: ${code}`);
      console.log('');
    } catch (err) {
      console.error(`❌ 生成邀请码 #${i} 失败:`, err.message);
    }
  }

  // 保存到文件
  const timestamp = Date.now();
  const outputFile = path.join(__dirname, `test-accounts-${timestamp}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(accounts, null, 2), 'utf-8');

  // 也生成一个易读的文本文件
  const txtFile = path.join(__dirname, `test-accounts-${timestamp}.txt`);
  let txtContent = '测试账号列表\n';
  txtContent += '='.repeat(80) + '\n';
  txtContent += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
  txtContent += `账号数量: ${accounts.length}\n`;
  txtContent += '='.repeat(80) + '\n\n';

  accounts.forEach(acc => {
    txtContent += `【账号 #${acc.序号}】\n`;
    txtContent += `邮箱: ${acc.邮箱}\n`;
    txtContent += `密码: ${acc.密码}\n`;
    txtContent += `邀请码: ${acc.邀请码}\n`;
    txtContent += `状态: ${acc.状态}\n`;
    txtContent += '-'.repeat(80) + '\n\n';
  });

  fs.writeFileSync(txtFile, txtContent, 'utf-8');

  console.log('='.repeat(80));
  console.log('✅ 所有账号生成完成！');
  console.log('='.repeat(80));
  console.log(`\n📁 账号信息已保存到:\n`);
  console.log(`   JSON 格式: ${outputFile}`);
  console.log(`   文本格式: ${txtFile}\n`);
  console.log('='.repeat(80));
  console.log('\n💡 提示: 请妥善保管这些账号信息！\n');

  db.close();
  return accounts;
}

// 获取命令行参数
const args = process.argv.slice(2);
const count = parseInt(args[0]) || 10;

if (count < 1 || count > 100) {
  console.error('❌ 错误: 账号数量必须在 1-100 之间');
  process.exit(1);
}

try {
  generateAccounts(count);
  process.exit(0);
} catch (err) {
  console.error('❌ 生成失败:', err);
  process.exit(1);
}
