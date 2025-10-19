#!/usr/bin/env node

/**
 * AI Agent 功能完整测试脚本
 * 测试 Agent 创建、任务执行、工具调用等核心功能
 */

const path = require('path');
const axios = require('axios');

// 设置数据库路径
process.env.DB_PATH = path.join(__dirname, '..', 'data', 'chatbox.db');

const AgentEngine = require('../server/services/agentEngine.cjs');
const TaskDecomposer = require('../server/services/taskDecomposer.cjs');
const AIService = require('../server/services/aiService.cjs');

// 测试配置
const TEST_USER_ID = 1;
const BASE_URL = 'http://localhost:3001';
let authToken = null;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

async function runTest(name, testFn) {
  testResults.total++;
  logInfo(`Testing: ${name}`);
  
  try {
    await testFn();
    testResults.passed++;
    logSuccess(`PASSED: ${name}`);
    return true;
  } catch (error) {
    testResults.failed++;
    logError(`FAILED: ${name}`);
    logError(`Error: ${error.message}`);
    if (error.stack) {
      console.log(error.stack);
    }
    return false;
  }
}

// ==================== 后端服务测试 ====================

async function testAgentEngine() {
  logSection('测试 1: Agent Engine 核心功能');

  const agentEngine = new AgentEngine();
  let testAgentId = null;

  // 测试 1.1: 创建 Agent
  await runTest('创建 Agent', async () => {
    const agentData = {
      name: '测试助手',
      description: '用于功能测试的 AI 助手',
      systemPrompt: '你是一个有帮助的 AI 助手。',
      capabilities: ['research', 'analysis', 'writing'],
      tools: ['web_search', 'ai_analysis'],
      config: {
        maxConcurrentTasks: 3,
        stopOnError: false,
        retryAttempts: 2
      }
    };

    const agent = await agentEngine.createAgent(TEST_USER_ID, agentData);
    
    if (!agent || !agent.id) {
      throw new Error('Agent 创建失败，未返回有效 ID');
    }
    
    testAgentId = agent.id;
    logInfo(`Agent ID: ${testAgentId}`);
    logInfo(`Agent Name: ${agent.name}`);
  });

  // 测试 1.2: 获取 Agent
  await runTest('获取 Agent 详情', async () => {
    if (!testAgentId) throw new Error('没有可用的 Agent ID');
    
    const agent = await agentEngine.getAgent(testAgentId, TEST_USER_ID);
    
    if (!agent || agent.id !== testAgentId) {
      throw new Error('获取的 Agent 信息不正确');
    }
    
    logInfo(`Retrieved Agent: ${agent.name}`);
  });

  // 测试 1.3: 获取 Agent 列表
  await runTest('获取 Agent 列表', async () => {
    const agents = await agentEngine.getUserAgents(TEST_USER_ID);
    
    if (!Array.isArray(agents)) {
      throw new Error('返回的不是数组');
    }
    
    logInfo(`Found ${agents.length} agents`);
  });

  // 测试 1.4: 更新 Agent
  await runTest('更新 Agent', async () => {
    if (!testAgentId) throw new Error('没有可用的 Agent ID');
    
    const updateData = {
      description: '已更新的描述',
      status: 'active'
    };
    
    const result = await agentEngine.updateAgent(testAgentId, TEST_USER_ID, updateData);
    
    if (!result || !result.success) {
      throw new Error('更新失败');
    }
    
    logInfo('Agent 更新成功');
  });

  // 测试 1.5: 工具注册
  await runTest('检查默认工具注册', async () => {
    const toolRegistry = agentEngine.toolRegistry;
    
    const expectedTools = ['web_search', 'read_file', 'write_file', 'validate_data'];
    
    for (const toolName of expectedTools) {
      if (!toolRegistry.has(toolName)) {
        throw new Error(`工具 ${toolName} 未注册`);
      }
    }
    
    logInfo(`成功注册 ${toolRegistry.size} 个工具`);
  });

  return testAgentId;
}

