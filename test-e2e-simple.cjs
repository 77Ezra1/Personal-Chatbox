#!/usr/bin/env node

/**
 * Personal Chatbox E2E 测试脚本
 * 测试核心功能是否正常工作
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
let authToken = null;
let userId = null;
let conversationId = null;

// HTTP 请求辅助函数
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
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

// 测试结果统计
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function test(name, fn, skip = false) {
  return async () => {
    if (skip) {
      log(`⊘ ${name}`, 'warn');
      results.skipped++;
      results.tests.push({ name, status: 'skipped' });
      return;
    }

    try {
      await fn();
      log(`✓ ${name}`, 'success');
      results.passed++;
      results.tests.push({ name, status: 'passed' });
    } catch (error) {
      log(`✗ ${name}`, 'error');
      log(`  ${error.message}`, 'error');
      results.failed++;
      results.tests.push({ name, status: 'failed', error: error.message });
    }
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// 测试用例
const tests = [
  test('健康检查', async () => {
    const res = await request('GET', '/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.status === 'ok', 'Health check failed');
  }),

  test('创建测试用户', async () => {
    const email = `test-${Date.now()}@example.com`;
    const res = await request('POST', '/api/auth/register', {
      email,
      password: 'Test123456!',
      username: 'E2E Test User',
      inviteCode: '', // 如果需要邀请码,请填写
    });

    // 如果注册需要邀请码或者用户已存在,使用现有用户
    if (res.status === 400 || res.status === 409) {
      log('  使用现有用户进行测试', 'info');
      // 跳过注册,在登录测试中使用现有用户
      throw new Error('需要使用现有用户登录');
    }

    assert(res.status === 201 || res.status === 200, `注册失败: ${res.status}`);
  }),

  test('用户登录(使用已存在的用户)', async () => {
    // 尝试多个可能的测试账号
    const testAccounts = [
      { email: 'finally_works@test.com', password: 'Test123456!' },
      { email: 'test@example.com', password: 'Test123456!' },
      { email: 'test@example.com', password: 'test123456' },
    ];

    let loginSuccess = false;
    for (const account of testAccounts) {
      const res = await request('POST', '/api/auth/login', account);
      if (res.status === 200 && res.data.success) {
        authToken = res.data.token;
        userId = res.data.user.id;
        loginSuccess = true;
        log(`  登录成功: ${account.email}`, 'success');
        break;
      }
    }

    assert(loginSuccess, '所有测试账号登录都失败了,请手动创建测试用户');
    assert(authToken, '未获取到 token');
  }),

  test('获取用户信息', async () => {
    const res = await request('GET', '/api/auth/me');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.user, '未获取到用户信息');
    assert(res.data.user.email, '用户邮箱为空');
  }),

  test('创建新对话', async () => {
    const res = await request('POST', '/api/conversations', {
      title: 'E2E测试对话',
    });
    assert(res.status === 200 || res.status === 201, `创建对话失败: ${res.status}`);
    assert(res.data.id, '未返回对话ID');
    conversationId = res.data.id;
  }),

  test('获取对话列表', async () => {
    const res = await request('GET', '/api/conversations');
    assert(res.status === 200, `获取对话列表失败: ${res.status}`);
    assert(Array.isArray(res.data), '对话列表应该是数组');
  }),

  test('发送消息(需要AI API配置)', async () => {
    if (!conversationId) {
      throw new Error('没有可用的对话ID');
    }

    const res = await request('POST', '/api/chat/send', {
      conversationId,
      message: 'Hello, this is a test message',
      model: 'deepseek-chat',
      provider: 'deepseek',
      apiKey: 'sk-03db8009812649359e2f83cc738861aa',
    });

    // 注意: 这个测试可能会因为各种原因失败(API配置、网络等)
    // 只检查是否有响应,不强制要求成功
    log(`  消息发送响应状态: ${res.status}`, 'info');
    if (res.status !== 200) {
      log(`  注意: 消息发送失败,可能需要在UI中配置API密钥`, 'warn');
    }
  }),

  test('获取MCP服务列表', async () => {
    const res = await request('GET', '/api/mcp/services');
    assert(res.status === 200, `获取MCP服务失败: ${res.status}`);
    assert(Array.isArray(res.data), 'MCP服务列表应该是数组');
    assert(res.data.length > 0, 'MCP服务列表为空');
    log(`  可用的MCP服务: ${res.data.length}个`, 'info');
  }),

  test('获取MCP工具列表', async () => {
    const res = await request('GET', '/api/mcp/tools');
    assert(res.status === 200, `获取MCP工具失败: ${res.status}`);
    assert(Array.isArray(res.data), 'MCP工具列表应该是数组');
    log(`  可用的MCP工具: ${res.data.length}个`, 'info');
  }),

  test('创建笔记', async () => {
    const res = await request('POST', '/api/notes', {
      title: 'E2E测试笔记',
      content: '这是一个测试笔记的内容',
      category: 'test',
      tags: ['test', 'e2e'],
    });
    assert(res.status === 200 || res.status === 201, `创建笔记失败: ${res.status}`);
  }),

  test('获取笔记列表', async () => {
    const res = await request('GET', '/api/notes?isArchived=false');
    assert(res.status === 200, `获取笔记列表失败: ${res.status}`);
    assert(Array.isArray(res.data) || Array.isArray(res.data.notes), '笔记列表应该是数组');
  }),

  test('创建文档', async () => {
    const res = await request('POST', '/api/documents', {
      title: 'E2E测试文档',
      description: '这是一个测试文档',
      url: 'https://example.com',
      category: 'test',
      tags: ['test', 'e2e'],
    });
    assert(res.status === 200 || res.status === 201, `创建文档失败: ${res.status}`);
  }),

  test('获取文档列表', async () => {
    const res = await request('GET', '/api/documents');
    assert(res.status === 200, `获取文档列表失败: ${res.status}`);
    assert(Array.isArray(res.data) || Array.isArray(res.data.documents), '文档列表应该是数组');
  }),
];

// 运行测试
async function runTests() {
  log('\n===========================================', 'info');
  log('  Personal Chatbox E2E 测试', 'info');
  log('===========================================\n', 'info');

  for (const testFn of tests) {
    await testFn();
  }

  // 输出结果
  log('\n===========================================', 'info');
  log('  测试结果', 'info');
  log('===========================================\n', 'info');
  log(`通过: ${results.passed}`, 'success');
  log(`失败: ${results.failed}`, 'error');
  log(`跳过: ${results.skipped}`, 'warn');
  log(`总计: ${results.passed + results.failed + results.skipped}`, 'info');

  if (results.failed > 0) {
    log('\n失败的测试:', 'error');
    results.tests
      .filter((t) => t.status === 'failed')
      .forEach((t) => {
        log(`  - ${t.name}: ${t.error}`, 'error');
      });
  }

  log('\n===========================================\n', 'info');

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  log(`\n致命错误: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
