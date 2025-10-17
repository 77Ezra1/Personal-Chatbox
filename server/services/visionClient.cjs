/**
 * 视觉模型客户端
 * 支持 GPT-4V、Claude 3 等视觉模型
 */

const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

class VisionClient {
  constructor() {
    try {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || 'test-key'
      });
    } catch (error) {
      console.warn('[Vision Client] OpenAI initialization failed:', error.message);
      this.openai = null;
    }
  }

  /**
   * 将图片转换为 base64
   * @param {string} imagePath - 图片路径
   */
  async imageToBase64(imagePath) {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      return imageBuffer.toString('base64');
    } catch (error) {
      console.error('读取图片失败:', error);
      throw new Error('读取图片失败: ' + error.message);
    }
  }

  /**
   * 使用 GPT-4V 分析图片
   * @param {string} imagePath - 图片路径
   * @param {string} prompt - 分析提示词
   */
  async analyzeImageWithGPT4V(imagePath, prompt = '请详细描述这张图片的内容') {
    try {
      const base64Image = await this.imageToBase64(imagePath);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return {
        model: 'gpt-4-vision-preview',
        analysis: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('GPT-4V 分析失败:', error);
      throw new Error('图片分析失败: ' + error.message);
    }
  }

  /**
   * 使用 GPT-4V 提取图片中的文字 (OCR)
   * @param {string} imagePath - 图片路径
   */
  async extractTextWithGPT4V(imagePath) {
    try {
      const base64Image = await this.imageToBase64(imagePath);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请提取图片中的所有文字内容，保持原有的格式和布局。如果图片中没有文字，请回复'未检测到文字内容'。"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      });

      return {
        model: 'gpt-4-vision-preview',
        type: 'ocr',
        text: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('OCR 提取失败:', error);
      throw new Error('文字提取失败: ' + error.message);
    }
  }

  /**
   * 分析图表数据
   * @param {string} imagePath - 图片路径
   */
  async analyzeChart(imagePath) {
    try {
      const base64Image = await this.imageToBase64(imagePath);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请分析这张图表，包括：1. 图表类型 2. 主要数据趋势 3. 关键数值 4. 结论和建议。请用结构化的方式回答。"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });

      return {
        model: 'gpt-4-vision-preview',
        type: 'chart',
        analysis: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('图表分析失败:', error);
      throw new Error('图表分析失败: ' + error.message);
    }
  }

  /**
   * 检测图片中的物体
   * @param {string} imagePath - 图片路径
   */
  async detectObjects(imagePath) {
    try {
      const base64Image = await this.imageToBase64(imagePath);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请识别图片中的所有物体，包括：1. 主要物体 2. 背景元素 3. 颜色和材质 4. 位置关系。请用列表形式回答。"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      });

      return {
        model: 'gpt-4-vision-preview',
        type: 'object-detection',
        objects: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('物体检测失败:', error);
      throw new Error('物体检测失败: ' + error.message);
    }
  }

  /**
   * 通用图片分析
   * @param {string} imagePath - 图片路径
   * @param {string} analysisType - 分析类型
   * @param {string} customPrompt - 自定义提示词
   */
  async analyzeImage(imagePath, analysisType = 'general', customPrompt = null) {
    const prompts = {
      general: '请详细描述这张图片的内容，包括主要元素、场景、颜色、氛围等。',
      detailed: '请非常详细地描述这张图片，包括所有可见的细节、物体、人物、环境、光线、构图等。',
      creative: '请用富有想象力的方式描述这张图片，可以包含情感、故事、隐喻等元素。',
      technical: '请从技术角度分析这张图片，包括构图、光线、色彩、焦点、景深等摄影技术要素。'
    };

    const prompt = customPrompt || prompts[analysisType] || prompts.general;

    try {
      const base64Image = await this.imageToBase64(imagePath);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      return {
        model: 'gpt-4-vision-preview',
        type: analysisType,
        analysis: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('图片分析失败:', error);
      throw new Error('图片分析失败: ' + error.message);
    }
  }
}

module.exports = VisionClient;
