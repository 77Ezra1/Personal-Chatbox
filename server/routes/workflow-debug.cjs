/**
 * 工作流调试 API 路由
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth.cjs');
const { getInstance: getDebugger } = require('../services/workflowDebugger.cjs');

const router = express.Router();

/**
 * 设置断点
 * POST /api/workflows/:workflowId/debug/breakpoints
 */
router.post('/:workflowId/debug/breakpoints', authMiddleware, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { nodeId } = req.body;

    if (!nodeId) {
      return res.status(400).json({ message: '缺少节点ID' });
    }

    const workflowDebugger = getDebugger();
    workflowDebugger.setBreakpoint(workflowId, nodeId);

    res.json({
      message: '断点已设置',
      workflowId,
      nodeId
    });
  } catch (error) {
    console.error('设置断点失败:', error);
    res.status(500).json({ message: '设置断点失败', error: error.message });
  }
});

/**
 * 移除断点
 * DELETE /api/workflows/:workflowId/debug/breakpoints/:nodeId
 */
router.delete('/:workflowId/debug/breakpoints/:nodeId', authMiddleware, async (req, res) => {
  try {
    const { workflowId, nodeId } = req.params;

    const workflowDebugger = getDebugger();
    const removed = workflowDebugger.removeBreakpoint(workflowId, nodeId);

    if (removed) {
      res.json({
        message: '断点已移除',
        workflowId,
        nodeId
      });
    } else {
      res.status(404).json({ message: '断点不存在' });
    }
  } catch (error) {
    console.error('移除断点失败:', error);
    res.status(500).json({ message: '移除断点失败', error: error.message });
  }
});

/**
 * 获取所有断点
 * GET /api/workflows/:workflowId/debug/breakpoints
 */
router.get('/:workflowId/debug/breakpoints', authMiddleware, async (req, res) => {
  try {
    const { workflowId } = req.params;

    const workflowDebugger = getDebugger();
    const breakpoints = workflowDebugger.getBreakpoints(workflowId);

    res.json({
      workflowId,
      breakpoints
    });
  } catch (error) {
    console.error('获取断点失败:', error);
    res.status(500).json({ message: '获取断点失败', error: error.message });
  }
});

/**
 * 清除所有断点
 * DELETE /api/workflows/:workflowId/debug/breakpoints
 */
router.delete('/:workflowId/debug/breakpoints', authMiddleware, async (req, res) => {
  try {
    const { workflowId } = req.params;

    const workflowDebugger = getDebugger();
    workflowDebugger.clearBreakpoints(workflowId);

    res.json({
      message: '所有断点已清除',
      workflowId
    });
  } catch (error) {
    console.error('清除断点失败:', error);
    res.status(500).json({ message: '清除断点失败', error: error.message });
  }
});

/**
 * 继续执行
 * POST /api/workflows/debug/:executionId/continue
 */
router.post('/debug/:executionId/continue', authMiddleware, async (req, res) => {
  try {
    const { executionId } = req.params;

    const workflowDebugger = getDebugger();
    const success = workflowDebugger.continue(executionId);

    if (success) {
      res.json({
        message: '继续执行',
        executionId
      });
    } else {
      res.status(404).json({ message: '调试会话不存在或未暂停' });
    }
  } catch (error) {
    console.error('继续执行失败:', error);
    res.status(500).json({ message: '继续执行失败', error: error.message });
  }
});

/**
 * 单步执行
 * POST /api/workflows/debug/:executionId/step-over
 */
router.post('/debug/:executionId/step-over', authMiddleware, async (req, res) => {
  try {
    const { executionId } = req.params;

    const workflowDebugger = getDebugger();
    const success = workflowDebugger.stepOver(executionId);

    if (success) {
      res.json({
        message: '单步执行',
        executionId
      });
    } else {
      res.status(404).json({ message: '调试会话不存在' });
    }
  } catch (error) {
    console.error('单步执行失败:', error);
    res.status(500).json({ message: '单步执行失败', error: error.message });
  }
});

/**
 * 停止调试
 * POST /api/workflows/debug/:executionId/stop
 */
router.post('/debug/:executionId/stop', authMiddleware, async (req, res) => {
  try {
    const { executionId } = req.params;

    const workflowDebugger = getDebugger();
    const success = workflowDebugger.stop(executionId);

    if (success) {
      res.json({
        message: '调试已停止',
        executionId
      });
    } else {
      res.status(404).json({ message: '调试会话不存在' });
    }
  } catch (error) {
    console.error('停止调试失败:', error);
    res.status(500).json({ message: '停止调试失败', error: error.message });
  }
});

/**
 * 获取调试会话状态
 * GET /api/workflows/debug/:executionId/status
 */
router.get('/debug/:executionId/status', authMiddleware, async (req, res) => {
  try {
    const { executionId } = req.params;

    const workflowDebugger = getDebugger();
    const session = workflowDebugger.getSession(executionId);

    if (session) {
      res.json({
        executionId,
        mode: session.mode,
        isPaused: session.isPaused,
        currentNode: session.currentNode,
        pausedAt: session.pausedAt,
        stepMode: session.stepMode,
        variables: Object.fromEntries(session.variables),
        callStack: session.callStack
      });
    } else {
      res.status(404).json({ message: '调试会话不存在' });
    }
  } catch (error) {
    console.error('获取调试状态失败:', error);
    res.status(500).json({ message: '获取调试状态失败', error: error.message });
  }
});

/**
 * 获取所有调试会话
 * GET /api/workflows/debug/sessions
 */
router.get('/debug/sessions', authMiddleware, async (req, res) => {
  try {
    const workflowDebugger = getDebugger();
    const sessions = workflowDebugger.getAllSessions();

    res.json({
      sessions
    });
  } catch (error) {
    console.error('获取调试会话失败:', error);
    res.status(500).json({ message: '获取调试会话失败', error: error.message });
  }
});

module.exports = router;
