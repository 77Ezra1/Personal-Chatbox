/**
 * 文件解析服务
 * 支持 PDF、Word、Excel、CSV、PowerPoint 等多种格式
 */

const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs').promises;
const path = require('path');

class FileParserService {
  constructor() {
    this.supportedTypes = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/csv': 'csv',
      'text/plain': 'txt',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
    };
  }

  /**
   * 解析 PDF 文件
   * @param {string} filePath - 文件路径
   */
  async parsePDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);

      return {
        type: 'pdf',
        text: data.text,
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata,
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('PDF 解析失败:', error);
      throw new Error('PDF 解析失败: ' + error.message);
    }
  }

  /**
   * 解析 Word 文档
   * @param {string} filePath - 文件路径
   */
  async parseWord(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });

      return {
        type: 'docx',
        text: result.value,
        messages: result.messages,
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Word 解析失败:', error);
      throw new Error('Word 解析失败: ' + error.message);
    }
  }

  /**
   * 解析 Excel 文件
   * @param {string} filePath - 文件路径
   */
  async parseExcel(filePath) {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheets = {};

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        sheets[sheetName] = {
          data: jsonData,
          range: worksheet['!ref']
        };
      });

      return {
        type: 'xlsx',
        sheets,
        sheetNames: workbook.SheetNames,
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Excel 解析失败:', error);
      throw new Error('Excel 解析失败: ' + error.message);
    }
  }

  /**
   * 解析 CSV 文件
   * @param {string} filePath - 文件路径
   */
  async parseCSV(filePath) {
    try {
      return new Promise((resolve, reject) => {
        const results = [];

        require('fs').createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => {
            resolve({
              type: 'csv',
              data: results,
              rows: results.length,
              columns: results.length > 0 ? Object.keys(results[0]) : [],
              extractedAt: new Date().toISOString()
            });
          })
          .on('error', (error) => {
            console.error('CSV 解析失败:', error);
            reject(new Error('CSV 解析失败: ' + error.message));
          });
      });
    } catch (error) {
      console.error('CSV 解析失败:', error);
      throw new Error('CSV 解析失败: ' + error.message);
    }
  }

  /**
   * 解析纯文本文件
   * @param {string} filePath - 文件路径
   */
  async parseText(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      return {
        type: 'txt',
        text: content,
        lines: content.split('\n').length,
        characters: content.length,
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('文本文件解析失败:', error);
      throw new Error('文本文件解析失败: ' + error.message);
    }
  }

  /**
   * 解析 PowerPoint 文件
   * @param {string} filePath - 文件路径
   */
  async parsePowerPoint(filePath) {
    try {
      // 注意：这里需要安装额外的库如 'pptx2json' 或 'node-pptx'
      // 目前返回基本信息，实际项目中需要安装相应的库
      const stats = await fs.stat(filePath);

      return {
        type: 'pptx',
        message: 'PowerPoint 解析功能需要额外安装库',
        fileSize: stats.size,
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('PowerPoint 解析失败:', error);
      throw new Error('PowerPoint 解析失败: ' + error.message);
    }
  }

  /**
   * 通用文件解析方法
   * @param {string} filePath - 文件路径
   * @param {string} fileType - 文件类型
   */
  async parseFile(filePath, fileType) {
    try {
      switch (fileType) {
        case 'pdf':
          return await this.parsePDF(filePath);
        case 'docx':
          return await this.parseWord(filePath);
        case 'xlsx':
          return await this.parseExcel(filePath);
        case 'csv':
          return await this.parseCSV(filePath);
        case 'txt':
          return await this.parseText(filePath);
        case 'pptx':
        case 'ppt':
          return await this.parsePowerPoint(filePath);
        default:
          throw new Error(`不支持的文件类型: ${fileType}`);
      }
    } catch (error) {
      console.error('文件解析失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件信息
   * @param {string} filePath - 文件路径
   */
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();

      return {
        size: stats.size,
        extension: ext,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile()
      };
    } catch (error) {
      console.error('获取文件信息失败:', error);
      return null;
    }
  }

  /**
   * 验证文件类型
   * @param {string} mimeType - MIME 类型
   */
  isValidFileType(mimeType) {
    return this.supportedTypes.hasOwnProperty(mimeType);
  }

  /**
   * 获取文件类型
   * @param {string} mimeType - MIME 类型
   */
  getFileType(mimeType) {
    return this.supportedTypes[mimeType] || 'unknown';
  }

  /**
   * 获取支持的文件类型列表
   */
  getSupportedTypes() {
    return Object.keys(this.supportedTypes).map(mimeType => ({
      mimeType,
      type: this.supportedTypes[mimeType],
      extensions: this.getExtensionsForMimeType(mimeType)
    }));
  }

  /**
   * 根据 MIME 类型获取文件扩展名
   * @param {string} mimeType - MIME 类型
   */
  getExtensionsForMimeType(mimeType) {
    const extensions = {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    };

    return extensions[mimeType] || [];
  }

  /**
   * 生成文件摘要
   * @param {Object} parseResult - 解析结果
   */
  generateSummary(parseResult) {
    try {
      const { type, text, pages, rows, columns } = parseResult;

      let summary = {
        type,
        extractedAt: parseResult.extractedAt
      };

      switch (type) {
        case 'pdf':
          summary.pages = pages;
          summary.textLength = text ? text.length : 0;
          summary.preview = text ? text.substring(0, 200) + '...' : '';
          break;
        case 'docx':
        case 'txt':
          summary.textLength = text ? text.length : 0;
          summary.preview = text ? text.substring(0, 200) + '...' : '';
          break;
        case 'xlsx':
          summary.sheets = Object.keys(parseResult.sheets || {}).length;
          summary.sheetNames = parseResult.sheetNames || [];
          break;
        case 'csv':
          summary.rows = rows || 0;
          summary.columns = columns || [];
          summary.preview = parseResult.data ? JSON.stringify(parseResult.data.slice(0, 3)) : '';
          break;
      }

      return summary;
    } catch (error) {
      console.error('生成文件摘要失败:', error);
      return { type: parseResult.type, error: '摘要生成失败' };
    }
  }
}

module.exports = FileParserService;
