#!/usr/bin/env node

/**
 * Bundle 分析工具
 *
 * 用途: 分析打包后的文件大小，找出可优化的部分
 *
 * 使用方法:
 *   npm run build
 *   node scripts/analyze-bundle.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================');
console.log('Bundle 分析工具');
console.log('========================================\n');

const distDir = path.join(process.cwd(), 'dist');

// 检查 dist 目录是否存在
if (!fs.existsSync(distDir)) {
  console.error('❌ dist 目录不存在');
  console.log('\n请先运行: npm run build');
  process.exit(1);
}

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * 获取文件大小
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * 递归获取目录中所有文件
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * 分析 JavaScript 文件
 */
function analyzeJsFiles() {
  const jsFiles = getAllFiles(distDir)
    .filter(file => file.endsWith('.js'))
    .map(file => ({
      path: path.relative(distDir, file),
      size: getFileSize(file)
    }))
    .sort((a, b) => b.size - a.size);

  console.log('📦 JavaScript 文件:');
  console.log('─'.repeat(80));

  let totalSize = 0;
  jsFiles.forEach(file => {
    totalSize += file.size;
    const sizeStr = formatSize(file.size).padStart(12);
    console.log(`  ${sizeStr}  ${file.path}`);
  });

  console.log('─'.repeat(80));
  console.log(`  ${formatSize(totalSize).padStart(12)}  总计\n`);

  return { files: jsFiles, total: totalSize };
}

/**
 * 分析 CSS 文件
 */
function analyzeCssFiles() {
  const cssFiles = getAllFiles(distDir)
    .filter(file => file.endsWith('.css'))
    .map(file => ({
      path: path.relative(distDir, file),
      size: getFileSize(file)
    }))
    .sort((a, b) => b.size - a.size);

  console.log('🎨 CSS 文件:');
  console.log('─'.repeat(80));

  let totalSize = 0;
  cssFiles.forEach(file => {
    totalSize += file.size;
    const sizeStr = formatSize(file.size).padStart(12);
    console.log(`  ${sizeStr}  ${file.path}`);
  });

  console.log('─'.repeat(80));
  console.log(`  ${formatSize(totalSize).padStart(12)}  总计\n`);

  return { files: cssFiles, total: totalSize };
}

/**
 * 分析资源文件
 */
function analyzeAssets() {
  const assetFiles = getAllFiles(distDir)
    .filter(file => {
      const ext = path.extname(file);
      return ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot'].includes(ext);
    })
    .map(file => ({
      path: path.relative(distDir, file),
      size: getFileSize(file),
      type: path.extname(file)
    }))
    .sort((a, b) => b.size - a.size);

  console.log('🖼️  资源文件:');
  console.log('─'.repeat(80));

  let totalSize = 0;
  const byType = {};

  assetFiles.forEach(file => {
    totalSize += file.size;
    byType[file.type] = (byType[file.type] || 0) + file.size;

    const sizeStr = formatSize(file.size).padStart(12);
    console.log(`  ${sizeStr}  ${file.path}`);
  });

  console.log('─'.repeat(80));
  console.log(`  ${formatSize(totalSize).padStart(12)}  总计\n`);

  console.log('按类型统计:');
  Object.entries(byType).forEach(([type, size]) => {
    console.log(`  ${type.padEnd(10)} ${formatSize(size)}`);
  });
  console.log('');

  return { files: assetFiles, total: totalSize };
}

/**
 * 生成优化建议
 */
