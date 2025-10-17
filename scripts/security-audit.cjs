#!/usr/bin/env node

/**
 * 安全审计脚本
 *
 * 用途: 扫描项目中的潜在安全问题
 *
 * 检查项目:
 *   - 环境变量泄露
 *   - 硬编码的密钥和密码
 *   - SQL 注入风险
 *   - XSS 漏洞
 *   - 不安全的依赖
 *
 * 使用方法:
 *   node scripts/security-audit.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { glob } = require('glob');

console.log('========================================');
console.log('安全审计工具');
console.log('========================================\n');

// 安全问题统计
const issues = {
  critical: [],
  high: [],
  medium: [],
  low: []
};

/**
 * 添加安全问题
 */
function addIssue(severity, category, file, line, description, recommendation) {
  issues[severity].push({
    category,
    file,
    line,
    description,
    recommendation
  });
}

/**
 * 检查环境变量泄露
 */
async function checkEnvLeaks() {
  console.log('🔍 检查环境变量泄露...');

  // 检查 .env 是否在 Git 中
  try {
    execSync('git ls-files .env', { stdio: 'pipe' });
    addIssue(
      'critical',
      '敏感信息泄露',
      '.env',
      null,
      '.env 文件已提交到 Git 仓库',
      '立即执行: git rm --cached .env && echo ".env" >> .gitignore'
    );
  } catch (error) {
    // .env 未被追踪，这是正确的
  }

  // 检查文件中是否包含常见密钥模式
  const files = await glob('**/*.{js,cjs,jsx,ts,tsx,json}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });

  const secretPatterns = [
    { pattern: /JWT_SECRET\s*=\s*["']([^"']{20,})["']/, name: 'JWT密钥' },
    { pattern: /SESSION_SECRET\s*=\s*["']([^"']{20,})["']/, name: 'Session密钥' },
    { pattern: /API_KEY\s*=\s*["']([^"']+)["']/, name: 'API密钥' },
    { pattern: /sk-[a-zA-Z0-9]{32,}/, name: 'OpenAI API密钥' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub令牌' },
    { pattern: /password\s*[:=]\s*["'][^"']{8,}["']/i, name: '硬编码密码' }
  ];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const { pattern, name } of secretPatterns) {
          if (pattern.test(line) && !line.includes('process.env')) {
            addIssue(
              'critical',
              '硬编码密钥',
              file,
              index + 1,
              `发现硬编码的${name}`,
              '使用环境变量替代: process.env.KEY_NAME'
            );
          }
        }
      });
    } catch (error) {
      // 跳过无法读取的文件
    }
  }

  console.log('  ✓ 完成\n');
}

/**
 * 检查 SQL 注入风险
 */
async function checkSqlInjection() {
  console.log('🔍 检查 SQL 注入风险...');

  const files = await glob('server/**/*.{js,cjs}', {
    ignore: ['**/node_modules/**']
  });

  const dangerousPatterns = [
    {
      pattern: /\$\{.*\}.*sql|sql.*\$\{.*\}/i,
      description: '在 SQL 语句中使用字符串模板'
    },
    {
      pattern: /['"`]\s*\+\s*\w+\s*\+\s*['"`].*(?:SELECT|INSERT|UPDATE|DELETE|WHERE)/i,
      description: '使用字符串拼接构建 SQL 语句'
    },
    {
      pattern: /\.query\([^?]*\+/,
      description: 'query() 方法使用字符串拼接'
    }
  ];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const { pattern, description } of dangerousPatterns) {
          if (pattern.test(line)) {
            addIssue(
              'high',
              'SQL 注入风险',
              file,
              index + 1,
              description,
              '使用参数化查询: db.query("SELECT * FROM users WHERE id = ?", [userId])'
            );
          }
        }
      });
    } catch (error) {
      // 跳过无法读取的文件
    }
  }

  console.log('  ✓ 完成\n');
}

/**
 * 检查 XSS 漏洞
 */
async function checkXssVulnerabilities() {
  console.log('🔍 检查 XSS 漏洞...');

  const files = await glob('{src,server}/**/*.{js,cjs,jsx}', {
    ignore: ['**/node_modules/**']
  });

  const dangerousPatterns = [
    {
      pattern: /dangerouslySetInnerHTML/,
      description: '使用 dangerouslySetInnerHTML',
      severity: 'high'
    },
    {
      pattern: /innerHTML\s*=/,
      description: '直接设置 innerHTML',
      severity: 'high'
    },
    {
      pattern: /eval\(/,
      description: '使用 eval() 函数',
      severity: 'critical'
    },
    {
      pattern: /new Function\(/,
      description: '使用 new Function() 构造器',
      severity: 'high'
    }
  ];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const { pattern, description, severity } of dangerousPatterns) {
          if (pattern.test(line)) {
            addIssue(
              severity,
              'XSS 漏洞风险',
              file,
              index + 1,
              description,
              '使用安全的 API 或进行适当的输入清理'
            );
          }
        }
      });
    } catch (error) {
      // 跳过无法读取的文件
    }
  }

  console.log('  ✓ 完成\n');
}

/**
 * 检查依赖安全性
 */
