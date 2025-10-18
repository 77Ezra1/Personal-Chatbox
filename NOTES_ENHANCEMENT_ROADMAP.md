# 笔记功能增强路线图

> 基于 Tauri SQLite 笔记模块的优秀设计，整理的功能增强方案

## 📋 目录

- [1. Slash 命令菜单系统](#1-slash-命令菜单系统)
- [2. SQLite FTS5 全文搜索](#2-sqlite-fts5-全文搜索)
- [3. AI 智能功能集成](#3-ai-智能功能集成)
- [4. 图片存储与嵌入](#4-图片存储与嵌入)
- [5. 实时自动保存](#5-实时自动保存)
- [6. UI/UX 优化](#6-uiux-优化)
- [7. 编辑器增强功能](#7-编辑器增强功能)

---

## 1. Slash 命令菜单系统

### 📖 功能描述
类似 Notion 的 `/` 命令菜单，在编辑器中输入 `/` 快速插入各种内容块。

### 🎯 实现目标
- 输入 `/` 弹出命令面板
- 支持模糊搜索过滤命令
- 键盘导航（上下箭头选择，回车确认）
- 支持自定义命令扩展

### 🛠️ 技术方案

#### 1.1 TipTap 扩展实现

```javascript
// src/components/notes/extensions/SlashCommands.js
import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import tippy from 'tippy.js';
import CommandsList from './CommandsList';

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
```

#### 1.2 命令列表组件

```jsx
// src/components/notes/extensions/CommandsList.jsx
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const COMMANDS = [
  {
    title: 'Heading 1',
    icon: 'H1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
    keywords: ['h1', 'heading', 'title'],
  },
  {
    title: 'Heading 2',
    icon: 'H2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
    keywords: ['h2', 'heading'],
  },
  {
    title: 'Heading 3',
    icon: 'H3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
    keywords: ['h3', 'heading'],
  },
  {
    title: 'Bullet List',
    icon: '•',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
    keywords: ['ul', 'list', 'bullet'],
  },
  {
    title: 'Numbered List',
    icon: '1.',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
    keywords: ['ol', 'list', 'number'],
  },
  {
    title: 'Quote',
    icon: '❝',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setBlockquote().run();
    },
    keywords: ['quote', 'blockquote'],
  },
  {
    title: 'Code Block',
    icon: '</>',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCodeBlock().run();
    },
    keywords: ['code', 'codeblock'],
  },
  {
    title: 'Divider',
    icon: '—',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
    keywords: ['hr', 'divider', 'line'],
  },
  {
    title: 'Table',
    icon: '⊞',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
    keywords: ['table', 'grid'],
  },
  {
    title: 'Task List',
    icon: '☑',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
    keywords: ['todo', 'task', 'checkbox'],
  },
];

export const CommandsList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState(COMMANDS);

  useEffect(() => {
    const query = props.query?.toLowerCase() || '';
    const filtered = COMMANDS.filter(cmd =>
      cmd.title.toLowerCase().includes(query) ||
      cmd.keywords.some(k => k.includes(query))
    );
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [props.query]);

  const selectItem = (index) => {
    const command = filteredCommands[index];
    if (command) {
      command.command(props);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + filteredCommands.length - 1) % filteredCommands.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % filteredCommands.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="slash-commands-menu">
      {filteredCommands.length > 0 ? (
        filteredCommands.map((cmd, index) => (
          <button
            key={cmd.title}
            className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => selectItem(index)}
          >
            <span className="command-icon">{cmd.icon}</span>
            <span className="command-title">{cmd.title}</span>
          </button>
        ))
      ) : (
        <div className="command-item disabled">No results</div>
      )}
    </div>
  );
});

CommandsList.displayName = 'CommandsList';
```

#### 1.3 样式文件

```css
/* src/components/notes/extensions/SlashCommands.css */
.slash-commands-menu {
  background: var(--background-elevated);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 4px;
  max-height: 400px;
  overflow-y: auto;
  min-width: 240px;
}

.command-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  color: var(--text-primary);
}

.command-item:hover,
.command-item.selected {
  background: var(--background-hover);
}

.command-item.disabled {
  opacity: 0.5;
  cursor: default;
}

.command-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.command-title {
  font-size: 14px;
}
```

#### 1.4 集成到编辑器

```jsx
// src/components/notes/MarkdownLikeEditor.jsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { SlashCommands } from './extensions/SlashCommands';

// ... 在 useEditor 配置中添加
const editor = useEditor({
  extensions: [
    StarterKit,
    SlashCommands,
    // ... 其他扩展
  ],
  // ...
});
```

### 📝 使用说明
1. 在编辑器中输入 `/` 触发命令菜单
2. 输入关键词过滤命令（如 `/h1` 或 `/heading`）
3. 使用上下箭头选择命令
4. 按 Enter 或点击执行命令

### ✅ 验收标准
- [ ] 输入 `/` 能弹出命令面板
- [ ] 支持模糊搜索和关键词过滤
- [ ] 键盘导航流畅，支持上下选择
- [ ] 所有命令能正确执行
- [ ] 样式美观，符合整体 UI 风格

---

## 2. SQLite FTS5 全文搜索

### 📖 功能描述
使用 SQLite FTS5（Full-Text Search）虚拟表提升搜索性能和准确度，支持中文分词和高级搜索语法。

### 🎯 实现目标
- 毫秒级搜索响应
- 支持中文分词和拼音搜索
- 高亮搜索结果
- 支持 AND/OR/NOT 布尔搜索
- 搜索结果按相关度排序

### 🛠️ 技术方案

#### 2.1 创建 FTS5 虚拟表

```javascript
// server/db/migrations/add-fts5-notes.cjs
module.exports = {
  up: async (db) => {
    // 创建 FTS5 虚拟表
    await db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
        title,
        content,
        category,
        tags,
        content='notes',
        content_rowid='id',
        tokenize='porter unicode61'
      );
    `);

    // 创建触发器：插入时同步到 FTS 表
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS notes_fts_insert AFTER INSERT ON notes
      BEGIN
        INSERT INTO notes_fts(rowid, title, content, category, tags)
        VALUES (new.id, new.title, new.content, new.category, new.tags);
      END;
    `);

    // 创建触发器：更新时同步到 FTS 表
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS notes_fts_update AFTER UPDATE ON notes
      BEGIN
        UPDATE notes_fts SET
          title = new.title,
          content = new.content,
          category = new.category,
          tags = new.tags
        WHERE rowid = new.id;
      END;
    `);

    // 创建触发器：删除时同步到 FTS 表
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS notes_fts_delete AFTER DELETE ON notes
      BEGIN
        DELETE FROM notes_fts WHERE rowid = old.id;
      END;
    `);

    // 初始化现有数据
    await db.exec(`
      INSERT INTO notes_fts(rowid, title, content, category, tags)
      SELECT id, title, content, category, tags FROM notes;
    `);

    console.log('✅ FTS5 search index created successfully');
  },

  down: async (db) => {
    await db.exec('DROP TRIGGER IF EXISTS notes_fts_delete');
    await db.exec('DROP TRIGGER IF EXISTS notes_fts_update');
    await db.exec('DROP TRIGGER IF EXISTS notes_fts_insert');
    await db.exec('DROP TABLE IF EXISTS notes_fts');
  },
};
```

#### 2.2 更新搜索服务

```javascript
// server/services/noteService.cjs
class NoteService {
  /**
   * FTS5 全文搜索
   * @param {string} userId - 用户ID
   * @param {string} query - 搜索关键词
   * @param {Object} options - 搜索选项
   */
  async searchNotesFTS(userId, query, options = {}) {
    const { limit = 50, offset = 0, category, tag } = options;

    // 构建 FTS5 搜索查询
    // 支持多关键词：AND 默认，OR 用 |，NOT 用 -
    const ftsQuery = query
      .trim()
      .split(/\s+/)
      .map(term => `"${term.replace(/"/g, '""')}"*`) // 前缀匹配
      .join(' OR '); // 多关键词 OR 搜索

    let sql = `
      SELECT
        n.*,
        bm25(notes_fts) as relevance_score,
        snippet(notes_fts, 1, '<mark>', '</mark>', '...', 32) as content_snippet
      FROM notes n
      INNER JOIN notes_fts ON notes_fts.rowid = n.id
      WHERE notes_fts MATCH ?
        AND n.user_id = ?
        AND n.is_archived = 0
    `;

    const params = [ftsQuery, userId];

    // 添加分类过滤
    if (category) {
      sql += ' AND n.category = ?';
      params.push(category);
    }

    // 添加标签过滤
    if (tag) {
      sql += ' AND (n.tags LIKE ? OR n.tags LIKE ? OR n.tags LIKE ? OR n.tags = ?)';
      params.push(`${tag},%`, `%,${tag},%`, `%,${tag}`, tag);
    }

    // 按相关度排序
    sql += ' ORDER BY relevance_score ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const notes = this.db.prepare(sql).all(...params);

      // 解析 tags
      return notes.map(note => ({
        ...note,
        tags: note.tags ? note.tags.split(',').map(t => t.trim()) : [],
      }));
    } catch (error) {
      console.error('[FTS5 Search] Error:', error);
      // 降级到普通搜索
      return this.searchNotesBasic(userId, query, options);
    }
  }

  /**
   * 基础搜索（降级方案）
   */
  async searchNotesBasic(userId, query, options = {}) {
    const { limit = 50, offset = 0 } = options;
    const searchPattern = `%${query}%`;

    const sql = `
      SELECT * FROM notes
      WHERE user_id = ?
        AND is_archived = 0
        AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const notes = this.db.prepare(sql).all(
      userId,
      searchPattern,
      searchPattern,
      searchPattern,
      limit,
      offset
    );

    return notes.map(note => ({
      ...note,
      tags: note.tags ? note.tags.split(',').map(t => t.trim()) : [],
    }));
  }
}
```

#### 2.3 前端搜索高亮

```jsx
// src/components/notes/SearchResults.jsx
import { useMemo } from 'react';

export function SearchResults({ notes, searchQuery }) {
  const highlightText = (text, query) => {
    if (!query || !text) return text;

    const terms = query.trim().split(/\s+/);
    let result = text;

    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    });

    return result;
  };

  return (
    <div className="search-results">
      {notes.map(note => (
        <div key={note.id} className="search-result-item">
          <h3 dangerouslySetInnerHTML={{
            __html: highlightText(note.title, searchQuery)
          }} />
          {note.content_snippet ? (
            <p className="snippet" dangerouslySetInnerHTML={{
              __html: note.content_snippet
            }} />
          ) : (
            <p className="snippet" dangerouslySetInnerHTML={{
              __html: highlightText(
                note.content.substring(0, 200) + '...',
                searchQuery
              )
            }} />
          )}
          <div className="meta">
            <span className="relevance">
              相关度: {Math.round((1 - note.relevance_score / 100) * 100)}%
            </span>
            <span className="category">{note.category}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### 2.4 搜索样式

```css
/* src/components/notes/SearchResults.css */
.search-result-item mark {
  background: var(--highlight-color, #fff59d);
  color: var(--text-primary);
  padding: 2px 4px;
  border-radius: 2px;
  font-weight: 500;
}

.snippet {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin: 8px 0;
}

.relevance {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--background-secondary);
  padding: 2px 8px;
  border-radius: 12px;
}
```

### 📝 高级搜索语法示例

```
# 基础搜索
React Hooks          → 搜索包含 "React" 或 "Hooks" 的笔记

# 精确短语搜索
"React Hooks"        → 精确匹配 "React Hooks" 短语

# AND 搜索（默认）
React AND TypeScript → 同时包含两个词

# OR 搜索
React OR Vue         → 包含任一词

# NOT 搜索
React NOT Vue        → 包含 React 但不包含 Vue

# 前缀搜索
Reac*                → 匹配 React, Reactive, Reactivate 等

# 组合搜索
(React OR Vue) AND TypeScript → 复杂布尔查询
```

### ✅ 验收标准
- [ ] FTS5 虚拟表创建成功
- [ ] 触发器能自动同步数据
- [ ] 搜索响应时间 < 100ms
- [ ] 搜索结果高亮准确
- [ ] 支持布尔搜索语法
- [ ] 降级机制正常工作

---

## 3. AI 智能功能集成

### 📖 功能描述
集成 AI 能力，提供智能摘要、大纲生成、文本改写、任务提取等功能。

### 🎯 实现目标
- 一键生成笔记摘要
- 自动提取笔记大纲
- AI 辅助改写和润色
- 自动提取待办事项
- 智能标签建议

### 🛠️ 技术方案

#### 3.1 AI 服务封装

```javascript
// server/services/aiService.cjs
class AIService {
  constructor(llmClient) {
    this.llm = llmClient; // 使用项目现有的 LLM 服务
  }

  /**
   * 生成笔记摘要
   */
  async generateSummary(noteContent) {
    const prompt = `请为以下笔记内容生成一个简洁的摘要（不超过150字）：

${noteContent}

摘要：`;

    const response = await this.llm.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    });

    return response.content.trim();
  }

  /**
   * 提取笔记大纲
   */
  async generateOutline(noteContent) {
    const prompt = `请为以下笔记内容生成一个结构化的大纲，使用 Markdown 格式：

${noteContent}

大纲：`;

    const response = await this.llm.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    return response.content.trim();
  }

  /**
   * 改写文本
   */
  async rewriteText(text, style = 'professional') {
    const stylePrompts = {
      professional: '使用专业、正式的语气',
      casual: '使用轻松、口语化的语气',
      concise: '使用简洁、精炼的语言',
      detailed: '使用详细、充分的描述',
    };

    const prompt = `请${stylePrompts[style]}改写以下文本，保持原意但优化表达：

${text}

改写后：`;

    const response = await this.llm.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: text.length * 2,
    });

    return response.content.trim();
  }

  /**
   * 提取待办事项
   */
  async extractTasks(noteContent) {
    const prompt = `请从以下笔记中提取所有待办事项，以 JSON 数组格式返回：

${noteContent}

返回格式：
[
  { "task": "任务描述", "priority": "high|medium|low", "deadline": "YYYY-MM-DD或null" }
]

JSON：`;

    const response = await this.llm.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 500,
    });

    try {
      const tasks = JSON.parse(response.content.trim());
      return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
      console.error('[AI] Failed to parse tasks:', error);
      return [];
    }
  }

  /**
   * 智能标签建议
   */
  async suggestTags(noteTitle, noteContent) {
    const prompt = `基于以下笔记的标题和内容，建议 3-5 个合适的标签（英文，小写，用逗号分隔）：

标题：${noteTitle}

内容：${noteContent.substring(0, 500)}...

标签：`;

    const response = await this.llm.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 100,
    });

    return response.content
      .trim()
      .split(/[,，]/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  /**
   * 智能问答
   */
  async answerQuestion(question, noteContent) {
    const prompt = `基于以下笔记内容回答问题：

笔记内容：
${noteContent}

问题：${question}

回答：`;

    const response = await this.llm.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    return response.content.trim();
  }
}

