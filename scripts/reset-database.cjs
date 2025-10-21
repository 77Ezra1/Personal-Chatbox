#!/usr/bin/env node
/**
 * 重置数据库脚本
 *
 * 功能: 清空所有数据并重新填充测试数据
 * 用法: node scripts/reset-database.cjs
 * 或者: npm run db:reset
 */

const { main: seedMain } = require('./seed-database.cjs');

console.log('\x1b[33m⚠️  警告: 这将清空所有数据并重新填充测试数据!\x1b[0m');
console.log('\x1b[33m是否继续? (自动继续...)\x1b[0m\n');

// 直接执行
setTimeout(() => {
  seedMain();
}, 1000);
