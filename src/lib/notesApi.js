/**
 * 笔记API客户端
 */

const API_BASE = '/api/notes';

/**
 * 获取所有笔记
 */
export async function getAllNotes(options = {}) {
  const params = new URLSearchParams();

  if (options.category) params.append('category', options.category);
  if (options.tag) params.append('tag', options.tag);
  if (options.isFavorite !== undefined) params.append('isFavorite', options.isFavorite);
  if (options.isArchived !== undefined) params.append('isArchived', options.isArchived);
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.sortOrder) params.append('sortOrder', options.sortOrder);
  if (options.limit) params.append('limit', options.limit);
  if (options.offset) params.append('offset', options.offset);

  const queryString = params.toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

  const response = await fetch(url, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }

  const data = await response.json();
  return data.notes;
}

/**
 * 获取单个笔记
 */
export async function getNoteById(noteId) {
  const response = await fetch(`${API_BASE}/${noteId}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch note');
  }

  const data = await response.json();
  return data.note;
}

/**
 * 创建新笔记
 */
export async function createNote(noteData) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(noteData)
  });

  if (!response.ok) {
    throw new Error('Failed to create note');
  }

  const data = await response.json();
  return data.note;
}

/**
 * 更新笔记
 */
export async function updateNote(noteId, updates) {
  const response = await fetch(`${API_BASE}/${noteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error('Failed to update note');
  }

  const data = await response.json();
  return data.note;
}

/**
 * 删除笔记
 */
export async function deleteNote(noteId) {
  const response = await fetch(`${API_BASE}/${noteId}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to delete note');
  }

  return true;
}

/**
 * 批量删除笔记
 */
export async function batchDeleteNotes(noteIds) {
  const response = await fetch(`${API_BASE}/batch-delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ noteIds })
  });

  if (!response.ok) {
    throw new Error('Failed to batch delete notes');
  }

  const data = await response.json();
  return data.deletedCount;
}

/**
 * 搜索笔记
 */
export async function searchNotes(query, options = {}) {
  const params = new URLSearchParams({ q: query });

  if (options.limit) params.append('limit', options.limit);
  if (options.offset) params.append('offset', options.offset);

  const response = await fetch(`${API_BASE}/search?${params.toString()}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to search notes');
  }

  const data = await response.json();
  return data.notes;
}

/**
 * 获取所有分类
 */
export async function getCategories() {
  const response = await fetch(`${API_BASE}/categories`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  const data = await response.json();
  return data.categories;
}

/**
 * 创建新分类
 */
export async function createCategory(categoryData) {
  const response = await fetch(`${API_BASE}/categories`, {
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

  const data = await response.json();
  return data.category;
}

/**
 * 更新分类
 */
export async function updateCategory(categoryId, updates) {
  const response = await fetch(`${API_BASE}/categories/${categoryId}`, {
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

  return true;
}

/**
 * 删除分类
 */
export async function deleteCategory(categoryId) {
  const response = await fetch(`${API_BASE}/categories/${categoryId}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to delete category');
  }

  return true;
}

/**
 * 获取所有标签
 */
export async function getAllTags() {
  const response = await fetch(`${API_BASE}/tags`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }

  const data = await response.json();
  return data.tags;
}

/**
 * 获取统计信息
 */
export async function getStatistics() {
  const response = await fetch(`${API_BASE}/statistics`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch statistics');
  }

  const data = await response.json();
  return data.statistics;
}

/**
 * 导出笔记
 */
export async function exportNotes(noteIds = null) {
  const response = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ noteIds })
  });

  if (!response.ok) {
    throw new Error('Failed to export notes');
  }

  const data = await response.json();
  return data;
}

/**
 * 导入笔记
 */
export async function importNotes(notes) {
  const response = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ notes })
  });

  if (!response.ok) {
    throw new Error('Failed to import notes');
  }

  const data = await response.json();
  return data;
}