function generateRecommendations(jsAnalysis, cssAnalysis, assetsAnalysis) {
  console.log('💡 优化建议:');
  console.log('─'.repeat(80));

  const recommendations = [];

  // JavaScript 优化
  if (jsAnalysis.total > 1024 * 1024) {
    recommendations.push({
      type: 'JavaScript',
      issue: `总大小 ${formatSize(jsAnalysis.total)} 过大`,
      suggestion: '考虑代码分割和懒加载'
    });
  }

  // 检查大文件
  jsAnalysis.files.forEach(file => {
    if (file.size > 500 * 1024) {
      recommendations.push({
        type: 'JavaScript',
        issue: `${file.path} (${formatSize(file.size)}) 过大`,
        suggestion: '检查是否包含未使用的依赖或可以拆分的代码'
      });
    }
  });

  // CSS 优化
  if (cssAnalysis.total > 200 * 1024) {
    recommendations.push({
      type: 'CSS',
      issue: `总大小 ${formatSize(cssAnalysis.total)} 过大`,
      suggestion: '考虑 CSS 代码分割和按需加载'
    });
  }

  // 资源优化
  assetsAnalysis.files.forEach(file => {
    if (file.type === '.png' || file.type === '.jpg' || file.type === '.jpeg') {
      if (file.size > 100 * 1024) {
        recommendations.push({
          type: '图片',
          issue: `${file.path} (${formatSize(file.size)}) 过大`,
          suggestion: '使用图片压缩工具 (如 imagemin) 或转换为 WebP'
        });
      }
    }
  });

  if (recommendations.length === 0) {
    console.log('  ✓ 未发现明显的优化机会\n');
  } else {
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.type}]`);
      console.log(`   问题: ${rec.issue}`);
      console.log(`   建议: ${rec.suggestion}`);
    });
    console.log('');
  }

  console.log('─'.repeat(80));
}

/**
 * 生成摘要
 */
function generateSummary(jsAnalysis, cssAnalysis, assetsAnalysis) {
  const totalSize = jsAnalysis.total + cssAnalysis.total + assetsAnalysis.total;

  console.log('\n📊 摘要:');
  console.log('─'.repeat(80));
  console.log(`  JavaScript: ${formatSize(jsAnalysis.total).padStart(12)}  (${jsAnalysis.files.length} 个文件)`);
  console.log(`  CSS:        ${formatSize(cssAnalysis.total).padStart(12)}  (${cssAnalysis.files.length} 个文件)`);
  console.log(`  资源文件:   ${formatSize(assetsAnalysis.total).padStart(12)}  (${assetsAnalysis.files.length} 个文件)`);
  console.log('─'.repeat(80));
  console.log(`  总计:       ${formatSize(totalSize).padStart(12)}`);
  console.log('─'.repeat(80));

  // 性能评分
  let score = 100;
  if (totalSize > 5 * 1024 * 1024) score -= 30;
  else if (totalSize > 3 * 1024 * 1024) score -= 20;
  else if (totalSize > 2 * 1024 * 1024) score -= 10;

  if (jsAnalysis.total > 1.5 * 1024 * 1024) score -= 20;
  else if (jsAnalysis.total > 1 * 1024 * 1024) score -= 10;

  console.log(`\n性能评分: ${score}/100`);

  if (score >= 90) {
    console.log('评价: 🌟 优秀！Bundle 大小控制得很好');
  } else if (score >= 70) {
    console.log('评价: ✓ 良好，但还有优化空间');
  } else if (score >= 50) {
    console.log('评价: ⚠️  需要优化，Bundle 偏大');
  } else {
    console.log('评价: ❌ 严重，Bundle 过大，急需优化');
  }
}

/**
 * 主函数
 */
function main() {
  try {
    const jsAnalysis = analyzeJsFiles();
    const cssAnalysis = analyzeCssFiles();
    const assetsAnalysis = analyzeAssets();

    generateRecommendations(jsAnalysis, cssAnalysis, assetsAnalysis);
    generateSummary(jsAnalysis, cssAnalysis, assetsAnalysis);

    console.log('\n📈 详细分析:');
    console.log('  运行 npm run build -- --mode=analyze 查看可视化分析');
    console.log('  或使用 vite-plugin-visualizer 生成报告\n');

  } catch (error) {
    console.error('❌ 分析失败:', error.message);
    process.exit(1);
  }
}

// 运行
main();
