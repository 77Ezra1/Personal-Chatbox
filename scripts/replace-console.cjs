#!/usr/bin/env node

/**
 * 自动替换 console 为 logger 的脚本
 * 用法: node scripts/replace-console.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DRY_RUN = process.argv.includes('--dry-run');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// 获取所有需要处理的文件
function getFilesToProcess() {
  try {
    const output = execSync(
      'find src -type f \\( -name "*.jsx" -o -name "*.js" \\) -exec grep -l "console\\." {} \\;',
      { encoding: 'utf-8' }
    );
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

// 检查文件是否已经导入 logger
function hasLoggerImport(content) {
  return /import.*from ['"]@\/lib\/logger['"]/.test(content) ||
         /import.*from ['"]\.\.\/lib\/logger['"]/.test(content) ||
         /import.*from ['"]\.\.\/\.\.\/lib\/logger['"]/.test(content);
}

// 从文件路径生成相对于 src 的 logger import 路径
function getLoggerImportPath(filePath) {
  const depth = (filePath.match(/\//g) || []).length - 1; // src 算作深度 0
  const prefix = '../'.repeat(depth);
  return `${prefix}lib/logger`;
}

// 提取组件或模块名称作为 logger context
function extractContextName(filePath, content) {
  // 从文件名提取
  const fileName = path.basename(filePath, path.extname(filePath));
  
  // 尝试从代码中提取组件名
  const exportMatch = content.match(/export\s+(?:default\s+)?(?:function|class|const)\s+(\w+)/);
  if (exportMatch) {
    return exportMatch[1];
  }
  
  // 使用文件名，转换为 PascalCase
  return fileName.charAt(0).toUpperCase() + fileName.slice(1);
}

// 替换 console 调用为 logger
function replaceConsoleInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  let changes = [];
  
  // 检查是否已经有 logger import
  const hasLogger = hasLoggerImport(content);
  const contextName = extractContextName(filePath, content);
  
  // 如果没有 logger import，添加它
  if (!hasLogger) {
    const importPath = getLoggerImportPath(filePath);
    const loggerImport = `import { createLogger } from '${importPath}'\nconst logger = createLogger('${contextName}')\n\n`;
    
    // 找到第一个 import 之后的位置插入
    const lastImportIndex = newContent.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const nextLineIndex = newContent.indexOf('\n', lastImportIndex) + 1;
      newContent = newContent.slice(0, nextLineIndex) + '\n' + loggerImport + newContent.slice(nextLineIndex);
      changes.push('Added logger import and initialization');
    } else {
      // 如果没有 import，添加到文件开头
      newContent = loggerImport + newContent;
      changes.push('Added logger import at file start');
    }
  }
  
  // 替换 console.log -> logger.log
  const logMatches = newContent.match(/console\.log\(/g);
  if (logMatches) {
    newContent = newContent.replace(/console\.log\(/g, 'logger.log(');
    changes.push(`Replaced ${logMatches.length} console.log calls`);
  }
  
  // 替换 console.error -> logger.error
  const errorMatches = newContent.match(/console\.error\(/g);
  if (errorMatches) {
    newContent = newContent.replace(/console\.error\(/g, 'logger.error(');
    changes.push(`Replaced ${errorMatches.length} console.error calls`);
  }
  
  // 替换 console.warn -> logger.warn
  const warnMatches = newContent.match(/console\.warn\(/g);
  if (warnMatches) {
    newContent = newContent.replace(/console\.warn\(/g, 'logger.warn(');
    changes.push(`Replaced ${warnMatches.length} console.warn calls`);
  }
  
  // 替换 console.info -> logger.log
  const infoMatches = newContent.match(/console\.info\(/g);
  if (infoMatches) {
    newContent = newContent.replace(/console\.info\(/g, 'logger.log(');
    changes.push(`Replaced ${infoMatches.length} console.info calls`);
  }
  
  // 替换 console.debug -> logger.debug
  const debugMatches = newContent.match(/console\.debug\(/g);
  if (debugMatches) {
    newContent = newContent.replace(/console\.debug\(/g, 'logger.debug(');
    changes.push(`Replaced ${debugMatches.length} console.debug calls`);
  }
  
  return { newContent, changes, hasChanges: content !== newContent };
}

// 主函数
function main() {
  log('\n🔍 查找使用 console 的文件...', 'blue');
  
  const files = getFilesToProcess();
  
  if (files.length === 0) {
    log('✅ 没有找到使用 console 的文件！', 'green');
    return;
  }
  
  log(`\n找到 ${files.length} 个文件需要处理:\n`, 'yellow');
  
  let processedCount = 0;
  let skippedCount = 0;
  
  for (const file of files) {
    const result = replaceConsoleInFile(file);
    
    if (result.hasChanges) {
      log(`\n📝 ${file}`, 'blue');
      result.changes.forEach(change => log(`   - ${change}`, 'green'));
      
      if (!DRY_RUN) {
        fs.writeFileSync(file, result.newContent, 'utf-8');
        log('   ✅ 已保存', 'green');
      } else {
        log('   [DRY RUN] 未保存', 'yellow');
      }
      
      processedCount++;
    } else {
      log(`⏭  ${file} (无需更改)`, 'yellow');
      skippedCount++;
    }
  }
  
  // 总结
  log('\n' + '='.repeat(60), 'blue');
  log('📊 处理完成:', 'blue');
  log(`   ✅ 已处理: ${processedCount} 个文件`, 'green');
  log(`   ⏭  已跳过: ${skippedCount} 个文件`, 'yellow');
  log(`   📁 总计: ${files.length} 个文件`, 'blue');
  
  if (DRY_RUN) {
    log('\n⚠️  这是预览模式，文件未被修改', 'yellow');
    log('   运行 node scripts/replace-console.js 来实际替换', 'yellow');
  } else {
    log('\n✅ 所有文件已更新！', 'green');
    log('\n💡 下一步:', 'blue');
    log('   1. 检查修改: git diff', 'blue');
    log('   2. 测试应用: pnpm dev', 'blue');
    log('   3. 如有问题可以回滚: git checkout -- src/', 'blue');
  }
  log('='.repeat(60) + '\n', 'blue');
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { replaceConsoleInFile, getFilesToProcess };
