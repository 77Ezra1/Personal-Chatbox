/**
 * 工作流执行引擎
 * 处理工作流的执行、节点管理和数据流转
 */

const { v4: uuidv4 } = require('uuid');

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
   */
  async executeWorkflow(workflowId, inputData, userId) {
    const executionId = uuidv4();

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
        nodes: new Map()
      };

      this.executions.set(executionId, execution);

      // 保存执行记录到数据库
      await this.saveExecution(execution);

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

        return result;
      } catch (error) {
        execution.status = 'failed';
        execution.errorMessage = error.message;
        execution.completedAt = new Date();
        execution.durationMs = execution.completedAt - execution.startedAt;

        await this.updateExecution(execution);
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

    // 找到开始节点
    const startNodes = nodes.filter(node => node.type === 'start');
    if (startNodes.length === 0) {
      throw new Error('工作流必须包含开始节点');
    }

    // 执行开始节点
    const startNode = startNodes[0];
    const startResult = await this.executeNode(startNode, inputData, executionId);

    // 执行后续节点
    const result = await this.executeNodeChain(
      startNode.id,
      startResult,
      nodeMap,
      connectionMap,
      executionId
    );

    return result;
  }

  /**
   * 执行节点链
   * @param {string} nodeId - 节点ID
   * @param {Object} inputData - 输入数据
   * @param {Map} nodeMap - 节点映射
   * @param {Map} connectionMap - 连接映射
   * @param {string} executionId - 执行ID
   */
  async executeNodeChain(nodeId, inputData, nodeMap, connectionMap, executionId) {
    const node = nodeMap.get(nodeId);
    if (!node) return inputData;

    // 执行当前节点
    const result = await this.executeNode(node, inputData, executionId);

    // 获取后续节点
    const nextConnections = connectionMap.get(nodeId) || [];

    if (nextConnections.length === 0) {
      return result; // 结束节点
    }

    // 执行后续节点
    const nextResults = [];
    for (const connection of nextConnections) {
      const nextResult = await this.executeNodeChain(
        connection.targetNodeId,
        result,
        nodeMap,
        connectionMap,
        executionId
      );
      nextResults.push(nextResult);
    }

    return nextResults;
  }

  /**
   * 执行单个节点
   * @param {Object} node - 节点定义
   * @param {Object} inputData - 输入数据
   * @param {string} executionId - 执行ID
   */
  async executeNode(node, inputData, executionId) {
    const nodeExecution = {
      id: uuidv4(),
      executionId,
      nodeId: node.id,
      status: 'running',
      inputData,
      outputData: null,
      startedAt: new Date()
    };

    try {
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
          result = await this.executeLoop(node, inputData, executionId);
          break;
        case 'api_call':
          result = await this.executeAPICall(node, inputData);
          break;
        case 'end':
          result = inputData;
          break;
        default:
          throw new Error(`未知节点类型: ${node.type}`);
      }

      nodeExecution.status = 'completed';
      nodeExecution.outputData = result;
      nodeExecution.completedAt = new Date();
      nodeExecution.durationMs = nodeExecution.completedAt - nodeExecution.startedAt;

      // 保存节点执行记录
      await this.saveNodeExecution(nodeExecution);

      return result;
    } catch (error) {
      nodeExecution.status = 'failed';
      nodeExecution.errorMessage = error.message;
      nodeExecution.completedAt = new Date();
      nodeExecution.durationMs = nodeExecution.completedAt - nodeExecution.startedAt;

      await this.saveNodeExecution(nodeExecution);
      throw error;
    }
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
    const { condition, truePath, falsePath } = node.config;

    if (!condition) {
      throw new Error('条件节点必须配置条件表达式');
    }

    // 评估条件
    const result = this.evaluateCondition(condition, inputData);

    return {
      condition: result,
      path: result ? truePath : falsePath,
      data: inputData
    };
  }

  /**
   * 执行循环节点
   * @param {Object} node - 节点定义
   * @param {Object} inputData - 输入数据
   * @param {string} executionId - 执行ID
   */
  async executeLoop(node, inputData, executionId) {
    const { loopType, loopConfig } = node.config;
    const results = [];

    switch (loopType) {
      case 'for_each':
        if (!Array.isArray(inputData)) {
          throw new Error('for_each 循环需要数组输入');
        }
        for (const item of inputData) {
          const result = await this.executeNodeChain(
            loopConfig.targetNodeId,
            item,
            nodeMap,
            connectionMap,
            executionId
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
            nodeMap,
            connectionMap,
            executionId
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
   * 评估条件表达式
   * @param {string} condition - 条件表达式
   * @param {Object} data - 数据
   */
  evaluateCondition(condition, data) {
    try {
      // 简单的条件评估，实际项目中应该使用更安全的表达式解析器
      const context = { data, ...data };
      return eval(condition);
    } catch (error) {
      throw new Error(`条件评估失败: ${error.message}`);
    }
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
        targetHandle: connection.targetHandle
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
