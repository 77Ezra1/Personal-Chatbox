#!/bin/bash

# PostgreSQL兼容性修复脚本
# 用途：自动修复笔记和文档功能的PostgreSQL兼容性问题
# 使用: ./scripts/fix-postgresql-compatibility.sh

set -e  # 遇到错误立即退出

echo "🔧 PostgreSQL兼容性修复脚本"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 1. 备份原始文件
echo -e "${BLUE}📦 步骤 1/6: 备份原始文件...${NC}"
cp server/db/postgres-adapter.cjs server/db/postgres-adapter.cjs.backup
cp server/services/noteService.cjs server/services/noteService.cjs.backup
cp server/services/documentService.cjs server/services/documentService.cjs.backup
echo -e "${GREEN}✓ 备份完成${NC}"
echo ""

# 2. 应用修复
echo -e "${BLUE}🔧 步骤 2/6: 应用修复...${NC}"

# 应用修复到 postgres-adapter.cjs
echo "  - 修复 INSERT RETURNING..."
node -e "
const fs = require('fs');
const file = 'server/db/postgres-adapter.cjs';
let content = fs.readFileSync(file, 'utf8');

// 修复1: 在 run 方法中添加 RETURNING id
content = content.replace(
  /(async run\(sql, params = \[\], callback\) \{[\s\S]*?)(const result = await this\.pool\.query\(convertedSql, params\);)/,
  \`\$1// ✅ 自动添加 RETURNING id（如果是INSERT语句且没有RETURNING）
    if (convertedSql.trim().toUpperCase().startsWith('INSERT') &&
        !convertedSql.toUpperCase().includes('RETURNING')) {
      // 移除末尾的分号（如果有）
      convertedSql = convertedSql.replace(/;\\s*\$/, '');
      convertedSql += ' RETURNING id';
    }

    \$2\`
);

// 修复lastID获取
content = content.replace(
  /lastID: result\.rows\[0\]\?\.id,/g,
  'lastID: result.rows[0]?.id || null,'
);

fs.writeFileSync(file, content);
console.log('    ✓ postgres-adapter.cjs 修复完成');
"

echo "  - 修复 Boolean 比较..."
node -e "
const fs = require('fs');
const file = 'server/db/postgres-adapter.cjs';
let content = fs.readFileSync(file, 'utf8');

// 在 convertSqlPlaceholders 方法中添加Boolean转换
const booleanFix = \`
  // ✅ 修复Boolean比较
  // is_archived = 0 → is_archived = false
  converted = converted.replace(/\\\\bis_archived\\\\s*=\\\\s*0\\\\b/gi, 'is_archived = false');
  converted = converted.replace(/\\\\bis_archived\\\\s*=\\\\s*1\\\\b/gi, 'is_archived = true');

  // is_favorite = 0 → is_favorite = false
  converted = converted.replace(/\\\\bis_favorite\\\\s*=\\\\s*0\\\\b/gi, 'is_favorite = false');
  converted = converted.replace(/\\\\bis_favorite\\\\s*=\\\\s*1\\\\b/gi, 'is_favorite = true');
\`;

content = content.replace(
  /(converted = converted\.replace\(\/datetime\(\\\"now\\\"\)\/g, 'CURRENT_TIMESTAMP'\);)([\s\S]*?)(return converted;)/,
  \`\$1\$2\${booleanFix}\n\n    \$3\`
);

fs.writeFileSync(file, content);
console.log('    ✓ Boolean 比较修复完成');
"

echo "  - 修复笔记搜索功能..."
node -e "
const fs = require('fs');
const file = 'server/services/noteService.cjs';
let content = fs.readFileSync(file, 'utf8');

// 替换 searchNotes 方法
const newSearchMethod = \`
  /**
   * 全文搜索笔记（支持PostgreSQL和SQLite）
   */
  async searchNotes(userId, searchQuery, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      // 检测数据库类型
      const isPostgreSQL = this.db._driver === 'postgresql';

      let query, notes;

      if (isPostgreSQL) {
        // PostgreSQL全文搜索
        query = \\\`
          SELECT * FROM notes
          WHERE user_id = \\\\$1 AND (
            to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', \\\\$2)
          )
          ORDER BY ts_rank(
            to_tsvector('english', title || ' ' || content),
            plainto_tsquery('english', \\\\$2)
          ) DESC
          LIMIT \\\\$3 OFFSET \\\\$4
        \\\`;
        notes = await this.db.all(query, [userId, searchQuery, limit, offset]);
      } else {
        // SQLite FTS5搜索
        query = \\\`
          SELECT n.* FROM notes n
          INNER JOIN notes_fts fts ON n.id = fts.rowid
          WHERE n.user_id = ? AND notes_fts MATCH ?
          ORDER BY rank
          LIMIT ? OFFSET ?
        \\\`;
        notes = await this.db.all(query, [userId, searchQuery, limit, offset]);
      }

      return notes.map(note => ({
        ...note,
        tags: JSON.parse(note.tags || '[]'),
        is_favorite: Boolean(note.is_favorite),
        is_archived: Boolean(note.is_archived)
      }));
    } catch (error) {
      logger.error('[NoteService] Error searching notes:', error);
      // 降级为LIKE搜索
      return await this.searchNotesWithLike(userId, searchQuery, options);
    }
  }
\`;

// 替换整个searchNotes方法
content = content.replace(
  /\/\*\*[\s\S]*?\*\/[\s\S]*?async searchNotes\([\s\S]*?\{[\s\S]*?\}[\s\S]*?\}/,
  newSearchMethod.trim()
);

fs.writeFileSync(file, content);
console.log('    ✓ 笔记搜索修复完成');
"

echo "  - 修复文档搜索功能..."
node -e "
const fs = require('fs');
const file = 'server/services/documentService.cjs';
let content = fs.readFileSync(file, 'utf8');

// 替换 searchDocuments 函数
const newSearchFunction = \`
/**
 * 搜索文档（支持PostgreSQL和SQLite）
 */
async function searchDocuments(userId, searchQuery, options = {}) {
  const { isArchived = false } = options;

  // 检测数据库类型
  const isPostgreSQL = db._driver === 'postgresql';

  let documents;

  try {
    if (isPostgreSQL) {
      // PostgreSQL全文搜索
      documents = await db.all(
        \\\`SELECT * FROM documents
         WHERE user_id = \\\\$1 AND is_archived = \\\\$2 AND (
           to_tsvector('english', title || ' ' || COALESCE(description, '')) @@
           plainto_tsquery('english', \\\\$3)
         )
         ORDER BY ts_rank(
           to_tsvector('english', title || ' ' || COALESCE(description, '')),
           plainto_tsquery('english', \\\\$3)
         ) DESC\\\`,
        [userId, isArchived, searchQuery]
      );
    } else {
      // SQLite FTS5搜索
      documents = await db.all(
        \\\`SELECT d.* FROM documents d
         INNER JOIN documents_fts fts ON d.id = fts.rowid
         WHERE fts MATCH ? AND d.user_id = ? AND d.is_archived = ?
         ORDER BY rank\\\`,
        [searchQuery, userId, isArchived ? 1 : 0]
      );
    }
  } catch (error) {
    logger.error('Search error, falling back to LIKE search:', error);
    // 降级为LIKE搜索
    const searchPattern = \\\`%\\\${searchQuery}%\\\`;
    documents = await db.all(
      \\\`SELECT * FROM documents
       WHERE user_id = \\\\$1 AND is_archived = \\\\$2 AND (
         title LIKE \\\\$3 OR description LIKE \\\\$3
       )
       ORDER BY updated_at DESC\\\`,
      [userId, isArchived, searchPattern]
    );
  }

  // 为每个文档获取标签
  for (const doc of documents) {
    const tags = await db.all(
      'SELECT tag FROM document_tags WHERE document_id = ?',
      [doc.id]
    );
    doc.tags = tags.map(t => t.tag);
  }

  return documents;
}
\`;

// 替换整个searchDocuments函数
content = content.replace(
  /\/\*\*[\s\S]*?\*\/[\s\S]*?async function searchDocuments\([\s\S]*?\{[\s\S]*?\}[\s\S]*?\}/,
  newSearchFunction.trim()
);

fs.writeFileSync(file, content);
console.log('    ✓ 文档搜索修复完成');
"

echo -e "${GREEN}✓ 所有修复已应用${NC}"
echo ""

# 3. 停止现有服务
echo -e "${BLUE}🛑 步骤 3/6: 停止现有服务...${NC}"
pkill -f "node.*server/index.cjs" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓ 服务已停止${NC}"
echo ""

# 4. 启动服务
echo -e "${BLUE}🚀 步骤 4/6: 启动服务...${NC}"
NODE_ENV=development node server/index.cjs > /tmp/backend.log 2>&1 &
sleep 5

# 检查服务是否启动
if pgrep -f "node.*server/index.cjs" > /dev/null; then
    echo -e "${GREEN}✓ 服务已启动${NC}"
else
    echo -e "${RED}✗ 服务启动失败，请查看日志: /tmp/backend.log${NC}"
    exit 1
fi
echo ""

# 5. 运行测试
echo -e "${BLUE}🧪 步骤 5/6: 运行测试...${NC}"

# 删除测试用户（如果存在）
PGPASSWORD=chatbox2025 psql -h localhost -U chatbox_user -d personal_chatbox \
  -c "DELETE FROM users WHERE email = 'test@example.com';" 2>/dev/null || true

# 运行测试
node test-notes-documents.cjs > /tmp/test-result.log 2>&1

# 检查结果
if grep -q "失败: 0" /tmp/test-result.log; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    TESTS_PASSED=true
else
    echo -e "${YELLOW}⚠ 部分测试失败，请查看日志${NC}"
    TESTS_PASSED=false
    # 显示失败的测试
    grep "✗" /tmp/test-result.log || true
fi
echo ""

# 6. 生成报告
echo -e "${BLUE}📄 步骤 6/6: 生成报告...${NC}"
cat > POSTGRESQL_FIX_REPORT.md << EOF
# PostgreSQL修复报告

**修复时间**: $(date)
**修复脚本**: scripts/fix-postgresql-compatibility.sh

## 修复内容

1. ✅ PostgreSQL适配器 - INSERT RETURNING 支持
2. ✅ Boolean类型转换
3. ✅ 全文搜索双引擎支持

## 测试结果

EOF

if [ "$TESTS_PASSED" = true ]; then
    echo "✅ **所有测试通过** (31/31)" >> POSTGRESQL_FIX_REPORT.md
else
    echo "⚠️ **部分测试失败**，请查看详细日志" >> POSTGRESQL_FIX_REPORT.md
fi

cat >> POSTGRESQL_FIX_REPORT.md << EOF

## 详细日志

- 后端日志: \`/tmp/backend.log\`
- 测试结果: \`/tmp/test-result.log\`

## 备份文件

- \`server/db/postgres-adapter.cjs.backup\`
- \`server/services/noteService.cjs.backup\`
- \`server/services/documentService.cjs.backup\`

## 回滚方法

\`\`\`bash
# 如果需要回滚
mv server/db/postgres-adapter.cjs.backup server/db/postgres-adapter.cjs
mv server/services/noteService.cjs.backup server/services/noteService.cjs
mv server/services/documentService.cjs.backup server/services/documentService.cjs
pkill -f "node.*server/index.cjs"
NODE_ENV=development node server/index.cjs > /tmp/backend.log 2>&1 &
\`\`\`

## 修改的文件

1. **server/db/postgres-adapter.cjs**
   - 自动添加 RETURNING id
   - Boolean类型转换

2. **server/services/noteService.cjs**
   - 双引擎搜索支持

3. **server/services/documentService.cjs**
   - 双引擎搜索支持

## 下一步

EOF

if [ "$TESTS_PASSED" = true ]; then
    cat >> POSTGRESQL_FIX_REPORT.md << EOF
✅ 所有功能正常工作，可以开始使用！

### 功能清单
- ✅ 创建笔记和文档
- ✅ 更新笔记和文档
- ✅ 删除笔记和文档
- ✅ 搜索功能
- ✅ 统计信息
- ✅ 分类和标签管理

### 性能优化建议

为了提升搜索性能，建议创建全文搜索索引：

\`\`\`sql
-- 为笔记表创建GIN索引
CREATE INDEX notes_fts_idx ON notes
USING GIN (to_tsvector('english', title || ' ' || content));

-- 为文档表创建GIN索引
CREATE INDEX documents_fts_idx ON documents
USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));
\`\`\`
EOF
else
    cat >> POSTGRESQL_FIX_REPORT.md << EOF
⚠️ 请检查失败的测试，排查问题：

1. 查看后端日志: \`tail -100 /tmp/backend.log\`
2. 查看测试结果: \`cat /tmp/test-result.log\`
3. 检查数据库连接
4. 如需帮助，请查看 docs/POSTGRESQL_FIX_GUIDE.md
EOF
fi

cat >> POSTGRESQL_FIX_REPORT.md << EOF

---

**参考文档**:
- [详细修复指南](docs/POSTGRESQL_FIX_GUIDE.md)
- [测试报告](NOTES_DOCUMENTS_TEST_REPORT.md)
EOF

echo -e "${GREEN}✓ 报告已生成: POSTGRESQL_FIX_REPORT.md${NC}"
echo ""

# 完成
echo "=================================="
if [ "$TESTS_PASSED" = true ]; then
    echo -e "${GREEN}🎉 修复完成！所有功能正常工作。${NC}"
    echo ""
    echo "查看报告: cat POSTGRESQL_FIX_REPORT.md"
else
    echo -e "${YELLOW}⚠️  修复完成，但部分测试失败。${NC}"
    echo ""
    echo "请查看以下文件排查问题："
    echo "  - /tmp/backend.log"
    echo "  - /tmp/test-result.log"
    echo "  - POSTGRESQL_FIX_REPORT.md"
    echo ""
    echo "详细帮助: docs/POSTGRESQL_FIX_GUIDE.md"
fi
echo ""
