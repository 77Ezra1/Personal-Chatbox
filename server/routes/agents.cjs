/**
 * 智能 Agent API 路由
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth.cjs');
const AgentEngine = require('../services/agentEngine.cjs');
const TaskDecomposer = require('../services/taskDecomposer.cjs');

const router = express.Router();
const agentEngine = new AgentEngine();
const taskDecomposer = new TaskDecomposer();

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

/**
 * 创建 Agent
 * POST /api/agents
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const agentData = req.body;

    const agent = await agentEngine.createAgent(userId, agentData);

    res.json({
      message: 'Agent 创建成功',
      agent
    });
  } catch (error) {
    console.error('创建 Agent 失败:', error);
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

    const result = await agentEngine.executeTask(id, taskData, userId);

    res.json({
      message: '任务执行成功',
      result
    });
  } catch (error) {
    console.error('执行任务失败:', error);
    res.status(500).json({ message: '执行任务失败', error: error.message });
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
    const { page = 1, limit = 20 } = req.query;

    const { db } = require('../db/init.cjs');

    db.all(
      `SELECT ae.*, at.title as task_title
       FROM agent_executions ae
       JOIN agent_tasks at ON ae.task_id = at.id
       WHERE ae.agent_id = ? AND ae.user_id = ?
       ORDER BY ae.started_at DESC
       LIMIT ? OFFSET ?`,
      [id, userId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)],
      (err, rows) => {
        if (err) {
          console.error('获取执行历史失败:', err);
          res.status(500).json({ message: '获取执行历史失败', error: err.message });
        } else {
          const executions = rows.map(row => ({
            id: row.id,
            agentId: row.agent_id,
            taskId: row.task_id,
            taskTitle: row.task_title,
            status: row.status,
            progress: row.progress,
            currentStep: row.current_step,
            errorMessage: row.error_message,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            durationMs: row.duration_ms
          }));

          res.json({ executions });
        }
      }
    );
  } catch (error) {
    console.error('获取执行历史失败:', error);
    res.status(500).json({ message: '获取执行历史失败', error: error.message });
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
