#!/usr/bin/env node

/**
 * DeepSeek API 和 AI Agent 完整测试脚本
 * 测试两个模型：deepseek-chat 和 deepseek-reasoner
 */

const AgentEngine = require('./server/services/agentEngine.cjs');
const axios = require('axios');

// DeepSeek API 配置
const DEEPSEEK_API_KEY = 'sk-03db8009812649359e2f83cc738861aa';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 测试数据
const TEST_MODELS = ['deepseek-chat', 'deepseek-reasoner'];

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

/**
 * 测试 DeepSeek API 连接
 */
async function testDeepSeekAPI(model) {
  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`�� 测试模型: ${model}`, 'cyan');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');

  try {
    log(`\n1️⃣  测试 API 连接...`, 'blue');
    
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: '请用一句话介绍你自己'
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (response.data && response.data.choices && response.data.choices[0]) {
      const reply = response.data.choices[0].message.content;
      log(`   ✅ API 连接成功！`, 'green');
      log(`   📝 回复: ${reply}`, 'green');
      log(`   💰 Token 使用: ${response.data.usage?.total_tokens || 'N/A'}`, 'blue');
      return { success: true, model, response: reply };
    } else {
      log(`   ❌ API 响应格式异常`, 'red');
      return { success: false, model, error: 'Invalid response format' };
    }
  } catch (error) {
    log(`   ❌ API 连接失败: ${error.message}`, 'red');
    if (error.response) {
      log(`   📄 状态码: ${error.response.status}`, 'red');
      log(`   📄 错误详情: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return { success: false, model, error: error.message };
  }
}

/**
 * 测试 AI 分析能力
 */
async function testAIAnalysis(model) {
  log(`\n2️⃣  测试 AI 分析能力...`, 'blue');
  
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的数据分析助手，擅长分析问题并给出结构化的答案。'
          },
          {
            role: 'user',
            content: '分析以下任务：研究人工智能在医疗领域的应用，列出3个关键突破。'
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const reply = response.data.choices[0].message.content;
    log(`   ✅ AI 分析成功！`, 'green');
    log(`   📝 分析结果:`, 'green');
    log(`${reply.substring(0, 300)}...`, 'green');
    return { success: true, model, analysis: reply };
  } catch (error) {
    log(`   ❌ AI 分析失败: ${error.message}`, 'red');
    return { success: false, model, error: error.message };
  }
}

/**
 * 主测试流程
 */
async function main() {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🚀 DeepSeek API 完整测试`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
  log(`\n📅 测试时间: ${new Date().toLocaleString('zh-CN')}`, 'blue');
  log(`🔑 API Key: ${DEEPSEEK_API_KEY.substring(0, 20)}...`, 'blue');
  log(`🤖 测试模型: ${TEST_MODELS.join(', ')}`, 'blue');

  const results = {
    apiTests: [],
    analysisTests: []
  };

  // 测试每个模型
  for (const model of TEST_MODELS) {
    // 1. API 连接测试
    const apiResult = await testDeepSeekAPI(model);
    results.apiTests.push(apiResult);

    if (apiResult.success) {
      // 2. AI 分析测试
      const analysisResult = await testAIAnalysis(model);
      results.analysisTests.push(analysisResult);
    } else {
      log(`\n   ⚠️  跳过 ${model} 的后续测试（API 连接失败）`, 'yellow');
    }

    // 模型之间添加分隔
    if (model !== TEST_MODELS[TEST_MODELS.length - 1]) {
      log(`\n${'─'.repeat(60)}`, 'cyan');
    }
  }

  // 生成测试报告
  log(`\n\n${'='.repeat(60)}`, 'cyan');
  log(`📊 测试结果总结`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');

  log(`\n1️⃣  API 连接测试:`, 'blue');
  results.apiTests.forEach(r => {
    const status = r.success ? '✅' : '❌';
    log(`   ${status} ${r.model}: ${r.success ? '成功' : r.error}`, r.success ? 'green' : 'red');
  });

  log(`\n2️⃣  AI 分析测试:`, 'blue');
  results.analysisTests.forEach(r => {
    const status = r.success ? '✅' : '❌';
    log(`   ${status} ${r.model}: ${r.success ? '成功' : r.error}`, r.success ? 'green' : 'red');
  });

  // 推荐
  log(`\n\n💡 推荐使用:`, 'yellow');
  const successfulModels = results.analysisTests.filter(r => r.success);
  if (successfulModels.length > 0) {
    const allSuccessful = successfulModels.map(r => r.model);
    log(`   ✅ 可用模型: ${allSuccessful.join(', ')}`, 'green');
  } else {
    log(`   ⚠️  所有模型测试都失败了`, 'red');
  }

  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`✨ 测试完成！`, 'cyan');
  log(`${'='.repeat(60)}\n`, 'cyan');

  // 保存结果到文件
  const fs = require('fs');
  const reportPath = 'DEEPSEEK_TEST_REPORT.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    apiKey: DEEPSEEK_API_KEY.substring(0, 20) + '...',
    models: TEST_MODELS,
    results
  }, null, 2));
  
  log(`📄 详细报告已保存到: ${reportPath}\n`, 'blue');
}

// 运行测试
main().catch(error => {
  log(`\n❌ 测试过程发生错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
