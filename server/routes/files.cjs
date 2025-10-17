/**
 * 文件上传和解析 API 路由
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { authMiddleware } = require('../middleware/auth.cjs');
const {
  upload,
  fileParser,
  saveFileToDB,
  getUserFiles,
  getFileById,
  deleteFile,
  updateFileStatus,
  saveFileContent,
  getFileContents,
  getFileStats
} = require('../services/fileUpload.cjs');

const router = express.Router();

/**
 * 上传文件
 * POST /api/files/upload
 */
router.post('/upload', authMiddleware, upload.array('files', 10), async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const uploadedFiles = [];

    for (const file of files) {
      try {
        // 生成唯一ID
        const fileId = uuidv4();
        const fileType = fileParser.getFileType(file.mimetype);

        // 保存到数据库
        const fileData = {
          id: fileId,
          userId,
          conversationId: conversationId || null,
          filename: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          fileType
        };

        await saveFileToDB(fileData);

        uploadedFiles.push({
          id: fileId,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          type: fileType,
          mimeType: file.mimetype,
          url: `/api/files/${fileId}`,
          status: 'uploaded'
        });

      } catch (error) {
        console.error('处理文件失败:', error);
        // 继续处理其他文件
      }
    }

    res.json({
      message: '文件上传成功',
      files: uploadedFiles,
      count: uploadedFiles.length
    });

  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ message: '文件上传失败', error: error.message });
  }
});

/**
 * 获取文件列表
 * GET /api/files
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, fileType, limit = 20, offset = 0 } = req.query;

    const files = await getUserFiles(userId, conversationId, fileType);

    // 分页
    const paginatedFiles = files.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      files: paginatedFiles.map(file => ({
        id: file.id,
        filename: file.filename,
        originalName: file.original_name,
        size: file.file_size,
        type: file.file_type,
        mimeType: file.mime_type,
        status: file.status,
        createdAt: file.created_at,
        url: `/api/files/${file.id}`
      })),
      total: files.length,
      hasMore: files.length > parseInt(offset) + parseInt(limit)
    });

  } catch (error) {
    console.error('获取文件列表失败:', error);
    res.status(500).json({ message: '获取文件列表失败', error: error.message });
  }
});

/**
 * 获取文件详情
 * GET /api/files/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = await getFileById(id, userId);

    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }

    res.json({
      id: file.id,
      filename: file.filename,
      originalName: file.original_name,
      size: file.file_size,
      type: file.file_type,
      mimeType: file.mime_type,
      status: file.status,
      createdAt: file.created_at,
      url: `/api/files/${file.id}`
    });

  } catch (error) {
    console.error('获取文件详情失败:', error);
    res.status(500).json({ message: '获取文件详情失败', error: error.message });
  }
});

/**
 * 解析文件
 * POST /api/files/:id/parse
 */
router.post('/:id/parse', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 获取文件信息
    const file = await getFileById(id, userId);

    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 更新文件状态为解析中
    await updateFileStatus(id, 'parsing');

    try {
      // 解析文件
      const parseResult = await fileParser.parseFile(file.file_path, file.file_type);

      // 保存解析内容
      await saveFileContent({
        fileId: id,
        contentType: 'text',
        content: JSON.stringify(parseResult),
        pageNumber: parseResult.pages || null,
        sectionTitle: null
      });

      // 生成摘要
      const summary = fileParser.generateSummary(parseResult);

      // 更新文件状态为已解析
      await updateFileStatus(id, 'parsed');

      res.json({
        message: '文件解析成功',
        result: parseResult,
        summary,
        fileType: file.file_type
      });

    } catch (parseError) {
      console.error('文件解析失败:', parseError);

      // 更新文件状态为错误
      await updateFileStatus(id, 'error');

      res.status(500).json({
        message: '文件解析失败',
        error: parseError.message
      });
    }

  } catch (error) {
    console.error('文件解析失败:', error);
    res.status(500).json({ message: '文件解析失败', error: error.message });
  }
});

/**
 * 获取文件内容
 * GET /api/files/:id/contents
 */
router.get('/:id/contents', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 验证文件所有权
    const file = await getFileById(id, userId);
    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 获取文件内容
    const contents = await getFileContents(id);

    res.json({
      fileId: id,
      contents: contents.map(content => ({
        id: content.id,
        contentType: content.content_type,
        content: content.content,
        pageNumber: content.page_number,
        sectionTitle: content.section_title,
        createdAt: content.created_at
      }))
    });

  } catch (error) {
    console.error('获取文件内容失败:', error);
    res.status(500).json({ message: '获取文件内容失败', error: error.message });
  }
});

/**
 * 文件预览
 * GET /api/files/:id/preview
 */
router.get('/:id/preview', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = await getFileById(id, userId);

    if (!file) {
      return res.status(404).json({ message: '文件不存在' });
    }

    // 返回文件
    res.sendFile(path.resolve(file.file_path));

  } catch (error) {
    console.error('文件预览失败:', error);
    res.status(500).json({ message: '文件预览失败', error: error.message });
  }
});

/**
 * 删除文件
 * DELETE /api/files/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await deleteFile(id, userId);

    res.json({ message: '文件删除成功' });

  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({ message: '删除文件失败', error: error.message });
  }
});

/**
 * 获取文件统计
 * GET /api/files/stats
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await getFileStats(userId);

    res.json(stats);

  } catch (error) {
    console.error('获取文件统计失败:', error);
    res.status(500).json({ message: '获取文件统计失败', error: error.message });
  }
});

/**
 * 获取支持的文件类型
 * GET /api/files/types
 */
router.get('/types', authMiddleware, async (req, res) => {
  try {
    const supportedTypes = fileParser.getSupportedTypes();

    res.json({
      supportedTypes,
      maxFileSize: '50MB',
      maxFiles: 10
    });

  } catch (error) {
    console.error('获取支持的文件类型失败:', error);
    res.status(500).json({ message: '获取支持的文件类型失败', error: error.message });
  }
});

module.exports = router;
