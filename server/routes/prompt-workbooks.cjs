const express = require('express');
const router = express.Router();
const { db } = require('../db/init.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');
const logger = require('../utils/logger.cjs');

// Get all workbooks for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get system workbooks + user's workbooks
    const workbooks = db.prepare(`
      SELECT * FROM prompt_workbooks
      WHERE is_system = 1 OR user_id = ?
      ORDER BY is_system DESC, created_at DESC
    `).all(userId);

    // Parse JSON fields
    const parsed = workbooks.map(wb => ({
      ...wb,
      is_system: Boolean(wb.is_system),
      field_schema: wb.field_schema ? JSON.parse(wb.field_schema) : null,
      view_config: wb.view_config ? JSON.parse(wb.view_config) : null
    }));

    res.json({
      success: true,
      data: parsed
    });
  } catch (error) {
    logger.error('Failed to get workbooks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workbooks'
    });
  }
});

// Get single workbook
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { id } = req.params;

    const workbook = db.prepare(`
      SELECT * FROM prompt_workbooks
      WHERE id = ? AND (is_system = 1 OR user_id = ?)
    `).get(id, userId);

    if (!workbook) {
      return res.status(404).json({
        success: false,
        error: 'Workbook not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...workbook,
        is_system: Boolean(workbook.is_system),
        field_schema: workbook.field_schema ? JSON.parse(workbook.field_schema) : null,
        view_config: workbook.view_config ? JSON.parse(workbook.view_config) : null
      }
    });
  } catch (error) {
    logger.error('Failed to get workbook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workbook'
    });
  }
});

// Create new workbook
router.post('/', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { name, description, icon, field_schema, view_config } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Workbook name is required'
      });
    }

    // Default field schema if not provided
    const defaultFieldSchema = {
      fields: [
        { name: 'id', displayName: 'ID', type: 'number', required: true, editable: false },
        { name: 'name', displayName: '名称', type: 'text', required: true, editable: true },
        { name: 'content', displayName: '内容', type: 'longtext', required: true, editable: true },
        { name: 'tags', displayName: '标签', type: 'tags', required: false, editable: true },
        { name: 'description', displayName: '描述', type: 'text', required: false, editable: true },
        { name: 'created_at', displayName: '创建时间', type: 'datetime', required: false, editable: false },
        { name: 'updated_at', displayName: '更新时间', type: 'datetime', required: false, editable: false }
      ]
    };

    const finalFieldSchema = field_schema || defaultFieldSchema;

    const result = db.prepare(`
      INSERT INTO prompt_workbooks (user_id, name, description, icon, field_schema, view_config)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      name,
      description || null,
      icon || '📊',
      JSON.stringify(finalFieldSchema),
      view_config ? JSON.stringify(view_config) : null
    );

    const newWorkbook = db.prepare('SELECT * FROM prompt_workbooks WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      data: {
        ...newWorkbook,
        is_system: Boolean(newWorkbook.is_system),
        field_schema: newWorkbook.field_schema ? JSON.parse(newWorkbook.field_schema) : null,
        view_config: newWorkbook.view_config ? JSON.parse(newWorkbook.view_config) : null
      }
    });
  } catch (error) {
    logger.error('Failed to create workbook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workbook'
    });
  }
});

// Update workbook
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, description, icon, field_schema, view_config } = req.body;

    // Check ownership (cannot modify system workbooks)
    const workbook = db.prepare(`
      SELECT * FROM prompt_workbooks WHERE id = ? AND user_id = ?
    `).get(id, userId);

    if (!workbook) {
      return res.status(404).json({
        success: false,
        error: 'Workbook not found or permission denied'
      });
    }

    db.prepare(`
      UPDATE prompt_workbooks
      SET name = ?, description = ?, icon = ?, field_schema = ?, view_config = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name || workbook.name,
      description !== undefined ? description : workbook.description,
      icon || workbook.icon,
      field_schema ? JSON.stringify(field_schema) : workbook.field_schema,
      view_config ? JSON.stringify(view_config) : workbook.view_config,
      id
    );

    const updated = db.prepare('SELECT * FROM prompt_workbooks WHERE id = ?').get(id);

    res.json({
      success: true,
      data: {
        ...updated,
        is_system: Boolean(updated.is_system),
        field_schema: updated.field_schema ? JSON.parse(updated.field_schema) : null,
        view_config: updated.view_config ? JSON.parse(updated.view_config) : null
      }
    });
  } catch (error) {
    logger.error('Failed to update workbook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workbook'
    });
  }
});

// Delete workbook
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { id } = req.params;

    // Check ownership (cannot delete system workbooks)
    const workbook = db.prepare(`
      SELECT * FROM prompt_workbooks WHERE id = ? AND user_id = ?
    `).get(id, userId);

    if (!workbook) {
      return res.status(404).json({
        success: false,
        error: 'Workbook not found or permission denied'
      });
    }

    // Delete workbook (cascade will delete all templates)
    db.prepare('DELETE FROM prompt_workbooks WHERE id = ?').run(id);

    res.json({
      success: true,
      message: 'Workbook deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete workbook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workbook'
    });
  }
});

// Duplicate workbook
router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { id } = req.params;

    const workbook = db.prepare(`
      SELECT * FROM prompt_workbooks
      WHERE id = ? AND (is_system = 1 OR user_id = ?)
    `).get(id, userId);

    if (!workbook) {
      return res.status(404).json({
        success: false,
        error: 'Workbook not found'
      });
    }

    // Create duplicate
    const result = db.prepare(`
      INSERT INTO prompt_workbooks (user_id, name, description, icon, field_schema, view_config)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      `${workbook.name} (副本)`,
      workbook.description,
      workbook.icon,
      workbook.field_schema,
      workbook.view_config
    );

    const newWorkbookId = result.lastInsertRowid;

    // Copy all templates
    const templates = db.prepare('SELECT * FROM prompt_templates WHERE workbook_id = ?').all(id);

    for (const template of templates) {
      db.prepare(`
        INSERT INTO prompt_templates (workbook_id, user_id, name, content, fields_data)
        VALUES (?, ?, ?, ?, ?)
      `).run(newWorkbookId, userId, template.name, template.content, template.fields_data);
    }

    const newWorkbook = db.prepare('SELECT * FROM prompt_workbooks WHERE id = ?').get(newWorkbookId);

    res.json({
      success: true,
      data: {
        ...newWorkbook,
        is_system: Boolean(newWorkbook.is_system),
        field_schema: newWorkbook.field_schema ? JSON.parse(newWorkbook.field_schema) : null,
        view_config: newWorkbook.view_config ? JSON.parse(newWorkbook.view_config) : null
      }
    });
  } catch (error) {
    logger.error('Failed to duplicate workbook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate workbook'
    });
  }
});

module.exports = router;
