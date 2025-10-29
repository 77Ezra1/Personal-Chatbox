/**
 * 工作流执行引擎
 * 处理工作流的执行、节点管理和数据流转
 */

const { v4: uuidv4 } = require('uuid');
const { Parser } = require('expr-eval');

// ✅ 导入 WebSocket 管理器
const { getInstance: getWorkflowWSManager } = require('./workflowWebSocket.cjs');

// ✅ 导入调试器
const { getInstance: getDebugger } = require('./workflowDebugger.cjs');

class WorkflowEngine {
  constructor() {
    this.executions = new Map();
    this.nodeTypes = this.loadNodeTypes();
  }

  /**
   * 执行工作流
   * @param {string} workflowId - 工作流ID
   * @param {Object} inputData - 输入数据
   * @param {number} userId - 用户ID
   * @param {Object} debugOptions - 调试选项 { mode: 'normal'|'debug'|'step' }
   */
  async executeWorkflow(workflowId, inputData, userId, debugOptions = {}) {
    const executionId = uuidv4();
    const wsManager = getWorkflowWSManager();
    const workflowDebugger = getDebugger();

    try {
      // 获取工作流定义
      const workflow = await this.getWorkflow(workflowId, userId);

      // 创建执行记录
      const execution = {
        id: executionId,
        workflowId,
        userId,
        status: 'running',
        inputData,
        outputData: null,
        startedAt: new Date(),
        nodes: new Map(),
        debugMode: debugOptions.mode || 'normal' // ✅ 添加调试模式
      };

      this.executions.set(executionId, execution);

      // ✅ 如果是调试模式，创建调试会话
      if (debugOptions.mode && debugOptions.mode !== 'normal') {
        workflowDebugger.createSession(executionId, workflowId, debugOptions);
      }

      // 保存执行记录到数据库
      await this.saveExecution(execution);

      // ✅ 推送工作流开始事件
      wsManager.pushWorkflowStart(executionId, {
        workflowId,
        workflowName: workflow.name,
        startedAt: execution.startedAt
      });

      try {
        // 执行工作流
        const result = await this.runWorkflow(workflow, inputData, executionId);

        // 更新执行状态
        execution.status = 'completed';
        execution.outputData = result;
        execution.completedAt = new Date();
        execution.durationMs = execution.completedAt - execution.startedAt;

        // 保存到数据库
        await this.updateExecution(execution);

        // ✅ 推送工作流完成事件
        wsManager.pushWorkflowComplete(executionId, {
          status: execution.status,
          outputData: execution.outputData,
          completedAt: execution.completedAt,
          durationMs: execution.durationMs
        });

        // ✅ 清理调试会话
        workflowDebugger.deleteSession(executionId);

        // ✅ 返回结果和执行ID
        return {
          executionId,
          result,
          status: 'completed'
        };
      } catch (error) {
        execution.status = 'failed';
        execution.errorMessage = error.message;
        execution.completedAt = new Date();
        execution.durationMs = execution.completedAt - execution.startedAt;

        await this.updateExecution(execution);

        // ✅ 推送工作流失败事件
        wsManager.pushWorkflowError(executionId, error);

        // ✅ 清理调试会话
        workflowDebugger.deleteSession(executionId);

        throw error;
      }
    } catch (error) {
      console.error('执行工作流失败:', error);
      throw error;
    }
  }

  /**
   * 运行工作流
   * @param {Object} workflow - 工作流定义
   * @param {Object} inputData - 输入数据
   * @param {string} executionId - 执行ID
   */
  async runWorkflow(workflow, inputData, executionId) {
    const { nodes, connections } = workflow.definition;
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const connectionMap = this.buildConnectionMap(connections);

    // ✅ 创建执行上下文，包含 nodeMap、connectionMap 和 workflowId
    const executionContext = {
      executionId,
      workflowId: workflow.id,
      nodeMap,
      connectionMap,
      workflow
    };

    // 找到开始节点
    const startNodes = nodes.filter(node => node.type === 'start');
    if (startNodes.length === 0) {
      throw new Error('工作流必须包含开始节点');
    }

    // 执行开始节点
    const startNode = startNodes[0];
    const startResult = await this.executeNode(startNode, inputData, executionContext);

    // 执行后续节点
    const result = await this.executeNodeChain(
      startNode.id,
      startResult,
      executionContext
    );

    return result;
  }

