/**
 * 导入导出增强 API 路由
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authMiddleware } = require('../middleware/auth.cjs');
const ExportEngine = require('../services/exportEngine.cjs');
const ImportEngine = require('../services/importEngine.cjs');
const FormatConverters = require('../services/formatConverters.cjs');

const router = express.Router();
const exportEngine = new ExportEngine();
const importEngine = new ImportEngine();
const formatConverters = new FormatConverters();

// 配置文件上传
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.json', '.csv', '.md', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

/**
 * 获取支持的导出格式
 * GET /api/export/formats
 */
router.get('/export/formats', authMiddleware, async (req, res) => {
  try {
    const formats = [
      {
        id: 'json',
        name: 'JSON',
        description: '完整数据格式，包含所有信息',
        extension: '.json',
        mimeType: 'application/json'
      },
      {
        id: 'csv',
        name: 'CSV',
        description: '表格格式，适合数据分析',
        extension: '.csv',
        mimeType: 'text/csv'
      },
      {
        id: 'markdown',
        name: 'Markdown',
        description: '文档格式，适合阅读和编辑',
        extension: '.md',
        mimeType: 'text/markdown'
      },
      {
        id: 'pdf',
        name: 'PDF',
        description: '打印友好格式',
        extension: '.pdf',
        mimeType: 'application/pdf'
      },
      {
        id: 'txt',
        name: 'TXT',
        description: '纯文本格式',
        extension: '.txt',
        mimeType: 'text/plain'
      },
      {
        id: 'html',
        name: 'HTML',
        description: '网页格式，适合在线查看',
        extension: '.html',
        mimeType: 'text/html'
      }
    ];

    res.json({ formats });
  } catch (error) {
    console.error('获取导出格式失败:', error);
    res.status(500).json({ message: '获取导出格式失败', error: error.message });
  }
});

/**
 * 导出对话数据
 * POST /api/export/conversations
 */
router.post('/export/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      conversationIds = [],
      format = 'json',
      includeMessages = true,
      includeMetadata = true,
      includeFiles = false,
      compression = false
    } = req.body;

    const result = await exportEngine.exportConversations({
      userId,
      conversationIds,
      format,
      includeMessages,
      includeMetadata,
      includeFiles,
      compression
    });

    res.json({
      message: '导出任务已创建',
      exportId: result.exportId,
      downloadUrl: result.downloadUrl,
      format: result.format,
      size: result.size
    });
  } catch (error) {
    console.error('导出对话失败:', error);
    res.status(500).json({ message: '导出对话失败', error: error.message });
  }
});

/**
 * 批量导出
 * POST /api/export/batch
 */
router.post('/export/batch', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      conversationIds = [],
      format = 'json',
      includeMessages = true,
      includeMetadata = true,
      includeFiles = false,
      compression = true,
      splitByConversation = false
    } = req.body;

    if (splitByConversation) {
      // 为每个对话创建单独的导出任务
      const results = [];
      for (const conversationId of conversationIds) {
        const result = await exportEngine.exportConversations({
          userId,
          conversationIds: [conversationId],
          format,
          includeMessages,
          includeMetadata,
          includeFiles,
          compression
        });
        results.push(result);
      }
      res.json({
        message: '批量导出任务已创建',
        results
      });
    } else {
      // 创建单个批量导出任务
      const result = await exportEngine.exportConversations({
        userId,
        conversationIds,
        format,
        includeMessages,
        includeMetadata,
        includeFiles,
        compression
      });
      res.json({
        message: '批量导出任务已创建',
        result
      });
    }
  } catch (error) {
    console.error('批量导出失败:', error);
    res.status(500).json({ message: '批量导出失败', error: error.message });
  }
});

/**
 * 下载导出文件
 * GET /api/export/:id/download
 */
