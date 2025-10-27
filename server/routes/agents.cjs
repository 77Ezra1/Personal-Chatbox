/**
 * 智能 Agent API 路由
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth.cjs');
const AgentEngine = require('../services/agentEngine.cjs');
const TaskDecomposer = require('../services/taskDecomposer.cjs');
const sseManager = require('../services/sseManager.cjs');

const router = express.Router();
const agentEngine = new AgentEngine();
const taskDecomposer = new TaskDecomposer();

function attachTokenFromQuery(req, res, next) {
  if (!req.headers.authorization && req.query && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}

/**
 * 获取 Agent 列表
 * GET /api/agents
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      status = 'all',
      search = '',
      page = 1,
      limit = 20
    } = req.query;

    const agents = await agentEngine.getUserAgents(userId, {
      status,
      search,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      agents,
      count: agents.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取 Agent 列表失败:', error);
    res.status(500).json({ message: '获取 Agent 列表失败', error: error.message });
  }
});

router.get('/runtime/config', authMiddleware, async (req, res) => {
  try {
    const config = await agentEngine.getRuntimeConfig(req.user.id);
    res.json({ config });
  } catch (error) {
    console.error('获取 Agent 运行时配置失败:', error);
    res.status(500).json({ message: '获取运行时配置失败', error: error.message });
  }
});

router.put('/runtime/config', authMiddleware, async (req, res) => {
  try {
    const updates = req.body || {};
    const config = await agentEngine.updateRuntimeConfig(req.user.id, updates);
    res.json({ message: '运行时配置已更新', config });
  } catch (error) {
    console.error('更新 Agent 运行时配置失败:', error);
    res.status(500).json({ message: '更新运行时配置失败', error: error.message });
  }
});

router.get('/metrics/summary', authMiddleware, async (req, res) => {
  try {
    const summary = await agentEngine.getDashboardSummary(req.user.id);
    res.json({ summary });
  } catch (error) {
    console.error('获取 Agent 仪表盘统计失败:', error);
    res.status(500).json({ message: '获取统计失败', error: error.message });
  }
});

/**
 * 获取 Agent 详情
 * GET /api/agents/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const agent = await agentEngine.getAgent(id, userId);

    res.json({ agent });
  } catch (error) {
    console.error('获取 Agent 详情失败:', error);
    if (error.message.includes('不存在')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: '获取 Agent 详情失败', error: error.message });
    }
  }
});

router.get('/:id/events', attachTokenFromQuery, authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { db } = require('../db/init.cjs');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  } else if (typeof res.flush === 'function') {
    res.flush();
  }

  sseManager.addClient(id, res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (error) {
      clearInterval(heartbeat);
    }
  }, 15000);

  res.write(`data: ${JSON.stringify({ status: 'connected', timestamp: Date.now() })}\n\n`);

  try {
    const execution = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM agent_executions WHERE agent_id = ? ORDER BY started_at DESC LIMIT 1`,
        [id],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    if (execution) {
      res.write(
        `data: ${JSON.stringify({
          executionId: execution.id,
          status: execution.status,
          progress: execution.progress,
          currentStep: execution.current_step,
          startedAt: execution.started_at,
          completedAt: execution.completed_at,
          errorMessage: execution.error_message,
          timestamp: Date.now()
        })}\n\n`
      );
    }
  } catch (error) {
    console.error('SSE 初始化失败:', error);
    res.write(`data: ${JSON.stringify({ error: 'initial_fetch_failed', message: error.message })}\n\n`);
  }

  req.on('close', () => {
    clearInterval(heartbeat);
    sseManager.removeClient(id, res);
  });
});

router.post('/tools/reload', authMiddleware, async (req, res) => {
  try {
    const result = await agentEngine.refreshTools();
    res.json({
      message: '工具库已刷新',
      refreshedAt: result.refreshedAt,
      tools: result.tools
    });
  } catch (error) {
    console.error('刷新工具失败:', error);
    res.status(500).json({ message: '刷新工具失败', error: error.message });
  }
});

/**
 * 创建 Agent
 * POST /api/agents
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const agentData = req.body;
    try {
      const fs = require('fs');
      fs.appendFileSync(
        'logs/agent-create-debug.log',
        `[${new Date().toISOString()}] ${JSON.stringify(agentData)}\n`
      );
    } catch (logError) {
      console.warn('[AgentsRoute] Failed to persist debug payload:', logError.message);
    }

    const agent = await agentEngine.createAgent(userId, agentData);

    res.json({
      message: 'Agent 创建成功',
      agent
    });
  } catch (error) {
    console.error('创建 Agent 失败:', error);
    if (error && error.stack) {
      console.error(error.stack);
    }
    res.status(500).json({ message: '创建 Agent 失败', error: error.message });
  }
});

/**
 * 更新 Agent
 * PUT /api/agents/:id
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    await agentEngine.updateAgent(id, userId, updateData);

    res.json({ message: 'Agent 更新成功' });
  } catch (error) {
    console.error('更新 Agent 失败:', error);
    if (error.message.includes('不存在') || error.message.includes('无权限')) {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: '更新 Agent 失败', error: error.message });
    }
  }
});

/**
 * 删除 Agent
 * DELETE /api/agents/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await agentEngine.deleteAgent(id, userId);

    res.json({ message: 'Agent 删除成功' });
  } catch (error) {
    console.error('删除 Agent 失败:', error);
    if (error.message.includes('不存在') || error.message.includes('无权限')) {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: '删除 Agent 失败', error: error.message });
    }
  }
});

/**
 * 执行任务
 * POST /api/agents/:id/execute
 */
