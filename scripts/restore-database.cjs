#!/usr/bin/env node
/**
 * 数据库恢复脚本
 *
 * 功能: 从备份恢复 SQLite 数据库
 * 用法: node scripts/restore-database.cjs [timestamp]
 * 或者: npm run db:restore [timestamp]
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
  log('\n♻️  数据库恢复工具', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');

  const dbPath = path.join(__dirname, '../data/app.db');
  const backupDir = path.join(__dirname, '../data/backups');

  // 检查备份目录
  if (!fs.existsSync(backupDir)) {
    log('❌ 错误: 备份目录不存在', 'red');
    log('   请先运行: npm run db:backup', 'yellow');
    process.exit(1);
  }

  // 获取所有备份文件
  const backups = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.db'))
    .sort()
    .reverse();

  if (backups.length === 0) {
    log('❌ 错误: 没有找到备份文件', 'red');
    log('   请先运行: npm run db:backup', 'yellow');
    process.exit(1);
  }

  // 获取时间戳参数
  const timestamp = process.argv[2];
  let backupFile;

  if (timestamp) {
    // 查找指定时间戳的备份
    backupFile = backups.find(f => f.includes(timestamp));
    if (!backupFile) {
      log(`❌ 错误: 找不到时间戳为 "${timestamp}" 的备份`, 'red');
      log('\n可用的备份:', 'cyan');
      backups.forEach(b => {
        const match = b.match(/app-(.+)\.db/);
        if (match) {
          log(`  • ${match[1]}`, 'yellow');
        }
      });
      process.exit(1);
    }
  } else {
    // 使用最新的备份
    backupFile = backups[0];
    log(`ℹ️  未指定时间戳,使用最新备份: ${backupFile}`, 'yellow');
  }

  const backupPath = path.join(backupDir, backupFile);

  try {
    // 备份当前数据库(以防万一)
    if (fs.existsSync(dbPath)) {
      const currentBackup = path.join(backupDir, `app-before-restore-${Date.now()}.db`);
      fs.copyFileSync(dbPath, currentBackup);
      log('✓ 已备份当前数据库', 'green');
    }

    // 恢复备份
    fs.copyFileSync(backupPath, dbPath);

    const stats = fs.statSync(dbPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    log('\n✅ 恢复成功!', 'green');
    log(`\n📁 恢复信息:`, 'cyan');
    log(`   源文件: ${backupFile}`, 'reset');
    log(`   目标: ${dbPath}`, 'reset');
    log(`   大小: ${sizeInMB} MB`, 'reset');
    log(`   时间: ${new Date().toLocaleString('zh-CN')}`, 'reset');

    log('\n💡 提示:', 'cyan');
    log('   • 请重启应用服务器以使用恢复的数据', 'yellow');
    log('   • 当前数据库已备份为: app-before-restore-*.db\n', 'yellow');

  } catch (error) {
    log(`\n❌ 恢复失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