  /**
   * 执行节点链
   * @param {string} nodeId - 节点ID
   * @param {Object} inputData - 输入数据
   * @param {Object} executionContext - 执行上下文
   */
  async executeNodeChain(nodeId, inputData, executionContext) {
    const { nodeMap, connectionMap } = executionContext;
    const node = nodeMap.get(nodeId);
    if (!node) return inputData;

    // 执行当前节点
    const result = await this.executeNode(node, inputData, executionContext);

    // 获取后续节点
    const nextConnections = connectionMap.get(nodeId) || [];

    if (nextConnections.length === 0) {
      return result; // 结束节点
    }

    // ✅ 特殊处理条件节点：根据条件结果选择分支
    if (node.type === 'condition') {
      const conditionResult = result.conditionResult;
      let dataToPass = result.data;

      // 只执行匹配条件的分支
      const matchingConnection = nextConnections.find(conn => {
        const handle = conn.sourceHandle || 'default';
        return (conditionResult && handle === 'true') ||
               (!conditionResult && handle === 'false');
      });

      if (matchingConnection) {
        // ✅ 应用数据映射
        dataToPass = this.applyDataMapping(dataToPass, matchingConnection.dataMapping);

        return await this.executeNodeChain(
          matchingConnection.targetNodeId,
          dataToPass,
          executionContext
        );
      } else {
        console.warn('[WorkflowEngine] 条件节点没有匹配的分支:', {
          nodeId,
          conditionResult,
          connections: nextConnections
        });
        return dataToPass;
      }
    }

    // ✅ 特殊处理并行节点：后续节点已在 executeParallel 中并行执行
    if (node.type === 'parallel') {
      // 并行节点的结果已经包含了所有后续节点的执行结果
      // 不需要在这里继续执行
      return result;
    }

    // 普通节点：执行所有后续节点
    const nextResults = [];
    for (const connection of nextConnections) {
      // ✅ 应用数据映射（如果配置了）
      const dataToPass = this.applyDataMapping(result, connection.dataMapping);

      if (connection.dataMapping) {
        console.log('[WorkflowEngine] 应用数据映射:', {
          sourceNodeId: nodeId,
          targetNodeId: connection.targetNodeId,
          mapping: connection.dataMapping.mode,
          originalData: result,
          mappedData: dataToPass
        });
      }

      const nextResult = await this.executeNodeChain(
        connection.targetNodeId,
        dataToPass,
        executionContext
      );
      nextResults.push(nextResult);
    }

    // 如果只有一个结果，直接返回；否则返回数组
    return nextResults.length === 1 ? nextResults[0] : nextResults;
  }