router.post('/:id/execute', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { taskData } = req.body;

    if (!taskData || !taskData.title) {
      return res.status(400).json({ message: '任务数据不能为空' });
    }

    const { executionId, taskId } = await agentEngine.startTaskExecution(id, taskData, userId);

    res.status(202).json({
      message: '任务已开始执行',
      executionId,
      taskId,
      agentId: id
    });
  } catch (error) {
    console.error('执行任务失败:', error);
    res.status(500).json({ message: '执行任务失败', error: error.message });
  }
});

/**
 * ✅ 批量执行 Agent 任务
 * POST /api/agents/batch/execute
 */
router.post('/batch/execute', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: '任务列表不能为空' });
    }

    // 验证每个任务
    for (const task of tasks) {
      if (!task.agentId || !task.taskData || !task.taskData.title) {
        return res.status(400).json({
          message: '每个任务必须包含 agentId 和 taskData.title'
        });
      }
    }

    // 批量启动任务
    const results = [];
    const errors = [];

    for (const task of tasks) {
      try {
        const { executionId, taskId } = await agentEngine.startTaskExecution(
          task.agentId,
          task.taskData,
          userId
        );

        results.push({
          agentId: task.agentId,
          executionId,
          taskId,
          status: 'queued',
          taskName: task.taskData.title
        });
      } catch (error) {
        console.error(`批量执行任务失败 (Agent: ${task.agentId}):`, error);
        errors.push({
          agentId: task.agentId,
          taskName: task.taskData.title,
          error: error.message
        });
      }
    }

    res.status(202).json({
      message: `批量任务已提交: ${results.length} 个成功, ${errors.length} 个失败`,
      results,
      errors,
      totalTasks: tasks.length,
      successCount: results.length,
      errorCount: errors.length
    });
  } catch (error) {
    console.error('批量执行任务失败:', error);
    res.status(500).json({ message: '批量执行任务失败', error: error.message });
  }
});

/**
 * 获取任务列表
 * GET /api/agents/:id/tasks
 */
router.get('/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 20, status = 'all' } = req.query;

    const { db } = require('../db/init.cjs');

    let sql = 'SELECT * FROM agent_tasks WHERE agent_id = ? AND user_id = ?';
    const params = [id, userId];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('获取任务列表失败:', err);
        res.status(500).json({ message: '获取任务列表失败', error: err.message });
      } else {
        const tasks = rows.map(row => ({
          id: row.id,
          agentId: row.agent_id,
          userId: row.user_id,
          title: row.title,
          description: row.description,
          inputData: JSON.parse(row.input_data || '{}'),
          outputData: JSON.parse(row.output_data || '{}'),
          status: row.status,
          priority: row.priority,
          createdAt: row.created_at,
          startedAt: row.started_at,
          completedAt: row.completed_at,
          durationMs: row.duration_ms
        }));

        res.json({ tasks });
      }
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({ message: '获取任务列表失败', error: error.message });
  }
});

