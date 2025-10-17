/**
 * 知识库（RAG）API 路由
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/auth.cjs');
const KnowledgeBaseService = require('../services/knowledgeBase.cjs');
const { uploadDir } = require('../services/fileUpload.cjs');

const router = express.Router();
const knowledgeService = new KnowledgeBaseService();

// 配置 multer 用于文档上传
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const knowledgeDir = path.join(uploadDir, 'knowledge');
      require('fs').mkdirSync(knowledgeDir, { recursive: true });
      cb(null, knowledgeDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${require('uuid').v4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

/**
 * 创建知识库
 * POST /api/knowledge/bases
 */
router.post('/bases', authMiddleware, async (req, res) => {
  try {
    const { name, description, config } = req.body;
    const userId = req.user.id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: '知识库名称不能为空' });
    }

    const knowledgeBase = await knowledgeService.createKnowledgeBase(
      userId,
      name.trim(),
      description || '',
      config
    );

    res.json({
      message: '知识库创建成功',
      knowledgeBase
    });
  } catch (error) {
    console.error('创建知识库失败:', error);
    res.status(500).json({ message: '创建知识库失败', error: error.message });
  }
});

/**
 * 获取知识库列表
 * GET /api/knowledge/bases
 */
router.get('/bases', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const knowledgeBases = await knowledgeService.getUserKnowledgeBases(userId);

    res.json({
      knowledgeBases,
      count: knowledgeBases.length
    });
  } catch (error) {
    console.error('获取知识库列表失败:', error);
    res.status(500).json({ message: '获取知识库列表失败', error: error.message });
  }
});

/**
 * 获取知识库详情
 * GET /api/knowledge/bases/:id
 */
router.get('/bases/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const knowledgeBase = await knowledgeService.getKnowledgeBase(id, userId);

    res.json({ knowledgeBase });
  } catch (error) {
    console.error('获取知识库详情失败:', error);
    res.status(500).json({ message: '获取知识库详情失败', error: error.message });
  }
});

/**
 * 更新知识库
 * PUT /api/knowledge/bases/:id
 */
router.put('/bases/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, config } = req.body;
    const userId = req.user.id;

    // 验证权限
    await knowledgeService.getKnowledgeBase(id, userId);

    const { db } = require('../db/init.cjs');
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE knowledge_bases
         SET name = ?, description = ?, config = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, description, JSON.stringify(config), id],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    res.json({ message: '知识库更新成功' });
  } catch (error) {
    console.error('更新知识库失败:', error);
    res.status(500).json({ message: '更新知识库失败', error: error.message });
  }
});

/**
 * 删除知识库
 * DELETE /api/knowledge/bases/:id
 */
router.delete('/bases/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await knowledgeService.deleteKnowledgeBase(id, userId);

    res.json({ message: '知识库删除成功' });
  } catch (error) {
    console.error('删除知识库失败:', error);
    res.status(500).json({ message: '删除知识库失败', error: error.message });
  }
});

/**
 * 上传文档到知识库
 * POST /api/knowledge/bases/:id/upload
 */
router.post('/bases/:id/upload', authMiddleware, upload.array('files', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    // 验证知识库权限
    await knowledgeService.getKnowledgeBase(id, userId);

    const results = [];

    for (const file of files) {
      try {
        const fileType = getFileType(file.mimetype);
        const result = await knowledgeService.uploadDocument(
          id,
          file.path,
          file.originalname,
          fileType,
          { userId }
        );

        results.push({
          filename: file.originalname,
          ...result
        });
      } catch (error) {
        console.error(`处理文件 ${file.originalname} 失败:`, error);
        results.push({
          filename: file.originalname,
          error: error.message,
          status: 'failed'
        });
      }
    }

    res.json({
      message: '文档上传完成',
      results,
      successCount: results.filter(r => r.status === 'completed').length,
      totalCount: results.length
    });

  } catch (error) {
    console.error('上传文档失败:', error);
    res.status(500).json({ message: '上传文档失败', error: error.message });
  }
});

/**
 * 向量搜索
 * POST /api/knowledge/search
 */
