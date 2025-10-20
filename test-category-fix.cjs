#!/usr/bin/env node
/**
 * 测试分类创建功能
 * 验证 LOWER() 函数在 JSON 数据库中的正确处理
 */

const unifiedAdapter = require('./server/db/unified-adapter.cjs');

async function testCategoryCreation() {
  console.log('=== 测试分类创建功能 ===\n');

  const db = unifiedAdapter.createDatabase({
    type: 'json',
    database: './data/database.json'
  });

  const userId = 5;
  const testCategories = ['公司', '工作', '一个']; // '一个'已存在

  for (const categoryName of testCategories) {
    console.log(`\n测试: 创建分类 "${categoryName}"`);
    
    // 1. 检查是否存在（使用 LOWER 函数）
    const sql = `SELECT id FROM note_categories WHERE user_id = ? AND LOWER(name) = LOWER(?)`;
    const params = [userId, categoryName];
    
    console.log(`  SQL: ${sql}`);
    console.log(`  参数: [${params.join(', ')}]`);
    
    try {
      const existing = await db.get(sql, params);
      
      if (existing) {
        console.log(`  ✗ 分类已存在: id=${existing.id}, name=${existing.name}`);
      } else {
        console.log(`  ✓ 分类不存在，可以创建`);
      }
    } catch (err) {
      console.error(`  ✗ 查询出错: ${err.message}`);
    }
  }

  console.log('\n=== 测试完成 ===');
}

testCategoryCreation().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