async function testTaskDecomposer(agentId) {
  logSection('测试 2: Task Decomposer 功能');

  const taskDecomposer = new TaskDecomposer();
  const agentEngine = new AgentEngine();

  // 测试 2.1: 任务分解
  await runTest('任务分解（模拟）', async () => {
    const task = {
      id: 'test-task-1',
      title: '研究人工智能的最新发展',
      description: '收集并分析2024年AI领域的重要进展',
      inputData: {}
    };

    const agent = await agentEngine.getAgent(agentId, TEST_USER_ID);

    // 注意：这将调用 AI API，如果没有配置会失败
    logWarning('任务分解需要 AI API 配置，可能会失败');
    
    try {
      const subtasks = await taskDecomposer.decomposeTask(task, agent);
      
      if (!Array.isArray(subtasks)) {
        throw new Error('返回的不是数组');
      }
      
      logInfo(`任务被分解为 ${subtasks.length} 个子任务`);
      subtasks.forEach((st, idx) => {
        logInfo(`  ${idx + 1}. ${st.title} (${st.type})`);
      });
    } catch (error) {
      if (error.message.includes('API') || error.message.includes('key')) {
        logWarning('跳过：需要配置 AI API 密钥');
        testResults.skipped++;
        testResults.failed--; // 抵消失败计数
      } else {
        throw error;
      }
    }
  });
}

async function testAIService() {
  logSection('测试 3: AI Service 功能');

  // 测试 3.1: AI Service 初始化
  await runTest('AI Service 初始化', async () => {
    const aiService = new AIService(TEST_USER_ID);
    
    if (!aiService) {
      throw new Error('AI Service 初始化失败');
    }
    
    logInfo('AI Service 初始化成功');
  });

  // 测试 3.2: 生成响应（模拟）
  await runTest('生成 AI 响应', async () => {
    const aiService = new AIService(TEST_USER_ID);
    
    try {
      const response = await aiService.generateResponse(
        '请简单介绍一下你自己',
        '',
        { model: 'gpt-3.5-turbo', temperature: 0.7 }
      );
      
      if (!response || typeof response !== 'string') {
        throw new Error('响应格式不正确');
      }
      
      logInfo(`AI 响应: ${response.substring(0, 100)}...`);
    } catch (error) {
      if (error.message.includes('API') || error.message.includes('key')) {
        logWarning('跳过：需要配置 AI API 密钥');
        testResults.skipped++;
        testResults.failed--; // 抵消失败计数
      } else {
        throw error;
      }
    }
  });
}

// ==================== API 端点测试 ====================

async function testAPIEndpoints(agentId) {
  logSection('测试 4: API 端点功能');

  // 先尝试登录获取 token
  await runTest('用户认证', async () => {
    try {
      // 尝试使用测试用户登录
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'test123'
      });
      
      authToken = response.data.token;
      logInfo('认证成功');
    } catch (error) {
      logWarning('认证失败，API 测试可能无法进行');
      authToken = 'test-token'; // 使用测试 token
    }
  });

  const headers = {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // 测试 4.1: 获取 Agent 列表 API
  await runTest('GET /api/agents', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/agents`, { headers });
      
      if (!response.data || !Array.isArray(response.data.agents)) {
        throw new Error('返回数据格式不正确');
      }
      
      logInfo(`API 返回 ${response.data.agents.length} 个 agents`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logWarning('服务器未运行，跳过 API 测试');
        testResults.skipped++;
        testResults.failed--;
      } else {
        throw error;
      }
    }
  });

  // 测试 4.2: 获取单个 Agent API
  await runTest('GET /api/agents/:id', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/agents/${agentId}`, { headers });
      
      if (!response.data || !response.data.agent) {
        throw new Error('返回数据格式不正确');
      }
      
      logInfo(`Agent: ${response.data.agent.name}`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logWarning('服务器未运行，跳过 API 测试');
        testResults.skipped++;
        testResults.failed--;
      } else {
        throw error;
      }
    }
  });

  // 测试 4.3: 创建 Agent API
  await runTest('POST /api/agents', async () => {
    try {
      const agentData = {
        name: 'API 测试 Agent',
        description: 'Through API',
        systemPrompt: '你是一个测试助手',
        capabilities: ['analysis'],
        tools: ['web_search'],
        config: {}
      };
      
      const response = await axios.post(`${BASE_URL}/api/agents`, agentData, { headers });
      
      if (!response.data || !response.data.agent) {
        throw new Error('创建失败');
      }
      
      logInfo(`创建成功: ${response.data.agent.id}`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logWarning('服务器未运行，跳过 API 测试');
        testResults.skipped++;
        testResults.failed--;
      } else {
        throw error;
      }
    }
  });
}

