/**
 * 笔记API客户端
 * 使用 apiClient 确保正确的认证
 */

import apiClient from './apiClient';
import { normalizeNote, normalizeNotes } from './utils';

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
  return normalizeNotes(response.data.notes);
}

/**
 * 获取单个笔记
 */
export async function getNoteById(noteId) {
  const response = await apiClient.get(`${API_BASE}/${noteId}`);
  return normalizeNote(response.data.note);
}

/**
 * 创建新笔记
 */
export async function createNote(noteData) {
  const response = await apiClient.post(API_BASE, noteData);
  return normalizeNote(response.data.note);
}

/**
 * 更新笔记
 */
export async function updateNote(noteId, updates) {
  const response = await apiClient.put(`${API_BASE}/${noteId}`, updates);
  return normalizeNote(response.data.note);
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
  return normalizeNotes(response.data.notes);
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
 * @param {Object} categoryData - 分类数据
 * @param {string} categoryData.name - 分类名称（必填）
 * @param {string} [categoryData.color='#6366f1'] - 分类颜色（可选）
 * @param {string} [categoryData.description=''] - 分类描述（可选）
 * @param {string} [categoryData.icon=''] - 分类图标（可选）
 * @param {number} [categoryData.sortOrder=0] - 排序顺序（可选）
 * @returns {Promise<Object>} 返回格式：
 * {
 *   success: boolean,
 *   category: {
 *     id: number,
 *     user_id: number,
 *     name: string,
 *     color: string,
 *     description: string,
 *     icon: string,
 *     sort_order: number,
 *     note_count: number,
 *     created_at: string,
 *     updated_at: string
 *   },
 *   message: string
 * }
 */
export async function createCategory(categoryData) {
  const response = await apiClient.post(`${API_BASE}/categories`, categoryData);
  return response.data;
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
