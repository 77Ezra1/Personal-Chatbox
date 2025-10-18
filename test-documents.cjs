/**
 * 文档管理功能测试脚本
 * 测试所有的CRUD操作、分类管理、标签管理、搜索等功能
 */

// 使用内置fetch或node-fetch
let fetch;
try {
  // Node.js 18+ 内置 fetch
  fetch = global.fetch || require('node-fetch');
} catch (e) {
  // 如果没有node-fetch，使用http模块实现简单的fetch
  const http = require('http');
  const https = require('https');
  const { URL } = require('url');

  fetch = async (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.request(url, {
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: async () => JSON.parse(data)
          });
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  };
}

const API_BASE = 'http://localhost:3001/api';
let authToken = '';
let testUserId = '';
let testDocumentId = '';
let testCategoryId = '';

// 测试统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, message = '') {
  stats.total++;
  if (passed) {
    stats.passed++;
    log(`✓ ${name}${message ? ': ' + message : ''}`, 'green');
  } else {
    stats.failed++;
    log(`✗ ${name}${message ? ': ' + message : ''}`, 'red');
    stats.errors.push({ test: name, message });
  }
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(title, 'bright');
  log('='.repeat(60), 'cyan');
}

// 辅助函数
async function request(method, path, body = null, useAuth = true) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();

  return { response, data };
}

// 1. 准备测试环境
async function setup() {
  logSection('📋 测试环境准备');

  try {
    // 尝试注册测试用户
    const timestamp = Date.now();
    const email = `test-docs-${timestamp}@test.com`;
    const password = 'TestPassword123!';
    const inviteCode = 'TEST-DOCS-2025';

    let { response: registerRes, data: registerData } = await request(
      'POST',
      '/auth/register',
      { email, password, inviteCode },
      false
    );

    if (registerRes.ok) {
      authToken = registerData.token;
      testUserId = registerData.user.id;
      logTest('创建测试用户', true, email);
    } else if (registerData.error === 'Email already exists') {
      // 如果邮箱已存在，尝试登录
      logTest('注册失败（邮箱已存在），尝试登录', true);

      const { response: loginRes, data: loginData } = await request(
        'POST',
        '/auth/login',
        { email, password },
        false
      );

      if (loginRes.ok) {
        authToken = loginData.token;
        testUserId = loginData.user.id;
        logTest('使用现有用户登录', true, email);
      } else {
        // 如果登录也失败，生成新的随机邮箱再试一次
        const randomEmail = `test-docs-${Math.random().toString(36).substring(7)}@test.com`;
        const { response: retryRes, data: retryData } = await request(
          'POST',
          '/auth/register',
          { email: randomEmail, password, inviteCode },
          false
        );

        if (retryRes.ok) {
          authToken = retryData.token;
          testUserId = retryData.user.id;
          logTest('创建新测试用户', true, randomEmail);
        } else {
          logTest('创建测试用户', false, retryData.error);
          return false;
        }
      }
    } else {
      logTest('创建测试用户', false, registerData.error);
      return false;
    }

    return true;
  } catch (error) {
    logTest('环境准备', false, error.message);
    return false;
  }
}

// 2. 测试分类管理
async function testCategories() {
  logSection('📁 测试分类管理');

  try {
    // 创建分类
    const { response: createRes, data: createData } = await request(
      'POST',
      '/documents/categories',
      {
        name: 'Development',
        color: '#3b82f6',
        icon: '💻',
        description: 'Development resources'
      }
    );

    if (createRes.ok && createData.id) {
      testCategoryId = createData.id;
      logTest('创建分类', true, `ID: ${testCategoryId}`);
    } else {
      logTest('创建分类', false, createData.error || '未返回ID');
    }

    // 获取所有分类
    const { response: listRes, data: listData } = await request('GET', '/documents/categories/list');

    if (listRes.ok && Array.isArray(listData)) {
      const found = listData.find(c => c.id === testCategoryId);
      logTest('获取分类列表', found !== undefined, `找到 ${listData.length} 个分类`);
    } else {
      logTest('获取分类列表', false, listData.error || '返回数据格式错误');
    }

    // 更新分类
    const { response: updateRes, data: updateData } = await request(
      'PUT',
      `/documents/categories/${testCategoryId}`,
      { description: 'Updated description' }
    );

    logTest('更新分类', updateRes.ok && updateData.description === 'Updated description');

  } catch (error) {
    logTest('分类管理测试', false, error.message);
  }
}

