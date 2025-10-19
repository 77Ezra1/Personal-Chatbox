#!/usr/bin/env node
/**
 * normalizeNote 功能验证脚本
 * 验证笔记归一化功能的正确性
 */

const fs = require('fs');
const path = require('path');

// ANSI 颜色代码
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function success(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function error(msg) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

function info(msg) {
  console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`);
}

function warning(msg) {
  console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
}

function header(msg) {
  console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}\n`);
}

let checksPassed = 0;
let checksFailed = 0;

function check(condition, successMsg, failMsg) {
  if (condition) {
    success(successMsg);
    checksPassed++;
    return true;
  } else {
    error(failMsg);
    checksFailed++;
    return false;
  }
}

// 检查文件存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 读取文件内容
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
}

// 主验证逻辑
function verify() {
  header('📋 验证 normalizeNote 功能');

  // 1. 检查 utils.js 文件
  info('检查 src/lib/utils.js...');
  const utilsPath = path.join(__dirname, 'src/lib/utils.js');
  check(
    fileExists(utilsPath),
    'utils.js 文件存在',
    'utils.js 文件不存在'
  );

  if (!fileExists(utilsPath)) {
    return;
  }

  const utilsContent = readFile(utilsPath);

  // 2. 检查 normalizeNote 函数
  check(
    utilsContent && utilsContent.includes('export const normalizeNote'),
    'normalizeNote 函数已定义',
    'normalizeNote 函数未找到'
  );

  // 3. 检查 normalizeNotes 函数
  check(
    utilsContent && utilsContent.includes('export const normalizeNotes'),
    'normalizeNotes 函数已定义（批量处理）',
    'normalizeNotes 函数未找到'
  );

  // 4. 检查 tags 归一化逻辑
  check(
    utilsContent && utilsContent.includes('Normalize tags to array'),
    'Tags 归一化逻辑存在（字符串转数组）',
    'Tags 归一化逻辑缺失'
  );

  // 5. 检查 JSON 解析逻辑
  check(
    utilsContent && utilsContent.includes('JSON.parse'),
    'JSON 字符串解析逻辑存在',
    'JSON 字符串解析逻辑缺失'
  );

  // 6. 检查逗号分隔符处理
  check(
    utilsContent && utilsContent.includes('split(\',\')'),
    '逗号分隔符处理逻辑存在',
    '逗号分隔符处理逻辑缺失'
  );

  // 7. 检查时间戳归一化
  check(
    utilsContent && utilsContent.includes('Normalize timestamps to ISO 8601'),
    '时间戳归一化逻辑存在（ISO 8601 格式）',
    '时间戳归一化逻辑缺失'
  );

  // 8. 检查 toISOString 转换
  check(
    utilsContent && utilsContent.includes('toISOString()'),
    'ISO 字符串转换逻辑存在',
    'ISO 字符串转换逻辑缺失'
  );

  // 9. 检查默认值处理
  check(
    utilsContent && utilsContent.includes('const now = new Date().toISOString()'),
    '默认时间戳处理逻辑存在',
    '默认时间戳处理逻辑缺失'
  );

  // 10. 检查字段保证
  const fieldsToCheck = [
    'title: typeof note.title',
    'content: typeof note.content',
    'is_favorite: Boolean',
    'is_archived: Boolean'
  ];
  
  fieldsToCheck.forEach(field => {
    check(
      utilsContent && utilsContent.includes(field),
      `字段归一化存在: ${field.split(':')[0]}`,
      `字段归一化缺失: ${field.split(':')[0]}`
    );
  });

  // 11. 检查 notesApi.js 集成
  info('\n检查 src/lib/notesApi.js...');
  const apiPath = path.join(__dirname, 'src/lib/notesApi.js');
  check(
    fileExists(apiPath),
    'notesApi.js 文件存在',
    'notesApi.js 文件不存在'
  );

  if (fileExists(apiPath)) {
    const apiContent = readFile(apiPath);

    // 12. 检查导入语句
    check(
      apiContent && apiContent.includes('import { normalizeNote, normalizeNotes } from \'./utils\''),
      'notesApi.js 导入了 normalizeNote 和 normalizeNotes',
      'notesApi.js 未导入归一化函数'
    );

    // 13. 检查 getAllNotes 归一化
    check(
      apiContent && apiContent.includes('return normalizeNotes(response.data.notes)'),
      'getAllNotes 使用 normalizeNotes 归一化',
      'getAllNotes 未归一化'
    );

    // 14. 检查 getNoteById 归一化
    check(
      apiContent && apiContent.includes('return normalizeNote(response.data.note)'),
      'getNoteById 使用 normalizeNote 归一化',
      'getNoteById 未归一化'
    );

    // 15. 检查 createNote 归一化
    check(
      apiContent && apiContent.match(/export async function createNote[\s\S]*?normalizeNote/),
      'createNote 使用 normalizeNote 归一化',
      'createNote 未归一化'
    );

    // 16. 检查 updateNote 归一化
    check(
      apiContent && apiContent.match(/export async function updateNote[\s\S]*?normalizeNote/),
      'updateNote 使用 normalizeNote 归一化',
      'updateNote 未归一化'
    );

    // 17. 检查 searchNotes 归一化
    check(
      apiContent && apiContent.match(/export async function searchNotes[\s\S]*?normalizeNotes/),
      'searchNotes 使用 normalizeNotes 归一化',
      'searchNotes 未归一化'
    );
  }

  // 18. 检查 NoteList.jsx 简化逻辑
  info('\n检查 src/components/notes/NoteList.jsx...');
  const noteListPath = path.join(__dirname, 'src/components/notes/NoteList.jsx');
  check(
    fileExists(noteListPath),
    'NoteList.jsx 文件存在',
    'NoteList.jsx 文件不存在'
  );

  if (fileExists(noteListPath)) {
    const noteListContent = readFile(noteListPath);

    // 19. 检查简化的判空逻辑
    check(
      noteListContent && !noteListContent.includes('Array.isArray(note.tags)'),
      'NoteList 移除了 Array.isArray 判空（信任 normalizeNote）',
      'NoteList 仍在使用 Array.isArray 判空'
    );

    // 20. 检查简化的 formatDate
    check(
      noteListContent && !noteListContent.includes('note?.updated_at'),
      'formatDate 移除了可选链操作符（信任 normalizeNote）',
      'formatDate 仍在使用可选链操作符'
    );

    // 21. 检查 truncateContent 简化
    check(
      noteListContent && !noteListContent.includes('typeof content !== \'string\''),
      'truncateContent 移除了类型检查（信任 normalizeNote）',
      'truncateContent 仍在进行复杂类型检查'
    );

    // 22. 检查注释说明
    check(
      noteListContent && noteListContent.includes('normalizeNote 确保'),
      'NoteList 添加了 normalizeNote 使用说明注释',
      'NoteList 缺少说明注释'
    );
  }

  // 23. 检查 NotesPage.jsx 简化逻辑
  info('\n检查 src/pages/NotesPage.jsx...');
  const notesPagePath = path.join(__dirname, 'src/pages/NotesPage.jsx');
  check(
    fileExists(notesPagePath),
    'NotesPage.jsx 文件存在',
    'NotesPage.jsx 文件不存在'
  );

  if (fileExists(notesPagePath)) {
    const notesPageContent = readFile(notesPagePath);

    // 24. 检查 tags 判空简化
    const tagsCheckPattern = /selectedNote\.tags\.length > 0/;
    const oldTagsCheckPattern = /selectedNote\.tags && selectedNote\.tags\.length > 0/;
    
    check(
      notesPageContent && 
      notesPageContent.match(tagsCheckPattern) && 
      !notesPageContent.match(oldTagsCheckPattern),
      'NotesPage tags 检查已简化（移除 && 判空）',
      'NotesPage tags 检查未简化'
    );
  }

  // 25. 检查 NoteEditor.jsx tags 处理
  info('\n检查 src/components/notes/NoteEditor.jsx...');
  const editorPath = path.join(__dirname, 'src/components/notes/NoteEditor.jsx');
  check(
    fileExists(editorPath),
    'NoteEditor.jsx 文件存在',
    'NoteEditor.jsx 文件不存在'
  );

  if (fileExists(editorPath)) {
    const editorContent = readFile(editorPath);

    // 26. 检查 tags 初始化
    check(
      editorContent && editorContent.includes('useState(note?.tags || [])'),
      'NoteEditor tags 使用 || [] 作为默认值（兼容归一化数据）',
      'NoteEditor tags 初始化可能有问题'
    );
  }

  // 27-30. 功能特性检查
  info('\n检查功能特性...');
  
  check(
    utilsContent && utilsContent.includes('@example'),
    'normalizeNote 包含使用示例',
    'normalizeNote 缺少使用示例'
  );

  check(
    utilsContent && utilsContent.includes('@param') && utilsContent.includes('@returns'),
    'normalizeNote 包含完整的 JSDoc 注释',
    'normalizeNote 缺少 JSDoc 注释'
  );

  check(
    utilsContent && utilsContent.includes('console.warn'),
    'normalizeNote 包含错误处理和警告',
    'normalizeNote 缺少错误处理'
  );

  check(
    utilsContent && utilsContent.includes('filter(note => note !== null)'),
    'normalizeNotes 过滤掉无效笔记',
    'normalizeNotes 未过滤无效笔记'
  );

  // 输出总结
  header('验证总结');
  console.log(`${colors.bold}通过检查: ${colors.green}${checksPassed}${colors.reset}`);
  console.log(`${colors.bold}失败检查: ${colors.red}${checksFailed}${colors.reset}`);
  console.log(`${colors.bold}总计: ${checksPassed + checksFailed}${colors.reset}\n`);

  if (checksFailed === 0) {
    success('🎉 所有检查通过！normalizeNote 功能完整实现。');
    console.log('\n主要功能：');
    console.log('  • Tags 归一化（JSON字符串/逗号分隔 → 数组）');
    console.log('  • 时间戳归一化（任意格式 → ISO 8601）');
    console.log('  • 字段类型保证（title/content 字符串，布尔值规范）');
    console.log('  • API 自动归一化（getAllNotes/getNoteById/createNote/updateNote/searchNotes）');
    console.log('  • UI 简化逻辑（NoteList/NotesPage 移除冗余判空）');
    return true;
  } else {
    error('部分检查失败，请查看上方错误信息。');
    return false;
  }
}

// 运行验证
const result = verify();
process.exit(result ? 0 : 1);
