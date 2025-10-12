/**
 * 综合测试所有 MCP 服务
 * 测试每个服务的核心功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// 测试结果存储
const testResults = {
  passed: [],
  failed: [],
  skipped: []
};

/**
 * 测试工具调用
 */
async function testToolCall(serviceName, toolName, params, description) {
  console.log(`\n🧪 测试: ${description}`);
  console.log(`   服务: ${serviceName}`);
  console.log(`   工具: ${toolName}`);
  console.log(`   参数:`, JSON.stringify(params, null, 2));
  
  try {
    const response = await axios.post(`${BASE_URL}/api/mcp/call`, {
      toolName,
      parameters: params
    });
    
    if (response.data.success) {
      console.log(`✅ 成功`);
      console.log(`   结果:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
      testResults.passed.push({
        service: serviceName,
        tool: toolName,
        description
      });
      return response.data;
    } else {
      console.log(`❌ 失败: ${response.data.error || '未知错误'}`);
      testResults.failed.push({
        service: serviceName,
        tool: toolName,
        description,
        error: response.data.error
      });
      return null;
    }
  } catch (error) {
    console.log(`❌ 异常: ${error.message}`);
    if (error.response?.data) {
      console.log(`   详情:`, error.response.data);
    }
    testResults.failed.push({
      service: serviceName,
      tool: toolName,
      description,
      error: error.message
    });
    return null;
  }
}

/**
 * 测试 Memory 服务
 */
async function testMemoryService() {
  console.log('\n' + '='.repeat(60));
  console.log('📝 测试 Memory 记忆系统');
  console.log('='.repeat(60));
  
  // 1. 创建实体
  await testToolCall(
    'Memory',
    'memory_create_entities',
    {
      entities: [
        {
          name: 'DeepSeek',
          entityType: 'company',
          observations: ['一家中国AI公司', '开发了deepseek-chat和deepseek-reasoner模型']
        },
        {
          name: 'MCP',
          entityType: 'technology',
          observations: ['Model Context Protocol的缩写', '用于AI模型与工具集成']
        }
      ]
    },
    '创建实体 - DeepSeek 和 MCP'
  );
  
  // 2. 创建关系
  await testToolCall(
    'Memory',
    'memory_create_relations',
    {
      relations: [
        {
          from: 'DeepSeek',
          to: 'MCP',
          relationType: 'supports'
        }
      ]
    },
    '创建关系 - DeepSeek 支持 MCP'
  );
  
  // 3. 搜索节点
  await testToolCall(
    'Memory',
    'memory_search_nodes',
    {
      query: 'DeepSeek'
    },
    '搜索节点 - DeepSeek'
  );
  
  // 4. 读取图谱
  await testToolCall(
    'Memory',
    'memory_read_graph',
    {},
    '读取完整知识图谱'
  );
}

/**
 * 测试 Filesystem 服务
 */
async function testFilesystemService() {
  console.log('\n' + '='.repeat(60));
  console.log('📁 测试 Filesystem 文件系统');
  console.log('='.repeat(60));
  
  // 1. 创建目录
  await testToolCall(
    'Filesystem',
    'filesystem_create_directory',
    {
      path: '/home/ubuntu/AI-Life-system/test_data'
    },
    '创建测试目录'
  );
  
  // 2. 写入文件
  await testToolCall(
    'Filesystem',
    'filesystem_write_file',
    {
      path: '/home/ubuntu/AI-Life-system/test_data/test.txt',
      content: 'Hello from MCP Filesystem Service!\nThis is a test file.\n'
    },
    '写入测试文件'
  );
  
  // 3. 读取文件
  await testToolCall(
    'Filesystem',
    'filesystem_read_file',
    {
      path: '/home/ubuntu/AI-Life-system/test_data/test.txt'
    },
    '读取测试文件'
  );
  
  // 4. 列出目录
  await testToolCall(
    'Filesystem',
    'filesystem_list_directory',
    {
      path: '/home/ubuntu/AI-Life-system/test_data'
    },
    '列出测试目录内容'
  );
  
  // 5. 获取文件信息
  await testToolCall(
    'Filesystem',
    'filesystem_get_file_info',
    {
      path: '/home/ubuntu/AI-Life-system/test_data/test.txt'
    },
    '获取文件信息'
  );
  
  // 6. 搜索文件
  await testToolCall(
    'Filesystem',
    'filesystem_search_files',
    {
      path: '/home/ubuntu/AI-Life-system',
      pattern: '*.md'
    },
    '搜索 Markdown 文件'
  );
}

/**
 * 测试 Sequential Thinking 服务
 */
async function testSequentialThinkingService() {
  console.log('\n' + '='.repeat(60));
  console.log('🧠 测试 Sequential Thinking 推理增强');
  console.log('='.repeat(60));
  
  // Sequential Thinking 工具
  await testToolCall(
    'Sequential Thinking',
    'sequential_thinking_sequentialthinking',
    {
      thought: '分析MCP服务的优势',
      nextThoughtNeeded: true
    },
    '结构化思考 - MCP服务优势分析'
  );
}

/**
 * 测试 SQLite 服务
 */
async function testSQLiteService() {
  console.log('\n' + '='.repeat(60));
  console.log('🗄️  测试 SQLite 数据库');
  console.log('='.repeat(60));
  
  // 1. 获取数据库信息
  await testToolCall(
    'SQLite',
    'sqlite_db_info',
    {},
    '获取数据库信息'
  );
  
  // 2. 列出所有表
  await testToolCall(
    'SQLite',
    'sqlite_list_tables',
    {},
    '列出所有数据表'
  );
  
  // 3. 创建测试记录
  await testToolCall(
    'SQLite',
    'sqlite_create_record',
    {
      table: 'test_table',
      data: {
        name: 'MCP Test',
        value: 'Testing SQLite service',
        timestamp: new Date().toISOString()
      }
    },
    '创建测试记录'
  );
  
  // 4. 查询记录
  await testToolCall(
    'SQLite',
    'sqlite_read_records',
    {
      table: 'test_table',
      limit: 10
    },
    '查询测试记录'
  );
}

/**
 * 测试原有服务
 */
async function testLegacyServices() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 测试原有服务');
  console.log('='.repeat(60));
  
  // 时间服务
  await testToolCall(
    'Time',
    'get_current_time',
    {
      timezone: 'Asia/Shanghai'
    },
    '获取当前时间'
  );
  
  // 天气服务
  await testToolCall(
    'Weather',
    'get_current_weather',
    {
      location: '北京'
    },
    '获取北京天气'
  );
  
  // Dexscreener 服务
  await testToolCall(
    'Dexscreener',
    'search_token',
    {
      query: 'BTC'
    },
    '搜索比特币'
  );
}

/**
 * 打印测试报告
 */
function printTestReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试报告');
  console.log('='.repeat(60));
  
  console.log(`\n✅ 通过: ${testResults.passed.length} 个测试`);
  testResults.passed.forEach(test => {
    console.log(`   - ${test.service}: ${test.description}`);
  });
  
  console.log(`\n❌ 失败: ${testResults.failed.length} 个测试`);
  testResults.failed.forEach(test => {
    console.log(`   - ${test.service}: ${test.description}`);
    console.log(`     错误: ${test.error}`);
  });
  
  console.log(`\n⏭️  跳过: ${testResults.skipped.length} 个测试`);
  testResults.skipped.forEach(test => {
    console.log(`   - ${test.service}: ${test.description}`);
  });
  
  const total = testResults.passed.length + testResults.failed.length + testResults.skipped.length;
  const passRate = total > 0 ? (testResults.passed.length / total * 100).toFixed(2) : 0;
  
  console.log(`\n📈 总计: ${total} 个测试, 通过率: ${passRate}%`);
  console.log('='.repeat(60));
}

/**
 * 主测试函数
 */
async function runAllTests() {
  console.log('🚀 开始 MCP 服务综合测试');
  console.log('时间:', new Date().toISOString());
  
  try {
    // 测试各个服务
    await testMemoryService();
    await testFilesystemService();
    await testSequentialThinkingService();
    await testSQLiteService();
    await testLegacyServices();
    
    // 打印报告
    printTestReport();
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
runAllTests().then(() => {
  console.log('\n✅ 测试完成');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 测试失败:', error);
  process.exit(1);
});

