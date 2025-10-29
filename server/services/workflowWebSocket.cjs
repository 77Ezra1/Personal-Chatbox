/**
 * 工作流 WebSocket 管理器
 * 负责实时推送工作流执行状态
 */

const WebSocket = require('ws');

class WorkflowWebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // executionId -> Set<WebSocket>
  }

  /**
   * 初始化 WebSocket 服务器
   * @param {http.Server} server - HTTP 服务器实例
   */
  initialize(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws/workflow'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('[WorkflowWS] 新连接建立');

      // 处理客户端消息
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('[WorkflowWS] 消息解析失败:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: '消息格式错误'
          }));
        }
      });

      // 处理断开连接
      ws.on('close', () => {
        console.log('[WorkflowWS] 连接关闭');
        this.removeClient(ws);
      });

      // 处理错误
      ws.on('error', (error) => {
        console.error('[WorkflowWS] 连接错误:', error);
        this.removeClient(ws);
      });

      // 发送欢迎消息
      ws.send(JSON.stringify({
        type: 'connected',
        message: '已连接到工作流执行状态服务'
      }));
    });

    console.log('[WorkflowWS] WebSocket 服务器已初始化，路径: /ws/workflow');
  }

  /**
   * 处理客户端消息
   * @param {WebSocket} ws - WebSocket 连接
   * @param {Object} data - 消息数据
   */
  handleClientMessage(ws, data) {
    const { type, executionId } = data;

    switch (type) {
      case 'subscribe':
        // 订阅特定工作流执行的状态更新
        if (executionId) {
          this.subscribeExecution(ws, executionId);
          ws.send(JSON.stringify({
            type: 'subscribed',
            executionId
          }));
          console.log('[WorkflowWS] 客户端订阅执行:', executionId);
        }
        break;

      case 'unsubscribe':
        // 取消订阅
        if (executionId) {
          this.unsubscribeExecution(ws, executionId);
          ws.send(JSON.stringify({
            type: 'unsubscribed',
            executionId
          }));
          console.log('[WorkflowWS] 客户端取消订阅:', executionId);
        }
        break;

      case 'ping':
        // 心跳检测
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      default:
        console.warn('[WorkflowWS] 未知消息类型:', type);
    }
  }

  /**
   * 订阅工作流执行
   * @param {WebSocket} ws - WebSocket 连接
   * @param {string} executionId - 执行ID
   */
  subscribeExecution(ws, executionId) {
    if (!this.clients.has(executionId)) {
      this.clients.set(executionId, new Set());
    }
    this.clients.get(executionId).add(ws);

    // 保存订阅信息到 ws 对象上
    if (!ws.subscriptions) {
      ws.subscriptions = new Set();
    }
    ws.subscriptions.add(executionId);
  }

  /**
   * 取消订阅工作流执行
   * @param {WebSocket} ws - WebSocket 连接
   * @param {string} executionId - 执行ID
   */
  unsubscribeExecution(ws, executionId) {
    const clients = this.clients.get(executionId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        this.clients.delete(executionId);
      }
    }

    if (ws.subscriptions) {
      ws.subscriptions.delete(executionId);
    }
  }

  /**
   * 移除客户端的所有订阅
   * @param {WebSocket} ws - WebSocket 连接
   */
  removeClient(ws) {
    if (ws.subscriptions) {
      for (const executionId of ws.subscriptions) {
        this.unsubscribeExecution(ws, executionId);
      }
    }
  }

  /**
   * 推送工作流开始事件
   * @param {string} executionId - 执行ID
   * @param {Object} data - 工作流数据
   */
  pushWorkflowStart(executionId, data) {
    this.broadcast(executionId, {
      type: 'workflow_start',
      executionId,
      workflowId: data.workflowId,
      workflowName: data.workflowName,
      startedAt: data.startedAt,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 推送工作流完成事件
   * @param {string} executionId - 执行ID
   * @param {Object} data - 执行结果
   */
  pushWorkflowComplete(executionId, data) {
    this.broadcast(executionId, {
      type: 'workflow_complete',
      executionId,
      status: data.status,
      outputData: data.outputData,
      completedAt: data.completedAt,
      durationMs: data.durationMs,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 推送工作流失败事件
   * @param {string} executionId - 执行ID
   * @param {Object} error - 错误信息
   */
  pushWorkflowError(executionId, error) {
    this.broadcast(executionId, {
      type: 'workflow_error',
      executionId,
      error: error.message || '未知错误',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 推送节点开始执行事件
   * @param {string} executionId - 执行ID
   * @param {Object} nodeData - 节点数据
   */
  pushNodeStart(executionId, nodeData) {
    this.broadcast(executionId, {
      type: 'node_start',
      executionId,
      nodeId: nodeData.nodeId,
      nodeType: nodeData.nodeType,
      nodeLabel: nodeData.nodeLabel,
      startedAt: nodeData.startedAt,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 推送节点完成事件
   * @param {string} executionId - 执行ID
   * @param {Object} nodeData - 节点执行结果
   */
  pushNodeComplete(executionId, nodeData) {
    this.broadcast(executionId, {
      type: 'node_complete',
      executionId,
      nodeId: nodeData.nodeId,
      nodeType: nodeData.nodeType,
      status: nodeData.status,
      inputData: nodeData.inputData,
      outputData: nodeData.outputData,
      completedAt: nodeData.completedAt,
      durationMs: nodeData.durationMs,
      retryCount: nodeData.retryCount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 推送节点失败事件
   * @param {string} executionId - 执行ID
   * @param {Object} nodeData - 节点数据
   */
  pushNodeError(executionId, nodeData) {
    this.broadcast(executionId, {
      type: 'node_error',
      executionId,
      nodeId: nodeData.nodeId,
      nodeType: nodeData.nodeType,
      error: nodeData.errorMessage,
      retryCount: nodeData.retryCount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 推送节点重试事件
   * @param {string} executionId - 执行ID
   * @param {Object} retryData - 重试数据
   */
  pushNodeRetry(executionId, retryData) {
    this.broadcast(executionId, {
      type: 'node_retry',
      executionId,
      nodeId: retryData.nodeId,
      attempt: retryData.attempt,
      maxRetries: retryData.maxRetries,
      delayMs: retryData.delayMs,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 广播消息给订阅特定执行的所有客户端
   * @param {string} executionId - 执行ID
   * @param {Object} message - 消息对象
   */
  broadcast(executionId, message) {
    const clients = this.clients.get(executionId);
    if (!clients || clients.size === 0) {
      return;
    }

    const messageStr = JSON.stringify(message);
    const deadClients = [];

    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          console.error('[WorkflowWS] 发送消息失败:', error);
          deadClients.push(client);
        }
      } else {
        deadClients.push(client);
      }
    }

    // 清理死连接
    for (const deadClient of deadClients) {
      this.removeClient(deadClient);
    }
  }

  /**
   * 获取在线客户端数量
   */
  getClientCount() {
    let total = 0;
    for (const clients of this.clients.values()) {
      total += clients.size;
    }
    return total;
  }

  /**
   * 推送调试暂停事件
   * @param {string} executionId - 执行ID
   * @param {Object} data - 暂停数据
   */
  pushDebugPaused(executionId, data) {
    this.broadcast(executionId, {
      type: 'debug_paused',
      executionId,
      nodeId: data.nodeId,
      reason: data.reason,
      variables: data.variables,
      callStack: data.callStack,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 推送调试继续事件
   * @param {string} executionId - 执行ID
   */
  pushDebugContinued(executionId) {
    this.broadcast(executionId, {
      type: 'debug_continued',
      executionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 推送调试单步执行事件
   * @param {string} executionId - 执行ID
   */
  pushDebugStepOver(executionId) {
    this.broadcast(executionId, {
      type: 'debug_step_over',
      executionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 推送断点设置事件
   * @param {string} workflowId - 工作流ID
   * @param {string} nodeId - 节点ID
   */
  pushBreakpointSet(workflowId, nodeId) {
    // 向所有订阅该工作流的客户端推送
    // 注意：这里需要一个工作流级别的订阅系统，暂时简化处理
    this.broadcast(workflowId, {
      type: 'breakpoint_set',
      workflowId,
      nodeId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 推送断点移除事件
   * @param {string} workflowId - 工作流ID
   * @param {string} nodeId - 节点ID
   */
  pushBreakpointRemoved(workflowId, nodeId) {
    this.broadcast(workflowId, {
      type: 'breakpoint_removed',
      workflowId,
      nodeId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 关闭所有连接
   */
  close() {
    if (this.wss) {
      this.wss.clients.forEach(client => {
        client.close();
      });
      this.wss.close();
      this.clients.clear();
      console.log('[WorkflowWS] WebSocket 服务器已关闭');
    }
  }
}

// 单例模式
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new WorkflowWebSocketManager();
    }
    return instance;
  }
};
