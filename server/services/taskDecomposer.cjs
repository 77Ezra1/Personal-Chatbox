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
      // 🔥 优化：使用更强大的模型进行任务拆解
      model: options.defaultModel || process.env.AGENT_DECOMPOSER_MODEL || 'deepseek-chat',

      // 🔥 优化：降低temperature以提高稳定性
      temperature: this.#clampNumber(
        options.defaultTemperature ?? parseFloat(process.env.AGENT_DECOMPOSER_TEMPERATURE ?? '0.2'),
        0,
        2
      ),

      // 🔥 留空 = 无限制的设计
      // 如果用户设置了值，就使用用户的值
      // 如果用户留空（undefined/null），则表示无限制
      maxTokens: this.#parseOptionalInt(
        options.defaultMaxTokens ?? process.env.AGENT_DECOMPOSER_MAX_TOKENS
      ),
      maxSubtasks: this.#parseOptionalInt(
        options.defaultMaxSubtasks ?? process.env.AGENT_DECOMPOSER_MAX_SUBTASKS
      ),
      minSubtasks: this.#parseOptionalInt(
        options.defaultMinSubtasks ?? process.env.AGENT_DECOMPOSER_MIN_SUBTASKS
      ),
      contextLimit: this.#parseOptionalInt(
        options.contextLimit ?? process.env.AGENT_DECOMPOSER_CONTEXT_LIMIT
      ),

      instructions: options.defaultInstructions || null
    };

    // 🔥 日志：清晰显示配置状态
    console.log('[TaskDecomposer] 初始化配置:');
    console.log(`  - 模型: ${this.defaults.model}`);
    console.log(`  - 温度: ${this.defaults.temperature}`);
    console.log(`  - 最大Token: ${this.defaults.maxTokens ?? '无限制'}`);
    console.log(`  - 子任务数量: ${this.defaults.minSubtasks ?? '不限'} - ${this.defaults.maxSubtasks ?? '不限'}`);
    console.log(`  - 上下文限制: ${this.defaults.contextLimit ?? '无限制'}`);
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

    // 🔥 只在设置了maxSubtasks时才限制数量
    if (options.maxSubtasks !== null && options.maxSubtasks !== undefined) {
      if (processedSubtasks.length > options.maxSubtasks) {
        console.log(`[TaskDecomposer] 子任务数量 ${processedSubtasks.length} 超过限制 ${options.maxSubtasks}，截断处理`);
        processedSubtasks = processedSubtasks.slice(0, options.maxSubtasks);
      }
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

    // 🔥 修复：处理 outputData 和 errorMessage
    if (updateData.outputData !== undefined || updateData.errorMessage !== undefined) {
      updateFields.push('output_data = ?');

      // 如果同时有 outputData 和 errorMessage，合并它们
      let outputData = updateData.outputData || {};
      if (updateData.errorMessage !== undefined) {
        outputData = {
          ...outputData,
          error: updateData.errorMessage
        };
      }

      params.push(JSON.stringify(outputData));
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
    // 🔥 修复：从 output_data 中提取 error 字段
    const outputData = JSON.parse(row.output_data || '{}');
    const errorMessage = outputData.error || null;

    return {
      id: row.id,
      taskId: row.task_id,
      parentId: row.parent_id,
      title: row.title,
      description: row.description,
      type: row.type,
      inputData: JSON.parse(row.input_data || '{}'),
      outputData,
      status: row.status,
      priority: row.priority,
      dependencies: JSON.parse(row.dependencies || '[]'),
      errorMessage, // 从 output_data.error 读取
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
      // 🔥 使用新的可选整数解析方法，支持留空=无限制
      maxTokens: this.#parseOptionalInt(
        taskOptions.maxTokens
          ?? runtimeDecomposer.maxTokens
          ?? agentDecomposerConfig.maxTokens
          ?? agentConfig.decomposerMaxTokens
          ?? agentConfig.maxTokens
      ) ?? this.defaults.maxTokens,

      maxSubtasks: this.#parseOptionalInt(
        taskOptions.maxSubtasks
          ?? runtimeDecomposer.maxSubtasks
          ?? agentDecomposerConfig.maxSubtasks
          ?? agentConfig.decomposerMaxSubtasks
      ) ?? this.defaults.maxSubtasks,

      minSubtasks: this.#parseOptionalInt(
        taskOptions.minSubtasks
          ?? runtimeDecomposer.minSubtasks
          ?? agentDecomposerConfig.minSubtasks
          ?? agentConfig.decomposerMinSubtasks
      ) ?? this.defaults.minSubtasks,
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

    // 🔥 修复：获取详细的工具信息
    const availableTools = this.#getDetailedToolInfo(agent);

    const metadata = {
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        capabilities: agent.capabilities,
        tools: agent.tools, // 保留原始服务列表用于兼容性
        availableTools, // 🔥 新增：详细的工具列表
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

    // 🔥 动态构建子任务数量约束说明
    const minSubtasksText = options.minSubtasks ?? '无最小要求';
    const maxSubtasksText = options.maxSubtasks ?? '无上限';
    const rangeText = minSubtasksText === '无最小要求' && maxSubtasksText === '无上限'
      ? '不限制子任务数量，请根据任务复杂度合理拆分'
      : `子任务数量范围：${minSubtasksText} 至 ${maxSubtasksText} 个`;

    const instructions = [
      '请基于上述上下文，将任务拆解为合理的子任务列表。',
      '',
      '## 子任务数量约束',
      `- ${rangeText}`,
      '- 原则：每个子任务应该是一个独立的、可验证的操作单元',
      '- 避免过度拆分（太多琐碎任务）或拆分不足（单个任务过于复杂）',
      '',
      '## 输出格式',
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
      '',
      '## 子任务类型详细说明',
      '',
      '- 🔥 type: tool_call（调用工具）',
      '  - 用于：调用外部工具、API、服务等',
      '  - 必需的 config 字段：',
      '    - toolName: 工具名称（必须使用 agent.availableTools 列表中的确切工具名称）',
      '    - parameters: 工具参数对象',
      '  - 可用工具列表在 agent.availableTools 中，每个工具包含 name 和 description',
      '  - 必须使用 availableTools 中的 name 字段作为 toolName，不要使用服务名称或其他名称',
      '  - 例如：如果 availableTools 包含 {name: "get_current_weather", description: "获取天气"}',
      '    则使用 "get_current_weather" 而不是 "weather" 或 "天气"',
      '',
      '- 🔥 type: ai_analysis（AI分析）',
      '  - 用于：需要AI理解、分析、总结、生成内容的任务',
      '  - 适用场景：分析数据、生成报告、撰写内容、解释结果、提供建议等',
      '  - 必需的 config 字段：',
      '    - prompt: AI分析的提示词（描述需要AI完成什么）',
      '  - 例如：生成天气报告、分析数据趋势、总结结果等都应使用此类型',
      '',
      '- 🔥 type: data_processing（数据处理）',
      '  - 用于：对数据进行机械化的过滤、转换、聚合、验证等操作',
      '  - 必需的 config 字段：',
      '    - operation: filter / transform / aggregate / validate 之一',
      '  - 注意：如果任务需要AI的理解和创造性，应使用 ai_analysis 而不是 data_processing',
      '',
      '- type: web_search（网页搜索）',
      '  - 用于：搜索网络信息',
      '  - 必需的 config 字段：',
      '    - query: 搜索查询字符串',
      '',
      '- type: file_operation（文件操作）',
      '  - 用于：读写文件',
      '  - 必需的 config 字段：',
      '    - operation: read / write / delete 等',
      '    - filePath: 文件路径',
      '',
      '## 任务执行顺序优化',
      '',
      '- 🔥 时间相关任务的智能处理：',
      '  - 当任务涉及"今天"、"当前"、"现在"、"最新"等时间相关词汇时',
      '  - 首先检查 agent.availableTools 中是否有获取时间/日期的工具',
      '  - 判断方法：查看工具的 description 字段，包含"时间"、"日期"、"当前"、"now"、"time"、"date"、"datetime"等关键词',
      '  - 如果找到了时间工具，必须先创建子任务调用该工具获取当前时间，然后让其他子任务依赖它',
      '  - 如果 availableTools 中没有时间工具，则不需要添加获取时间的子任务',
      '  - 例如："查一下广州今天的天气"',
      '    - 假设 availableTools 包含 {name: "get_current_time", description: "获取当前时间和日期"}',
      '    - 应该拆分为：',
      '      1. 获取当前日期时间（type: tool_call, toolName: "get_current_time"）',
      '      2. 获取广州天气（type: tool_call, dependencies: ["获取当前日期时间"]）',
      '      3. 生成天气报告（type: ai_analysis, dependencies: ["获取当前日期时间", "获取广州天气"]）',
      '',
      '- 🔥 如何选择正确的工具：',
      '  - 不要假设工具名称，必须从 agent.availableTools 中查找',
      '  - 根据工具的 description 判断工具的功能',
      '  - 使用工具的 name 字段作为 toolName',
      '  - 不同的用户可能配置了不同名称的工具来实现相同功能',
      '',
      '- 🔥 依赖关系的重要性：',
      '  - 合理设置依赖关系可以确保数据的准确性和时效性',
      '  - 子任务可以通过 dependencies 数组访问依赖任务的输出结果',
      '  - 系统会自动将依赖任务的结果合并到当前任务的 inputData.__dependencyResults 中',
      '',
      '- 所有返回内容必须是有效的 JSON，禁止包含额外文本。'
    ];

    if (Array.isArray(options.instructions)) {
      instructions.push(...options.instructions);
    }

    // 🔥 优化：添加思维链和示例学习
    const examplesSection = this.#buildExamples(agent, availableTools);

    return [
      '你是一名智能任务规划专家，负责根据上下文生成高质量的执行计划。',
      '',
      '## 思维过程',
      '在拆解任务前，请遵循以下思维链：',
      '1. **理解目标**：任务的最终目标是什么？需要什么样的输出？',
      '2. **分析依赖**：完成任务需要哪些信息？这些信息从哪里获取？',
      '3. **识别工具**：查看 availableTools，哪些工具可以帮助获取信息？',
      '4. **时间感知**：任务是否涉及"今天"、"当前"、"最新"等时间词汇？',
      '   - 如果是，检查是否有时间/日期工具（描述包含time/date/datetime/now等）',
      '   - 如果有，必须先调用获取准确的时间基准',
      '5. **确定粒度**：任务应该拆分成几个步骤？每个步骤的粒度是否合适？',
      '   - 太粗：一个子任务做太多事情，难以调试和重试',
      '   - 太细：子任务过多，增加协调成本',
      '   - 原则：每个子任务应该是一个独立的、可验证的操作单元',
      '6. **建立依赖**：子任务之间的执行顺序是什么？哪些可以并行？',
      '7. **选择类型**：每个子任务应该用什么类型？',
      '   - 需要调用外部API/工具 → tool_call',
      '   - 需要AI理解、生成、总结 → ai_analysis',
      '   - 简单的数据转换 → data_processing',
      '',
      '## 上下文',
      '```json',
      contextBlock,
      '```',
      '',
      examplesSection,
      '',
      '## 要求',
      ...instructions,
      '',
      '## 输出格式',
      '请直接输出 JSON 数组，不要添加额外说明、不要使用markdown代码块。',
      '输出示例: [{"title":"...","description":"...","type":"..."}]'
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

  /**
   * 🔥 新增：解析可选整数（留空表示无限制）
   * @param {*} value - 输入值
   * @returns {number|null} 返回整数或null（表示无限制）
   */
  #parseOptionalInt(value) {
    // 如果是undefined、null、空字符串，返回null表示无限制
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const num = Number(value);
    // 如果不是有效数字，返回null表示无限制
    if (!Number.isFinite(num)) {
      return null;
    }

    // 返回整数值
    return Math.round(num);
  }

  #normalizeInt(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    const rounded = Math.round(num);
    if (rounded < min) return min;
    if (max !== null && rounded > max) return max;
    return rounded;
  }

  /**
   * 🔥 优化：构建示例部分，提供few-shot学习
   * @param {Object} agent - Agent 对象
   * @param {Array} availableTools - 可用工具列表
   * @returns {string} 示例文本
   */
  #buildExamples(agent, availableTools) {
    // 检查是否有时间工具
    const hasTimeTools = availableTools.some(tool =>
      /time|date|datetime|now|当前|时间|日期/i.test(tool.description || tool.name)
    );

    // 检查是否有天气工具
    const hasWeatherTools = availableTools.some(tool =>
      /weather|天气|气温|温度/i.test(tool.description || tool.name)
    );

    const examples = [];

    // 示例1：时间敏感的天气查询
    if (hasTimeTools && hasWeatherTools) {
      const timeToolName = availableTools.find(t =>
        /time|date|datetime|now|当前|时间|日期/i.test(t.description || t.name)
      )?.name || 'get_current_time';

      const weatherToolName = availableTools.find(t =>
        /weather|天气/i.test(t.description || t.name)
      )?.name || 'get_current_weather';

      examples.push({
        task: '总结一下今天广东各市的天气情况',
        thinking: [
          '1. 任务目标：生成广东各市今天的天气总结报告',
          '2. 关键词"今天"表示需要时间上下文',
          '3. 需要的信息：当前日期、各城市天气数据',
          '4. 可用工具：发现时间工具和天气工具',
          '5. 拆解策略：',
          '   - 先获取当前时间（确保"今天"的准确性）',
          '   - 然后获取各城市天气（依赖时间）',
          '   - 最后用AI总结数据（依赖天气数据）'
        ],
        subtasks: [
          {
            title: '获取当前日期时间',
            description: '获取准确的当前时间，为后续数据分析提供时间基准',
            type: 'tool_call',
            config: {
              toolName: timeToolName,
              parameters: { timezone: 'Asia/Shanghai' }
            },
            dependencies: [],
            priority: 1
          },
          {
            title: '获取广州天气',
            description: '获取广州的实时天气信息',
            type: 'tool_call',
            config: {
              toolName: weatherToolName,
              parameters: { location: '广州' }
            },
            dependencies: ['获取当前日期时间'],
            priority: 2
          },
          {
            title: '获取深圳天气',
            description: '获取深圳的实时天气信息',
            type: 'tool_call',
            config: {
              toolName: weatherToolName,
              parameters: { location: '深圳' }
            },
            dependencies: ['获取当前日期时间'],
            priority: 2
          },
          {
            title: '生成天气总结报告',
            description: '基于获取的天气数据，生成易读的总结报告',
            type: 'ai_analysis',
            config: {
              prompt: '请根据广东各市的天气数据，生成一份简洁的天气总结报告，包括温度范围、天气状况、是否适合外出等建议。'
            },
            dependencies: ['获取广州天气', '获取深圳天气'],
            priority: 3
          }
        ]
      });
    }

    // 示例2：数据分析任务
    examples.push({
      task: '分析用户反馈数据并生成报告',
      thinking: [
        '1. 任务目标：分析数据并生成报告',
        '2. 不涉及实时性，无需时间工具',
        '3. 需要的信息：用户反馈数据（假设已在输入中）',
        '4. 拆解策略：',
        '   - 数据清洗和验证',
        '   - AI分析趋势和问题',
        '   - 生成结构化报告'
      ],
      subtasks: [
        {
          title: '数据清洗',
          description: '验证和清洗用户反馈数据',
          type: 'data_processing',
          config: {
            operation: 'validate',
            rules: ['非空检查', '格式验证']
          },
          dependencies: [],
          priority: 1
        },
        {
          title: '分析用户反馈趋势',
          description: '使用AI分析反馈中的主要问题和趋势',
          type: 'ai_analysis',
          config: {
            prompt: '请分析用户反馈数据，总结主要问题、常见建议和整体情感倾向。'
          },
          dependencies: ['数据清洗'],
          priority: 2
        },
        {
          title: '生成分析报告',
          description: '将分析结果整理成结构化报告',
          type: 'ai_analysis',
          config: {
            prompt: '请将分析结果整理成Markdown格式的报告，包含：1.概述 2.主要发现 3.建议'
          },
          dependencies: ['分析用户反馈趋势'],
          priority: 3
        }
      ]
    });

    if (examples.length === 0) {
      return '';
    }

    // 构建示例文本
    const exampleTexts = examples.map((ex, idx) => {
      const thinkingText = ex.thinking.map(t => `   ${t}`).join('\n');
      const subtasksJson = JSON.stringify(ex.subtasks, null, 2);

      return [
        `### 示例 ${idx + 1}：${ex.task}`,
        '',
        '**思维过程：**',
        thinkingText,
        '',
        '**输出：**',
        '```json',
        subtasksJson,
        '```'
      ].join('\n');
    });

    return [
      '## 任务拆解示例',
      '',
      '以下示例展示了如何根据不同的任务类型进行拆解：',
      '',
      ...exampleTexts
    ].join('\n');
  }

  /**
   * 🔥 修复：获取详细的工具信息
   * 从本地服务和MCP服务中获取所有可用工具的详细列表
   * @param {Object} agent - Agent 对象
   * @returns {Array} 工具信息数组
   */
  #getDetailedToolInfo(agent) {
    const toolsInfo = [];

    if (!agent.tools || agent.tools.length === 0) {
      console.log(`[TaskDecomposer] Agent "${agent.name}" 没有配置工具`);
      return toolsInfo;
    }

    // 1. 🔥 从全局导出的 services 获取本地服务的工具
    try {
      // 使用全局 services 变量（由 index.cjs 导出）
      const { services } = require('../index.cjs');

      if (services) {
        for (const toolId of agent.tools) {
          const service = services[toolId];

          if (service && service.tools && Array.isArray(service.tools)) {
            // 从服务的 tools 数组中提取工具信息
            for (const toolDef of service.tools) {
              if (toolDef.type === 'function' && toolDef.function) {
                toolsInfo.push({
                  name: toolDef.function.name,
                  description: toolDef.function.description || '',
                  parameters: toolDef.function.parameters || {},
                  source: service.name || toolId
                });
              }
            }
            console.log(`[TaskDecomposer] 从服务 "${toolId}" 获取了 ${service.tools.length} 个工具`);
          } else {
            console.warn(`[TaskDecomposer] 服务 "${toolId}" 不存在或没有工具定义`);
          }
        }
      }
    } catch (error) {
      console.warn('[TaskDecomposer] 无法从 index.cjs 获取 services:', error.message);
    }

    // 2. 从 MCP 服务获取工具
    try {
      const mcpManager = require('./mcp-manager.cjs');
      if (mcpManager && typeof mcpManager.getAllTools === 'function') {
        const mcpTools = mcpManager.getAllTools(agent.userId);
        for (const mcpTool of mcpTools) {
          if (mcpTool.type === 'function' && mcpTool.function) {
            toolsInfo.push({
              name: mcpTool.function.name,
              description: mcpTool.function.description || '',
              parameters: mcpTool.function.parameters || {},
              source: 'mcp'
            });
          }
        }
        console.log(`[TaskDecomposer] 从 MCP 获取了 ${mcpTools.length} 个工具`);
      }
    } catch (error) {
      console.warn('[TaskDecomposer] 获取 MCP 工具信息失败:', error.message);
    }

    console.log(`[TaskDecomposer] Agent "${agent.name}" 最终可用工具数量: ${toolsInfo.length}`);
    if (toolsInfo.length > 0) {
      console.log(`[TaskDecomposer] 工具列表: ${toolsInfo.map(t => t.name).join(', ')}`);
    }

    return toolsInfo;
  }
}

module.exports = TaskDecomposer;
