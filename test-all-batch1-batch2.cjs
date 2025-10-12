/**
 * 完整的 MCP 服务测试套件
 * 测试第一批和第二批所有 MCP 服务
 */

const http = require('http');

// 测试配置
const BASE_URL = 'http://localhost:3001';
const tests = [];
let passedTests = 0;
let failedTests = 0;

/**
 * 发送 HTTP 请求
 */
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(BASE_URL + path, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * 调用 MCP 工具
 */
async function callTool(toolName, parameters) {
  return request('POST', '/api/mcp/call', {
    toolName,
    parameters
  });
}

/**
 * 运行测试
 */
async function runTest(name, testFn) {
  process.stdout.write(`  ${name} ... `);
  try {
    await testFn();
    console.log('✅');
    passedTests++;
    tests.push({ name, status: 'passed' });
  } catch (error) {
    console.log(`❌ ${error.message}`);
    failedTests++;
    tests.push({ name, status: 'failed', error: error.message });
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('\n========================================');
  console.log('完整 MCP 服务测试套件');
  console.log('========================================\n');

  // ========== 第一批服务测试 ==========
  console.log('📦 第一批服务 (免费,无需 API Key)\n');

  // Memory 服务
  console.log('1. Memory 记忆系统');
  await runTest('创建实体', async () => {
    const result = await callTool('memory_create_entities', {
      entities: [{
        name: 'test_user',
        entityType: 'person',
        observations: ['测试用户']
      }]
    });
    if (!result.success) throw new Error(result.error || '创建失败');
  });

  await runTest('搜索节点', async () => {
    const result = await callTool('memory_search_nodes', {
      query: 'test'
    });
    if (!result.success) throw new Error(result.error || '搜索失败');
  });

  // Filesystem 服务
  console.log('\n2. Filesystem 文件系统');
  await runTest('列出目录', async () => {
    const result = await callTool('filesystem_list_directory', {
      path: '/home/ubuntu/AI-Life-system'
    });
    if (!result.success) throw new Error(result.error || '列出失败');
  });

  // Git 服务
  console.log('\n3. Git 版本控制');
  await runTest('查看状态', async () => {
    const result = await callTool('git_git_status', {});
    if (!result.success) throw new Error(result.error || '查看失败');
  });

  await runTest('查看日志', async () => {
    const result = await callTool('git_git_log', {
      max_count: 5
    });
    if (!result.success) throw new Error(result.error || '查看失败');
  });

  // Sequential Thinking 服务
  console.log('\n4. Sequential Thinking 推理增强');
  await runTest('结构化思考', async () => {
    const result = await callTool('sequential_thinking_sequentialthinking', {
      thought: '测试思考过程',
      nextThoughtNeeded: false
    });
    if (!result.success) throw new Error(result.error || '思考失败');
  });

  // SQLite 服务
  console.log('\n5. SQLite 数据库');
  await runTest('获取数据库信息', async () => {
    const result = await callTool('sqlite_db_info', {});
    if (!result.success) throw new Error(result.error || '获取失败');
  });

  await runTest('列出表', async () => {
    const result = await callTool('sqlite_list_tables', {});
    if (!result.success) throw new Error(result.error || '列出失败');
  });

  // Wikipedia 服务
  console.log('\n6. Wikipedia 维基百科');
  await runTest('搜索页面', async () => {
    const result = await callTool('wikipedia_findPage', {
      query: 'Artificial Intelligence'
    });
    if (!result.success) throw new Error(result.error || '搜索失败');
  });

  // ========== 第二批服务测试 ==========
  console.log('\n\n📦 第二批服务 (需要 API Key)\n');

  // Brave Search 服务
  console.log('7. Brave Search 网页搜索');
  await runTest('网页搜索', async () => {
    const result = await callTool('brave_search_brave_web_search', {
      query: 'MCP protocol'
    });
    if (!result.success) throw new Error(result.error || '搜索失败');
  });

  await runTest('新闻搜索', async () => {
    const result = await callTool('brave_search_brave_news_search', {
      query: 'AI technology'
    });
    if (!result.success) throw new Error(result.error || '搜索失败');
  });

  // GitHub 服务
  console.log('\n8. GitHub 仓库管理');
  await runTest('搜索仓库', async () => {
    const result = await callTool('github_search_repositories', {
      query: 'mcp server',
      per_page: 3
    });
    if (!result.success) throw new Error(result.error || '搜索失败');
  });

  await runTest('搜索代码', async () => {
    const result = await callTool('github_search_code', {
      q: 'MCP server language:JavaScript',
      per_page: 3
    });
    if (!result.success) throw new Error(result.error || '搜索失败');
  });

  await runTest('获取文件内容', async () => {
    const result = await callTool('github_get_file_contents', {
      owner: '77Ezra1',
      repo: 'AI-Life-system',
      path: 'README.md'
    });
    if (!result.success) throw new Error(result.error || '获取失败');
  });

  // ========== 测试总结 ==========
  console.log('\n\n========================================');
  console.log('测试总结');
  console.log('========================================');
  console.log(`总计: ${tests.length} 个测试`);
  console.log(`✅ 通过: ${passedTests} 个 (${((passedTests / tests.length) * 100).toFixed(1)}%)`);
  console.log(`❌ 失败: ${failedTests} 个 (${((failedTests / tests.length) * 100).toFixed(1)}%)`);
  console.log('========================================\n');

  // 按服务分组显示结果
  console.log('服务测试结果:');
  const services = [
    { name: 'Memory', tests: tests.slice(0, 2) },
    { name: 'Filesystem', tests: tests.slice(2, 3) },
    { name: 'Git', tests: tests.slice(3, 5) },
    { name: 'Sequential Thinking', tests: tests.slice(5, 6) },
    { name: 'SQLite', tests: tests.slice(6, 8) },
    { name: 'Wikipedia', tests: tests.slice(8, 9) },
    { name: 'Brave Search', tests: tests.slice(9, 11) },
    { name: 'GitHub', tests: tests.slice(11) }
  ];

  services.forEach(service => {
    const passed = service.tests.filter(t => t.status === 'passed').length;
    const total = service.tests.length;
    const status = passed === total ? '✅' : '⚠️';
    console.log(`  ${status} ${service.name}: ${passed}/${total}`);
  });

  // 显示失败的测试
  const failed = tests.filter(t => t.status === 'failed');
  if (failed.length > 0) {
    console.log('\n失败的测试详情:');
    failed.forEach(t => {
      console.log(`  ❌ ${t.name}: ${t.error}`);
    });
  }

  console.log('');
  process.exit(failedTests > 0 ? 1 : 0);
}

// 运行测试
main().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});