// 3. 测试文档CRUD
async function testDocumentCRUD() {
  logSection('📄 测试文档CRUD操作');

  try {
    // 创建文档
    const documentData = {
      title: 'React Documentation',
      description: 'Official React documentation for learning React',
      url: 'https://react.dev',
      category: 'Development',
      tags: ['react', 'frontend', 'javascript'],
      icon: '⚛️',
      is_favorite: false,
      is_archived: false
    };

    const { response: createRes, data: createData } = await request(
      'POST',
      '/documents',
      documentData
    );

    if (createRes.ok && createData.id) {
      testDocumentId = createData.id;
      logTest('创建文档', true, `ID: ${testDocumentId}, 标题: ${createData.title}`);

      // 验证标签
      if (createData.tags && createData.tags.length === 3) {
        logTest('文档标签保存', true, `标签: ${createData.tags.join(', ')}`);
      } else {
        logTest('文档标签保存', false, `期望3个标签，实际: ${createData.tags?.length || 0}`);
      }
    } else {
      logTest('创建文档', false, createData.error || '未返回ID');
      return;
    }

    // 获取单个文档
    const { response: getRes, data: getData } = await request(
      'GET',
      `/documents/${testDocumentId}`
    );

    logTest(
      '获取单个文档',
      getRes.ok && getData.id === testDocumentId,
      getData.title
    );

    // 获取所有文档
    const { response: listRes, data: listData } = await request('GET', '/documents');

    logTest(
      '获取文档列表',
      listRes.ok && Array.isArray(listData) && listData.length > 0,
      `找到 ${listData?.length || 0} 个文档`
    );

    // 更新文档
    const updateData = {
      title: 'React Documentation (Updated)',
      is_favorite: true
    };

    const { response: updateRes, data: updatedDoc } = await request(
      'PUT',
      `/documents/${testDocumentId}`,
      updateData
    );

    logTest(
      '更新文档',
      updateRes.ok && updatedDoc.title === updateData.title,
      updatedDoc.title
    );

    logTest(
      '更新收藏状态',
      updatedDoc.is_favorite === 1,
      `is_favorite: ${updatedDoc.is_favorite}`
    );

  } catch (error) {
    logTest('文档CRUD测试', false, error.message);
  }
}

// 4. 测试文档过滤
async function testDocumentFilters() {
  logSection('🔍 测试文档过滤功能');

  try {
    // 创建几个测试文档
    const docs = [
      {
        title: 'Vue.js Guide',
        url: 'https://vuejs.org',
        category: 'Development',
        tags: ['vue', 'frontend'],
        icon: '💚',
        is_favorite: true
      },
      {
        title: 'Node.js Docs',
        url: 'https://nodejs.org',
        category: 'Development',
        tags: ['nodejs', 'backend'],
        icon: '🟢',
        is_favorite: false
      },
      {
        title: 'TypeScript Handbook',
        url: 'https://www.typescriptlang.org',
        category: 'Development',
        tags: ['typescript', 'language'],
        icon: '🔷',
        is_favorite: true,
        is_archived: true
      }
    ];

    for (const doc of docs) {
      await request('POST', '/documents', doc);
    }

    logTest('创建测试数据', true, `创建了 ${docs.length} 个文档`);

    // 按分类过滤
    const { response: catRes, data: catData } = await request(
      'GET',
      '/documents?category=Development'
    );

    logTest(
      '按分类过滤',
      catRes.ok && catData.length >= 3,
      `找到 ${catData.length} 个Development分类文档`
    );

    // 按收藏过滤
    const { response: favRes, data: favData } = await request(
      'GET',
      '/documents?isFavorite=true'
    );

    logTest(
      '按收藏过滤',
      favRes.ok && favData.length >= 2,
      `找到 ${favData.length} 个收藏文档`
    );

    // 按标签过滤
    const { response: tagRes, data: tagData } = await request(
      'GET',
      '/documents?tag=vue'
    );

    logTest(
      '按标签过滤',
      tagRes.ok && tagData.length >= 1,
      `找到 ${tagData.length} 个带vue标签的文档`
    );

    // 显示归档文档
    const { response: archRes, data: archData } = await request(
      'GET',
      '/documents?isArchived=true'
    );

    logTest(
      '获取归档文档',
      archRes.ok && archData.length >= 1,
      `找到 ${archData.length} 个归档文档`
    );

    // 排序测试
    const { response: sortRes, data: sortData } = await request(
      'GET',
      '/documents?sortBy=title&sortOrder=ASC'
    );

    logTest(
      '按标题排序',
      sortRes.ok && sortData.length > 0,
      `排序后首个: ${sortData[0]?.title}`
    );

  } catch (error) {
    logTest('文档过滤测试', false, error.message);
  }
}

