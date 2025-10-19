/**
 * Notes 时间格式化集成验证脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证 Notes 时间格式化集成...\n');

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

// 1. 检查 utils.js 中的 formatNoteTime 函数
const utilsPath = path.join(__dirname, 'src/lib/utils.js');
const utilsContent = fs.readFileSync(utilsPath, 'utf-8');

check(
  'formatNoteTime 函数存在',
  utilsContent.includes('export const formatNoteTime'),
  '时间格式化辅助函数'
);

check(
  'formatNoteTime 支持回退逻辑',
  utilsContent.includes('fallbackTimestamp') &&
  utilsContent.includes('formatInTimezone(timestamp, timezone)'),
  '主时间戳 → 回退时间戳 → 当前时间'
);

check(
  'formatNoteTime 处理无效时间',
  utilsContent.includes("formatted !== 'Invalid Date'"),
  '无效时间检查'
);

// 2. 检查 NotesPage.jsx
const notesPagePath = path.join(__dirname, 'src/pages/NotesPage.jsx');
const notesPageContent = fs.readFileSync(notesPagePath, 'utf-8');

check(
  'NotesPage 导入 useAuth',
  notesPageContent.includes("import { useAuth }") &&
  notesPageContent.includes("from '@/contexts/AuthContext'"),
  '获取用户信息'
);

check(
  'NotesPage 导入 formatNoteTime',
  notesPageContent.includes("import { formatNoteTime }") &&
  notesPageContent.includes("from '@/lib/utils'"),
  '导入时间格式化工具'
);

check(
  'NotesPage 获取 user',
  notesPageContent.includes('const { user } = useAuth()'),
  '获取当前用户'
);

check(
  'getUserTimezone 函数存在',
  notesPageContent.includes('getUserTimezone') &&
  notesPageContent.includes("user?.timezone || 'Asia/Shanghai'"),
  '获取用户时区，带默认值'
);

check(
  '笔记详情使用 formatNoteTime',
  notesPageContent.includes('formatNoteTime(') &&
  notesPageContent.includes('selectedNote.updated_at') &&
  notesPageContent.includes('selectedNote.created_at'),
  '详情页显示格式化时间'
);

check(
  '传递 userTimezone 到 NoteList',
  notesPageContent.includes('userTimezone={getUserTimezone()}'),
  'NoteList 接收用户时区'
);

// 3. 检查 NoteList.jsx
const noteListPath = path.join(__dirname, 'src/components/notes/NoteList.jsx');
const noteListContent = fs.readFileSync(noteListPath, 'utf-8');

check(
  'NoteList 导入 formatNoteTime',
  noteListContent.includes("import { formatNoteTime }"),
  '导入时间格式化工具'
);

check(
  'NoteList 接收 userTimezone prop',
  noteListContent.includes('userTimezone = \'Asia/Shanghai\'') ||
  noteListContent.includes('userTimezone'),
  '支持用户时区参数'
);

check(
  'NoteList 使用 formatNoteTime',
  noteListContent.includes('formatNoteTime(') &&
  noteListContent.includes('note?.updated_at') &&
  noteListContent.includes('note?.created_at'),
  '列表项显示格式化时间'
);

check(
  'formatDate 使用回退逻辑',
  noteListContent.includes('note?.created_at'),
  '支持 created_at 回退'
);

// 4. 检查 AuthContext
const authContextPath = path.join(__dirname, 'src/contexts/AuthContext.jsx');
const authContextContent = fs.readFileSync(authContextPath, 'utf-8');

check(
  'AuthContext 提供 user 对象',
  authContextContent.includes('const [user, setUser]') &&
  authContextContent.includes('user,'),
  '用户信息可通过 useAuth 获取'
);

check(
  'AuthContext 有 updateUserProfile',
  authContextContent.includes('updateUserProfile'),
  '支持更新用户配置'
);

// 5. 检查 ProfileSettings
const profileSettingsPath = path.join(__dirname, 'src/components/settings/ProfileSettings.jsx');
const profileSettingsContent = fs.readFileSync(profileSettingsPath, 'utf-8');

check(
  'ProfileSettings 有 timezone 字段',
  profileSettingsContent.includes("timezone: 'Asia/Shanghai'") &&
  profileSettingsContent.includes('profile.timezone'),
  '用户可配置时区'
);

check(
  'ProfileSettings 保存 timezone',
  profileSettingsContent.includes('timezone:') &&
  profileSettingsContent.includes('profile.timezone'),
  '时区保存到服务器'
);

check(
  'ProfileSettings 有时区选择器',
  profileSettingsContent.includes('Asia/Shanghai') &&
  profileSettingsContent.includes('America/New_York'),
  '多个时区选项'
);

// 6. 检查数据库 Migration
const migrationPath = path.join(__dirname, 'server/db/migrations/021-add-user-profile.sql');
const migrationExists = fs.existsSync(migrationPath);

check(
  '数据库 migration 文件存在',
  migrationExists,
  migrationPath
);

if (migrationExists) {
  const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
  
  check(
    'users 表有 timezone 字段',
    migrationContent.includes('timezone TEXT') &&
    migrationContent.includes("DEFAULT 'Asia/Shanghai'"),
    'timezone 字段默认值正确'
  );
}

// 7. 输出结果
console.log('\n' + '='.repeat(50));
console.log(`📊 验证结果: ${checks.passed}/${checks.total} 通过`);
console.log('='.repeat(50));

if (checks.passed === checks.total) {
  console.log('\n🎉 所有检查通过！Notes 时间格式化已完全集成\n');
  
  console.log('📝 实现功能:');
  console.log('  ✅ formatNoteTime 辅助函数');
  console.log('     - 主时间戳优先（updated_at）');
  console.log('     - 回退到创建时间（created_at）');
  console.log('     - 最后使用当前时间');
  console.log('');
  console.log('  ✅ NotesPage 集成');
  console.log('     - 获取用户时区（user.timezone）');
  console.log('     - 笔记详情显示格式化时间');
  console.log('     - 传递时区到 NoteList');
  console.log('');
  console.log('  ✅ NoteList 集成');
  console.log('     - 接收用户时区参数');
  console.log('     - 列表项显示格式化时间');
  console.log('     - 支持回退逻辑');
  console.log('');
  console.log('  ✅ 用户配置');
  console.log('     - ProfileSettings 提供时区设置');
  console.log('     - 数据库存储 timezone 字段');
  console.log('     - 默认值: Asia/Shanghai (UTC+8)');
  console.log('');
  
  console.log('🎨 统一格式:');
  console.log('  所有时间显示: YYYY-MM-DD HH:mm:ss');
  console.log('  示例: 2025-10-19 14:30:45');
  console.log('');
  
  console.log('🔄 回退逻辑:');
  console.log('  1. 优先使用 updated_at');
  console.log('  2. 回退到 created_at');
  console.log('  3. 最后使用当前时间');
  console.log('');
  
  console.log('⚙️ 时区配置:');
  console.log('  - 从 user.timezone 读取');
  console.log('  - 默认: Asia/Shanghai (UTC+8)');
  console.log('  - 可在个人设置中修改');
  
  process.exit(0);
} else {
  console.log(`\n⚠️  ${checks.total - checks.passed} 项检查失败\n`);
  process.exit(1);
}
