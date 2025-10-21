#!/usr/bin/env node
/**
 * 数据库完整设置脚本
 *
 * 功能: 初始化数据库 -> 运行迁移 -> 填充测试数据
 * 用法: node scripts/setup-database.cjs
 * 或者: npm run db:setup
 */

const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function run(command, description) {
  log(`\n▶️  ${description}...`, 'cyan');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description}完成`, 'green');
  } catch (error) {
    log(`❌ ${description}失败`, 'red');
    process.exit(1);
  }
}

log('\n' + colors.bright + '╔══════════════════════════════════════════════════════════╗' + colors.reset);
log(colors.bright + '║          Personal Chatbox 数据库完整设置工具              ║' + colors.reset);
log(colors.bright + '╚══════════════════════════════════════════════════════════╝\n' + colors.reset);

// 步骤 1: 运行数据库迁移（这会创建所有表和内置数据）
run('node server/db/run-migration.cjs', '运行数据库迁移');

// 步骤 2: 填充测试数据
run('node scripts/seed-database.cjs', '填充测试数据');

log('\n' + colors.green + '🎉 数据库设置完成！' + colors.reset);
log('\n💡 现在可以:');
log('   1. 启动服务器: npm run server', 'yellow');
log('   2. 启动前端: npm run dev', 'yellow');
log('   3. 使用测试账号登录: test@example.com / test123\n', 'yellow');