// 5. 测试搜索功能
async function testSearch() {
  logSection('🔎 测试搜索功能');

  try {
    // 搜索文档
    const { response: searchRes, data: searchData } = await request(
      'GET',
      '/documents/search/React'
    );

    logTest(
      '搜索文档',
      searchRes.ok && Array.isArray(searchData),
      `找到 ${searchData.length} 个包含"React"的文档`
    );

    // 搜索不存在的内容
    const { response: noRes, data: noData } = await request(
      'GET',
      '/documents/search/NonExistentKeyword12345'
    );

    logTest(
      '搜索不存在的内容',
      noRes.ok && noData.length === 0,
      '正确返回空结果'
    );

  } catch (error) {
    logTest('搜索功能测试', false, error.message);
  }
}

// 6. 测试访问记录
async function testVisitTracking() {
  logSection('👁️ 测试访问记录');

  try {
    // 记录访问
    const { response: visit1, data: visitData1 } = await request(
      'POST',
      `/documents/${testDocumentId}/visit`
    );

    logTest(
      '记录文档访问',
      visit1.ok && visitData1.visit_count === 1,
      `访问次数: ${visitData1.visit_count}`
    );

    // 再次访问
    const { response: visit2, data: visitData2 } = await request(
      'POST',
      `/documents/${testDocumentId}/visit`
    );

    logTest(
      '访问计数累加',
      visit2.ok && visitData2.visit_count === 2,
      `访问次数: ${visitData2.visit_count}`
    );

    // 验证最后访问时间
    logTest(
      '更新最后访问时间',
      visitData2.last_visited_at !== null,
      `最后访问: ${visitData2.last_visited_at}`
    );

  } catch (error) {
    logTest('访问记录测试', false, error.message);
  }
}

// 7. 测试标签功能
async function testTags() {
  logSection('🏷️ 测试标签功能');

  try {
    // 获取所有标签
    const { response: tagRes, data: tagData } = await request(
      'GET',
      '/documents/tags/list'
    );

    if (tagRes.ok && Array.isArray(tagData)) {
      logTest(
        '获取标签列表',
        tagData.length > 0,
        `找到 ${tagData.length} 个标签`
      );

      // 验证标签包含使用次数
      const hasCount = tagData.every(t => typeof t.count === 'number');
      logTest('标签包含使用次数', hasCount);
    } else {
      logTest('获取标签列表', false, tagData.error || '返回格式错误');
    }

  } catch (error) {
    logTest('标签功能测试', false, error.message);
  }
}

// 8. 测试统计信息
async function testStatistics() {
  logSection('📊 测试统计信息');

  try {
    const { response: statsRes, data: statsData } = await request(
      'GET',
      '/documents/stats/summary'
    );

    if (statsRes.ok && statsData) {
      logTest('获取统计信息', true);
      logTest('统计-总文档数', typeof statsData.total === 'number', `总计: ${statsData.total}`);
      logTest('统计-收藏数', typeof statsData.favorites === 'number', `收藏: ${statsData.favorites}`);
      logTest('统计-分类数', typeof statsData.categories === 'number', `分类: ${statsData.categories}`);
      logTest('统计-归档数', typeof statsData.archived === 'number', `归档: ${statsData.archived}`);
      logTest(
        '统计-最常访问',
        Array.isArray(statsData.mostVisited),
        `最常访问: ${statsData.mostVisited?.length || 0} 个`
      );
    } else {
      logTest('获取统计信息', false, statsData.error || '返回格式错误');
    }

  } catch (error) {
    logTest('统计信息测试', false, error.message);
  }
}

// 9. 测试导入导出
async function testImportExport() {
  logSection('📤📥 测试导入导出');

  try {
    // 导出文档
    const { response: exportRes, data: exportData } = await request(
      'GET',
      '/documents/export/all'
    );

    if (exportRes.ok && exportData.documents) {
      logTest(
        '导出文档',
        exportData.documents.length > 0,
        `导出了 ${exportData.documents.length} 个文档`
      );

      // 导入文档
      const importDocs = [{
        title: 'Imported Document',
        url: 'https://example.com/import',
        category: 'Development',
        tags: ['imported'],
        icon: '📥'
      }];

      const { response: importRes, data: importData } = await request(
        'POST',
        '/documents/import',
        { documents: importDocs }
      );

      logTest(
        '导入文档',
        importRes.ok && importData.imported === 1,
        `成功导入 ${importData.imported} 个文档`
      );
    } else {
      logTest('导出文档', false, exportData.error || '返回格式错误');
    }

  } catch (error) {
    logTest('导入导出测试', false, error.message);
  }
}

