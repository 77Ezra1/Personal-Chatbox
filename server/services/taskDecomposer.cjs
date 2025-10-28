/**
 * 任务分解器
 * 根据任务与 Agent 信息生成子任务列表，支持自定义模型参数与提示词
 */

const AIService = require('./aiService.cjs');
const { v4: uuidv4 } = require('uuid');

const INTERNAL_KEY_PREFIX = '__';

class TaskDecomposer {
  constructor(options = {}) {
    this.defaults = {
      model: options.defaultModel || process.env.AGENT_DECOMPOSER_MODEL || 'gpt-4o-mini',
      temperature: this.#clampNumber(
        options.defaultTemperature ?? parseFloat(process.env.AGENT_DECOMPOSER_TEMPERATURE ?? '0.3'),
        0,
        2
      ),
      maxTokens: this.#normalizeInt(
        options.defaultMaxTokens ?? process.env.AGENT_DECOMPOSER_MAX_TOKENS,
        256,
        4000,
        1200
      ),
      maxSubtasks: this.#normalizeInt(
        options.defaultMaxSubtasks ?? process.env.AGENT_DECOMPOSER_MAX_SUBTASKS,
        3,
        25,
        8
      ),
      instructions: options.defaultInstructions || null,
      contextLimit: this.#normalizeInt(
        options.contextLimit ?? process.env.AGENT_DECOMPOSER_CONTEXT_LIMIT,
        500,
        20000,
        4000
      )
    };
  }

  /**
   * 分解任务
   * @param {Object} task - 任务对象
   * @param {Object} agent - Agent 对象
   */
  async decomposeTask(task, agent, runtimeConfig = null) {
    const aiService = new AIService(agent.userId);
    const options = this.#resolveOptions(task, agent, runtimeConfig);
    const prompt = this.#buildPrompt(task, agent, options);
    let subtasks = [];

    try {
      const response = await aiService.generateResponse(prompt, '', {
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens
      });

      const content = response?.content;

      if (!content) {
        throw new Error('AI 响应为空');
      }

      const subtaskData = this.parseJsonResponse(content);
      subtasks = await this.createSubtasks(task.id, subtaskData, agent, options);
    } catch (error) {
      console.error('任务分解失败:', error);
      subtasks = await this.createDefaultSubtasks(task.id, task, agent, options, error.message);
    }

    let processedSubtasks = this.postProcessSubtasks(subtasks);

    if (processedSubtasks.length > options.maxSubtasks) {
      processedSubtasks = processedSubtasks.slice(0, options.maxSubtasks);
    }

    await this.persistSubtasks(processedSubtasks);

    return processedSubtasks;
  }

  /**
   * 解析 JSON 响应
   * @param {string} response - AI 响应
   */
  parseJsonResponse(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error(`无法解析 AI 响应为 JSON 格式: ${error.message}`);
    }
  }

  /**
   * 创建子任务
   */
  async createSubtasks(taskId, subtaskData, agent, options) {
    const subtasks = [];
    const agentConfig = agent?.config || {};

    // 确定子任务应该使用的模型配置
    const defaultModel = agentConfig.model || options?.model || this.defaults.model;
    const defaultTemperature = agentConfig.temperature || options?.temperature || this.defaults.temperature;

    // 第一遍：创建所有子任务，生成UUID，但保留原始依赖（可能是字符串）
    const titleToIdMap = new Map();

    for (const data of subtaskData) {
      const subtaskId = uuidv4();
      const subtask = {
        id: subtaskId,
        taskId,
        title: data.title || '未命名子任务',
        description: data.description || '',
        type: data.type || 'ai_analysis',
        inputData: data.inputData || {},
        config: {
          ...(data.config || {}),
          // 🔥 关键修复：确保子任务继承agent的model配置
          model: data.config?.model || defaultModel,
          temperature: data.config?.temperature !== undefined ? data.config.temperature : defaultTemperature
        },
        status: 'pending',
        priority: data.priority || 0,
        dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
        createdAt: new Date().toISOString()
      };

      subtasks.push(subtask);

      // 建立标题到ID的映射（用于依赖解析）
      titleToIdMap.set(subtask.title, subtaskId);

      // 同时支持AI可能返回的标题变体（去除空格、标点等）
      const normalizedTitle = subtask.title.replace(/[\s\-_、，。！？]/g, '').toLowerCase();
      titleToIdMap.set(normalizedTitle, subtaskId);
    }

    // 第二遍：解析依赖关系，将字符串依赖转换为UUID
    for (const subtask of subtasks) {
      const resolvedDependencies = [];

      for (const dep of subtask.dependencies) {
        if (!dep) continue;

        // 如果依赖已经是有效的UUID格式，直接使用
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(dep)) {
          resolvedDependencies.push(dep);
          continue;
        }

        // 否则，尝试根据标题查找对应的UUID
        // 1. 精确匹配
        if (titleToIdMap.has(dep)) {
          resolvedDependencies.push(titleToIdMap.get(dep));
          console.log(`[TaskDecomposer] 依赖解析: "${dep}" → ${titleToIdMap.get(dep)}`);
          continue;
        }

        // 2. 规范化后匹配（去除空格、标点）
        const normalizedDep = dep.replace(/[\s\-_、，。！？]/g, '').toLowerCase();
        if (titleToIdMap.has(normalizedDep)) {
          resolvedDependencies.push(titleToIdMap.get(normalizedDep));
          console.log(`[TaskDecomposer] 依赖解析(规范化): "${dep}" → ${titleToIdMap.get(normalizedDep)}`);
          continue;
        }

        // 3. 模糊匹配（查找包含关系）
        let found = false;
        for (const [title, id] of titleToIdMap.entries()) {
          if (title.includes(dep) || dep.includes(title)) {
            resolvedDependencies.push(id);
            console.log(`[TaskDecomposer] 依赖解析(模糊匹配): "${dep}" → ${id} (匹配标题: "${title}")`);
            found = true;
            break;
          }
        }

        if (!found) {
          console.warn(`[TaskDecomposer] 警告: 无法解析依赖 "${dep}"，将被忽略`);
        }
      }

      // 更新为解析后的依赖列表
      subtask.dependencies = resolvedDependencies;
    }

    console.log(`[TaskDecomposer] 创建了 ${subtasks.length} 个子任务，依赖解析完成`);
    return subtasks;
  }

  /**
   * 创建默认子任务
   */
  async createDefaultSubtasks(taskId, task, agent, options, failureReason = '') {
    const sanitizedInput = this.#stripInternalKeys(task.inputData);
    const analyzeRequirementsId = uuidv4();
    const generateSolutionId = uuidv4();

    const defaultSubtasks = [
      {
        id: analyzeRequirementsId,
        taskId,
        title: '分析任务需求',
        description: '分析任务的具体需求和目标',
        type: 'ai_analysis',
        inputData: sanitizedInput,
        config: {
          prompt: `请分析任务“${task.title}”的需求与约束。` + (failureReason ? `\n之前的分解错误信息: ${failureReason}` : ''),
          model: options.model,
          temperature: this.#clampNumber(options.temperature * 0.8, 0, 2)
        },
        status: 'pending',
        priority: 1,
        dependencies: [],
        createdAt: new Date().toISOString()
      },
      {
        id: generateSolutionId,
        taskId,
        title: '生成解决方案',
        description: '基于分析结果生成可执行方案',
        type: 'ai_analysis',
        inputData: {},
        config: {
          prompt: `根据分析结果，为“${task.title}”生成完整的解决方案。`,
          model: options.model,
          temperature: options.temperature
        },
        status: 'pending',
        priority: 2,
        dependencies: [analyzeRequirementsId],
        createdAt: new Date().toISOString()
      }
    ];

    const taskCaps = Array.isArray(agent.capabilities) ? agent.capabilities : [];
    const taskTools = Array.isArray(agent.tools) ? agent.tools : [];

    if (taskCaps.includes('research') && taskTools.includes('web_search')) {
      const researchId = uuidv4();
      defaultSubtasks.push({
        id: researchId,
        taskId,
        title: '收集相关信息',
        description: '通过网络搜索收集完成任务所需的最新资料',
        type: 'web_search',
        inputData: {},
        config: {
          query: task.title,
          maxResults: 5
        },
        status: 'pending',
        priority: 3,
        dependencies: [analyzeRequirementsId],
        createdAt: new Date().toISOString()
      });
    }

    if (taskCaps.includes('data_processing') && taskTools.includes('data_transform')) {
      defaultSubtasks.push({
        id: uuidv4(),
        taskId,
        title: '处理数据',
        description: '对收集的数据进行处理和结构化整理',
        type: 'data_processing',
        inputData: {},
        config: {
          operation: 'transform',
          config: {
            mapping: {
              processed_data: 'raw_data',
              summary: 'description'
            }
          }
        },
        status: 'pending',
        priority: 4,
        dependencies: [analyzeRequirementsId],
        createdAt: new Date().toISOString()
      });
    }

    if (taskCaps.includes('writing') && taskTools.includes('write_file')) {
      defaultSubtasks.push({
        id: uuidv4(),
        taskId,
        title: '生成任务输出',
        description: '根据最终方案生成可交付成果',
        type: 'file_operation',
        inputData: {},
        config: {
          operation: 'write',
          filePath: `./reports/${taskId}_report.md`,
          content: '任务完成报告将在这里生成...'
        },
        status: 'pending',
        priority: 5,
        dependencies: [generateSolutionId],
        createdAt: new Date().toISOString()
      });
    }

    return defaultSubtasks;
  }

  /**
   * 对生成的子任务进行依赖校验及排序
   */
  postProcessSubtasks(subtasks) {
    const { valid, errors, cleanedSubtasks } = this.validateDependencies(subtasks);

    if (!valid) {
      console.warn(`[TaskDecomposer] 子任务依赖校验发现问题: ${errors.join('; ')}`);
      console.warn(`[TaskDecomposer] 已自动清理无效依赖，继续执行`);
      // 使用清理后的子任务而不是抛出错误
      return this.optimizeExecutionOrder(cleanedSubtasks);
    }

    return this.optimizeExecutionOrder(subtasks);
  }

  /**
   * 将子任务持久化
   */
  async persistSubtasks(subtasks) {
    for (const subtask of subtasks) {
      await this.saveSubtask(subtask);
    }
  }

  /**
   * 解析 AI 响应后校验依赖关系
   */
  validateDependencies(subtasks) {
    const subtaskMap = new Map(subtasks.map(st => [st.id, st]));
    const errors = [];
    const cleanedSubtasks = [];

    // 第一步：清理无效依赖
    for (const subtask of subtasks) {
      const validDependencies = [];
      for (const depId of subtask.dependencies) {
        if (!subtaskMap.has(depId)) {
          errors.push(`子任务 ${subtask.title} 依赖不存在的子任务 ${depId}`);
          console.warn(`[TaskDecomposer] 移除无效依赖: ${subtask.title} -> ${depId}`);
        } else {
          validDependencies.push(depId);
        }
      }

      // 创建清理后的子任务副本
      const cleanedSubtask = {
        ...subtask,
        dependencies: validDependencies
      };
      cleanedSubtasks.push(cleanedSubtask);
    }

    // 第二步：检测循环依赖
    const visited = new Set();
    const visiting = new Set();

    const hasCycle = (subtaskId) => {
      if (visiting.has(subtaskId)) return true;
      if (visited.has(subtaskId)) return false;

      visiting.add(subtaskId);
      const subtask = subtaskMap.get(subtaskId);

      if (!subtask) return false;

      for (const depId of subtask.dependencies) {
        if (hasCycle(depId)) return true;
      }

      visiting.delete(subtaskId);
      visited.add(subtaskId);
      return false;
    };

    for (const subtask of cleanedSubtasks) {
      if (hasCycle(subtask.id)) {
        errors.push(`检测到循环依赖：${subtask.title}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      cleanedSubtasks
    };
  }

  /**
   * 拓扑排序优化执行顺序
   */
  optimizeExecutionOrder(subtasks) {
    const inDegree = new Map();
    const graph = new Map();

    for (const subtask of subtasks) {
      inDegree.set(subtask.id, 0);
      graph.set(subtask.id, []);
    }

    for (const subtask of subtasks) {
      for (const depId of subtask.dependencies) {
        if (graph.has(depId)) {
          graph.get(depId).push(subtask.id);
          inDegree.set(subtask.id, (inDegree.get(subtask.id) || 0) + 1);
        }
      }
    }

    const queue = [];
    const result = [];

    for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift();
      result.push(current);

      for (const neighbor of graph.get(current) || []) {
        const nextDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, nextDegree);
        if (nextDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    const ordered = [];
    for (const id of result) {
      const subtask = subtasks.find(st => st.id === id);
      if (subtask) {
        ordered.push(subtask);
      }
    }

    return ordered;
  }

  /**
   * 保存子任务
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
          subtask.type, JSON.stringify(subtask.inputData || {}),
          JSON.stringify(subtask.config || {}), subtask.status, subtask.priority,
          JSON.stringify(subtask.dependencies || []), subtask.createdAt
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  /**
   * 从数据库获取子任务
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
   * 解析选项
   */
  #resolveOptions(task, agent, runtimeConfig = {}) {
    const agentConfig = agent?.config || {};
    const agentDecomposerConfig = agentConfig.decomposer || agentConfig.decomposition || {};
    const taskOptions = task?.decompositionOptions
      || (task?.inputData && typeof task.inputData === 'object' ? task.inputData.__decomposition : null)
      || {};
    const runtimeDecomposer = runtimeConfig || {};

    if (task && typeof task === 'object' && !task.decompositionOptions && taskOptions) {
      task.decompositionOptions = taskOptions;
    }

    // 🔥 详细调试日志
    console.log('[TaskDecomposer] resolveOptions:');
    console.log('  - agent.name:', agent?.name);
    console.log('  - taskOptions.model:', taskOptions.model);
    console.log('  - runtimeDecomposer.model:', runtimeDecomposer.model);
    console.log('  - agentDecomposerConfig.model:', agentDecomposerConfig.model);
    console.log('  - agentConfig.decomposerModel:', agentConfig.decomposerModel);
    console.log('  - agentConfig.model:', agentConfig.model);
    console.log('  - this.defaults.model:', this.defaults.model);

    // 🔥 关键修复：agent配置的模型优先级应该高于runtime默认值
    const merged = {
      model: taskOptions.model
        || agentDecomposerConfig.model
        || agentConfig.decomposerModel
        || agentConfig.model           // ← Agent模型优先
        || runtimeDecomposer.model     // ← Runtime默认值次之
        || this.defaults.model,
      temperature: this.#clampNumber(
        taskOptions.temperature
          ?? runtimeDecomposer.temperature
          ?? agentDecomposerConfig.temperature
          ?? agentConfig.decomposerTemperature
          ?? agentConfig.temperature
          ?? this.defaults.temperature,
        0,
        2
      ),
      maxTokens: this.#normalizeInt(
        taskOptions.maxTokens
          ?? runtimeDecomposer.maxTokens
          ?? agentDecomposerConfig.maxTokens
          ?? agentConfig.decomposerMaxTokens
          ?? agentConfig.maxTokens,
        256,
        4000,
        this.defaults.maxTokens
      ),
      maxSubtasks: this.#normalizeInt(
        taskOptions.maxSubtasks
          ?? runtimeDecomposer.maxSubtasks
          ?? agentDecomposerConfig.maxSubtasks
          ?? agentConfig.decomposerMaxSubtasks,
        3,
        25,
        this.defaults.maxSubtasks
      ),
      instructions: taskOptions.instructions
        || runtimeDecomposer.instructions
        || agentDecomposerConfig.instructions
        || this.defaults.instructions,
      persona: taskOptions.persona || agentDecomposerConfig.persona || null,
      contextLimit: this.#normalizeInt(
        taskOptions.contextLimit
          ?? runtimeDecomposer.contextLimit,
        500,
        20000,
        this.defaults.contextLimit
      )
    };

    if (merged.instructions && typeof merged.instructions === 'string') {
      merged.instructions = [merged.instructions];
    }

    console.log('  - merged.model:', merged.model);
    console.log('  - merged.temperature:', merged.temperature);

    return merged;
  }

  /**
   * 构建 Prompt
   */
  #buildPrompt(task, agent, options) {
    const sanitizedInput = this.#stripInternalKeys(task.inputData);
    const agentConfig = this.#pickAgentConfig(agent.config || {});
    const metadata = {
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        capabilities: agent.capabilities,
        tools: agent.tools,
        persona: options.persona || agentConfig.persona || null,
        config: agentConfig
      },
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        createdAt: task.createdAt,
        inputData: sanitizedInput
      }
    };

    const contextBlock = this.#stringifyWithLimit(metadata, options.contextLimit);

    const instructions = [
      '请基于上述上下文，将任务拆解为合理的子任务列表。',
      `- 子任务数量不应超过 ${options.maxSubtasks} 个。`,
      '- 输出一个 JSON 数组，每个元素都应包含以下字段：',
      '  - title: 子任务标题（简短清晰的描述）',
      '  - description: 具体说明',
      '  - type: tool_call / ai_analysis / data_processing / web_search / file_operation 之一',
      '  - inputData: 执行子任务所需的输入（对象或数组）',
      '  - config: 子任务的额外配置（例如工具参数、提示词等）',
      '  - dependencies: 依赖的子任务标题列表（使用字符串数组，填写依赖子任务的 title）',
      '  - priority: 数字越大代表越重要/越晚执行',
      '- dependencies 说明：',
      '  - 如果子任务B依赖于子任务A的结果，则在B的dependencies中写入A的title',
      '  - 例如：子任务A的title为"获取ETH实时价格"，子任务B依赖它，则B的dependencies为["获取ETH实时价格"]',
      '  - 如果没有依赖，使用空数组 []',
      '- 如果无法明确输入数据，可使用空对象 {} 作为占位。',
      '- 如果需要调用工具，请优先使用 agent.tools 中已配置的 MCP 工具。',
      '- 对于 type: tool_call 的子任务，请在 config 中指定：',
      '  - toolName: 工具名称（从 agent.tools 列表中选择）',
      '  - parameters: 工具参数对象',
      '- MCP 工具格式为 serviceId_toolName，例如 wikipedia_findPage、filesystem_read_file。',
      '- 所有返回内容必须是有效的 JSON，禁止包含额外文本。'
    ];

    if (Array.isArray(options.instructions)) {
      instructions.push(...options.instructions);
    }

    return [
      '你是一名智能任务规划专家，负责根据上下文生成高质量的执行计划。',
      '',
      '## 上下文',
      '```json',
      contextBlock,
      '```',
      '',
      '## 要求',
      ...instructions,
      '',
      '请直接输出 JSON 数组，不要添加额外说明。'
    ].join('\n');
  }

  #stripInternalKeys(value) {
    if (Array.isArray(value)) {
      return value.map(item => this.#stripInternalKeys(item));
    }
    if (value && typeof value === 'object') {
      const result = {};
      for (const [key, val] of Object.entries(value)) {
        if (typeof key === 'string' && key.startsWith(INTERNAL_KEY_PREFIX)) {
          continue;
        }
        result[key] = this.#stripInternalKeys(val);
      }
      return result;
    }
    return value;
  }

  #pickAgentConfig(config) {
    if (!config || typeof config !== 'object') {
      return {};
    }
    const {
      model,
      temperature,
      maxTokens,
      maxConcurrentTasks,
      stopOnError,
      retryAttempts,
      decomposer,
      decomposition,
      ...rest
    } = config;

    const picked = {
      model,
      temperature,
      maxTokens,
      maxConcurrentTasks,
      stopOnError,
      retryAttempts
    };

    if (decomposer) {
      picked.decomposer = decomposer;
    }
    if (decomposition) {
      picked.decomposition = decomposition;
    }

    for (const [key, value] of Object.entries(rest)) {
      if (key.startsWith(INTERNAL_KEY_PREFIX)) continue;
      if (key.toLowerCase().includes('secret')) continue;
      picked[key] = value;
    }

    return picked;
  }

  #stringifyWithLimit(value, limit) {
    try {
      const json = JSON.stringify(value, null, 2);
      if (!limit || json.length <= limit) {
        return json;
      }
      return json.slice(0, limit) + '\n... (已截断)';
    } catch (error) {
      return '[无法序列化上下文]';
    }
  }

  #clampNumber(value, min, max) {
    const num = Number(value);
    if (!Number.isFinite(num)) return min;
    return Math.min(max, Math.max(min, num));
  }

  #normalizeInt(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    const rounded = Math.round(num);
    if (rounded < min) return min;
    if (rounded > max) return max;
    return rounded;
  }
}

module.exports = TaskDecomposer;
