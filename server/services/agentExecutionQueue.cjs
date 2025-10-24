const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

class AgentExecutionQueue extends EventEmitter {
  constructor({ concurrency = 1, worker } = {}) {
    super();
    if (typeof worker !== 'function') {
      throw new Error('AgentExecutionQueue 需要提供 worker 函数');
    }

    this.concurrency = Math.max(1, concurrency);
    this.worker = worker;
    this.queue = [];
    this.running = new Map(); // jobId -> job
    this.activeCount = 0;
  }

  /**
   * 入队任务
   */
  enqueue(job) {
    const jobRecord = {
      id: uuidv4(),
      attempts: 0,
      attemptsByType: {},
      maxAttempts: Math.max(1, job?.maxAttempts || 1),
      priority: Number.isFinite(job?.priority) ? job.priority : 0,
      queuedAt: Date.now(),
      state: 'queued',
      retryStrategy: job?.retryStrategy || null,
      classifyError: typeof job?.classifyError === 'function' ? job.classifyError : null,
      nextRetryAt: null,
      cancelled: false,
      executionId: job?.execution?.id || job?.executionId || null,
      taskId: job?.task?.id || job?.taskId || null,
      agentId: job?.agentId || null,
      userId: job?.userId || null,
      ...job
    };

    this.#insert(jobRecord);
    process.nextTick(() => this.#process());
    this.emit('jobQueued', jobRecord);
    return jobRecord;
  }

  /**
   * 获取队列快照
   */
  getSnapshot() {
    return {
      queue: this.queue.map(job => this.#serialize(job)),
      running: Array.from(this.running.values()).map(job => this.#serialize(job)),
      activeCount: this.activeCount,
      concurrency: this.concurrency,
      size: this.queue.length + this.running.size
    };
  }

  /**
   * 根据 Agent 获取队列情况
   */
  getJobsByAgent(agentId) {
    if (!agentId) return { queued: [], running: [] };
    const snapshot = this.getSnapshot();
    return {
      queued: snapshot.queue.filter(job => job.agentId === agentId),
      running: snapshot.running.filter(job => job.agentId === agentId)
    };
  }

  /**
   * 取消任务（按 executionId）
   */
  cancelJob(executionId) {
    if (!executionId) return null;

    const queuedIdx = this.queue.findIndex(job => this.#matches(job, executionId));
    if (queuedIdx >= 0) {
      const [job] = this.queue.splice(queuedIdx, 1);
      job.cancelled = true;
      job.state = 'cancelled';
      this.emit('jobCancelled', job, { phase: 'queued' });
      return { job: this.#serialize(job), phase: 'queued' };
    }

    for (const job of this.running.values()) {
      if (this.#matches(job, executionId)) {
        job.cancelled = true;
        this.emit('jobCancellationRequested', job);
        return { job: this.#serialize(job), phase: 'running' };
      }
    }

    return null;
  }

  /**
   * 更新排队任务优先级
   */
  updatePriority(executionId, priority) {
    if (!executionId) return null;
    const normalized = Number(priority);
    if (!Number.isFinite(normalized)) return null;

    const idx = this.queue.findIndex(job => this.#matches(job, executionId));
    if (idx === -1) return null;

    const [job] = this.queue.splice(idx, 1);
    job.priority = normalized;
    job.priorityUpdatedAt = Date.now();
    this.#insert(job);
    this.emit('jobPriorityChanged', job);
    process.nextTick(() => this.#process());
    return this.#serialize(job);
  }

  /**
   * 处理队列
   */
  async #process() {
    while (this.activeCount < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job || job.cancelled) {
        this.emit('jobSkipped', job);
        continue;
      }

      this.activeCount += 1;
      job.state = 'running';
      job.startedAt = Date.now();
      this.running.set(job.id, job);
      this.emit('jobStarted', job);
      this.#run(job);
    }
  }

  /**
   * 执行任务
   */
  async #run(job) {
    try {
      await this.worker(job);
      job.state = 'completed';
      this.emit('jobCompleted', job);
    } catch (error) {
      job.attempts += 1;
      const { strategy, errorType } = this.#resolveStrategy(job, error);
      const attemptsByType = job.attemptsByType || {};
      attemptsByType[errorType] = (attemptsByType[errorType] || 0) + 1;
      job.attemptsByType = attemptsByType;

      const maxAttempts = Math.max(1, strategy?.maxAttempts ?? job.maxAttempts ?? 1);
      const shouldRetry = !job.cancelled && !error?.cancelled && attemptsByType[errorType] < maxAttempts;

      if (shouldRetry) {
        const delay = this.#resolveRetryDelay(strategy, attemptsByType[errorType]);
        job.nextRetryAt = Date.now() + delay;
        job.state = 'retry_scheduled';
        job.lastErrorType = errorType;
        this.emit('jobRetry', job, error, {
          delay,
          errorType,
          attempts: attemptsByType[errorType],
          maxAttempts
        });

        setTimeout(() => {
          if (job.cancelled) {
            job.state = 'cancelled';
            this.emit('jobCancelled', job, { phase: 'retry_scheduled' });
            return;
          }
          job.state = 'queued';
          this.#insert(job);
          this.#process();
        }, Math.max(0, delay));
      } else {
        job.state = 'failed';
        job.lastErrorType = errorType;
        this.emit('jobFailed', job, error, {
          errorType,
          attempts: attemptsByType[errorType],
          maxAttempts
        });
      }
    } finally {
      this.running.delete(job.id);
      this.activeCount = Math.max(0, this.activeCount - 1);
      process.nextTick(() => this.#process());
    }
  }

  /**
   * 将任务插入队列（按优先级/排队时间）
   */
  #insert(job) {
    job.priority = Number.isFinite(job.priority) ? job.priority : 0;
    job.queuedAt = job.queuedAt ?? Date.now();
    job.executionId = job.executionId || job.execution?.id || null;
    job.taskId = job.taskId || job.task?.id || null;
    job.agentId = job.agentId || job.agent?.id || null;

    if (job.cancelled) {
      job.state = 'cancelled';
      return;
    }

    if (this.queue.length === 0) {
      this.queue.push(job);
      return;
    }

    const index = this.queue.findIndex(existing => {
      const existingPriority = Number.isFinite(existing.priority) ? existing.priority : 0;
      if (job.priority === existingPriority) {
        return (job.queuedAt || 0) < (existing.queuedAt || 0);
      }
      return job.priority > existingPriority;
    });

    if (index === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(index, 0, job);
    }
  }

  #matches(job, executionId) {
    if (!job) return false;
    const currentExecutionId = job.executionId || job.execution?.id;
    return currentExecutionId === executionId;
  }

  #resolveStrategy(job, error) {
    const classifier = job.classifyError || (() => 'default');
    let errorType = 'default';
    try {
      errorType = classifier(error) || 'default';
    } catch {
      errorType = 'default';
    }

    const strategy =
      job.retryStrategy?.[errorType] ||
      job.retryStrategy?.default ||
      null;

    return { strategy, errorType };
  }

  #resolveRetryDelay(strategy, attemptIndex) {
    if (!strategy) return 0;
    const base = Number(strategy.backoffMs || strategy.delayMs || 0);
    const multiplier = Number(strategy.backoffMultiplier || strategy.multiplier || 1);
    if (!Number.isFinite(base) || base <= 0) return 0;
    if (!Number.isFinite(multiplier) || multiplier <= 1) {
      return base;
    }
    return Math.round(base * Math.pow(multiplier, Math.max(0, attemptIndex - 1)));
  }

  #serialize(job) {
    if (!job) return null;
    return {
      id: job.id,
      agentId: job.agentId || job.agent?.id || null,
      userId: job.userId || null,
      executionId: job.executionId || job.execution?.id || null,
      taskId: job.taskId || job.task?.id || null,
      priority: Number.isFinite(job.priority) ? job.priority : 0,
      attempts: job.attempts || 0,
      attemptsByType: job.attemptsByType || {},
      maxAttempts: job.maxAttempts || null,
      queuedAt: job.queuedAt || null,
      startedAt: job.startedAt || null,
      nextRetryAt: job.nextRetryAt || null,
      state: job.state || 'queued',
      retryStrategy: job.retryStrategy || null,
      lastErrorType: job.lastErrorType || null,
      cancelRequested: !!job.cancelled
    };
  }
}

module.exports = AgentExecutionQueue;
