/**
 * 第二批 MCP 服务测试脚本
 * 测试 Brave Search 和 GitHub 服务
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
  process.stdout.write(`测试: ${name} ... `);
  try {
    await testFn();
    console.log('✅ 通过');
    passedTests++;
    tests.push({ name, status: 'passed' });
  } catch (error) {
    console.log(`❌ 失败: ${error.message}`);
    failedTests++;
    tests.push({ name, status: 'failed', error: error.message });
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('========================================');
  console.log('第二批 MCP 服务测试');
  console.log('========================================\n');

  // ========== Brave Search 测试 ==========
  console.log('📊 Brave Search 服务测试\n');

  await runTest('Brave Search - 网页搜索', async () => {
    const result = await callTool('brave_search_brave_web_search', {
      query: 'OpenAI GPT-4',
      count: 3
    });
    
    if (!result.success) {
      throw new Error(result.error || '搜索失败');
    }
    
    console.log(`\n  找到 ${result.result?.web?.results?.length || 0} 个结果`);
  });

  await runTest('Brave Search - 新闻搜索', async () => {
    const result = await callTool('brave_search_brave_news_search', {
      query: 'AI technology',
      count: 3
    });
    
    if (!result.success) {
      throw new Error(result.error || '搜索失败');
    }
    
    console.log(`\n  找到 ${result.result?.news?.results?.length || 0} 条新闻`);
  });

  // ========== GitHub 测试 ==========
  console.log('\n📊 GitHub 服务测试\n');

  await runTest('GitHub - 搜索仓库', async () => {
    const result = await callTool('github_search_repositories', {
      query: 'mcp server',
      per_page: 3
    });
    
    if (!result.success) {
      throw new Error(result.error || '搜索失败');
    }
    
    const repos = result.result?.items || [];
    console.log(`\n  找到 ${repos.length} 个仓库`);
    if (repos.length > 0) {
      console.log(`  第一个: ${repos[0].full_name}`);
    }
  });

  await runTest('GitHub - 搜索代码', async () => {
    const result = await callTool('github_search_code', {
      q: 'MCP server language:JavaScript',
      per_page: 3
    });
    
    if (!result.success) {
      throw new Error(result.error || '搜索失败');
    }
    
    const items = result.result?.items || [];
    console.log(`\n  找到 ${items.length} 个代码文件`);
  });

  await runTest('GitHub - 搜索用户', async () => {
    const result = await callTool('github_search_users', {
      q: 'modelcontextprotocol',
      per_page: 3
    });
    
    if (!result.success) {
      throw new Error(result.error || '搜索失败');
    }
    
    const users = result.result?.items || [];
    console.log(`\n  找到 ${users.length} 个用户`);
  });

  await runTest('GitHub - 获取文件内容', async () => {
    const result = await callTool('github_get_file_contents', {
      owner: '77Ezra1',
      repo: 'AI-Life-system',
      path: 'README.md'
    });
    
    if (!result.success) {
      throw new Error(result.error || '获取文件失败');
    }
    
    const content = result.result?.content || '';
    console.log(`\n  文件大小: ${content.length} 字符`);
  });

  // ========== 测试总结 ==========
  console.log('\n========================================');
  console.log('测试总结');
  console.log('========================================');
  console.log(`总计: ${tests.length} 个测试`);
  console.log(`✅ 通过: ${passedTests} 个`);
  console.log(`❌ 失败: ${failedTests} 个`);
  console.log(`成功率: ${((passedTests / tests.length) * 100).toFixed(2)}%`);
  console.log('========================================\n');

  // 显示失败的测试
  const failed = tests.filter(t => t.status === 'failed');
  if (failed.length > 0) {
    console.log('失败的测试:');
    failed.forEach(t => {
      console.log(`  ❌ ${t.name}: ${t.error}`);
    });
    console.log('');
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

// 运行测试
main().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});

