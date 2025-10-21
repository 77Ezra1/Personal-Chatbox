#!/usr/bin/env node
/**
 * 数据库备份脚本
 *
 * 功能: 备份当前 SQLite 数据库
 * 用法: node scripts/backup-database.cjs
 * 或者: npm run db:backup
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  log('\n📦 数据库备份工具', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');

  const dbPath = path.join(__dirname, '../data/app.db');
  const backupDir = path.join(__dirname, '../data/backups');

  // 确保备份目录存在
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    log('✓ 创建备份目录', 'green');
  }

  // 检查数据库文件是否存在
  if (!fs.existsSync(dbPath)) {
    log('❌ 错误: 数据库文件不存在', 'red');
    log(`   路径: ${dbPath}`, 'red');
    process.exit(1);
  }

  // 生成备份文件名
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = path.join(backupDir, `app-${timestamp}.db`);

  try {
    // 复制数据库文件
    fs.copyFileSync(dbPath, backupPath);

    const stats = fs.statSync(backupPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    log('✅ 备份成功!', 'green');
    log(`\n📁 备份信息:`, 'cyan');
    log(`   文件名: app-${timestamp}.db`, 'reset');
    log(`   路径: ${backupPath}`, 'reset');
    log(`   大小: ${sizeInMB} MB`, 'reset');
    log(`   时间: ${new Date().toLocaleString('zh-CN')}`, 'reset');

    // 列出所有备份
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.db'))
      .sort()
      .reverse();

    if (backups.length > 1) {
      log(`\n📋 历史备份 (最近${Math.min(5, backups.length)}个):`, 'cyan');
      backups.slice(0, 5).forEach((backup, index) => {
        const backupStats = fs.statSync(path.join(backupDir, backup));
        const size = (backupStats.size / (1024 * 1024)).toFixed(2);
        const marker = index === 0 ? '→' : ' ';
        log(`  ${marker} ${backup} (${size} MB)`, index === 0 ? 'green' : 'reset');
      });
    }

    log('\n💡 恢复备份命令:', 'cyan');
    log(`   npm run db:restore ${timestamp}`, 'yellow');
    log('');

  } catch (error) {
    log(`\n❌ 备份失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
