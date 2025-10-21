#!/usr/bin/env node
/**
 * 数据库测试数据种子脚本
 *
 * 功能: 为所有数据库表填充完整的测试数据
 * 用法: node scripts/seed-database.cjs
 * 或者: npm run db:seed
 *
 * 包含的数据:
 * - 用户 (users)
 * - 对话 (conversations, messages)
 * - 笔记 (notes, note_tags, note_categories)
 * - 文档 (documents, document_tags, document_categories)
 * - 密码保险库 (password_vault)
 * - AI角色 (personas)
 * - 工作流 (workflows)
 * - 知识库 (knowledge_bases, knowledge_documents)
 * - 用户配置 (user_configs)
 * - MCP配置 (user_mcp_configs)
 */

const path = require('path');
const crypto = require('crypto');

// 设置环境变量
process.env.NODE_ENV = 'development';

// 延迟加载数据库模块,确保环境变量已设置
const { db } = require('../server/db/init.cjs');
const bcrypt = require('bcryptjs');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateUUID() {
  return crypto.randomUUID();
}

// 统计数据
const stats = {
  users: 0,
  conversations: 0,
  messages: 0,
  notes: 0,
  documents: 0,
  passwords: 0,
  personas: 0,
  workflows: 0,
  knowledge_bases: 0
};

/**
 * 清空所有数据表
 */
async function clearAllData() {
  log('\n🗑️  正在清空旧数据...', 'yellow');

  const tables = [
    // 先删除依赖表
    'messages', 'node_executions', 'workflow_executions', 'knowledge_citations',
    'knowledge_queries', 'knowledge_chunks', 'knowledge_documents', 'persona_usage',
    'persona_ratings', 'document_tags', 'note_tags', 'password_history',
    'template_usage_logs', 'template_favorites', 'template_ratings',
    'template_marketplace', 'user_mcp_configs', 'login_history', 'sessions',
    'oauth_accounts',

    // 再删除主表
    'conversations', 'notes', 'note_categories', 'documents', 'document_categories',
    'password_vault', 'master_password', 'workflows', 'workflow_templates',
    'knowledge_bases', 'user_configs', 'invite_codes', 'template_categories'
  ];

  for (const table of tables) {
    try {
      db.run(`DELETE FROM ${table}`);
      log(`  ✓ 清空表: ${table}`, 'reset');
    } catch (err) {
      // 表可能不存在,忽略错误
      if (!err.message.includes('no such table')) {
        log(`  ⚠ 警告: 无法清空表 ${table}: ${err.message}`, 'yellow');
      }
    }
  }

  // 特殊处理: 只删除用户创建的 personas，保留系统内置的 (user_id = 0)
  try {
    db.run('DELETE FROM personas WHERE user_id != 0');
    log('  ✓ 清空表: personas (保留系统内置)', 'reset');
  } catch (err) {
    if (!err.message.includes('no such table')) {
      log(`  ⚠ 警告: 无法清空表 personas: ${err.message}`, 'yellow');
    }
  }

  // 特殊处理: 只删除测试用户，保留系统用户 (id = 0，如果存在)
  try {
    db.run('DELETE FROM users WHERE id != 0');
    log('  ✓ 清空表: users (保留系统用户)', 'reset');
  } catch (err) {
    if (!err.message.includes('no such table')) {
      log(`  ⚠ 警告: 无法清空表 users: ${err.message}`, 'yellow');
    }
  }

  log('✅ 旧数据清空完成\n', 'green');
}

/**
 * 创建测试用户
 */