router.get('/export/:id/download', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const exportRecord = await exportEngine.getExportRecord(id, userId);
    if (!exportRecord) {
      return res.status(404).json({ message: '导出记录不存在' });
    }

    if (exportRecord.status !== 'completed') {
      return res.status(400).json({ message: '导出尚未完成' });
    }

    const filePath = exportRecord.file_path;
    const fileName = `export_${id}.${exportRecord.format}`;

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('下载文件失败:', err);
        res.status(500).json({ message: '下载文件失败' });
      }
    });
  } catch (error) {
    console.error('下载导出文件失败:', error);
    res.status(500).json({ message: '下载导出文件失败', error: error.message });
  }
});

/**
 * 获取导出历史
 * GET /api/export/history
 */
router.get('/export/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const history = await exportEngine.getExportHistory(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      history,
      count: history.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('获取导出历史失败:', error);
    res.status(500).json({ message: '获取导出历史失败', error: error.message });
  }
});

/**
 * 获取导出状态
 * GET /api/export/:id/status
 */
router.get('/export/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const exportRecord = await exportEngine.getExportRecord(id, userId);
    if (!exportRecord) {
      return res.status(404).json({ message: '导出记录不存在' });
    }

    res.json({
      id: exportRecord.id,
      status: exportRecord.status,
      format: exportRecord.format,
      fileSize: exportRecord.file_size,
      createdAt: exportRecord.created_at,
      completedAt: exportRecord.completed_at,
      errorDetails: exportRecord.error_details
    });
  } catch (error) {
    console.error('获取导出状态失败:', error);
    res.status(500).json({ message: '获取导出状态失败', error: error.message });
  }
});

/**
 * 删除导出文件
 * DELETE /api/export/:id
 */
router.delete('/export/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await exportEngine.deleteExportRecord(id, userId);

    res.json({
      message: '导出记录已删除',
      result
    });
  } catch (error) {
    console.error('删除导出记录失败:', error);
    res.status(500).json({ message: '删除导出记录失败', error: error.message });
  }
});

/**
 * 验证导入数据
 * POST /api/import/validate
 */
router.post('/import/validate', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { format } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: '请选择要验证的文件' });
    }

    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath, 'utf8');

    // 解析数据
    const parsedData = await formatConverters.parseFromFormat(fileContent, format);

    // 验证数据
    const validationResult = await importEngine.validateImportData(parsedData, format);

    // 清理临时文件
    await fs.unlink(filePath);

    res.json({
      message: '数据验证完成',
      validation: validationResult
    });
  } catch (error) {
    console.error('验证导入数据失败:', error);
    res.status(500).json({ message: '验证导入数据失败', error: error.message });
  }
});

/**
 * 导入对话数据
 * POST /api/import/conversations
 */
router.post('/import/conversations', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      format,
      mapping = {},
      validation = true,
      mergeStrategy = 'skip'
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: '请选择要导入的文件' });
    }

    const filePath = req.file.path;
    const fileSize = (await fs.stat(filePath)).size;

    const result = await importEngine.importConversations({
      userId,
      filePath,
      format,
      mapping,
      validation,
      mergeStrategy
    });

    // 清理临时文件
    await fs.unlink(filePath);

    res.json({
      message: '导入完成',
      importId: result.importId,
      successCount: result.successCount,
      errorCount: result.errorCount,
      errors: result.errors
    });
  } catch (error) {
    console.error('导入对话失败:', error);
    res.status(500).json({ message: '导入对话失败', error: error.message });
  }
});

/**
 * 批量导入
 * POST /api/import/batch
 */
router.post('/import/batch', authMiddleware, upload.array('files', 10), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      format,
      mapping = {},
      validation = true,
      mergeStrategy = 'skip'
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '请选择要导入的文件' });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const result = await importEngine.importConversations({
          userId,
          filePath: file.path,
          format,
          mapping,
          validation,
          mergeStrategy
        });
        results.push({
          fileName: file.originalname,
          successCount: result.successCount,
          errorCount: result.errorCount,
          errors: result.errors
        });
      } catch (error) {
        errors.push({
          fileName: file.originalname,
          error: error.message
        });
      } finally {
        // 清理临时文件
        await fs.unlink(file.path);
      }
    }

    res.json({
      message: '批量导入完成',
      results,
      errors
    });
  } catch (error) {
    console.error('批量导入失败:', error);
    res.status(500).json({ message: '批量导入失败', error: error.message });
  }
});

