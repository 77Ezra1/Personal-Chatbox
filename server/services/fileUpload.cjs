/**
 * 文件上传服务
 * 处理文件上传、存储、验证和管理
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const FileParserService = require('./fileParser.cjs');

// 创建文件解析服务实例
const fileParser = new FileParserService();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/files');

const ensureDirectories = async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
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
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (fileParser.isValidFileType(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件格式。支持: PDF, Word, Excel, CSV, PowerPoint, 纯文本'), false);
  }
};

// 创建 multer 实例
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10 // 最多10个文件
  },
  fileFilter
});

/**
 * 保存文件信息到数据库
 * @param {Object} fileData - 文件数据
 */
const saveFileToDB = async (fileData) => {
  return new Promise((resolve, reject) => {
    const { db } = require('../db/init.cjs');
    const {
      id,
      userId,
      conversationId,
      filename,
      originalName,
      filePath,
      fileSize,
      mimeType,
      fileType
    } = fileData;

    db.run(
      `INSERT INTO files (id, user_id, conversation_id, filename, original_name, file_path, file_size, mime_type, file_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, conversationId, filename, originalName, filePath, fileSize, mimeType, fileType],
      function(err) {
        if (err) {
          console.error('保存文件信息失败:', err);
          reject(err);
        } else {
          resolve({ id, insertId: this.lastID });
        }
      }
    );
  });
};

/**
 * 获取用户文件列表
 * @param {number} userId - 用户ID
 * @param {string} conversationId - 对话ID（可选）
 * @param {string} fileType - 文件类型过滤（可选）
 */
const getUserFiles = async (userId, conversationId = null, fileType = null) => {
  return new Promise((resolve, reject) => {
    const { db } = require('../db/init.cjs');

    let sql = 'SELECT * FROM files WHERE user_id = ?';
    const params = [userId];

    if (conversationId) {
      sql += ' AND conversation_id = ?';
      params.push(conversationId);
    }

    if (fileType) {
      sql += ' AND file_type = ?';
      params.push(fileType);
    }

    sql += ' ORDER BY created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('获取文件列表失败:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * 获取文件详情
 * @param {string} fileId - 文件ID
 * @param {number} userId - 用户ID
 */
const getFileById = async (fileId, userId) => {
  return new Promise((resolve, reject) => {
    const { db } = require('../db/init.cjs');

    db.get(
      'SELECT * FROM files WHERE id = ? AND user_id = ?',
      [fileId, userId],
      (err, row) => {
        if (err) {
          console.error('获取文件详情失败:', err);
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
};

/**
 * 删除文件
 * @param {string} fileId - 文件ID
 * @param {number} userId - 用户ID
 */
const deleteFile = async (fileId, userId) => {
  return new Promise((resolve, reject) => {
    const { db } = require('../db/init.cjs');

    // 先获取文件信息
    db.get(
      'SELECT * FROM files WHERE id = ? AND user_id = ?',
      [fileId, userId],
      async (err, file) => {
        if (err) {
          reject(err);
          return;
        }

        if (!file) {
          reject(new Error('文件不存在或无权限'));
          return;
        }

        try {
          // 删除文件
          await fs.unlink(file.file_path);

          // 删除数据库记录
          db.run(
            'DELETE FROM files WHERE id = ?',
            [fileId],
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve({ success: true });
              }
            }
          );
        } catch (error) {
          console.error('删除文件失败:', error);
          reject(error);
        }
      }
    );
  });
};

/**
 * 更新文件状态
 * @param {string} fileId - 文件ID
 * @param {string} status - 新状态
 */
const updateFileStatus = async (fileId, status) => {
  return new Promise((resolve, reject) => {
    const { db } = require('../db/init.cjs');

    db.run(
      'UPDATE files SET status = ? WHERE id = ?',
      [status, fileId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true, changes: this.changes });
        }
      }
    );
  });
};

/**
 * 保存文件解析内容
 * @param {Object} contentData - 内容数据
 */
const saveFileContent = async (contentData) => {
  return new Promise((resolve, reject) => {
    const { db } = require('../db/init.cjs');
    const {
      fileId,
      contentType,
      content,
      pageNumber,
      sectionTitle
    } = contentData;

    db.run(
      `INSERT INTO file_contents (file_id, content_type, content, page_number, section_title)
       VALUES (?, ?, ?, ?, ?)`,
      [fileId, contentType, content, pageNumber, sectionTitle],
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

/**
 * 获取文件解析内容
 * @param {string} fileId - 文件ID
 */
const getFileContents = async (fileId) => {
  return new Promise((resolve, reject) => {
    const { db } = require('../db/init.cjs');

    db.all(
      'SELECT * FROM file_contents WHERE file_id = ? ORDER BY created_at ASC',
      [fileId],
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
 * 获取文件统计信息
 * @param {number} userId - 用户ID
 */
const getFileStats = async (userId) => {
  return new Promise((resolve, reject) => {
    const { db } = require('../db/init.cjs');

    const queries = [
      // 总文件数
      'SELECT COUNT(*) as total FROM files WHERE user_id = ?',
      // 按类型统计
      'SELECT file_type, COUNT(*) as count FROM files WHERE user_id = ? GROUP BY file_type',
      // 按状态统计
      'SELECT status, COUNT(*) as count FROM files WHERE user_id = ? GROUP BY status',
      // 总大小
      'SELECT SUM(file_size) as total_size FROM files WHERE user_id = ?'
    ];

    Promise.all(queries.map(query =>
      new Promise((resolveQuery, rejectQuery) => {
        db.get(query, [userId], (err, row) => {
          if (err) rejectQuery(err);
          else resolveQuery(row);
        });
      })
    )).then(results => {
      resolve({
        total: results[0].total,
        byType: results[1],
        byStatus: results[2],
        totalSize: results[3].total_size || 0
      });
    }).catch(reject);
  });
};

module.exports = {
  upload,
  fileParser,
  saveFileToDB,
  getUserFiles,
  getFileById,
  deleteFile,
  updateFileStatus,
  saveFileContent,
  getFileContents,
  getFileStats,
  uploadDir
};
