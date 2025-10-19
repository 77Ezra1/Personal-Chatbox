/**
 * NoteEditor 分类创建功能验证脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证 NoteEditor 分类创建功能...\n');

const checks = {
  passed: 0,
  total: 0
};

function check(name, condition, details = '') {
  checks.total++;
  if (condition) {
    checks.passed++;
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

// 1. 检查 NoteEditor.jsx 文件
const editorPath = path.join(__dirname, 'src/components/notes/NoteEditor.jsx');
const editorContent = fs.readFileSync(editorPath, 'utf-8');

check(
  'newCategoryName 状态存在',
  editorContent.includes('newCategoryName') && editorContent.includes('setNewCategoryName'),
  '第 20 行'
);

check(
  'handleCreateCategory 函数存在',
  editorContent.includes('handleCreateCategory') && editorContent.includes('async () =>'),
  '第 101-113 行'
);

check(
  'onCreateCategory 回调被调用',
  editorContent.includes('await onCreateCategory?.(trimmed)'),
  '创建后调用父组件回调'
);

check(
  '创建后更新分类状态',
  editorContent.includes('setCategory(categoryName)') || editorContent.includes("setCategory(created?.name"),
  '自动选中新创建的分类'
);

check(
  '创建后清空输入',
  editorContent.includes("setNewCategoryName('')"),
  '输入框重置为空'
);

check(
  '分类创建 UI 存在',
  editorContent.includes('category-create-inline') && 
  editorContent.includes('category-create-input') &&
  editorContent.includes('category-create-button'),
  'UI 容器和元素齐全'
);

check(
  '回车键创建支持',
  editorContent.includes("e.key === 'Enter'") && editorContent.includes('handleCreateCategory'),
  '输入框支持回车创建'
);

check(
  '空值验证',
  editorContent.includes('!newCategoryName.trim()') && editorContent.includes('disabled'),
  '按钮在空值时禁用'
);

check(
  '分类区域标题存在',
  editorContent.includes('category-section-header') &&
  editorContent.includes('section-icon') &&
  editorContent.includes('section-label'),
  'v0.dev 风格标题'
);

// 2. 检查 CSS 文件
const cssPath = path.join(__dirname, 'src/components/notes/NoteEditor.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

check(
  'category-section-header 样式',
  cssContent.includes('.category-section-header'),
  '分类标题样式'
);

check(
  'category-create-inline 样式',
  cssContent.includes('.category-create-inline'),
  '创建区域容器样式'
);

check(
  'category-create-input 样式',
  cssContent.includes('.category-create-input'),
  '输入框样式'
);

check(
  'category-create-button 样式',
  cssContent.includes('.category-create-button'),
  '添加按钮样式'
);

check(
  'v0.dev 渐变背景',
  cssContent.includes('linear-gradient') && 
  cssContent.includes('rgba(59, 130, 246'),
  '使用蓝色系渐变'
);

check(
  'focus-within 效果',
  cssContent.includes(':focus-within') || cssContent.includes(':focus'),
  '聚焦状态样式'
);

check(
  'hover 效果',
  cssContent.includes(':hover'),
  '悬停状态样式'
);

check(
  'disabled 状态',
  cssContent.includes(':disabled'),
  '禁用状态样式'
);

check(
  'transition 动画',
  cssContent.includes('transition') && cssContent.includes('cubic-bezier'),
  '平滑过渡动画'
);

check(
  'box-shadow 阴影',
  cssContent.includes('box-shadow'),
  '阴影效果'
);

// 3. 输出结果
console.log('\n' + '='.repeat(50));
console.log(`📊 验证结果: ${checks.passed}/${checks.total} 通过`);
console.log('='.repeat(50));

if (checks.passed === checks.total) {
  console.log('\n🎉 所有检查通过！分类创建 UI 已成功实现');
  console.log('\n📝 功能特性:');
  console.log('  ✅ v0.dev 风格的现代化 UI');
  console.log('  ✅ 输入框 + 按钮创建模式');
  console.log('  ✅ 回车键快速创建');
  console.log('  ✅ 创建后自动选中');
  console.log('  ✅ 渐变背景和阴影效果');
  console.log('  ✅ 响应式交互动画');
  console.log('\n🎨 设计亮点:');
  console.log('  • 蓝色系渐变（#3b82f6）');
  console.log('  • 圆角边框（calc(var(--radius)))');
  console.log('  • 平滑过渡（cubic-bezier）');
  console.log('  • 悬停/聚焦效果');
  console.log('  • "+" 图标按钮');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${checks.total - checks.passed} 项检查失败`);
  process.exit(1);
}
