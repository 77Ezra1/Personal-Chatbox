/**
 * 文档管理服务
 * 提供文档的增删改查、分类管理、标签管理等功能
 */

const { db } = require('../db/init.cjs');
const { createLogger } = require('../lib/logger.cjs');

const logger = createLogger('DocumentService');

/**
 * 获取���户的所有文档
 */
async function getAllDocuments(userId, options = {}) {
  
  const {
    category,
    tag,
    isFavorite,
    isArchived = false,
    sortBy = 'updated_at',
    sortOrder = 'DESC'
  } = options;

  let query = 'SELECT * FROM documents WHERE user_id = ? AND is_archived = ?';
  const params = [userId, isArchived ? 1 : 0];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (isFavorite !== undefined) {
    query += ' AND is_favorite = ?';
    params.push(isFavorite ? 1 : 0);
  }

  if (tag) {
    query = `
      SELECT DISTINCT d.* FROM documents d
      INNER JOIN document_tags dt ON d.id = dt.document_id
      WHERE d.user_id = ? AND d.is_archived = ? AND dt.tag = ?
    `;
    params.push(tag);
  }

  const validSortFields = ['created_at', 'updated_at', 'title', 'visit_count', 'last_visited_at'];
  const validSortOrders = ['ASC', 'DESC'];

  const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'updated_at';
  const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

  query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

  const documents = await db.all(query, params);

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

/**
 * 根据ID获取文档
 */
async function getDocumentById(userId, documentId) {
  

  const document = await db.get(
    'SELECT * FROM documents WHERE id = ? AND user_id = ?',
    [documentId, userId]
  );

  if (!document) {
    return null;
  }

  // 获取标签
  const tags = await db.all(
    'SELECT tag FROM document_tags WHERE document_id = ?',
    [documentId]
  );
  document.tags = tags.map(t => t.tag);

  return document;
}

/**
 * 创建新文档
 */
async function createDocument(userId, documentData) {
  
  const {
    title,
    description = '',
    url,
    category = 'uncategorized',
    tags = [],
    icon = '📄',
    is_favorite = false,
    is_archived = false
  } = documentData;

  const result = await db.run(
    `INSERT INTO documents (user_id, title, description, url, category, icon, is_favorite, is_archived)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, title, description, url, category, icon, is_favorite ? 1 : 0, is_archived ? 1 : 0]
  );

  const documentId = result.lastID;

  // 添加标签
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      await db.run(
        'INSERT INTO document_tags (document_id, tag) VALUES (?, ?)',
        [documentId, tag]
      );
    }
  }

  // 确保分类存在
  if (category && category !== 'uncategorized') {
    // 检测数据库类型
    const isPostgreSQL = db._driver === 'postgresql';

    if (isPostgreSQL) {
      // PostgreSQL: 使用 ON CONFLICT DO NOTHING
      await db.run(
        `INSERT INTO document_categories (user_id, name)
         VALUES (?, ?)
         ON CONFLICT (user_id, name) DO NOTHING`,
        [userId, category]
      );
    } else {
      // SQLite: 使用 INSERT OR IGNORE
      await db.run(
        `INSERT OR IGNORE INTO document_categories (user_id, name)
         VALUES (?, ?)`,
        [userId, category]
      );
    }
  }

  return getDocumentById(userId, documentId);
}

/**
 * 更新文档
 */
async function updateDocument(userId, documentId, updates) {
  

  const document = await getDocumentById(userId, documentId);
  if (!document) {
    throw new Error('Document not found');
  }

  const {
    title,
    description,
    url,
    category,
    icon,
    is_favorite,
    is_archived,
    tags
  } = updates;

  const fields = [];
  const params = [];

  if (title !== undefined) {
    fields.push('title = ?');
    params.push(title);
  }
  if (description !== undefined) {
    fields.push('description = ?');
    params.push(description);
  }
  if (url !== undefined) {
    fields.push('url = ?');
    params.push(url);
  }
  if (category !== undefined) {
    fields.push('category = ?');
    params.push(category);

    // 确保分类存在
    if (category !== 'uncategorized') {
      // 检测数据库类型
      const isPostgreSQL = db._driver === 'postgresql';

      if (isPostgreSQL) {
        // PostgreSQL: 使用 ON CONFLICT DO NOTHING
        await db.run(
          `INSERT INTO document_categories (user_id, name)
           VALUES (?, ?)
           ON CONFLICT (user_id, name) DO NOTHING`,
          [userId, category]
        );
      } else {
        // SQLite: 使用 INSERT OR IGNORE
        await db.run(
          `INSERT OR IGNORE INTO document_categories (user_id, name)
           VALUES (?, ?)`,
          [userId, category]
        );
      }
    }
  }
  if (icon !== undefined) {
    fields.push('icon = ?');
    params.push(icon);
  }
  if (is_favorite !== undefined) {
    fields.push('is_favorite = ?');
    params.push(is_favorite ? 1 : 0);
  }
  if (is_archived !== undefined) {
    fields.push('is_archived = ?');
    params.push(is_archived ? 1 : 0);
  }

  if (fields.length > 0) {
    params.push(documentId, userId);
    await db.run(
      `UPDATE documents SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
  }

  // 更新标签
  if (tags !== undefined) {
    await db.run('DELETE FROM document_tags WHERE document_id = ?', [documentId]);

    if (tags.length > 0) {
      for (const tag of tags) {
        await db.run(
          'INSERT INTO document_tags (document_id, tag) VALUES (?, ?)',
          [documentId, tag]
        );
      }
    }
  }

  return getDocumentById(userId, documentId);
}

/**
 * 删除文档
 */
async function deleteDocument(userId, documentId) {
  

  const document = await getDocumentById(userId, documentId);
  if (!document) {
    throw new Error('Document not found');
  }

  await db.run('DELETE FROM documents WHERE id = ? AND user_id = ?', [documentId, userId]);

  return { success: true };
}

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
        `SELECT * FROM documents
         WHERE user_id = $1 AND is_archived = $2 AND (
           to_tsvector('english', title || ' ' || COALESCE(description, '')) @@
           plainto_tsquery('english', $3)
         )
         ORDER BY ts_rank(
           to_tsvector('english', title || ' ' || COALESCE(description, '')),
           plainto_tsquery('english', $3)
         ) DESC`,
        [userId, isArchived, searchQuery]
      );
    } else {
      // SQLite FTS5搜索
      documents = await db.all(
        `SELECT d.* FROM documents d
         INNER JOIN documents_fts fts ON d.id = fts.rowid
         WHERE fts MATCH ? AND d.user_id = ? AND d.is_archived = ?
         ORDER BY rank`,
        [searchQuery, userId, isArchived ? 1 : 0]
      );
    }
  } catch (error) {
    logger.error('Search error, falling back to LIKE search:', error);
    // 降级为LIKE搜索
    const searchPattern = `%${searchQuery}%`;
    documents = await db.all(
      `SELECT * FROM documents
       WHERE user_id = $1 AND is_archived = $2 AND (
         title LIKE $3 OR description LIKE $3
       )
       ORDER BY updated_at DESC`,
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

/**
 * 记录文档访问
 */
async function recordVisit(userId, documentId) {
  

  const document = await getDocumentById(userId, documentId);
  if (!document) {
    throw new Error('Document not found');
  }

  await db.run(
    `UPDATE documents
     SET visit_count = visit_count + 1, last_visited_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [documentId, userId]
  );

  return getDocumentById(userId, documentId);
}

/**
 * 获取所有分类
 */
async function getCategories(userId) {
  

  const categories = await db.all(
    `SELECT c.*, COUNT(d.id) as document_count
     FROM document_categories c
     LEFT JOIN documents d ON c.name = d.category AND d.user_id = c.user_id AND d.is_archived = 0
     WHERE c.user_id = ?
     GROUP BY c.id
     ORDER BY c.name`,
    [userId]
  );

  return categories;
}

/**
 * 创建分类
 */
async function createCategory(userId, categoryData) {
  
  const { name, color = '#6366f1', icon = '📁', description = '' } = categoryData;

  const result = await db.run(
    `INSERT INTO document_categories (user_id, name, color, icon, description)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, name, color, icon, description]
  );

  return db.get('SELECT * FROM document_categories WHERE id = ?', [result.lastID]);
}

/**
 * 更新分类
 */
async function updateCategory(userId, categoryId, updates) {
  
  const { name, color, icon, description } = updates;

  const fields = [];
  const params = [];

  if (name !== undefined) {
    fields.push('name = ?');
    params.push(name);
  }
  if (color !== undefined) {
    fields.push('color = ?');
    params.push(color);
  }
  if (icon !== undefined) {
    fields.push('icon = ?');
    params.push(icon);
  }
  if (description !== undefined) {
    fields.push('description = ?');
    params.push(description);
  }

  if (fields.length > 0) {
    params.push(categoryId, userId);
    await db.run(
      `UPDATE document_categories SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
  }

  return db.get('SELECT * FROM document_categories WHERE id = ? AND user_id = ?', [categoryId, userId]);
}

/**
 * 删除分类
 */
async function deleteCategory(userId, categoryId) {
  

  // 将该分类下的文档移到未分类
  await db.run(
    `UPDATE documents SET category = 'uncategorized'
     WHERE user_id = ? AND category = (
       SELECT name FROM document_categories WHERE id = ? AND user_id = ?
     )`,
    [userId, categoryId, userId]
  );

  await db.run('DELETE FROM document_categories WHERE id = ? AND user_id = ?', [categoryId, userId]);

  return { success: true };
}

/**
 * 获取所有标签及其使用次数
 */
async function getAllTags(userId) {
  

  const tags = await db.all(
    `SELECT dt.tag, COUNT(*) as count
     FROM document_tags dt
     INNER JOIN documents d ON dt.document_id = d.id
     WHERE d.user_id = ? AND d.is_archived = 0
     GROUP BY dt.tag
     ORDER BY count DESC, dt.tag`,
    [userId]
  );

  return tags;
}

/**
 * 获取统计信息
 */
async function getStatistics(userId) {
  

  const total = await db.get(
    'SELECT COUNT(*) as count FROM documents WHERE user_id = ? AND is_archived = 0',
    [userId]
  );

  const favorites = await db.get(
    'SELECT COUNT(*) as count FROM documents WHERE user_id = ? AND is_favorite = 1 AND is_archived = 0',
    [userId]
  );

  const categories = await db.get(
    'SELECT COUNT(DISTINCT category) as count FROM documents WHERE user_id = ? AND is_archived = 0',
    [userId]
  );

  const archived = await db.get(
    'SELECT COUNT(*) as count FROM documents WHERE user_id = ? AND is_archived = 1',
    [userId]
  );

  const mostVisited = await db.all(
    `SELECT * FROM documents
     WHERE user_id = ? AND is_archived = 0 AND visit_count > 0
     ORDER BY visit_count DESC
     LIMIT 5`,
    [userId]
  );

  return {
    total: total.count,
    favorites: favorites.count,
    categories: categories.count,
    archived: archived.count,
    mostVisited
  };
}

/**
 * 导出文档
 */
async function exportDocuments(userId) {
  const documents = await getAllDocuments(userId, { isArchived: false });
  const categories = await getCategories(userId);

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    documents,
    categories
  };
}

/**
 * 导入文档
 */
async function importDocuments(userId, data) {
  const documents = data.documents || data;
  let imported = 0;
  let failed = 0;

  for (const doc of documents) {
    try {
      // 移除ID以创建新文档
      const { id, user_id, created_at, updated_at, ...docData } = doc;
      await createDocument(userId, docData);
      imported++;
    } catch (error) {
      logger.error('Failed to import document:', error);
      failed++;
    }
  }

  return { imported, failed };
}

module.exports = {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
  recordVisit,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllTags,
  getStatistics,
  exportDocuments,
  importDocuments
};
