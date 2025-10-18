/**
 * 笔记API客户端
 * 使用 apiClient 确保正确的认证
 */

import apiClient from './apiClient';

const API_BASE = '/notes';

/**
 * 获取所有笔记
 */
export async function getAllNotes(options = {}) {
  const params = {};

  if (options.category) params.category = options.category;
  if (options.tag) params.tag = options.tag;
  if (options.isFavorite !== undefined) params.isFavorite = options.isFavorite;
  if (options.isArchived !== undefined) params.isArchived = options.isArchived;
  if (options.sortBy) params.sortBy = options.sortBy;
  if (options.sortOrder) params.sortOrder = options.sortOrder;
  if (options.limit) params.limit = options.limit;
  if (options.offset) params.offset = options.offset;

  const response = await apiClient.get(API_BASE, { params });
  return response.data.notes;
}

/**
 * 获取单个笔记
 */
export async function getNoteById(noteId) {
  const response = await apiClient.get(`${API_BASE}/${noteId}`);
  return response.data.note;
}

/**
 * 创建新笔记
 */
export async function createNote(noteData) {
  const response = await apiClient.post(API_BASE, noteData);
  return response.data.note;
}

/**
 * 更新笔记
 */
export async function updateNote(noteId, updates) {
  const response = await apiClient.put(`${API_BASE}/${noteId}`, updates);
  return response.data.note;
}

/**
 * 删除笔记
 */
export async function deleteNote(noteId) {
  await apiClient.delete(`${API_BASE}/${noteId}`);
  return true;
}

/**
 * 批量删除笔记
 */
export async function batchDeleteNotes(noteIds) {
  const response = await apiClient.post(`${API_BASE}/batch-delete`, { noteIds });
  return response.data.deletedCount;
}

/**
 * 搜索笔记
 */
export async function searchNotes(query, options = {}) {
  const params = { q: query };

  if (options.limit) params.limit = options.limit;
  if (options.offset) params.offset = options.offset;

  const response = await apiClient.get(`${API_BASE}/search`, { params });
  return response.data.notes;
}

/**
 * 获取所有分类
 */
export async function getCategories() {
  const response = await apiClient.get(`${API_BASE}/categories`);
  return response.data.categories;
}

/**
 * 创建新分类
 */
export async function createCategory(categoryData) {
  const response = await apiClient.post(`${API_BASE}/categories`, categoryData);
  return response.data.category;
}

/**
 * 更新分类
 */
export async function updateCategory(categoryId, updates) {
  await apiClient.put(`${API_BASE}/categories/${categoryId}`, updates);
  return true;
}

/**
 * 删除分类
 */
export async function deleteCategory(categoryId) {
  await apiClient.delete(`${API_BASE}/categories/${categoryId}`);
  return true;
}

/**
 * 获取所有标签
 */
export async function getAllTags() {
  const response = await apiClient.get(`${API_BASE}/tags`);
  return response.data.tags;
}

/**
 * 获取统计信息
 */
export async function getStatistics() {
  const response = await apiClient.get(`${API_BASE}/statistics`);
  return response.data.statistics;
}

/**
 * 导出笔记
 */
export async function exportNotes(noteIds = null) {
  const response = await apiClient.post(`${API_BASE}/export`, { noteIds });
  return response.data;
}

/**
 * 导入笔记
 */
export async function importNotes(notes) {
  const response = await apiClient.post(`${API_BASE}/import`, { notes });
  return response.data;
}
