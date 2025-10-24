import axios from 'axios'

/**
 * 统一的API客户端
 * 基于axios封装，自动处理认证和错误
 */

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30秒超时
  withCredentials: true // 始终携带 httpOnly 会话 Cookie
})

// 请求拦截器 - 自动添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 处理特定HTTP错误
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权 - 可能需要重新登录
          console.error('[API] Unauthorized - token may be expired')
          // 可以在这里触发登出逻辑
          break
        case 403:
          console.error('[API] Forbidden - insufficient permissions')
          break
        case 404:
          console.error('[API] Not found:', error.config.url)
          break
        case 500:
          console.error('[API] Server error')
          break
        default:
          console.error('[API] Request failed:', error.response.status)
      }
    } else if (error.request) {
      console.error('[API] No response received from server')
    } else {
      console.error('[API] Request setup error:', error.message)
    }
    return Promise.reject(error)
  }
)

/**
 * Agent API 接口
 */
export const agentAPI = {
  // 列表和查询
  list: (params) => apiClient.get('/agents', { params }),
  get: (id) => apiClient.get(`/agents/${id}`),
  search: (query) => apiClient.get('/agents', { params: { search: query } }),

  // CRUD操作
  create: (data) => apiClient.post('/agents', data),
  update: (id, data) => apiClient.put(`/agents/${id}`, data),
  delete: (id) => apiClient.delete(`/agents/${id}`),

  // 任务执行
  execute: (id, taskData) => apiClient.post(`/agents/${id}/execute`, { taskData }),
  stop: (id) => apiClient.post(`/agents/${id}/stop`),
  getProgress: (id) => apiClient.get(`/agents/${id}/progress`),

  // 任务管理
  getTasks: (id) => apiClient.get(`/agents/${id}/tasks`),
  getSubTasks: (id, taskId) => apiClient.get(`/agents/${id}/tasks/${taskId}/subtasks`),
  getExecutions: (id, params) => apiClient.get(`/agents/${id}/executions`, { params }),
  exportExecutions: (id, params) => apiClient.get(`/agents/${id}/executions/export`, {
    params,
    responseType: String(params?.format || 'csv').toLowerCase() === 'json' ? 'json' : 'blob'
  }),
  getStats: (id, params) => apiClient.get(`/agents/${id}/stats`, { params }),
  getQueueStatus: (id) => apiClient.get(`/agents/${id}/queue`),
  cancelQueuedExecution: (id, executionId) => apiClient.post(`/agents/${id}/queue/${executionId}/cancel`),
  updateQueuePriority: (id, executionId, priority) => apiClient.post(
    `/agents/${id}/queue/${executionId}/priority`,
    { priority }
  ),
  getRuntimeConfig: () => apiClient.get('/agents/runtime/config'),
  updateRuntimeConfig: (config) => apiClient.put('/agents/runtime/config', config),
  getSummaryMetrics: () => apiClient.get('/agents/metrics/summary'),

  // 工具
  getTools: () => apiClient.get('/agents/tools')
}

/**
 * Workflow API 接口
 */
export const workflowAPI = {
  // 列表和查询
  list: (params) => apiClient.get('/workflows', { params }),
  get: (id) => apiClient.get(`/workflows/${id}`),
  search: (query) => apiClient.get('/workflows', { params: { search: query } }),

  // CRUD操作
  create: (data) => apiClient.post('/workflows', data),
  update: (id, data) => apiClient.put(`/workflows/${id}`, data),
  delete: (id) => apiClient.delete(`/workflows/${id}`),

  // 执行和监控
  run: (id, input) => apiClient.post(`/workflows/${id}/run`, input),
  stop: (id) => apiClient.post(`/workflows/${id}/stop`),
  getLogs: (id, params) => apiClient.get(`/workflows/${id}/logs`, { params }),
  getStats: (id) => apiClient.get(`/workflows/${id}/stats`),

  // 模板和复制
  getTemplates: () => apiClient.get('/workflows/templates'),
  useTemplate: (id) => apiClient.post(`/workflows/templates/${id}/use`),
  copy: (id) => apiClient.post(`/workflows/${id}/copy`),

  // 导入导出
  import: (data) => apiClient.post('/workflows/import', data),
  export: (ids) => apiClient.get('/workflows/export', { params: { ids: ids.join(',') } }),

  // 节点类型
  getNodeTypes: () => apiClient.get('/workflows/node-types')
}

/**
 * Context (记忆) API 接口
 */
