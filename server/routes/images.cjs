/**
 * 图片上传和分析 API 路由
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { authMiddleware } = require('../middleware/auth.cjs');
const {
  upload,
  processImage,
  saveImageToDB,
  getUserImages,
  deleteImage,
  getImageAnalysis,
  saveImageAnalysis,
  processedDir
} = require('../services/imageUpload.cjs');
const VisionClient = require('../services/visionClient.cjs');

// 创建视觉客户端实例
const visionClient = new VisionClient();

/**
 * 上传图片
 * POST /api/images/upload
 */
router.post('/upload', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: '没有上传图片' });
    }

    const uploadedImages = [];

    for (const file of files) {
      try {
        // 生成唯一ID
        const imageId = uuidv4();

        // 处理图片（压缩和优化）
        const processedFilename = `processed_${file.filename}`;
        const processedPath = path.join(processedDir, processedFilename);

        const processResult = await processImage(file.path, processedPath, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 85
        });

        // 保存到数据库
        const imageData = {
          id: imageId,
          userId,
          conversationId: conversationId || null,
          filename: processedFilename,
          originalName: file.originalname,
          filePath: processedPath,
          fileSize: processResult.size,
          mimeType: file.mimetype,
          width: processResult.width,
          height: processResult.height
        };

        await saveImageToDB(imageData);

        uploadedImages.push({
          id: imageId,
          filename: processedFilename,
          originalName: file.originalname,
          size: processResult.size,
          width: processResult.width,
          height: processResult.height,
          url: `/api/images/${imageId}`
        });

        // 删除原始文件（保留处理后的文件）
        const fs = require('fs').promises;
        await fs.unlink(file.path);

      } catch (error) {
        console.error('处理图片失败:', error);
        // 继续处理其他图片
      }
    }

    res.json({
      message: '图片上传成功',
      images: uploadedImages,
      count: uploadedImages.length
    });

  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({ message: '上传失败', error: error.message });
  }
});

/**
 * 获取图片
 * GET /api/images/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 从数据库获取图片信息
    const { db } = require('../db/init.cjs');

    db.get(
      'SELECT * FROM images WHERE id = ? AND user_id = ?',
      [id, userId],
      (err, image) => {
        if (err) {
          console.error('获取图片失败:', err);
          return res.status(500).json({ message: '获取图片失败' });
        }

        if (!image) {
          return res.status(404).json({ message: '图片不存在' });
        }

        // 返回图片文件
        res.sendFile(path.resolve(image.file_path));
      }
    );

  } catch (error) {
    console.error('获取图片失败:', error);
    res.status(500).json({ message: '获取图片失败', error: error.message });
  }
});

/**
 * 获取用户图片列表
 * GET /api/images
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.query;

    const images = await getUserImages(userId, conversationId);

    res.json({
      images: images.map(img => ({
        id: img.id,
        filename: img.filename,
        originalName: img.original_name,
        size: img.file_size,
        width: img.width,
        height: img.height,
        mimeType: img.mime_type,
        createdAt: img.created_at,
        url: `/api/images/${img.id}`
      }))
    });

  } catch (error) {
    console.error('获取图片列表失败:', error);
    res.status(500).json({ message: '获取图片列表失败', error: error.message });
  }
});

/**
 * 删除图片
 * DELETE /api/images/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await deleteImage(id, userId);

    res.json({ message: '图片删除成功' });

  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({ message: '删除图片失败', error: error.message });
  }
});

/**
 * 分析图片
 * POST /api/images/:id/analyze
 */
router.post('/:id/analyze', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { analysisType = 'general', customPrompt } = req.body;

    // 获取图片信息
    const { db } = require('../db/init.cjs');

    db.get(
      'SELECT * FROM images WHERE id = ? AND user_id = ?',
      [id, userId],
      async (err, image) => {
        if (err) {
          console.error('获取图片失败:', err);
          return res.status(500).json({ message: '获取图片失败' });
        }

        if (!image) {
          return res.status(404).json({ message: '图片不存在' });
        }

        try {
          // 分析图片
          const analysisResult = await visionClient.analyzeImage(
            image.file_path,
            analysisType,
            customPrompt
          );

          // 保存分析结果
          await saveImageAnalysis({
            imageId: id,
            modelName: analysisResult.model,
            analysisType: analysisResult.type,
            analysisResult: analysisResult.analysis
          });

          res.json({
            message: '图片分析完成',
            analysis: analysisResult.analysis,
            model: analysisResult.model,
            type: analysisResult.type,
            usage: analysisResult.usage
          });

        } catch (analysisError) {
          console.error('图片分析失败:', analysisError);
          res.status(500).json({
            message: '图片分析失败',
            error: analysisError.message
          });
        }
      }
    );

  } catch (error) {
    console.error('分析图片失败:', error);
    res.status(500).json({ message: '分析图片失败', error: error.message });
  }
});