async function seedUsers() {
  log('👤 创建测试用户...', 'cyan');

  const password = await bcrypt.hash('test123', 10);

  const users = [
    {
      email: 'test@example.com',
      username: 'Test User',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test'
    },
    {
      email: 'admin@example.com',
      username: 'Admin User',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
    },
    {
      email: 'demo@example.com',
      username: 'Demo User',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
    },
    {
      email: 'developer@example.com',
      username: 'Developer',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev'
    }
  ];

  const userIds = [];

  for (const user of users) {
    const stmt = db.prepare(
      'INSERT INTO users (email, password_hash, username, avatar_url) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(user.email, password, user.username, user.avatar_url);
    userIds.push(result.lastInsertRowid);
    stats.users++;
    log(`  ✓ ${user.email} (密码: test123)`, 'green');
  }

  log(`✅ 创建了 ${stats.users} 个用户\n`, 'green');
  return userIds;
}

/**
 * 创建对话和消息
 */
async function seedConversations(userIds) {
  log('💬 创建测试对话...', 'cyan');

  const conversations = [
    {
      userId: userIds[0],
      title: 'JavaScript 闭包详解',
      messages: [
        { role: 'user', content: '什么是闭包?能详细解释一下吗?' },
        { role: 'assistant', content: '闭包(Closure)是 JavaScript 中一个非常重要的概念。简单来说,闭包就是函数能够记住并访问其词法作用域,即使函数在词法作用域之外执行。\n\n让我举个例子:\n\n```javascript\nfunction outer() {\n  let count = 0;\n  \n  return function inner() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = outer();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n```\n\n在这个例子中,`inner` 函数形成了一个闭包,它可以访问 `outer` 函数中的 `count` 变量,即使 `outer` 函数已经执行完毕。' },
        { role: 'user', content: '闭包有什么实际应用场景?' },
        { role: 'assistant', content: '闭包在实际开发中有很多应用场景:\n\n1. **数据私有化**\n```javascript\nfunction createWallet() {\n  let balance = 0; // 私有变量\n  \n  return {\n    deposit: (amount) => balance += amount,\n    withdraw: (amount) => balance >= amount ? balance -= amount : 0,\n    getBalance: () => balance\n  };\n}\n```\n\n2. **函数工厂**\n```javascript\nfunction multiplier(factor) {\n  return (number) => number * factor;\n}\n\nconst double = multiplier(2);\nconst triple = multiplier(3);\n```\n\n3. **事件处理和回调**\n4. **模块模式**\n5. **防抖和节流函数**' }
      ]
    },
    {
      userId: userIds[0],
      title: 'React Hooks 最佳实践',
      messages: [
        { role: 'user', content: '能介绍一下 React Hooks 的最佳实践吗?' },
        { role: 'assistant', content: '当然!以下是 React Hooks 的一些最佳实践:\n\n1. **只在最顶层使用 Hook**\n不要在循环、条件或嵌套函数中调用 Hook。\n\n2. **只在 React 函数中调用 Hook**\n在 React 函数组件或自定义 Hook 中调用。\n\n3. **使用 ESLint 插件**\n```bash\nnpm install eslint-plugin-react-hooks\n```\n\n4. **合理使用 useEffect 依赖**\n```javascript\nuseEffect(() => {\n  fetchData(id);\n}, [id]); // 正确指定依赖\n```\n\n5. **提取自定义 Hook**\n当逻辑可复用时,提取为自定义 Hook。' }
      ]
    },
    {
      userId: userIds[0],
      title: 'PostgreSQL vs MySQL 性能对比',
      messages: [
        { role: 'user', content: 'PostgreSQL 和 MySQL 在性能上有什么区别?' },
        { role: 'assistant', content: 'PostgreSQL 和 MySQL 在性能上各有优势:\n\n**PostgreSQL 优势:**\n- 复杂查询性能更好\n- 并发写入性能优秀(MVCC)\n- 大数据量处理能力强\n- 全文搜索性能高\n\n**MySQL 优势:**\n- 简单读取查询速度快\n- 小型应用轻量级\n- Windows 平台性能好\n\n**性能对比(参考数据):**\n- 简单查询: MySQL 快 5-10%\n- 复杂JOIN: PostgreSQL 快 30-40%\n- 并发写入: PostgreSQL 快 60%\n- 全文搜索: PostgreSQL 快 5倍' }
      ]
    },
    {
      userId: userIds[1],
      title: 'Python 数据分析入门',
      messages: [
        { role: 'user', content: '如何开始学习 Python 数据分析?' },
        { role: 'assistant', content: 'Python 数据分析入门路线:\n\n**1. 基础库学习**\n- NumPy: 数值计算\n- Pandas: 数据处理\n- Matplotlib: 数据可视化\n\n**2. 简单示例**\n```python\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\n# 读取CSV\ndf = pd.read_csv(\'data.csv\')\n\n# 数据分析\nprint(df.describe())\nprint(df.groupby(\'category\').mean())\n\n# 可视化\ndf.plot(kind=\'bar\')\nplt.show()\n```\n\n**3. 学习资源**\n- 官方文档\n- Kaggle 竞赛\n- DataCamp 课程' }
      ]
    },
    {
      userId: userIds[2],
      title: '前端性能优化技巧',
      messages: [
        { role: 'user', content: '有哪些前端性能优化的技巧?' },
        { role: 'assistant', content: '前端性能优化技巧:\n\n**1. 资源优化**\n- 图片压缩和懒加载\n- 代码分割(Code Splitting)\n- Tree Shaking 去除死代码\n- Gzip/Brotli 压缩\n\n**2. 渲染优化**\n- 虚拟滚动\n- 防抖和节流\n- 使用 Web Workers\n- CSS 动画代替 JS\n\n**3. 网络优化**\n- CDN 加速\n- HTTP/2\n- 资源预加载\n- 缓存策略\n\n**4. React 优化**\n- React.memo\n- useMemo/useCallback\n- 懒加载组件' }
      ]
    }
  ];

  for (const conv of conversations) {
    const convId = generateUUID();

    db.run(
      'INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, datetime(\'now\'), datetime(\'now\'))',
      [convId, conv.userId, conv.title]
    );
    stats.conversations++;

    for (const msg of conv.messages) {
      db.run(
        'INSERT INTO messages (conversation_id, role, content, timestamp, status) VALUES (?, ?, ?, datetime(\'now\'), ?)',
        [convId, msg.role, msg.content, 'done']
      );
      stats.messages++;
    }

    log(`  ✓ ${conv.title} (${conv.messages.length} 条消息)`, 'green');
  }

  log(`✅ 创建了 ${stats.conversations} 个对话, ${stats.messages} 条消息\n`, 'green');
}

/**
 * 创建笔记数据
 */
async function seedNotes(userIds) {
  log('📝 创建测试笔记...', 'cyan');

  // 创建分类
  const categories = [
    { userId: userIds[0], name: '技术笔记', color: '#3b82f6' },
    { userId: userIds[0], name: '学习资料', color: '#10b981' },
    { userId: userIds[0], name: '项目文档', color: '#f59e0b' },
    { userId: userIds[0], name: '个人日记', color: '#ef4444' }
  ];

  for (const cat of categories) {
    db.run(
      'INSERT INTO note_categories (user_id, name, color) VALUES (?, ?, ?)',
      [cat.userId, cat.name, cat.color]
    );
  }

  // 创建笔记
  const notes = [
    {
      userId: userIds[0],
      title: 'PostgreSQL 安装配置指南',
      content: '# PostgreSQL 安装步骤\n\n## Windows 安装\n\n1. 下载安装包\n   - 访问: https://www.postgresql.org/download/windows/\n   - 选择最新稳定版本\n\n2. 运行安装程序\n   - 设置密码: chatbox2025\n   - 端口: 5432\n\n3. 配置数据库\n```sql\nCREATE USER chatbox_user WITH PASSWORD \'chatbox2025\';\nCREATE DATABASE personal_chatbox OWNER chatbox_user;\n```\n\n4. 测试连接\n```bash\npsql -U chatbox_user -d personal_chatbox\n```',
      category: '技术笔记',
      tags: '["database", "postgresql", "installation", "tutorial"]',
      isFavorite: 1
    },
    {
      userId: userIds[0],
      title: 'React Hooks 速查表',
      content: '# React Hooks 速查表\n\n## useState\n```jsx\nconst [state, setState] = useState(initialValue);\n```\n\n## useEffect\n```jsx\nuseEffect(() => {\n  // 副作用代码\n  return () => {\n    // 清理函数\n  };\n}, [dependencies]);\n```\n\n## useContext\n```jsx\nconst value = useContext(MyContext);\n```\n\n## useMemo\n```jsx\nconst memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);\n```\n\n## useCallback\n```jsx\nconst memoizedCallback = useCallback(() => {\n  doSomething(a, b);\n}, [a, b]);\n```\n\n## useRef\n```jsx\nconst refContainer = useRef(initialValue);\n```',
      category: '学习资料',
      tags: '["react", "hooks", "javascript", "cheatsheet"]',
      isFavorite: 1
    },
    {
      userId: userIds[0],
      title: '项目数据库设计文档',
      content: '# Personal Chatbox 数据库设计\n\n## 核心表结构\n\n### users 表\n- id: 用户ID\n- email: 邮箱\n- username: 用户名\n- avatar_url: 头像\n\n### conversations 表\n- id: 对话ID (UUID)\n- user_id: 用户ID\n- title: 对话标题\n\n### messages 表\n- id: 消息ID\n- conversation_id: 所属对话\n- role: 角色 (user/assistant)\n- content: 消息内容\n\n## 索引优化\n\n- idx_conversations_user_id\n- idx_messages_conversation_id\n- idx_messages_created_at',
      category: '项目文档',
      tags: '["database", "design", "documentation"]',
      isFavorite: 0
    },
    {
      userId: userIds[0],
      title: 'Git 常用命令',
      content: '# Git 常用命令速查\n\n## 基础操作\n```bash\n# 克隆仓库\ngit clone <url>\n\n# 查看状态\ngit status\n\n# 添加文件\ngit add .\ngit add <file>\n\n# 提交\ngit commit -m "message"\n\n# 推送\ngit push origin main\n\n# 拉取\ngit pull origin main\n```\n\n## 分支操作\n```bash\n# 创建分支\ngit branch <branch-name>\n\n# 切换分支\ngit checkout <branch-name>\n\n# 创建并切换\ngit checkout -b <branch-name>\n\n# 合并分支\ngit merge <branch-name>\n\n# 删除分支\ngit branch -d <branch-name>\n```\n\n## 撤销操作\n```bash\n# 撤销工作区修改\ngit checkout -- <file>\n\n# 撤销暂存区\ngit reset HEAD <file>\n\n# 回退版本\ngit reset --hard HEAD^\n```',
      category: '技术笔记',
      tags: '["git", "version-control", "cheatsheet"]',
      isFavorite: 1
    },
    {
      userId: userIds[0],
      title: '2025年学习计划',
      content: '# 2025年学习计划\n\n## Q1 (1-3月)\n- [ ] 完成 PostgreSQL 深入学习\n- [ ] 掌握 Docker 和 K8s\n- [ ] 学习 System Design\n\n## Q2 (4-6月)\n- [ ] 深入学习 React 源码\n- [ ] 学习 TypeScript 高级特性\n- [ ] 完成个人项目上线\n\n## Q3 (7-9月)\n- [ ] 学习算法和数据结构\n- [ ] LeetCode 刷题 100+\n- [ ] 准备技术面试\n\n## Q4 (10-12月)\n- [ ] 学习新技术栈\n- [ ] 写技术博客\n- [ ] 年度总结',
      category: '个人日记',
      tags: '["plan", "learning", "goals"]',
      isFavorite: 0,
      isArchived: 0
    }
  ];

  for (const note of notes) {
    const noteId = db.run(
      'INSERT INTO notes (user_id, title, content, category, tags, is_favorite, is_archived) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [note.userId, note.title, note.content, note.category, note.tags, note.isFavorite, note.isArchived || 0]
    ).lastInsertRowid;

    // 插入标签
    const tags = JSON.parse(note.tags);
    for (const tag of tags) {
      db.run('INSERT INTO note_tags (note_id, tag) VALUES (?, ?)', [noteId, tag]);
    }

    stats.notes++;
    log(`  ✓ ${note.title}`, 'green');
  }

  log(`✅ 创建了 ${stats.notes} 个笔记\n`, 'green');
}

/**
 * 创建文档数据
 */
async function seedDocuments(userIds) {
  log('📄 创建测试文档...', 'cyan');

  // 创建分类
  const categories = [
    { userId: userIds[0], name: '开发文档', color: '#3b82f6', icon: '📘' },
    { userId: userIds[0], name: '设计资源', color: '#f59e0b', icon: '🎨' },
    { userId: userIds[0], name: '学习资料', color: '#10b981', icon: '📚' }
  ];

  for (const cat of categories) {
    db.run(
      'INSERT INTO document_categories (user_id, name, color, icon) VALUES (?, ?, ?, ?)',
      [cat.userId, cat.name, cat.color, cat.icon]
    );
  }

  const documents = [
    {
      userId: userIds[0],
      title: 'React 官方文档',
      description: 'React 官方文档,学习 React 的最佳资源',
      url: 'https://react.dev',
      category: '开发文档',
      tags: '["react", "documentation", "official"]',
      icon: '⚛️',
      isFavorite: 1
    },
    {
      userId: userIds[0],
      title: 'MDN Web Docs',
      description: 'Mozilla 开发者网络,Web 开发权威参考',
      url: 'https://developer.mozilla.org',
      category: '开发文档',
      tags: '["web", "documentation", "reference"]',
      icon: '📖',
      isFavorite: 1
    },
    {
      userId: userIds[0],
      title: 'PostgreSQL 中文文档',
      description: 'PostgreSQL 数据库官方中文文档',
      url: 'http://www.postgres.cn/docs/14/',
      category: '开发文档',
      tags: '["database", "postgresql", "chinese"]',
      icon: '🐘',
      isFavorite: 0
    },
    {
      userId: userIds[0],
      title: 'Tailwind CSS',
      description: '实用优先的 CSS 框架',
      url: 'https://tailwindcss.com',
      category: '设计资源',
      tags: '["css", "framework", "design"]',
      icon: '🎨',
      isFavorite: 1
    },
    {
      userId: userIds[0],
      title: 'JavaScript.info',
      description: '现代 JavaScript 教程',
      url: 'https://javascript.info',
      category: '学习资料',
      tags: '["javascript", "tutorial", "learning"]',
      icon: '📚',
      isFavorite: 0
    }
  ];

  for (const doc of documents) {
    const docId = db.run(
      'INSERT INTO documents (user_id, title, description, url, category, tags, icon, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [doc.userId, doc.title, doc.description, doc.url, doc.category, doc.tags, doc.icon, doc.isFavorite]
    ).lastInsertRowid;

    // 插入标签
    const tags = JSON.parse(doc.tags);
    for (const tag of tags) {
      db.run('INSERT INTO document_tags (document_id, tag) VALUES (?, ?)', [docId, tag]);
    }

    stats.documents++;
    log(`  ✓ ${doc.title}`, 'green');
  }

  log(`✅ 创建了 ${stats.documents} 个文档\n`, 'green');
}

/**
 * 创建密码保险库数据
 */
async function seedPasswordVault(userIds) {
  log('🔐 创建密码保险库数据...', 'cyan');

  const passwords = [
    {
      userId: userIds[0],
      title: 'GitHub',
      username: 'test@example.com',
      encrypted_password: 'encrypted_github_password_123',
      url: 'https://github.com',
      category: 'development',
      notes: '主要开发账号',
      tags: 'development,git',
      favorite: 1
    },
    {
      userId: userIds[0],
      title: 'Gmail',
      username: 'test@example.com',
      encrypted_password: 'encrypted_gmail_password_456',
      url: 'https://mail.google.com',
      category: 'email',
      notes: '主邮箱',
      tags: 'email,google',
      favorite: 1
    },
    {
      userId: userIds[0],
      title: 'AWS Console',
      username: 'aws-admin',
      encrypted_password: 'encrypted_aws_password_789',
      url: 'https://console.aws.amazon.com',
      category: 'cloud',
      notes: 'AWS 管理控制台',
      tags: 'cloud,aws',
      favorite: 0
    }
  ];

  for (const pwd of passwords) {
    db.run(
      'INSERT INTO password_vault (user_id, title, username, encrypted_password, url, category, notes, tags, favorite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [pwd.userId, pwd.title, pwd.username, pwd.encrypted_password, pwd.url, pwd.category, pwd.notes, pwd.tags, pwd.favorite]
    );
    stats.passwords++;
    log(`  ✓ ${pwd.title}`, 'green');
  }

  log(`✅ 创建了 ${stats.passwords} 个密码条目\n`, 'green');
}

/**
 * 创建用户配置
 */
async function seedUserConfigs(userIds) {
  log('⚙️  创建用户配置...', 'cyan');

  const config = {
    model_config: JSON.stringify({
      default_model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 2000
    }),
    system_prompt: '你是一个友好、专业的 AI 助手。',
    api_keys: JSON.stringify({
      openai: 'sk-xxx',
      deepseek: 'sk-yyy'
    })
  };

  db.run(
    'INSERT INTO user_configs (user_id, model_config, system_prompt, api_keys) VALUES (?, ?, ?, ?)',
    [userIds[0], config.model_config, config.system_prompt, config.api_keys]
  );

  log('  ✓ 用户配置已创建', 'green');
  log('✅ 用户配置创建完成\n', 'green');
}

/**
 * 创建知识库数据
 */
async function seedKnowledgeBases(userIds) {
  log('📚 创建知识库数据...', 'cyan');

  const kbId = generateUUID();

  db.run(
    'INSERT INTO knowledge_bases (id, user_id, name, description, config) VALUES (?, ?, ?, ?, ?)',
    [kbId, userIds[0], 'JavaScript 技术文档', 'JavaScript 相关的技术文档和笔记', '{}']
  );

  const docId = generateUUID();
  db.run(
    'INSERT INTO knowledge_documents (id, knowledge_base_id, filename, file_path, file_type, file_size, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [docId, kbId, 'javascript-basics.pdf', '/uploads/kb/js-basics.pdf', 'pdf', 1024000, 'completed']
  );

  stats.knowledge_bases++;
  log('  ✓ JavaScript 技术文档', 'green');
  log(`✅ 创建了 ${stats.knowledge_bases} 个知识库\n`, 'green');
}

/**
 * 主函数
 */
async function main() {
  log('\n╔══════════════════════════════════════════════════════════╗', 'bright');
  log('║          Personal Chatbox 测试数据种子脚本               ║', 'bright');
  log('╚══════════════════════════════════════════════════════════╝\n', 'bright');

  try {
    // 检查数据库连接
    if (!db) {
      throw new Error('数据库连接失败');
    }

    // 清空旧数据
    await clearAllData();

    // 创建测试数据
    const userIds = await seedUsers();
    await seedConversations(userIds);
    await seedNotes(userIds);
    await seedDocuments(userIds);
    await seedPasswordVault(userIds);
    await seedUserConfigs(userIds);
    await seedKnowledgeBases(userIds);

    // 显示统计信息
    log('\n╔══════════════════════════════════════════════════════════╗', 'green');
    log('║                    ✅ 数据填充完成!                      ║', 'green');
    log('╚══════════════════════════════════════════════════════════╝\n', 'green');

    log('📊 数据统计:', 'cyan');
    log(`  • 用户: ${stats.users} 个`, 'blue');
    log(`  • 对话: ${stats.conversations} 个`, 'blue');
    log(`  • 消息: ${stats.messages} 条`, 'blue');
    log(`  • 笔记: ${stats.notes} 个`, 'blue');
    log(`  • 文档: ${stats.documents} 个`, 'blue');
    log(`  • 密码: ${stats.passwords} 个`, 'blue');
    log(`  • 知识库: ${stats.knowledge_bases} 个`, 'blue');

    log('\n🔑 测试账号信息:', 'cyan');
    log('  Email: test@example.com', 'yellow');
    log('  Password: test123', 'yellow');

    log('\n💡 提示:', 'cyan');
    log('  • 现在可以登录测试账号查看数据', 'reset');
    log('  • 如需重新填充数据,再次运行: npm run db:seed', 'reset');
    log('  • 如需清空数据,运行: npm run db:reset\n', 'reset');

    process.exit(0);
  } catch (error) {
    log('\n❌ 错误:', 'red');
    log(`  ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { main };
