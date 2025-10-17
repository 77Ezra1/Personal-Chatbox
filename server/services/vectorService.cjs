/**
 * 向量化服务
 * 处理文本向量化、相似度计算和向量检索
 */

const OpenAI = require('openai');

class VectorService {
  constructor() {
    try {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || 'test-key'
      });
    } catch (error) {
      console.warn('[Vector Service] OpenAI initialization failed:', error.message);
      this.openai = null;
    }
  }

  /**
   * 生成文本嵌入向量
   * @param {string} text - 要向量化的文本
   * @param {string} model - 嵌入模型
   */
  async generateEmbedding(text, model = 'text-embedding-3-small') {
    try {
      // 清理和预处理文本
      const cleanedText = this.preprocessText(text);

      if (cleanedText.length === 0) {
        throw new Error('文本内容为空');
      }

      const response = await this.openai.embeddings.create({
        model: model,
        input: cleanedText
      });

      return {
        embedding: response.data[0].embedding,
        model: model,
        usage: response.usage
      };
    } catch (error) {
      console.error('生成嵌入失败:', error);
      throw new Error('生成嵌入失败: ' + error.message);
    }
  }

  /**
   * 批量生成嵌入向量
   * @param {Array<string>} texts - 文本数组
   * @param {string} model - 嵌入模型
   */
  async generateBatchEmbeddings(texts, model = 'text-embedding-3-small') {
    try {
      if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error('文本数组不能为空');
      }

      // 预处理所有文本
      const cleanedTexts = texts.map(text => this.preprocessText(text));

      // 过滤空文本
      const validTexts = cleanedTexts.filter(text => text.length > 0);

      if (validTexts.length === 0) {
        throw new Error('没有有效的文本内容');
      }

      const response = await this.openai.embeddings.create({
        model: model,
        input: validTexts
      });

      return {
        embeddings: response.data.map(item => item.embedding),
        model: model,
        usage: response.usage,
        count: validTexts.length
      };
    } catch (error) {
      console.error('批量生成嵌入失败:', error);
      throw new Error('批量生成嵌入失败: ' + error.message);
    }
  }

  /**
   * 计算余弦相似度
   * @param {Array<number>} vectorA - 向量A
   * @param {Array<number>} vectorB - 向量B
   */
  cosineSimilarity(vectorA, vectorB) {
    if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
      throw new Error('向量必须是数组');
    }

    if (vectorA.length !== vectorB.length) {
      throw new Error('向量维度必须相同');
    }

    // 计算点积
    let dotProduct = 0;
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
    }

    // 计算向量的模长
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * 计算欧几里得距离
   * @param {Array<number>} vectorA - 向量A
   * @param {Array<number>} vectorB - 向量B
   */
  euclideanDistance(vectorA, vectorB) {
    if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
      throw new Error('向量必须是数组');
    }

    if (vectorA.length !== vectorB.length) {
      throw new Error('向量维度必须相同');
    }

    let sum = 0;
    for (let i = 0; i < vectorA.length; i++) {
      const diff = vectorA[i] - vectorB[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * 计算曼哈顿距离
   * @param {Array<number>} vectorA - 向量A
   * @param {Array<number>} vectorB - 向量B
   */
  manhattanDistance(vectorA, vectorB) {
    if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
      throw new Error('向量必须是数组');
    }

    if (vectorA.length !== vectorB.length) {
      throw new Error('向量维度必须相同');
    }

    let sum = 0;
    for (let i = 0; i < vectorA.length; i++) {
      sum += Math.abs(vectorA[i] - vectorB[i]);
    }

    return sum;
  }

  /**
   * 向量归一化
   * @param {Array<number>} vector - 要归一化的向量
   */
  normalizeVector(vector) {
    if (!Array.isArray(vector)) {
      throw new Error('向量必须是数组');
    }

    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));

    if (magnitude === 0) {
      return vector;
    }

    return vector.map(val => val / magnitude);
  }

  /**
   * 文本预处理
   * @param {string} text - 原始文本
   */
  preprocessText(text) {
    if (typeof text !== 'string') {
      return '';
    }

    return text
      .trim() // 去除首尾空白
      .replace(/\s+/g, ' ') // 合并多个空白字符
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // 保留字母、数字、中文和空白
      .trim();
  }

  /**
   * 文本分块
   * @param {string} text - 要分块的文本
   * @param {number} chunkSize - 块大小
   * @param {number} overlap - 重叠大小
   */
  chunkText(text, chunkSize = 1000, overlap = 200) {
    if (typeof text !== 'string' || text.length === 0) {
      return [];
    }

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.substring(start, end);

      // 尝试在句号、问号、感叹号处分割
      if (end < text.length) {
        const lastSentenceEnd = Math.max(
          chunk.lastIndexOf('。'),
          chunk.lastIndexOf('？'),
          chunk.lastIndexOf('！'),
          chunk.lastIndexOf('.'),
          chunk.lastIndexOf('?'),
          chunk.lastIndexOf('!')
        );

        if (lastSentenceEnd > chunkSize * 0.5) {
          chunk = chunk.substring(0, lastSentenceEnd + 1);
        }
      }

      chunks.push({
        content: chunk.trim(),
        start: start,
        end: start + chunk.length,
        length: chunk.length
      });

      start = start + chunk.length - overlap;
    }

    return chunks.filter(chunk => chunk.content.length > 0);
  }

  /**
   * 向量搜索
   * @param {Array<number>} queryVector - 查询向量
   * @param {Array<Object>} candidateVectors - 候选向量数组
   * @param {number} topK - 返回前K个结果
   * @param {string} metric - 相似度度量方法
   */
  searchSimilarVectors(queryVector, candidateVectors, topK = 5, metric = 'cosine') {
    if (!Array.isArray(queryVector) || !Array.isArray(candidateVectors)) {
      throw new Error('查询向量和候选向量必须是数组');
    }

    const similarities = candidateVectors.map((candidate, index) => {
      let score;

      switch (metric) {
        case 'cosine':
          score = this.cosineSimilarity(queryVector, candidate.embedding);
          break;
        case 'euclidean':
          score = 1 / (1 + this.euclideanDistance(queryVector, candidate.embedding));
          break;
        case 'manhattan':
          score = 1 / (1 + this.manhattanDistance(queryVector, candidate.embedding));
          break;
        default:
          score = this.cosineSimilarity(queryVector, candidate.embedding);
      }

      return {
        ...candidate,
        similarity: score,
        index: index
      };
    });

    // 按相似度排序并返回前topK个结果
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * 获取支持的嵌入模型
   */
  getSupportedModels() {
    return [
      {
        id: 'text-embedding-3-small',
        name: 'Text Embedding 3 Small',
        dimensions: 1536,
        description: '更快、更便宜的嵌入模型'
      },
      {
        id: 'text-embedding-3-large',
        name: 'Text Embedding 3 Large',
        dimensions: 3072,
        description: '更高质量的嵌入模型'
      },
      {
        id: 'text-embedding-ada-002',
        name: 'Text Embedding Ada 002',
        dimensions: 1536,
        description: '经典嵌入模型'
      }
    ];
  }

  /**
   * 验证向量格式
   * @param {Array<number>} vector - 要验证的向量
   * @param {number} expectedDimensions - 期望的维度
   */
  validateVector(vector, expectedDimensions = null) {
    if (!Array.isArray(vector)) {
      return { valid: false, error: '向量必须是数组' };
    }

    if (vector.length === 0) {
      return { valid: false, error: '向量不能为空' };
    }

    if (expectedDimensions && vector.length !== expectedDimensions) {
      return {
        valid: false,
        error: `向量维度不匹配，期望 ${expectedDimensions}，实际 ${vector.length}`
      };
    }

    // 检查是否包含有效数字
    for (let i = 0; i < vector.length; i++) {
      if (typeof vector[i] !== 'number' || !isFinite(vector[i])) {
        return { valid: false, error: `向量第 ${i} 个元素不是有效数字` };
      }
    }

    return { valid: true };
  }
}

module.exports = VectorService;