router.post('/search', authMiddleware, async (req, res) => {
  try {
    const { knowledgeBaseId, query, topK = 5, similarityThreshold = 0.7 } = req.body;
    const userId = req.user.id;

    if (!knowledgeBaseId || !query) {
      return res.status(400).json({ message: '知识库ID和查询内容不能为空' });
    }

    const results = await knowledgeService.searchSimilarChunks(
      knowledgeBaseId,
      query,
      {
        topK,
        similarityThreshold,
        userId
      }
    );

    res.json({
      query,
      results,
      count: results.length
    });
  } catch (error) {
    console.error('向量搜索失败:', error);
    res.status(500).json({ message: '向量搜索失败', error: error.message });
  }
});

/**
 * 知识库问答
 * POST /api/knowledge/query
 */
router.post('/query', authMiddleware, async (req, res) => {
  try {
    const { knowledgeBaseId, question, topK = 5, includeCitations = true } = req.body;
    const userId = req.user.id;

    if (!knowledgeBaseId || !question) {
      return res.status(400).json({ message: '知识库ID和问题不能为空' });
    }

    const result = await knowledgeService.queryKnowledgeBase(
      knowledgeBaseId,
      question,
      {
        topK,
        userId,
        includeCitations
      }
    );

    res.json(result);
  } catch (error) {
    console.error('知识库问答失败:', error);
    res.status(500).json({ message: '知识库问答失败', error: error.message });
  }
});

/**
 * 获取知识库统计信息
 * GET /api/knowledge/bases/:id/stats
 */
router.get('/bases/:id/stats', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const stats = await knowledgeService.getKnowledgeBaseStats(id, userId);

    res.json({ stats });
  } catch (error) {
    console.error('获取知识库统计失败:', error);
    res.status(500).json({ message: '获取知识库统计失败', error: error.message });
  }
});

/**
 * 获取知识库文档列表
 * GET /api/knowledge/bases/:id/documents
 */
router.get('/bases/:id/documents', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    // 验证权限
    await knowledgeService.getKnowledgeBase(id, userId);

    const { db } = require('../db/init.cjs');

    db.all(
      `SELECT * FROM knowledge_documents
       WHERE knowledge_base_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), parseInt(offset)],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ message: '获取文档列表失败' });
        }

        res.json({
          documents: rows.map(row => ({
            id: row.id,
            filename: row.filename,
            fileType: row.file_type,
            fileSize: row.file_size,
            status: row.status,
            createdAt: row.created_at,
            metadata: JSON.parse(row.metadata || '{}')
          })),
          count: rows.length
        });
      }
    );
  } catch (error) {
    console.error('获取文档列表失败:', error);
    res.status(500).json({ message: '获取文档列表失败', error: error.message });
  }
});

/**
 * 获取知识库查询历史
 * GET /api/knowledge/bases/:id/queries
 */
router.get('/bases/:id/queries', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    // 验证权限
    await knowledgeService.getKnowledgeBase(id, userId);

    const { db } = require('../db/init.cjs');

    db.all(
      `SELECT * FROM knowledge_queries
       WHERE knowledge_base_id = ? AND user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [id, userId, parseInt(limit), parseInt(offset)],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ message: '获取查询历史失败' });
        }

        res.json({
          queries: rows.map(row => ({
            id: row.id,
            question: row.question,
            answer: row.answer,
            queryType: row.query_type,
            createdAt: row.created_at
          })),
          count: rows.length
        });
      }
    );
  } catch (error) {
    console.error('获取查询历史失败:', error);
    res.status(500).json({ message: '获取查询历史失败', error: error.message });
  }
});

/**
 * 获取支持的嵌入模型
 * GET /api/knowledge/models
 */
router.get('/models', authMiddleware, async (req, res) => {
  try {
    const vectorService = require('../services/vectorService.cjs');
    const models = new vectorService().getSupportedModels();

    res.json({ models });
  } catch (error) {
    console.error('获取嵌入模型失败:', error);
    res.status(500).json({ message: '获取嵌入模型失败', error: error.message });
  }
});

// 辅助函数：获取文件类型
function getFileType(mimeType) {
  const typeMap = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/csv': 'csv',
    'text/plain': 'txt',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
  };

  return typeMap[mimeType] || 'unknown';
}

module.exports = router;
