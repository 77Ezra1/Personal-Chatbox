-- Migration: Add Prompt Workbooks and Templates System
-- Description: Multi-table workbook system for Prompt template management
-- Date: 2025-10-22

-- 1. Create prompt_workbooks table (工作簿/表格)
CREATE TABLE IF NOT EXISTS prompt_workbooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,                                  -- NULL for system workbooks
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📊',
  is_system INTEGER DEFAULT 0,                      -- 1 for system workbooks
  field_schema TEXT,                                -- JSON: field definitions
  view_config TEXT,                                 -- JSON: view configuration
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Create prompt_templates table (模板记录)
CREATE TABLE IF NOT EXISTS prompt_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workbook_id INTEGER NOT NULL,
  user_id INTEGER,                                  -- Redundant for query optimization
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  fields_data TEXT,                                 -- JSON: dynamic field data
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (workbook_id) REFERENCES prompt_workbooks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create user_template_favorites table (收藏)
CREATE TABLE IF NOT EXISTS user_template_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  workbook_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, workbook_id, template_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workbook_id) REFERENCES prompt_workbooks(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES prompt_templates(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workbooks_user ON prompt_workbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_workbooks_system ON prompt_workbooks(is_system);
CREATE INDEX IF NOT EXISTS idx_templates_workbook ON prompt_templates(workbook_id);
CREATE INDEX IF NOT EXISTS idx_templates_user ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_template_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_template ON user_template_favorites(template_id);

-- Insert system workbook with 10 sample templates
INSERT INTO prompt_workbooks (id, user_id, name, description, icon, is_system, field_schema, created_at, updated_at)
VALUES (
  1,
  NULL,
  '系统内置模板库',
  '精选的Prompt模板，帮助您快速开始',
  '🎯',
  1,
  '{"fields":[{"name":"id","displayName":"ID","type":"number","required":true,"editable":false},{"name":"name","displayName":"名称","type":"text","required":true,"editable":true},{"name":"content","displayName":"内容","type":"longtext","required":true,"editable":true},{"name":"tags","displayName":"标签","type":"tags","required":false,"editable":true},{"name":"description","displayName":"描述","type":"text","required":false,"editable":true},{"name":"created_at","displayName":"创建时间","type":"datetime","required":false,"editable":false},{"name":"updated_at","displayName":"更新时间","type":"datetime","required":false,"editable":false}]}',
  datetime('now'),
  datetime('now')
);

-- Insert 10 sample templates
INSERT INTO prompt_templates (workbook_id, user_id, name, content, fields_data, created_at, updated_at) VALUES
(1, NULL, '代码审查助手', '请帮我审查以下代码，重点关注：
1. 代码质量和最佳实践
2. 潜在的bug和安全问题
3. 性能优化建议
4. 代码可读性和维护性

代码：
```
[在这里粘贴您的代码]
```

请提供详细的审查意见和改进建议。', '{"tags":["编程","代码审查","开发"],"description":"用于代码审查和质量检查"}', datetime('now'), datetime('now')),

(1, NULL, '文章写作助手', '请帮我写一篇关于「主题」的文章，要求：
- 目标读者：[描述您的目标读者]
- 文章长度：[字数要求]
- 写作风格：[正式/轻松/专业等]
- 核心观点：[您想表达的核心内容]

请生成结构清晰、逻辑连贯的文章。', '{"tags":["写作","内容创作","文章"],"description":"帮助创作高质量文章"}', datetime('now'), datetime('now')),

(1, NULL, '英文翻译专家', '请将以下内容翻译成地道的英文，要求：
- 保持原意准确
- 使用自然流畅的表达
- 考虑文化差异
- 适当调整语序以符合英文习惯

原文：
[在这里粘贴需要翻译的中文]', '{"tags":["翻译","英文","语言"],"description":"中文到英文的专业翻译"}', datetime('now'), datetime('now')),

(1, NULL, '数据分析师', '请分析以下数据，并提供：
1. 数据总体趋势
2. 关键指标解读
3. 异常值识别
4. 可视化建议
5. 业务洞察和建议

数据：
[在这里粘贴您的数据]

请用清晰易懂的语言解释分析结果。', '{"tags":["分析","数据","商业智能"],"description":"数据分析和洞察生成"}', datetime('now'), datetime('now')),

(1, NULL, '创意头脑风暴', '我需要关于「主题」的创意想法，请帮我：
1. 从多个角度思考
2. 提供至少5个不同方向的创意
3. 每个创意包含核心概念和实现要点
4. 评估每个创意的可行性

主题：[描述您的创意需求]

请发挥想象力，提供独特且实用的想法。', '{"tags":["创意","头脑风暴","策划"],"description":"创意构思和方案生成"}', datetime('now'), datetime('now')),

(1, NULL, 'Bug调试助手', '我遇到了一个bug，请帮我分析和解决：

**问题描述：**
[详细描述bug现象]

**环境信息：**
- 编程语言/框架：
- 版本：
- 操作系统：

**相关代码：**
```
[粘贴相关代码]
```

**错误信息：**
```
[粘贴错误日志]
```

请提供可能的原因和解决方案。', '{"tags":["编程","调试","问题解决"],"description":"帮助定位和解决代码bug"}', datetime('now'), datetime('now')),

(1, NULL, '邮件撰写助手', '请帮我撰写一封专业邮件：

**收件人：** [职位/关系]
**目的：** [邮件目的]
**关键信息：** [需要传达的要点]
**语气：** [正式/友好/商务等]

请生成结构完整、措辞得当的邮件内容。', '{"tags":["写作","邮件","商务沟通"],"description":"专业邮件撰写"}', datetime('now'), datetime('now')),

(1, NULL, 'SQL查询优化', '请帮我优化以下SQL查询：

**原始查询：**
```sql
[粘贴您的SQL查询]
```

**数据库类型：** [MySQL/PostgreSQL/SQLite等]
**表结构：** [简要说明表结构]
**性能问题：** [描述当前遇到的性能问题]

请提供优化后的查询和优化思路说明。', '{"tags":["编程","数据库","SQL","性能优化"],"description":"SQL查询性能优化"}', datetime('now'), datetime('now')),

(1, NULL, '学习计划制定', '请帮我制定一个学习计划：

**学习目标：** [想学习的技能/知识]
**当前水平：** [初学者/有基础/进阶]
**可用时间：** [每天/每周可投入的时间]
**学习期限：** [期望达成目标的时间]

请提供：
1. 分阶段的学习路线图
2. 每个阶段的学习重点
3. 推荐的学习资源
4. 实践项目建议', '{"tags":["教育","学习","规划"],"description":"个性化学习计划制定"}', datetime('now'), datetime('now')),

(1, NULL, '面试准备助手', '请帮我准备面试：

**职位：** [目标职位]
**公司：** [公司名称/行业]
**面试类型：** [技术面试/行为面试/综合面试]

请提供：
1. 可能会问的常见问题（至少10个）
2. 每个问题的回答思路和要点
3. 需要准备的技术知识点
4. 面试注意事项和技巧

帮我做好充分准备。', '{"tags":["教育","职业发展","面试"],"description":"面试问题和答案准备"}', datetime('now'), datetime('now'));
