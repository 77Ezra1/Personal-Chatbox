/**
 * 智能 Agent 引擎
 * 处理 Agent 创建、任务分解、自主执行和进度管理
 */

const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');
const TaskDecomposer = require('./taskDecomposer.cjs');

class AgentEngine {
  constructor() {
    this.toolRegistry = new Map();
    this.taskDecomposer = new TaskDecomposer();
    this.executionManager = new Map();
    this.registerDefaultTools();
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
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => this.formatAgent(row)));
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
   * 执行任务
   * @param {string} agentId - Agent ID
   * @param {Object} taskData - 任务数据
   * @param {number} userId - 用户ID
   */
  async executeTask(agentId, taskData, userId) {
    try {
      // 获取 Agent
      const agent = await this.getAgent(agentId, userId);

      // 创建任务
      const task = await this.createTask(agentId, taskData, userId);

      // 创建执行记录
      const execution = await this.createExecution(agentId, task.id, userId);

      // 更新 Agent 状态为忙碌
      await this.updateAgent(agentId, userId, { status: 'busy' });

      try {
        // 任务分解
        const subtasks = await this.taskDecomposer.decomposeTask(task, agent);

        // 执行子任务
        const results = await this.executeSubtasks(subtasks, agent, execution);

        // 生成最终结果
        const finalResult = await this.generateFinalResult(results, agent);

        // 更新任务状态
        await this.updateTask(task.id, {
          status: 'completed',
          outputData: finalResult,
          completedAt: new Date().toISOString()
        });

        // 更新执行状态
        await this.updateExecution(execution.id, {
          status: 'completed',
          progress: 1.0,
          completedAt: new Date().toISOString()
        });

        // 更新 Agent 状态为空闲
        await this.updateAgent(agentId, userId, { status: 'active' });

        return finalResult;
      } catch (error) {
        // 更新任务状态为失败
        await this.updateTask(task.id, {
          status: 'failed',
          outputData: { error: error.message },
          completedAt: new Date().toISOString()
        });

        // 更新执行状态为失败
        await this.updateExecution(execution.id, {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date().toISOString()
        });

        // 更新 Agent 状态为错误
        await this.updateAgent(agentId, userId, { status: 'error' });

        throw error;
      }
    } catch (error) {
      console.error('执行任务失败:', error);
      throw error;
    }
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
      priority = 0
    } = taskData;

    if (!title) {
      throw new Error('任务标题不能为空');
    }

    const task = {
      id,
      agentId,
      userId,
      title,
      description,
      inputData,
      status: 'pending',
      priority,
      createdAt: new Date().toISOString()
    };

    // 保存到数据库
    await this.saveTask(task);

    return task;
  }

  /**
   * 执行子任务
   * @param {Array} subtasks - 子任务列表
   * @param {Object} agent - Agent 对象
   * @param {Object} execution - 执行记录
   */
  async executeSubtasks(subtasks, agent, execution) {
    const results = [];
    const totalSubtasks = subtasks.length;

    for (let i = 0; i < subtasks.length; i++) {
      const subtask = subtasks[i];

      try {
        // 更新进度
        const progress = (i / totalSubtasks) * 100;
        await this.updateExecution(execution.id, {
          progress: progress / 100,
          currentStep: subtask.title
        });

        // 执行子任务
        const result = await this.executeSubtask(subtask, agent);
        results.push({
          ...result,
          subtaskId: subtask.id,
          title: subtask.title,
          status: 'completed'
        });

        // 更新子任务状态
        await this.updateSubtask(subtask.id, {
          status: 'completed',
          outputData: result,
          completedAt: new Date().toISOString()
        });

      } catch (error) {
        console.error(`子任务执行失败: ${subtask.title}`, error);

        // 更新子任务状态为失败
        await this.updateSubtask(subtask.id, {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date().toISOString()
        });

        // 根据配置决定是否继续执行
        if (agent.config.stopOnError) {
          throw error;
        }

        results.push({
          subtaskId: subtask.id,
          title: subtask.title,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
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
    const tool = this.toolRegistry.get(toolName);

    if (!tool) {
      throw new Error(`工具不存在: ${toolName}`);
    }

    return await tool.execute(parameters, subtask.inputData);
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

    const finalResult = await aiService.generateResponse(prompt, '', {
      model: 'gpt-4o-mini',
      temperature: 0.3
    });

    return {
      summary: finalResult,
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
    // 网络搜索工具
    this.toolRegistry.set('web_search', {
      name: 'web_search',
      description: '搜索网络信息',
      execute: async (parameters, inputData) => {
        const { query, maxResults = 5 } = parameters;
        const results = await this.performWebSearch(query, maxResults);
        return { query, results, timestamp: new Date().toISOString() };
      }
    });

    // 文件读取工具
    this.toolRegistry.set('read_file', {
      name: 'read_file',
      description: '读取文件内容',
      execute: async (parameters, inputData) => {
        const { filePath } = parameters;
        const fs = require('fs').promises;
        const content = await fs.readFile(filePath, 'utf8');
        return { content, filePath, timestamp: new Date().toISOString() };
      }
    });

    // 文件写入工具
    this.toolRegistry.set('write_file', {
      name: 'write_file',
      description: '写入文件内容',
      execute: async (parameters, inputData) => {
        const { filePath, content } = parameters;
        const fs = require('fs').promises;
        await fs.writeFile(filePath, content);
        return { success: true, filePath, timestamp: new Date().toISOString() };
      }
    });

    // 数据验证工具
    this.toolRegistry.set('validate_data', {
      name: 'validate_data',
      description: '验证数据格式和内容',
      execute: async (parameters, inputData) => {
        const { schema } = parameters;
        // 简单的数据验证逻辑
        const isValid = this.validateData(inputData, { schema });
        return { valid: isValid, errors: isValid ? [] : ['数据验证失败'] };
      }
    });
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

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO agents (
          id, user_id, name, description, avatar_url, system_prompt,
          capabilities, tools, config, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          agent.id, agent.userId, agent.name, agent.description,
          agent.avatarUrl, agent.systemPrompt, JSON.stringify(agent.capabilities),
          JSON.stringify(agent.tools), JSON.stringify(agent.config),
          agent.status, agent.createdAt, agent.updatedAt
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
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
          status, priority, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id, task.agentId, task.userId, task.title,
          task.description, JSON.stringify(task.inputData),
          task.status, task.priority, task.createdAt
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
  async createExecution(agentId, taskId, userId) {
    const id = uuidv4();
    const execution = {
      id,
      agentId,
      taskId,
      userId,
      status: 'running',
      progress: 0.0,
      startedAt: new Date().toISOString()
    };

    const { db } = require('../db/init.cjs');

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO agent_executions (
          id, agent_id, task_id, user_id, status, progress, started_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          execution.id, execution.agentId, execution.taskId,
          execution.userId, execution.status, execution.progress,
          execution.startedAt
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
    if (updateData.currentStep !== undefined) {
      updateFields.push('current_step = ?');
      params.push(updateData.currentStep);
    }
    if (updateData.errorMessage !== undefined) {
      updateFields.push('error_message = ?');
      params.push(updateData.errorMessage);
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
}

module.exports = AgentEngine;
