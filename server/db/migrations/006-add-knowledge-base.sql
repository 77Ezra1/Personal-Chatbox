-- Migration: 添加知识库（RAG）系统支持
-- Version: 006
-- Created: 2025-10-15

-- 创建知识库表
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config TEXT, -- JSON 配置
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建知识库文档表
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id TEXT PRIMARY KEY,
  knowledge_base_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT DEFAULT 'processing', -- processing, completed, failed
  metadata TEXT, -- JSON 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE
);

-- 创建知识库文档块表
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding TEXT, -- 向量数据（JSON格式）
  metadata TEXT, -- JSON 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES knowledge_documents(id) ON DELETE CASCADE
);

-- 创建知识库引用表
CREATE TABLE IF NOT EXISTS knowledge_citations (
  id TEXT PRIMARY KEY,
  query_id TEXT NOT NULL,
  chunk_id TEXT NOT NULL,
  relevance_score REAL,
  citation_text TEXT,
  page_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chunk_id) REFERENCES knowledge_chunks(id) ON DELETE CASCADE
);

-- 创建知识库查询表
CREATE TABLE IF NOT EXISTS knowledge_queries (
  id TEXT PRIMARY KEY,
  knowledge_base_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  query_type TEXT DEFAULT 'search', -- search, question, analysis
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_user_id
  ON knowledge_bases(user_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_bases_created_at
  ON knowledge_bases(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_kb_id
  ON knowledge_documents(knowledge_base_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status
  ON knowledge_documents(status);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document_id
  ON knowledge_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks(embedding);

CREATE INDEX IF NOT EXISTS idx_knowledge_citations_query_id
  ON knowledge_citations(query_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_citations_chunk_id
  ON knowledge_citations(chunk_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_queries_kb_id
  ON knowledge_queries(knowledge_base_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_queries_user_id
  ON knowledge_queries(user_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_queries_created_at
  ON knowledge_queries(created_at DESC);
