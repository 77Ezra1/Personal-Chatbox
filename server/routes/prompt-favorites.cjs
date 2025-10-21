const express = require('express');
const router = express.Router();
const { db } = require('../db/init.cjs');
const { authMiddleware } = require('../middleware/auth.cjs');
const logger = require('../utils/logger.cjs');

// Toggle favorite
router.post('/', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { template_id, workbook_id } = req.body;

    if (!template_id || !workbook_id) {
      return res.status(400).json({
        success: false,
        error: 'template_id and workbook_id are required'
      });
    }

    // Check if already favorited
    const existing = db.prepare(`
      SELECT * FROM user_template_favorites
      WHERE user_id = ? AND template_id = ? AND workbook_id = ?
    `).get(userId, template_id, workbook_id);

    if (existing) {
      // Unfavorite
      db.prepare(`
        DELETE FROM user_template_favorites
        WHERE user_id = ? AND template_id = ? AND workbook_id = ?
      `).run(userId, template_id, workbook_id);

      res.json({
        success: true,
        is_favorite: false,
        message: 'Removed from favorites'
      });
    } else {
      // Favorite
      db.prepare(`
        INSERT INTO user_template_favorites (user_id, template_id, workbook_id)
        VALUES (?, ?, ?)
      `).run(userId, template_id, workbook_id);

      res.json({
        success: true,
        is_favorite: true,
        message: 'Added to favorites'
      });
    }
  } catch (error) {
    logger.error('Failed to toggle favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle favorite'
    });
  }
});

// Get all favorites for a workbook
router.get('/', authMiddleware, async (req, res) => {
  try {
    
    const userId = req.user.userId;
    const { workbook_id } = req.query;

    let query = `
      SELECT t.*, f.created_at as favorited_at, 1 as is_favorite
      FROM user_template_favorites f
      JOIN prompt_templates t ON f.template_id = t.id
      WHERE f.user_id = ?
    `;

    const params = [userId];

    if (workbook_id) {
      query += ` AND f.workbook_id = ?`;
      params.push(workbook_id);
    }

    query += ` ORDER BY f.created_at DESC`;

    const favorites = db.prepare(query).all(...params);

    const parsed = favorites.map(f => ({
      ...f,
      is_favorite: Boolean(f.is_favorite),
      fields_data: f.fields_data ? JSON.parse(f.fields_data) : {}
    }));

    res.json({
      success: true,
      data: parsed
    });
  } catch (error) {
    logger.error('Failed to get favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get favorites'
    });
  }
});

module.exports = router;
