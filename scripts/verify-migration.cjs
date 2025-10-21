#!/usr/bin/env node
/**
 * 数据迁移验证脚本
 *
 * 用途: 验证数据库迁移是否成功，检查所有关键数据
 * 用法: node scripts/verify-migration.cjs
 */

const path = require('path');

// 设置环境变量
process.env.NODE_ENV = 'development';

// 延迟加载数据库模块
const { db } = require('../server/db/init.cjs');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查项配置
const checks = [
  {
    name: '系统用户',
    query: 'SELECT COUNT(*) as count FROM users WHERE id = 0',
    optional: false,
    expectedMin: 1,
    expectedMax: 1
  },
  {
    name: '普通用户',
    query: 'SELECT COUNT(*) as count FROM users WHERE id != 0',
    optional: false,
    expectedMin: 1
  },
  {
    name: '对话',
    query: 'SELECT COUNT(*) as count FROM conversations',
    optional: true,
    expectedMin: 0
  },
  {
    name: '消息',
    query: 'SELECT COUNT(*) as count FROM messages',
    optional: true,
    expectedMin: 0
  },
  {
    name: '笔记',
    query: 'SELECT COUNT(*) as count FROM notes',
    optional: true,
    expectedMin: 0
  },
  {
    name: '文档',
    query: 'SELECT COUNT(*) as count FROM documents',
    optional: true,
    expectedMin: 0
  },
  {
    name: '密码保险库',
    query: 'SELECT COUNT(*) as count FROM password_vault',
    optional: true,
    expectedMin: 0
  },
  {
    name: '知识库',
    query: 'SELECT COUNT(*) as count FROM knowledge_bases',
    optional: true,
    expectedMin: 0
  },
  {
    name: '内置 AI 角色',
    query: 'SELECT COUNT(*) as count FROM personas WHERE is_builtin = 1',
    optional: true,
    expectedMin: 0
  },
  {
    name: '工作流模板',
    query: 'SELECT COUNT(*) as count FROM workflow_templates',
    optional: true,
    expectedMin: 0
  }
];

// 详细信息查询
const detailQueries = {
  users: 'SELECT id, email, username FROM users WHERE id != 0 LIMIT 10',
  conversations: 'SELECT id, title, created_at FROM conversations ORDER BY created_at DESC LIMIT 5',
  personas: 'SELECT id, name, category FROM personas WHERE is_builtin = 1'
};

console.log('\n' + colors.bright + colors.cyan + '╔══════════════════════════════════════════════════════════╗' + colors.reset);
console.log(colors.bright + colors.cyan + '║          数据库迁移验证工具                                ║' + colors.reset);
console.log(colors.bright + colors.cyan + '╚══════════════════════════════════════════════════════════╝\n' + colors.reset);

let allPassed = true;
let criticalFailed = false;
const results = [];

// 执行检查
log('🔍 正在检查数据完整性...\n', 'cyan');

checks.forEach(check => {
  try {
    const result = db.prepare(check.query).get();
    const count = result.count;

    let status = '';
    let passed = true;

    if (check.expectedMin !== undefined && count < check.expectedMin) {
      passed = false;
    }

    if (check.expectedMax !== undefined && count > check.expectedMax) {
      passed = false;
    }

    if (!passed && !check.optional) {
      status = '❌';
      allPassed = false;
      criticalFailed = true;
    } else if (!passed && check.optional) {
      status = '⚠️ ';
      allPassed = false;
    } else if (count === 0 && check.optional) {
      status = '⚪';
    } else {
      status = '✅';
    }

    results.push({
      name: check.name,
      count: count,
      passed: passed,
      optional: check.optional,
      status: status
    });

    const color = passed ? 'green' : (check.optional ? 'yellow' : 'red');
    log(`${status} ${check.name}: ${count}`, color);

  } catch (error) {
    if (!check.optional) {
      log(`❌ ${check.name}: 表不存在 - ${error.message}`, 'red');
      allPassed = false;
      criticalFailed = true;
    } else {
      log(`⚪ ${check.name}: 表不存在（可选）`, 'gray');
    }

    results.push({
      name: check.name,
      count: 0,
      passed: false,
      optional: check.optional,
      status: check.optional ? '⚪' : '❌',
      error: error.message
    });
  }
});

// 显示详细信息
console.log('\n' + colors.cyan + '📊 详细信息：' + colors.reset + '\n');

// 显示用户列表
try {
  const users = db.prepare(detailQueries.users).all();
  if (users.length > 0) {
    log('👥 用户列表:', 'cyan');
    users.forEach(user => {
      log(`   • ${user.email} (${user.username})`, 'reset');
    });
    console.log();
  }
} catch (error) {
  // 忽略
}

// 显示对话列表
try {
  const conversations = db.prepare(detailQueries.conversations).all();
  if (conversations.length > 0) {
    log('💬 最近对话:', 'cyan');
    conversations.forEach(conv => {
      const title = conv.title || '未命名对话';
      const date = new Date(conv.created_at).toLocaleString('zh-CN');
      log(`   • ${title} (${date})`, 'reset');
    });
    console.log();
  }
} catch (error) {
  // 忽略
}

// 显示内置角色
try {
  const personas = db.prepare(detailQueries.personas).all();
  if (personas.length > 0) {
    log('🤖 内置 AI 角色:', 'cyan');
    personas.forEach(persona => {
      log(`   • ${persona.name} (${persona.category || '通用'})`, 'reset');
    });
    console.log();
  }
} catch (error) {
  // 忽略
}

// 总结
console.log(colors.cyan + '═══════════════════════════════════════════════════════════\n' + colors.reset);

if (criticalFailed) {
  log('❌ 验证失败：关键数据缺失', 'red');
  log('\n建议操作:', 'yellow');
  log('1. 检查备份文件是否完整', 'reset');
  log('2. 尝试恢复其他备份: npm run db:restore', 'reset');
  log('3. 如果都失败，使用测试数据: npm run db:reset\n', 'reset');
  process.exit(1);
} else if (!allPassed) {
  log('⚠️  验证通过，但有可选数据缺失', 'yellow');
  log('\n这是正常的，如果你需要测试数据，可以运行:', 'yellow');
  log('npm run db:seed\n', 'reset');
  process.exit(0);
} else {
  log('✅ 所有检查通过！数据库迁移成功\n', 'green');
  log('💡 建议:', 'cyan');
  log('• 启动服务器: npm run server', 'reset');
  log('• 启动前端: npm run dev', 'reset');
  log('• 测试登录功能\n', 'reset');
  process.exit(0);
}