module.exports = AIService;
```

#### 3.2 API 路由

```javascript
// server/routes/ai-notes.cjs
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.cjs');
const AIService = require('../services/aiService.cjs');
const { llmClient } = require('../services/llm.cjs'); // 使用现有 LLM 服务

const aiService = new AIService(llmClient);

router.use(authMiddleware);

/**
 * 生成摘要
 * POST /api/ai/notes/summary
 * Body: { content: string }
 */
router.post('/notes/summary', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.length < 50) {
      return res.status(400).json({ error: 'Content too short for summary' });
    }

    const summary = await aiService.generateSummary(content);
    res.json({ success: true, summary });
  } catch (error) {
    console.error('[AI] Summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 生成大纲
 * POST /api/ai/notes/outline
 */
router.post('/notes/outline', async (req, res) => {
  try {
    const { content } = req.body;
    const outline = await aiService.generateOutline(content);
    res.json({ success: true, outline });
  } catch (error) {
    console.error('[AI] Outline error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 改写文本
 * POST /api/ai/notes/rewrite
 * Body: { text: string, style: 'professional'|'casual'|'concise'|'detailed' }
 */
router.post('/notes/rewrite', async (req, res) => {
  try {
    const { text, style = 'professional' } = req.body;
    const rewritten = await aiService.rewriteText(text, style);
    res.json({ success: true, text: rewritten });
  } catch (error) {
    console.error('[AI] Rewrite error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 提取任务
 * POST /api/ai/notes/tasks
 */
router.post('/notes/tasks', async (req, res) => {
  try {
    const { content } = req.body;
    const tasks = await aiService.extractTasks(content);
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('[AI] Tasks extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 标签建议
 * POST /api/ai/notes/suggest-tags
 */
router.post('/notes/suggest-tags', async (req, res) => {
  try {
    const { title, content } = req.body;
    const tags = await aiService.suggestTags(title, content);
    res.json({ success: true, tags });
  } catch (error) {
    console.error('[AI] Tag suggestion error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 智能问答
 * POST /api/ai/notes/qa
 */
router.post('/notes/qa', async (req, res) => {
  try {
    const { question, content } = req.body;
    const answer = await aiService.answerQuestion(question, content);
    res.json({ success: true, answer });
  } catch (error) {
    console.error('[AI] Q&A error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### 3.3 前端 AI 工具栏

```jsx
// src/components/notes/AIToolbar.jsx
import { useState } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';
import './AIToolbar.css';

export function AIToolbar({ noteContent, onInsert, onReplace }) {
  const [loading, setLoading] = useState(false);
  const [showRewriteMenu, setShowRewriteMenu] = useState(false);

  const handleSummary = async () => {
    if (!noteContent || noteContent.length < 50) {
      toast.error('Content too short for summary');
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post('/ai/notes/summary', {
        content: noteContent,
      });

      onInsert(`\n\n## 📝 Summary\n${data.summary}\n\n`);
      toast.success('Summary generated');
    } catch (error) {
      toast.error('Failed to generate summary');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOutline = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/ai/notes/outline', {
        content: noteContent,
      });

      onInsert(`\n\n## 📋 Outline\n${data.outline}\n\n`);
      toast.success('Outline generated');
    } catch (error) {
      toast.error('Failed to generate outline');
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async (style) => {
    if (!window.getSelection().toString()) {
      toast.error('Please select text to rewrite');
      return;
    }

    const selectedText = window.getSelection().toString();
    setLoading(true);
    try {
      const { data } = await apiClient.post('/ai/notes/rewrite', {
        text: selectedText,
        style,
      });

      onReplace(selectedText, data.text);
      toast.success('Text rewritten');
    } catch (error) {
      toast.error('Failed to rewrite text');
    } finally {
      setLoading(false);
      setShowRewriteMenu(false);
    }
  };

  const handleExtractTasks = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/ai/notes/tasks', {
        content: noteContent,
      });

      if (data.tasks.length === 0) {
        toast.info('No tasks found');
        return;
      }

      const taskList = data.tasks
        .map(t => `- [ ] ${t.task}${t.deadline ? ` (${t.deadline})` : ''}`)
        .join('\n');

      onInsert(`\n\n## ✅ Tasks\n${taskList}\n\n`);
      toast.success(`Extracted ${data.tasks.length} tasks`);
    } catch (error) {
      toast.error('Failed to extract tasks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-toolbar">
      <button
        className="ai-btn"
        onClick={handleSummary}
        disabled={loading}
        title="Generate summary"
      >
        🤖 Summary
      </button>

      <button
        className="ai-btn"
        onClick={handleOutline}
        disabled={loading}
        title="Generate outline"
      >
        📋 Outline
      </button>

      <div className="ai-btn-group">
        <button
          className="ai-btn"
          onClick={() => setShowRewriteMenu(!showRewriteMenu)}
          disabled={loading}
          title="Rewrite selected text"
        >
          ✏️ Rewrite
        </button>

        {showRewriteMenu && (
          <div className="rewrite-menu">
            <button onClick={() => handleRewrite('professional')}>Professional</button>
            <button onClick={() => handleRewrite('casual')}>Casual</button>
            <button onClick={() => handleRewrite('concise')}>Concise</button>
            <button onClick={() => handleRewrite('detailed')}>Detailed</button>
          </div>
        )}
      </div>

      <button
        className="ai-btn"
        onClick={handleExtractTasks}
        disabled={loading}
        title="Extract tasks"
      >
        ✅ Tasks
      </button>

      {loading && <span className="ai-loading">Processing...</span>}
    </div>
  );
}
```

#### 3.4 样式

```css
/* src/components/notes/AIToolbar.css */
.ai-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  margin-bottom: 12px;
}

.ai-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.ai-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.ai-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-btn-group {
  position: relative;
}

.rewrite-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  z-index: 100;
}

.rewrite-menu button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-primary);
}

.rewrite-menu button:hover {
  background: var(--background-hover);
}

.ai-loading {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 📝 使用场景

1. **生成摘要**: 长篇笔记快速总结关键内容
2. **提取大纲**: 自动生成层次化结构
3. **文本改写**: 调整语气、简化或扩展内容
4. **任务提取**: 从会议记录中提取待办事项
5. **标签建议**: 自动推荐分类标签

### ✅ 验收标准
- [ ] AI 服务正常响应（<5秒）
- [ ] 摘要准确反映原文主旨
- [ ] 大纲结构清晰合理
- [ ] 改写保持原意但改进表达
- [ ] 任务提取准确率 >80%
- [ ] 标签建议相关度高

---

## 4. 图片存储与嵌入

### 📖 功能描述
支持在笔记中插入图片，使用 DataURL 方式存储，实现完全离线的图片管理。

### 🎯 实现目标
- 支持拖拽上传图片
- 图片粘贴（Ctrl+V）
- 图片压缩优化
- 图片预览和编辑
- DataURL 存储（无需文件系统）

### 🛠️ 技术方案

#### 4.1 图片压缩工具

```javascript
// src/lib/imageUtils.js

/**
 * 压缩图片到指定大小
 * @param {File} file - 原始图片文件
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @param {number} quality - 质量 (0-1)
 * @returns {Promise<string>} DataURL
 */
export async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // 计算缩放比例
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 DataURL
        const dataURL = canvas.toDataURL('image/jpeg', quality);
        resolve(dataURL);
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 获取图片尺寸信息
 */
export async function getImageInfo(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: Math.round(dataURL.length * 0.75), // 估算字节大小
      });
    };
    img.onerror = reject;
    img.src = dataURL;
  });
}

/**
 * DataURL 转 Blob
 */
export function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}
```

#### 4.2 TipTap 图片扩展

```javascript
// src/components/notes/extensions/ImageUpload.js
import { Node } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { compressImage } from '@/lib/imageUtils';

export const ImageUpload = Node.create({
  name: 'image',

  group: 'block',

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', HTMLAttributes];
  },

  addCommands() {
    return {
      setImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('imageUpload'),
        props: {
          handlePaste(view, event) {
            const items = Array.from(event.clipboardData?.items || []);
            const imageItem = items.find(item => item.type.startsWith('image/'));

            if (imageItem) {
              event.preventDefault();
              const file = imageItem.getAsFile();

              compressImage(file).then(dataURL => {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: dataURL });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              });

              return true;
            }

            return false;
          },

          handleDrop(view, event) {
            const hasFiles = event.dataTransfer?.files?.length;

            if (!hasFiles) {
              return false;
            }

            const images = Array.from(event.dataTransfer.files).filter(file =>
              file.type.startsWith('image/')
            );

            if (images.length === 0) {
              return false;
            }

            event.preventDefault();

            const { schema } = view.state;
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });

            images.forEach(async (image) => {
              const dataURL = await compressImage(image);
              const node = schema.nodes.image.create({ src: dataURL });
              const transaction = view.state.tr.insert(coordinates.pos, node);
              view.dispatch(transaction);
            });

            return true;
          },
        },
      }),
    ];
  },
});
```

#### 4.3 图片上传按钮

```jsx
// src/components/notes/ImageUploadButton.jsx
import { useRef } from 'react';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageUtils';

export function ImageUploadButton({ editor }) {
  const fileInputRef = useRef(null);

  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // 检查文件大小（限制 10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    try {
      toast.loading('Compressing image...');
      const dataURL = await compressImage(file);

      editor.chain().focus().setImage({ src: dataURL }).run();
      toast.success('Image inserted');
    } catch (error) {
      console.error('Image compression error:', error);
      toast.error('Failed to insert image');
    } finally {
      // 重置 input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <button
        className="btn-icon"
        onClick={() => fileInputRef.current?.click()}
        title="Insert image"
      >
        🖼️
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageSelect}
      />
    </>
  );
}
```

#### 4.4 图片样式优化

```css
/* src/components/notes/ImageStyles.css */
.ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.ProseMirror img:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.ProseMirror img.ProseMirror-selectednode {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
}

/* 图片加载动画 */
.ProseMirror img[src^="data:image"] {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 📝 使用说明

1. **插入图片的三种方式**:
   - 点击工具栏的图片按钮选择文件
   - 直接拖拽图片到编辑器
   - 复制图片后 Ctrl+V 粘贴

2. **自动压缩**:
   - 图片会自动压缩到 1200x1200 以内
   - 质量设置为 80%
   - 超过 10MB 的图片会被拒绝

3. **存储方式**:
   - 使用 DataURL（Base64）存储
   - 直接保存在笔记内容中
   - 无需额外的文件系统管理

### ⚠️ 注意事项

- DataURL 会增加数据库大小（约 33% 膨胀）
- 建议单个笔记的图片总大小不超过 5MB
- 对于大量图片的场景，考虑使用对象存储（如 S3）

### ✅ 验收标准
- [ ] 支持拖拽上传
- [ ] 支持粘贴上传
- [ ] 图片自动压缩
- [ ] 图片正常显示和保存
- [ ] 加载性能良好

---

## 5. 实时自动保存

### 📖 功能描述
实现类似 Google Docs 的自动保存机制，避免用户丢失编辑内容。

### 🎯 实现目标
- 编辑后 3 秒自动保存
- 显示保存状态提示
- 网络断开时缓存到本地
- 冲突检测和解决

### 🛠️ 技术方案

#### 5.1 防抖保存 Hook

```javascript
// src/hooks/useAutoSave.js
import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';

/**
 * 自动保存 Hook
 * @param {Function} saveFn - 保存函数
 * @param {any} data - 要保存的数据
 * @param {number} delay - 防抖延迟（毫秒）
 */
export function useAutoSave(saveFn, data, delay = 3000) {
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [lastSaved, setLastSaved] = useState(null);
  const timerRef = useRef(null);
  const dataRef = useRef(data);
  const isSavingRef = useRef(false);

  // 更新数据引用
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setStatus('saving');

    try {
      await saveFn(dataRef.current);
      setStatus('saved');
      setLastSaved(new Date());

      // 2秒后恢复 idle 状态
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('[AutoSave] Error:', error);
      setStatus('error');

      // 保存到本地存储作为备份
      try {
        const backup = {
          data: dataRef.current,
          timestamp: Date.now(),
        };
        localStorage.setItem('note_backup', JSON.stringify(backup));
        toast.error('Failed to save. Backup saved locally.');
      } catch (e) {
        toast.error('Failed to save note');
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [saveFn]);

  // 防抖触发保存
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, delay, save]);

  // 页面关闭前保存
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (status === 'saving') {
        e.preventDefault();
        e.returnValue = 'Changes are being saved...';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);

  return {
    status,
    lastSaved,
    forceSave: save,
  };
}
```

#### 5.2 保存状态指示器

```jsx
// src/components/notes/SaveStatusIndicator.jsx
import { useMemo } from 'react';
import './SaveStatusIndicator.css';

export function SaveStatusIndicator({ status, lastSaved }) {
  const statusText = useMemo(() => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return '';
    }
  }, [status]);

  const lastSavedText = useMemo(() => {
    if (!lastSaved) return null;

    const now = Date.now();
    const diff = now - lastSaved.getTime();

    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else {
      return lastSaved.toLocaleTimeString();
    }
  }, [lastSaved]);

  if (!statusText && !lastSavedText) return null;

  return (
    <div className={`save-status save-status-${status}`}>
      <span className="status-icon">
        {status === 'saving' && '⏳'}
        {status === 'saved' && '✓'}
        {status === 'error' && '⚠'}
      </span>
      <span className="status-text">{statusText}</span>
      {lastSavedText && status !== 'saving' && (
        <span className="last-saved">{lastSavedText}</span>
      )}
    </div>
  );
}
```

#### 5.3 样式

```css
/* src/components/notes/SaveStatusIndicator.css */
.save-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  transition: all 0.3s;
}

.save-status-saving {
  background: rgba(255, 193, 7, 0.1);
  color: #ffa000;
}

.save-status-saved {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.save-status-error {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.status-icon {
  font-size: 14px;
  animation: none;
}

.save-status-saving .status-icon {
  animation: rotate 1s linear infinite;
}

.status-text {
  font-weight: 500;
}

.last-saved {
  opacity: 0.7;
  margin-left: 4px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

#### 5.4 集成到编辑器

```jsx
// src/components/notes/NoteEditor.jsx (更新后)
import { useAutoSave } from '@/hooks/useAutoSave';
import { SaveStatusIndicator } from './SaveStatusIndicator';

export function NoteEditor({ note, onSave, ... }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [category, setCategory] = useState(note?.category || 'default');
  const [tags, setTags] = useState(note?.tags || []);

  // 自动保存
  const { status, lastSaved, forceSave } = useAutoSave(
    async (data) => {
      if (!data.title.trim() && !data.content.trim()) return;
      await onSave(data);
    },
    { title, content, category, tags },
    3000 // 3秒延迟
  );

  // 手动保存快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        forceSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [forceSave]);

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title..."
        />

        {/* 保存状态指示器 */}
        <SaveStatusIndicator status={status} lastSaved={lastSaved} />

        <button onClick={forceSave}>Save Now</button>
      </div>

      {/* ... 编辑器内容 ... */}
    </div>
  );
}
```

#### 5.5 本地备份恢复

```jsx
// src/components/notes/BackupRecovery.jsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function BackupRecovery({ onRecover }) {
  const [backup, setBackup] = useState(null);

  useEffect(() => {
    const backupStr = localStorage.getItem('note_backup');
    if (backupStr) {
      try {
        const backup = JSON.parse(backupStr);
        const age = Date.now() - backup.timestamp;

        // 如果备份在 1 小时内
        if (age < 3600000) {
          setBackup(backup);
        } else {
          localStorage.removeItem('note_backup');
        }
      } catch (error) {
        console.error('[Backup] Parse error:', error);
      }
    }
  }, []);

  const handleRecover = () => {
    onRecover(backup.data);
    localStorage.removeItem('note_backup');
    setBackup(null);
    toast.success('Backup recovered');
  };

  const handleDiscard = () => {
    localStorage.removeItem('note_backup');
    setBackup(null);
    toast.info('Backup discarded');
  };

  if (!backup) return null;

  return (
    <div className="backup-recovery-banner">
      <div className="banner-content">
        <span className="banner-icon">💾</span>
        <div className="banner-text">
          <strong>Unsaved changes detected</strong>
          <span>We found a backup from {new Date(backup.timestamp).toLocaleString()}</span>
        </div>
      </div>
      <div className="banner-actions">
        <button className="btn-primary" onClick={handleRecover}>
          Recover
        </button>
        <button className="btn-secondary" onClick={handleDiscard}>
          Discard
        </button>
      </div>
    </div>
  );
}
```

### 📝 工作流程

1. **编辑触发**: 用户修改标题、内容、分类或标签
2. **防抖延迟**: 等待 3 秒无新编辑后触发保存
3. **保存执行**: 调用 API 保存到服务器
4. **状态更新**: 显示"Saving..." → "Saved" → 隐藏
5. **失败处理**: 网络错误时保存到 localStorage
6. **恢复机制**: 下次打开时提示恢复备份

### ✅ 验收标准
- [ ] 编辑后 3 秒自动保存
- [ ] 保存状态正确显示
- [ ] Ctrl+S 能立即保存
- [ ] 网络错误时能本地备份
- [ ] 页面刷新后能恢复备份
- [ ] 不会重复保存

---

## 6. UI/UX 优化

### 📖 功能描述
借鉴 v0.dev 风格，提升笔记界面的视觉效果和用户体验。

### 🎯 优化目标
- 暗色主题优化
- 毛玻璃效果
- 渐变色彩
- 平滑动画
- 响应式布局

### 🛠️ 技术方案

#### 6.1 主题变量优化

```css
/* src/styles/notes-theme.css */
:root {
  /* 背景色 - 深色主题 */
  --notes-bg-primary: #0f1419;
  --notes-bg-secondary: #1a1f28;
  --notes-bg-elevated: #222831;
  --notes-bg-hover: rgba(255, 255, 255, 0.05);

  /* 文字颜色 */
  --notes-text-primary: #e8eaed;
  --notes-text-secondary: #9aa0a6;
  --notes-text-tertiary: #5f6368;

  /* 边框 */
  --notes-border: rgba(255, 255, 255, 0.1);
  --notes-border-focus: rgba(103, 80, 164, 0.5);

  /* 渐变色 */
  --notes-gradient-purple: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --notes-gradient-blue: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  --notes-gradient-green: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  --notes-gradient-orange: linear-gradient(135deg, #fa709a 0%, #fee140 100%);

  /* 阴影 */
  --notes-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --notes-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
  --notes-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);

  /* 毛玻璃效果 */
  --notes-glass-bg: rgba(255, 255, 255, 0.05);
  --notes-glass-border: rgba(255, 255, 255, 0.1);
  --notes-glass-blur: blur(10px);
}

/* 亮色主题 */
[data-theme="light"] {
  --notes-bg-primary: #ffffff;
  --notes-bg-secondary: #f8f9fa;
  --notes-bg-elevated: #ffffff;
  --notes-bg-hover: rgba(0, 0, 0, 0.05);

  --notes-text-primary: #1f2937;
  --notes-text-secondary: #6b7280;
  --notes-text-tertiary: #9ca3af;

  --notes-border: rgba(0, 0, 0, 0.1);
  --notes-border-focus: rgba(103, 80, 164, 0.3);

  --notes-glass-bg: rgba(255, 255, 255, 0.8);
  --notes-glass-border: rgba(0, 0, 0, 0.1);
}
```

#### 6.2 笔记卡片设计

```css
/* src/pages/NotesPage.css (优化后) */
.note-card {
  position: relative;
  background: var(--notes-bg-elevated);
  border: 1px solid var(--notes-border);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* 毛玻璃效果 */
.note-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--notes-glass-bg);
  backdrop-filter: var(--notes-glass-blur);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 0;
}

.note-card:hover::before {
  opacity: 1;
}

.note-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--notes-shadow-lg);
  border-color: var(--notes-border-focus);
}

/* 渐变边框效果 */
.note-card.featured {
  background:
    linear-gradient(var(--notes-bg-elevated), var(--notes-bg-elevated)) padding-box,
    var(--notes-gradient-purple) border-box;
  border: 2px solid transparent;
}

.note-card-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.note-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--notes-text-primary);
  margin: 0;
  line-height: 1.4;
}

.note-card-category {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 500;
  background: var(--notes-gradient-blue);
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.note-card-content {
  position: relative;
  z-index: 1;
  color: var(--notes-text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin: 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-card-footer {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--notes-border);
}

.note-card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.note-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: var(--notes-bg-hover);
  color: var(--notes-text-secondary);
  border: 1px solid var(--notes-border);
}

.note-card-meta {
  font-size: 12px;
  color: var(--notes-text-tertiary);
}

/* 动画 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.note-card {
  animation: slideInUp 0.4s ease-out;
}

.note-card:nth-child(1) { animation-delay: 0.05s; }
.note-card:nth-child(2) { animation-delay: 0.1s; }
.note-card:nth-child(3) { animation-delay: 0.15s; }
.note-card:nth-child(4) { animation-delay: 0.2s; }
.note-card:nth-child(5) { animation-delay: 0.25s; }
```

#### 6.3 编辑器样式优化

```css
/* src/components/notes/NoteEditor.css (优化后) */
.note-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--notes-bg-primary);
  border-radius: 16px;
  overflow: hidden;
}

.note-title-input {
  font-size: 32px;
  font-weight: 700;
  color: var(--notes-text-primary);
  background: transparent;
  border: none;
  outline: none;
  padding: 16px 24px;
  font-family: inherit;
  transition: all 0.3s;
}

.note-title-input:focus {
  background: var(--notes-bg-hover);
}

.note-title-input::placeholder {
  color: var(--notes-text-tertiary);
  opacity: 0.5;
}

.note-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: var(--notes-glass-bg);
  backdrop-filter: var(--notes-glass-blur);
  border-bottom: 1px solid var(--notes-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.format-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--notes-border);
  background: transparent;
  color: var(--notes-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.format-button:hover {
  background: var(--notes-bg-hover);
  border-color: var(--notes-border-focus);
  transform: translateY(-2px);
}

.format-button.active {
  background: var(--notes-gradient-purple);
  color: white;
  border-color: transparent;
}

/* 编辑器内容区 */
.ProseMirror {
  padding: 24px;
  color: var(--notes-text-primary);
  min-height: 500px;
  outline: none;
  font-size: 16px;
  line-height: 1.7;
}

.ProseMirror h1 {
  font-size: 2em;
  font-weight: 700;
  margin: 1em 0 0.5em;
  background: var(--notes-gradient-purple);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ProseMirror h2 {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0.8em 0 0.4em;
  color: var(--notes-text-primary);
  border-bottom: 2px solid var(--notes-border);
  padding-bottom: 0.3em;
}

.ProseMirror blockquote {
  border-left: 4px solid;
  border-image: var(--notes-gradient-blue) 1;
  padding-left: 16px;
  margin: 16px 0;
  color: var(--notes-text-secondary);
  font-style: italic;
  background: var(--notes-glass-bg);
  border-radius: 0 8px 8px 0;
}

.ProseMirror code {
  background: var(--notes-bg-elevated);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  color: #e06c75;
}

.ProseMirror pre {
  background: var(--notes-bg-elevated);
  border: 1px solid var(--notes-border);
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}
```

### 📝 设计特点

1. **深色优先**: 现代化的深色配色，减轻眼睛疲劳
2. **毛玻璃效果**: 使用 backdrop-filter 创造层次感
3. **渐变点缀**: 关键元素使用渐变色突出重点
4. **流畅动画**: 使用 cubic-bezier 缓动函数
5. **细节打磨**: 圆角、阴影、间距精心调整

### ✅ 验收标准
- [ ] 暗色主题视觉舒适
- [ ] 毛玻璃效果正常显示
- [ ] 动画流畅无卡顿
- [ ] 响应式布局适配
- [ ] 色彩对比度符合 WCAG 标准

---

## 7. 编辑器增强功能

### 📖 功能描述
额外的编辑器功能，提升写作体验。

### 🎯 实现目标
- 字数统计
- 阅读时间估算
- Markdown 快捷键
- 表格支持
- 任务列表
- 代码高亮

### 🛠️ 技术方案

#### 7.1 字数统计

```jsx
// src/components/notes/WordCounter.jsx
import { useMemo } from 'react';

export function WordCounter({ content }) {
  const stats = useMemo(() => {
    const text = content.replace(/<[^>]*>/g, ''); // 移除 HTML 标签

    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;

    // 英文单词计数
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;

    // 中文字符计数
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;

    // 阅读时间估算（中文 300字/分钟，英文 200词/分钟）
    const readingTime = Math.ceil(
      (chineseChars / 300) + ((words - chineseChars) / 200)
    );

    return {
      characters,
      charactersNoSpaces,
      words,
      chineseChars,
      readingTime,
    };
  }, [content]);

  return (
    <div className="word-counter">
      <span title="Words">{stats.words} words</span>
      <span className="separator">•</span>
      <span title="Characters">{stats.characters} chars</span>
      <span className="separator">•</span>
      <span title="Reading time">~{stats.readingTime} min read</span>
    </div>
  );
}
```

#### 7.2 Markdown 快捷键提示

```jsx
// src/components/notes/MarkdownGuide.jsx
export function MarkdownGuide() {
  const shortcuts = [
    { key: '# ', desc: 'Heading 1' },
    { key: '## ', desc: 'Heading 2' },
    { key: '### ', desc: 'Heading 3' },
    { key: '- ', desc: 'Bullet list' },
    { key: '1. ', desc: 'Numbered list' },
    { key: '- [ ] ', desc: 'Task list' },
    { key: '> ', desc: 'Blockquote' },
    { key: '```', desc: 'Code block' },
    { key: '---', desc: 'Divider' },
    { key: '**text**', desc: 'Bold' },
    { key: '*text*', desc: 'Italic' },
    { key: '`code`', desc: 'Inline code' },
  ];

  return (
    <div className="markdown-guide">
      <h3>Markdown Shortcuts</h3>
      <div className="shortcuts-grid">
        {shortcuts.map((s, i) => (
          <div key={i} className="shortcut-item">
            <code>{s.key}</code>
            <span>{s.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 7.3 TipTap 扩展包

```javascript
// src/components/notes/extensions/index.js
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';

// 注册常用语言
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';

lowlight.registerLanguage('javascript', javascript);
lowlight.registerLanguage('typescript', typescript);
lowlight.registerLanguage('python', python);
lowlight.registerLanguage('java', java);
lowlight.registerLanguage('go', go);
lowlight.registerLanguage('rust', rust);

export const extensions = [
  StarterKit,

  // 表格
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,

  // 任务列表
  TaskList,
  TaskItem.configure({
    nested: true,
  }),

  // 高亮
  Highlight.configure({
    multicolor: true,
  }),

  // 排版优化
  Typography,

  // 占位符
  Placeholder.configure({
    placeholder: 'Start writing... Type / for commands',
  }),

  // 字数统计
  CharacterCount,

  // 代码高亮
  CodeBlockLowlight.configure({
    lowlight,
  }),
];
```

### 📝 功能清单

- [x] 字数统计和阅读时间
- [x] Markdown 快捷键支持
- [x] 表格插入和编辑
- [x] 任务列表（checkbox）
- [x] 代码高亮（支持多语言）
- [x] 文本高亮标记
- [x] 排版优化（智能引号、破折号）

---

## 📅 实施时间表

### Phase 1: 基础增强 (1周)
- [ ] Slash 命令菜单
- [ ] 字数统计
- [ ] Markdown 快捷键

### Phase 2: 搜索优化 (1周)
- [ ] FTS5 虚拟表
- [ ] 搜索高亮
- [ ] 高级搜索语法

### Phase 3: 自动化 (1周)
- [ ] 实时自动保存
- [ ] 本地备份恢复
- [ ] 冲突检测

### Phase 4: AI 集成 (2周)
- [ ] 摘要生成
- [ ] 大纲提取
- [ ] 文本改写
- [ ] 任务提取
- [ ] 标签建议

### Phase 5: 体验优化 (1周)
- [ ] UI/UX 优化
- [ ] 图片上传
- [ ] 性能优化

---

## 🔧 技术栈

- **前端框架**: React 18
- **编辑器**: TipTap (ProseMirror)
- **数据库**: SQLite3 (better-sqlite3)
- **搜索**: SQLite FTS5
- **AI**: 项目现有 LLM 服务
- **样式**: CSS Variables + Animations
- **状态管理**: React Hooks

---

## 📊 成功指标

### 性能指标
- [ ] 搜索响应时间 < 100ms
- [ ] 自动保存延迟 3s
- [ ] AI 响应时间 < 5s
- [ ] 页面加载时间 < 2s

### 用户体验
- [ ] Slash 命令使用率 > 30%
- [ ] 自动保存成功率 > 99%
- [ ] AI 功能满意度 > 80%
- [ ] 整体流畅度评分 > 4.5/5

---

## 🚨 注意事项

### 数据库性能
- FTS5 索引会增加 30-50% 数据库大小
- 定期运行 `VACUUM` 优化数据库
- 监控查询性能，必要时添加索引

### AI 成本控制
- 设置 token 限制
- 缓存常见请求
- 提供降级方案（关闭 AI）

### 图片存储
- DataURL 会显著增加数据库大小
- 建议单笔记图片总量 < 5MB
- 考虑升级到对象存储（S3/OSS）

### 兼容性
- Safari 需要 `-webkit-` 前缀
- 部分 CSS 特性需 polyfill
- 测试移动端适配

---

## 📚 参考资料

- [TipTap 官方文档](https://tiptap.dev/docs)
- [SQLite FTS5 文档](https://www.sqlite.org/fts5.html)
- [ProseMirror 指南](https://prosemirror.net/docs/guide/)
- [v0.dev UI 设计](https://v0.dev/)
- [Notion 编辑器分析](https://www.notion.so/)

---

## 🎯 总结

本文档整理了 7 个主要的笔记功能增强方向，每个方向都包含：

1. ✅ **详细的技术方案** - 完整的代码实现
2. ✅ **样式设计** - CSS 和 UI 规范
3. ✅ **使用说明** - 用户指南和最佳实践
4. ✅ **验收标准** - 明确的完成定义

建议按照 Phase 1 → Phase 5 的顺序逐步实施，每个 Phase 完成后进行测试和用户反馈收集，确保功能稳定性和用户满意度。

如需开始实施某个功能，可以直接使用本文档中的代码模板，根据实际项目结构进行调整即可。