/**
 * 提取图片文字 (OCR)
 * POST /api/images/:id/ocr
 */
router.post('/:id/ocr', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 获取图片信息
    const { db } = require('../db/init.cjs');

    db.get(
      'SELECT * FROM images WHERE id = ? AND user_id = ?',
      [id, userId],
      async (err, image) => {
        if (err) {
          console.error('获取图片失败:', err);
          return res.status(500).json({ message: '获取图片失败' });
        }

        if (!image) {
          return res.status(404).json({ message: '图片不存在' });
        }

        try {
          // OCR 提取
          const ocrResult = await visionClient.extractTextWithGPT4V(image.file_path);

          // 保存分析结果
          await saveImageAnalysis({
            imageId: id,
            modelName: ocrResult.model,
            analysisType: 'ocr',
            analysisResult: ocrResult.text
          });

          res.json({
            message: '文字提取完成',
            text: ocrResult.text,
            model: ocrResult.model,
            usage: ocrResult.usage
          });

        } catch (ocrError) {
          console.error('OCR 提取失败:', ocrError);
          res.status(500).json({
            message: '文字提取失败',
            error: ocrError.message
          });
        }
      }
    );

  } catch (error) {
    console.error('OCR 提取失败:', error);
    res.status(500).json({ message: 'OCR 提取失败', error: error.message });
  }
});

/**
 * 分析图表
 * POST /api/images/:id/chart
 */
router.post('/:id/chart', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 获取图片信息
    const { db } = require('../db/init.cjs');

    db.get(
      'SELECT * FROM images WHERE id = ? AND user_id = ?',
      [id, userId],
      async (err, image) => {
        if (err) {
          console.error('获取图片失败:', err);
          return res.status(500).json({ message: '获取图片失败' });
        }

        if (!image) {
          return res.status(404).json({ message: '图片不存在' });
        }

        try {
          // 图表分析
          const chartResult = await visionClient.analyzeChart(image.file_path);

          // 保存分析结果
          await saveImageAnalysis({
            imageId: id,
            modelName: chartResult.model,
            analysisType: 'chart',
            analysisResult: chartResult.analysis
          });

          res.json({
            message: '图表分析完成',
            analysis: chartResult.analysis,
            model: chartResult.model,
            usage: chartResult.usage
          });

        } catch (chartError) {
          console.error('图表分析失败:', chartError);
          res.status(500).json({
            message: '图表分析失败',
            error: chartError.message
          });
        }
      }
    );

  } catch (error) {
    console.error('图表分析失败:', error);
    res.status(500).json({ message: '图表分析失败', error: error.message });
  }
});

/**
 * 获取图片分析历史
 * GET /api/images/:id/analyses
 */
router.get('/:id/analyses', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 验证图片所有权
    const { db } = require('../db/init.cjs');

    db.get(
      'SELECT id FROM images WHERE id = ? AND user_id = ?',
      [id, userId],
      async (err, image) => {
        if (err) {
          console.error('验证图片失败:', err);
          return res.status(500).json({ message: '验证图片失败' });
        }

        if (!image) {
          return res.status(404).json({ message: '图片不存在' });
        }

        try {
          const analyses = await getImageAnalysis(id);

          res.json({
            analyses: analyses.map(analysis => ({
              id: analysis.id,
              modelName: analysis.model_name,
              analysisType: analysis.analysis_type,
              analysisResult: analysis.analysis_result,
              createdAt: analysis.created_at
            }))
          });

        } catch (analysisError) {
          console.error('获取分析历史失败:', analysisError);
          res.status(500).json({
            message: '获取分析历史失败',
            error: analysisError.message
          });
        }
      }
    );

  } catch (error) {
    console.error('获取分析历史失败:', error);
    res.status(500).json({ message: '获取分析历史失败', error: error.message });
  }
});

module.exports = router;