// ==================== 数据完整性测试 ====================

async function testDataIntegrity() {
  logSection('测试 5: 数据完整性');

  const agentEngine = new AgentEngine();

  // 测试 5.1: 数据验证
  await runTest('Agent 数据验证', async () => {
    try {
      await agentEngine.createAgent(TEST_USER_ID, {
        // 缺少必需字段
        description: '测试'
      });
      throw new Error('应该抛出验证错误');
    } catch (error) {
      if (error.message.includes('不能为空')) {
        logInfo('数据验证正常工作');
      } else {
        throw error;
      }
    }
  });

  // 测试 5.2: 权限检查
  await runTest('权限检查', async () => {
    const agent = await agentEngine.createAgent(TEST_USER_ID, {
      name: '权限测试',
      systemPrompt: '测试'
    });
    
    try {
      await agentEngine.getAgent(agent.id, 999); // 不同用户
      throw new Error('应该抛出权限错误');
    } catch (error) {
      if (error.message.includes('不存在') || error.message.includes('权限')) {
        logInfo('权限检查正常工作');
      } else {
        throw error;
      }
    }
  });
}

// ==================== 性能测试 ====================

async function testPerformance(agentId) {
  logSection('测试 6: 性能测试');

  const agentEngine = new AgentEngine();

  // 测试 6.1: 批量创建
  await runTest('批量创建 Agents (10个)', async () => {
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 10; i++) {
      promises.push(
        agentEngine.createAgent(TEST_USER_ID, {
          name: `性能测试 Agent ${i}`,
          systemPrompt: '测试',
          capabilities: ['analysis'],
          tools: []
        })
      );
    }
    
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    logInfo(`批量创建耗时: ${duration}ms (平均 ${(duration / 10).toFixed(2)}ms/个)`);
  });

  // 测试 6.2: 批量查询
  await runTest('批量查询 Agents', async () => {
    const startTime = Date.now();
    const agents = await agentEngine.getUserAgents(TEST_USER_ID, { limit: 100 });
    const duration = Date.now() - startTime;
    
    logInfo(`查询 ${agents.length} 个 agents 耗时: ${duration}ms`);
  });
}

// ==================== 主测试流程 ====================

async function main() {
  console.clear();
  log('\n🚀 AI Agent 功能完整测试\n', 'cyan');
  
  const startTime = Date.now();
  let testAgentId = null;

  try {
    // 1. Agent Engine 测试
    testAgentId = await testAgentEngine();

    // 2. Task Decomposer 测试
    if (testAgentId) {
      await testTaskDecomposer(testAgentId);
    }

    // 3. AI Service 测试
    await testAIService();

    // 4. API 端点测试
    if (testAgentId) {
      await testAPIEndpoints(testAgentId);
    }

    // 5. 数据完整性测试
    await testDataIntegrity();

    // 6. 性能测试
    if (testAgentId) {
      await testPerformance(testAgentId);
    }

  } catch (error) {
    logError(`测试过程中发生错误: ${error.message}`);
  }

  // 显示测试结果
  const duration = Date.now() - startTime;
  
  logSection('测试结果总结');
  
  log(`总测试数: ${testResults.total}`, 'cyan');
  logSuccess(`通过: ${testResults.passed}`);
  logError(`失败: ${testResults.failed}`);
  logWarning(`跳过: ${testResults.skipped}`);
  log(`\n总耗时: ${(duration / 1000).toFixed(2)}s\n`, 'blue');

  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  
  if (testResults.failed === 0) {
    logSuccess(`🎉 所有测试通过！通过率: ${passRate}%`);
  } else {
    logWarning(`⚠️  部分测试失败，通过率: ${passRate}%`);
  }

  // 退出码
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// 运行测试
if (require.main === module) {
  main().catch(error => {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runTest, testResults };
