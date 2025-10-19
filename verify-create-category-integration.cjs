#!/usr/bin/env node

/**
 * 验证 NotesPage handleCreateCategory 集成
 */

console.log('🔍 验证 NotesPage handleCreateCategory 集成\n');
console.log('='.repeat(60));

const fs = require('fs');
const path = require('path');

const checks = [];

// 检查1: NotesPage.jsx 包含 handleCreateCategory
const notesPagePath = path.join(__dirname, 'src/pages/NotesPage.jsx');
if (fs.existsSync(notesPagePath)) {
  const content = fs.readFileSync(notesPagePath, 'utf-8');
  
  if (content.includes('handleCreateCategory')) {
    checks.push({ name: '✅ handleCreateCategory 函数存在', pass: true });
  } else {
    checks.push({ name: '❌ handleCreateCategory 函数不存在', pass: false });
  }
  
  if (content.includes('onCreateCategory={handleCreateCategory}')) {
    checks.push({ name: '✅ onCreateCategory 已传递给 NoteEditor', pass: true });
  } else {
    checks.push({ name: '❌ onCreateCategory 未传递给 NoteEditor', pass: false });
  }
  
  if (content.includes('setCategories(prevCategories => [...prevCategories, result.category])')) {
    checks.push({ name: '✅ categories 状态更新逻辑正确', pass: true });
  } else {
    checks.push({ name: '❌ categories 状态更新逻辑缺失', pass: false });
  }
  
  if (content.includes('loadMetadata()') && content.includes('handleCreateCategory')) {
    checks.push({ name: '✅ 调用 loadMetadata 更新统计', pass: true });
  } else {
    checks.push({ name: '⚠️  未调用 loadMetadata 更新统计', pass: false });
  }
  
  if (content.includes('notesApi.createCategory')) {
    checks.push({ name: '✅ 调用 notesApi.createCategory API', pass: true });
  } else {
    checks.push({ name: '❌ 未调用 notesApi.createCategory API', pass: false });
  }
} else {
  checks.push({ name: '❌ NotesPage.jsx 文件不存在', pass: false });
}

// 检查2: notesApi.js 包含 createCategory
const notesApiPath = path.join(__dirname, 'src/lib/notesApi.js');
if (fs.existsSync(notesApiPath)) {
  const content = fs.readFileSync(notesApiPath, 'utf-8');
  
  if (content.includes('export async function createCategory')) {
    checks.push({ name: '✅ notesApi.createCategory 函数存在', pass: true });
  } else {
    checks.push({ name: '❌ notesApi.createCategory 函数不存在', pass: false });
  }
} else {
  checks.push({ name: '❌ notesApi.js 文件不存在', pass: false });
}

// 检查3: 后端服务
const noteServicePath = path.join(__dirname, 'server/services/noteService.cjs');
if (fs.existsSync(noteServicePath)) {
  const content = fs.readFileSync(noteServicePath, 'utf-8');
  
  if (content.includes('async createCategory(userId, categoryData)')) {
    checks.push({ name: '✅ 后端 createCategory 服务存在', pass: true });
  } else {
    checks.push({ name: '❌ 后端 createCategory 服务不存在', pass: false });
  }
  
  if (content.includes('description') && content.includes('icon') && content.includes('sort_order')) {
    checks.push({ name: '✅ 后端支持扩展字段', pass: true });
  } else {
    checks.push({ name: '⚠️  后端扩展字段支持不完整', pass: false });
  }
} else {
  checks.push({ name: '❌ noteService.cjs 文件不存在', pass: false });
}

// 检查4: 路由
const notesRoutePath = path.join(__dirname, 'server/routes/notes.cjs');
if (fs.existsSync(notesRoutePath)) {
  const content = fs.readFileSync(notesRoutePath, 'utf-8');
  
  if (content.includes("router.post('/categories'")) {
    checks.push({ name: '✅ POST /api/notes/categories 路由存在', pass: true });
  } else {
    checks.push({ name: '❌ POST /api/notes/categories 路由不存在', pass: false });
  }
} else {
  checks.push({ name: '❌ notes.cjs 路由文件不存在', pass: false });
}

// 显示结果
console.log('\n📊 检查结果:\n');

let passCount = 0;
let failCount = 0;

checks.forEach(check => {
  console.log(`  ${check.name}`);
  if (check.pass) {
    passCount++;
  } else {
    failCount++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`总检查项: ${checks.length}`);
console.log(`通过: ${passCount} ✅`);
console.log(`失败: ${failCount} ❌`);
console.log(`通过率: ${((passCount / checks.length) * 100).toFixed(2)}%`);

if (failCount === 0) {
  console.log('\n🎉 所有检查通过！集成完成！');
  console.log('\n📝 下一步:');
  console.log('  1. 启动开发服务器: npm run dev');
  console.log('  2. 启动后端服务: node server/index.cjs');
  console.log('  3. 打开笔记页面测试创建分类功能');
} else {
  console.log('\n⚠️  发现问题，请检查上述失败项！');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
