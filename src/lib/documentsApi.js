/**
 * 文档管理 API 客户端
 */

const API_BASE_URL = '/api/documents';

/**
 * 获取所有文档
 */
export async function getAllDocuments(options = {}) {
  const params = new URLSearchParams();

  if (options.category) params.append('category', options.category);
  if (options.tag) params.append('tag', options.tag);
  if (options.isFavorite !== undefined) params.append('isFavorite', options.isFavorite);
  if (options.isArchived !== undefined) params.append('isArchived', options.isArchived);
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);

  const response = await fetch(`${API_BASE_URL}?${params}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }

  return response.json();
}

/**
 * 根据ID获取文档
 */
export async function getDocumentById(documentId) {
  const response = await fetch(`${API_BASE_URL}/${documentId}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch document');
  }

  return response.json();
}

/**
 * 创建新文档
 */
export async function createDocument(documentData) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(documentData)
  });

  if (!response.ok) {
    throw new Error('Failed to create document');
  }

  return response.json();
}

/**
 * 更新文档
 */
export async function updateDocument(documentId, updates) {
  const response = await fetch(`${API_BASE_URL}/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error('Failed to update document');
  }

  return response.json();
}

/**
 * 删除文档
 */
export async function deleteDocument(documentId) {
  const response = await fetch(`${API_BASE_URL}/${documentId}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to delete document');
  }

  return response.json();
}

/**
 * 搜索文档
 */
export async function searchDocuments(searchQuery, options = {}) {
  const params = new URLSearchParams();

  if (options.isArchived !== undefined) params.append('isArchived', options.isArchived);

  const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(searchQuery)}?${params}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to search documents');
  }

  return response.json();
}

/**
 * 记录文档访问
 */
export async function recordVisit(documentId) {
  const response = await fetch(`${API_BASE_URL}/${documentId}/visit`, {
    method: 'POST',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to record visit');
  }

  return response.json();
}

/**
 * 获取所有分类
 */
export async function getCategories() {
  const response = await fetch(`${API_BASE_URL}/categories/list`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
}

/**
 * 创建分类
 */
export async function createCategory(categoryData) {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(categoryData)
  });

  if (!response.ok) {
    throw new Error('Failed to create category');
  }

  return response.json();
}

/**
 * 更新分类
 */
export async function updateCategory(categoryId, updates) {
  const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error('Failed to update category');
  }

  return response.json();
}

/**
 * 删除分类
 */
export async function deleteCategory(categoryId) {
  const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to delete category');
  }

  return response.json();
}

/**
 * 获取所有标签
 */
export async function getAllTags() {
  const response = await fetch(`${API_BASE_URL}/tags/list`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }

  return response.json();
}

/**
 * 获取统计信息
 */
export async function getStatistics() {
  const response = await fetch(`${API_BASE_URL}/stats/summary`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch statistics');
  }

  return response.json();
}

/**
 * 导出文档
 */
export async function exportDocuments() {
  const response = await fetch(`${API_BASE_URL}/export/all`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to export documents');
  }

  return response.json();
}

/**
 * 导入文档
 */
export async function importDocuments(data) {
  const response = await fetch(`${API_BASE_URL}/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to import documents');
  }

  return response.json();
}
