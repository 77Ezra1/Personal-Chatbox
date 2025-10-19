#!/usr/bin/env node

/**
 * 测试扩展后的 createCategory 接口
 */

const http = require('http');

const TEST_CATEGORIES = [
  {
    name: '工作笔记',
    color: '#ef4444',
    description: '工作相关的笔记和文档',
    icon: '💼',
    sortOrder: 1
  },
  {
    name: '学习笔记',
    color: '#3b82f6',
    description: '学习过程中的知识点记录',
    icon: '📚',
    sortOrder: 2
  },
  {
    name: '生活记录',
    color: '#10b981',
    description: '日常生活的点滴记录',
    icon: '🏠',
    sortOrder: 3
  },
  {
    name: '灵感想法',
    color: '#f59e0b',
    description: '突发的创意和想法',
    icon: '💡',
    sortOrder: 4
  }
];

console.log('🧪 测试 createCategory 接口扩展');
console.log('='.repeat(60));

async function testCreateCategory(categoryData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(categoryData);

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/notes/categories',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('\n📝 开始测试...\n');

  let successCount = 0;
  let failCount = 0;

  for (const category of TEST_CATEGORIES) {
    console.log(`\n测试创建: ${category.name}`);
    console.log('-'.repeat(60));
    console.log('请求数据:', JSON.stringify(category, null, 2));

    try {
      const result = await testCreateCategory(category);
      
      console.log(`\n状态码: ${result.statusCode}`);
      console.log('响应数据:', JSON.stringify(result.data, null, 2));

      if (result.statusCode === 201 && result.data.success) {
        console.log('✅ 测试通过');
        successCount++;

        // 验证返回结构
        const { category: returnedCategory } = result.data;
        console.log('\n📊 返回的分类信息:');
        console.log(`  ID: ${returnedCategory.id}`);
        console.log(`  名称: ${returnedCategory.name}`);
        console.log(`  颜色: ${returnedCategory.color}`);
        console.log(`  描述: ${returnedCategory.description}`);
        console.log(`  图标: ${returnedCategory.icon}`);
        console.log(`  排序: ${returnedCategory.sort_order}`);
        console.log(`  笔记数: ${returnedCategory.note_count}`);
        console.log(`  创建时间: ${returnedCategory.created_at}`);
        console.log(`  更新时间: ${returnedCategory.updated_at}`);
      } else {
        console.log('❌ 测试失败');
        failCount++;
      }
    } catch (error) {
      console.log('❌ 测试异常:', error.message);
      failCount++;
    }

    // 等待一下再测试下一个
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log(`总测试数: ${TEST_CATEGORIES.length}`);
  console.log(`成功: ${successCount} ✅`);
  console.log(`失败: ${failCount} ❌`);
  console.log(`成功率: ${((successCount / TEST_CATEGORIES.length) * 100).toFixed(2)}%`);

  // 测试错误情况
  console.log('\n' + '='.repeat(60));
  console.log('🧪 测试错误处理');
  console.log('='.repeat(60));

  // 测试1: 缺少名称
  console.log('\n测试: 缺少分类名称');
  try {
    const result = await testCreateCategory({ color: '#000000' });
    console.log('响应:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.log('错误:', error.message);
  }

  // 测试2: 重复名称
  console.log('\n测试: 重复的分类名称');
  try {
    const result = await testCreateCategory({ name: '工作笔记' });
    console.log('响应:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.log('错误:', error.message);
  }

  // 测试3: 名称过长
  console.log('\n测试: 名称超过50字符');
  try {
    const result = await testCreateCategory({ 
      name: 'a'.repeat(51) 
    });
    console.log('响应:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.log('错误:', error.message);
  }

  // 测试4: 无效颜色
  console.log('\n测试: 无效的颜色格式');
  try {
    const result = await testCreateCategory({ 
      name: '测试分类',
      color: 'invalid-color' 
    });
    console.log('响应:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.log('错误:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ 所有测试完成！');
  console.log('='.repeat(60));
}

// 检查后端是否运行
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001', (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.end();
  });
};

(async () => {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ 后端服务未运行！');
    console.log('💡 请先启动后端服务: node server/index.cjs');
    process.exit(1);
  }

  console.log('✅ 后端服务正在运行\n');
  
  try {
    await runTests();
  } catch (error) {
    console.error('测试过程中出错:', error);
    process.exit(1);
  }
})();