/**
 * 获取子任务列表
 * GET /api/agents/:id/tasks/:taskId/subtasks
 */
router.get('/:id/tasks/:taskId/subtasks', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const subtasks = await taskDecomposer.getSubtasks(taskId);

    res.json({ subtasks });
  } catch (error) {
    console.error('获取子任务列表失败:', error);
    res.status(500).json({ message: '获取子任务列表失败', error: error.message });
  }
});

/**
 * 获取执行进度
 * GET /api/agents/:id/progress
 */
router.get('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { db } = require('../db/init.cjs');

    db.get(
      `SELECT * FROM agent_executions
       WHERE agent_id = ? AND user_id = ?
       ORDER BY started_at DESC LIMIT 1`,
      [id, userId],
      (err, row) => {
        if (err) {
          console.error('获取执行进度失败:', err);
          res.status(500).json({ message: '获取执行进度失败', error: err.message });
        } else if (!row) {
          res.json({
            progress: 0,
            status: 'idle',
            currentStep: null,
            message: '没有正在执行的任务'
          });
        } else {
          res.json({
            progress: row.progress,
            status: row.status,
            currentStep: row.current_step,
            executionId: row.id,
            taskId: row.task_id,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            durationMs: row.duration_ms,
            errorMessage: row.error_message
          });
        }
      }
    );
  } catch (error) {
    console.error('获取执行进度失败:', error);
    res.status(500).json({ message: '获取执行进度失败', error: error.message });
  }
});

/**
 * 停止执行
 * POST /api/agents/:id/stop
 */
router.post('/:id/stop', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { db } = require('../db/init.cjs');

    // 更新执行状态为取消
    db.run(
      `UPDATE agent_executions
       SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP
       WHERE agent_id = ? AND user_id = ? AND status = 'running'`,
      [id, userId],
      function(err) {
        if (err) {
          console.error('停止执行失败:', err);
          res.status(500).json({ message: '停止执行失败', error: err.message });
        } else {
          // 更新 Agent 状态为空闲
          db.run(
            'UPDATE agents SET status = ? WHERE id = ? AND user_id = ?',
            ['active', id, userId],
            function(updateErr) {
              if (updateErr) {
                console.error('更新 Agent 状态失败:', updateErr);
              }
              res.json({ message: '执行已停止' });
            }
          );
        }
      }
    );
  } catch (error) {
    console.error('停止执行失败:', error);
    res.status(500).json({ message: '停止执行失败', error: error.message });
  }
});

/**
 * 获取执行历史
 * GET /api/agents/:id/executions
 */
router.get('/:id/executions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      status,
      start,
      end,
      order
    } = req.query;

    const history = await agentEngine.getExecutionHistory(id, userId, {
      page,
      limit,
      status,
      start,
      end,
      order
    });

    res.json(history);
  } catch (error) {
    console.error('获取执行历史失败:', error);
    res.status(500).json({ message: '获取执行历史失败', error: error.message });
  }
});

router.get('/:id/executions/export', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const format = String(req.query.format || 'csv').toLowerCase();
    const data = await agentEngine.exportExecutionHistory(id, userId, req.query);

    if (format === 'json') {
      res
        .setHeader('Content-Type', 'application/json')
        .setHeader('Content-Disposition', `attachment; filename="agent-${id}-executions.json"`)
        .send(data);
    } else {
      res
        .setHeader('Content-Type', 'text/csv; charset=utf-8')
        .setHeader('Content-Disposition', `attachment; filename="agent-${id}-executions.csv"`)
        .send(data);
    }
  } catch (error) {
    console.error('导出执行历史失败:', error);
    res.status(500).json({ message: '导出执行历史失败', error: error.message });
  }
});

router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const stats = await agentEngine.getAgentStats(id, userId, req.query);
    res.json(stats);
  } catch (error) {
    console.error('获取 Agent 统计失败:', error);
    res.status(500).json({ message: '获取统计失败', error: error.message });
  }
});

router.get('/:id/queue', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const status = agentEngine.getQueueStatus(id);
    res.json(status);
  } catch (error) {
    console.error('获取队列状态失败:', error);
    res.status(500).json({ message: '获取队列状态失败', error: error.message });
  }
});