  /**
   * 执行单个节点
   * @param {Object} node - 节点定义
   * @param {Object} inputData - 输入数据
   * @param {Object} executionContext - 执行上下文
   */
  async executeNode(node, inputData, executionContext) {
    const { executionId, workflowId } = executionContext;
    const wsManager = getWorkflowWSManager();
    const workflowDebugger = getDebugger();

    // ✅ 调试检查点：在节点执行前检查是否需要暂停
    await workflowDebugger.checkPauseBeforeNode(executionId, workflowId, node.id, {
      type: node.type,
      label: node.label,
      config: node.config
    });

    const nodeExecution = {
      id: uuidv4(),
      executionId,
      nodeId: node.id,
      status: 'running',
      inputData,
      outputData: null,
      startedAt: new Date(),
      retryCount: 0
    };

    // ✅ 推送节点开始事件
    wsManager.pushNodeStart(executionId, {
      nodeId: node.id,
      nodeType: node.type,
      nodeLabel: node.label || node.id,
      startedAt: nodeExecution.startedAt
    });

    // ✅ 更新调试器变量
    workflowDebugger.updateVariables(executionId, {
      [`node_${node.id}_input`]: inputData
    });

    // ✅ 获取重试配置
    const retryConfig = node.config?.retry || {};
    const maxRetries = retryConfig.maxRetries || 0;
    const retryDelay = retryConfig.retryDelay || 1000;
    const backoff = retryConfig.backoff || 'fixed'; // fixed, exponential, linear

    let lastError = null;

    // ✅ 重试循环
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        nodeExecution.retryCount = attempt;

        if (attempt > 0) {
          const delay = this.calculateRetryDelay(retryDelay, attempt, backoff);
          console.log('[WorkflowEngine] 重试节点:', {
            nodeId: node.id,
            attempt,
            maxRetries,
            delayMs: delay
          });

          // ✅ 推送节点重试事件
          wsManager.pushNodeRetry(executionId, {
            nodeId: node.id,
            attempt,
            maxRetries,
            delayMs: delay
          });

          await this.sleep(delay);
        }

        let result;

      switch (node.type) {
        case 'start':
          result = inputData;
          break;
        case 'ai_analysis':
          result = await this.executeAIAnalysis(node, inputData);
          break;
        case 'data_transform':
          result = await this.executeDataTransform(node, inputData);
          break;
        case 'condition':
          result = await this.executeCondition(node, inputData);
          break;
        case 'loop':
          result = await this.executeLoop(node, inputData, executionContext);
          break;
        case 'api_call':
          result = await this.executeAPICall(node, inputData);
          break;
        case 'agent':
          result = await this.executeAgent(node, inputData, executionContext);
          break;
        case 'mcp_tool':
          result = await this.executeMCPTool(node, inputData, executionContext);
          break;
        case 'parallel':
          result = await this.executeParallel(node, inputData, executionContext);
          break;
        case 'merge':
          result = await this.executeMerge(node, inputData, executionContext);
          break;
        case 'end':
          result = inputData;
          break;
        default:
          throw new Error(`未知节点类型: ${node.type}`);
      }

        // ✅ 执行成功，保存并返回结果
        nodeExecution.status = 'completed';
        nodeExecution.outputData = result;
        nodeExecution.completedAt = new Date();
        nodeExecution.durationMs = nodeExecution.completedAt - nodeExecution.startedAt;

        // 保存节点执行记录
        await this.saveNodeExecution(nodeExecution);

        // ✅ 推送节点完成事件
        wsManager.pushNodeComplete(executionId, {
          nodeId: node.id,
          nodeType: node.type,
          status: nodeExecution.status,
          inputData: nodeExecution.inputData,
          outputData: nodeExecution.outputData,
          completedAt: nodeExecution.completedAt,
          durationMs: nodeExecution.durationMs,
          retryCount: nodeExecution.retryCount
        });

        // ✅ 更新调试器变量（输出数据）
        workflowDebugger.updateVariables(executionId, {
          [`node_${node.id}_output`]: result
        });

        return result;

      } catch (error) {
        lastError = error;

        // 如果还有重试机会，继续循环
        if (attempt < maxRetries) {
          console.warn('[WorkflowEngine] 节点执行失败，将重试:', {
            nodeId: node.id,
            attempt: attempt + 1,
            maxRetries,
            error: error.message
          });
          continue;
        }

        // ✅ 所有重试都失败，检查错误处理策略
        const errorStrategy = node.config?.onError?.action || 'stop';

        if (errorStrategy === 'continue') {
          console.warn('[WorkflowEngine] 节点失败但继续执行:', {
            nodeId: node.id,
            error: error.message
          });

          // 返回错误信息作为结果，允许工作流继续
          nodeExecution.status = 'failed_continue';
          nodeExecution.errorMessage = error.message;
          nodeExecution.completedAt = new Date();
          nodeExecution.durationMs = nodeExecution.completedAt - nodeExecution.startedAt;
          await this.saveNodeExecution(nodeExecution);

          return {
            error: true,
            message: error.message,
            nodeId: node.id
          };

        } else if (errorStrategy === 'branch' && node.config?.onError?.errorBranch) {
          // 跳转到错误处理分支
          console.log('[WorkflowEngine] 节点失败，执行错误处理分支:', {
            nodeId: node.id,
            errorBranch: node.config.onError.errorBranch
          });

          nodeExecution.status = 'failed_branched';
          nodeExecution.errorMessage = error.message;
          nodeExecution.completedAt = new Date();
          nodeExecution.durationMs = nodeExecution.completedAt - nodeExecution.startedAt;
          await this.saveNodeExecution(nodeExecution);

          // 执行错误处理分支
          return await this.executeNodeChain(
            node.config.onError.errorBranch,
            { error: error.message, originalInput: inputData },
            executionContext
          );

        } else {
          // 默认策略：停止执行并抛出错误
          nodeExecution.status = 'failed';
          nodeExecution.errorMessage = error.message;
          nodeExecution.completedAt = new Date();
          nodeExecution.durationMs = nodeExecution.completedAt - nodeExecution.startedAt;

          await this.saveNodeExecution(nodeExecution);

          // ✅ 推送节点失败事件
          wsManager.pushNodeError(executionId, {
            nodeId: node.id,
            nodeType: node.type,
            errorMessage: error.message,
            retryCount: nodeExecution.retryCount
          });

          throw error;
        }
      }
    }

    // 这里不应该到达，但如果到达了说明重试全部失败
    throw lastError || new Error('节点执行失败');
  }

  /**
   * 计算重试延迟时间
   * @param {number} baseDelay - 基础延迟时间（毫秒）
   * @param {number} attempt - 当前重试次数
   * @param {string} backoff - 退避策略
   */
  calculateRetryDelay(baseDelay, attempt, backoff) {
    switch (backoff) {
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1);
      case 'linear':
        return baseDelay * attempt;
      case 'fixed':
      default:
        return baseDelay;
    }
  }

  /**
   * 睡眠指定毫秒数
   * @param {number} ms - 毫秒数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 应用数据映射
   * @param {Object} data - 输入数据
   * @param {Object} mapping - 映射配置
   */
  applyDataMapping(data, mapping) {
    if (!mapping) {
      return data;
    }

    const { mode, config } = mapping;

    try {
      switch (mode) {
        case 'extract':
          // 提取特定字段
          // config: { fields: ['field1', 'field2'] }
          if (config.fields && Array.isArray(config.fields)) {
            const result = {};
            for (const field of config.fields) {
              const value = this.getNestedValue(data, field);
              if (value !== undefined) {
                this.setNestedValue(result, field, value);
              }
            }
            return result;
          }
          return data;

        case 'rename':
          // 重命名字段
          // config: { mappings: { oldName: 'newName' } }
          if (config.mappings && typeof config.mappings === 'object') {
            const result = { ...data };
            for (const [oldKey, newKey] of Object.entries(config.mappings)) {
              if (oldKey in result) {
                result[newKey] = result[oldKey];
                delete result[oldKey];
              }
            }
            return result;
          }
          return data;

        case 'transform':
          // 字段转换
          // config: { transformations: [{ field: 'name', expression: 'value.toUpperCase()' }] }
          if (config.transformations && Array.isArray(config.transformations)) {
            const result = { ...data };
            const parser = new Parser();

            for (const transform of config.transformations) {
              const { field, expression } = transform;
              const value = this.getNestedValue(result, field);

              if (value !== undefined) {
                try {
                  const expr = parser.parse(expression);
                  const transformed = expr.evaluate({ value, data: result });
                  this.setNestedValue(result, field, transformed);
                } catch (error) {
                  console.warn('[WorkflowEngine] 字段转换失败:', {
                    field,
                    expression,
                    error: error.message
                  });
                }
              }
            }
            return result;
          }
          return data;

        case 'merge':
          // 合并默认值
          // config: { defaults: { field: 'defaultValue' } }
          if (config.defaults && typeof config.defaults === 'object') {
            return {
              ...config.defaults,
              ...data
            };
          }
          return data;

        case 'custom':
          // 自定义映射表达式
          // config: { expression: '{ result: data.field1 + data.field2 }' }
          if (config.expression) {
            const parser = new Parser();
            try {
              const expr = parser.parse(config.expression);
              return expr.evaluate({ data });
            } catch (error) {
              console.error('[WorkflowEngine] 自定义映射表达式失败:', {
                expression: config.expression,
                error: error.message
              });
              return data;
            }
          }
          return data;

        default:
          return data;
      }
    } catch (error) {
      console.error('[WorkflowEngine] 数据映射失败:', {
        mode,
        error: error.message
      });
      return data;
    }
  }

  /**
   * 获取嵌套对象的值
   * @param {Object} obj - 对象
   * @param {string} path - 路径（如 'user.name'）
   */
  getNestedValue(obj, path) {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * 设置嵌套对象的值
   * @param {Object} obj - 对象
   * @param {string} path - 路径（如 'user.name'）
   * @param {*} value - 值
   */
  setNestedValue(obj, path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    let current = obj;

    for (const part of parts) {
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    current[last] = value;
  }

  /**
   * 执行 AI 分析节点
   * @param {Object} node - 节点定义
   * @param {Object} inputData - 输入数据
   */
  async executeAIAnalysis(node, inputData) {
    const { prompt, model, temperature } = node.config;

    if (!prompt) {
      throw new Error('AI 分析节点必须配置提示词');
    }

    // 调用 AI 服务
    const { generateResponse } = require('./aiService.cjs');
    const result = await generateResponse(prompt, inputData, {
      model: model || 'gpt-4o-mini',
      temperature: temperature || 0.7
    });

    return result;
  }

  /**
   * 执行数据转换节点
   * @param {Object} node - 节点定义
   * @param {Object} inputData - 输入数据
   */
  async executeDataTransform(node, inputData) {
    const { transformType, transformConfig } = node.config;

    switch (transformType) {
      case 'json_parse':
        return JSON.parse(inputData);
      case 'json_stringify':
        return JSON.stringify(inputData);
      case 'text_extract':
        return this.extractText(inputData);
      case 'data_filter':
        return this.filterData(inputData, transformConfig);
      case 'data_map':
        return this.mapData(inputData, transformConfig);
      default:
        return inputData;
    }
  }

  /**
   * 执行条件节点
   * @param {Object} node - 节点定义
   * @param {Object} inputData - 输入数据
   */
  async executeCondition(node, inputData) {
    const { condition } = node.config;

    if (!condition) {
      throw new Error('条件节点必须配置条件表达式');
    }

    // 评估条件
    const conditionResult = this.evaluateCondition(condition, inputData);

    console.log('[WorkflowEngine] 条件节点评估结果:', {
      nodeId: node.id,
      condition,
      result: conditionResult,
      inputData
    });

    // ✅ 返回包含条件结果和原始数据的对象
    // executeNodeChain 会根据 conditionResult 选择正确的分支
    return {
      conditionResult,
      data: inputData
    };
  }

  /**
   * 执行循环节点
   * @param {Object} node - 节点定义
   * @param {Object} inputData - 输入数据
   * @param {Object} executionContext - 执行上下文
   */
  async executeLoop(node, inputData, executionContext) {
    const { loopType, loopConfig } = node.config;
    const results = [];

    switch (loopType) {
      case 'for_each':
        if (!Array.isArray(inputData)) {
          throw new Error('for_each 循环需要数组输入');
        }
        // ✅ 使用 executionContext 访问 nodeMap 和 connectionMap
        for (const item of inputData) {
          const result = await this.executeNodeChain(
            loopConfig.targetNodeId,
            item,
            executionContext
          );
          results.push(result);
        }
        break;
      case 'while':
        let condition = true;
        let currentData = inputData;
        let iterations = 0;
        const maxIterations = loopConfig.maxIterations || 1000;

        while (condition && iterations < maxIterations) {
          const result = await this.executeNodeChain(
            loopConfig.targetNodeId,
            currentData,
            executionContext
          );
          results.push(result);
          condition = this.evaluateCondition(loopConfig.condition, result);
          currentData = result;
          iterations++;
        }
        break;
      default:
        throw new Error(`未知循环类型: ${loopType}`);
    }

    return results;
  }

  /**
   * 执行 API 调用节点
   * @param {Object} node - 节点定义
   * @param {Object} inputData - 输入数据
   */
  async executeAPICall(node, inputData) {
    const { url, method, headers, body } = node.config;

    if (!url) {
      throw new Error('API 调用节点必须配置 URL');
    }

    const fetch = require('node-fetch');

    const options = {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body && method !== 'GET') {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    return result;
  }

  /**
   * 执行 Agent 节点
   * @param {Object} node - 节点定义
   * @param {Object} inputData - 输入数据
   * @param {Object} executionContext - 执行上下文
   */
  async executeAgent(node, inputData, executionContext) {
    const { agentId, taskDescription, timeout } = node.config;
    const { executionId } = executionContext;

    if (!agentId) {
      throw new Error('Agent 节点必须配置 Agent ID');
    }

    if (!taskDescription) {
      throw new Error('Agent 节点必须配置任务描述');
    }

    // 获取执行上下文以获取 userId
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error('无法找到工作流执行上下文');
    }

    const userId = execution.userId;

    // 导入 Agent Engine
    const agentEngine = require('./agentEngine.cjs');

    // 将输入数据转换为任务描述的上下文
    const taskWithContext = typeof inputData === 'string'
      ? `${taskDescription}\n\n上下文数据：${inputData}`
      : `${taskDescription}\n\n上下文数据：${JSON.stringify(inputData, null, 2)}`;

    // 创建 Agent 任务数据
    const taskData = {
      name: `工作流任务：${taskDescription}`,
      description: taskWithContext,
      timeout: timeout || 300000 // 默认5分钟
    };

    // 执行 Agent 任务
    const result = await agentEngine.executeTask(agentId, taskData, userId);

    return result;
  }

  /**
   * 执行并行节点
   * @param {Object} node - 节点定义
   * @param {Object} inputData - 输入数据
   * @param {Object} executionContext - 执行上下文
   */
  async executeParallel(node, inputData, executionContext) {
    const { connectionMap } = executionContext;

    // 获取所有后续连接
    const nextConnections = connectionMap.get(node.id) || [];

    if (nextConnections.length === 0) {
      console.warn('[WorkflowEngine] 并行节点没有后续连接');
      return inputData;
    }

    console.log('[WorkflowEngine] 开始并行执行:', {
      nodeId: node.id,
      parallelCount: nextConnections.length
    });

    // 并行执行所有后续节点
    const parallelPromises = nextConnections.map(async (connection) => {
      try {
        const result = await this.executeNodeChain(
          connection.targetNodeId,
          inputData,
          executionContext
        );
        return {
          success: true,
          targetNodeId: connection.targetNodeId,
          result
        };
      } catch (error) {
        console.error('[WorkflowEngine] 并行任务失败:', {
          targetNodeId: connection.targetNodeId,
          error: error.message
        });
        return {
          success: false,
          targetNodeId: connection.targetNodeId,
          error: error.message
        };
      }
    });

    // 等待所有任务完成
    const results = await Promise.all(parallelPromises);

    // 检查是否有失败的任务
    const failures = results.filter(r => !r.success);
    if (failures.length > 0 && node.config?.failOnError !== false) {
      throw new Error(`并行执行失败: ${failures.length}/${results.length} 个任务失败`);
    }

    console.log('[WorkflowEngine] 并行执行完成:', {
      nodeId: node.id,
      successCount: results.filter(r => r.success).length,
      failureCount: failures.length
    });

    return {
      parallelResults: results,
      inputData
    };
  }

  /**
   * 执行合并节点
   * @param {Object} node - 节点定义
   * @param {Object} inputData - 输入数据
   * @param {Object} executionContext - 执行上下文
   */
  async executeMerge(node, inputData, executionContext) {
    const { mergeStrategy = 'array' } = node.config;

    console.log('[WorkflowEngine] 执行合并节点:', {
      nodeId: node.id,
      strategy: mergeStrategy,
      inputType: typeof inputData
    });

    // 如果输入是并行节点的结果
    if (inputData && inputData.parallelResults) {
      const successResults = inputData.parallelResults
        .filter(r => r.success)
        .map(r => r.result);

      switch (mergeStrategy) {
        case 'array':
          // 返回结果数组
          return successResults;

        case 'object':
          // 合并为单个对象
          return successResults.reduce((acc, result) => {
            if (typeof result === 'object' && result !== null) {
              return { ...acc, ...result };
            }
            return acc;
          }, {});

        case 'first':
          // 返回第一个成功的结果
          return successResults[0] || null;

        case 'last':
          // 返回最后一个成功的结果
          return successResults[successResults.length - 1] || null;

        case 'concat':
          // 连接所有数组结果
          return successResults.reduce((acc, result) => {
            if (Array.isArray(result)) {
              return acc.concat(result);
            }
            return acc.concat([result]);
          }, []);

        default:
          return successResults;
      }
    }

    // 如果输入是数组，根据策略处理
    if (Array.isArray(inputData)) {
      switch (mergeStrategy) {
        case 'object':
          return inputData.reduce((acc, item) => {
            if (typeof item === 'object' && item !== null) {
              return { ...acc, ...item };
            }
            return acc;
          }, {});
        case 'first':
          return inputData[0];
        case 'last':
          return inputData[inputData.length - 1];
        default:
          return inputData;
      }
    }

    // 其他情况直接返回
    return inputData;
  }

  /**
   * 执行 MCP 工具节点
   * @param {Object} node - 节点定义
   * @param {Object} inputData - 输入数据
   * @param {Object} executionContext - 执行上下文
   */
  async executeMCPTool(node, inputData, executionContext) {
    const { mcpServiceId, toolName, parameters } = node.config;
    const { executionId } = executionContext;

    if (!mcpServiceId) {
      throw new Error('MCP 工具节点必须配置 MCP 服务 ID');
    }

    if (!toolName) {
      throw new Error('MCP 工具节点必须配置工具名称');
    }

    // 获取执行上下文以获取 userId
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error('无法找到工作流执行上下文');
    }

    const userId = execution.userId;

    // 导入 MCP Manager
    const MCPManager = require('./mcpManager.cjs');
    const mcpManager = MCPManager.getInstance();

    // 解析参数（可能是 JSON 字符串或对象）
    let toolParameters;
    if (typeof parameters === 'string') {
      try {
        toolParameters = JSON.parse(parameters);
      } catch (error) {
        throw new Error(`MCP 工具参数解析失败: ${error.message}`);
      }
    } else {
      toolParameters = parameters || {};
    }

    // 合并输入数据到参数中（inputData 可以覆盖默认参数）
    if (typeof inputData === 'object' && inputData !== null) {
      toolParameters = {
        ...toolParameters,
        ...inputData
      };
    }

    console.log('[WorkflowEngine] 执行 MCP 工具:', {
      mcpServiceId,
      toolName,
      parameters: toolParameters
    });

    // 调用 MCP 工具
    const result = await mcpManager.callTool(mcpServiceId, toolName, toolParameters, userId);

    if (!result.success) {
      throw new Error(`MCP 工具调用失败: ${result.error || '未知错误'}`);
    }

    return result.data || result;
  }

  /**
   * 评估条件表达式
   * @param {string} condition - 条件表达式
   * @param {Object} data - 数据
   */
  evaluateCondition(condition, data) {
    try {
      // ✅ 使用 expr-eval 安全解析表达式，避免 eval() 安全风险
      const parser = new Parser();

      // 准备上下文：将 data 对象展平，同时保留 data 引用
      const context = {
        data,
        ...this.flattenObject(data, '')
      };

      // 解析并评估表达式
      const expr = parser.parse(condition);
      const result = expr.evaluate(context);

      return Boolean(result);
    } catch (error) {
      console.error('[WorkflowEngine] 条件评估失败:', {
        condition,
        data,
        error: error.message
      });
      throw new Error(`条件评估失败: ${error.message}`);
    }
  }

  /**
   * 展平对象，用于表达式求值
   * @param {Object} obj - 要展平的对象
   * @param {string} prefix - 前缀
   */
  flattenObject(obj, prefix = '') {
    const flattened = {};

    if (obj === null || obj === undefined) {
      return flattened;
    }

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}_${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  /**
   * 提取文本
   * @param {Object} inputData - 输入数据
   */
  extractText(inputData) {
    if (typeof inputData === 'string') {
      return inputData;
    }
    if (typeof inputData === 'object') {
      return JSON.stringify(inputData);
    }
    return String(inputData);
  }

  /**
   * 过滤数据
   * @param {Object} inputData - 输入数据
   * @param {Object} config - 过滤配置
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
   * 映射数据
   * @param {Object} inputData - 输入数据
   * @param {Object} config - 映射配置
   */
  mapData(inputData, config) {
    const { mapping } = config;

    if (!Array.isArray(inputData)) {
      return inputData;
    }

    return inputData.map(item => {
      const mapped = {};
      for (const [key, value] of Object.entries(mapping)) {
        mapped[key] = typeof value === 'string' ? item[value] : value;
      }
      return mapped;
    });
  }

  /**
   * 构建连接映射
   * @param {Array} connections - 连接数组
   */
  buildConnectionMap(connections) {
    const map = new Map();

    for (const connection of connections) {
      const sourceId = connection.source;
      if (!map.has(sourceId)) {
        map.set(sourceId, []);
      }
      map.get(sourceId).push({
        targetNodeId: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        dataMapping: connection.dataMapping || null // ✅ 保存数据映射配置
      });
    }

    return map;
  }

  /**
   * 获取工作流
   * @param {string} workflowId - 工作流ID
   * @param {number} userId - 用户ID
   */
  async getWorkflow(workflowId, userId) {
    const WorkflowService = require('./workflowService.cjs');
    const workflowService = new WorkflowService();
    return await workflowService.getWorkflow(workflowId, userId);
  }

  /**
   * 保存执行记录
   * @param {Object} execution - 执行记录
   */
  async saveExecution(execution) {
    const { db } = require('../db/init.cjs');

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO workflow_executions (
          id, workflow_id, user_id, status, input_data, output_data, error_message,
          started_at, completed_at, duration_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          execution.id,
          execution.workflowId,
          execution.userId,
          execution.status,
          JSON.stringify(execution.inputData),
          JSON.stringify(execution.outputData),
          execution.errorMessage,
          execution.startedAt,
          execution.completedAt,
          execution.durationMs
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  /**
   * 更新执行记录
   * @param {Object} execution - 执行记录
   */
  async updateExecution(execution) {
    const { db } = require('../db/init.cjs');

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE workflow_executions SET
         status = ?, output_data = ?, error_message = ?,
         completed_at = ?, duration_ms = ?
         WHERE id = ?`,
        [
          execution.status,
          JSON.stringify(execution.outputData),
          execution.errorMessage,
          execution.completedAt,
          execution.durationMs,
          execution.id
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  /**
   * 保存节点执行记录
   * @param {Object} nodeExecution - 节点执行记录
   */
  async saveNodeExecution(nodeExecution) {
    const { db } = require('../db/init.cjs');

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO node_executions (
          id, execution_id, node_id, status, input_data, output_data, error_message,
          started_at, completed_at, duration_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nodeExecution.id,
          nodeExecution.executionId,
          nodeExecution.nodeId,
          nodeExecution.status,
          JSON.stringify(nodeExecution.inputData),
          JSON.stringify(nodeExecution.outputData),
          nodeExecution.errorMessage,
          nodeExecution.startedAt,
          nodeExecution.completedAt,
          nodeExecution.durationMs
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  /**
   * 加载节点类型
   */
  loadNodeTypes() {
    return {
      start: {
        name: '开始',
        icon: '▶️',
        inputs: [],
        outputs: ['data'],
        config: {}
      },
      ai_analysis: {
        name: 'AI 分析',
        icon: '🤖',
        inputs: ['data'],
        outputs: ['result'],
        config: {
          prompt: '',
          model: 'gpt-4o-mini',
          temperature: 0.7
        }
      },
      data_transform: {
        name: '数据转换',
        icon: '🔄',
        inputs: ['data'],
        outputs: ['transformed'],
        config: {
          transformType: 'json_parse',
          transformConfig: {}
        }
      },
      condition: {
        name: '条件判断',
        icon: '❓',
        inputs: ['data'],
        outputs: ['true', 'false'],
        config: {
          condition: '',
          truePath: '',
          falsePath: ''
        }
      },
      loop: {
        name: '循环控制',
        icon: '🔄',
        inputs: ['data'],
        outputs: ['result'],
        config: {
          loopType: 'for_each',
          loopConfig: {}
        }
      },
      api_call: {
        name: 'API 调用',
        icon: '🌐',
        inputs: ['data'],
        outputs: ['response'],
        config: {
          url: '',
          method: 'GET',
          headers: {},
          body: ''
        }
      },
      agent: {
        name: 'Agent 执行',
        icon: '🤖',
        inputs: ['data'],
        outputs: ['result'],
        config: {
          agentId: '',
          taskDescription: '',
          timeout: 300000 // 5分钟默认超时
        }
      },
      mcp_tool: {
        name: 'MCP 工具',
        icon: '⚡',
        inputs: ['data'],
        outputs: ['result'],
        config: {
          mcpServiceId: '',
          toolName: '',
          parameters: {}
        }
      },
      parallel: {
        name: '并行执行',
        icon: '🔀',
        inputs: ['data'],
        outputs: ['results'],
        config: {
          failOnError: true
        }
      },
      merge: {
        name: '合并结果',
        icon: '🔗',
        inputs: ['data'],
        outputs: ['merged'],
        config: {
          mergeStrategy: 'array'
        }
      },
      end: {
        name: '结束',
        icon: '🏁',
        inputs: ['data'],
        outputs: [],
        config: {}
      }
    };
  }
}

module.exports = WorkflowEngine;
