const express = require('express');
const router = express.Router();
const { db } = require('../db/init.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');
const logger = require('../utils/logger.cjs');

// Get templates for a workbook
router.get('/', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { workbook_id, search, tags, favorite } = req.query;

    if (!workbook_id) {
      return res.status(400).json({
        success: false,
        error: 'workbook_id is required'
      });
    }

    // Check workbook access
    const workbook = db.prepare(`
      SELECT * FROM prompt_workbooks
      WHERE id = ? AND (is_system = 1 OR user_id = ?)
    `).get(workbook_id, userId);

    if (!workbook) {
      return res.status(404).json({
        success: false,
        error: 'Workbook not found'
      });
    }

    let query = `
      SELECT t.*,
        CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM prompt_templates t
      LEFT JOIN user_template_favorites f
        ON t.id = f.template_id AND f.user_id = ? AND f.workbook_id = ?
      WHERE t.workbook_id = ?
    `;

    const params = [userId, workbook_id, workbook_id];

    // Apply filters
    if (search) {
      query += ` AND (t.name LIKE ? OR t.content LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      query += ` AND (${tagList.map(() => `t.fields_data LIKE ?`).join(' OR ')})`;
      tagList.forEach(tag => params.push(`%"${tag}"%`));
    }

    if (favorite === 'true') {
      query += ` AND f.id IS NOT NULL`;
    }

    query += ` ORDER BY t.created_at DESC`;

    const templates = db.prepare(query).all(...params);

    // Parse JSON fields
    const parsed = templates.map(t => ({
      ...t,
      is_favorite: Boolean(t.is_favorite),
      fields_data: t.fields_data ? JSON.parse(t.fields_data) : {}
    }));

    res.json({
      success: true,
      data: parsed
    });
  } catch (error) {
    logger.error('Failed to get templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates'
    });
  }
});

// Get single template
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { id } = req.params;

    const template = db.prepare(`
      SELECT t.*,
        CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM prompt_templates t
      LEFT JOIN user_template_favorites f
        ON t.id = f.template_id AND f.user_id = ?
      WHERE t.id = ?
    `).get(userId, id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...template,
        is_favorite: Boolean(template.is_favorite),
        fields_data: template.fields_data ? JSON.parse(template.fields_data) : {}
      }
    });
  } catch (error) {
    logger.error('Failed to get template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template'
    });
  }
});

// Create template
router.post('/', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { workbook_id, name, content, fields_data } = req.body;

    if (!workbook_id || !name || !content) {
      return res.status(400).json({
        success: false,
        error: 'workbook_id, name, and content are required'
      });
    }

    // Check workbook ownership
    const workbook = db.prepare(`
      SELECT * FROM prompt_workbooks
      WHERE id = ? AND user_id = ?
    `).get(workbook_id, userId);

    if (!workbook) {
      return res.status(404).json({
        success: false,
        error: 'Workbook not found or permission denied'
      });
    }

    const result = db.prepare(`
      INSERT INTO prompt_templates (workbook_id, user_id, name, content, fields_data)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      workbook_id,
      userId,
      name,
      content,
      fields_data ? JSON.stringify(fields_data) : '{}'
    );

    const newTemplate = db.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      data: {
        ...newTemplate,
        fields_data: newTemplate.fields_data ? JSON.parse(newTemplate.fields_data) : {}
      }
    });
  } catch (error) {
    logger.error('Failed to create template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template'
    });
  }
});

