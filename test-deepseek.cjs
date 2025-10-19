#!/usr/bin/env node

/**
 * DeepSeek 对话功能测试脚本
 * 直接调用后端 API 测试 DeepSeek 对话功能
 */

const http = require('http');

const DEEPSEEK_CONFIG = {
  apiKey: 'sk-03db8009812649359e2f83cc738861aa',
  model: 'deepseek-chat',
  baseURL: 'https://api.deepseek.com'
};

const TEST_MESSAGE = '你好！请介绍一下你自己，并告诉我今天的日期。';

console.log('🚀 DeepSeek 对话功能测试');
console.log('='.repeat(60));
console.log('配置信息：');
console.log(`  模型: ${DEEPSEEK_CONFIG.model}`);
console.log(`  API Key: ${DEEPSEEK_CONFIG.apiKey.substring(0, 20)}...`);
console.log(`  测试消息: ${TEST_MESSAGE}`);
console.log('='.repeat(60));

// 测试对话功能
async function testChat() {
  console.log('\n📤 发送测试消息...');

  const postData = JSON.stringify({
    messages: [
      {
        role: 'user',
        content: TEST_MESSAGE
      }
    ],
    model: DEEPSEEK_CONFIG.model,
    stream: false
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      console.log(`📊 响应状态: ${res.statusCode}`);

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          console.error('❌ 解析响应失败:', error.message);
          console.log('原始响应:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 请求失败:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 运行测试
async function runTest() {
  try {
    console.log('\n⏳ 测试开始...\n');

    const response = await testChat();

    console.log('\n✅ 测试成功！');
    console.log('='.repeat(60));
    
    if (response.choices && response.choices[0]) {
      const aiMessage = response.choices[0].message;
      console.log('\n🤖 AI 回复:');
      console.log('-'.repeat(60));
      console.log(aiMessage.content);
      console.log('-'.repeat(60));
      
      // 显示其他信息
      if (response.usage) {
        console.log('\n📊 使用统计:');
        console.log(`  Prompt Tokens: ${response.usage.prompt_tokens}`);
        console.log(`  Completion Tokens: ${response.usage.completion_tokens}`);
        console.log(`  Total Tokens: ${response.usage.total_tokens}`);
      }
      
      if (response.model) {
        console.log(`\n🎯 使用模型: ${response.model}`);
      }
    } else if (response.error) {
      console.log('\n❌ API 返回错误:');
      console.log(response.error);
    } else {
      console.log('\n📦 完整响应:');
      console.log(JSON.stringify(response, null, 2));
    }

    console.log('\n='.repeat(60));
    console.log('✨ 测试完成！DeepSeek 对话功能正常工作。');
    
  } catch (error) {
    console.log('\n='.repeat(60));
    console.log('❌ 测试失败！');
    console.log('错误信息:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示: 请确保后端服务正在运行（端口 3001）');
      console.log('   运行: node server/index.cjs');
    }
    
    process.exit(1);
  }
}

// 启动测试
runTest();
