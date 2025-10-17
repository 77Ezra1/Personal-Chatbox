# 快速修复指南 - PostgreSQL 兼容性

> **5分钟快速修复笔记和文档功能**

## 🚀 一键修复

```bash
# 运行自动修复脚本
chmod +x scripts/fix-postgresql-compatibility.sh
./scripts/fix-postgresql-compatibility.sh
```

这个脚本会自动：
1. ✅ 备份原始文件
2. ✅ 应用所有修复
3. ✅ 重启服务
4. ✅ 运行测试
5. ✅ 生成报告

## 📊 预期结果

修复成功后：
```
=== 测试结果 ===
总计: 31
通过: 31 ✅
失败: 0
```

## 🔧 问题概述

当前有3个PostgreSQL兼容性问题：

| 问题 | 症状 | 修复 |
|------|------|------|
| INSERT 缺少 RETURNING | 创建失败 | 自动添加 RETURNING id |
| Boolean 比较错误 | 查询失败 | 0/1 → false/true |
| 搜索语法不兼容 | 搜索不工作 | 双引擎支持 |

## 📚 详细文档

需要了解更多？查看：
- [完整修复指南](docs/POSTGRESQL_FIX_GUIDE.md) - 60页详细文档
- [测试报告](NOTES_DOCUMENTS_TEST_REPORT.md) - 问题分析
- [笔记功能文档](docs/NOTES_FEATURE.md)
- [文档管理文档](docs/DOCUMENTS_FEATURE.md)

## ❓ 常见问题

### Q: 脚本失败了怎么办？
```bash
# 查看错误日志
tail -100 /tmp/backend.log

# 手动回滚
mv server/db/postgres-adapter.cjs.backup server/db/postgres-adapter.cjs
mv server/services/noteService.cjs.backup server/services/noteService.cjs
mv server/services/documentService.cjs.backup server/services/documentService.cjs
```

### Q: 测试仍然失败？
1. 检查服务是否运行: `ps aux | grep "node.*server"`
2. 查看测试结果: `cat /tmp/test-result.log`
3. 查看详细指南: `docs/POSTGRESQL_FIX_GUIDE.md`

### Q: 如何验证修复成功？
```bash
# 运行测试
node test-notes-documents.cjs

# 应该看到: 通过: 31, 失败: 0
```

## 🎯 手动修复（可选）

如果不想用自动脚本，可以手动修复：

### 1. 修复 INSERT RETURNING (5分钟)
编辑 `server/db/postgres-adapter.cjs`，在 `run` 方法中添加：
```javascript
if (convertedSql.trim().toUpperCase().startsWith('INSERT') &&
    !convertedSql.toUpperCase().includes('RETURNING')) {
  convertedSql = convertedSql.replace(/;\s*$/, '');
  convertedSql += ' RETURNING id';
}
```

### 2. 修复 Boolean 比较 (3分钟)
同一文件，在 `convertSqlPlaceholders` 方法中添加：
```javascript
converted = converted.replace(/\bis_archived\s*=\s*0\b/gi, 'is_archived = false');
converted = converted.replace(/\bis_archived\s*=\s*1\b/gi, 'is_archived = true');
converted = converted.replace(/\bis_favorite\s*=\s*0\b/gi, 'is_favorite = false');
converted = converted.replace(/\bis_favorite\s*=\s*1\b/gi, 'is_favorite = true');
```

### 3. 修复搜索功能 (10分钟)
- 编辑 `server/services/noteService.cjs`
- 编辑 `server/services/documentService.cjs`
- 添加数据库类型检测和双引擎支持

详见：[完整修复指南](docs/POSTGRESQL_FIX_GUIDE.md#修复-3-全文搜索功能)

## 📞 获取帮助

- 📖 查看完整文档: `docs/POSTGRESQL_FIX_GUIDE.md`
- 🐛 提交 Issue: GitHub Issues
- 💬 查看常见问题: [修复指南 FAQ](docs/POSTGRESQL_FIX_GUIDE.md#常见问题)

---

**准备好了？**

```bash
./scripts/fix-postgresql-compatibility.sh
```

**修复只需要 2-3 分钟！** ⏱️
