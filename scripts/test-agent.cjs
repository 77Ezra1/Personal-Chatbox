#!/usr/bin/env node

/**
 * Agent 功能测试脚本
 * 演示如何直接使用 Agent 引擎
 */

const path = require('path');
const AgentEngine = require('../server/services/agentEngine.cjs');

// 设置数据库路径
process.env.DB_PATH = path.join(__dirname, '..', 'data', 'chatbox.db');

async function testAgent() {
  console.log('🚀 开始测试 AI Agent 功能\n');

  const agentEngine = new AgentEngine();

  try {
    // 1. 创建测试 Agent
    console.log('📝 步骤 1: 创建 Agent');
    const agent = await agentEngine.createAgent(1, {
      name: '测试助手',
      description: '用于测试的 AI 助手',
      systemPrompt: '你是一个有帮助的 AI 助手，请协助完成用户的任务。',
      capabilities: ['research', 'analysis', 'writing'],
      tools: ['web_search', 'ai_analysis', 'write_file'],
      config: {
        maxConcurrentTasks: 3,
        stopOnError: false,
        retryAttempts: 2
      }
    });

    console.log(`✅ Agent 创建成功: ${agent.name} (ID: ${agent.id})\n`);

    // 2. 获取 Agent 列表
    console.log('📋 步骤 2: 获取 Agent 列表');
    const agents = await agentEngine.getUserAgents(1);
    console.log(`✅ 找到 ${agents.length} 个 Agent:\n`);
    agents.forEach(a => {
      console.log(`  - ${a.name}: ${a.description}`);
      console.log(`    能力: ${a.capabilities.join(', ')}`);
      console.log(`    工具: ${a.tools.join(', ')}`);
      console.log(`    状态: ${a.status}\n`);
    });

    // 3. 执行任务（模拟）
    console.log('🎯 步骤 3: 准备执行任务');
    console.log('注意: 实际执行任务需要配置有效的 AI API 密钥\n');

    const taskData = {
      title: '测试任务：分析 AI 发展趋势',
      description: '研究并总结人工智能在2024年的主要发展方向',
      inputData: {
        topic: 'AI trends 2024',
        depth: 'overview'
      }
    };

    console.log('📦 任务信息:');
    console.log(`  标题: ${taskData.title}`);
    console.log(`  描述: ${taskData.description}`);
    console.log(`  输入数据: ${JSON.stringify(taskData.inputData)}\n`);

    // 如果设置了 API 密钥，可以尝试执行
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'test-key') {
      console.log('⚡ 开始执行任务...\n');

      try {
        const result = await agentEngine.executeTask(agent.id, taskData, 1);
        console.log('✅ 任务执行成功!\n');
        console.log('📊 执行结果:');
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error('❌ 任务执行失败:', error.message);
      }
    } else {
      console.log('⚠️  未配置 OPENAI_API_KEY，跳过实际执行');
      console.log('提示: 在 .env 文件中设置 OPENAI_API_KEY 以启用完整功能\n');
    }

    // 4. 获取 Agent 统计信息
    console.log('📊 步骤 4: 获取统计信息');
    const { db } = require('../server/db/init.cjs');

    const stats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_tasks
         FROM agent_tasks WHERE agent_id = ?`,
        [agent.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    console.log('✅ 统计数据:');
    console.log(`  总任务数: ${stats.total_tasks}`);
    console.log(`  已完成: ${stats.completed_tasks}`);
    console.log(`  失败: ${stats.failed_tasks}\n`);

    // 5. 清理测试数据（可选）
    if (process.argv.includes('--cleanup')) {
      console.log('🧹 清理测试数据');
      await agentEngine.deleteAgent(agent.id, 1);
      console.log('✅ 测试 Agent 已删除\n');
    } else {
      console.log('💡 提示: 使用 --cleanup 参数自动清理测试数据\n');
    }

    console.log('✨ 测试完成!\n');
    console.log('📚 查看完整文档: docs/AI_AGENT_GUIDE.md');
    console.log('🌐 访问前端界面: http://localhost:5177/agents\n');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }

  process.exit(0);
}

// 运行测试
testAgent();
