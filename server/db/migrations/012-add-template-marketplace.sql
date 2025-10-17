-- Migration: 添加对话模板市场支持
-- Version: 012
-- Created: 2025-10-15

-- 模板市场表
CREATE TABLE IF NOT EXISTS template_marketplace (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT, -- JSON 标签数组
  preview_image TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  rating_average REAL DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES summary_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 模板分类表
CREATE TABLE IF NOT EXISTS template_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  parent_id TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES template_categories(id) ON DELETE CASCADE
);

-- 模板评分表
CREATE TABLE IF NOT EXISTS template_ratings (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL, -- 1-5星
  comment TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES summary_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (template_id, user_id) -- 每个用户只能评分一次
);

-- 模板收藏表
CREATE TABLE IF NOT EXISTS template_favorites (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES summary_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (template_id, user_id) -- 每个用户只能收藏一次
);

-- 模板使用记录表
CREATE TABLE IF NOT EXISTS template_usage_logs (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  conversation_id TEXT,
  usage_type TEXT NOT NULL, -- view, download, use
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES summary_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_template_marketplace_template_id ON template_marketplace(template_id);
CREATE INDEX IF NOT EXISTS idx_template_marketplace_user_id ON template_marketplace(user_id);
CREATE INDEX IF NOT EXISTS idx_template_marketplace_category ON template_marketplace(category);
CREATE INDEX IF NOT EXISTS idx_template_marketplace_is_featured ON template_marketplace(is_featured);
CREATE INDEX IF NOT EXISTS idx_template_marketplace_rating_average ON template_marketplace(rating_average);
CREATE INDEX IF NOT EXISTS idx_template_marketplace_download_count ON template_marketplace(download_count);
CREATE INDEX IF NOT EXISTS idx_template_marketplace_published_at ON template_marketplace(published_at);

CREATE INDEX IF NOT EXISTS idx_template_categories_parent_id ON template_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_template_categories_is_active ON template_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_template_categories_sort_order ON template_categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_template_ratings_template_id ON template_ratings(template_id);
CREATE INDEX IF NOT EXISTS idx_template_ratings_user_id ON template_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_template_ratings_rating ON template_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_template_ratings_created_at ON template_ratings(created_at);

CREATE INDEX IF NOT EXISTS idx_template_favorites_template_id ON template_favorites(template_id);
CREATE INDEX IF NOT EXISTS idx_template_favorites_user_id ON template_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_template_favorites_created_at ON template_favorites(created_at);

CREATE INDEX IF NOT EXISTS idx_template_usage_logs_template_id ON template_usage_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_logs_user_id ON template_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_logs_usage_type ON template_usage_logs(usage_type);
CREATE INDEX IF NOT EXISTS idx_template_usage_logs_created_at ON template_usage_logs(created_at);

-- 插入默认模板分类
INSERT OR IGNORE INTO template_categories (id, name, description, icon, color, sort_order) VALUES
('cat-business', '商务办公', '商务会议、工作报告、项目总结等模板', 'briefcase', '#3b82f6', 1),
('cat-education', '教育培训', '课程总结、学习笔记、教学计划等模板', 'book-open', '#10b981', 2),
('cat-creative', '创意写作', '故事创作、文案写作、创意策划等模板', 'lightbulb', '#f59e0b', 3),
('cat-technical', '技术开发', '技术文档、代码审查、项目总结等模板', 'code', '#8b5cf6', 4),
('cat-personal', '个人生活', '日记总结、旅行记录、生活规划等模板', 'heart', '#ef4444', 5),
('cat-research', '学术研究', '论文摘要、研究报告、学术讨论等模板', 'academic-cap', '#06b6d4', 6);

-- 插入示例模板到市场
INSERT OR IGNORE INTO template_marketplace (id, template_id, user_id, title, description, category, tags, is_featured, is_verified, download_count, rating_average, rating_count, view_count) VALUES
('market-1', 'template-meeting', 1, '专业会议总结模板', '专门用于会议记录的总结模板，包含会议主题、讨论内容、决策和行动项', 'cat-business', '["meeting", "business", "professional"]', TRUE, TRUE, 156, 4.8, 23, 342),
('market-2', 'template-interview', 1, '面试总结模板', '专门用于面试记录的总结模板，包含候选人信息、技术评估、面试表现等', 'cat-business', '["interview", "hr", "recruitment"]', TRUE, TRUE, 89, 4.6, 18, 234),
('market-3', 'template-brief', 1, '简短总结模板', '生成简洁明了的对话总结，适合快速了解对话内容', 'cat-personal', '["brief", "quick", "simple"]', FALSE, TRUE, 234, 4.4, 31, 456),
('market-4', 'template-detailed', 1, '详细总结模板', '生成内容全面的对话总结，包含细节和逻辑分析', 'cat-education', '["detailed", "comprehensive", "analysis"]', FALSE, TRUE, 178, 4.7, 25, 389),
('market-5', 'template-complete', 1, '完整总结模板', '生成深入分析的完整总结，包含见解和建议', 'cat-research', '["complete", "insight", "recommendation"]', FALSE, TRUE, 67, 4.5, 12, 123);

-- 插入示例评分
INSERT OR IGNORE INTO template_ratings (id, template_id, user_id, rating, comment, is_verified) VALUES
('rating-1', 'template-meeting', 1, 5, '非常实用的会议总结模板，结构清晰，使用方便', TRUE),
('rating-2', 'template-interview', 1, 4, '面试总结模板很好用，帮助我更好地记录面试过程', TRUE),
('rating-3', 'template-brief', 1, 4, '简短总结模板适合快速了解对话内容', TRUE),
('rating-4', 'template-detailed', 1, 5, '详细总结模板内容全面，分析深入', TRUE),
('rating-5', 'template-complete', 1, 4, '完整总结模板提供了很好的见解和建议', TRUE);

-- 插入示例收藏
INSERT OR IGNORE INTO template_favorites (id, template_id, user_id) VALUES
('fav-1', 'template-meeting', 1),
('fav-2', 'template-interview', 1),
('fav-3', 'template-detailed', 1);

-- 插入示例使用记录
INSERT OR IGNORE INTO template_usage_logs (id, template_id, user_id, conversation_id, usage_type) VALUES
('usage-1', 'template-meeting', 1, 'conv-1', 'use'),
('usage-2', 'template-interview', 1, 'conv-2', 'use'),
('usage-3', 'template-brief', 1, 'conv-3', 'view'),
('usage-4', 'template-detailed', 1, 'conv-4', 'download'),
('usage-5', 'template-complete', 1, 'conv-5', 'use');
