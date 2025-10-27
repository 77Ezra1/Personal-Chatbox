/**
 * 智能 Agent 引擎
 * 处理 Agent 创建、任务分解、自主执行和进度管理
 */

const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');
const TaskDecomposer = require('./taskDecomposer.cjs');
const AgentExecutionQueue = require('./agentExecutionQueue.cjs');
const executionEvents = require('./executionEvents.cjs');
const sseManager = require('./sseManager.cjs');

class AgentEngine {
  constructor() {
    this.toolRegistry = new Map();
    this.taskDecomposer = new TaskDecomposer();
    this.executionManager = new Map();
    this.toolsLoaded = false;
    this.toolsLoadingPromise = null;
    this.lastToolRefresh = null;

    // 性能优化：任务分解缓存 (Zero-cost optimization)
    this.taskCache = new Map();
    this.cacheMaxSize = parseInt(process.env.AGENT_CACHE_MAX_SIZE || '100', 10);
    this.cacheTTL = parseInt(process.env.AGENT_CACHE_TTL || '3600000', 10);
    this.cacheStats = { hits: 0, misses: 0 };
    this.agentTableInfo = null;
    this.runtimeConfigCache = new Map();
    this.retryDefaults = this.#loadRetryDefaults();
    this.toolRefreshPolicy = {
      auto: (process.env.AGENT_TOOL_REFRESH_AUTO || '').toLowerCase() === 'true',
      intervalMs: this.#parseInt(process.env.AGENT_TOOL_REFRESH_INTERVAL_MS, 600000)
    };
    console.log(`[AgentEngine] 任务缓存已启用: 最大${this.cacheMaxSize}项, TTL ${this.cacheTTL/1000}秒`);

    this.registerDefaultTools();
    this.loadToolsFromDatabase().catch(error => {
      console.error('[AgentEngine] 初始化加载工具失败:', error);
    });

    const queueConcurrency = parseInt(process.env.AGENT_EXECUTION_CONCURRENCY || '2', 10);
    this.executionQueue = new AgentExecutionQueue({
      concurrency: queueConcurrency,
      worker: this.runQueuedExecution.bind(this)
    });

    this.executionQueue.on('jobQueued', (job) => {
      this.handleJobQueued(job).catch(err => {
        console.error('[AgentEngine] 处理 jobQueued 事件失败:', err);
      });
    });

    this.executionQueue.on('jobRetry', (job, error, meta) => {
      this.handleJobRetry(job, error, meta).catch(err => {
        console.error('[AgentEngine] 处理 jobRetry 事件失败:', err);
      });
    });

    this.executionQueue.on('jobFailed', (job, error, meta) => {
      this.handleJobFailed(job, error, meta).catch(err => {
        console.error('[AgentEngine] 处理 jobFailed 事件失败:', err);
      });
    });

    this.executionQueue.on('jobCompleted', (job) => {
      this.handleJobCompleted(job).catch(err => {
        console.error('[AgentEngine] 处理 jobCompleted 事件失败:', err);
      });
    });

    this.executionQueue.on('jobCancelled', (job, context) => {
      this.handleJobCancelled(job, context).catch(err => {
        console.error('[AgentEngine] 处理 jobCancelled 事件失败:', err);
      });
    });

    this.executionQueue.on('jobPriorityChanged', (job) => {
      this.handleJobPriorityChanged(job).catch(err => {
        console.error('[AgentEngine] 处理 jobPriorityChanged 事件失败:', err);
      });
    });

    this.executionQueue.on('jobStarted', (job) => {
      this.handleJobStarted(job).catch(err => {
        console.error('[AgentEngine] 处理 jobStarted 事件失败:', err);
      });
    });
  }

  /**
   * 创建 Agent
   * @param {number} userId - 用户ID
   * @param {Object} agentData - Agent 数据
   */
  async createAgent(userId, agentData) {
    const id = uuidv4();
    const {
      name,
      description = '',
      avatarUrl = '',
      systemPrompt,
      capabilities = [],
      tools = [],
      config = {}
    } = agentData;

    if (!name || !systemPrompt) {
      throw new Error('Agent 名称和系统提示词不能为空');
    }

    const agent = {
      id,
      userId,
      name,
      description,
      avatarUrl,
      systemPrompt,
      capabilities,
      tools,
      config: {
        maxConcurrentTasks: 3,
        stopOnError: false,
        retryAttempts: 2,
        ...config
      },
      status: 'inactive',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 保存到数据库
    await this.saveAgent(agent);

    return agent;
  }

  /**
   * 获取 Agent
   * @param {string} agentId - Agent ID
   * @param {number} userId - 用户ID
   */
  async getAgent(agentId, userId) {
    return new Promise((resolve, reject) => {
      const { db } = require('../db/init.cjs');

      db.get(
        'SELECT * FROM agents WHERE id = ? AND user_id = ?',
        [agentId, userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            reject(new Error('Agent 不存在或无权限'));
          } else {
            resolve(this.formatAgent(row));
          }
        }
      );
    });
  }