// 10. 测试删除功能
async function testDeletion() {
  logSection('🗑️ 测试删除功能');

  try {
    // 创建一个用于删除的文档
    const { data: doc } = await request('POST', '/documents', {
      title: 'Document to Delete',
      url: 'https://example.com/delete',
      category: 'Development'
    });

    const docId = doc.id;

    // 删除文档
    const { response: delRes, data: delData } = await request(
      'DELETE',
      `/documents/${docId}`
    );

    logTest('删除文档', delRes.ok && delData.success === true);

    // 验证文档已删除
    const { response: getRes } = await request('GET', `/documents/${docId}`);

    logTest('验证文档已删除', !getRes.ok || getRes.status === 404);

    // 删除分类（如果有的话）
    if (testCategoryId) {
      const { response: delCatRes, data: delCatData } = await request(
        'DELETE',
        `/documents/categories/${testCategoryId}`
      );

      logTest('删除分类', delCatRes.ok && delCatData.success === true);
    }

  } catch (error) {
    logTest('删除功能测试', false, error.message);
  }
}

// 11. 测试边界情况
async function testEdgeCases() {
  logSection('⚠️ 测试边界情况');

  try {
    // 创建没有必填字段的文档
    const { response: noTitle } = await request('POST', '/documents', {
      url: 'https://example.com'
    });

    logTest('缺少标题时拒绝创建', !noTitle.ok);

    // 创建没有URL的文档
    const { response: noUrl } = await request('POST', '/documents', {
      title: 'No URL Document'
    });

    logTest('缺少URL时拒绝创建', !noUrl.ok);

    // 获取不存在的文档
    const { response: notFound } = await request('GET', '/documents/999999');

    logTest('获取不存在的文档返回404', !notFound.ok);

    // 更新不存在的文档
    const { response: updateNotFound } = await request(
      'PUT',
      '/documents/999999',
      { title: 'Updated' }
    );

    logTest('更新不存在的文档返回错误', !updateNotFound.ok);

    // 删除不存在的文档
    const { response: deleteNotFound } = await request('DELETE', '/documents/999999');

    logTest('删除不存在的文档返回错误', !deleteNotFound.ok);

  } catch (error) {
    logTest('边界情况测试', false, error.message);
  }
}

// 主测试流程
async function runTests() {
  log('\n' + '═'.repeat(60), 'bright');
  log('📚 文档管理功能测试套件', 'bright');
  log('═'.repeat(60) + '\n', 'bright');

  const setupSuccess = await setup();

  if (!setupSuccess) {
    log('\n❌ 测试环境准备失败，终止测试', 'red');
    return;
  }

  // 运行所有测试
  await testCategories();
  await testDocumentCRUD();
  await testDocumentFilters();
  await testSearch();
  await testVisitTracking();
  await testTags();
  await testStatistics();
  await testImportExport();
  await testDeletion();
  await testEdgeCases();

  // 打印测试结果
  logSection('📊 测试结果汇总');

  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : 0;

  log(`\n总计测试: ${stats.total}`, 'bright');
  log(`✓ 通过: ${stats.passed}`, 'green');
  log(`✗ 失败: ${stats.failed}`, stats.failed > 0 ? 'red' : 'reset');
  log(`通过率: ${passRate}%\n`, passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red');

  if (stats.errors.length > 0) {
    log('失败的测试:', 'red');
    stats.errors.forEach(({ test, message }) => {
      log(`  • ${test}: ${message}`, 'red');
    });
    log('');
  }

  if (stats.failed === 0) {
    log('🎉 所有测试通过！', 'green');
  } else {
    log(`⚠️  有 ${stats.failed} 个测试失败，请检查`, 'yellow');
  }

  log('\n' + '═'.repeat(60) + '\n', 'bright');

  process.exit(stats.failed > 0 ? 1 : 0);
}

// 运行测试
runTests().catch(error => {
  log(`\n❌ 测试执行出错: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
