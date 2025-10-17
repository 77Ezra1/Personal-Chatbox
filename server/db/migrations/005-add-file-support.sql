-- Migration: 添加文件上传和解析支持
-- Version: 005
-- Created: 2025-10-15

-- 创建文件表
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  conversation_id TEXT,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'docx', 'xlsx', 'csv', 'txt', 'ppt', 'pptx'
  status TEXT DEFAULT 'uploaded', -- 'uploaded', 'parsing', 'parsed', 'error'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- 创建文件内容表
CREATE TABLE IF NOT EXISTS file_contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'text', 'table', 'image', 'metadata'
  content TEXT NOT NULL,
  page_number INTEGER,
  section_title TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- 创建文件解析结果表
CREATE TABLE IF NOT EXISTS file_parsing_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT NOT NULL,
  parsing_type TEXT NOT NULL, -- 'summary', 'keywords', 'tables', 'images'
  result TEXT NOT NULL,
  confidence REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_files_user_id
  ON files(user_id);

CREATE INDEX IF NOT EXISTS idx_files_conversation_id
  ON files(conversation_id);

CREATE INDEX IF NOT EXISTS idx_files_file_type
  ON files(file_type);

CREATE INDEX IF NOT EXISTS idx_files_status
  ON files(status);

CREATE INDEX IF NOT EXISTS idx_files_created_at
  ON files(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_contents_file_id
  ON file_contents(file_id);

CREATE INDEX IF NOT EXISTS idx_file_contents_content_type
  ON file_contents(content_type);

CREATE INDEX IF NOT EXISTS idx_file_parsing_results_file_id
  ON file_parsing_results(file_id);

CREATE INDEX IF NOT EXISTS idx_file_parsing_results_type
  ON file_parsing_results(parsing_type);
