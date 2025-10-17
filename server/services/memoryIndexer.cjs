/**
 * 记忆索引器
 * 处理记忆的向量化、索引和搜索
 */

class MemoryIndexer {
  constructor() {
    this.vectorService = require('./vectorService.cjs');
    this.memoryVectors = new Map(); // 简化的内存存储
  }

  /**
   * 索引记忆
   * @param {Object} memory - 记忆对象
   */
  async indexMemory(memory) {
    try {
      // 生成向量嵌入
      const embedding = await this.vectorService.generateEmbedding(
        `${memory.title} ${memory.content}`
      );

      // 存储向量（这里简化处理，实际应该使用向量数据库）
      const vectorData = {
        memoryId: memory.id,
        userId: memory.userId,
        embedding: embedding,
        metadata: {
          memoryType: memory.memoryType,
          importanceScore: memory.importanceScore,
          createdAt: memory.createdAt,
          title: memory.title,
          content: memory.content
        }
      };

      // 保存到内存存储
      this.memoryVectors.set(memory.id, vectorData);

      return true;
    } catch (error) {
      console.error('记忆索引失败:', error);
      return false;
    }
  }

  /**
   * 向量搜索
   * @param {string} query - 搜索查询
   * @param {number} userId - 用户ID
   * @param {Object} options - 搜索选项
   */
  async vectorSearch(query, userId, options = {}) {
    const { limit = 10, minImportance = 0.0 } = options;

    try {
      // 生成查询向量
      const queryEmbedding = await this.vectorService.generateEmbedding(query);

      // 搜索相似向量
      const similarVectors = await this.searchSimilarVectors(
        queryEmbedding,
        userId,
        { limit: limit * 2, minImportance }
      );

      // 计算相似度分数
      const results = similarVectors.map(vector => ({
        ...vector,
        similarity: this.calculateSimilarity(queryEmbedding, vector.embedding)
      }));

      // 按相似度排序并返回前N个结果
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('向量搜索失败:', error);
      return [];
    }
  }

  /**
   * 搜索相似向量
   * @param {Array} queryEmbedding - 查询向量
   * @param {number} userId - 用户ID
   * @param {Object} options - 搜索选项
   */
  async searchSimilarVectors(queryEmbedding, userId, options) {
    const { limit = 10, minImportance = 0.0 } = options;
    const results = [];

    // 遍历所有记忆向量
    for (const [memoryId, vectorData] of this.memoryVectors) {
      // 检查用户ID和重要性
      if (vectorData.userId === userId &&
          vectorData.metadata.importanceScore >= minImportance) {

        const similarity = this.calculateSimilarity(queryEmbedding, vectorData.embedding);

        results.push({
          memoryId: vectorData.memoryId,
          userId: vectorData.userId,
          memoryType: vectorData.metadata.memoryType,
          title: vectorData.metadata.title,
          content: vectorData.metadata.content,
          importanceScore: vectorData.metadata.importanceScore,
          createdAt: vectorData.metadata.createdAt,
          similarity
        });
      }
    }

    // 按相似度排序并返回前N个结果
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * 计算向量相似度
   * @param {Array} vec1 - 向量1
   * @param {Array} vec2 - 向量2
   */
  calculateSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * 删除记忆索引
   * @param {string} memoryId - 记忆ID
   */
  deleteMemoryIndex(memoryId) {
    this.memoryVectors.delete(memoryId);
  }

  /**
   * 更新记忆索引
   * @param {Object} memory - 记忆对象
   */
  async updateMemoryIndex(memory) {
    // 先删除旧索引
    this.deleteMemoryIndex(memory.id);

    // 重新索引
    return await this.indexMemory(memory);
  }

  /**
   * 批量索引记忆
   * @param {Array} memories - 记忆数组
   */
  async batchIndexMemories(memories) {
    const results = [];

    for (const memory of memories) {
      try {
        const success = await this.indexMemory(memory);
        results.push({ memoryId: memory.id, success });
      } catch (error) {
        console.error(`批量索引记忆失败 ${memory.id}:`, error);
        results.push({ memoryId: memory.id, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * 获取索引统计
   * @param {number} userId - 用户ID
   */
  getIndexStats(userId) {
    let totalMemories = 0;
    let userMemories = 0;
    const typeStats = {};

    for (const [memoryId, vectorData] of this.memoryVectors) {
      totalMemories++;

      if (vectorData.userId === userId) {
        userMemories++;

        const memoryType = vectorData.metadata.memoryType;
        typeStats[memoryType] = (typeStats[memoryType] || 0) + 1;
      }
    }

    return {
      totalMemories,
      userMemories,
      typeStats
    };
  }

  /**
   * 清理索引
   * @param {number} userId - 用户ID
   */
  cleanupIndex(userId) {
    const toDelete = [];

    for (const [memoryId, vectorData] of this.memoryVectors) {
      if (vectorData.userId === userId) {
        toDelete.push(memoryId);
      }
    }

    toDelete.forEach(memoryId => {
      this.memoryVectors.delete(memoryId);
    });

    return toDelete.length;
  }

  /**
   * 重建索引
   * @param {number} userId - 用户ID
   */
  async rebuildIndex(userId) {
    // 清理现有索引
    this.cleanupIndex(userId);

    // 从数据库重新加载记忆
    const MemoryManager = require('./memoryManager.cjs');
    const memoryManager = new MemoryManager();

    const memories = await memoryManager.getUserMemories(userId, { limit: 1000 });

    // 重新索引
    const results = await this.batchIndexMemories(memories);

    return {
      totalMemories: memories.length,
      indexedMemories: results.filter(r => r.success).length,
      failedMemories: results.filter(r => !r.success).length
    };
  }

  /**
   * 搜索相关记忆
   * @param {string} query - 搜索查询
   * @param {number} userId - 用户ID
   * @param {Object} options - 搜索选项
   */
  async searchRelatedMemories(query, userId, options = {}) {
    const {
      memoryType = 'all',
      limit = 5,
      minSimilarity = 0.3
    } = options;

    const results = await this.vectorSearch(query, userId, {
      limit: limit * 2,
      minImportance: 0.0
    });

    // 过滤类型和相似度
    const filteredResults = results
      .filter(result =>
        (memoryType === 'all' || result.memoryType === memoryType) &&
        result.similarity >= minSimilarity
      )
      .slice(0, limit);

    return filteredResults;
  }

  /**
   * 获取记忆推荐
   * @param {string} memoryId - 记忆ID
   * @param {number} userId - 用户ID
   * @param {Object} options - 推荐选项
   */
  async getMemoryRecommendations(memoryId, userId, options = {}) {
    const { limit = 5, minSimilarity = 0.2 } = options;

    const sourceMemory = this.memoryVectors.get(memoryId);
    if (!sourceMemory || sourceMemory.userId !== userId) {
      return [];
    }

    const results = [];

    for (const [id, vectorData] of this.memoryVectors) {
      if (id !== memoryId && vectorData.userId === userId) {
        const similarity = this.calculateSimilarity(
          sourceMemory.embedding,
          vectorData.embedding
        );

        if (similarity >= minSimilarity) {
          results.push({
            memoryId: vectorData.memoryId,
            memoryType: vectorData.metadata.memoryType,
            title: vectorData.metadata.title,
            content: vectorData.metadata.content,
            similarity
          });
        }
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}

module.exports = MemoryIndexer;
