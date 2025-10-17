/**
 * 知识库服务
 * 处理知识库管理、文档向量化和检索
 */

const VectorService = require('./vectorService.cjs');
const FileParserService = require('./fileParser.cjs');
const { v4: uuidv4 } = require('uuid');

class KnowledgeBaseService {
  constructor() {
    this.vectorService = new VectorService();
    this.fileParser = new FileParserService();
  }

  /**
   * 创建知识库
   * @param {number} userId - 用户ID
   * @param {string} name - 知识库名称
   * @param {string} description - 知识库描述
   * @param {Object} config - 配置选项
   */
  async createKnowledgeBase(userId, name, description = '', config = {}) {
    try {
      const id = uuidv4();
      const defaultConfig = {
        chunkSize: 1000,
        chunkOverlap: 200,
        embeddingModel: 'text-embedding-3-small',
        retrievalTopK: 5,
        similarityThreshold: 0.7,
        enableReranking: true,
        ...config
      };

      // 保存到数据库
      const { db } = require('../db/init.cjs');
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO knowledge_bases (id, user_id, name, description, config)
           VALUES (?, ?, ?, ?, ?)`,
          [id, userId, name, description, JSON.stringify(defaultConfig)],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      return {
        id,
        name,
        description,
        config: defaultConfig,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('创建知识库失败:', error);
      throw new Error('创建知识库失败: ' + error.message);
    }
  }

  /**
   * 获取用户的知识库列表
   * @param {number} userId - 用户ID
   */
  async getUserKnowledgeBases(userId) {
    try {
      const { db } = require('../db/init.cjs');

      return new Promise((resolve, reject) => {
        db.all(
          'SELECT * FROM knowledge_bases WHERE user_id = ? ORDER BY created_at DESC',
          [userId],
          (err, rows) => {
            if (err) {
              reject(err);
            } else {
              const knowledgeBases = rows.map(row => ({
                id: row.id,
                name: row.name,
                description: row.description,
                config: JSON.parse(row.config),
                createdAt: row.created_at,
                updatedAt: row.updated_at
              }));
              resolve(knowledgeBases);
            }
          }
        );
      });
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      throw new Error('获取知识库列表失败: ' + error.message);
    }
  }

  /**
   * 获取知识库详情
   * @param {string} knowledgeBaseId - 知识库ID
   * @param {number} userId - 用户ID
   */
  async getKnowledgeBase(knowledgeBaseId, userId) {
    try {
      const { db } = require('../db/init.cjs');

      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM knowledge_bases WHERE id = ? AND user_id = ?',
          [knowledgeBaseId, userId],
          (err, row) => {
            if (err) {
              reject(err);
            } else if (!row) {
              reject(new Error('知识库不存在或无权限'));
            } else {
              resolve({
                id: row.id,
                name: row.name,
                description: row.description,
                config: JSON.parse(row.config),
                createdAt: row.created_at,
                updatedAt: row.updated_at
              });
            }
          }
        );
      });
    } catch (error) {
      console.error('获取知识库详情失败:', error);
      throw new Error('获取知识库详情失败: ' + error.message);
    }
  }

  /**
   * 上传文档到知识库
   * @param {string} knowledgeBaseId - 知识库ID
   * @param {string} filePath - 文件路径
   * @param {string} filename - 文件名
   * @param {string} fileType - 文件类型
   * @param {Object} options - 选项
   */
  async uploadDocument(knowledgeBaseId, filePath, filename, fileType, options = {}) {
    try {
      const documentId = uuidv4();
      const { db } = require('../db/init.cjs');

      // 获取知识库配置
      const knowledgeBase = await this.getKnowledgeBase(knowledgeBaseId, options.userId);
      const config = knowledgeBase.config;

      // 解析文档
      const parseResult = await this.fileParser.parseFile(filePath, fileType);

      if (!parseResult.text || parseResult.text.trim().length === 0) {
        throw new Error('文档内容为空，无法处理');
      }

      // 更新文档状态为处理中
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO knowledge_documents (id, knowledge_base_id, filename, file_path, file_type, file_size, status, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [documentId, knowledgeBaseId, filename, filePath, 0, fileType, 'processing', JSON.stringify(parseResult)],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      try {
        // 分块处理
        const chunks = this.vectorService.chunkText(
          parseResult.text,
          config.chunkSize,
          config.chunkOverlap
        );

        if (chunks.length === 0) {
          throw new Error('文档分块后为空');
        }

        // 生成嵌入向量
        const chunkTexts = chunks.map(chunk => chunk.content);
        const embeddingResult = await this.vectorService.generateBatchEmbeddings(
          chunkTexts,
          config.embeddingModel
        );

        // 保存文档块和向量
        for (let i = 0; i < chunks.length; i++) {
          const chunkId = uuidv4();
          const chunk = chunks[i];
          const embedding = embeddingResult.embeddings[i];

          await new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO knowledge_chunks (id, document_id, chunk_index, content, embedding, metadata)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                chunkId,
                documentId,
                i,
                chunk.content,
                JSON.stringify(embedding),
                JSON.stringify({
                  ...chunk,
                  embeddingModel: config.embeddingModel
                })
              ],
              function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
              }
            );
          });
        }

        // 更新文档状态为完成
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE knowledge_documents SET status = ?, metadata = ? WHERE id = ?',
            [
              'completed',
              JSON.stringify({
                ...parseResult,
                chunksCount: chunks.length,
                embeddingModel: config.embeddingModel
              }),
              documentId
            ],
            function(err) {
              if (err) reject(err);
              else resolve(this.changes);
            }
          );
        });

        return {
          documentId,
          chunks: chunks.length,
          embeddingModel: config.embeddingModel,
          status: 'completed'
        };

      } catch (error) {
        // 更新文档状态为失败
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE knowledge_documents SET status = ?, metadata = ? WHERE id = ?',
            [
              'failed',
              JSON.stringify({ error: error.message }),
              documentId
            ],
            function(err) {
              if (err) reject(err);
              else resolve(this.changes);
            }
          );
        });

        throw error;
      }

    } catch (error) {
      console.error('上传文档失败:', error);
      throw new Error('上传文档失败: ' + error.message);
    }
  }

  /**
   * 向量搜索
   * @param {string} knowledgeBaseId - 知识库ID
   * @param {string} query - 查询文本
   * @param {Object} options - 搜索选项
   */
  async searchSimilarChunks(knowledgeBaseId, query, options = {}) {
    try {
      const {
        topK = 5,
        similarityThreshold = 0.7,
        userId = null
      } = options;

      // 生成查询向量
      const queryEmbedding = await this.vectorService.generateEmbedding(query);

      // 获取知识库中的所有块
      const { db } = require('../db/init.cjs');
      const chunks = await new Promise((resolve, reject) => {
        let sql = `
          SELECT kc.*, kd.filename, kd.file_type, kd.metadata as doc_metadata
          FROM knowledge_chunks kc
          JOIN knowledge_documents kd ON kc.document_id = kd.id
          WHERE kd.knowledge_base_id = ? AND kc.embedding IS NOT NULL
        `;

        const params = [knowledgeBaseId];

        if (userId) {
          sql += ' AND kd.user_id = ?';
          params.push(userId);
        }

        sql += ' ORDER BY kc.created_at DESC';

        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (chunks.length === 0) {
        return [];
      }

      // 计算相似度
      const similarities = chunks.map(chunk => {
        try {
          const embedding = JSON.parse(chunk.embedding);
          const similarity = this.vectorService.cosineSimilarity(
            queryEmbedding.embedding,
            embedding
          );

          return {
            ...chunk,
            similarity,
            docMetadata: JSON.parse(chunk.doc_metadata || '{}')
          };
        } catch (error) {
          console.error('计算相似度失败:', error);
          return {
            ...chunk,
            similarity: 0,
            docMetadata: {}
          };
        }
      });

      // 过滤和排序
      const filteredResults = similarities
        .filter(result => result.similarity >= similarityThreshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      return filteredResults.map(result => ({
        id: result.id,
        content: result.content,
        filename: result.filename,
        fileType: result.file_type,
        similarity: result.similarity,
        chunkIndex: result.chunk_index,
        metadata: JSON.parse(result.metadata || '{}'),
        docMetadata: result.docMetadata
      }));

    } catch (error) {
      console.error('向量搜索失败:', error);
      throw new Error('向量搜索失败: ' + error.message);
    }
  }

  /**
   * 知识库问答
   * @param {string} knowledgeBaseId - 知识库ID
   * @param {string} question - 问题
   * @param {Object} options - 选项
   */
  async queryKnowledgeBase(knowledgeBaseId, question, options = {}) {
    try {
      const {
        topK = 5,
        userId = null,
        includeCitations = true
      } = options;

      // 搜索相关文档
      const searchResults = await this.searchSimilarChunks(
        knowledgeBaseId,
        question,
        { topK, userId }
      );

      if (searchResults.length === 0) {
        return {
          question,
          answer: '抱歉，我在知识库中没有找到相关信息。',
          citations: [],
          confidence: 0
        };
      }

      // 构建上下文
      const context = searchResults
        .map(result => `文档: ${result.filename}\n内容: ${result.content}`)
        .join('\n\n');

      // 生成回答（这里可以集成 AI 服务）
      const answer = await this.generateAnswer(question, context, searchResults);

      // 保存查询记录
      const queryId = uuidv4();
      if (userId) {
        await this.saveQuery(knowledgeBaseId, userId, question, answer, queryId);
      }

      // 保存引用信息
      if (includeCitations) {
        await this.saveCitations(queryId, searchResults);
      }

      return {
        question,
        answer,
        citations: includeCitations ? searchResults : [],
        confidence: this.calculateConfidence(searchResults),
        queryId
      };

    } catch (error) {
      console.error('知识库问答失败:', error);
      throw new Error('知识库问答失败: ' + error.message);
    }
  }

  /**
   * 生成回答
   * @param {string} question - 问题
   * @param {string} context - 上下文
   * @param {Array} searchResults - 搜索结果
   */
  async generateAnswer(question, context, searchResults) {
    // 这里可以集成 OpenAI 或其他 AI 服务
    // 目前返回简单的基于上下文的回答

    const prompt = `基于以下上下文回答问题：

上下文：
${context}

问题：${question}

请基于上下文提供准确、有用的回答。如果上下文中没有相关信息，请说明。`;

    // 模拟 AI 回答生成
    return `基于知识库内容，我为您找到以下相关信息：

${searchResults.map((result, index) =>
  `${index + 1}. 来源：${result.filename}\n   内容：${result.content.substring(0, 200)}...`
).join('\n\n')}

这些信息应该能够回答您的问题。如果您需要更详细的信息，请告诉我。`;
  }

  /**
   * 计算回答置信度
   * @param {Array} searchResults - 搜索结果
   */
  calculateConfidence(searchResults) {
    if (searchResults.length === 0) return 0;

    const avgSimilarity = searchResults.reduce((sum, result) =>
      sum + result.similarity, 0) / searchResults.length;

    return Math.min(avgSimilarity, 1.0);
  }

  /**
   * 保存查询记录
   * @param {string} knowledgeBaseId - 知识库ID
   * @param {number} userId - 用户ID
   * @param {string} question - 问题
   * @param {string} answer - 回答
   * @param {string} queryId - 查询ID
   */
  async saveQuery(knowledgeBaseId, userId, question, answer, queryId) {
    try {
      const { db } = require('../db/init.cjs');

      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO knowledge_queries (id, knowledge_base_id, user_id, question, answer)
           VALUES (?, ?, ?, ?, ?)`,
          [queryId, knowledgeBaseId, userId, question, answer],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    } catch (error) {
      console.error('保存查询记录失败:', error);
    }
  }