// Update template
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, content, fields_data } = req.body;

    const template = db.prepare(`
      SELECT t.*, w.is_system, w.user_id as workbook_user_id
      FROM prompt_templates t
      JOIN prompt_workbooks w ON t.workbook_id = w.id
      WHERE t.id = ?
    `).get(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Can't edit templates in user's own workbooks
    if (template.workbook_user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }

    db.prepare(`
      UPDATE prompt_templates
      SET name = ?, content = ?, fields_data = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name || template.name,
      content || template.content,
      fields_data ? JSON.stringify(fields_data) : template.fields_data,
      id
    );

    const updated = db.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(id);

    res.json({
      success: true,
      data: {
        ...updated,
        fields_data: updated.fields_data ? JSON.parse(updated.fields_data) : {}
      }
    });
  } catch (error) {
    logger.error('Failed to update template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template'
    });
  }
});

// Delete template
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { id } = req.params;

    const template = db.prepare(`
      SELECT t.*, w.user_id as workbook_user_id
      FROM prompt_templates t
      JOIN prompt_workbooks w ON t.workbook_id = w.id
      WHERE t.id = ?
    `).get(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    if (template.workbook_user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }

    db.prepare('DELETE FROM prompt_templates WHERE id = ?').run(id);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template'
    });
  }
});

// Batch delete
router.post('/batch-delete', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'ids array is required'
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    const deleted = db.prepare(`
      DELETE FROM prompt_templates
      WHERE id IN (${placeholders})
        AND workbook_id IN (
          SELECT id FROM prompt_workbooks WHERE user_id = ?
        )
    `).run(...ids, userId);

    res.json({
      success: true,
      message: `Deleted ${deleted.changes} templates`
    });
  } catch (error) {
    logger.error('Failed to batch delete:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch delete'
    });
  }
});

// Fork templates (copy from system workbook to user workbook)
router.post('/fork', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { template_ids, target_workbook_id } = req.body;

    if (!Array.isArray(template_ids) || template_ids.length === 0 || template_ids.length > 3) {
      return res.status(400).json({
        success: false,
        error: 'Must provide 1-3 template IDs'
      });
    }

    if (!target_workbook_id) {
      return res.status(400).json({
        success: false,
        error: 'target_workbook_id is required'
      });
    }

    // Check target workbook ownership
    const targetWorkbook = db.prepare(`
      SELECT * FROM prompt_workbooks WHERE id = ? AND user_id = ?
    `).get(target_workbook_id, userId);

    if (!targetWorkbook) {
      return res.status(404).json({
        success: false,
        error: 'Target workbook not found or permission denied'
      });
    }

    const createdTemplates = [];

    for (const templateId of template_ids) {
      const template = db.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(templateId);

      if (!template) {
        continue;
      }

      const result = db.prepare(`
        INSERT INTO prompt_templates (workbook_id, user_id, name, content, fields_data)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        target_workbook_id,
        userId,
        template.name,
        template.content,
        template.fields_data
      );

      const newTemplate = db.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(result.lastInsertRowid);
      createdTemplates.push({
        ...newTemplate,
        fields_data: newTemplate.fields_data ? JSON.parse(newTemplate.fields_data) : {}
      });
    }

    res.json({
      success: true,
      data: createdTemplates,
      message: `Forked ${createdTemplates.length} templates`
    });
  } catch (error) {
    logger.error('Failed to fork templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fork templates'
    });
  }
});

// Move/Copy templates between workbooks
router.post('/move', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { template_ids, target_workbook_id, operation } = req.body; // operation: 'move' or 'copy'

    if (!Array.isArray(template_ids) || template_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'template_ids array is required'
      });
    }

    if (!target_workbook_id) {
      return res.status(400).json({
        success: false,
        error: 'target_workbook_id is required'
      });
    }

    // Check target workbook ownership
    const targetWorkbook = db.prepare(`
      SELECT * FROM prompt_workbooks WHERE id = ? AND user_id = ?
    `).get(target_workbook_id, userId);

    if (!targetWorkbook) {
      return res.status(404).json({
        success: false,
        error: 'Target workbook not found or permission denied'
      });
    }

    const processedTemplates = [];

    for (const templateId of template_ids) {
      const template = db.prepare(`
        SELECT t.*, w.user_id as workbook_user_id
        FROM prompt_templates t
        JOIN prompt_workbooks w ON t.workbook_id = w.id
        WHERE t.id = ?
      `).get(templateId);

      if (!template || template.workbook_user_id !== userId) {
        continue; // Skip if not found or no permission
      }

      if (operation === 'move') {
        // Move: update workbook_id
        db.prepare(`
          UPDATE prompt_templates SET workbook_id = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(target_workbook_id, templateId);

        const moved = db.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(templateId);
        processedTemplates.push({
          ...moved,
          fields_data: moved.fields_data ? JSON.parse(moved.fields_data) : {}
        });
      } else {
        // Copy: create new record
        const result = db.prepare(`
          INSERT INTO prompt_templates (workbook_id, user_id, name, content, fields_data)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          target_workbook_id,
          userId,
          template.name,
          template.content,
          template.fields_data
        );

        const copied = db.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(result.lastInsertRowid);
        processedTemplates.push({
          ...copied,
          fields_data: copied.fields_data ? JSON.parse(copied.fields_data) : {}
        });
      }
    }

    res.json({
      success: true,
      data: processedTemplates,
      message: `${operation === 'move' ? 'Moved' : 'Copied'} ${processedTemplates.length} templates`
    });
  } catch (error) {
    logger.error('Failed to move/copy templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to move/copy templates'
    });
  }
});

module.exports = router;
