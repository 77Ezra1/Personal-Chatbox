/**
 * 任务分解器
 * 使用 AI 将复杂任务分解为可执行的子任务
 */

const AIService = require('./aiService.cjs');

class TaskDecomposer {
  constructor() {
    this.aiService = null;
  }

  /**
   * 分解任务
   * @param {Object} task - 任务对象
   * @param {Object} agent - Agent 对象
   */
  async decomposeTask(task, agent) {
    // 使用用户配置的API密钥初始化AI服务
    if (!this.aiService) {
      this.aiService = new AIService(agent.userId);
    }

    const prompt = `请将以下任务分解为具体的子任务：

任务：${task.title}
描述：${task.description}
输入数据：${JSON.stringify(task.inputData, null, 2)}

Agent 能力：${agent.capabilities.join(', ')}
可用工具：${agent.tools.join(', ')}

请生成一个详细的子任务列表，每个子任务应该包含：
1. 标题
2. 描述
3. 类型（tool_call, ai_analysis, data_processing, web_search, file_operation）
4. 配置参数
5. 依赖关系

返回 JSON 格式的子任务数组。`;

    try {
      const response = await this.aiService.generateResponse(prompt, '', {
        model: 'gpt-4o-mini',
        temperature: 0.3
      });

      // 尝试解析 JSON 响应
      const subtaskData = this.parseJsonResponse(response);
      return await this.createSubtasks(task.id, subtaskData);
    } catch (error) {
      console.error('任务分解失败:', error);
      // 返回默认的子任务
      return await this.createDefaultSubtasks(task.id, task, agent);
    }
  }

  /**
   * 解析 JSON 响应
   * @param {string} response - AI 响应
   */
  parseJsonResponse(response) {
    try {
      // 尝试直接解析
      return JSON.parse(response);
    } catch (error) {
      // 尝试提取 JSON 部分
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // 如果都失败了，抛出错误
      throw new Error('无法解析 AI 响应为 JSON 格式');
    }
  }

  /**
   * 创建子任务
   * @param {string} taskId - 任务ID
   * @param {Array} subtaskData - 子任务数据
   */
  async createSubtasks(taskId, subtaskData) {
    const subtasks = [];

    for (const data of subtaskData) {
      const subtask = {
        id: require('uuid').v4(),
        taskId,
        title: data.title || '未命名子任务',
        description: data.description || '',
        type: data.type || 'ai_analysis',
        inputData: data.inputData || {},
        config: data.config || {},
        status: 'pending',
        priority: data.priority || 0,
        dependencies: data.dependencies || [],
        createdAt: new Date().toISOString()
      };

      // 保存到数据库
      await this.saveSubtask(subtask);
      subtasks.push(subtask);
    }

    return subtasks;
  }

  /**
   * 创建默认子任务
   * @param {string} taskId - 任务ID
   * @param {Object} task - 任务对象
   * @param {Object} agent - Agent 对象
   */
  async createDefaultSubtasks(taskId, task, agent) {
    const defaultSubtasks = [
      {
        id: require('uuid').v4(),
        taskId,
        title: '分析任务需求',
        description: '分析任务的具体需求和目标',
        type: 'ai_analysis',
        inputData: task.inputData,
        config: {
          prompt: `请分析以下任务的需求和目标：

任务：${task.title}
描述：${task.description}
输入数据：${JSON.stringify(task.inputData, null, 2)}

请提供详细的需求分析。`,
          model: 'gpt-4o-mini',
          temperature: 0.3
        },
        status: 'pending',
        priority: 1,
        dependencies: [],
        createdAt: new Date().toISOString()
      },
      {
        id: require('uuid').v4(),
        taskId,
        title: '生成解决方案',
        description: '基于分析结果生成解决方案',
        type: 'ai_analysis',
        inputData: {},
        config: {
          prompt: `基于任务分析结果，生成具体的解决方案：

任务：${task.title}
描述：${task.description}

请提供详细的解决方案。`,
          model: 'gpt-4o-mini',
          temperature: 0.7
        },
        status: 'pending',
        priority: 2,
        dependencies: ['analyze_requirements'],
        createdAt: new Date().toISOString()
      }
    ];

    // 根据 Agent 能力添加更多子任务
    if (agent.capabilities.includes('research') && agent.tools.includes('web_search')) {
      defaultSubtasks.push({
        id: require('uuid').v4(),
        taskId,
        title: '收集相关信息',
        description: '通过网络搜索收集相关信息',
        type: 'web_search',
        inputData: {},
        config: {
          query: task.title,
          maxResults: 5
        },
        status: 'pending',
        priority: 3,
        dependencies: ['analyze_requirements'],
        createdAt: new Date().toISOString()
      });
    }

    if (agent.capabilities.includes('data_processing') && agent.tools.includes('data_transform')) {
      defaultSubtasks.push({
        id: require('uuid').v4(),
        taskId,
        title: '处理数据',
        description: '对收集的数据进行处理和分析',
        type: 'data_processing',
        inputData: {},
        config: {
          operation: 'transform',
          config: {
            mapping: {
              'processed_data': 'raw_data',
              'summary': 'description'
            }
          }
        },
        status: 'pending',
        priority: 4,
        dependencies: ['collect_information'],
        createdAt: new Date().toISOString()
      });
    }

    if (agent.capabilities.includes('writing') && agent.tools.includes('write_file')) {
      defaultSubtasks.push({
        id: require('uuid').v4(),
        taskId,
        title: '生成报告',
        description: '生成最终的任务完成报告',
        type: 'file_operation',
        inputData: {},
        config: {
          operation: 'write',
          filePath: `./reports/${taskId}_report.md`,
          content: '任务完成报告将在这里生成...'
        },
        status: 'pending',
        priority: 5,
        dependencies: ['generate_solution'],
        createdAt: new Date().toISOString()
      });
    }

    for (const subtask of defaultSubtasks) {
      await this.saveSubtask(subtask);
    }

    return defaultSubtasks;
  }