  /**
   * 保存引用信息
   * @param {string} queryId - 查询ID
   * @param {Array} searchResults - 搜索结果
   */
  async saveCitations(queryId, searchResults) {
    try {
      const { db } = require('../db/init.cjs');

      for (const result of searchResults) {
        const citationId = uuidv4();
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO knowledge_citations (id, query_id, chunk_id, relevance_score, citation_text)
             VALUES (?, ?, ?, ?, ?)`,
            [
              citationId,
              queryId,
              result.id,
              result.similarity,
              result.content.substring(0, 200)
            ],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
      }
    } catch (error) {
      console.error('保存引用信息失败:', error);
    }
  }

  /**
   * 删除知识库
   * @param {string} knowledgeBaseId - 知识库ID
   * @param {number} userId - 用户ID
   */
  async deleteKnowledgeBase(knowledgeBaseId, userId) {
    try {
      const { db } = require('../db/init.cjs');

      // 验证权限
      await this.getKnowledgeBase(knowledgeBaseId, userId);

      // 删除知识库（级联删除相关数据）
      await new Promise((resolve, reject) => {
        db.run(
          'DELETE FROM knowledge_bases WHERE id = ?',
          [knowledgeBaseId],
          function(err) {
            if (err) reject(err);
            else resolve(this.changes);
          }
        );
      });

      return { success: true };
    } catch (error) {
      console.error('删除知识库失败:', error);
      throw new Error('删除知识库失败: ' + error.message);
    }
  }

  /**
   * 获取知识库统计信息
   * @param {string} knowledgeBaseId - 知识库ID
   * @param {number} userId - 用户ID
   */
  async getKnowledgeBaseStats(knowledgeBaseId, userId) {
    try {
      const { db } = require('../db/init.cjs');

      // 验证权限
      await this.getKnowledgeBase(knowledgeBaseId, userId);

      const stats = await new Promise((resolve, reject) => {
        const queries = [
          'SELECT COUNT(*) as documentCount FROM knowledge_documents WHERE knowledge_base_id = ?',
          'SELECT COUNT(*) as chunkCount FROM knowledge_chunks kc JOIN knowledge_documents kd ON kc.document_id = kd.id WHERE kd.knowledge_base_id = ?',
          'SELECT COUNT(*) as queryCount FROM knowledge_queries WHERE knowledge_base_id = ?',
          'SELECT AVG(file_size) as avgFileSize FROM knowledge_documents WHERE knowledge_base_id = ?'
        ];

        Promise.all(queries.map(query =>
          new Promise((resolveQuery, rejectQuery) => {
            db.get(query, [knowledgeBaseId], (err, row) => {
              if (err) rejectQuery(err);
              else resolveQuery(row);
            });
          })
        )).then(results => {
          resolve({
            documentCount: results[0].documentCount,
            chunkCount: results[1].chunkCount,
            queryCount: results[2].queryCount,
            avgFileSize: results[3].avgFileSize || 0
          });
        }).catch(reject);
      });

      return stats;
    } catch (error) {
      console.error('获取知识库统计失败:', error);
      throw new Error('获取知识库统计失败: ' + error.message);
    }
  }
}

module.exports = KnowledgeBaseService;
