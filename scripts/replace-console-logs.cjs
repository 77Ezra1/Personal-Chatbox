#!/usr/bin/env node

/**
 * 批量替换 console.log 为正规日志系统
 *
 * 用途: 将项目中的 console.log/error/warn/debug 替换为 logger 调用
 *
 * 使用方法:
 *   node scripts/replace-console-logs.cjs [选项]
 *
 * 选项:
 *   --dry-run    仅显示将要修改的内容，不实际修改
 *   --path       指定要处理的路径 (默认: server/)
 *   --backup     在修改前创建备份
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// 命令行参数解析
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const createBackup = args.includes('--backup');
const targetPathIndex = args.indexOf('--path');
const targetPath = targetPathIndex !== -1 ? args[targetPathIndex + 1] : 'server';

console.log('========================================');
console.log('Console Log 替换工具');
console.log('========================================\n');

if (isDryRun) {
  console.log('⚠️  运行模式: 预览 (--dry-run)\n');
} else {
  console.log('✓ 运行模式: 实际修改\n');
}

// 替换规则
const replacements = [
  {
    pattern: /console\.error\(([\s\S]*?)\);?$/gm,
    replacement: (match, content) => {
      // 处理多行内容
      const trimmed = content.trim();
      return `logger.error(${trimmed});`;
    },
    type: 'error'
  },
  {
    pattern: /console\.warn\(([\s\S]*?)\);?$/gm,
    replacement: (match, content) => {
      const trimmed = content.trim();
      return `logger.warn(${trimmed});`;
    },
    type: 'warn'
  },
  {
    pattern: /console\.info\(([\s\S]*?)\);?$/gm,
    replacement: (match, content) => {
      const trimmed = content.trim();
      return `logger.info(${trimmed});`;
    },
    type: 'info'
  },
  {
    pattern: /console\.debug\(([\s\S]*?)\);?$/gm,
    replacement: (match, content) => {
      const trimmed = content.trim();
      return `logger.debug(${trimmed});`;
    },
    type: 'debug'
  },
  {
    pattern: /console\.log\(([\s\S]*?)\);?$/gm,
    replacement: (match, content) => {
      const trimmed = content.trim();
      // console.log 映射到 logger.info
      return `logger.info(${trimmed});`;
    },
    type: 'log'
  }
];

// 统计信息
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  totalReplacements: 0,
  byType: {
    error: 0,
    warn: 0,
    info: 0,
    debug: 0,
    log: 0
  }
};

/**
 * 计算相对路径
 */
function getRelativeLoggerPath(fromFile) {
  const fromDir = path.dirname(fromFile);
  const loggerPath = path.join(process.cwd(), 'server', 'lib', 'logger.cjs');

  let relativePath = path.relative(fromDir, loggerPath);

  // 确保使用正斜杠
  relativePath = relativePath.replace(/\\/g, '/');

  // 确保以 ./ 或 ../ 开头
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }

  return relativePath;
}

/**
 * 检查文件是否已经导入 logger
 */
function hasLoggerImport(content) {
  return /require\(['"].*logger\.cjs['"]\)/.test(content) ||
         /import.*logger/.test(content);
}

/**
 * 在文件开头添加 logger 导入
 */
function addLoggerImport(content, filePath) {
  const relativePath = getRelativeLoggerPath(filePath);

  // 查找第一个 require 或 import 语句
  const requireMatch = content.match(/^(const|let|var|import).*require/m);

  const importStatement = `const logger = require('${relativePath}');\n`;

  if (requireMatch) {
    // 在第一个 require 前插入
    const insertPos = requireMatch.index;
    return content.slice(0, insertPos) + importStatement + content.slice(insertPos);
  } else {
    // 在文件开头插入（跳过 shebang 和初始注释）
    const lines = content.split('\n');
    let insertIndex = 0;

    // 跳过 shebang
    if (lines[0].startsWith('#!')) {
      insertIndex = 1;
    }

    // 跳过顶部注释块
    while (insertIndex < lines.length &&
           (lines[insertIndex].trim().startsWith('//') ||
            lines[insertIndex].trim().startsWith('/*') ||
            lines[insertIndex].trim().startsWith('*') ||
            lines[insertIndex].trim() === '')) {
      insertIndex++;
    }

    lines.splice(insertIndex, 0, importStatement);
    return lines.join('\n');
  }
}

/**
 * 处理单个文件
 */
function processFile(filePath) {
  stats.filesProcessed++;

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let replacementCount = 0;

  // 应用替换规则
  for (const { pattern, replacement, type } of replacements) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      const count = matches.length;
      replacementCount += count;
      stats.byType[type] += count;
      modified = true;
    }
  }

  if (modified) {
    stats.filesModified++;
    stats.totalReplacements += replacementCount;

    // 添加 logger 导入（如果还没有）
    if (!hasLoggerImport(content)) {
      content = addLoggerImport(content, filePath);
    }

    console.log(`✓ ${filePath}`);
    console.log(`  └─ ${replacementCount} 处替换\n`);

    // 实际修改或预览
    if (!isDryRun) {
      // 创建备份
      if (createBackup) {
        fs.writeFileSync(`${filePath}.backup`, fs.readFileSync(filePath));
      }

      // 写入修改
      fs.writeFileSync(filePath, content);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 查找所有 .cjs 和 .js 文件
    const pattern = `${targetPath}/**/*.{cjs,js}`;
    console.log(`正在扫描: ${pattern}\n`);

    const files = await glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.backup',
        '**/logger.cjs' // 排除 logger 本身
      ]
    });

    console.log(`找到 ${files.length} 个文件\n`);
    console.log('开始处理...\n');

    // 处理每个文件
    for (const file of files) {
      processFile(file);
    }

    // 打印统计信息
    console.log('\n========================================');
    console.log('处理完成！');
    console.log('========================================\n');

    console.log('📊 统计信息:');
    console.log(`  - 处理文件数: ${stats.filesProcessed}`);
    console.log(`  - 修改文件数: ${stats.filesModified}`);
    console.log(`  - 总替换次数: ${stats.totalReplacements}`);
    console.log('\n按类型统计:');
    console.log(`  - console.error → logger.error: ${stats.byType.error}`);
    console.log(`  - console.warn  → logger.warn:  ${stats.byType.warn}`);
    console.log(`  - console.info  → logger.info:  ${stats.byType.info}`);
    console.log(`  - console.debug → logger.debug: ${stats.byType.debug}`);
    console.log(`  - console.log   → logger.info:  ${stats.byType.log}`);

    if (isDryRun) {
      console.log('\n⚠️  这是预览模式，未实际修改文件');
      console.log('要应用这些更改，请运行: node scripts/replace-console-logs.cjs');
    } else {
      console.log('\n✓ 文件已成功修改');
      if (createBackup) {
        console.log('✓ 备份文件已创建 (*.backup)');
      }
      console.log('\n下一步:');
      console.log('  1. 检查修改: git diff');
      console.log('  2. 测试应用: npm run dev');
      console.log('  3. 提交更改: git add . && git commit -m "refactor: replace console.log with logger"');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

// 运行
main();
