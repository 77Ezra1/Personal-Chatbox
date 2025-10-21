#!/usr/bin/env node
/**
 * 列出所有数据库备份
 *
 * 功能: 显示所有可用的数据库备份文件
 * 用法: node scripts/list-backups.cjs
 * 或者: npm run db:list-backups
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function main() {
  log('\n📂 数据库备份列表', 'cyan');
  log('═══════════════════════════════════════\n', 'cyan');

  const backupDir = path.join(__dirname, '../data/backups');

  if (!fs.existsSync(backupDir)) {
    log('ℹ️  备份目录不存在,暂无备份', 'yellow');
    log('   运行以下命令创建备份:', 'reset');
    log('   npm run db:backup\n', 'green');
    return;
  }

  const backups = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.db'))
    .map(f => {
      const stats = fs.statSync(path.join(backupDir, f));
      const match = f.match(/app-(.+)\.db/);
      const timestamp = match ? match[1] : f;

      return {
        filename: f,
        timestamp,
        size: stats.size,
        modified: stats.mtime
      };
    })
    .sort((a, b) => b.modified - a.modified);

  if (backups.length === 0) {
    log('ℹ️  暂无备份文件', 'yellow');
    log('   运行以下命令创建备份:', 'reset');
    log('   npm run db:backup\n', 'green');
    return;
  }

  log(`找到 ${backups.length} 个备份文件:\n`, 'green');

  const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

  backups.forEach((backup, index) => {
    const marker = index === 0 ? '📌' : '  ';
    const color = index === 0 ? 'green' : 'reset';
    const date = backup.modified.toLocaleString('zh-CN');
    const size = formatBytes(backup.size);

    log(`${marker} ${backup.filename}`, color);
    log(`     时间: ${date}`, 'blue');
    log(`     大小: ${size}`, 'blue');
    log(`     ID: ${backup.timestamp}`, 'yellow');

    if (index === 0) {
      log('     [最新]', 'green');
    }
    log('');
  });

  log(`📊 统计信息:`, 'cyan');
  log(`   总备份数: ${backups.length}`, 'reset');
  log(`   总大小: ${formatBytes(totalSize)}`, 'reset');
  log(`   位置: ${backupDir}`, 'reset');

  log('\n💡 恢复备份命令:', 'cyan');
  log('   npm run db:restore              # 恢复最新备份', 'yellow');
  log('   npm run db:restore <timestamp>  # 恢复指定备份\n', 'yellow');
}

if (require.main === module) {
  main();
}

module.exports = { main };
