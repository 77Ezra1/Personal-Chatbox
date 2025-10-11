/**
 * MCP后端API客户端
 */

const API_BASE_URL = import.meta.env.VITE_MCP_API_URL || 'http://localhost:3001/api/mcp';

/**
 * 获取所有可用服务列表
 */
export async function getServices() {
  try {
    const response = await fetch(`${API_BASE_URL}/services`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '获取服务列表失败');
    }
    
    return data.services;
  } catch (error) {
    console.error('获取服务列表失败:', error);
    throw error;
  }
}

/**
 * 获取特定服务的详细信息
 */
export async function getService(serviceId) {
  try {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '获取服务信息失败');
    }
    
    return data.service;
  } catch (error) {
    console.error(`获取服务${serviceId}失败:`, error);
    throw error;
  }
}

/**
 * 启用或禁用服务
 */
export async function toggleService(serviceId, enabled) {
  try {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '切换服务状态失败');
    }
    
    return data.service;
  } catch (error) {
    console.error(`切换服务${serviceId}状态失败:`, error);
    throw error;
  }
}

/**
 * 获取所有启用服务的工具列表
 */
export async function getTools() {
  try {
    const response = await fetch(`${API_BASE_URL}/tools`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || '获取工具列表失败');
    }
    
    return data.tools;
  } catch (error) {
    console.error('获取工具列表失败:', error);
    throw error;
  }
}

/**
 * 调用MCP工具
 */
export async function callTool(toolName, parameters) {
  try {
    const response = await fetch(`${API_BASE_URL}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
    console.error(`调用工具${toolName}失败:`, error);
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
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('健康检查失败');
    }
    
    return data;
  } catch (error) {
    console.error('健康检查失败:', error);
    throw error;
  }
}

