/**
 * 图片上传服务
 * 处理图片上传、压缩、存储和分析
 */

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/init.cjs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/images');
const processedDir = path.join(__dirname, '../../uploads/processed');

const ensureDirectories = async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(processedDir, { recursive: true });
  } catch (error) {
    console.error('创建上传目录失败:', error);
  }
};

// 初始化目录
ensureDirectories();

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的图片格式。支持: JPG, PNG, GIF, WebP'), false);
  }
};

// 创建 multer 实例
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // 最多5张图片
  },
  fileFilter
});

/**
 * 处理图片压缩和优化
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputPath - 输出文件路径
 * @param {object} options - 处理选项
 */
const processImage = async (inputPath, outputPath, options = {}) => {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 85,
    format = 'jpeg'
  } = options;

  try {
    const metadata = await sharp(inputPath).metadata();

    // 计算新尺寸
    let newWidth = metadata.width;
    let newHeight = metadata.height;

    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      const ratio = Math.min(maxWidth / metadata.width, maxHeight / metadata.height);
      newWidth = Math.round(metadata.width * ratio);
      newHeight = Math.round(metadata.height * ratio);
    }

    // 处理图片
    await sharp(inputPath)
      .resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toFile(outputPath);

    const stats = await fs.stat(outputPath);

    return {
      width: newWidth,
      height: newHeight,
      originalWidth: metadata.width,
      originalHeight: metadata.height,
      size: stats.size,
      format: metadata.format
    };
  } catch (error) {
    console.error('图片处理失败:', error);
    throw new Error('图片处理失败: ' + error.message);
  }
};

/**
 * 保存图片信息到数据库
 * @param {object} imageData - 图片数据
 */
const saveImageToDB = async (imageData) => {
  return new Promise((resolve, reject) => {
    const {
      id,
      userId,
      conversationId,
      filename,
      originalName,
      filePath,
      fileSize,
      mimeType,
      width,
      height
    } = imageData;

    db.run(
      `INSERT INTO images (id, user_id, conversation_id, filename, original_name, file_path, file_size, mime_type, width, height)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, conversationId, filename, originalName, filePath, fileSize, mimeType, width, height],
      function(err) {
        if (err) {
          console.error('保存图片信息失败:', err);
          reject(err);
        } else {
          resolve({ id, insertId: this.lastID });
        }
      }
    );
  });
};

/**
 * 获取用户的图片列表
 * @param {number} userId - 用户ID
 * @param {string} conversationId - 对话ID（可选）
 */
const getUserImages = async (userId, conversationId = null) => {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM images WHERE user_id = ?';
    const params = [userId];

    if (conversationId) {
      sql += ' AND conversation_id = ?';
      params.push(conversationId);
    }

    sql += ' ORDER BY created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('获取图片列表失败:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * 删除图片
 * @param {string} imageId - 图片ID
 * @param {number} userId - 用户ID
 */
const deleteImage = async (imageId, userId) => {
  return new Promise((resolve, reject) => {
    // 先获取图片信息
    db.get(
      'SELECT * FROM images WHERE id = ? AND user_id = ?',
      [imageId, userId],
      async (err, image) => {
        if (err) {
          reject(err);
          return;
        }

        if (!image) {
          reject(new Error('图片不存在或无权限'));
          return;
        }

        try {
          // 删除文件
          await fs.unlink(image.file_path);

          // 删除数据库记录
          db.run(
            'DELETE FROM images WHERE id = ?',
            [imageId],
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve({ success: true });
              }
            }
          );
        } catch (error) {
          console.error('删除图片文件失败:', error);
          reject(error);
        }
      }
    );
  });
};

/**
 * 获取图片分析结果
 * @param {string} imageId - 图片ID
 */
const getImageAnalysis = async (imageId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM image_analyses WHERE image_id = ? ORDER BY created_at DESC',
      [imageId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
};

/**
 * 保存图片分析结果
 * @param {object} analysisData - 分析数据
 */
const saveImageAnalysis = async (analysisData) => {
  return new Promise((resolve, reject) => {
    const {
      imageId,
      modelName,
      analysisType,
      analysisResult
    } = analysisData;

    db.run(
      `INSERT INTO image_analyses (image_id, model_name, analysis_type, analysis_result)
       VALUES (?, ?, ?, ?)`,
      [imageId, modelName, analysisType, analysisResult],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      }
    );
  });
};

module.exports = {
  upload,
  processImage,
  saveImageToDB,
  getUserImages,
  deleteImage,
  getImageAnalysis,
  saveImageAnalysis,
  uploadDir,
  processedDir
};
