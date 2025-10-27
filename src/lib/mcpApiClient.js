import { createLogger } from '../lib/logger'
const logger = createLogger('McpApiClient')

/**
 * MCP后端API客户端
 */

const API_BASE_URL = '/api/mcp';

function buildQuery(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return
    query.set(key, String(value))
  })
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * 获取所有可用服务列表
 */
export async function getServices(options = {}) {
  try {
    const token = localStorage.getItem('token');
    const query = buildQuery({ refresh: options.refresh })
    const response = await fetch(`${API_BASE_URL}/services${query}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '获取服务列表失败');
    }

    return data.services;
  } catch (error) {
    logger.error('获取服务列表失败:', error);
    throw error;
  }
}

/**
 * 获取特定服务的详细信息
 */
export async function getService(serviceId, options = {}) {
  try {
    const token = localStorage.getItem('token');
    const query = buildQuery(options)
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}${query}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '获取服务信息失败');
    }

    return data.service;
  } catch (error) {
    logger.error(`获取服务${serviceId}失败:`, error);
    throw error;
  }
}

/**
 * 启用或禁用服务
 */
export async function toggleService(serviceId, enabled) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ enabled })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '切换服务状态失败');
    }

    return data.service;
  } catch (error) {
    logger.error(`切换服务${serviceId}状态失败:`, error);
    throw error;
  }
}

/**
 * 切换用户自定义服务启用状态
 */
export async function toggleUserConfig(configId, enabled) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/user-configs/${configId}/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ enabled })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || data.message || '切换用户服务状态失败');
    }

    return data.service;
  } catch (error) {
    logger.error(`切换用户服务${configId}状态失败:`, error);
    throw error;
  }
}

/**
 * 获取所有启用服务的工具列表
 */
export async function getTools() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/tools`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '获取工具列表失败');
    }

    return data.tools;
  } catch (error) {
    logger.error('获取工具列表失败:', error);
    throw error;
  }
}

/**
 * 调用MCP工具
 */
export async function callTool(toolName, parameters) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        toolName,
        parameters
      })
    });

    const data = await response.json();

    // 即使success为false,也返回结果(包含错误信息)
    return data;

  } catch (error) {
    logger.error(`调用工具${toolName}失败:`, error);
    return {
      success: false,
      error: '网络请求失败',
      details: error.message
    };
  }
}

/**
 * 健康检查
 */
export async function healthCheck() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error('健康检查失败');
    }

    return data;
  } catch (error) {
    logger.error('健康检查失败:', error);
    throw error;
  }
}
