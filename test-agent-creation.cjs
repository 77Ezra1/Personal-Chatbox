#!/usr/bin/env node

/**
 * Agent 创建和实际测试脚本
 * 1. 在数据库中创建一个 DeepSeek Agent
 * 2. 执行简单任务测试
 * 3. 执行复杂任务测试
 */

const Database = require('better-sqlite3');
const path = require('path');
const axios = require('axios');

// 数据库路径
const DB_PATH = path.join(__dirname, 'data', 'app.db');

// DeepSeek 配置
const DEEPSEEK_CONFIG = {
  apiKey: 'sk-03db8009812649359e2f83cc738861aa',
  apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat'
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 创建 DeepSeek Agent
 */
function createDeepSeekAgent() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('1️⃣  创建 DeepSeek Agent', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  const db = new Database(DB_PATH);
  
  try {
    // 检查是否已存在同名 Agent
    const existing = db.prepare('SELECT id FROM agents WHERE name = ?').get('DeepSeek 智能助手');
    
    if (existing) {
      log(`\n   ⚠️  Agent 已存在 (ID: ${existing.id})，将先删除旧的`, 'yellow');
      db.prepare('DELETE FROM agents WHERE id = ?').run(existing.id);
    }

    // 创建新的 Agent
    const agentData = {
      user_id: 5, // 假设测试用户 ID 为 5
      name: 'DeepSeek 智能助手',
      description: '基于 DeepSeek-Chat 模型的 AI 助手，擅长任务分解、数据分析和智能对话',
      model_id: 'deepseek',
      model_name: 'deepseek-chat',
      system_prompt: `你是一个专业的 AI 助手，具备以下能力：
1. 任务分解：将复杂任务拆解为可执行的步骤
2. 数据分析：分析信息并给出结构化的结果
3. 智能对话：自然流畅的对话交互
4. 工具调用：根据需要调用合适的工具

请始终保持专业、友好、高效的风格。`,
      temperature: 0.7,
      max_tokens: 1000,
      stream: 1,
      use_mcp: 0,
      enabled_tools: JSON.stringify(['ai_analysis', 'web_search', 'data_query']),
      status: 'active',
      capabilities: JSON.stringify(['chat', 'analysis', 'task_execution', 'tool_calling']),
      tools: JSON.stringify(['ai_analysis', 'web_search']),
      config: JSON.stringify({
        apiKey: DEEPSEEK_CONFIG.apiKey,
        apiUrl: DEEPSEEK_CONFIG.apiUrl,
        maxConcurrentTasks: 3,
        retryAttempts: 2,
        timeout: 30000
      }),
      is_active: 1,
      execution_count: 0
    };

    const stmt = db.prepare(`
      INSERT INTO agents (
        user_id, name, description, model_id, model_name, system_prompt,
        temperature, max_tokens, stream, use_mcp, enabled_tools,
        status, capabilities, tools, config, is_active, execution_count
      ) VALUES (
        @user_id, @name, @description, @model_id, @model_name, @system_prompt,
        @temperature, @max_tokens, @stream, @use_mcp, @enabled_tools,
        @status, @capabilities, @tools, @config, @is_active, @execution_count
      )
    `);

    const result = stmt.run(agentData);
    const agentId = result.lastInsertRowid;

    log(`\n   ✅ Agent 创建成功！`, 'green');
    log(`   📋 Agent ID: ${agentId}`, 'blue');
    log(`   📝 名称: ${agentData.name}`, 'blue');
    log(`   🤖 模型: ${agentData.model_name}`, 'blue');
    log(`   🛠️  工具: ${agentData.tools}`, 'blue');

    db.close();
    return agentId;
  } catch (error) {
    log(`\n   ❌ 创建失败: ${error.message}`, 'red');
    console.error(error);
    db.close();
    return null;
  }
}

/**
 * 调用 DeepSeek API
 */
async function callDeepSeekAPI(messages, taskName = '') {
  try {
    const startTime = Date.now();
    
    const response = await axios.post(
      DEEPSEEK_CONFIG.apiUrl,
      {
        model: DEEPSEEK_CONFIG.model,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const duration = Date.now() - startTime;
    const reply = response.data.choices[0].message.content;
    const tokens = response.data.usage?.total_tokens || 0;

    return {
      success: true,
      reply,
      tokens,
      duration,
      taskName
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      taskName
    };
  }
}

/**
 * 测试简单任务
 */
async function testSimpleTask(agentId) {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('2️⃣  简单任务测试', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  const tasks = [
    {
      name: '自我介绍',
      messages: [
        { role: 'user', content: '请简单介绍一下你自己，包括你的能力' }
      ]
    },
    {
      name: '简单计算',
      messages: [
        { role: 'user', content: '计算 123 + 456 等于多少？并解释计算过程' }
      ]
    }
  ];

  const results = [];

  for (const task of tasks) {
    log(`\n   🔹 测试: ${task.name}`, 'blue');
    const result = await callDeepSeekAPI(task.messages, task.name);
    
    if (result.success) {
      log(`   ✅ 成功 (${result.duration}ms, ${result.tokens} tokens)`, 'green');
      log(`   📝 回复: ${result.reply.substring(0, 150)}...`, 'green');
      results.push(result);
      
      // 更新执行计数
      updateExecutionCount(agentId);
    } else {
      log(`   ❌ 失败: ${result.error}`, 'red');
    }
  }

  return results;
}

/**
 * 测试复杂任务
 */
async function testComplexTask(agentId) {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('3️⃣  复杂任务测试', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  const tasks = [
    {
      name: '任务分解',
      messages: [
        {
          role: 'system',
          content: '你是一个任务分解专家，请将复杂任务拆解为具体的执行步骤。'
        },
        {
          role: 'user',
          content: '任务：学习 React 框架。请将这个任务分解为 5 个具体的学习步骤。'
        }
      ]
    },
    {
      name: 'AI 分析',
      messages: [
        {
          role: 'system',
          content: '你是一个数据分析专家，擅长从文本中提取关键信息并进行分析。'
        },
        {
          role: 'user',
          content: '分析以下技术趋势：人工智能、云计算、边缘计算。列出它们的主要应用场景和发展方向。'
        }
      ]
    },
    {
      name: '多轮对话',
      messages: [
        {
          role: 'user',
          content: '我想学习编程，你有什么建议？'
        },
        {
          role: 'assistant',
          content: '学习编程是个很好的决定！我建议从 Python 开始，因为它语法简单、应用广泛。'
        },
        {
          role: 'user',
          content: '那我应该如何开始学习 Python 呢？给我一个具体的学习计划。'
        }
      ]
    }
  ];

  const results = [];

  for (const task of tasks) {
    log(`\n   🔹 测试: ${task.name}`, 'blue');
    const result = await callDeepSeekAPI(task.messages, task.name);
    
    if (result.success) {
      log(`   ✅ 成功 (${result.duration}ms, ${result.tokens} tokens)`, 'green');
      log(`   📝 回复预览:`, 'green');
      
      // 显示前 300 字符
      const preview = result.reply.substring(0, 300);
      console.log(`${colors.green}${preview}...${colors.reset}\n`);
      
      results.push(result);
      
      // 更新执行计数
      updateExecutionCount(agentId);
    } else {
      log(`   ❌ 失败: ${result.error}`, 'red');
    }
  }

  return results;
}

/**
 * 更新 Agent 执行计数
 */
function updateExecutionCount(agentId) {
  const db = new Database(DB_PATH);
  try {
    db.prepare(`
      UPDATE agents 
      SET execution_count = execution_count + 1,
          last_executed_at = datetime('now')
      WHERE id = ?
    `).run(agentId);
  } catch (error) {
    // 静默失败
  } finally {
    db.close();
  }
}

/**
 * 生成测试报告
 */
function generateReport(agentId, simpleResults, complexResults) {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('4️⃣  测试报告', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  const allResults = [...simpleResults, ...complexResults];
  const successCount = allResults.filter(r => r.success).length;
  const totalCount = allResults.length;
  const avgDuration = allResults.reduce((sum, r) => sum + (r.duration || 0), 0) / successCount;
  const totalTokens = allResults.reduce((sum, r) => sum + (r.tokens || 0), 0);

  log(`\n   📊 统计数据:`, 'blue');
  log(`   ├─ 总任务数: ${totalCount}`, 'blue');
  log(`   ├─ 成功任务: ${successCount}`, 'green');
  log(`   ├─ 失败任务: ${totalCount - successCount}`, successCount === totalCount ? 'blue' : 'red');
  log(`   ├─ 成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`, 'green');
  log(`   ├─ 平均响应时间: ${avgDuration.toFixed(0)}ms`, 'blue');
  log(`   └─ 总 Token 消耗: ${totalTokens}`, 'blue');

  log(`\n   📝 任务详情:`, 'blue');
  allResults.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`   ${status} ${result.taskName}: ${result.duration}ms, ${result.tokens} tokens`, color);
  });

  // 查询 Agent 最新状态
  const db = new Database(DB_PATH);
  const agent = db.prepare('SELECT execution_count, last_executed_at FROM agents WHERE id = ?').get(agentId);
  db.close();

  log(`\n   🤖 Agent 状态:`, 'blue');
  log(`   ├─ Agent ID: ${agentId}`, 'blue');
  log(`   ├─ 执行次数: ${agent.execution_count}`, 'blue');
  log(`   └─ 最后执行: ${agent.last_executed_at}`, 'blue');

  // 保存报告到文件
  const fs = require('fs');
  const report = {
    timestamp: new Date().toISOString(),
    agentId,
    statistics: {
      totalTasks: totalCount,
      successTasks: successCount,
      failedTasks: totalCount - successCount,
      successRate: ((successCount / totalCount) * 100).toFixed(1) + '%',
      avgDuration: avgDuration.toFixed(0) + 'ms',
      totalTokens
    },
    tasks: allResults,
    agentStatus: agent
  };

  fs.writeFileSync('AGENT_TEST_REPORT.json', JSON.stringify(report, null, 2));
  log(`\n   💾 详细报告已保存到: AGENT_TEST_REPORT.json`, 'magenta');
}

/**
 * 主测试流程
 */
async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🚀 DeepSeek Agent 创建和测试', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\n📅 测试时间: ${new Date().toLocaleString('zh-CN')}`, 'blue');

  // 1. 创建 Agent
  const agentId = createDeepSeekAgent();
  if (!agentId) {
    log('\n❌ Agent 创建失败，测试终止', 'red');
    process.exit(1);
  }

  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. 简单任务测试
  const simpleResults = await testSimpleTask(agentId);

  // 3. 复杂任务测试
  const complexResults = await testComplexTask(agentId);

  // 4. 生成报告
  generateReport(agentId, simpleResults, complexResults);

  log('\n' + '='.repeat(60), 'cyan');
  log('✨ 测试完成！', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
}

// 运行测试
main().catch(error => {
  log(`\n❌ 测试过程发生错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
