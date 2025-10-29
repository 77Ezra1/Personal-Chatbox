/**
 * 工作流调试器
 * 管理断点、单步执行和调试状态
 */

const { EventEmitter } = require('events');

class WorkflowDebugger extends EventEmitter {
  constructor() {
    super();

    // 调试会话：executionId -> debugSession
    this.sessions = new Map();

    // 断点：workflowId -> Set<nodeId>
    this.breakpoints = new Map();

    // ✅ 设置事件监听器，将调试事件推送到 WebSocket
    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器，将调试事件推送到 WebSocket
   */
  setupEventHandlers() {
    // 动态导入 WebSocket 管理器（避免循环依赖）
    this.on('paused', (data) => {
      const { getInstance: getWSManager } = require('./workflowWebSocket.cjs');
      const wsManager = getWSManager();
      wsManager.pushDebugPaused(data.executionId, {
        nodeId: data.nodeId,
        reason: data.reason,
        variables: data.variables || {},
        callStack: this.getCallStack(data.executionId)
      });
    });

    this.on('continued', (data) => {
      const { getInstance: getWSManager } = require('./workflowWebSocket.cjs');
      const wsManager = getWSManager();
      wsManager.pushDebugContinued(data.executionId);
    });

    this.on('step_over', (data) => {
      const { getInstance: getWSManager } = require('./workflowWebSocket.cjs');
      const wsManager = getWSManager();
      wsManager.pushDebugStepOver(data.executionId);
    });

    this.on('breakpoint_set', (data) => {
      const { getInstance: getWSManager } = require('./workflowWebSocket.cjs');
      const wsManager = getWSManager();
      wsManager.pushBreakpointSet(data.workflowId, data.nodeId);
    });

    this.on('breakpoint_removed', (data) => {
      const { getInstance: getWSManager } = require('./workflowWebSocket.cjs');
      const wsManager = getWSManager();
      wsManager.pushBreakpointRemoved(data.workflowId, data.nodeId);
    });
  }

  /**
   * 创建调试会话
   */
  createSession(executionId, workflowId, options = {}) {
    const session = {
      executionId,
      workflowId,
      mode: options.mode || 'normal', // normal | debug | step
      currentNode: null,
      isPaused: false,
      pausedAt: null,
      stepMode: false, // 是否单步执行模式
      continuePromise: null, // 用于暂停和继续
      continueResolve: null,
      variables: new Map(), // 当前执行上下文的变量
      callStack: [] // 调用栈（节点执行序列）
    };

    this.sessions.set(executionId, session);
    return session;
  }

  /**
   * 获取调试会话
   */
  getSession(executionId) {
    return this.sessions.get(executionId);
  }

  /**
   * 删除调试会话
   */
  deleteSession(executionId) {
    this.sessions.delete(executionId);
  }

  /**
   * 设置断点
   */
  setBreakpoint(workflowId, nodeId) {
    if (!this.breakpoints.has(workflowId)) {
      this.breakpoints.set(workflowId, new Set());
    }
    this.breakpoints.get(workflowId).add(nodeId);

    this.emit('breakpoint_set', { workflowId, nodeId });

    return true;
  }

  /**
   * 移除断点
   */
  removeBreakpoint(workflowId, nodeId) {
    const breakpoints = this.breakpoints.get(workflowId);
    if (breakpoints) {
      breakpoints.delete(nodeId);
      this.emit('breakpoint_removed', { workflowId, nodeId });
      return true;
    }
    return false;
  }

  /**
   * 清除工作流的所有断点
   */
  clearBreakpoints(workflowId) {
    this.breakpoints.delete(workflowId);
    this.emit('breakpoints_cleared', { workflowId });
  }

  /**
   * 获取工作流的所有断点
   */
  getBreakpoints(workflowId) {
    const breakpoints = this.breakpoints.get(workflowId);
    return breakpoints ? Array.from(breakpoints) : [];
  }

  /**
   * 检查节点是否有断点
   */
  hasBreakpoint(workflowId, nodeId) {
    const breakpoints = this.breakpoints.get(workflowId);
    return breakpoints ? breakpoints.has(nodeId) : false;
  }

  /**
   * 在节点执行前检查是否需要暂停
   * 返回 Promise，如果需要暂停则等待继续信号
   */
  async checkPauseBeforeNode(executionId, workflowId, nodeId, nodeData) {
    const session = this.getSession(executionId);
    if (!session) return; // 非调试模式

    // 更新当前节点
    session.currentNode = nodeId;
    session.callStack.push({
      nodeId,
      nodeType: nodeData.type,
      enteredAt: new Date()
    });

    // 检查是否需要暂停
    const shouldPause =
      session.stepMode || // 单步模式
      this.hasBreakpoint(workflowId, nodeId) || // 断点
      session.mode === 'step'; // 步进模式

    if (shouldPause) {
      await this.pause(executionId, nodeId, {
        reason: session.stepMode ? 'step' : 'breakpoint',
        nodeData,
        variables: Object.fromEntries(session.variables)
      });
    }
  }

  /**
   * 暂停执行
   */
  async pause(executionId, nodeId, context = {}) {
    const session = this.getSession(executionId);
    if (!session || session.isPaused) return;

    session.isPaused = true;
    session.pausedAt = new Date();
    session.currentNode = nodeId;

    // 创建一个 Promise 用于等待继续信号
    const continuePromise = new Promise((resolve) => {
      session.continueResolve = resolve;
    });
    session.continuePromise = continuePromise;

    // 触发暂停事件
    this.emit('paused', {
      executionId,
      nodeId,
      timestamp: session.pausedAt,
      ...context
    });

    // 等待继续信号
    await continuePromise;
  }

  /**
   * 继续执行
   */
  continue(executionId) {
    const session = this.getSession(executionId);
    if (!session || !session.isPaused) return false;

    session.isPaused = false;
    session.stepMode = false;
    session.pausedAt = null;

    // 解除暂停
    if (session.continueResolve) {
      session.continueResolve();
      session.continueResolve = null;
      session.continuePromise = null;
    }

    this.emit('continued', { executionId });
    return true;
  }

  /**
   * 单步执行（执行一个节点后暂停）
   */
  stepOver(executionId) {
    const session = this.getSession(executionId);
    if (!session) return false;

    // 设置单步模式
    session.stepMode = true;

    // 如果当前处于暂停状态，继续执行
    if (session.isPaused && session.continueResolve) {
      session.isPaused = false;
      session.pausedAt = null;
      session.continueResolve();
      session.continueResolve = null;
      session.continuePromise = null;
    }

    this.emit('step_over', { executionId });
    return true;
  }

  /**
   * 停止调试
   */
  stop(executionId) {
    const session = this.getSession(executionId);
    if (!session) return false;

    // 如果处于暂停状态，先继续执行（让工作流能够结束）
    if (session.isPaused && session.continueResolve) {
      session.continueResolve();
    }

    this.deleteSession(executionId);
    this.emit('stopped', { executionId });
    return true;
  }

  /**
   * 更新会话变量
   */
  updateVariables(executionId, variables) {
    const session = this.getSession(executionId);
    if (!session) return;

    for (const [key, value] of Object.entries(variables)) {
      session.variables.set(key, value);
    }
  }

  /**
   * 获取会话变量
   */
  getVariables(executionId) {
    const session = this.getSession(executionId);
    if (!session) return {};

    return Object.fromEntries(session.variables);
  }

  /**
   * 获取调用栈
   */
  getCallStack(executionId) {
    const session = this.getSession(executionId);
    if (!session) return [];

    return [...session.callStack];
  }

  /**
   * 获取所有调试会话状态
   */
  getAllSessions() {
    const sessions = [];
    for (const [executionId, session] of this.sessions.entries()) {
      sessions.push({
        executionId,
        workflowId: session.workflowId,
        mode: session.mode,
        isPaused: session.isPaused,
        currentNode: session.currentNode,
        pausedAt: session.pausedAt
      });
    }
    return sessions;
  }
}

// 单例模式
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new WorkflowDebugger();
  }
  return instance;
}

module.exports = { WorkflowDebugger, getInstance };
