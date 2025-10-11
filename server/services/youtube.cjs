/**
 * YouTube字幕提取服务
 */

const BaseService = require('./base.cjs');
const logger = require('../utils/logger.cjs');
const { getSubtitles } = require('youtube-captions-scraper');

class YouTubeService extends BaseService {
  constructor(config) {
    super(config);
    
    // 定义工具
    this.tools = [
      {
        type: 'function',
        function: {
          name: 'get_youtube_transcript',
          description: '获取YouTube视频的字幕/转录文本',
          parameters: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'YouTube视频URL或视频ID'
              },
              lang: {
                type: 'string',
                description: '字幕语言代码,例如: zh, en, ja',
                default: 'zh'
              }
            },
            required: ['url']
          }
        }
      }
    ];
  }

  async execute(toolName, parameters) {
    logger.debug(`执行YouTube工具: ${toolName}`, parameters);
    
    try {
      const { url, lang = 'zh' } = parameters;
      
      // 验证参数
      this.validateParameters(parameters, ['url']);
      
      // 提取视频ID
      const videoId = this.extractVideoId(url);
      
      logger.info(`提取YouTube字幕: ${videoId}, 语言: ${lang}`);
      
      // 获取字幕
      const subtitles = await getSubtitles({
        videoID: videoId,
        lang: lang
      });
      
      if (!subtitles || subtitles.length === 0) {
        return {
          success: false,
          error: '未找到字幕',
          details: `该视频没有${lang}语言的字幕,请尝试其他语言(如en)`
        };
      }
      
      // 格式化字幕
      const transcript = this.formatTranscript(subtitles);
      
      const content = `**YouTube视频字幕**\n\n` +
                     `🎬 视频ID: ${videoId}\n` +
                     `🌐 语言: ${lang}\n` +
                     `📝 字数: ${transcript.length} 字符\n\n` +
                     `**字幕内容:**\n\n${transcript}`;
      
      return {
        success: true,
        content: content,
        metadata: {
          videoId: videoId,
          language: lang,
          charCount: transcript.length
        }
      };
      
    } catch (error) {
      logger.error('YouTube字幕提取失败:', error);
      
      if (error.message && error.message.includes('Could not find captions')) {
        return {
          success: false,
          error: '未找到字幕',
          details: '该视频可能没有字幕,或者不支持所请求的语言'
        };
      }
      
      return this.handleApiError(error, this.name);
    }
  }

  extractVideoId(input) {
    if (!input) {
      throw new Error('YouTube URL或ID不能为空');
    }
    
    // 尝试作为URL解析
    try {
      const url = new URL(input);
      
      // youtu.be格式
      if (url.hostname === 'youtu.be') {
        return url.pathname.slice(1);
      }
      
      // youtube.com格式
      if (url.hostname.includes('youtube.com')) {
        const videoId = url.searchParams.get('v');
        if (!videoId) {
          throw new Error(`无效的YouTube URL: ${input}`);
        }
        return videoId;
      }
    } catch (error) {
      // 不是URL,检查是否是直接的视频ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        return input;
      }
      
      throw new Error(`无法从输入中提取视频ID: ${input}`);
    }
    
    throw new Error(`无法识别的YouTube URL格式: ${input}`);
  }

  formatTranscript(subtitles) {
    return subtitles
      .map(line => line.text.trim())
      .filter(text => text.length > 0)
      .join(' ');
  }
}

module.exports = YouTubeService;

