/**
 * AI 工作流编排 API 路由
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth.cjs');
const WorkflowService = require('../services/workflowService.cjs');
const WorkflowEngine = require('../services/workflowEngine.cjs');

const router = express.Router();
const workflowService = new WorkflowService();
const workflowEngine = new WorkflowEngine();

/**
 * 获取工作流列表
 * GET /api/workflows
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

    const workflows = await workflowService.getUserWorkflows(userId, {
      status,
      search,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      workflows,
      count: workflows.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取工作流列表失败:', error);
    res.status(500).json({ message: '获取工作流列表失败', error: error.message });
  }
});

/**
 * 获取工作流详情
 * GET /api/workflows/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const workflow = await workflowService.getWorkflow(id, userId);

    res.json({ workflow });
  } catch (error) {
    console.error('获取工作流详情失败:', error);
    if (error.message.includes('不存在')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: '获取工作流详情失败', error: error.message });
    }
  }
});

/**
 * 创建工作流
 * POST /api/workflows
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const workflowData = req.body;

    // 验证工作流定义
    if (workflowData.definition) {
      const validation = workflowService.validateWorkflowDefinition(workflowData.definition);
      if (!validation.valid) {
        return res.status(400).json({
          message: '工作流定义验证失败',
          errors: validation.errors
        });
      }
    }

    const workflow = await workflowService.createWorkflow(userId, workflowData);

    res.json({
      message: '工作流创建成功',
      workflow
    });
  } catch (error) {
    console.error('创建工作流失败:', error);
    res.status(500).json({ message: '创建工作流失败', error: error.message });
  }
});

/**
 * 更新工作流
 * PUT /api/workflows/:id
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // 验证工作流定义
    if (updateData.definition) {
      const validation = workflowService.validateWorkflowDefinition(updateData.definition);
      if (!validation.valid) {
        return res.status(400).json({
          message: '工作流定义验证失败',
          errors: validation.errors
        });
      }
    }

    await workflowService.updateWorkflow(id, userId, updateData);

    res.json({ message: '工作流更新成功' });
  } catch (error) {
    console.error('更新工作流失败:', error);
    if (error.message.includes('不存在') || error.message.includes('无权限')) {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: '更新工作流失败', error: error.message });
    }
  }
});

/**
 * 删除工作流
 * DELETE /api/workflows/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await workflowService.deleteWorkflow(id, userId);

    res.json({ message: '工作流删除成功' });
  } catch (error) {
    console.error('删除工作流失败:', error);
    if (error.message.includes('不存在') || error.message.includes('无权限')) {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: '删除工作流失败', error: error.message });
    }
  }
});

/**
 * 执行工作流
 * POST /api/workflows/:id/run
 */
router.post('/:id/run', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { inputData = {} } = req.body;

    const result = await workflowEngine.executeWorkflow(id, inputData, userId);

    res.json({
      message: '工作流执行成功',
      result
    });
  } catch (error) {
    console.error('执行工作流失败:', error);
    res.status(500).json({ message: '执行工作流失败', error: error.message });
  }
});

/**
 * 获取工作流执行日志
 * GET /api/workflows/:id/logs
 */
router.get('/:id/logs', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const logs = await workflowService.getWorkflowLogs(id, userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({ logs });
  } catch (error) {
    console.error('获取工作流日志失败:', error);
    res.status(500).json({ message: '获取工作流日志失败', error: error.message });
  }
});

/**
 * 获取工作流统计信息
 * GET /api/workflows/:id/stats
 */
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const stats = await workflowService.getWorkflowStats(id, userId);

    res.json({ stats });
  } catch (error) {
    console.error('获取工作流统计失败:', error);
    res.status(500).json({ message: '获取工作流统计失败', error: error.message });
  }
});

/**
 * 获取工作流模板
 * GET /api/workflows/templates
 */
router.get('/templates', authMiddleware, async (req, res) => {
  try {
    const { category = 'all', search = '', limit = 20 } = req.query;

    const templates = await workflowService.getWorkflowTemplates({
      category,
      search,
      limit: parseInt(limit)
    });

    res.json({ templates });
  } catch (error) {
    console.error('获取工作流模板失败:', error);
    res.status(500).json({ message: '获取工作流模板失败', error: error.message });
  }
});

/**
 * 使用工作流模板
 * POST /api/workflows/templates/:id/use
 */
router.post('/templates/:id/use', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name } = req.body;

    const workflow = await workflowService.useTemplate(id, userId, name);

    res.json({
      message: '工作流模板使用成功',
      workflow
    });
  } catch (error) {
    console.error('使用工作流模板失败:', error);
    res.status(500).json({ message: '使用工作流模板失败', error: error.message });
  }
});

/**
 * 复制工作流
 * POST /api/workflows/:id/copy
 */
router.post('/:id/copy', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name } = req.body;

    // 获取原工作流
    const originalWorkflow = await workflowService.getWorkflow(id, userId);

    // 创建新工作流
    const workflowData = {
      name: name || `${originalWorkflow.name} (副本)`,
      description: originalWorkflow.description,
      definition: originalWorkflow.definition,
      status: 'draft',
      isPublic: false,
      tags: originalWorkflow.tags
    };

    const workflow = await workflowService.createWorkflow(userId, workflowData);

    res.json({
      message: '工作流复制成功',
      workflow
    });
  } catch (error) {
    console.error('复制工作流失败:', error);
    res.status(500).json({ message: '复制工作流失败', error: error.message });
  }
});

/**
 * 导入工作流
 * POST /api/workflows/import
 */
router.post('/import', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { workflows } = req.body;

    if (!Array.isArray(workflows) || workflows.length === 0) {
      return res.status(400).json({ message: '请提供有效的工作流数据' });
    }

    const importedWorkflows = [];
    const errors = [];

    for (const workflowData of workflows) {
      try {
        // 验证工作流定义
        if (workflowData.definition) {
          const validation = workflowService.validateWorkflowDefinition(workflowData.definition);
          if (!validation.valid) {
            errors.push(`${workflowData.name || '未知工作流'}: ${validation.errors.join(', ')}`);
            continue;
          }
        }

        const workflow = await workflowService.createWorkflow(userId, workflowData);
        importedWorkflows.push(workflow);
      } catch (error) {
        errors.push(`${workflowData.name || '未知工作流'}: ${error.message}`);
      }
    }

    res.json({
      message: `成功导入 ${importedWorkflows.length} 个工作流`,
      workflows: importedWorkflows,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('导入工作流失败:', error);
    res.status(500).json({ message: '导入工作流失败', error: error.message });
  }
});

/**
 * 导出工作流
 * GET /api/workflows/export
 */
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'all' } = req.query;

    const workflows = await workflowService.getUserWorkflows(userId, {
      status,
      limit: 1000
    });

    // 移除敏感信息
    const exportData = workflows.map(workflow => ({
      name: workflow.name,
      description: workflow.description,
      definition: workflow.definition,
      status: workflow.status,
      tags: workflow.tags
    }));

    res.json({
      workflows: exportData,
      count: exportData.length,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('导出工作流失败:', error);
    res.status(500).json({ message: '导出工作流失败', error: error.message });
  }
});

/**
 * 获取节点类型
 * GET /api/workflows/node-types
 */
router.get('/node-types', authMiddleware, async (req, res) => {
  try {
    const nodeTypes = workflowService.loadNodeTypes();

    res.json({ nodeTypes });
  } catch (error) {
    console.error('获取节点类型失败:', error);
    res.status(500).json({ message: '获取节点类型失败', error: error.message });
  }
});

module.exports = router;