/**
 * 获取导入模板
 * GET /api/import/templates
 */
router.get('/import/templates', authMiddleware, async (req, res) => {
  try {
    const templates = [
      {
        format: 'csv',
        name: 'CSV 导入模板',
        description: '用于导入对话数据的 CSV 模板',
        downloadUrl: '/api/import/templates/csv/download',
        fields: [
          { name: 'conversationId', required: true, description: '对话ID' },
          { name: 'conversationTitle', required: true, description: '对话标题' },
          { name: 'messageId', required: false, description: '消息ID' },
          { name: 'role', required: true, description: '角色 (user/assistant/system)' },
          { name: 'content', required: true, description: '消息内容' },
          { name: 'createdAt', required: false, description: '创建时间' }
        ]
      },
      {
        format: 'json',
        name: 'JSON 导入模板',
        description: '用于导入对话数据的 JSON 模板',
        downloadUrl: '/api/import/templates/json/download',
        fields: [
          { name: 'conversations', required: true, description: '对话数组' },
          { name: 'messages', required: true, description: '消息数组' }
        ]
      }
    ];

    res.json({ templates });
  } catch (error) {
    console.error('获取导入模板失败:', error);
    res.status(500).json({ message: '获取导入模板失败', error: error.message });
  }
});

/**
 * 下载导入模板
 * GET /api/import/templates/:format/download
 */
router.get('/import/templates/:format/download', authMiddleware, async (req, res) => {
  try {
    const { format } = req.params;

    let templateContent;
    let fileName;
    let mimeType;

    switch (format) {
      case 'csv':
        templateContent = 'conversationId,conversationTitle,messageId,role,content,createdAt\n';
        templateContent += 'conv-1,示例对话,msg-1,user,你好，请介绍一下自己,2025-10-15T10:00:00Z\n';
        templateContent += 'conv-1,示例对话,msg-2,assistant,你好！我是一个AI助手，很高兴为您服务。,2025-10-15T10:01:00Z';
        fileName = 'import_template.csv';
        mimeType = 'text/csv';
        break;
      case 'json':
        templateContent = JSON.stringify({
          conversations: [
            {
              id: 'conv-1',
              title: '示例对话',
              created_at: '2025-10-15T10:00:00Z',
              updated_at: '2025-10-15T10:01:00Z',
              messages: [
                {
                  id: 'msg-1',
                  role: 'user',
                  content: '你好，请介绍一下自己',
                  created_at: '2025-10-15T10:00:00Z'
                },
                {
                  id: 'msg-2',
                  role: 'assistant',
                  content: '你好！我是一个AI助手，很高兴为您服务。',
                  created_at: '2025-10-15T10:01:00Z'
                }
              ]
            }
          ]
        }, null, 2);
        fileName = 'import_template.json';
        mimeType = 'application/json';
        break;
      default:
        return res.status(400).json({ message: '不支持的模板格式' });
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(templateContent);
  } catch (error) {
    console.error('下载导入模板失败:', error);
    res.status(500).json({ message: '下载导入模板失败', error: error.message });
  }
});

/**
 * 压缩导出数据
 * POST /api/export/compress
 */
router.post('/export/compress', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { exportId, compressionType = 'zip' } = req.body;

    const result = await exportEngine.compressExport(exportId, userId, compressionType);

    res.json({
      message: '压缩完成',
      result
    });
  } catch (error) {
    console.error('压缩导出数据失败:', error);
    res.status(500).json({ message: '压缩导出数据失败', error: error.message });
  }
});

module.exports = router;
