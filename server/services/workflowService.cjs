/**
 * 工作流服务
 * 处理工作流管理、创建、执行和统计
 */

const { v4: uuidv4 } = require('uuid');

class WorkflowService {
  constructor() {
    this.nodeTypes = this.loadNodeTypes();
  }

  /**
   * 获取用户工作流列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   */
  async getUserWorkflows(userId, options = {}) {
    const { status, search, page = 1, limit = 20 } = options;

    let sql = `
      SELECT w.*,
             COUNT(we.id) as execution_count,
             MAX(we.started_at) as last_executed
      FROM workflows w
      LEFT JOIN workflow_executions we ON w.id = we.workflow_id
      WHERE w.user_id = ?
    `;

    const params = [userId];

    if (status && status !== 'all') {
      sql += ' AND w.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (w.name LIKE ? OR w.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' GROUP BY w.id ORDER BY w.updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    return new Promise((resolve, reject) => {
      const { db } = require('../db/init.cjs');
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => this.formatWorkflow(row)));
        }
      });
    });
  }

  /**
   * 获取工作流详情
   * @param {string} workflowId - 工作流ID
   * @param {number} userId - 用户ID
   */
  async getWorkflow(workflowId, userId) {
    return new Promise((resolve, reject) => {
      const { db } = require('../db/init.cjs');

      db.get(
        'SELECT * FROM workflows WHERE id = ? AND user_id = ?',
        [workflowId, userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            reject(new Error('工作流不存在或无权限'));
          } else {
            resolve(this.formatWorkflow(row));
          }
        }
      );
    });
  }

  /**
   * 创建工作流
   * @param {number} userId - 用户ID
   * @param {Object} workflowData - 工作流数据
   */
  async createWorkflow(userId, workflowData) {
    const id = uuidv4();
    const {
      name,
      description = '',
      definition,
      status = 'draft',
      isPublic = false,
      tags = []
    } = workflowData;

    if (!name || !definition) {
      throw new Error('工作流名称和定义不能为空');
    }

    const { db } = require('../db/init.cjs');

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO workflows (
          id, user_id, name, description, definition,
          status, is_public, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, userId, name, description, JSON.stringify(definition),
          status, isPublic, JSON.stringify(tags)
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              name,
              description,
              definition,
              status,
              isPublic,
              tags,
              version: 1,
              executionCount: 0,
              lastExecuted: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
      );
    });
  }

  /**
   * 更新工作流
   * @param {string} workflowId - 工作流ID
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 更新数据
   */
  async updateWorkflow(workflowId, userId, updateData) {
    const {
      name,
      description,
      definition,
      status,
      isPublic,
      tags
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
    if (definition !== undefined) {
      updateFields.push('definition = ?');
      params.push(JSON.stringify(definition));
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }
    if (isPublic !== undefined) {
      updateFields.push('is_public = ?');
      params.push(isPublic);
    }
    if (tags !== undefined) {
      updateFields.push('tags = ?');
      params.push(JSON.stringify(tags));
    }

    if (updateFields.length === 0) {
      throw new Error('没有提供更新字段');
    }

    updateFields.push('version = version + 1');
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(workflowId, userId);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE workflows SET ${updateFields.join(', ')}
         WHERE id = ? AND user_id = ?`,
        params,
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('工作流不存在或无权限修改'));
          } else {
            resolve({ success: true, changes: this.changes });
          }
        }
      );
    });
  }

  /**
   * 删除工作流
   * @param {string} workflowId - 工作流ID
   * @param {number} userId - 用户ID
   */
  async deleteWorkflow(workflowId, userId) {
    const { db } = require('../db/init.cjs');

    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM workflows WHERE id = ? AND user_id = ?',
        [workflowId, userId],
        function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('工作流不存在或无权限删除'));
          } else {
            resolve({ success: true, changes: this.changes });
          }
        }
      );
    });
  }

  /**
   * 获取工作流执行日志
   * @param {string} workflowId - 工作流ID
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   */
  async getWorkflowLogs(workflowId, userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    return new Promise((resolve, reject) => {
      const { db } = require('../db/init.cjs');

      db.all(
        `SELECT we.*, w.name as workflow_name
         FROM workflow_executions we
         JOIN workflows w ON we.workflow_id = w.id
         WHERE we.workflow_id = ? AND we.user_id = ?
         ORDER BY we.started_at DESC
         LIMIT ? OFFSET ?`,
        [workflowId, userId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => this.formatExecution(row)));
          }
        }
      );
    });
  }

  /**
   * 获取工作流统计信息
   * @param {string} workflowId - 工作流ID
   * @param {number} userId - 用户ID
   */
  async getWorkflowStats(workflowId, userId) {
    return new Promise((resolve, reject) => {
      const { db } = require('../db/init.cjs');

      const queries = [
        'SELECT COUNT(*) as total_executions FROM workflow_executions WHERE workflow_id = ? AND user_id = ?',
        'SELECT COUNT(*) as successful_executions FROM workflow_executions WHERE workflow_id = ? AND user_id = ? AND status = "completed"',
        'SELECT COUNT(*) as failed_executions FROM workflow_executions WHERE workflow_id = ? AND user_id = ? AND status = "failed"',
        'SELECT AVG(duration_ms) as avg_duration FROM workflow_executions WHERE workflow_id = ? AND user_id = ? AND status = "completed"',
        'SELECT MAX(started_at) as last_execution FROM workflow_executions WHERE workflow_id = ? AND user_id = ?'
      ];

      Promise.all(queries.map(query =>
        new Promise((resolveQuery, rejectQuery) => {
          db.get(query, [workflowId, userId], (err, row) => {
            if (err) rejectQuery(err);
            else resolveQuery(row);
          });
        })
      )).then(results => {
        resolve({
          totalExecutions: results[0].total_executions,
          successfulExecutions: results[1].successful_executions,
          failedExecutions: results[2].failed_executions,
          avgDuration: results[3].avg_duration || 0,
          lastExecution: results[4].last_execution
        });
      }).catch(reject);
    });
  }

  /**
   * 获取工作流模板
   * @param {Object} options - 查询选项
   */
  async getWorkflowTemplates(options = {}) {
    const { category, search, limit = 20 } = options;

    let sql = 'SELECT * FROM workflow_templates WHERE is_public = true';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY usage_count DESC, rating DESC LIMIT ?';
    params.push(parseInt(limit));

    return new Promise((resolve, reject) => {
      const { db } = require('../db/init.cjs');
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => this.formatTemplate(row)));
        }
      });
    });
  }

  /**
   * 使用工作流模板
   * @param {string} templateId - 模板ID
   * @param {number} userId - 用户ID
   * @param {string} name - 新工作流名称
   */
  async useTemplate(templateId, userId, name) {
    // 获取模板
    const template = await new Promise((resolve, reject) => {
      const { db } = require('../db/init.cjs');
      db.get(
        'SELECT * FROM workflow_templates WHERE id = ? AND is_public = true',
        [templateId],
        (err, row) => {
          if (err) reject(err);
          else if (!row) reject(new Error('模板不存在'));
          else resolve(row);
        }
      );
    });

    // 创建工作流
    const workflowData = {
      name: name || `${template.name} (副本)`,
      description: template.description,
      definition: JSON.parse(template.definition),
      status: 'draft',
      isPublic: false,
      tags: JSON.parse(template.tags || '[]')
    };

    const workflow = await this.createWorkflow(userId, workflowData);

    // 更新模板使用次数
    await new Promise((resolve, reject) => {
      const { db } = require('../db/init.cjs');
      db.run(
        'UPDATE workflow_templates SET usage_count = usage_count + 1 WHERE id = ?',
        [templateId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    return workflow;
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

  /**
   * 格式化工作流数据
   * @param {Object} row - 数据库行数据
   */
  formatWorkflow(row) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      definition: JSON.parse(row.definition),
      version: row.version,
      status: row.status,
      isPublic: row.is_public,
      tags: JSON.parse(row.tags || '[]'),
      executionCount: row.execution_count || 0,
      lastExecuted: row.last_executed,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * 格式化执行记录数据
   * @param {Object} row - 数据库行数据
   */
  formatExecution(row) {
    return {
      id: row.id,
      workflowId: row.workflow_id,
      workflowName: row.workflow_name,
      status: row.status,
      inputData: JSON.parse(row.input_data || '{}'),
      outputData: JSON.parse(row.output_data || '{}'),
      errorMessage: row.error_message,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      durationMs: row.duration_ms
    };
  }

  /**
   * 格式化模板数据
   * @param {Object} row - 数据库行数据
   */
  formatTemplate(row) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      definition: JSON.parse(row.definition),
      category: row.category,
      tags: JSON.parse(row.tags || '[]'),
      usageCount: row.usage_count,
      rating: row.rating,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * 验证工作流定义
   * @param {Object} definition - 工作流定义
   */
  validateWorkflowDefinition(definition) {
    const errors = [];

    if (!definition.nodes || !Array.isArray(definition.nodes)) {
      errors.push('工作流必须包含节点数组');
      return { valid: false, errors };
    }

    if (definition.nodes.length === 0) {
      errors.push('工作流至少需要一个节点');
    }

    // 检查是否有开始节点
    const startNodes = definition.nodes.filter(node => node.type === 'start');
    if (startNodes.length === 0) {
      errors.push('工作流必须包含开始节点');
    }

    // 检查是否有结束节点
    const endNodes = definition.nodes.filter(node => node.type === 'end');
    if (endNodes.length === 0) {
      errors.push('工作流必须包含结束节点');
    }

    // 检查节点类型
    for (const node of definition.nodes) {
      if (!this.nodeTypes[node.type]) {
        errors.push(`未知节点类型: ${node.type}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = WorkflowService;
