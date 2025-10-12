/**
 * Git 和 Wikipedia MCP 服务测试脚本
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/mcp';

// 测试用例
const tests = [
  // Git 服务测试
  {
    name: 'Git - 查看仓库状态',
    tool: 'git_git_status',
    params: {
      repo_path: '/home/ubuntu/AI-Life-system'
    }
  },
  {
    name: 'Git - 查看分支列表',
    tool: 'git_git_branch',
    params: {
      repo_path: '/home/ubuntu/AI-Life-system'
    }
  },
  {
    name: 'Git - 查看提交日志',
    tool: 'git_git_log',
    params: {
      repo_path: '/home/ubuntu/AI-Life-system',
      max_count: 5
    }
  },
  
  // Wikipedia 服务测试
  {
    name: 'Wikipedia - 搜索页面',
    tool: 'wikipedia_findPage',
    params: {
      query: 'Artificial Intelligence'
    }
  },
  {
    name: 'Wikipedia - 获取页面内容',
    tool: 'wikipedia_getPage',
    params: {
      title: 'Artificial Intelligence'
    }
  },
  {
    name: 'Wikipedia - 历史上的今天',
    tool: 'wikipedia_onThisDay',
    params: {
      date: '2025-10-12'
    }
  }
];

async function runTests() {
  console.log('开始测试 Git 和 Wikipedia MCP 服务...\n');
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n📝 测试: ${test.name}`);
      console.log(`   工具: ${test.tool}`);
      console.log(`   参数: ${JSON.stringify(test.params)}`);

      const response = await axios.post(`${API_BASE}/call`, {
        toolName: test.tool,
        parameters: test.params
      });

      if (response.data.success) {
        console.log(`   ✅ 通过`);
        const resultStr = JSON.stringify(response.data.result || response.data);
        console.log(`   结果预览: ${resultStr.substring(0, 200)}...`);
        passed++;
      } else {
        console.log(`   ❌ 失败: ${response.data.error}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ 错误: ${error.message}`);
      if (error.response?.data) {
        console.log(`   详情: ${JSON.stringify(error.response.data)}`);
      }
      failed++;
    }
  }

  console.log(`\n\n========== 测试总结 ==========`);
  console.log(`总计: ${tests.length} 个测试`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`成功率: ${((passed / tests.length) * 100).toFixed(2)}%`);
}

runTests().catch(console.error);