export const contextAPI = {
  // 记忆管理
  listMemories: (params) => apiClient.get('/context/memories', { params }),
  getMemory: (id) => apiClient.get(`/context/memories/${id}`),
  createMemory: (data) => apiClient.post('/context/memories', data),
  updateMemory: (id, data) => apiClient.put(`/context/memories/${id}`, data),
  deleteMemory: (id) => apiClient.delete(`/context/memories/${id}`),
  batchDeleteMemories: (ids) => apiClient.delete('/context/memories/batch', { data: { ids } }),

  // 搜索和推荐
  search: (query, params) => apiClient.get('/context/search', { params: { query, ...params } }),
  getRecommendations: (id) => apiClient.get(`/context/memories/${id}/recommendations`),
  getPopular: () => apiClient.get('/context/memories/popular'),
  getRecent: () => apiClient.get('/context/memories/recent'),

  // 上下文优化
  compress: (data) => apiClient.post('/context/compress', data),
  analyze: (data) => apiClient.post('/context/analyze', data),
  cleanup: () => apiClient.post('/context/memories/cleanup'),
  rebuildIndex: () => apiClient.post('/context/rebuild-index'),

  // 统计
  getStats: () => apiClient.get('/context/stats')
}

/**
 * Summary (总结) API 接口
 */
export const summaryAPI = {
  // 对话总结
  getSummary: (conversationId) => apiClient.get(`/summary/conversations/${conversationId}/summary`),
  summarize: (conversationId, options) => apiClient.post(`/summary/conversations/${conversationId}/summarize`, options),

  // 关键点提取
  getKeyPoints: (conversationId) => apiClient.get(`/summary/keypoints/${conversationId}`),
  extractKeyPoints: (conversationId) => apiClient.post(`/summary/keypoints/${conversationId}/extract`),

  // 模板管理
  listTemplates: (params) => apiClient.get('/summary/templates', { params }),
  getTemplate: (id) => apiClient.get(`/summary/templates/${id}`),
  createTemplate: (data) => apiClient.post('/summary/templates', data),
  updateTemplate: (id, data) => apiClient.put(`/summary/templates/${id}`, data),
  deleteTemplate: (id) => apiClient.delete(`/summary/templates/${id}`),

  // 模板使用
  useTemplate: (id, data) => apiClient.post(`/summary/templates/${id}/use`, data),
  rateTemplate: (id, rating) => apiClient.post(`/summary/templates/${id}/rate`, { rating }),
  copyTemplate: (id) => apiClient.post(`/summary/templates/${id}/copy`),

  // 模板发现
  searchTemplates: (query) => apiClient.get('/summary/templates/search', { params: { query } }),
  getPopularTemplates: () => apiClient.get('/summary/templates/popular'),
  getTemplateStats: () => apiClient.get('/summary/templates/stats'),

  // 分析和导出
  analyze: (data) => apiClient.post('/summary/analyze', data),
  export: (summaryId, format) => apiClient.get(`/summary/export/${summaryId}`, {
    params: { format },
    responseType: 'blob'
  })
}

/**
 * Template Marketplace API 接口
 */
export const templateMarketAPI = {
  // 市场浏览
  list: (params) => apiClient.get('/templates/marketplace', { params }),
  get: (id) => apiClient.get(`/templates/${id}`),
  search: (query, params) => apiClient.get('/templates/search', { params: { query, ...params } }),

  // 分类和推荐
  getCategories: () => apiClient.get('/templates/categories'),
  getRecommendations: () => apiClient.get('/templates/recommendations'),
  getTrending: () => apiClient.get('/templates/trending'),

  // 用户交互
  use: (id) => apiClient.post(`/templates/${id}/use`),
  rate: (id, rating, review) => apiClient.post(`/templates/${id}/rate`, { rating, review }),
  favorite: (id) => apiClient.post(`/templates/${id}/favorite`),
  unfavorite: (id) => apiClient.delete(`/templates/${id}/favorite`),

  // 用户库
  getUserLibrary: (userId) => apiClient.get(`/templates/user/${userId}/library`),

  // 评分和统计
  getRatings: (id) => apiClient.get(`/templates/${id}/ratings`),
  getStats: (id) => apiClient.get(`/templates/${id}/stats`),

  // 发布
  publish: (data) => apiClient.post('/templates/publish', data)
}

/**
 * Analytics API 接口
 */
export const analyticsAPI = {
  getOverview: () => apiClient.get('/analytics/overview'),
  getTrends: (params) => apiClient.get('/analytics/trends', { params }),
  getModelStats: () => apiClient.get('/analytics/models'),
  getToolStats: () => apiClient.get('/analytics/tools'),
  getHeatmap: (params) => apiClient.get('/analytics/heatmap', { params }),
  export: (params) => apiClient.get('/analytics/export', {
    params,
    responseType: 'blob'
  })
}

/**
 * 导出默认实例
 * 所有API已通过export const导出
 */
export default apiClient