router.post('/:id/queue/:executionId/cancel', authMiddleware, async (req, res) => {
  try {
    const { id, executionId } = req.params;
    const result = await agentEngine.cancelQueuedExecution(id, executionId, req.user.id);

    if (!result.cancelled) {
      const statusMap = {
        forbidden: 403,
        not_found: 404,
        invalid_parameters: 400
      };
      res.status(statusMap[result.reason] || 409).json({
        message: '取消任务失败',
        reason: result.reason
      });
      return;
    }

    res.json({ message: '任务已取消', phase: result.phase || 'queued' });
  } catch (error) {
    console.error('取消队列任务失败:', error);
    res.status(500).json({ message: '取消任务失败', error: error.message });
  }
});

router.post('/:id/queue/:executionId/priority', authMiddleware, async (req, res) => {
  try {
    const { id, executionId } = req.params;
    const { priority } = req.body || {};

    if (priority === undefined || priority === null) {
      return res.status(400).json({ message: '缺少 priority 参数' });
    }

    const updated = await agentEngine.updateQueuedPriority(
      id,
      executionId,
      req.user.id,
      Number(priority)
    );

    if (!updated) {
      return res.status(404).json({ message: '未找到等待中的任务' });
    }

    res.json({ message: '优先级已更新', job: updated });
  } catch (error) {
    console.error('调整队列优先级失败:', error);
    res.status(500).json({ message: '调整优先级失败', error: error.message });
  }
});

/**
 * 获取可用工具
 * GET /api/agents/tools
 */
router.get('/tools', authMiddleware, async (req, res) => {
  try {
    const { db } = require('../db/init.cjs');

    db.all(
      'SELECT * FROM agent_tools WHERE is_built_in = TRUE ORDER BY name',
      [],
      (err, rows) => {
        if (err) {
          console.error('获取工具列表失败:', err);
          res.status(500).json({ message: '获取工具列表失败', error: err.message });
        } else {
          const tools = rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            parameters: JSON.parse(row.parameters || '{}'),
            implementation: JSON.parse(row.implementation || '{}'),
            isBuiltIn: row.is_built_in,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));

          res.json({ tools });
        }
      }
    );
  } catch (error) {
    console.error('获取工具列表失败:', error);
    res.status(500).json({ message: '获取工具列表失败', error: error.message });
  }
});

/**
 * 获取 Agent 可用的工具列表（应用过滤器）
 * GET /api/agents/:id/tools
 */
router.get('/:id/tools', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 获取 Agent
    const agent = await agentEngine.getAgent(id, userId);

    // 获取可用工具（应用过滤器）
    const tools = agentEngine.getAvailableTools(agent);

    res.json({
      tools,
      filter: agent.config?.toolFilter || null,
      count: tools.length
    });
  } catch (error) {
    console.error('获取 Agent 可用工具失败:', error);
    if (error.message.includes('不存在')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: '获取可用工具失败', error: error.message });
    }
  }
});

/**
 * 获取 Agent 统计信息
 * GET /api/agents/:id/stats
 */
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { db } = require('../db/init.cjs');

    const queries = [
      'SELECT COUNT(*) as total_tasks FROM agent_tasks WHERE agent_id = ? AND user_id = ?',
      'SELECT COUNT(*) as completed_tasks FROM agent_tasks WHERE agent_id = ? AND user_id = ? AND status = "completed"',
      'SELECT COUNT(*) as failed_tasks FROM agent_tasks WHERE agent_id = ? AND user_id = ? AND status = "failed"',
      'SELECT AVG(duration_ms) as avg_duration FROM agent_tasks WHERE agent_id = ? AND user_id = ? AND status = "completed"',
      'SELECT MAX(created_at) as last_task FROM agent_tasks WHERE agent_id = ? AND user_id = ?'
    ];

    Promise.all(queries.map(query =>
      new Promise((resolve, reject) => {
        db.get(query, [id, userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      })
    )).then(results => {
      res.json({
        totalTasks: results[0].total_tasks,
        completedTasks: results[1].completed_tasks,
        failedTasks: results[2].failed_tasks,
        avgDuration: results[3].avg_duration || 0,
        lastTask: results[4].last_task
      });
    }).catch(reject => {
      console.error('获取统计信息失败:', reject);
      res.status(500).json({ message: '获取统计信息失败', error: reject.message });
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({ message: '获取统计信息失败', error: error.message });
  }
});

module.exports = router;
