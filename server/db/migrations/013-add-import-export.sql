-- Migration: 添加导入导出增强支持
-- Version: 013
-- Created: 2025-10-15

-- 导出记录表
CREATE TABLE IF NOT EXISTS export_records (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  export_type TEXT NOT NULL, -- conversation, batch, full
  format TEXT NOT NULL, -- json, csv, markdown, pdf, txt, html
  file_path TEXT NOT NULL,
  file_size INTEGER,
  conversation_ids TEXT, -- JSON 对话ID数组
  export_options TEXT, -- JSON 导出选项
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP, -- 文件过期时间
  error_details TEXT, -- 错误详情
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 导入记录表
CREATE TABLE IF NOT EXISTS import_records (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  import_type TEXT NOT NULL, -- conversation, batch, full
  format TEXT NOT NULL, -- json, csv, markdown, txt
  file_path TEXT NOT NULL,
  file_size INTEGER,
  import_options TEXT, -- JSON 导入选项
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  error_details TEXT, -- JSON 错误详情
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 数据转换配置表
CREATE TABLE IF NOT EXISTS format_configs (
  id TEXT PRIMARY KEY,
  format_name TEXT NOT NULL,
  format_type TEXT NOT NULL, -- export, import
  config_json TEXT NOT NULL, -- JSON 配置
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_export_records_user_id ON export_records(user_id);
CREATE INDEX IF NOT EXISTS idx_export_records_export_type ON export_records(export_type);
CREATE INDEX IF NOT EXISTS idx_export_records_format ON export_records(format);
CREATE INDEX IF NOT EXISTS idx_export_records_status ON export_records(status);
CREATE INDEX IF NOT EXISTS idx_export_records_created_at ON export_records(created_at);
CREATE INDEX IF NOT EXISTS idx_export_records_expires_at ON export_records(expires_at);

CREATE INDEX IF NOT EXISTS idx_import_records_user_id ON import_records(user_id);
CREATE INDEX IF NOT EXISTS idx_import_records_import_type ON import_records(import_type);
CREATE INDEX IF NOT EXISTS idx_import_records_format ON import_records(format);
CREATE INDEX IF NOT EXISTS idx_import_records_status ON import_records(status);
CREATE INDEX IF NOT EXISTS idx_import_records_created_at ON import_records(created_at);

CREATE INDEX IF NOT EXISTS idx_format_configs_format_type ON format_configs(format_type);
CREATE INDEX IF NOT EXISTS idx_format_configs_is_default ON format_configs(is_default);

-- 插入默认格式配置
INSERT OR IGNORE INTO format_configs (id, format_name, format_type, config_json, is_default) VALUES
('config-json-export', 'JSON 导出', 'export', '{"includeMetadata": true, "includeFiles": false, "prettyPrint": true, "compression": false}', TRUE),
('config-csv-export', 'CSV 导出', 'export', '{"includeHeaders": true, "separator": ",", "encoding": "utf8", "dateFormat": "YYYY-MM-DD HH:mm:ss"}', TRUE),
('config-markdown-export', 'Markdown 导出', 'export', '{"includeMetadata": true, "includeTimestamps": true, "includeRoles": true, "toc": true}', TRUE),
('config-pdf-export', 'PDF 导出', 'export', '{"pageSize": "A4", "margins": {"top": 20, "right": 20, "bottom": 20, "left": 20}, "fontSize": 12, "lineHeight": 1.5}', TRUE),
('config-txt-export', 'TXT 导出', 'export', '{"encoding": "utf8", "lineEnding": "\\n", "includeTimestamps": true, "includeRoles": true}', TRUE),
('config-html-export', 'HTML 导出', 'export', '{"includeCSS": true, "includeJS": false, "responsive": true, "theme": "light"}', TRUE),
('config-json-import', 'JSON 导入', 'import', '{"validateSchema": true, "strictMode": false, "mergeStrategy": "skip", "createBackup": true}', TRUE),
('config-csv-import', 'CSV 导入', 'import', '{"delimiter": ",", "encoding": "utf8", "skipEmptyLines": true, "trimWhitespace": true}', TRUE),
('config-markdown-import', 'Markdown 导入', 'import', '{"parseMetadata": true, "extractCodeBlocks": true, "preserveFormatting": true}', TRUE),
('config-txt-import', 'TXT 导入', 'import', '{"encoding": "utf8", "lineEnding": "\\n", "splitBy": "conversation", "roleDetection": true}', TRUE);

-- 示例导入导出记录已移至 seed-database.cjs 脚本中
-- 运行 npm run db:seed 来填充测试数据
