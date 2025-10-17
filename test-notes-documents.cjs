/**
 * 笔记和文档功能测试脚本
 * 测试增删改查所有功能
 */

const http = require('http');

// 测试配置
const BASE_URL = 'http://localhost:3001';
let authToken = '';

// 辅助函数：发送HTTP请求
function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
      options.headers['Cookie'] = `token=${token}`;
    }

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试结果统计
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 测试断言
function assert(condition, message) {
  results.total++;
  if (condition) {
    results.passed++;
    log(`  ✓ ${message}`, 'green');
    return true;
  } else {
    results.failed++;
    results.errors.push(message);
    log(`  ✗ ${message}`, 'red');
    return false;
  }
}

// 测试套件
async function runTests() {
  log('\n=== 笔记和文档功能测试 ===\n', 'blue');

  // 1. 登录获取token
  log('1. 测试登录', 'yellow');
  try {
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'Password123!'
    });

    log(`  登录响应状态: ${loginRes.status}`, 'blue');
    log(`  登录响应数据: ${JSON.stringify(loginRes.data)}`, 'blue');

    if (loginRes.status === 404 || loginRes.status === 401 || loginRes.data.error === 'User not found' || loginRes.data.error === 'Invalid credentials') {
      // 用户不存在或密码错误，先注册
      log('  用户不存在或密码错误，正在注册...', 'yellow');
      const registerRes = await makeRequest('POST', '/api/auth/register', {
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testuser',
        inviteCode: 'ADMIN2025'
      });

      log(`  注册响应状态: ${registerRes.status}`, 'blue');
      log(`  注册响应数据: ${JSON.stringify(registerRes.data)}`, 'blue');

      if (registerRes.status === 201 || registerRes.status === 200) {
        authToken = registerRes.data.token || registerRes.headers['set-cookie']?.match(/token=([^;]+)/)?.[1];
        log('  注册成功', 'green');
      } else if (registerRes.status === 409 && registerRes.data.error === 'Email already exists') {
        // 用户已存在，尝试重新登录
        log('  用户已存在，尝试重新登录...', 'yellow');
        const retryLoginRes = await makeRequest('POST', '/api/auth/login', {
          email: 'test@example.com',
          password: 'Password123!'
        });

        if (retryLoginRes.status === 200) {
          authToken = retryLoginRes.data.token || retryLoginRes.headers['set-cookie']?.match(/token=([^;]+)/)?.[1];
        } else {
          throw new Error('登录失败: ' + JSON.stringify(retryLoginRes.data));
        }
      } else {
        throw new Error('注册失败: ' + JSON.stringify(registerRes.data));
      }
    } else if (loginRes.status === 200) {
      authToken = loginRes.data.token || loginRes.headers['set-cookie']?.match(/token=([^;]+)/)?.[1];
    }

    log(`  Token: ${authToken}`, 'blue');
    assert(authToken && authToken.length > 0, '成功获取认证token');
  } catch (error) {
    log(`  登录/注册失败: ${error.message}`, 'red');
    results.failed++;
    return;
  }

  // 2. 测试笔记功能
  log('\n2. 测试笔记功能', 'yellow');
  await testNotes();

  // 3. 测试文档功能
  log('\n3. 测试文档功能', 'yellow');
  await testDocuments();

  // 输出测试结果
  log('\n=== 测试结果 ===', 'blue');
  log(`总计: ${results.total}`, 'blue');
  log(`通过: ${results.passed}`, 'green');
  log(`失败: ${results.failed}`, 'red');

  if (results.failed > 0) {
    log('\n失败的测试:', 'red');
    results.errors.forEach(err => log(`  - ${err}`, 'red'));
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// 笔记功能测试
async function testNotes() {
  let noteId = null;
  let categoryId = null;

  try {
    // 2.1 创建笔记
    log('  2.1 测试创建笔记', 'yellow');
    const createRes = await makeRequest('POST', '/api/notes', {
      title: '测试笔记',
      content: '这是一个测试笔记的内容',
      category: 'test',
      tags: ['测试', '自动化']
    }, authToken);

    assert(createRes.status === 201, '创建笔记返回201状态码');
    assert(createRes.data.note && createRes.data.note.id, '返回创建的笔记数据');
    if (createRes.data.note) {
      noteId = createRes.data.note.id;
      assert(createRes.data.note.title === '测试笔记', '笔记标题正确');
      assert(createRes.data.note.content === '这是一个测试笔记的内容', '笔记内容正确');
      assert(Array.isArray(createRes.data.note.tags) && createRes.data.note.tags.length === 2, '笔记标签正确');
    }

    // 2.2 获取所有笔记
    log('  2.2 测试获取所有笔记', 'yellow');
    const getAllRes = await makeRequest('GET', '/api/notes', null, authToken);
    assert(getAllRes.status === 200, '获取笔记返回200状态码');
    assert(getAllRes.data.notes && Array.isArray(getAllRes.data.notes), '返回笔记数组');
    assert(getAllRes.data.notes.length > 0, '至少有一个笔记');

    // 2.3 获取单个笔记
    log('  2.3 测试获取单个笔记', 'yellow');
    if (noteId) {
      const getOneRes = await makeRequest('GET', `/api/notes/${noteId}`, null, authToken);
      assert(getOneRes.status === 200, '获取单个笔记返回200状态码');
      assert(getOneRes.data.note && getOneRes.data.note.id === noteId, '返回正确的笔记');
    }

    // 2.4 更新笔记
    log('  2.4 测试更新笔记', 'yellow');
    if (noteId) {
      const updateRes = await makeRequest('PUT', `/api/notes/${noteId}`, {
        title: '更新后的测试笔记',
        content: '更新后的内容',
        is_favorite: true
      }, authToken);
      assert(updateRes.status === 200, '更新笔记返回200状态码');
      assert(updateRes.data.note && updateRes.data.note.title === '更新后的测试笔记', '笔记标题已更新');
      assert(updateRes.data.note.is_favorite === true, '笔记已设为收藏');
    }

    // 2.5 搜索笔记
    log('  2.5 测试搜索笔记', 'yellow');
    const searchRes = await makeRequest('GET', '/api/notes/search?q=测试', null, authToken);
    assert(searchRes.status === 200, '搜索笔记返回200状态码');
    assert(searchRes.data.notes && Array.isArray(searchRes.data.notes), '返回搜索结果数组');

    // 2.6 获取分类
    log('  2.6 测试获取分类', 'yellow');
    const getCatsRes = await makeRequest('GET', '/api/notes/categories', null, authToken);
    assert(getCatsRes.status === 200, '获取分类返回200状态码');
    assert(getCatsRes.data.categories && Array.isArray(getCatsRes.data.categories), '返回分类数组');

    // 2.7 创建分类
    log('  2.7 测试创建分类', 'yellow');
    const createCatRes = await makeRequest('POST', '/api/notes/categories', {
      name: '测试分类',
      color: '#ff0000'
    }, authToken);
    if (createCatRes.status === 201) {
      assert(true, '创建分类成功');
      categoryId = createCatRes.data.category.id;
    } else if (createCatRes.status === 409) {
      assert(true, '分类已存在（这是正常的）');
    }

    // 2.8 获取标签
    log('  2.8 测试获取标签', 'yellow');
    const getTagsRes = await makeRequest('GET', '/api/notes/tags', null, authToken);
    assert(getTagsRes.status === 200, '获取标签返回200状态码');
    assert(getTagsRes.data.tags && Array.isArray(getTagsRes.data.tags), '返回标签数组');

    // 2.9 获取统计信息
    log('  2.9 测试获取统计信息', 'yellow');
    const getStatsRes = await makeRequest('GET', '/api/notes/statistics', null, authToken);
    assert(getStatsRes.status === 200, '获取统计信息返回200状态码');
    assert(getStatsRes.data.statistics && typeof getStatsRes.data.statistics.total === 'number', '返回统计数据');

    // 2.10 删除笔记
    log('  2.10 测试删除笔记', 'yellow');
    if (noteId) {
      const deleteRes = await makeRequest('DELETE', `/api/notes/${noteId}`, null, authToken);
      assert(deleteRes.status === 200, '删除笔记返回200状态码');
      assert(deleteRes.data.success === true, '删除成功');

      // 验证笔记已删除
      const verifyRes = await makeRequest('GET', `/api/notes/${noteId}`, null, authToken);
      assert(verifyRes.status === 404, '已删除的笔记返回404');
    }

    // 2.11 删除分类（如果创建了）
    if (categoryId) {
      log('  2.11 测试删除分类', 'yellow');
      const deleteCatRes = await makeRequest('DELETE', `/api/notes/categories/${categoryId}`, null, authToken);
      assert(deleteCatRes.status === 200, '删除分类返回200状态码');
    }

  } catch (error) {
    log(`  笔记测试出错: ${error.message}`, 'red');
    results.failed++;
  }
}

// 文档功能测试
async function testDocuments() {
  let documentId = null;
  let categoryId = null;

  try {
    // 3.1 创建文档
    log('  3.1 测试创建文档', 'yellow');
    const createRes = await makeRequest('POST', '/api/documents', {
      title: '测试文档',
      description: '这是一个测试文档',
      url: 'https://example.com',
      category: 'test',
      tags: ['测试', '文档'],
      icon: '📄'
    }, authToken);

    assert(createRes.status === 201, '创建文档返回201状态码');
    assert(createRes.data && createRes.data.id, '返回创建的文档数据');
    if (createRes.data) {
      documentId = createRes.data.id;
      assert(createRes.data.title === '测试文档', '文档标题正确');
      assert(createRes.data.url === 'https://example.com', '文档URL正确');
      assert(Array.isArray(createRes.data.tags) && createRes.data.tags.length === 2, '文档标签正确');
    }

    // 3.2 获取所有文档
    log('  3.2 测试获取所有文档', 'yellow');
    const getAllRes = await makeRequest('GET', '/api/documents', null, authToken);
    assert(getAllRes.status === 200, '获取文档返回200状态码');
    assert(Array.isArray(getAllRes.data), '返回文档数组');
    assert(getAllRes.data.length > 0, '至少有一个文档');

    // 3.3 获取单个文档
    log('  3.3 测试获取单个文档', 'yellow');
    if (documentId) {
      const getOneRes = await makeRequest('GET', `/api/documents/${documentId}`, null, authToken);
      assert(getOneRes.status === 200, '获取单个文档返回200状态码');
      assert(getOneRes.data && getOneRes.data.id === documentId, '返回正确的文档');
    }

    // 3.4 更新文档
    log('  3.4 测试更新文档', 'yellow');
    if (documentId) {
      const updateRes = await makeRequest('PUT', `/api/documents/${documentId}`, {
        title: '更新后的测试文档',
        description: '更新后的描述',
        is_favorite: true
      }, authToken);
      assert(updateRes.status === 200, '更新文档返回200状态码');
      assert(updateRes.data && updateRes.data.title === '更新后的测试文档', '文档标题已更新');
      assert(updateRes.data.is_favorite === 1, '文档已设为收藏');
    }

    // 3.5 搜索文档
    log('  3.5 测试搜索文档', 'yellow');
    const searchRes = await makeRequest('GET', '/api/documents/search/测试', null, authToken);
    assert(searchRes.status === 200, '搜索文档返回200状态码');
    assert(Array.isArray(searchRes.data), '返回搜索结果数组');

    // 3.6 记录访问
    log('  3.6 测试记录文档访问', 'yellow');
    if (documentId) {
      const visitRes = await makeRequest('POST', `/api/documents/${documentId}/visit`, null, authToken);
      assert(visitRes.status === 200, '记录访问返回200状态码');
      assert(visitRes.data && visitRes.data.visit_count > 0, '访问次数已增加');
    }

    // 3.7 获取分类
    log('  3.7 测试获取分类', 'yellow');
    const getCatsRes = await makeRequest('GET', '/api/documents/categories/list', null, authToken);
    assert(getCatsRes.status === 200, '获取分类返回200状态码');
    assert(Array.isArray(getCatsRes.data), '返回分类数组');

    // 3.8 创建分类
    log('  3.8 测试创建分类', 'yellow');
    const createCatRes = await makeRequest('POST', '/api/documents/categories', {
      name: '测试文档分类',
      color: '#00ff00',
      icon: '📁'
    }, authToken);
    assert(createCatRes.status === 201, '创建分类返回201状态码');
    if (createCatRes.data && createCatRes.data.id) {
      categoryId = createCatRes.data.id;
    }

    // 3.9 获取标签
    log('  3.9 测试获取标签', 'yellow');
    const getTagsRes = await makeRequest('GET', '/api/documents/tags/list', null, authToken);
    assert(getTagsRes.status === 200, '获取标签返回200状态码');
    assert(Array.isArray(getTagsRes.data), '返回标签数组');

    // 3.10 获取统计信息
    log('  3.10 测试获取统计信息', 'yellow');
    const getStatsRes = await makeRequest('GET', '/api/documents/stats/summary', null, authToken);
    assert(getStatsRes.status === 200, '获取统计信息返回200状态码');
    assert(getStatsRes.data && typeof getStatsRes.data.total === 'number', '返回统计数据');

    // 3.11 删除文档
    log('  3.11 测试删除文档', 'yellow');
    if (documentId) {
      const deleteRes = await makeRequest('DELETE', `/api/documents/${documentId}`, null, authToken);
      assert(deleteRes.status === 200, '删除文档返回200状态码');
      assert(deleteRes.data.success === true, '删除成功');

      // 验证文档已删除
      const verifyRes = await makeRequest('GET', `/api/documents/${documentId}`, null, authToken);
      assert(verifyRes.status === 404, '已删除的文档返回404');
    }

    // 3.12 删除分类（如果创建了）
    if (categoryId) {
      log('  3.12 测试删除分类', 'yellow');
      const deleteCatRes = await makeRequest('DELETE', `/api/documents/categories/${categoryId}`, null, authToken);
      assert(deleteCatRes.status === 200, '删除分类返回200状态码');
    }

  } catch (error) {
    log(`  文档测试出错: ${error.message}`, 'red');
    results.failed++;
  }
}

// 运行测试
runTests().catch(error => {
  log(`\n测试运行失败: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