  /**
   * 获取用户的所有 Agent
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   */
  async getUserAgents(userId, options = {}) {
    const { status = 'all', search = '', page = 1, limit = 20 } = options;

    let sql = 'SELECT * FROM agents WHERE user_id = ?';
    const params = [userId];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    return new Promise((resolve, reject) => {
      const { db } = require('../db/init.cjs');
      db.all(sql, params, async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          try {
            const agents = rows.map(row => this.formatAgent(row));
            const agentIds = agents.map(agent => agent.id);
            let metrics = {};

            if (agentIds.length > 0) {
              metrics = await this.getAgentMetricsForUser(userId, agentIds);
            }

            const enriched = agents.map(agent => {
              const metric = metrics[agent.id] || {};
              const successRate = metric.successRate || 0;
              return {
                ...agent,
                totalRuns: metric.totalRuns || 0,
                successRuns: metric.successRuns || 0,
                failedRuns: metric.failedRuns || 0,
                successRate: Math.round(successRate * 100),
                avgDurationMs: metric.avgDuration || 0,
                lastRun: metric.lastCompletedAt || agent.updatedAt
              };
            });

            resolve(enriched);
          } catch (computeError) {
            console.error('[AgentEngine] 获取 Agent 指标失败:', computeError);
            resolve(rows.map(row => this.formatAgent(row)));
          }
        }
      });
    });
  }

  /**
   * 更新 Agent
   * @param {string} agentId - Agent ID
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 更新数据
   */
  async updateAgent(agentId, userId, updateData) {
    const {
      name,
      description,
      avatarUrl,
      systemPrompt,
      capabilities,
      tools,
      config,
      status
    } = updateData;

    const { db } = require('../db/init.cjs');

    // 构建更新字段
    const updateFields = [];
    const params = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (avatarUrl !== undefined) {
      updateFields.push('avatar_url = ?');
      params.push(avatarUrl);
    }
    if (systemPrompt !== undefined) {
      updateFields.push('system_prompt = ?');
      params.push(systemPrompt);
    }
    if (capabilities !== undefined) {
      updateFields.push('capabilities = ?');
      params.push(JSON.stringify(capabilities));
    }
    if (tools !== undefined) {
      updateFields.push('tools = ?');
      params.push(JSON.stringify(tools));
    }
    if (config !== undefined) {
      updateFields.push('config = ?');
      params.push(JSON.stringify(config));
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (updateFields.length === 0) {
      throw new Error('没有提供更新字段');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(agentId, userId);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE agents SET ${updateFields.join(', ')}
         WHERE id = ? AND user_id = ?`,
        params,
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Agent 不存在或无权限修改'));
          } else {
            resolve({ success: true, changes: this.changes });
          }
        }
      );
    });
  }

  /**
   * 删除 Agent
   * @param {string} agentId - Agent ID
   * @param {number} userId - 用户ID
   */
  async deleteAgent(agentId, userId) {
    const { db } = require('../db/init.cjs');

    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM agents WHERE id = ? AND user_id = ?',
        [agentId, userId],
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Agent 不存在或无权限删除'));
          } else {
            resolve({ success: true, changes: this.changes });
          }
        }
      );
    });
  }

  /**
   * 获取 Agent 的执行槽位，确保并发控制
   * @param {Object} agent - Agent 对象
   * @returns {Function} 释放函数
   */
  acquireExecutionSlot(agent) {
    const maxConcurrent = Math.max(1, agent?.config?.maxConcurrentTasks || 1);
    const entry = this.executionManager.get(agent.id) || { active: 0 };

    if (entry.active >= maxConcurrent) {
      throw new Error(`Agent "${agent.name}" 正在执行的任务已达到并发上限 (${maxConcurrent})`);
    }

    entry.active += 1;
    this.executionManager.set(agent.id, entry);

    return () => {
      const current = this.executionManager.get(agent.id);
      if (!current) return;

      current.active = Math.max(0, current.active - 1);

      if (current.active === 0) {
        this.executionManager.delete(agent.id);
      } else {
        this.executionManager.set(agent.id, current);
      }
    };
  }

  /**
   * 执行任务
   * @param {string} agentId - Agent ID
   * @param {Object} taskData - 任务数据
   * @param {number} userId - 用户ID
   */
  async executeTask(agentId, taskData, userId) {
    let agent = null;
    let releaseSlot = null;

    try {
      agent = await this.getAgent(agentId, userId);
      releaseSlot = this.acquireExecutionSlot(agent);
      const runtimeConfig = await this.getRuntimeConfig(userId);
      await this.maybeAutoRefreshTools(runtimeConfig);
      const { task, execution } = await this.prepareExecution(agent, agentId, taskData, userId, { queue: false });
      const result = await this.processTaskExecution(agent, task, execution, userId, { runtimeConfig });
      return result;
    } catch (error) {
      console.error('执行任务失败:', error);
      throw error;
    } finally {
      if (releaseSlot) {
        releaseSlot();
      }
    }
  }

  /**
   * 准备任务与执行记录
   * @param {Object} agent - Agent 对象
   */
  async prepareExecution(agent, agentId, taskData, userId, options = {}) {
    const { queue = true } = options;
    const task = await this.createTask(agentId, taskData, userId);
    const executionStatus = queue ? 'queued' : 'running';
    const execution = await this.createExecution(agentId, task.id, userId, executionStatus);

    if (queue) {
      const queuedAt = new Date().toISOString();
      await this.updateTask(task.id, {
        status: 'pending',
        queuedAt,
        startedAt: null,
        completedAt: null,
        durationMs: null,
        attempts: 0,
        lastErrorType: null,
        lastErrorMessage: null
      });

      await this.updateExecution(execution.id, {
        status: 'queued',
        progress: 0,
        currentStep: null,
        errorMessage: null,
        completedAt: null,
        queuedAt,
        attempts: 0,
        lastErrorType: null,
        lastErrorMessage: null,
        retryDelayMs: 0
      });

      task.status = 'pending';
      execution.status = 'queued';
      task.queuedAt = queuedAt;
      execution.queuedAt = queuedAt;
      execution.progress = 0;
      execution.startedAt = null;
      execution.completedAt = null;
      execution.currentStep = null;
      execution.errorMessage = null;
    } else {
      await this.updateAgent(agentId, userId, { status: 'busy' });
    }

    return { task, execution };
  }

  /**
   * 执行任务流水线
   */
  async processTaskExecution(agent, task, execution, userId, options = {}) {
    const runtimeConfig = options.runtimeConfig || await this.getRuntimeConfig(userId);

    try {
      await this.updateTask(task.id, {
        status: 'running',
        startedAt: new Date().toISOString()
      });

      await this.updateExecution(execution.id, {
        status: 'running',
        progress: 0,
        currentStep: null,
        errorMessage: null,
        startedAt: new Date().toISOString(),
        completedAt: null
      });

      task.status = 'running';
      execution.status = 'running';

      this.publishExecutionEvent(agent.id, execution.id, {
        status: 'running',
        progress: 0,
        taskId: task.id,
        startedAt: execution.startedAt
      });

      const subtasks = await this.taskDecomposer.decomposeTask(
        task,
        agent,
        runtimeConfig?.decomposer || runtimeConfig?.decomposition || null
      );
      const results = await this.executeSubtasks(subtasks, agent, execution, task);
      const finalResult = await this.generateFinalResult(results, agent);

      await this.updateTask(task.id, {
        status: 'completed',
        outputData: finalResult,
        completedAt: new Date().toISOString()
      });

      await this.updateExecution(execution.id, {
        status: 'completed',
        progress: 1.0,
        completedAt: new Date().toISOString()
      });

      await this.updateAgent(agent.id, userId, { status: 'active' });

      task.status = 'completed';
      execution.status = 'completed';

      this.publishExecutionEvent(agent.id, execution.id, {
        status: 'completed',
        progress: 1,
        taskId: task.id,
        result: finalResult,
        completedAt: execution.completedAt
      });

      return finalResult;
    } catch (error) {
      if (error?.cancelled) {
        await this.updateTask(task.id, {
          status: 'cancelled',
          outputData: { cancelled: true, message: error.message },
          completedAt: new Date().toISOString()
        });

        await this.updateExecution(execution.id, {
          status: 'cancelled',
          errorMessage: error.message,
          completedAt: new Date().toISOString()
        });

        await this.updateAgent(agent.id, userId, { status: 'active' });
        task.status = 'cancelled';
        execution.status = 'cancelled';

        this.publishExecutionEvent(agent.id, execution.id, {
          status: 'cancelled',
          progress: execution.progress || 0,
          taskId: task.id,
          error: error.message,
          completedAt: execution.completedAt
        });
        throw error;
      }

      await this.updateTask(task.id, {
        status: 'failed',
        outputData: { error: error.message },
        completedAt: new Date().toISOString()
      });

      await this.updateExecution(execution.id, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date().toISOString()
      });

      await this.updateAgent(agent.id, userId, { status: 'error' });

      task.status = 'failed';
      execution.status = 'failed';

      this.publishExecutionEvent(agent.id, execution.id, {
        status: 'failed',
        progress: execution.progress || 0,
        taskId: task.id,
        error: error.message,
        completedAt: execution.completedAt
      });

      throw error;
    }
  }

  async startTaskExecution(agentId, taskData, userId) {
    const agent = await this.getAgent(agentId, userId);
    const runtimeConfig = await this.getRuntimeConfig(userId);
    const { task, execution } = await this.prepareExecution(agent, agentId, taskData, userId, { queue: true });

    const retryStrategy = this.resolveRetryStrategy(agent, runtimeConfig);
    const defaultMaxAttempts = retryStrategy?.default?.maxAttempts
      ?? retryStrategy?.global?.maxAttempts
      ?? (agent.config?.retryAttempts ?? 0) + 1;
    const maxAttempts = Math.max(1, defaultMaxAttempts);
    const priority = Number.isFinite(taskData.priority)
      ? Number(taskData.priority)
      : Number(runtimeConfig?.queue?.defaultPriority ?? task.priority ?? 0);

    if (priority !== task.priority) {
      task.priority = priority;
      await this.updateTask(task.id, { priority }).catch(() => {});
    }

    await this.maybeAutoRefreshTools(runtimeConfig);

    const job = this.executionQueue.enqueue({
      agentId,
      userId,
      agentSnapshot: agent,
      task,
      execution,
      maxAttempts,
      priority,
      retryStrategy,
      runtimeConfig,
      classifyError: this.classifyExecutionError.bind(this)
    });

    return { taskId: job.task.id, executionId: job.execution.id };
  }

  /**
   * 创建任务
   * @param {string} agentId - Agent ID
   * @param {Object} taskData - 任务数据
   * @param {number} userId - 用户ID
   */
  async createTask(agentId, taskData, userId) {
    const id = uuidv4();
    const {
      title,
      description = '',
      inputData = {},
      priority = 0,
      decomposition,
      decompositionOptions
    } = taskData;

    if (!title) {
      throw new Error('任务标题不能为空');
    }

    const combinedDecomposition = decompositionOptions || decomposition;
    const normalizedInput = typeof inputData === 'object' && inputData !== null
      ? { ...inputData }
      : inputData;

    if (combinedDecomposition && normalizedInput && typeof normalizedInput === 'object') {
      normalizedInput.__decomposition = combinedDecomposition;
    }

    const nowIso = new Date().toISOString();

    const task = {
      id,
      agentId,
      userId,
      title,
      description,
      inputData: normalizedInput,
      status: 'pending',
      priority,
      createdAt: nowIso,
      queuedAt: nowIso,
      attempts: 0
    };

    if (combinedDecomposition) {
      task.decompositionOptions = combinedDecomposition;
    }

    // 保存到数据库
    await this.saveTask(task);

    return task;
  }

  async runQueuedExecution(job) {
    if (job?.cancelled) {
      await this.handleJobCancelled(job, { phase: 'queued' });
      return;
    }

    const agent = job.agentSnapshot || await this.getAgent(job.agentId, job.userId);
    job.agentSnapshot = agent;
    const runtimeConfig = job.runtimeConfig || await this.getRuntimeConfig(job.userId);
    job.runtimeConfig = runtimeConfig;
    job.retryStrategy = job.retryStrategy || this.resolveRetryStrategy(agent, runtimeConfig);
    let releaseSlot;

    try {
      if (job.resetPromise) {
        try {
          await job.resetPromise;
        } finally {
          job.resetPromise = null;
        }
      }

      releaseSlot = this.acquireExecutionSlot(agent);
      await this.updateAgent(agent.id, job.userId, { status: 'busy' });

      // 清理上一次执行遗留的错误信息
      await this.updateExecution(job.execution.id, {
        errorMessage: null,
        lastErrorType: null,
        lastErrorMessage: null
      });

      await this.processTaskExecution(agent, job.task, job.execution, job.userId, {
        runtimeConfig,
        job
      });
    } finally {
      if (releaseSlot) {
        releaseSlot();
      }
    }
  }

  async resetQueuedJobState(job, meta = {}) {
    const queuedAt = new Date().toISOString();
    const attempts = Number(meta.attempts ?? job.attempts ?? 0);
    const errorType = meta.errorType ?? job.lastErrorType ?? null;
    const errorMessage = meta.errorMessage ?? job.execution?.errorMessage ?? null;
    const retryDelay = Number.isFinite(meta.delay) ? meta.delay : null;

    await this.updateTask(job.task.id, {
      status: 'pending',
      queuedAt,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      outputData: null,
      attempts,
      lastErrorType: errorType,
      lastErrorMessage: errorMessage
    });

    await this.updateExecution(job.execution.id, {
      status: 'queued',
      progress: 0,
      currentStep: null,
      errorMessage: null,
      completedAt: null,
      startedAt: null,
      durationMs: null,
      queuedAt,
      attempts,
      lastErrorType: errorType,
      lastErrorMessage: errorMessage,
      retryDelayMs: retryDelay ?? 0
    });

    job.task.status = 'pending';
    job.task.startedAt = null;
    job.task.completedAt = null;
    job.task.outputData = null;
    job.task.queuedAt = queuedAt;
    job.task.attempts = attempts;
    job.task.lastErrorType = errorType;
    job.task.lastErrorMessage = errorMessage;
    job.execution.status = 'queued';
    job.execution.startedAt = null;
    job.execution.completedAt = null;
    job.execution.progress = 0;
    job.execution.currentStep = null;
    job.execution.errorMessage = null;
    job.execution.queuedAt = queuedAt;
    job.execution.attempts = attempts;
    job.execution.retryDelayMs = retryDelay ?? 0;
    job.execution.lastErrorType = errorType;
    job.execution.lastErrorMessage = errorMessage;

    await this.updateAgent(job.agentId, job.userId, { status: 'inactive' });
  }

  publishExecutionEvent(agentId, executionId, payload = {}) {
    const event = {
      agentId,
      executionId,
      timestamp: Date.now(),
      ...payload
    };
    executionEvents.emitUpdate(agentId, executionId, event);
    sseManager.broadcast(agentId, event);
  }

  async handleJobQueued(job) {
    if (!job?.task || !job?.execution) return;
    const queuedAtIso = new Date(job.queuedAt || Date.now()).toISOString();

    await this.updateTask(job.task.id, {
      status: 'pending',
      queuedAt: queuedAtIso,
      attempts: job.attempts || 0
    });

    await this.updateExecution(job.execution.id, {
      status: 'queued',
      queuedAt: queuedAtIso,
      attempts: job.attempts || 0,
      retryDelayMs: 0
    });

    job.task.queuedAt = queuedAtIso;
    job.execution.queuedAt = queuedAtIso;

    const queueSnapshot = this.executionQueue.getJobsByAgent(job.agentId);
    const queued = queueSnapshot.queued || [];
    const position = queued.findIndex(item => item.executionId === job.execution.id) + 1;

    this.publishExecutionEvent(job.agentId, job.execution.id, {
      status: 'queued',
      taskId: job.task.id,
      queuedAt: queuedAtIso,
      queuePosition: position > 0 ? position : queued.length,
      waiting: queued.length,
      priority: job.priority ?? 0
    });

    this.publishQueueSnapshot(job.agentId);
  }

  async handleJobRetry(job, error, meta = {}) {
    if (!job?.task || !job?.execution) return;
    const errorType = meta.errorType || this.classifyExecutionError(error);
    const attempts = meta.attempts ?? job.attempts ?? 0;
    const delay = meta.delay ?? meta.retryDelay ?? 0;
    const message = error?.message || meta.errorMessage || '任务重试';

    console.warn(`[AgentEngine] 队列任务 ${job.task.id} 第 ${attempts} 次失败 (${errorType})，准备在 ${delay}ms 后重试: ${message}`);

    job.resetPromise = this.resetQueuedJobState(job, {
      attempts,
      errorType,
      errorMessage: message,
      delay
    });

    job.resetPromise?.catch(err => {
      console.error('[AgentEngine] 重置任务状态失败:', err);
    });

    const queueSnapshot = this.executionQueue.getJobsByAgent(job.agentId);
    const queued = queueSnapshot.queued || [];
    const position = queued.findIndex(item => item.executionId === job.execution.id) + 1;

    this.publishExecutionEvent(job.agentId, job.execution.id, {
      status: 'retrying',
      taskId: job.task.id,
      error: message,
      errorType,
      attempts,
      retryDelayMs: delay,
      queuePosition: position > 0 ? position : queued.length,
      waiting: queued.length
    });

    this.publishQueueSnapshot(job.agentId);
  }

  async handleJobFailed(job, error, meta = {}) {
    if (!job?.task || !job?.execution) return;
    const errorType = meta.errorType || job.lastErrorType || this.classifyExecutionError(error);
    const message = error?.message || meta.errorMessage || '任务执行失败';
    const attempts = meta.attempts ?? job.attempts ?? 0;
    const completedAt = new Date().toISOString();

    await this.updateTask(job.task.id, {
      status: 'failed',
      completedAt,
      attempts,
      lastErrorType: errorType,
      lastErrorMessage: message
    });

    await this.updateExecution(job.execution.id, {
      status: 'failed',
      errorMessage: message,
      completedAt,
      lastErrorType: errorType,
      lastErrorMessage: message,
      attempts
    });

    this.publishExecutionEvent(job.agentId, job.execution.id, {
      status: 'failed',
      taskId: job.task.id,
      error: message,
      errorType,
      attempts,
      completedAt
    });

    this.publishQueueSnapshot(job.agentId);
  }

  async handleJobCompleted(job) {
    if (!job?.task || !job?.execution) return;
    const completedAt = new Date().toISOString();

    this.publishExecutionEvent(job.agentId, job.execution.id, {
      status: 'completed',
      taskId: job.task.id,
      completedAt
    });

    this.publishQueueSnapshot(job.agentId);
  }

  async handleJobCancelled(job, context = {}) {
    if (!job) return;
    const executionId = job.execution?.id || job.executionId;
    const taskId = job.task?.id || job.taskId;
    const agentId = job.agentId;
    const cancelledAt = new Date().toISOString();

    if (taskId) {
      await this.updateTask(taskId, {
        status: 'cancelled',
        completedAt: cancelledAt,
        lastErrorType: 'cancelled',
        lastErrorMessage: '任务在执行前被取消'
      }).catch(() => {});
    }
    if (executionId) {
      await this.updateExecution(executionId, {
        status: 'cancelled',
        completedAt: cancelledAt,
        errorMessage: '任务在执行前被取消',
        lastErrorType: 'cancelled',
        lastErrorMessage: '任务在执行前被取消'
      }).catch(() => {});
    }

    if (agentId && executionId) {
      this.publishExecutionEvent(agentId, executionId, {
        status: 'cancelled',
        taskId,
        cancelledAt,
        phase: context.phase || 'queued'
      });
      this.publishQueueSnapshot(agentId);
    }
  }

  async handleJobPriorityChanged(job) {
    if (!job?.agentId || !job?.execution) return;
    const queueSnapshot = this.executionQueue.getJobsByAgent(job.agentId);
    const queued = queueSnapshot.queued || [];
    const position = queued.findIndex(item => item.executionId === job.execution.id) + 1;

    this.publishExecutionEvent(job.agentId, job.execution.id, {
      status: 'queued',
      taskId: job.task?.id || job.taskId,
      priority: job.priority ?? 0,
      queuePosition: position > 0 ? position : queued.length,
      waiting: queued.length
    });

    this.publishQueueSnapshot(job.agentId);
  }

  async handleJobStarted(job) {
    if (!job?.agentId || !job?.execution) return;
    const startedAtIso = new Date(job.startedAt || Date.now()).toISOString();

    await this.updateExecution(job.execution.id, {
      status: 'running',
      startedAt: startedAtIso
    }).catch(() => {});

    await this.updateTask(job.task?.id || job.taskId, {
      status: 'running',
      startedAt: startedAtIso
    }).catch(() => {});

    this.publishExecutionEvent(job.agentId, job.execution.id, {
      status: 'running',
      taskId: job.task?.id || job.taskId,
      startedAt: startedAtIso
    });

    this.publishQueueSnapshot(job.agentId);
  }

  publishQueueSnapshot(agentId) {
    if (!agentId) return;
    const snapshot = this.executionQueue.getJobsByAgent(agentId);
    const payload = {
      type: 'queue_update',
      waiting: snapshot.queued || [],
      running: snapshot.running || [],
      waitingCount: (snapshot.queued || []).length,
      runningCount: (snapshot.running || []).length,
      concurrency: this.executionQueue.concurrency,
      timestamp: Date.now()
    };
    sseManager.broadcast(agentId, payload);
  }

  /**
   * 执行子任务
   * @param {Array} subtasks - 子任务列表
   * @param {Object} agent - Agent 对象
   * @param {Object} execution - 执行记录
   */
  async executeSubtasks(subtasks, agent, execution, task) {
    const results = [];
    const totalSubtasks = subtasks.length;
    const retryAttempts = Math.max(0, agent.config?.retryAttempts || 0);
    const outcomes = new Map();

    for (let i = 0; i < subtasks.length; i++) {
      const subtask = subtasks[i];
      if (await this.isExecutionCancelled(execution.id)) {
        const cancelError = new Error('Execution cancelled by user');
        cancelError.cancelled = true;
        cancelError.taskId = task?.id;
        throw cancelError;
      }
      const dependencies = Array.isArray(subtask.dependencies) ? subtask.dependencies : [];
      const unmetDependencies = dependencies.filter(depId => {
        const depOutcome = outcomes.get(depId);
        return !depOutcome || depOutcome.status !== 'completed';
      });

      if (unmetDependencies.length > 0) {
        const message = `依赖子任务未完成: ${unmetDependencies.join(', ')}`;
        outcomes.set(subtask.id, { status: 'skipped', error: message });
        await this.updateSubtask(subtask.id, {
          status: 'skipped',
          errorMessage: message,
          completedAt: new Date().toISOString()
        });
        results.push({
          subtaskId: subtask.id,
          title: subtask.title,
          status: 'skipped',
          error: message
        });
        this.publishExecutionEvent(agent.id, execution.id, {
          status: execution.status,
          progress: i / Math.max(1, totalSubtasks),
          currentStep: subtask.title,
          taskId: task.id,
          subtask: {
            id: subtask.id,
            title: subtask.title,
            status: 'skipped',
            error: message
          }
        });
        continue;
      }

      await this.updateSubtask(subtask.id, {
        status: 'running',
        startedAt: new Date().toISOString()
      });

      const currentProgress = totalSubtasks === 0 ? 0 : i / totalSubtasks;
      await this.updateExecution(execution.id, {
        progress: currentProgress,
        currentStep: subtask.title
      });

      const subtaskStart = Date.now();

      try {
        const result = await this.executeSubtaskWithRetry(subtask, agent, execution, retryAttempts);
        const duration = Date.now() - subtaskStart;

        await this.updateSubtask(subtask.id, {
          status: 'completed',
          outputData: result,
          completedAt: new Date().toISOString(),
          durationMs: duration
        });

        outcomes.set(subtask.id, { status: 'completed', result });

        results.push({
          ...result,
          subtaskId: subtask.id,
          title: subtask.title,
          status: 'completed',
          duration
        });

        this.publishExecutionEvent(agent.id, execution.id, {
          status: execution.status,
          progress: Math.min(1, (i + 1) / Math.max(1, totalSubtasks)),
          currentStep: subtask.title,
          taskId: task.id,
          subtask: {
            id: subtask.id,
            title: subtask.title,
            status: 'completed',
            result
          }
        });
      } catch (error) {
        console.error(`子任务执行失败: ${subtask.title}`, error);
        const duration = Date.now() - subtaskStart;

        await this.updateSubtask(subtask.id, {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date().toISOString(),
          durationMs: duration
        });

        outcomes.set(subtask.id, { status: 'failed', error });

        results.push({
          subtaskId: subtask.id,
          title: subtask.title,
          status: 'failed',
          error: error.message
        });

        if (agent.config?.stopOnError) {
          this.publishExecutionEvent(agent.id, execution.id, {
            status: 'failed',
            progress: (i + 1) / Math.max(1, totalSubtasks),
            currentStep: subtask.title,
            taskId: task.id,
            error: error.message
          });
          throw error;
        }

        this.publishExecutionEvent(agent.id, execution.id, {
          status: execution.status,
          progress: (i + 1) / Math.max(1, totalSubtasks),
          currentStep: subtask.title,
          taskId: task.id,
          subtask: {
            id: subtask.id,
            title: subtask.title,
            status: 'failed',
            error: error.message
          }
        });
      }

      const nextProgress = totalSubtasks === 0 ? 1 : (i + 1) / totalSubtasks;
      await this.updateExecution(execution.id, {
        progress: Math.min(1, nextProgress)
      });
    }

    return results;
  }

  /**
   * 执行单个子任务
   * @param {Object} subtask - 子任务对象
   * @param {Object} agent - Agent 对象
   */
  async executeSubtaskWithRetry(subtask, agent, execution, retryAttempts) {
    let attempt = 0;
    let lastError = null;
    const maxAttempts = Math.max(1, retryAttempts + 1);

    while (attempt < maxAttempts) {
      try {
        if (await this.isExecutionCancelled(execution.id)) {
          const cancelError = new Error('Execution cancelled by user');
          cancelError.cancelled = true;
          throw cancelError;
        }
        if (attempt > 0) {
          await this.updateExecution(execution.id, {
            currentStep: `${subtask.title} (第 ${attempt + 1} 次尝试)`
          });
        }
        return await this.executeSubtask(subtask, agent);
      } catch (error) {
        if (error?.cancelled) {
          throw error;
        }
        lastError = error;
        attempt += 1;

        if (attempt >= maxAttempts) {
          throw lastError;
        }

        await this.wait(Math.min(2000, 500 * attempt));
      }
    }

    throw lastError;
  }

  /**
   * 执行单个子任务
   * @param {Object} subtask - 子任务对象
   * @param {Object} agent - Agent 对象
   */
  async executeSubtask(subtask, agent) {
    const { type, inputData, config } = subtask;

    switch (type) {
      case 'tool_call':
        return await this.executeToolCall(subtask, agent);
      case 'ai_analysis':
        return await this.executeAIAnalysis(subtask, agent);
      case 'data_processing':
        return await this.executeDataProcessing(subtask, agent);
      case 'web_search':
        return await this.executeWebSearch(subtask, agent);
      case 'file_operation':
        return await this.executeFileOperation(subtask, agent);
      default:
        throw new Error(`未知子任务类型: ${type}`);
    }
  }

  /**
   * 执行工具调用
   * @param {Object} subtask - 子任务对象
   * @param {Object} agent - Agent 对象
   */
  async executeToolCall(subtask, agent) {
    const { toolName, parameters } = subtask.config;
    await this.ensureToolsLoaded();

    // ✅ 工具过滤检查
    if (!this.isToolAllowed(toolName, agent)) {
      throw new Error(`工具 "${toolName}" 未被 Agent "${agent.name}" 授权使用`);
    }

    // 检查是否是 MCP 工具（格式：serviceId_toolName）
    if (toolName && toolName.includes('_')) {
      // 尝试调用 MCP 工具
      try {
        // 🔥 关键修复：传递agent.userId给callMcpTool
        const mcpResult = await this.callMcpTool(toolName, parameters, agent.userId);
        return mcpResult;
      } catch (mcpError) {
        // 如果不是 MCP 工具或调用失败，继续使用本地工具
        console.warn(`[AgentEngine] MCP 工具调用失败，尝试本地工具: ${toolName}`, mcpError.message);
      }
    }

    // 使用本地注册的工具
    const tool = this.toolRegistry.get(toolName);

    if (!tool) {
      throw new Error(`工具不存在: ${toolName}`);
    }

    const mergedParams = {
      ...(tool.parameters || {}),
      ...(parameters || {})
    };

    return await tool.execute(mergedParams, subtask.inputData || {}, { agent, subtask, tool });
  }

  /**
   * 检查工具是否被 Agent 允许使用
   * @param {string} toolName - 工具名称
   * @param {Object} agent - Agent 对象
   * @returns {boolean} 是否允许
   */
  isToolAllowed(toolName, agent) {
    // 如果 Agent 没有配置工具过滤，允许所有工具
    if (!agent.config || !agent.config.toolFilter) {
      return true;
    }

    const filter = agent.config.toolFilter;

    // 支持两种过滤模式：
    // 1. allowList（白名单）：只允许列表中的工具
    // 2. blockList（黑名单）：禁止列表中的工具，其他都允许

    if (filter.mode === 'allowList') {
      const allowedTools = filter.tools || [];
      return allowedTools.includes(toolName);
    } else if (filter.mode === 'blockList') {
      const blockedTools = filter.tools || [];
      return !blockedTools.includes(toolName);
    }

    // 默认允许所有工具
    return true;
  }

  /**
   * 获取 Agent 可用的工具列表（应用过滤器）
   * @param {Object} agent - Agent 对象
   * @returns {Array} 可用工具列表
   */
  getAvailableTools(agent) {
    const allTools = [];

    // 获取本地注册的工具
    for (const [toolName, tool] of this.toolRegistry.entries()) {
      if (this.isToolAllowed(toolName, agent)) {
        allTools.push({
          name: toolName,
          description: tool.description,
          source: tool.source || 'built-in',
          parameters: tool.parameters || {}
        });
      }
    }

    // 获取 MCP 工具（如果有）
    try {
      const mcpManager = require('./mcp-manager.cjs');
      if (mcpManager && typeof mcpManager.getAllTools === 'function') {
        const mcpTools = mcpManager.getAllTools(agent.userId);
        for (const mcpTool of mcpTools) {
          const toolName = mcpTool.function.name;
          if (this.isToolAllowed(toolName, agent)) {
            allTools.push({
              name: toolName,
              description: mcpTool.function.description,
              source: 'mcp',
              parameters: mcpTool.function.parameters
            });
          }
        }
      }
    } catch (error) {
      console.warn('[AgentEngine] 获取 MCP 工具失败:', error.message);
    }

    return allTools;
  }

  /**
   * 调用 MCP 工具
   * @param {String} toolName - 工具名称（格式：serviceId_toolName）
   * @param {Object} parameters - 工具参数
   * @param {Number} userId - 用户ID（可选）
   */
  async callMcpTool(toolName, parameters = {}, userId = null) {
    const axios = require('axios');
    const config = require('../config.cjs');

    const baseURL = `http://localhost:${config.server.port}`;

    try {
      // 🔥 关键修复：在请求体中包含userId，确保调用正确的用户服务
      const requestBody = {
        toolName,
        parameters
      };

      // 如果提供了userId，添加到请求体
      if (userId) {
        requestBody.userId = userId;
        console.log(`[AgentEngine] 调用MCP工具 ${toolName}，userId: ${userId}`);
      } else {
        console.log(`[AgentEngine] 调用MCP工具 ${toolName}，无userId（全局模式）`);
      }

      const response = await axios.post(`${baseURL}/api/mcp/call`, requestBody, {
        timeout: 30000 // 30 秒超时
      });

      if (response.data.success) {
        return {
          type: 'mcp_tool_call',
          toolName,
          parameters,
          result: response.data.content,
          serviceId: response.data.serviceId,
          actualToolName: response.data.actualToolName,
          userId: response.data.userId, // 记录实际使用的userId
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(response.data.error || 'MCP 工具调用失败');
      }
    } catch (error) {
      console.error('[AgentEngine] MCP 工具调用错误:', error.message);
      throw new Error(`MCP 工具调用失败: ${error.message}`);
    }
  }

  /**
   * 执行 AI 分析
   * @param {Object} subtask - 子任务对象
   * @param {Object} agent - Agent 对象
   */
  async executeAIAnalysis(subtask, agent) {
    const { prompt, model, temperature } = subtask.config;

    const AIService = require('./aiService.cjs');
    // 传入用户ID以使用用户配置的API密钥
    const aiService = new AIService(agent.userId);
    const result = await aiService.generateResponse(prompt, JSON.stringify(subtask.inputData), {
      model: model || 'gpt-4o-mini',
      temperature: temperature || 0.7
    });

    return {
      type: 'ai_analysis',
      prompt,
      result,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 执行数据处理
   * @param {Object} subtask - 子任务对象
   * @param {Object} agent - Agent 对象
   */
  async executeDataProcessing(subtask, agent) {
    const { operation, config } = subtask.config;

    switch (operation) {
      case 'filter':
        return this.filterData(subtask.inputData, config);
      case 'transform':
        return this.transformData(subtask.inputData, config);
      case 'aggregate':
        return this.aggregateData(subtask.inputData, config);
      case 'validate':
        return this.validateData(subtask.inputData, config);
      default:
        throw new Error(`未知数据处理操作: ${operation}`);
    }
  }

  /**
   * 执行网络搜索
   * @param {Object} subtask - 子任务对象
   * @param {Object} agent - Agent 对象
   */
  async executeWebSearch(subtask, agent) {
    const { query, maxResults = 5 } = subtask.config;

    // 这里可以集成搜索 API
    const searchResults = await this.performWebSearch(query, maxResults);

    return {
      type: 'web_search',
      query,
      results: searchResults,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 执行文件操作
   * @param {Object} subtask - 子任务对象
   * @param {Object} agent - Agent 对象
   */
  async executeFileOperation(subtask, agent) {
    const { operation, filePath, content } = subtask.config;

    const fs = require('fs').promises;

    switch (operation) {
      case 'read':
        const data = await fs.readFile(filePath, 'utf8');
        return {
          type: 'file_operation',
          operation: 'read',
          filePath,
          content: data,
          timestamp: new Date().toISOString()
        };
      case 'write':
        await fs.writeFile(filePath, content);
        return {
          type: 'file_operation',
          operation: 'write',
          filePath,
          success: true,
          timestamp: new Date().toISOString()
        };
      case 'append':
        await fs.appendFile(filePath, content);
        return {
          type: 'file_operation',
          operation: 'append',
          filePath,
          success: true,
          timestamp: new Date().toISOString()
        };
      default:
        throw new Error(`未知文件操作: ${operation}`);
    }
  }

  /**
   * 生成最终结果
   * @param {Array} subtaskResults - 子任务结果列表
   * @param {Object} agent - Agent 对象
   */
  async generateFinalResult(subtaskResults, agent) {
    const AIService = require('./aiService.cjs');
    // 传入用户ID以使用用户配置的API密钥
    const aiService = new AIService(agent.userId);

    const prompt = `基于以下子任务执行结果，生成最终的任务完成报告：

子任务结果：
${subtaskResults.map((result, index) =>
  `${index + 1}. ${result.title || '子任务'}: ${JSON.stringify(result, null, 2)}`
).join('\n\n')}

请生成一个清晰、完整的任务完成报告。`;

    const finalResponse = await aiService.generateResponse(prompt, '', {
      model: 'gpt-4o-mini',
      temperature: 0.3
    });

    return {
      summary: finalResponse?.content || '',
      usage: finalResponse?.usage || null,
      model: finalResponse?.model || 'gpt-4o-mini',
      subtaskResults,
      completedAt: new Date().toISOString(),
      totalSubtasks: subtaskResults.length,
      successfulSubtasks: subtaskResults.filter(r => r.status === 'completed').length
    };
  }

  /**
   * 注册默认工具
   */
  registerDefaultTools() {
    const defaults = this.getBuiltInToolDefinitions();
    for (const [name, tool] of Object.entries(defaults)) {
      this.toolRegistry.set(name, tool);
    }
  }

  /**
   * 内置工具定义
   */
  getBuiltInToolDefinitions() {
    return {
      web_search: {
        name: 'web_search',
        description: '搜索网络信息',
        source: 'built-in',
        execute: async (parameters = {}) => {
          const { query, maxResults = 5 } = parameters;
          const results = await this.performWebSearch(query, maxResults);
          return { query, results, timestamp: new Date().toISOString() };
        }
      },
      read_file: {
        name: 'read_file',
        description: '读取文件内容',
        source: 'built-in',
        execute: async (parameters = {}) => {
          const { filePath } = parameters;
          if (!filePath) {
            throw new Error('读取文件需要提供 filePath');
          }
          const fs = require('fs').promises;
          const content = await fs.readFile(filePath, 'utf8');
          return { content, filePath, timestamp: new Date().toISOString() };
        }
      },
      write_file: {
        name: 'write_file',
        description: '写入文件内容',
        source: 'built-in',
        execute: async (parameters = {}) => {
          const { filePath, content = '' } = parameters;
          if (!filePath) {
            throw new Error('写入文件需要提供 filePath');
          }
          const fs = require('fs').promises;
          await fs.writeFile(filePath, content);
          return { success: true, filePath, timestamp: new Date().toISOString() };
        }
      },
      validate_data: {
        name: 'validate_data',
        description: '验证数据格式和内容',
        source: 'built-in',
        execute: async (parameters = {}, inputData = {}) => {
          const { schema } = parameters;
          const isValid = this.validateData(inputData, { schema });
          return { valid: isValid, errors: isValid ? [] : ['数据验证失败'] };
        }
      }
    };
  }

  /**
   * 确保工具已从数据库加载
   */
  async ensureToolsLoaded() {
    if (this.toolsLoaded) {
      return;
    }

    if (!this.toolsLoadingPromise) {
      this.toolsLoadingPromise = this.loadToolsFromDatabase();
    }

    await this.toolsLoadingPromise;
  }

  /**
   * 从数据库加载工具定义
   */
  async loadToolsFromDatabase(force = false) {
    if (this.toolsLoaded && !force) {
      return;
    }

    try {
      if (force) {
        this.clearDatabaseTools();
      }

      const { db } = require('../db/init.cjs');
      if (!db) {
        this.toolsLoaded = true;
        return;
      }

      const rows = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM agent_tools', [], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result || []);
          }
        });
      });

      for (const toolRecord of rows) {
        this.registerToolFromRecord(toolRecord);
      }
    } catch (error) {
      console.error('[AgentEngine] 加载数据库工具失败:', error);
    } finally {
      this.toolsLoaded = true;
      this.lastToolRefresh = new Date();
      this.toolsLoadingPromise = null;
    }
  }

  clearDatabaseTools() {
    for (const [name, tool] of this.toolRegistry.entries()) {
      if (tool?.source === 'database') {
        this.toolRegistry.delete(name);
      }
    }
  }

  /**
   * 从数据库记录注册工具
   * @param {Object} toolRecord - agent_tools 表记录
   */
  registerToolFromRecord(toolRecord) {
    const implementation = this.safeParseJSON(toolRecord.implementation, {});
    const parameters = this.safeParseJSON(toolRecord.parameters, {});

    if (!implementation || Object.keys(implementation).length === 0) {
      console.warn(`[AgentEngine] 工具 ${toolRecord.name} 缺少 implementation 配置，已跳过`);
      return;
    }

    const executor = this.createExecutorFromImplementation(toolRecord.name, implementation);

    if (!executor) {
      console.warn(`[AgentEngine] 工具 ${toolRecord.name} 暂不支持的实现类型: ${implementation.type}`);
      return;
    }

    this.toolRegistry.set(toolRecord.name, {
      name: toolRecord.name,
      description: toolRecord.description,
      parameters,
      implementation,
      source: 'database',
      updatedAt: toolRecord.updated_at || toolRecord.created_at || new Date().toISOString(),
      execute: executor
    });
  }

  async refreshTools() {
    await this.loadToolsFromDatabase(true);
    return {
      success: true,
      refreshedAt: this.lastToolRefresh,
      tools: Array.from(this.toolRegistry.values()).map(tool => ({
        name: tool.name,
        source: tool.source || 'built-in',
        description: tool.description
      }))
    };
  }

  /**
   * 安全解析 JSON
   */
  safeParseJSON(payload, fallback = null) {
    if (!payload) return fallback;
    try {
      return typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch (error) {
      console.warn('[AgentEngine] JSON 解析失败:', error);
      return fallback;
    }
  }

  /**
   * 根据 implementation 创建执行器
   */
  createExecutorFromImplementation(name, implementation) {
    if (name === 'web_search') {
      return async (parameters = {}) => {
        const merged = { ...implementation, ...parameters };
        const { query, maxResults = 5 } = merged;
        const results = await this.performWebSearch(query, maxResults);
        return { query, results, timestamp: new Date().toISOString() };
      };
    }

    switch (implementation.type) {
      case 'web_search':
      case 'api_call':
        return async (parameters = {}, inputData = {}) => {
          const merged = { ...implementation, ...parameters };
          if (merged.body == null && inputData && Object.keys(inputData).length > 0) {
            merged.body = inputData;
          }
          return this.performApiCall(merged);
        };
      case 'file_operation':
        return async (parameters = {}) => {
          const merged = {
            operation: parameters.operation || implementation.operation,
            filePath: parameters.filePath || implementation.filePath,
            content: parameters.content ?? implementation.content ?? ''
          };
          return this.executeFileOperation({ config: merged, inputData: {} }, {});
        };
      case 'data_processing':
        return async (parameters = {}, inputData = {}) => {
          const config = {
            operation: parameters.operation || implementation.operation,
            config: parameters.config || implementation.config || {}
          };
          return this.executeDataProcessing({ inputData, config }, {});
        };
      case 'ai_service':
        return async (parameters = {}, inputData = {}, context = {}) => {
          const prompt = parameters.prompt || implementation.prompt || '';
          const model = parameters.model || implementation.model || 'gpt-4o-mini';
          const temperature = parameters.temperature ?? implementation.temperature ?? 0.7;
          const aiService = new (require('./aiService.cjs'))(context.agent?.userId);
          return aiService.generateResponse(prompt, JSON.stringify(inputData), { model, temperature });
        };
      default:
        return null;
    }
  }

  /**
   * 执行外部 API 调用
   */
  async performApiCall(config) {
    const endpoint = config.endpoint;
    if (!endpoint) {
      throw new Error('工具配置缺少 endpoint');
    }

    const method = (config.method || 'GET').toUpperCase();
    const headers = { ...(config.headers || {}) };
    const url = endpoint;
    const init = { method, headers };

    if (method !== 'GET') {
      const body = config.body ?? config.payload ?? {};
      if (typeof body === 'string') {
        init.body = body;
      } else {
        init.body = JSON.stringify(body);
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }
    }

    let fetchFn = typeof fetch === 'function' ? fetch : null;

    if (!fetchFn) {
      try {
        fetchFn = (await import('node-fetch')).default;
      } catch (err) {
        throw new Error('当前运行环境不支持 fetch，无法执行 API 调用工具');
      }
    }

    const response = await fetchFn(url, init);
    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!response.ok) {
      throw new Error(`API 请求失败 (${response.status}): ${response.statusText} - ${text}`);
    }

    return {
      status: response.status,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 执行网络搜索
   * @param {string} query - 搜索查询
   * @param {number} maxResults - 最大结果数
   */
  async performWebSearch(query, maxResults) {
    // 这里可以集成真实的搜索 API
    // 目前返回模拟数据
    return [
      {
        title: `搜索结果 1: ${query}`,
        url: 'https://example.com/result1',
        snippet: '这是搜索结果的摘要...'
      },
      {
        title: `搜索结果 2: ${query}`,
        url: 'https://example.com/result2',
        snippet: '这是另一个搜索结果的摘要...'
      }
    ].slice(0, maxResults);
  }

  /**
   * 过滤数据
   * @param {Object} inputData - 输入数据
   * @param {Object} config - 配置
   */
  filterData(inputData, config) {
    const { field, operator, value } = config;

    if (!Array.isArray(inputData)) {
      return inputData;
    }

    return inputData.filter(item => {
      const fieldValue = item[field];
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'contains':
          return fieldValue && fieldValue.includes(value);
        case 'greater_than':
          return fieldValue > value;
        case 'less_than':
          return fieldValue < value;
        default:
          return true;
      }
    });
  }

  /**
   * 转换数据
   * @param {Object} inputData - 输入数据
   * @param {Object} config - 配置
   */
  transformData(inputData, config) {
    const { mapping } = config;

    if (!Array.isArray(inputData)) {
      return inputData;
    }

    return inputData.map(item => {
      const transformed = {};
      for (const [key, value] of Object.entries(mapping)) {
        transformed[key] = typeof value === 'string' ? item[value] : value;
      }
      return transformed;
    });
  }

  /**
   * 聚合数据
   * @param {Object} inputData - 输入数据
   * @param {Object} config - 配置
   */
  aggregateData(inputData, config) {
    const { groupBy, operations } = config;

    if (!Array.isArray(inputData)) {
      return inputData;
    }

    const grouped = _.groupBy(inputData, groupBy);
    const result = {};

    for (const [key, items] of Object.entries(grouped)) {
      result[key] = {};
      for (const operation of operations) {
        const { field, type } = operation;
        const values = items.map(item => item[field]).filter(v => v != null);

        switch (type) {
          case 'count':
            result[key][`${field}_count`] = values.length;
            break;
          case 'sum':
            result[key][`${field}_sum`] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            result[key][`${field}_avg`] = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'max':
            result[key][`${field}_max`] = Math.max(...values);
            break;
          case 'min':
            result[key][`${field}_min`] = Math.min(...values);
            break;
        }
      }
    }

    return result;
  }

  /**
   * 验证数据
   * @param {Object} inputData - 输入数据
   * @param {Object} config - 配置
   */
  validateData(inputData, config) {
    const { schema } = config;

    // 简单的数据验证逻辑
    if (!schema) return true;

    for (const [field, rules] of Object.entries(schema)) {
      const value = inputData[field];

      if (rules.required && (value === undefined || value === null)) {
        return false;
      }

      if (value !== undefined && value !== null) {
        if (rules.type && typeof value !== rules.type) {
          return false;
        }

        if (rules.minLength && value.length < rules.minLength) {
          return false;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 保存 Agent
   * @param {Object} agent - Agent 对象
   */
  async saveAgent(agent) {
    const { db } = require('../db/init.cjs');
    const tableInfo = await this.getAgentTableInfo();
    const hasColumn = (name) => tableInfo.columns.has(name);
    const idAutoIncrement = tableInfo.idAutoIncrement;

    const columns = [];
    const values = [];

    const append = (name, value) => {
      if (hasColumn(name)) {
        columns.push(name);
        values.push(value);
      }
    };

    if (!idAutoIncrement) {
      append('id', agent.id);
    }

    append('user_id', agent.userId);
    append('name', agent.name);
    append('description', agent.description || null);
    append('system_prompt', agent.systemPrompt || null);
    append('status', agent.status || 'inactive');
    append('capabilities', JSON.stringify(agent.capabilities || []));
    append('tools', JSON.stringify(agent.tools || []));
    append('config', JSON.stringify(agent.config || {}));
    append('created_at', agent.createdAt || new Date().toISOString());
    append('updated_at', agent.updatedAt || new Date().toISOString());

    append('avatar_url', agent.avatarUrl || null);
    append('model_id', agent.config?.model || null);
    append('model_name', agent.config?.model || null);
    append('temperature', typeof agent.config?.temperature === 'number' ? agent.config.temperature : 0.7);
    append('max_tokens', typeof agent.config?.maxTokens === 'number' ? agent.config.maxTokens : null);
    append('stream', agent.config?.stream ? 1 : 0);
    append('use_mcp', agent.config?.useMcp ? 1 : 0);
    append('enabled_tools', JSON.stringify(agent.tools || []));
    append('is_active', agent.status === 'active' ? 1 : 0);
    append('execution_count', 0);
    append('last_executed_at', null);

    if (columns.length === 0) {
      throw new Error('无法保存 Agent：agents 表结构为空或不可用');
    }

    const placeholders = columns.map(() => '?').join(', ');

    return await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO agents (${columns.join(', ')}) VALUES (${placeholders})`,
        values,
        function(err) {
          if (err) {
            reject(err);
          } else {
            const insertedId = (typeof this === 'object' && this && 'lastID' in this)
              ? this.lastID
              : agent.id;
            if (idAutoIncrement && insertedId) {
              agent.id = insertedId;
            }
            resolve(agent.id || insertedId);
          }
        }
      );
    });
  }

  /**
   * 保存任务
   * @param {Object} task - 任务对象
   */
  async saveTask(task) {
    const { db } = require('../db/init.cjs');

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO agent_tasks (
          id, agent_id, user_id, title, description, input_data,
          status, priority, created_at, queued_at, attempts
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id,
          task.agentId,
          task.userId,
          task.title,
          task.description,
          JSON.stringify(task.inputData),
          task.status,
          task.priority,
          task.createdAt,
          task.queuedAt || task.createdAt,
          task.attempts ?? 0
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  /**
   * 创建执行记录
   * @param {string} agentId - Agent ID
   * @param {string} taskId - 任务ID
   * @param {number} userId - 用户ID
   */
  async createExecution(agentId, taskId, userId, status = 'running') {
    const id = uuidv4();
    const nowIso = new Date().toISOString();
    const execution = {
      id,
      agentId,
      taskId,
      userId,
      status,
      progress: 0.0,
      startedAt: status === 'running' ? nowIso : null,
      queuedAt: nowIso,
      attempts: 0,
      retryDelayMs: 0
    };

    const { db } = require('../db/init.cjs');

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO agent_executions (
          id, agent_id, task_id, user_id, status, progress, started_at, queued_at, attempts, retry_delay_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          execution.id,
          execution.agentId,
          execution.taskId,
          execution.userId,
          execution.status,
          execution.progress,
          execution.startedAt,
          execution.queuedAt,
          execution.attempts,
          execution.retryDelayMs
        ],
        function(err) {
          if (err) reject(err);
          else resolve(execution);
        }
      );
    });
  }

  /**
   * 更新任务
   * @param {string} taskId - 任务ID
   * @param {Object} updateData - 更新数据
   */
  async updateTask(taskId, updateData) {
    const { db } = require('../db/init.cjs');

    const updateFields = [];
    const params = [];

    if (updateData.status !== undefined) {
      updateFields.push('status = ?');
      params.push(updateData.status);
    }
    if (updateData.outputData !== undefined) {
      updateFields.push('output_data = ?');
      params.push(JSON.stringify(updateData.outputData));
    }
    if (updateData.queuedAt !== undefined) {
      updateFields.push('queued_at = ?');
      params.push(updateData.queuedAt);
    }
    if (updateData.startedAt !== undefined) {
      updateFields.push('started_at = ?');
      params.push(updateData.startedAt);
    }
    if (updateData.completedAt !== undefined) {
      updateFields.push('completed_at = ?');
      params.push(updateData.completedAt);
    }
    if (updateData.durationMs !== undefined) {
      updateFields.push('duration_ms = ?');
      params.push(updateData.durationMs);
    }
    if (updateData.attempts !== undefined) {
      updateFields.push('attempts = ?');
      params.push(updateData.attempts);
    }
    if (updateData.lastErrorType !== undefined) {
      updateFields.push('last_error_type = ?');
      params.push(updateData.lastErrorType);
    }
    if (updateData.lastErrorMessage !== undefined) {
      updateFields.push('last_error_message = ?');
      params.push(updateData.lastErrorMessage);
    }

    if (updateFields.length === 0) return;

    params.push(taskId);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE agent_tasks SET ${updateFields.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  /**
   * 更新子任务
   * @param {string} subtaskId - 子任务ID
   * @param {Object} updateData - 更新数据
   */
  async updateSubtask(subtaskId, updateData) {
    const { db } = require('../db/init.cjs');

    const updateFields = [];
    const params = [];

    if (updateData.status !== undefined) {
      updateFields.push('status = ?');
      params.push(updateData.status);
    }
    if (updateData.outputData !== undefined) {
      updateFields.push('output_data = ?');
      params.push(JSON.stringify(updateData.outputData));
    }
    if (updateData.errorMessage !== undefined) {
      updateFields.push('error_message = ?');
      params.push(updateData.errorMessage);
    }
    if (updateData.startedAt !== undefined) {
      updateFields.push('started_at = ?');
      params.push(updateData.startedAt);
    }
    if (updateData.completedAt !== undefined) {
      updateFields.push('completed_at = ?');
      params.push(updateData.completedAt);
    }
    if (updateData.durationMs !== undefined) {
      updateFields.push('duration_ms = ?');
      params.push(updateData.durationMs);
    }

    if (updateFields.length === 0) return;

    params.push(subtaskId);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE agent_subtasks SET ${updateFields.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  /**
   * 更新执行记录
   * @param {string} executionId - 执行ID
   * @param {Object} updateData - 更新数据
   */
  async updateExecution(executionId, updateData) {
    const { db } = require('../db/init.cjs');

    const updateFields = [];
    const params = [];

    if (updateData.status !== undefined) {
      updateFields.push('status = ?');
      params.push(updateData.status);
    }
    if (updateData.progress !== undefined) {
      updateFields.push('progress = ?');
      params.push(updateData.progress);
    }
    if (updateData.queuedAt !== undefined) {
      updateFields.push('queued_at = ?');
      params.push(updateData.queuedAt);
    }
    if (updateData.startedAt !== undefined) {
      updateFields.push('started_at = ?');
      params.push(updateData.startedAt);
    }
    if (updateData.currentStep !== undefined) {
      updateFields.push('current_step = ?');
      params.push(updateData.currentStep);
    }
    if (updateData.errorMessage !== undefined) {
      updateFields.push('error_message = ?');
      params.push(updateData.errorMessage);
    }
    if (updateData.attempts !== undefined) {
      updateFields.push('attempts = ?');
      params.push(updateData.attempts);
    }
    if (updateData.lastErrorType !== undefined) {
      updateFields.push('last_error_type = ?');
      params.push(updateData.lastErrorType);
    }
    if (updateData.lastErrorMessage !== undefined) {
      updateFields.push('last_error_message = ?');
      params.push(updateData.lastErrorMessage);
    }
    if (updateData.completedAt !== undefined) {
      updateFields.push('completed_at = ?');
      params.push(updateData.completedAt);
    }
    if (updateData.durationMs !== undefined) {
      updateFields.push('duration_ms = ?');
      params.push(updateData.durationMs);
    }
    if (updateData.retryDelayMs !== undefined) {
      updateFields.push('retry_delay_ms = ?');
      params.push(updateData.retryDelayMs);
    }

    if (updateFields.length === 0) return;

    params.push(executionId);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE agent_executions SET ${updateFields.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  async getExecutionHistory(agentId, userId, options = {}) {
    const { db } = require('../db/init.cjs');
    const page = Math.max(1, parseInt(options.page ?? 1, 10) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(options.limit ?? 20, 10) || 20));
    const order = String(options.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const filters = ['ae.agent_id = ?', 'ae.user_id = ?'];
    const params = [agentId, userId];

    if (options.status && options.status !== 'all') {
      const statuses = Array.isArray(options.status)
        ? options.status
        : String(options.status)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
      if (statuses.length > 0) {
        const placeholders = statuses.map(() => '?').join(', ');
        filters.push(`ae.status IN (${placeholders})`);
        params.push(...statuses);
      }
    }

    if (options.start) {
      filters.push('ae.started_at >= ?');
      params.push(options.start);
    }

    if (options.end) {
      filters.push('ae.started_at <= ?');
      params.push(options.end);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const total = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) AS total FROM agent_executions ae ${whereClause}`,
        params,
        (err, row) => (err ? reject(err) : resolve(row?.total || 0))
      );
    });

    const offset = (page - 1) * limit;
    const executionRows = await new Promise((resolve, reject) => {
      db.all(
        `SELECT ae.*, at.title AS task_title, at.priority AS task_priority
         FROM agent_executions ae
         JOIN agent_tasks at ON ae.task_id = at.id
         ${whereClause}
         ORDER BY ae.started_at ${order}, ae.id ${order}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });

    const executions = executionRows.map(row => ({
      id: row.id,
      agentId: row.agent_id,
      userId: row.user_id,
      taskId: row.task_id,
      taskTitle: row.task_title,
      taskPriority: row.task_priority,
      status: row.status,
      progress: row.progress,
      currentStep: row.current_step,
      errorMessage: row.error_message,
      lastErrorType: row.last_error_type,
      lastErrorMessage: row.last_error_message,
      queuedAt: row.queued_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      durationMs: row.duration_ms,
      attempts: row.attempts ?? 0,
      retryDelayMs: row.retry_delay_ms ?? 0
    }));

    const statsRow = await new Promise((resolve, reject) => {
      db.get(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN ae.status = 'completed' THEN 1 ELSE 0 END) AS success,
           SUM(CASE WHEN ae.status = 'failed' THEN 1 ELSE 0 END) AS failed,
           SUM(CASE WHEN ae.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
           AVG(ae.duration_ms) AS avg_duration,
           MAX(ae.completed_at) AS last_completed_at,
           MAX(ae.started_at) AS last_started_at
         FROM agent_executions ae
         ${whereClause}`,
        params,
        (err, row) => (err ? reject(err) : resolve(row || {}))
      );
    });

    const totalCount = Number(statsRow?.total || 0);
    const successCount = Number(statsRow?.success || 0);
    const failedCount = Number(statsRow?.failed || 0);
    const cancelledCount = Number(statsRow?.cancelled || 0);
    const successRate = totalCount > 0 ? successCount / totalCount : 0;
    const avgDuration = Number(statsRow?.avg_duration || 0);

    let trendFilters = [...filters];
    let trendParams = [...params];
    if (!options.start) {
      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
      trendFilters = [...trendFilters, 'ae.started_at >= ?'];
      trendParams = [...trendParams, sevenDaysAgo];
    }

    const trendWhere = `WHERE ${trendFilters.join(' AND ')}`;
    const trendRows = await new Promise((resolve, reject) => {
      db.all(
        `SELECT DATE(ae.started_at) AS bucket,
                COUNT(*) AS total,
                SUM(CASE WHEN ae.status = 'completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN ae.status = 'failed' THEN 1 ELSE 0 END) AS failed,
                AVG(ae.duration_ms) AS avg_duration
         FROM agent_executions ae
         ${trendWhere}
         GROUP BY DATE(ae.started_at)
         ORDER BY bucket ASC`,
        trendParams,
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });

    const trend = trendRows.map(row => ({
      date: row.bucket,
      total: row.total || 0,
      completed: row.completed || 0,
      failed: row.failed || 0,
      avgDuration: row.avg_duration || 0
    }));

    return {
      executions,
      total,
      page,
      limit,
      stats: {
        total: totalCount,
        success: successCount,
        failed: failedCount,
        cancelled: cancelledCount,
        successRate,
        avgDuration,
        lastCompletedAt: statsRow?.last_completed_at || null,
        lastStartedAt: statsRow?.last_started_at || null
      },
      trend
    };
  }

  async exportExecutionHistory(agentId, userId, options = {}) {
    const format = String(options.format || 'csv').toLowerCase();
    const limit = Math.max(1, Math.min(10000, parseInt(options.limit ?? 2000, 10) || 2000));

    const history = await this.getExecutionHistory(agentId, userId, {
      ...options,
      page: 1,
      limit
    });

    if (format === 'json') {
      return JSON.stringify(history.executions, null, 2);
    }

    const headers = [
      'executionId',
      'taskId',
      'taskTitle',
      'status',
      'attempts',
      'queuedAt',
      'startedAt',
      'completedAt',
      'durationMs',
      'errorMessage',
      'lastErrorType',
      'retryDelayMs'
    ];

    const rows = history.executions.map(item => ({
      executionId: item.id,
      taskId: item.taskId,
      taskTitle: item.taskTitle || '',
      status: item.status,
      attempts: item.attempts ?? 0,
      queuedAt: item.queuedAt || '',
      startedAt: item.startedAt || '',
      completedAt: item.completedAt || '',
      durationMs: item.durationMs ?? '',
      errorMessage: item.errorMessage || '',
      lastErrorType: item.lastErrorType || '',
      retryDelayMs: item.retryDelayMs ?? 0
    }));

    const csvLines = [headers.join(',')];
    rows.forEach(record => {
      csvLines.push(
        headers
          .map(key => this.#escapeCsv(record[key]))
          .join(',')
      );
    });

    return csvLines.join('\n');
  }

  async getAgentStats(agentId, userId, options = {}) {
    const history = await this.getExecutionHistory(agentId, userId, {
      page: 1,
      limit: Math.max(1, parseInt(options.limit ?? 1, 10) || 1),
      status: options.status,
      start: options.start,
      end: options.end
    });
    return {
      stats: history.stats,
      trend: history.trend
    };
  }

  async getAgentMetricsForUser(userId, agentIds = []) {
    if (!Array.isArray(agentIds) || agentIds.length === 0) {
      return {};
    }

    const { db } = require('../db/init.cjs');
    const placeholders = agentIds.map(() => '?').join(', ');
    const params = [userId, ...agentIds];

    const rows = await new Promise((resolve, reject) => {
      db.all(
        `SELECT agent_id,
                COUNT(*) AS total_runs,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS success_runs,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_runs,
                AVG(duration_ms) AS avg_duration,
                MAX(completed_at) AS last_completed_at
         FROM agent_executions
         WHERE user_id = ? AND agent_id IN (${placeholders})
         GROUP BY agent_id`,
        params,
        (err, res) => (err ? reject(err) : resolve(res || []))
      );
    });

    const metrics = {};
    for (const row of rows) {
      const totalRuns = Number(row.total_runs || 0);
      const successRuns = Number(row.success_runs || 0);
      metrics[row.agent_id] = {
        totalRuns,
        successRuns,
        failedRuns: Number(row.failed_runs || 0),
        successRate: totalRuns > 0 ? successRuns / totalRuns : 0,
        avgDuration: Number(row.avg_duration || 0),
        lastCompletedAt: row.last_completed_at || null
      };
    }
    return metrics;
  }

  async getDashboardSummary(userId) {
    const { db } = require('../db/init.cjs');

    const totals = await new Promise((resolve, reject) => {
      db.get(
        `SELECT
           COUNT(*) AS executions,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS success,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
           AVG(duration_ms) AS avg_duration
         FROM agent_executions
         WHERE user_id = ?`,
        [userId],
        (err, row) => (err ? reject(err) : resolve(row || {}))
      );
    });

    const recentSince = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();

    const recent = await new Promise((resolve, reject) => {
      db.all(
        `SELECT DATE(started_at) AS bucket,
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
         FROM agent_executions
         WHERE user_id = ? AND started_at >= ?
         GROUP BY DATE(started_at)
         ORDER BY bucket ASC`,
        [userId, recentSince],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });

    return {
      totals: {
        executions: Number(totals?.executions || 0),
        success: Number(totals?.success || 0),
        failed: Number(totals?.failed || 0),
        successRate: totals?.executions
          ? Number(totals.success || 0) / Number(totals.executions || 1)
          : 0,
        avgDuration: Number(totals?.avg_duration || 0)
      },
      recent
    };
  }

  getQueueStatus(agentId) {
    if (!agentId) {
      return {
        waiting: [],
        running: [],
        waitingCount: 0,
        runningCount: 0,
        concurrency: this.executionQueue.concurrency
      };
    }

    const snapshot = this.executionQueue.getJobsByAgent(agentId);
    const waiting = (snapshot.queued || []).map((job, index) => ({
      ...job,
      position: index + 1
    }));

    const running = (snapshot.running || []).map(job => ({
      ...job
    }));

    return {
      waiting,
      running,
      waitingCount: waiting.length,
      runningCount: running.length,
      concurrency: this.executionQueue.concurrency
    };
  }

  async cancelQueuedExecution(agentId, executionId, userId) {
    if (!agentId || !executionId) {
      return { cancelled: false, reason: 'invalid_parameters' };
    }

    const snapshot = this.executionQueue.getSnapshot();
    const allJobs = [...(snapshot.queue || []), ...(snapshot.running || [])];
    const job = allJobs.find(item => item.executionId === executionId);

    if (!job) {
      return { cancelled: false, reason: 'not_found' };
    }

    if (job.agentId !== agentId || (userId && job.userId !== userId)) {
      return { cancelled: false, reason: 'forbidden' };
    }

    const result = this.executionQueue.cancelJob(executionId);
    if (!result) {
      return { cancelled: false, reason: 'not_found' };
    }

    return { cancelled: true, phase: result.phase || 'queued' };
  }

  async updateQueuedPriority(agentId, executionId, userId, priority) {
    if (!agentId || !executionId) {
      throw new Error('参数不足，无法调整优先级');
    }

    const snapshot = this.executionQueue.getSnapshot();
    const job = (snapshot.queue || []).find(item => item.executionId === executionId);

    if (!job) {
      throw new Error('仅等待中的任务支持调整优先级');
    }

    if (job.agentId !== agentId || (userId && job.userId !== userId)) {
      throw new Error('无权调整该任务的优先级');
    }

    const updated = this.executionQueue.updatePriority(executionId, priority);
    if (updated) {
      await this.updateTask(job.taskId, { priority: Number(priority) }).catch(() => {});
      this.publishQueueSnapshot(agentId);
    }

    return updated;
  }

  async getRuntimeConfig(userId) {
    const cacheKey = userId ? String(userId) : 'global';
    const cached = this.runtimeConfigCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    if (!userId) {
      const defaults = this.getDefaultRuntimeConfig();
      this.runtimeConfigCache.set(cacheKey, { data: defaults, expires: Date.now() + 60000 });
      return defaults;
    }

    const { db } = require('../db/init.cjs');
    const row = await new Promise((resolve, reject) => {
      db.get(
        'SELECT agent_settings FROM user_configs WHERE user_id = ?',
        [userId],
        (err, result) => (err ? reject(err) : resolve(result))
      );
    }).catch(() => null);

    let stored = {};
    if (row?.agent_settings) {
      try {
        stored = JSON.parse(row.agent_settings);
      } catch {
        stored = {};
      }
    }

    const merged = this.#mergeRuntimeConfig(stored);
    this.runtimeConfigCache.set(cacheKey, { data: merged, expires: Date.now() + 60000 });
    return merged;
  }

  async updateRuntimeConfig(userId, updates = {}) {
    if (!userId) {
      throw new Error('userId is required to update runtime config');
    }

    const current = await this.getRuntimeConfig(userId);
    const merged = _.merge({}, current, updates);

    const { db } = require('../db/init.cjs');
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO user_configs (user_id, agent_settings, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET
           agent_settings = excluded.agent_settings,
           updated_at = CURRENT_TIMESTAMP`,
        [userId, JSON.stringify(merged)],
        err => (err ? reject(err) : resolve(true))
      );
    });

    this.runtimeConfigCache.set(String(userId), { data: merged, expires: Date.now() + 60000 });
    return merged;
  }

  getDefaultRuntimeConfig() {
    const decomposerDefaults = {
      model: process.env.AGENT_DECOMPOSER_MODEL || this.taskDecomposer?.defaults?.model,
      temperature: this.#parseFloat(
        process.env.AGENT_DECOMPOSER_TEMPERATURE,
        this.taskDecomposer?.defaults?.temperature ?? 0.3
      ),
      maxTokens: this.#parseInt(
        process.env.AGENT_DECOMPOSER_MAX_TOKENS,
        this.taskDecomposer?.defaults?.maxTokens ?? 1200
      ),
      maxSubtasks: this.#parseInt(
        process.env.AGENT_DECOMPOSER_MAX_SUBTASKS,
        this.taskDecomposer?.defaults?.maxSubtasks ?? 8
      ),
      contextLimit: this.#parseInt(
        process.env.AGENT_DECOMPOSER_CONTEXT_LIMIT,
        this.taskDecomposer?.defaults?.contextLimit ?? 4000
      )
    };

    return {
      decomposer: decomposerDefaults,
      retryStrategy: _.cloneDeep(this.retryDefaults),
      toolRefresh: { ...this.toolRefreshPolicy },
      queue: {
        defaultPriority: 0
      }
    };
  }

  resolveRetryStrategy(agent, runtimeConfig = {}) {
    const agentStrategy = agent?.config?.retryStrategy || {};
    const runtimeStrategy = runtimeConfig?.retryStrategy || runtimeConfig?.retry || {};
    return _.merge({}, this.retryDefaults, runtimeStrategy, agentStrategy);
  }

  classifyExecutionError(error) {
    if (!error) return 'default';
    if (error.cancelled) return 'cancelled';

    const code = String(error.code || '').toUpperCase();
    const message = String(error.message || '').toLowerCase();
    const responseStatus = error.response?.status;

    if (
      ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code) ||
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      (responseStatus && responseStatus >= 500)
    ) {
      return 'network';
    }

    if (responseStatus === 429) {
      return 'throttle';
    }

    if (responseStatus && responseStatus >= 400 && responseStatus < 500) {
      return 'validation';
    }

    if (error.validationErrors || message.includes('validation')) {
      return 'validation';
    }

    if (error.toolName || message.includes('tool')) {
      return 'tool';
    }

    if (
      message.includes('auth') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      responseStatus === 401 ||
      responseStatus === 403
    ) {
      return 'auth';
    }

    return 'default';
  }

  async maybeAutoRefreshTools(runtimeConfig) {
    const refreshConfig = runtimeConfig?.toolRefresh || this.toolRefreshPolicy;
    if (!refreshConfig) return;

    const auto = refreshConfig.auto ?? this.toolRefreshPolicy.auto;
    if (!auto) return;

    const interval = Number(refreshConfig.intervalMs ?? this.toolRefreshPolicy.intervalMs ?? 0);
    if (!Number.isFinite(interval) || interval <= 0) return;

    const now = Date.now();
    const last = this.lastToolRefresh ? this.lastToolRefresh.getTime() : 0;

    if (!last || now - last >= interval) {
      await this.refreshTools().catch(err => {
        console.warn('[AgentEngine] 自动刷新工具失败:', err?.message || err);
      });
    }
  }

  /**
   * 格式化 Agent 数据
   * @param {Object} row - 数据库行数据
   */
  formatAgent(row) {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      avatarUrl: row.avatar_url,
      systemPrompt: row.system_prompt,
      capabilities: JSON.parse(row.capabilities || '[]'),
      tools: JSON.parse(row.tools || '[]'),
      config: JSON.parse(row.config || '{}'),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * 检查执行是否已被取消
   * @param {string} executionId - 执行ID
   */
  async isExecutionCancelled(executionId) {
    const { db } = require('../db/init.cjs');

    return new Promise((resolve) => {
      db.get(
        'SELECT status FROM agent_executions WHERE id = ?',
        [executionId],
        (err, row) => {
          if (err || !row) {
            resolve(false);
          } else {
            resolve(row.status === 'cancelled');
          }
        }
      );
    });
  }

  /**
   * 延迟执行
   * @param {number} ms - 毫秒
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  #mergeRuntimeConfig(config = {}) {
    return _.merge({}, this.getDefaultRuntimeConfig(), config || {});
  }

  #loadRetryDefaults() {
    return {
      default: {
        maxAttempts: this.#parseInt(process.env.AGENT_RETRY_DEFAULT_MAX_ATTEMPTS, 2),
        backoffMs: this.#parseInt(process.env.AGENT_RETRY_DEFAULT_BACKOFF_MS, 1500),
        backoffMultiplier: this.#parseFloat(process.env.AGENT_RETRY_DEFAULT_BACKOFF_MULTIPLIER, 1.5)
      },
      network: {
        maxAttempts: this.#parseInt(process.env.AGENT_RETRY_NETWORK_MAX_ATTEMPTS, 3),
        backoffMs: this.#parseInt(process.env.AGENT_RETRY_NETWORK_BACKOFF_MS, 2000),
        backoffMultiplier: this.#parseFloat(process.env.AGENT_RETRY_NETWORK_BACKOFF_MULTIPLIER, 2)
      },
      throttle: {
        maxAttempts: this.#parseInt(process.env.AGENT_RETRY_THROTTLE_MAX_ATTEMPTS, 3),
        backoffMs: this.#parseInt(process.env.AGENT_RETRY_THROTTLE_BACKOFF_MS, 5000),
        backoffMultiplier: this.#parseFloat(process.env.AGENT_RETRY_THROTTLE_BACKOFF_MULTIPLIER, 2)
      },
      validation: {
        maxAttempts: this.#parseInt(process.env.AGENT_RETRY_VALIDATION_MAX_ATTEMPTS, 1),
        backoffMs: this.#parseInt(process.env.AGENT_RETRY_VALIDATION_BACKOFF_MS, 0),
        backoffMultiplier: this.#parseFloat(process.env.AGENT_RETRY_VALIDATION_BACKOFF_MULTIPLIER, 1)
      },
      tool: {
        maxAttempts: this.#parseInt(process.env.AGENT_RETRY_TOOL_MAX_ATTEMPTS, 2),
        backoffMs: this.#parseInt(process.env.AGENT_RETRY_TOOL_BACKOFF_MS, 3000),
        backoffMultiplier: this.#parseFloat(process.env.AGENT_RETRY_TOOL_BACKOFF_MULTIPLIER, 1.5)
      }
    };
  }

  #parseInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  #parseFloat(value, fallback) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  #escapeCsv(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}

// ============================================
// 性能优化扩展方法 (Zero-cost optimization)
// ============================================

/**
 * 生成任务缓存键
 */
AgentEngine.prototype.generateCacheKey = function(task, agent) {
  const key = `${agent.id}:${task.title}:${JSON.stringify(task.inputData || {})}`;
  return require('crypto').createHash('md5').update(key).digest('hex');
};

/**
 * 从缓存获取任务分解结果
 */
AgentEngine.prototype.getFromCache = function(cacheKey) {
  const cached = this.taskCache.get(cacheKey);

  if (!cached) {
    this.cacheStats.misses++;
    return null;
  }

  // 检查是否过期
  if (Date.now() - cached.timestamp > this.cacheTTL) {
    this.taskCache.delete(cacheKey);
    this.cacheStats.misses++;
    return null;
  }

  this.cacheStats.hits++;
  console.log(`[Cache] Hit! 命中率: ${(this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2)}%`);
  return cached.data;
};

/**
 * 保存到缓存
 */
AgentEngine.prototype.saveToCache = function(cacheKey, data) {
  // LRU 缓存管理
  if (this.taskCache.size >= this.cacheMaxSize) {
    const firstKey = this.taskCache.keys().next().value;
    this.taskCache.delete(firstKey);
  }

  this.taskCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

/**
 * 获取缓存统计信息
 */
AgentEngine.prototype.getCacheStats = function() {
  const total = this.cacheStats.hits + this.cacheStats.misses;
  return {
    hits: this.cacheStats.hits,
    misses: this.cacheStats.misses,
    hitRate: total > 0 ? (this.cacheStats.hits / total) : 0,
    size: this.taskCache.size,
    maxSize: this.cacheMaxSize
  };
};

AgentEngine.prototype.getAgentTableInfo = async function() {
  if (this.agentTableInfo) {
    return this.agentTableInfo;
  }

  const { db } = require('../db/init.cjs');

  const info = await new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(agents)', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  }).catch(error => {
    console.error('[AgentEngine] 获取 agents 表结构失败:', error);
    return [];
  });

  const columnsMap = new Map();
  info.forEach(row => {
    if (row && row.name) {
      columnsMap.set(row.name, row);
    }
  });

  const idColumn = info.find(row => row.name === 'id');
  const idAutoIncrement = idColumn && typeof idColumn.type === 'string'
    ? idColumn.type.toUpperCase() === 'INTEGER'
    : false;

  this.agentTableInfo = {
    columns: columnsMap,
    idAutoIncrement
  };

  return this.agentTableInfo;
};

module.exports = AgentEngine;