function checkDependencies() {
  console.log('🔍 检查依赖安全性...');

  try {
    // 运行 npm audit
    const auditResult = execSync('npm audit --json', {
      stdio: 'pipe',
      encoding: 'utf8'
    });

    const audit = JSON.parse(auditResult);

    if (audit.metadata) {
      const { vulnerabilities } = audit.metadata;

      if (vulnerabilities) {
        if (vulnerabilities.critical > 0) {
          addIssue(
            'critical',
            '依赖漏洞',
            'package.json',
            null,
            `发现 ${vulnerabilities.critical} 个严重依赖漏洞`,
            '运行: npm audit fix --force'
          );
        }

        if (vulnerabilities.high > 0) {
          addIssue(
            'high',
            '依赖漏洞',
            'package.json',
            null,
            `发现 ${vulnerabilities.high} 个高危依赖漏洞`,
            '运行: npm audit fix'
          );
        }

        if (vulnerabilities.moderate > 0) {
          addIssue(
            'medium',
            '依赖漏洞',
            'package.json',
            null,
            `发现 ${vulnerabilities.moderate} 个中危依赖漏洞`,
            '运行: npm audit fix'
          );
        }
      }
    }
  } catch (error) {
    // npm audit 返回非零退出码时也可能有输出
    try {
      const audit = JSON.parse(error.stdout);
      if (audit.metadata?.vulnerabilities) {
        const { vulnerabilities } = audit.metadata;
        if (Object.values(vulnerabilities).some(v => v > 0)) {
          addIssue(
            'high',
            '依赖漏洞',
            'package.json',
            null,
            '发现依赖安全漏洞',
            '运行: npm audit 查看详情'
          );
        }
      }
    } catch (parseError) {
      console.log('  ⚠️  无法解析 npm audit 输出');
    }
  }

  console.log('  ✓ 完成\n');
}

/**
 * 检查不安全的配置
 */
async function checkInsecureConfigs() {
  console.log('🔍 检查不安全的配置...');

  const files = await glob('server/**/*.{js,cjs}', {
    ignore: ['**/node_modules/**']
  });

  const insecurePatterns = [
    {
      pattern: /cors\(\s*\{[\s\S]*?origin:\s*['"]?\*['"]?/,
      description: 'CORS 配置允许所有源',
      severity: 'medium'
    },
    {
      pattern: /helmet\s*\(\s*\)/,
      description: 'Helmet 使用默认配置，可能不够严格',
      severity: 'low'
    },
    {
      pattern: /NODE_ENV\s*!==\s*['"]production['"]/,
      description: '基于 NODE_ENV 的安全检查可被绕过',
      severity: 'medium'
    }
  ];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const { pattern, description, severity } of insecurePatterns) {
          if (pattern.test(line)) {
            addIssue(
              severity,
              '不安全配置',
              file,
              index + 1,
              description,
              '检查并加强安全配置'
            );
          }
        }
      });
    } catch (error) {
      // 跳过无法读取的文件
    }
  }

  console.log('  ✓ 完成\n');
}

/**
 * 打印问题报告
 */
function printReport() {
  console.log('\n========================================');
  console.log('安全审计报告');
  console.log('========================================\n');

  const severities = [
    { key: 'critical', label: '🔴 严重', color: '\x1b[31m' },
    { key: 'high', label: '🟠 高危', color: '\x1b[33m' },
    { key: 'medium', label: '🟡 中危', color: '\x1b[93m' },
    { key: 'low', label: '🟢 低危', color: '\x1b[32m' }
  ];

  let totalIssues = 0;

  severities.forEach(({ key, label, color }) => {
    const severityIssues = issues[key];
    if (severityIssues.length > 0) {
      totalIssues += severityIssues.length;

      console.log(`${color}${label} (${severityIssues.length} 个问题)\x1b[0m`);
      console.log('─'.repeat(80));

      severityIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. [${issue.category}]`);
        console.log(`   文件: ${issue.file}${issue.line ? ':' + issue.line : ''}`);
        console.log(`   问题: ${issue.description}`);
        console.log(`   建议: ${issue.recommendation}`);
      });

      console.log('\n');
    }
  });

  // 总结
  console.log('─'.repeat(80));
  console.log(`总计: ${totalIssues} 个安全问题`);
  console.log('─'.repeat(80));

  if (totalIssues === 0) {
    console.log('\n✅ 太好了！未发现明显的安全问题。\n');
  } else {
    const criticalCount = issues.critical.length;
    const highCount = issues.high.length;

    console.log('\n📋 优先级建议:\n');

    if (criticalCount > 0) {
      console.log(`  🔴 立即处理 ${criticalCount} 个严重问题`);
    }

    if (highCount > 0) {
      console.log(`  🟠 尽快处理 ${highCount} 个高危问题`);
    }

    console.log('\n💡 完整的安全清单，请参阅:');
    console.log('   docs/guides/SECURITY_CHECKLIST.md\n');
  }

  // 生成 JSON 报告
  const reportPath = path.join(process.cwd(), 'security-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));
  console.log(`📄 详细报告已保存到: ${reportPath}\n`);

  // 如果有严重或高危问题，返回非零退出码
  if (issues.critical.length > 0 || issues.high.length > 0) {
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    await checkEnvLeaks();
    await checkSqlInjection();
    await checkXssVulnerabilities();
    checkDependencies();
    await checkInsecureConfigs();

    printReport();
  } catch (error) {
    console.error('❌ 审计失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行
main();