  /**
   * 保存子任务
   * @param {Object} subtask - 子任务对象
   */
  async saveSubtask(subtask) {
    const { db } = require('../db/init.cjs');

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO agent_subtasks (
          id, task_id, title, description, type, input_data,
          config, status, priority, dependencies, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          subtask.id, subtask.taskId, subtask.title, subtask.description,
          subtask.type, JSON.stringify(subtask.inputData),
          JSON.stringify(subtask.config), subtask.status, subtask.priority,
          JSON.stringify(subtask.dependencies), subtask.createdAt
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  /**
   * 获取任务的子任务
   * @param {string} taskId - 任务ID
   */
  async getSubtasks(taskId) {
    const { db } = require('../db/init.cjs');

    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM agent_subtasks WHERE task_id = ? ORDER BY priority ASC, created_at ASC',
        [taskId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => this.formatSubtask(row)));
          }
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
    if (updateData.inputData !== undefined) {
      updateFields.push('input_data = ?');
      params.push(JSON.stringify(updateData.inputData));
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
   * 格式化子任务数据
   * @param {Object} row - 数据库行数据
   */
  formatSubtask(row) {
    return {
      id: row.id,
      taskId: row.task_id,
      parentId: row.parent_id,
      title: row.title,
      description: row.description,
      type: row.type,
      inputData: JSON.parse(row.input_data || '{}'),
      outputData: JSON.parse(row.output_data || '{}'),
      status: row.status,
      priority: row.priority,
      dependencies: JSON.parse(row.dependencies || '[]'),
      errorMessage: row.error_message,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      durationMs: row.duration_ms
    };
  }

  /**
   * 验证子任务依赖关系
   * @param {Array} subtasks - 子任务列表
   */
  validateDependencies(subtasks) {
    const subtaskMap = new Map(subtasks.map(st => [st.id, st]));
    const errors = [];

    for (const subtask of subtasks) {
      for (const depId of subtask.dependencies) {
        if (!subtaskMap.has(depId)) {
          errors.push(`子任务 ${subtask.title} 依赖不存在的子任务 ${depId}`);
        }
      }
    }

    // 检查循环依赖
    const visited = new Set();
    const visiting = new Set();

    const hasCycle = (subtaskId) => {
      if (visiting.has(subtaskId)) return true;
      if (visited.has(subtaskId)) return false;

      visiting.add(subtaskId);
      const subtask = subtaskMap.get(subtaskId);

      for (const depId of subtask.dependencies) {
        if (hasCycle(depId)) return true;
      }

      visiting.delete(subtaskId);
      visited.add(subtaskId);
      return false;
    };

    for (const subtask of subtasks) {
      if (hasCycle(subtask.id)) {
        errors.push(`检测到循环依赖：${subtask.title}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 优化子任务执行顺序
   * @param {Array} subtasks - 子任务列表
   */
  optimizeExecutionOrder(subtasks) {
    // 使用拓扑排序优化执行顺序
    const inDegree = new Map();
    const graph = new Map();

    // 初始化
    for (const subtask of subtasks) {
      inDegree.set(subtask.id, 0);
      graph.set(subtask.id, []);
    }

    // 构建图
    for (const subtask of subtasks) {
      for (const depId of subtask.dependencies) {
        const depSubtask = subtasks.find(st => st.id === depId);
        if (depSubtask) {
          graph.get(depId).push(subtask.id);
          inDegree.set(subtask.id, inDegree.get(subtask.id) + 1);
        }
      }
    }

    // 拓扑排序
    const queue = [];
    const result = [];

    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift();
      result.push(current);

      for (const neighbor of graph.get(current)) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    // 按照优化后的顺序重新排列子任务
    const optimizedSubtasks = [];
    for (const id of result) {
      const subtask = subtasks.find(st => st.id === id);
      if (subtask) {
        optimizedSubtasks.push(subtask);
      }
    }

    return optimizedSubtasks;
  }
}

module.exports = TaskDecomposer;
