#!/usr/bin/env node

/**
 * 修复笔记数据脚本
 * 1. 将 updated_at 为 null 的笔记设置为 created_at 的值
 * 2. 确保所有笔记的 tags 是有效的 JSON 数组字符串
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.json');

console.log('开始修复笔记数据...');

// 读取数据库
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let fixedCount = 0;
let tagFixedCount = 0;

// 修复每条笔记
db.notes = db.notes.map(note => {
  let fixed = false;
  
  // 修复 updated_at
  if (note.updated_at === null || note.updated_at === undefined) {
    note.updated_at = note.created_at || new Date().toISOString();
    fixed = true;
    fixedCount++;
  }
  
  // 修复 tags 格式
  if (typeof note.tags === 'string') {
    try {
      // 尝试解析，如果已经是有效JSON就保持原样
      JSON.parse(note.tags);
    } catch {
      // 如果不是有效JSON，转换为空数组
      console.log(`修复笔记 ${note.id} 的 tags: ${note.tags} -> []`);
      note.tags = '[]';
      tagFixedCount++;
      fixed = true;
    }
  } else if (Array.isArray(note.tags)) {
    // 如果是数组，转换为 JSON 字符串
    note.tags = JSON.stringify(note.tags);
    tagFixedCount++;
    fixed = true;
  } else if (!note.tags) {
    // 如果没有 tags 字段
    note.tags = '[]';
    tagFixedCount++;
    fixed = true;
  }
  
  if (fixed) {
    console.log(`修复笔记 ${note.id}: ${note.title}`);
  }
  
  return note;
});

// 备份原文件
const backupPath = dbPath + '.backup-' + Date.now();
fs.copyFileSync(dbPath, backupPath);
console.log(`已备份到: ${backupPath}`);

// 写入修复后的数据
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

console.log('\n修复完成！');
console.log(`- 修复了 ${fixedCount} 条笔记的 updated_at 字段`);
console.log(`- 修复了 ${tagFixedCount} 条笔记的 tags 字段`);
console.log(`- 总笔记数: ${db.notes.length}`);
