-- 创建文档管理表
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  url TEXT NOT NULL,
  category TEXT DEFAULT 'uncategorized',
  tags TEXT DEFAULT '[]',
  icon TEXT DEFAULT '📄',
  is_favorite INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  last_visited_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建文档标签表（用于高效标签查询）
CREATE TABLE IF NOT EXISTS document_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 创建文档分类表（用于分类管理）
CREATE TABLE IF NOT EXISTS document_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT '📁',
  description TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_is_favorite ON documents(is_favorite);
CREATE INDEX IF NOT EXISTS idx_documents_is_archived ON documents(is_archived);
CREATE INDEX IF NOT EXISTS idx_documents_visit_count ON documents(visit_count DESC);
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON document_tags(tag);
CREATE INDEX IF NOT EXISTS idx_document_categories_user_id ON document_categories(user_id);

-- 创建全文搜索表（如果支持FTS5）
CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
  title,
  description,
  content=documents,
  content_rowid=id
);

-- 创建触发器以保持FTS表同步
CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(rowid, title, description) VALUES (new.id, new.title, new.description);
END;

CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, title, description) VALUES('delete', old.id, old.title, old.description);
END;

CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, title, description) VALUES('delete', old.id, old.title, old.description);
  INSERT INTO documents_fts(rowid, title, description) VALUES (new.id, new.title, new.description);
END;

-- 创建触发器以自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS documents_update_timestamp
AFTER UPDATE ON documents
FOR EACH ROW
BEGIN
  UPDATE documents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
