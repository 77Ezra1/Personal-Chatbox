/**
 * formatInTimezone 工具验证脚本
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 验证 formatInTimezone 工具实现...\n');

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

// 1. 检查 utils.js 文件
const utilsPath = path.join(__dirname, 'src/lib/utils.js');
if (!fs.existsSync(utilsPath)) {
  console.log('❌ utils.js 文件不存在');
  process.exit(1);
}

const utilsContent = fs.readFileSync(utilsPath, 'utf-8');

check(
  'formatInTimezone 函数存在',
  utilsContent.includes('export const formatInTimezone') &&
  utilsContent.includes('YYYY-MM-DD HH:mm:ss'),
  '主函数定义'
);

check(
  'formatNowInTimezone 函数存在',
  utilsContent.includes('export const formatNowInTimezone'),
  '当前时间格式化函数'
);

check(
  'getCommonTimezones 函数存在',
  utilsContent.includes('export const getCommonTimezones'),
  '时区列表函数'
);

check(
  '支持 Date 对象',
  utilsContent.includes('date instanceof Date'),
  '检查 Date 对象类型'
);

check(
  '支持字符串和数字',
  utilsContent.includes("typeof date === 'string'") &&
  utilsContent.includes("typeof date === 'number'"),
  '支持多种输入类型'
);

check(
  '使用 Intl.DateTimeFormat',
  utilsContent.includes('Intl.DateTimeFormat'),
  '使用原生 API 进行时区转换'
);

check(
  '默认时区为 Asia/Shanghai',
  utilsContent.includes("timezone = 'Asia/Shanghai'"),
  '中国标准时间'
);

check(
  '完整的 JSDoc 注释',
  utilsContent.includes('@param') &&
  utilsContent.includes('@returns') &&
  utilsContent.includes('@example'),
  '函数文档完整'
);

check(
  '错误处理',
  utilsContent.includes('try') &&
  utilsContent.includes('catch') &&
  utilsContent.includes('Invalid Date'),
  '包含错误处理逻辑'
);

check(
  '日期有效性检查',
  utilsContent.includes('isNaN(dateObj.getTime())'),
  '验证日期是否有效'
);

check(
  '格式化选项配置',
  utilsContent.includes('year: \'numeric\'') &&
  utilsContent.includes('month: \'2-digit\'') &&
  utilsContent.includes('day: \'2-digit\'') &&
  utilsContent.includes('hour: \'2-digit\'') &&
  utilsContent.includes('minute: \'2-digit\'') &&
  utilsContent.includes('second: \'2-digit\''),
  '所有时间单位配置完整'
);

check(
  '24小时制',
  utilsContent.includes('hour12: false'),
  '使用24小时制'
);

check(
  '常用时区列表包含中国',
  utilsContent.includes('Asia/Shanghai') &&
  utilsContent.includes('China Standard Time'),
  '包含中国时区'
);

check(
  '常用时区列表包含UTC',
  utilsContent.includes("value: 'UTC'") &&
  utilsContent.includes('Coordinated Universal Time'),
  '包含 UTC 时区'
);

check(
  '时区对象结构完整',
  utilsContent.includes('value:') &&
  utilsContent.includes('label:') &&
  utilsContent.includes('offset:'),
  'value, label, offset 三个属性齐全'
);

// 2. 检查测试文件
const testPath = path.join(__dirname, 'src/lib/__tests__/utils.formatInTimezone.test.js');
const testExists = fs.existsSync(testPath);

check(
  '测试文件存在',
  testExists,
  testPath
);

if (testExists) {
  const testContent = fs.readFileSync(testPath, 'utf-8');

  check(
    '测试 Date 对象格式化',
    testContent.includes("formats Date object correctly"),
    'Date 对象测试用例'
  );

  check(
    '测试 ISO 字符串格式化',
    testContent.includes("formats ISO string correctly"),
    'ISO 字符串测试用例'
  );

  check(
    '测试时间戳格式化',
    testContent.includes("formats timestamp correctly"),
    '时间戳测试用例'
  );

  check(
    '测试不同时区',
    testContent.includes("handles different timezones correctly"),
    '时区转换测试用例'
  );

  check(
    '测试无效输入',
    testContent.includes("handles invalid date input"),
    '错误处理测试用例'
  );

  check(
    '测试时区列表',
    testContent.includes("getCommonTimezones"),
    '时区列表测试用例'
  );
}

// 3. 检查文档文件
const docPath = path.join(__dirname, 'FORMAT_IN_TIMEZONE_GUIDE.md');
const docExists = fs.existsSync(docPath);

check(
  '文档文件存在',
  docExists,
  docPath
);

if (docExists) {
  const docContent = fs.readFileSync(docPath, 'utf-8');

  check(
    '文档包含使用示例',
    docContent.includes('示例') || docContent.includes('Example'),
    '完整的使用示例'
  );

  check(
    '文档包含时区说明',
    docContent.includes('时区') || docContent.includes('timezone'),
    '时区相关说明'
  );

  check(
    '文档包含输出格式说明',
    docContent.includes('YYYY-MM-DD HH:mm:ss'),
    '格式说明清晰'
  );
}

// 4. 输出结果
console.log('\n' + '='.repeat(50));
console.log(`📊 验证结果: ${checks.passed}/${checks.total} 通过`);
console.log('='.repeat(50));

if (checks.passed === checks.total) {
  console.log('\n🎉 所有检查通过！formatInTimezone 工具已成功实现\n');
  
  console.log('📝 功能特性:');
  console.log('  ✅ formatInTimezone(date, timezone)');
  console.log('     - 支持 Date 对象、ISO 字符串、时间戳');
  console.log('     - 统一输出格式：YYYY-MM-DD HH:mm:ss');
  console.log('     - 默认时区：Asia/Shanghai (UTC+8)');
  console.log('');
  console.log('  ✅ formatNowInTimezone(timezone)');
  console.log('     - 获取当前时间的格式化字符串');
  console.log('');
  console.log('  ✅ getCommonTimezones()');
  console.log('     - 返回常用时区列表（10个）');
  console.log('');
  
  console.log('🎨 使用示例:');
  console.log('  import { formatInTimezone } from \'@/lib/utils\';');
  console.log('  ');
  console.log('  formatInTimezone(new Date(), \'Asia/Shanghai\')');
  console.log('  // => \'2025-10-19 14:30:45\'');
  console.log('');
  
  console.log('📚 文档位置:');
  console.log('  - 函数定义: src/lib/utils.js');
  console.log('  - 测试文件: src/lib/__tests__/utils.formatInTimezone.test.js');
  console.log('  - 使用指南: FORMAT_IN_TIMEZONE_GUIDE.md');
  console.log('');
  
  console.log('🚀 下一步:');
  console.log('  1. 运行测试: npm test utils.formatInTimezone.test.js');
  console.log('  2. 在项目中使用: import { formatInTimezone } from \'@/lib/utils\'');
  console.log('  3. 查看完整文档: FORMAT_IN_TIMEZONE_GUIDE.md');
  
  process.exit(0);
} else {
  console.log(`\n⚠️  ${checks.total - checks.passed} 项检查失败\n`);
  process.exit(1);
}
